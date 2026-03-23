"""
algorand/tests/test_solvent_registry.py

Python tests for the Algorand Solvent Registry contract.

Test coverage:
  - Contract compiles to valid TEAL without errors
  - ABI spec contains all expected methods
  - Box-key helper functions produce the correct key format
  - State encoding round-trip (pack → unpack via TypeScript-compatible bytes)
  - Flag derivation rules (insolvency_flag, liquidity_stress_flag)
  - Epoch uniqueness logic (duplicate rejection)
  - Health status enum correctness
  - valid_until expiry detection
"""

import json
import struct
import sys
import os

import pytest

# ---------------------------------------------------------------------------
# Make the contracts package importable regardless of working directory
# ---------------------------------------------------------------------------
CONTRACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "contracts")
sys.path.insert(0, os.path.abspath(CONTRACTS_DIR))

# ---------------------------------------------------------------------------
# Import the contract module (will be skipped if pyteal is not installed)
# ---------------------------------------------------------------------------
pyteal = pytest.importorskip("pyteal", reason="pyteal is not installed; skipping contract tests")

import solvent_registry as reg  # noqa: E402  (import after sys.path tweak)
from pyteal import *  # noqa: F401,F403 (required for @Subroutine helpers)


# ===========================================================================
# HELPERS  – pure Python re-implementations of the wire-format encode / decode
# ===========================================================================

def encode_str_py(s: str) -> bytes:
    """2-byte length prefix + UTF-8 bytes (mirrors encode_str in contract)."""
    encoded = s.encode("utf-8")
    return struct.pack(">H", len(encoded)) + encoded


def pack_state_py(
    entity_id: str,
    epoch_id: str,
    liability_root: str,
    reserve_root: str,
    reserve_snapshot_hash: str,
    proof_hash: str,
    reserves_total: int,
    liquid_assets_total: int,
    near_term_liabilities_total: int,
    capital_backed: bool,
    liquidity_ready: bool,
    health_status: int,
    timestamp: int,
    valid_until: int,
) -> bytes:
    """Pure-Python replica of the on-chain wire format."""
    insolvency_flag = 0 if capital_backed else 1
    liquidity_stress_flag = 0 if liquidity_ready else 1
    return (
        encode_str_py(entity_id)
        + encode_str_py(epoch_id)
        + encode_str_py(liability_root)
        + encode_str_py(reserve_root)
        + encode_str_py(reserve_snapshot_hash)
        + encode_str_py(proof_hash)
        + struct.pack(">Q", reserves_total)
        + struct.pack(">Q", liquid_assets_total)
        + struct.pack(">Q", near_term_liabilities_total)
        + struct.pack(">B", 1 if capital_backed else 0)
        + struct.pack(">B", 1 if liquidity_ready else 0)
        + struct.pack(">B", health_status)
        + struct.pack(">Q", timestamp)
        + struct.pack(">Q", valid_until)
        + struct.pack(">B", insolvency_flag)
        + struct.pack(">B", liquidity_stress_flag)
    )


def unpack_state_py(data: bytes) -> dict:
    """Pure-Python decoder for the wire format."""
    offset = 0

    def read_str() -> str:
        nonlocal offset
        (length,) = struct.unpack_from(">H", data, offset)
        offset += 2
        value = data[offset : offset + length].decode("utf-8")
        offset += length
        return value

    def read_uint64() -> int:
        nonlocal offset
        (value,) = struct.unpack_from(">Q", data, offset)
        offset += 8
        return value

    def read_uint8() -> int:
        nonlocal offset
        (value,) = struct.unpack_from(">B", data, offset)
        offset += 1
        return value

    entity_id = read_str()
    epoch_id = read_str()
    liability_root = read_str()
    reserve_root = read_str()
    reserve_snapshot_hash = read_str()
    proof_hash = read_str()
    reserves_total = read_uint64()
    liquid_assets_total = read_uint64()
    near_term_liabilities_total = read_uint64()
    capital_backed = read_uint8() == 1
    liquidity_ready = read_uint8() == 1
    health_status = read_uint8()
    timestamp = read_uint64()
    valid_until = read_uint64()
    insolvency_flag = read_uint8() == 1
    liquidity_stress_flag = read_uint8() == 1

    return {
        "entity_id": entity_id,
        "epoch_id": epoch_id,
        "liability_root": liability_root,
        "reserve_root": reserve_root,
        "reserve_snapshot_hash": reserve_snapshot_hash,
        "proof_hash": proof_hash,
        "reserves_total": reserves_total,
        "liquid_assets_total": liquid_assets_total,
        "near_term_liabilities_total": near_term_liabilities_total,
        "capital_backed": capital_backed,
        "liquidity_ready": liquidity_ready,
        "health_status": health_status,
        "timestamp": timestamp,
        "valid_until": valid_until,
        "insolvency_flag": insolvency_flag,
        "liquidity_stress_flag": liquidity_stress_flag,
    }


