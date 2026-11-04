#!/usr/bin/env python3
"""Regenerate the service worker's assets-only SHA-256 manifest (no network)."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def build_manifest():
    assets = {
        path.relative_to(ROOT).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted((ROOT / 'assets').rglob('*')) if path.is_file()
    }
    version = hashlib.sha256(json.dumps(assets, sort_keys=True, separators=(',', ':')).encode()).hexdigest()[:16]
    return {'schema': 1, 'version': version, 'assets': assets}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='verify without writing')
    args = parser.parse_args()
    target = ROOT / 'asset-manifest.json'
    expected = build_manifest()
    if args.check:
        if not target.exists() or json.loads(target.read_text()) != expected:
            parser.exit(1, 'Asset manifest is missing or outdated.\n')
        print(f"Verified {len(expected['assets'])} assets ({expected['version']}).")
    else:
        target.write_text(json.dumps(expected, indent=2) + '\n')
        print(f"Wrote {len(expected['assets'])} assets ({expected['version']}).")


if __name__ == '__main__':
    main()
