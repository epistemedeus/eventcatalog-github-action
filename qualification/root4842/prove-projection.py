#!/usr/bin/env python3
"""Prove frozen projected bytes and the canonical-CWD build contract."""
import difflib
import hashlib
import json
from pathlib import Path
import subprocess
import sys

repo = Path(__file__).resolve().parents[2]
q = Path(__file__).resolve().parent
r = json.loads((q / 'PROJECTIONS.json').read_text())
projection = Path(r['projection_directory'])

def git(*args):
    return subprocess.check_output(['git', '-C', str(repo), *args])

def identity(path):
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

paths = git('ls-tree', '-r', '--name-only', r['head']).decode().splitlines()
assert not any(p.startswith('qualification/') for p in paths)
assert git('rev-list', '--count', r['base'] + '..' + r['head']).decode().strip() == '1'
inputs = []
for name in paths:
    b = (projection / name).read_bytes()
    assert b == git('show', r['head'] + ':' + name), ('projected tree changed', name)
    if name.startswith(('tests/', 'dist/')):
        continue
    assert b == (repo / name).read_bytes(), ('canonical build input differs', name)
    inputs.append({'path': name, 'blob': git('rev-parse', r['head'] + ':' + name).decode().strip(), **identity(projection / name)})
assert (projection / 'node_modules').resolve() == (repo / 'node_modules').resolve()
assert not git('diff', r['base'], r['head'], '--', 'package.json', 'pnpm-lock.yaml')
for name in git('ls-tree', '-r', '--name-only', r['received']).decode().splitlines():
    assert (repo / name).read_bytes() == git('show', r['received'] + ':' + name), ('original owner byte changed', name)
relocated = []
for source, destination in r['relocations'].items():
    a = git('show', r['received'] + ':' + source).decode().splitlines(True)
    b = (projection / destination).read_text().splitlines(True)
    relocated.extend(difflib.unified_diff(a, b, fromfile=source, tofile=destination))
    assert not any(v in ''.join(b).lower() for v in ['qualification', 'root4410', 'root4590', 'root4842'])
(q / 'RELOCATION.diff').write_text(''.join(relocated))
build = json.loads((projection / 'package.json').read_text())['scripts']['build']
proof = {
    'head': r['head'], 'tree': r['tree'], 'canonical_cwd': str(repo),
    'projection': str(projection), 'all_frozen_projected_files_equal': True,
    'all_original_received_files_unchanged': True,
    'all_non_test_non_dist_tracked_inputs_equal': True, 'members': inputs,
    'dependencies': {'same_real_directory': str((repo / 'node_modules').resolve()),
                     'package_lock_unchanged_from_base': True, 'build_script': build,
                     'runtime_and_lock_identity': json.loads((repo / 'qualification/root4590/identities.json').read_text())},
    'scope': 'Every projected tracked non-test/non-dist file, including source, package, lock, tsconfig, license and root config, is raw-equal to canonical. Dependencies and all their license inputs use the identical shared real node_modules directory. No install or dependency amendment.',
}
(q / 'PRODUCTION-INPUTS.json').write_text(json.dumps(proof, indent=2) + '\n')
print('Frozen tree and original owner bytes verified; canonical inputs equal:', len(inputs), 'tracked files.')
if '--dist' in sys.argv:
    output = Path('/home/ubuntu/root-sol-window100337/root4842-eventcatalog-upstream-packaging-20261023/dist')
    inventory = sorted(p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file())
    expected = sorted(p[len('dist/'):] for p in paths if p.startswith('dist/'))
    assert inventory == expected and len(expected) == 6
    rows = []
    for name in expected:
        original = repo / 'dist' / name
        built = output / name
        projected = projection / 'dist' / name
        assert original.read_bytes() == built.read_bytes() == projected.read_bytes(), ('raw dist mismatch', name)
        rows.append({'path': name, 'canonical': identity(original), 'rebuilt': identity(built), 'projected': identity(projected), 'raw_equal': True})
    (q / 'DIST-COMPARISON.json').write_text(json.dumps({'head': r['head'], 'tree': r['tree'], 'canonical_cwd': str(repo), 'fresh_external_output': str(output), 'full_inventory': True, 'normalization': False, 'raw_equal': True, 'members': rows}, indent=2) + '\n')
    print('All six generated files raw-equal to frozen projection; no normalization.')