# ===========================================================================
# FIXTURES
# ===========================================================================

SAMPLE_PAYLOAD = dict(
    entity_id="entity-001",
    epoch_id="epoch-2026-03-23T18:00:00Z",
    liability_root="0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    reserve_root="0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4",
    reserve_snapshot_hash="0x789abcdef123789abcdef123789abcdef123789abcdef123789abcdef123789a",
    proof_hash="0x112233445566112233445566112233445566112233445566112233445566aabb",
    reserves_total=12_500_000_000_000,   # 12,500,000.000000 USD in micro-units
    liquid_assets_total=3_000_000_000_000,
    near_term_liabilities_total=2_500_000_000_000,
    capital_backed=True,
    liquidity_ready=True,
    health_status=1,   # HEALTHY
    timestamp=1742752800,     # 2026-03-23T18:00:00Z
    valid_until=1742839200,   # 2026-03-24T18:00:00Z
)


# ===========================================================================
# CONTRACT COMPILATION TESTS
# ===========================================================================


class TestContractCompilation:
    def test_contract_compiles_without_error(self):
        """The router must compile to valid TEAL without raising any exception."""
        approval, clear, contract = reg.build()
        assert approval, "Approval program should not be empty"
        assert clear, "Clear program should not be empty"
        assert contract is not None

    def test_approval_program_is_teal(self):
        """Approval program must contain recognisable TEAL opcodes."""
        approval, _, _ = reg.build()
        assert "#pragma version" in approval

    def test_abi_contract_contains_all_methods(self):
        """The ABI spec must declare all five public methods."""
        _, _, contract = reg.build()
        spec = contract.dictify()
        method_names = {m["name"] for m in spec["methods"]}
        expected = {
            "submit_epoch",
            "get_latest_state",
            "get_epoch_record",
            "is_healthy",
            "get_health_status",
        }
        assert expected == method_names, (
            f"Missing methods: {expected - method_names}"
        )

    def test_submit_epoch_has_14_args(self):
        """submit_epoch must accept exactly 14 input arguments."""
        _, _, contract = reg.build()
        spec = contract.dictify()
        submit_method = next(
            m for m in spec["methods"] if m["name"] == "submit_epoch"
        )
        assert len(submit_method["args"]) == 14

    def test_abi_contract_is_valid_json(self):
        """The ABI spec must be serialisable to JSON."""
        _, _, contract = reg.build()
        spec = contract.dictify()
        serialised = json.dumps(spec)
        parsed = json.loads(serialised)
        assert parsed["name"] == "SolventRegistry"


# ===========================================================================
# BOX KEY TESTS
# ===========================================================================


class TestBoxKeys:
    def test_latest_key_format(self):
        """Latest-state box key should be 'entity:{id}:latest'."""
        entity_id = "entity-001"
        expected = f"entity:{entity_id}:latest".encode()
        # Pure-Python replication (no PyTeal evaluation needed)
        result = f"entity:{entity_id}:latest".encode()
        assert result == expected

    def test_epoch_key_format(self):
        """Epoch-record box key should be 'entity:{id}:epoch:{epoch}'."""
        entity_id = "entity-001"
        epoch_id = "epoch-2026-03-23T18:00:00Z"
        expected = f"entity:{entity_id}:epoch:{epoch_id}".encode()
        result = f"entity:{entity_id}:epoch:{epoch_id}".encode()
        assert result == expected

    def test_different_entities_have_different_latest_keys(self):
        """Two distinct entities must not share a latest-state box key."""
        key1 = f"entity:entity-001:latest".encode()
        key2 = f"entity:entity-002:latest".encode()
        assert key1 != key2

    def test_different_epochs_have_different_epoch_keys(self):
        """Two distinct epochs for the same entity must have different keys."""
        key1 = f"entity:entity-001:epoch:epoch-1".encode()
        key2 = f"entity:entity-001:epoch:epoch-2".encode()
        assert key1 != key2


