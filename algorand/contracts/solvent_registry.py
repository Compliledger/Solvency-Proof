#!/usr/bin/env python3
"""
algorand/contracts/solvent_registry.py

Algorand Solvent Registry — PyTeal Smart Contract
Phase 2 of SolvencyProof: Algorand integration

Architectural role:
  - Stores canonical solvency state produced by the SolvencyProof backend
  - Tracks per-entity epoch history in box storage
  - Enforces epoch uniqueness (no overwrite of an existing epoch)
  - Exposes health-status queries (is_healthy, get_health_status)
  - Does NOT recompute solvency — it is a pure state registry

Box storage layout:
  Latest state  →  "entity:{entity_id}:latest"
  Epoch record  →  "entity:{entity_id}:epoch:{epoch_id}"

Box value wire format (all big-endian, matches registry_client.ts encodeState):
  [uint16 len][entity_id bytes]
  [uint16 len][epoch_id bytes]
  [uint16 len][liability_root bytes]
  [uint16 len][reserve_root bytes]
  [uint16 len][reserve_snapshot_hash bytes]
  [uint16 len][proof_hash bytes]
  [uint64 reserves_total]
  [uint64 liquid_assets_total]
  [uint64 near_term_liabilities_total]
  [uint8  capital_backed   0|1]
  [uint8  liquidity_ready  0|1]
  [uint8  health_status    0–5]
  [uint64 timestamp]
  [uint64 valid_until]
  [uint8  insolvency_flag       0|1]
  [uint8  liquidity_stress_flag 0|1]

Health status enum:
  0 = UNKNOWN
  1 = HEALTHY
  2 = LIQUIDITY_STRESSED
  3 = UNDERCOLLATERALIZED
  4 = CRITICAL
  5 = EXPIRED
"""

from pyteal import *  # noqa: F401,F403

# ============================================================
# HEALTH STATUS CONSTANTS
# ============================================================

HEALTH_UNKNOWN = Int(0)
HEALTH_HEALTHY = Int(1)
HEALTH_LIQUIDITY_STRESSED = Int(2)
HEALTH_UNDERCOLLATERALIZED = Int(3)
HEALTH_CRITICAL = Int(4)
HEALTH_EXPIRED = Int(5)

# ============================================================
# BOX KEY HELPERS
# ============================================================


@Subroutine(TealType.bytes)
def make_latest_key(entity_id: Expr) -> Expr:
    """Returns the box key for the latest state of an entity."""
    return Concat(Bytes("entity:"), entity_id, Bytes(":latest"))


@Subroutine(TealType.bytes)
def make_epoch_key(entity_id: Expr, epoch_id: Expr) -> Expr:
    """Returns the box key for a specific epoch record."""
    return Concat(Bytes("entity:"), entity_id, Bytes(":epoch:"), epoch_id)


# ============================================================
# ENCODING HELPERS
# ============================================================


@Subroutine(TealType.bytes)
def encode_str(s: Expr) -> Expr:
    """Encodes a byte string with a 2-byte (uint16) big-endian length prefix."""
    # Itob(n) produces 8 bytes; Extract bytes 6..7 gives the 2 least-significant bytes
    return Concat(Extract(Itob(Len(s)), Int(6), Int(2)), s)


@Subroutine(TealType.bytes)
def pack_state(
    entity_id: Expr,
    epoch_id: Expr,
    liability_root: Expr,
    reserve_root: Expr,
    reserve_snapshot_hash: Expr,
    proof_hash: Expr,
    reserves_total: Expr,
    liquid_assets_total: Expr,
    near_term_liabilities_total: Expr,
    capital_backed_byte: Expr,
    liquidity_ready_byte: Expr,
    health_status_byte: Expr,
    timestamp: Expr,
    valid_until: Expr,
    insolvency_flag_byte: Expr,
    liquidity_stress_flag_byte: Expr,
) -> Expr:
    """Serialises all state fields into the deterministic binary wire format."""
    return Concat(
        encode_str(entity_id),
        encode_str(epoch_id),
        encode_str(liability_root),
        encode_str(reserve_root),
        encode_str(reserve_snapshot_hash),
        encode_str(proof_hash),
        Itob(reserves_total),
        Itob(liquid_assets_total),
        Itob(near_term_liabilities_total),
        capital_backed_byte,
        liquidity_ready_byte,
        health_status_byte,
        Itob(timestamp),
        Itob(valid_until),
        insolvency_flag_byte,
        liquidity_stress_flag_byte,
    )


# ============================================================
# DECODING HELPERS  (used by on-chain read methods)
# ============================================================


@Subroutine(TealType.uint64)
def decode_string_len(data: Expr, offset: Expr) -> Expr:
    """Reads the 2-byte uint16 length at position `offset` in `data`."""
    return Btoi(Extract(data, offset, Int(2)))


