#!/usr/bin/env python3
"""
Compile the SolventRegistry PyTeal contract to TEAL bytecode.

Outputs:
  - solvent_registry_approval.teal (TEAL source)
  - solvent_registry_clear.teal (TEAL source)
  - solvent_registry_approval.teal.bin (compiled bytecode)
  - solvent_registry_clear.teal.bin (compiled bytecode)
  - solvent_registry_contract.json (ABI spec)
"""

import json
import base64
from pathlib import Path
from algosdk.v2client import algod
from algosdk import logic

# Import the contract
from solvent_registry import build

def main():
    print("Compiling SolventRegistry PyTeal contract...")
    
    # Compile to TEAL
    approval_teal, clear_teal, contract = build()
    
    # Write TEAL source files
    contracts_dir = Path(__file__).parent
    
    approval_path = contracts_dir / "solvent_registry_approval.teal"
    clear_path = contracts_dir / "solvent_registry_clear.teal"
    contract_path = contracts_dir / "solvent_registry_contract.json"
    
    with open(approval_path, "w") as f:
        f.write(approval_teal)
    print(f"✓ Wrote {approval_path}")
    
    with open(clear_path, "w") as f:
        f.write(clear_teal)
    print(f"✓ Wrote {clear_path}")
    
    with open(contract_path, "w") as f:
        json.dump(contract.dictify(), f, indent=2)
    print(f"✓ Wrote {contract_path}")
    
    # Compile to bytecode using algod (public testnet node)
    algod_url = "https://testnet-api.algonode.cloud"
    algod_token = ""
    client = algod.AlgodClient(algod_token, algod_url)
    
    try:
        approval_result = client.compile(approval_teal)
        clear_result = client.compile(clear_teal)
        
        # Write bytecode
        approval_bin_path = contracts_dir / "solvent_registry_approval.teal.bin"
        clear_bin_path = contracts_dir / "solvent_registry_clear.teal.bin"
        
        with open(approval_bin_path, "wb") as f:
            f.write(base64.b64decode(approval_result["result"]))
        print(f"✓ Wrote {approval_bin_path}")
        
        with open(clear_bin_path, "wb") as f:
            f.write(base64.b64decode(clear_result["result"]))
        print(f"✓ Wrote {clear_bin_path}")
        
        print("\n✅ Compilation complete!")
        print(f"   Approval program: {len(base64.b64decode(approval_result['result']))} bytes")
        print(f"   Clear program:    {len(base64.b64decode(clear_result['result']))} bytes")
        
    except Exception as e:
        print(f"\n⚠️  Could not compile to bytecode via algod: {e}")
        print("   TEAL source files were generated successfully.")
        print("   Bytecode will be compiled during deployment.")

if __name__ == "__main__":
    main()