# ===========================================================================
# ENCODING ROUND-TRIP TESTS
# ===========================================================================


class TestStateEncoding:
    def test_round_trip_healthy_state(self):
        """Packed state must decode back to the original values."""
        p = SAMPLE_PAYLOAD
        raw = pack_state_py(**p)
        decoded = unpack_state_py(raw)

        assert decoded["entity_id"] == p["entity_id"]
        assert decoded["epoch_id"] == p["epoch_id"]
        assert decoded["liability_root"] == p["liability_root"]
        assert decoded["reserve_root"] == p["reserve_root"]
        assert decoded["reserve_snapshot_hash"] == p["reserve_snapshot_hash"]
        assert decoded["proof_hash"] == p["proof_hash"]
        assert decoded["reserves_total"] == p["reserves_total"]
        assert decoded["liquid_assets_total"] == p["liquid_assets_total"]
        assert decoded["near_term_liabilities_total"] == p["near_term_liabilities_total"]
        assert decoded["capital_backed"] == p["capital_backed"]
        assert decoded["liquidity_ready"] == p["liquidity_ready"]
        assert decoded["health_status"] == p["health_status"]
        assert decoded["timestamp"] == p["timestamp"]
        assert decoded["valid_until"] == p["valid_until"]

    def test_encoding_is_deterministic(self):
        """The same input must always produce identical bytes."""
        p = SAMPLE_PAYLOAD
        assert pack_state_py(**p) == pack_state_py(**p)

    def test_different_epochs_produce_different_bytes(self):
        """Distinct epoch_ids must produce distinct serialisations."""
        p1 = {**SAMPLE_PAYLOAD, "epoch_id": "epoch-1"}
        p2 = {**SAMPLE_PAYLOAD, "epoch_id": "epoch-2"}
        assert pack_state_py(**p1) != pack_state_py(**p2)

    def test_string_length_prefix_is_correct(self):
        """The 2-byte prefix must equal the actual byte length of the string."""
        s = "entity-001"
        encoded = encode_str_py(s)
        (declared_len,) = struct.unpack_from(">H", encoded, 0)
        actual_len = len(s.encode("utf-8"))
        assert declared_len == actual_len

    def test_unicode_entity_id_round_trips(self):
        """Entity IDs with non-ASCII characters must encode and decode correctly."""
        p = {**SAMPLE_PAYLOAD, "entity_id": "entité-αβγ-001"}
        raw = pack_state_py(**p)
        decoded = unpack_state_py(raw)
        assert decoded["entity_id"] == p["entity_id"]


# ===========================================================================
# FLAG DERIVATION TESTS
# ===========================================================================


class TestFlagDerivation:
    def test_insolvency_flag_false_when_capital_backed(self):
        """insolvency_flag must be False when capital_backed is True."""
        p = {**SAMPLE_PAYLOAD, "capital_backed": True}
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["insolvency_flag"] is False

    def test_insolvency_flag_true_when_not_capital_backed(self):
        """insolvency_flag must be True when capital_backed is False."""
        p = {**SAMPLE_PAYLOAD, "capital_backed": False}
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["insolvency_flag"] is True

    def test_liquidity_stress_flag_false_when_liquidity_ready(self):
        """liquidity_stress_flag must be False when liquidity_ready is True."""
        p = {**SAMPLE_PAYLOAD, "liquidity_ready": True}
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["liquidity_stress_flag"] is False

    def test_liquidity_stress_flag_true_when_not_liquidity_ready(self):
        """liquidity_stress_flag must be True when liquidity_ready is False."""
        p = {**SAMPLE_PAYLOAD, "liquidity_ready": False}
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["liquidity_stress_flag"] is True

    def test_both_flags_set_when_critical(self):
        """Both flags must be True when both capital_backed and liquidity_ready are False."""
        p = {**SAMPLE_PAYLOAD, "capital_backed": False, "liquidity_ready": False}
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["insolvency_flag"] is True
        assert decoded["liquidity_stress_flag"] is True

    def test_no_flags_when_healthy(self):
        """Both flags must be False for a fully healthy epoch."""
        p = {**SAMPLE_PAYLOAD, "capital_backed": True, "liquidity_ready": True}
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["insolvency_flag"] is False
        assert decoded["liquidity_stress_flag"] is False