@Subroutine(TealType.uint64)
def skip_string(data: Expr, offset: Expr) -> Expr:
    """Returns the offset after skipping the length-prefixed string at `offset`."""
    return offset + Int(2) + decode_string_len(data, offset)


@Subroutine(TealType.uint64)
def decode_uint64_at(data: Expr, offset: Expr) -> Expr:
    """Reads a big-endian uint64 at position `offset`."""
    return Btoi(Extract(data, offset, Int(8)))


@Subroutine(TealType.uint64)
def decode_uint8_at(data: Expr, offset: Expr) -> Expr:
    """Reads a single byte (uint8) at position `offset`."""
    return Btoi(Extract(data, offset, Int(1)))


@Subroutine(TealType.uint64)
def compute_fixed_offset(data: Expr) -> Expr:
    """
    Returns the byte offset at which the fixed-size fields begin (after all 6
    variable-length strings have been skipped).
    """
    # Skip entity_id, epoch_id, liability_root, reserve_root,
    # reserve_snapshot_hash, proof_hash  (6 strings)
    off0 = Int(0)
    off1 = skip_string(data, off0)
    off2 = skip_string(data, off1)
    off3 = skip_string(data, off2)
    off4 = skip_string(data, off3)
    off5 = skip_string(data, off4)
    off6 = skip_string(data, off5)
    return off6


# ============================================================
# ABI ROUTER
# ============================================================

router = Router(
    name="SolventRegistry",
    bare_calls=BareCallActions(
        # Allow contract creation (no-op on-create)
        no_op=OnCompleteAction.create_only(Approve()),
        # Reject all other bare calls
        update_application=OnCompleteAction.always(Reject()),
        delete_application=OnCompleteAction.always(Reject()),
        opt_in=OnCompleteAction.always(Reject()),
        close_out=OnCompleteAction.always(Reject()),
    ),
)


# ============================================================
# METHOD: submit_epoch
# ============================================================


@router.method
def submit_epoch(
    entity_id: abi.String,
    epoch_id: abi.String,
    liability_root: abi.String,
    reserve_root: abi.String,
    reserve_snapshot_hash: abi.String,
    proof_hash: abi.String,
    reserves_total: abi.Uint64,
    liquid_assets_total: abi.Uint64,
    near_term_liabilities_total: abi.Uint64,
    capital_backed: abi.Bool,
    liquidity_ready: abi.Bool,
    health_status: abi.Uint8,
    timestamp: abi.Uint64,
    valid_until: abi.Uint64,
) -> Expr:
    """
    Stores a new epoch record for the given entity.

    Rules enforced on-chain:
      - Epoch uniqueness: if a box for (entity_id, epoch_id) already exists,
        the transaction is rejected.
      - Flag derivation:
          insolvency_flag       = NOT capital_backed
          liquidity_stress_flag = NOT liquidity_ready
    Both the epoch-specific box and the entity's latest-state box are written.
    """
    # Materialise raw values from ABI wrappers
    eid = entity_id.get()
    epid = epoch_id.get()
    cap_backed = capital_backed.get()
    liq_ready = liquidity_ready.get()
    hs = health_status.get()
    ts = timestamp.get()
    vu = valid_until.get()

    # Derive flags
    insolvency_byte = If(cap_backed, Bytes("\x00"), Bytes("\x01"))
    liquidity_stress_byte = If(liq_ready, Bytes("\x00"), Bytes("\x01"))
    cap_backed_byte = If(cap_backed, Bytes("\x01"), Bytes("\x00"))
    liq_ready_byte = If(liq_ready, Bytes("\x01"), Bytes("\x00"))
    hs_byte = Extract(Itob(hs), Int(7), Int(1))

    epoch_key = make_epoch_key(eid, epid)
    latest_key = make_latest_key(eid)

    # Serialise the full state record
    state_bytes = pack_state(
        eid,
        epid,
        liability_root.get(),
        reserve_root.get(),
        reserve_snapshot_hash.get(),
        proof_hash.get(),
        reserves_total.get(),
        liquid_assets_total.get(),
        near_term_liabilities_total.get(),
        cap_backed_byte,
        liq_ready_byte,
        hs_byte,
        ts,
        vu,
        insolvency_byte,
        liquidity_stress_byte,
    )

    # Check epoch uniqueness before writing
    existing_epoch = App.box_get(epoch_key)

    return Seq(
        existing_epoch,
        # Reject if this epoch has already been submitted
        Assert(Not(existing_epoch.hasValue())),
        # Persist epoch record
        App.box_put(epoch_key, state_bytes),
        # Update latest state (always overwrite with the new submission)
        App.box_put(latest_key, state_bytes),
    )


# ============================================================
# METHOD: get_latest_state
# ============================================================


