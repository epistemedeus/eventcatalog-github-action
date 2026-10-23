#!/usr/bin/env python3
"""Freeze a single maintainer projection without checking out the owner branch."""
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile

repository = Path(__file__).resolve().parents[2]
evidence = Path(__file__).resolve().parent
operation = Path('/home/ubuntu/root-sol-window100337/root4842-eventcatalog-upstream-packaging-20261023')
projection = operation / 'projection'
base = 'd721c06b0142c55cd23c461734c1423bf95cedb2'
received = '8d7414c04abccebf4a3d36dc94aad074b0b0c93d'
ref = 'refs/heads/codex/root4842-eventcatalog-compatibility-20261023'

def git(*args, **kwargs):
    return subprocess.check_output(['git', '-C', str(repository), *args], **kwargs)

assert git('rev-parse', 'HEAD').decode().strip() == received
assert not projection.exists(), 'Do not replace a previous projection silently'
assert subprocess.run(['git', 'show-ref', '--verify', '--quiet', ref], cwd=repository).returncode == 1
projection.mkdir()
with tarfile.open(fileobj=io.BytesIO(git('archive', base))) as archive:
    archive.extractall(projection, filter='data')
changed = git('diff', '--name-only', base, received).decode().splitlines()
changed = [p for p in changed if not p.startswith('qualification/')]
for name in changed:
    target = projection / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(git('show', f'{received}:{name}'))

relocations = {
    'qualification/root4410-a/check-dist.cjs': 'tests/action/review-outcomes.cjs',
    'qualification/root4590/check-dist.cjs': 'tests/action/source-acquisition.cjs',
    'qualification/root4410-a/dist-child.cjs': 'tests/action/fixtures/action-child.cjs',
}
for source, destination in relocations.items():
    text = git('show', f'{received}:{source}').decode()
    text = text.replace('ROOT4410_BUNDLE', 'ACTION_BUNDLE').replace('ROOT4590_BUNDLE', 'ACTION_BUNDLE')
    text = text.replace('ROOT4410_DIST_EVIDENCE', 'ACTION_EVIDENCE_DIRECTORY').replace('ROOT4590_EVIDENCE', 'ACTION_EVIDENCE_DIRECTORY')
    text = text.replace("path.join(__dirname, 'dist-child.cjs')", "path.join(__dirname, 'fixtures/action-child.cjs')")
    text = text.replace("path.join(repository, 'qualification/root4410-a/dist-child.cjs')", "path.join(__dirname, 'fixtures/action-child.cjs')")
    if source.endswith('dist-child.cjs'):
        text = text.replace("path.resolve(__dirname, '../..')", "path.resolve(__dirname, '../../..')")
        text = text.replace('root4410-a-dist-', 'eventcatalog-action-').replace('disabled by qualification', 'disabled by the action test harness')
    target = projection / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text)
    changed.append(destination)

readme = projection / 'tests/action/README.md'
readme.write_text('''# Shipped action regression tests

From the repository root, after the frozen-lockfile install, use Node 20:

```sh
pnpm exec vitest run --maxWorkers=1 --minWorkers=1 --no-file-parallelism
pnpm exec tsc --noEmit
pnpm build
node --test --test-concurrency=1 tests/action/review-outcomes.cjs tests/action/source-acquisition.cjs
```

The two Node suites exercise the committed `dist/index.js` through 18 provider,
license and score cases plus 40 source-acquisition cases. They use the existing
synthetic catalog in `tests/tasks/eventcatalog` and generate temporary extra
events and a service required by the locked EventCatalog SDK. No saved response
corpus or provider key is needed. Each child uses only synthetic action inputs,
loopback GitHub/license routes, an in-process provider capture and a socket guard.

`ACTION_BUNDLE` can select another built entrypoint. `ACTION_EVIDENCE_DIRECTORY`
optionally saves captures outside this test tree. Provider failures must fail
the action without a risk score; source failures must additionally make no
provider request for the failed file. The source timeout unit throws a real
`TimeoutError`; shipped source timeout cases use local HTTP 504, and network
cases close the local socket. These are offline contract tests, not installed
or live model-quality checks.
''')
changed.append(str(readme.relative_to(projection)))

(projection / 'node_modules').symlink_to(repository / 'node_modules', target_is_directory=True)
subprocess.check_call([
    '/tmp/root4410-a-runtime/node-v20.20.2-linux-x64/bin/node',
    '/home/ubuntu/.cache/node/corepack/v1/pnpm/10.33.4/bin/pnpm.cjs',
    'exec', 'prettier', '--config', '.prettierrc', '--write',
    *relocations.values(), 'tests/action/README.md',
], cwd=projection)

index = operation / 'projection.index'
env = os.environ.copy()
env.update(GIT_INDEX_FILE=str(index), GIT_AUTHOR_NAME='epistemedeus', GIT_AUTHOR_EMAIL='124947147+epistemedeus@users.noreply.github.com', GIT_COMMITTER_NAME='epistemedeus', GIT_COMMITTER_EMAIL='124947147+epistemedeus@users.noreply.github.com')
git('read-tree', base, env=env)
members = []
for name in sorted(changed):
    data = (projection / name).read_bytes()
    blob = git('hash-object', '-w', '--stdin', input=data).decode().strip()
    mode_line = git('ls-tree', base, '--', name).decode()
    mode = mode_line.split()[0] if mode_line else '100644'
    git('update-index', '--add', '--cacheinfo', f'{mode},{blob},{name}', env=env)
    members.append({'path': name, 'blob': blob, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
tree = git('write-tree', env=env).decode().strip()
head = git('commit-tree', tree, '-p', base, input=b'Fix schema review compatibility and fail incomplete reviews\n', env=env).decode().strip()
git('update-ref', ref, head, '0' * 40)
index.unlink()
(evidence / 'candidate.diff').write_bytes(git('diff', '--binary', base, head))
result = {'grouping': 'one causally coherent candidate', 'ordering': 'single commit directly on pinned upstream; no stack', 'base': base, 'received': received, 'head': head, 'tree': tree, 'ref': ref, 'projection_directory': str(projection), 'members': members, 'relocations': relocations, 'excluded': 'all historical qualification and internal orchestration metadata'}
(evidence / 'PROJECTIONS.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['members','relocations']}))
print('Changed paths:', len(members))