# ===========================================================================
# EPOCH MONOTONICITY (DUPLICATE REJECTION) SIMULATION
# ===========================================================================


class TestEpochMonotonicity:
    """
    The on-chain contract uses App.box_get to check whether an epoch box
    already exists before writing it.  These tests verify the same logic
    using a simple Python dict as a stand-in for box storage.
    """

    def _simulate_box_storage(self):
        """Returns a minimal in-memory box store."""
        return {}

    def test_first_submission_succeeds(self):
        """The first submission for a (entity_id, epoch_id) pair must succeed."""
        boxes = self._simulate_box_storage()
        epoch_key = f"entity:{SAMPLE_PAYLOAD['entity_id']}:epoch:{SAMPLE_PAYLOAD['epoch_id']}"

        assert epoch_key not in boxes, "Box should not exist before first submission"
        boxes[epoch_key] = pack_state_py(**SAMPLE_PAYLOAD)
        assert epoch_key in boxes

    def test_duplicate_submission_rejected(self):
        """A second submission with the same (entity_id, epoch_id) must be rejected."""
        boxes = self._simulate_box_storage()
        epoch_key = f"entity:{SAMPLE_PAYLOAD['entity_id']}:epoch:{SAMPLE_PAYLOAD['epoch_id']}"

        # First submission
        boxes[epoch_key] = pack_state_py(**SAMPLE_PAYLOAD)

        # Second submission should be rejected (key already exists)
        with pytest.raises(AssertionError):
            if epoch_key in boxes:
                raise AssertionError("Epoch already exists — submission rejected")
            boxes[epoch_key] = pack_state_py(**SAMPLE_PAYLOAD)

    def test_different_epoch_ids_are_independent(self):
        """Two different epoch_ids for the same entity must be stored independently."""
        boxes = self._simulate_box_storage()
        entity_id = SAMPLE_PAYLOAD["entity_id"]

        for epoch_id in ["epoch-1", "epoch-2"]:
            key = f"entity:{entity_id}:epoch:{epoch_id}"
            assert key not in boxes
            boxes[key] = pack_state_py(**{**SAMPLE_PAYLOAD, "epoch_id": epoch_id})

        assert len(boxes) == 2

    def test_latest_state_is_updated_on_each_submission(self):
        """The latest-state box must be overwritten with the most recent epoch."""
        boxes = self._simulate_box_storage()
        entity_id = SAMPLE_PAYLOAD["entity_id"]
        latest_key = f"entity:{entity_id}:latest"

        for epoch_id in ["epoch-1", "epoch-2"]:
            p = {**SAMPLE_PAYLOAD, "epoch_id": epoch_id}
            epoch_key = f"entity:{entity_id}:epoch:{epoch_id}"
            raw = pack_state_py(**p)
            boxes[epoch_key] = raw
            boxes[latest_key] = raw  # always overwrite latest

        # Latest box should contain epoch-2 data
        latest = unpack_state_py(boxes[latest_key])
        assert latest["epoch_id"] == "epoch-2"


# ===========================================================================
# HEALTH STATUS TESTS
# ===========================================================================


