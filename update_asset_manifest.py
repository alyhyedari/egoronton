#!/usr/bin/env python3
"""Maintainer utility, not a deployment build. Run after modifying assets/."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
assets = {
    path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
    for path in sorted((root / 'assets').rglob('*'))
    if path.is_file() and not any(part.startswith('.') for part in path.relative_to(root).parts)
}
version = hashlib.sha256(json.dumps(assets, sort_keys=True).encode()).hexdigest()[:16]
manifest = {'schema': 1, 'version': version, 'assets': assets}
(root / 'asset-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'{len(assets)} assets; content version {version}')