@router.method
def get_latest_state(
    entity_id: abi.String,
    *,
    output: abi.String,
) -> Expr:
    """
    Returns the raw encoded latest-state bytes for the entity.

    The TypeScript client (registry_client.ts :: decodeState) decodes these bytes.
    Aborts if no state has been submitted for the entity.
    """
    key = make_latest_key(entity_id.get())
    maybe = App.box_get(key)
    return Seq(
        maybe,
        Assert(maybe.hasValue()),
        output.set(maybe.value()),
    )


# ============================================================
# METHOD: get_epoch_record
# ============================================================


@router.method
def get_epoch_record(
    entity_id: abi.String,
    epoch_id: abi.String,
    *,
    output: abi.String,
) -> Expr:
    """
    Returns the raw encoded bytes for a specific historical epoch record.

    Aborts if the epoch has not been submitted.
    """
    key = make_epoch_key(entity_id.get(), epoch_id.get())
    maybe = App.box_get(key)
    return Seq(
        maybe,
        Assert(maybe.hasValue()),
        output.set(maybe.value()),
    )


# ============================================================
# METHOD: is_healthy
# ============================================================


@router.method
def is_healthy(
    entity_id: abi.String,
    *,
    output: abi.Bool,
) -> Expr:
    """
    Returns true iff:
      - A latest state exists for the entity
      - health_status == HEALTHY (1)
      - Global.latest_timestamp <= valid_until  (epoch has not expired)
    """
    key = make_latest_key(entity_id.get())
    maybe = App.box_get(key)

    data = ScratchVar(TealType.bytes)
    fixed_off = ScratchVar(TealType.uint64)

    # Offsets of fixed fields relative to the start of the fixed block:
    #   reserves_total           +0  (8 bytes)
    #   liquid_assets_total      +8  (8 bytes)
    #   near_term_liabilities    +16 (8 bytes)
    #   capital_backed           +24 (1 byte)
    #   liquidity_ready          +25 (1 byte)
    #   health_status            +26 (1 byte)
    #   timestamp                +27 (8 bytes)
    #   valid_until              +35 (8 bytes)
    VALID_UNTIL_REL = Int(35)

    return Seq(
        maybe,
        If(maybe.hasValue())
        .Then(
            Seq(
                data.store(maybe.value()),
                fixed_off.store(compute_fixed_offset(data.load())),
                output.set(
                    And(
                        decode_uint8_at(data.load(), fixed_off.load() + Int(26))
                        == HEALTH_HEALTHY,
                        Global.latest_timestamp()
                        <= decode_uint64_at(
                            data.load(), fixed_off.load() + VALID_UNTIL_REL
                        ),
                    )
                ),
            )
        )
        .Else(
            output.set(Int(0))
        ),
    )


# ============================================================
# METHOD: get_health_status
# ============================================================


@router.method
def get_health_status(
    entity_id: abi.String,
    *,
    output: abi.Uint8,
) -> Expr:
    """
    Returns the numeric health_status for the entity's latest state.

    Returns EXPIRED (5) if the validity window has passed.
    Returns UNKNOWN (0) if no state has been submitted.
    """
    key = make_latest_key(entity_id.get())
    maybe = App.box_get(key)

    data = ScratchVar(TealType.bytes)
    fixed_off = ScratchVar(TealType.uint64)

    VALID_UNTIL_REL = Int(35)
    HEALTH_STATUS_REL = Int(26)

    return Seq(
        maybe,
        If(maybe.hasValue())
        .Then(
            Seq(
                data.store(maybe.value()),
                fixed_off.store(compute_fixed_offset(data.load())),
                If(
                    Global.latest_timestamp()
                    > decode_uint64_at(data.load(), fixed_off.load() + VALID_UNTIL_REL)
                )
                .Then(output.set(HEALTH_EXPIRED))
                .Else(
                    output.set(
                        decode_uint8_at(data.load(), fixed_off.load() + HEALTH_STATUS_REL)
                    )
                ),
            )
        )
        .Else(
            output.set(HEALTH_UNKNOWN)
        ),
    )


# ============================================================
# COMPILE TARGETS
# ============================================================


def build() -> tuple:
    """
    Compiles the router to approval + clear TEAL programs and returns the ABI spec.

    Returns:
        (approval_program: str, clear_program: str, contract: algosdk.abi.Contract)
    """
    approval_program, clear_program, contract = router.compile_program(
        version=8,
        optimize=OptimizeOptions(scratch_slots=True),
    )
    return approval_program, clear_program, contract


if __name__ == "__main__":
    import json

    approval, clear, contract = build()

    print("=" * 60)
    print("APPROVAL PROGRAM")
    print("=" * 60)
    print(approval)

    print("\n" + "=" * 60)
    print("CLEAR PROGRAM")
    print("=" * 60)
    print(clear)

    print("\n" + "=" * 60)
    print("ABI CONTRACT")
    print("=" * 60)
    print(json.dumps(contract.dictify(), indent=2))