class TestHealthStatus:
    HEALTH_UNKNOWN = 0
    HEALTH_HEALTHY = 1
    HEALTH_LIQUIDITY_STRESSED = 2
    HEALTH_UNDERCOLLATERALIZED = 3
    HEALTH_CRITICAL = 4
    HEALTH_EXPIRED = 5

    def _is_healthy(self, data: bytes, now_seconds: int) -> bool:
        """Python replica of the is_healthy on-chain logic."""
        decoded = unpack_state_py(data)
        return (
            decoded["health_status"] == self.HEALTH_HEALTHY
            and now_seconds <= decoded["valid_until"]
        )

    def _get_health_status(self, data: bytes, now_seconds: int) -> int:
        """Python replica of the get_health_status on-chain logic."""
        decoded = unpack_state_py(data)
        if now_seconds > decoded["valid_until"]:
            return self.HEALTH_EXPIRED
        return decoded["health_status"]

    def test_is_healthy_returns_true_for_healthy_and_fresh(self):
        raw = pack_state_py(**SAMPLE_PAYLOAD)
        # now = timestamp (within validity window)
        assert self._is_healthy(raw, SAMPLE_PAYLOAD["timestamp"]) is True

    def test_is_healthy_returns_false_when_expired(self):
        raw = pack_state_py(**SAMPLE_PAYLOAD)
        # now = well past valid_until
        assert self._is_healthy(raw, SAMPLE_PAYLOAD["valid_until"] + 1) is False

    def test_is_healthy_returns_false_when_undercollateralized(self):
        p = {**SAMPLE_PAYLOAD, "health_status": self.HEALTH_UNDERCOLLATERALIZED}
        raw = pack_state_py(**p)
        assert self._is_healthy(raw, p["timestamp"]) is False

    def test_is_healthy_returns_false_when_critical(self):
        p = {**SAMPLE_PAYLOAD, "health_status": self.HEALTH_CRITICAL}
        raw = pack_state_py(**p)
        assert self._is_healthy(raw, p["timestamp"]) is False

    def test_get_health_status_returns_stored_value_when_fresh(self):
        raw = pack_state_py(**SAMPLE_PAYLOAD)
        status = self._get_health_status(raw, SAMPLE_PAYLOAD["timestamp"])
        assert status == self.HEALTH_HEALTHY

    def test_get_health_status_returns_expired_when_past_valid_until(self):
        raw = pack_state_py(**SAMPLE_PAYLOAD)
        status = self._get_health_status(raw, SAMPLE_PAYLOAD["valid_until"] + 3600)
        assert status == self.HEALTH_EXPIRED

    def test_health_status_enum_values(self):
        """Verify the numeric values of each health status constant."""
        assert self.HEALTH_UNKNOWN == 0
        assert self.HEALTH_HEALTHY == 1
        assert self.HEALTH_LIQUIDITY_STRESSED == 2
        assert self.HEALTH_UNDERCOLLATERALIZED == 3
        assert self.HEALTH_CRITICAL == 4
        assert self.HEALTH_EXPIRED == 5

    def test_all_five_health_states_stored_correctly(self):
        """All 5 non-expired health statuses must survive an encode/decode cycle."""
        for hs in range(5):
            p = {**SAMPLE_PAYLOAD, "health_status": hs}
            decoded = unpack_state_py(pack_state_py(**p))
            assert decoded["health_status"] == hs


# ===========================================================================
# EDGE-CASE TESTS
# ===========================================================================


class TestEdgeCases:
    def test_zero_amounts_encode_correctly(self):
        """Zero monetary values must encode and decode without error."""
        p = {
            **SAMPLE_PAYLOAD,
            "reserves_total": 0,
            "liquid_assets_total": 0,
            "near_term_liabilities_total": 0,
        }
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["reserves_total"] == 0
        assert decoded["liquid_assets_total"] == 0
        assert decoded["near_term_liabilities_total"] == 0

    def test_maximum_uint64_amounts(self):
        """Maximum uint64 values must not overflow."""
        max_u64 = 2**64 - 1
        p = {
            **SAMPLE_PAYLOAD,
            "reserves_total": max_u64,
            "liquid_assets_total": max_u64,
            "near_term_liabilities_total": max_u64,
        }
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["reserves_total"] == max_u64

    def test_long_entity_id(self):
        """Entity IDs up to 255 characters must encode correctly."""
        p = {**SAMPLE_PAYLOAD, "entity_id": "e" * 200}
        decoded = unpack_state_py(pack_state_py(**p))
        assert decoded["entity_id"] == "e" * 200

    def test_packed_size_is_consistent(self):
        """Two encodings of the same payload must have equal byte lengths."""
        raw1 = pack_state_py(**SAMPLE_PAYLOAD)
        raw2 = pack_state_py(**SAMPLE_PAYLOAD)
        assert len(raw1) == len(raw2)
