#!/usr/bin/env python3
"""Replay the owning source or shipped regressions against the preserved predecessor."""
import io
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile

repository = Path(__file__).resolve().parents[2]
predecessor = '92681dee312e9d9b259ef7da5dcc1c2e54b34185'
kind = sys.argv[1]
with tempfile.TemporaryDirectory(prefix='root4590-predecessor-') as directory:
    baseline = Path(directory)
    archive = subprocess.check_output(['git', 'archive', predecessor], cwd=repository)
    with tarfile.open(fileobj=io.BytesIO(archive)) as source:
        source.extractall(baseline, filter='data')
    environment = dict(os.environ)
    if kind == 'source':
        for file in ['tests/tasks/schema-review/source-acquisition.spec.ts', 'tests/lib/github.spec.ts']:
            shutil.copyfile(repository / file, baseline / file)
        (baseline / 'node_modules').symlink_to(repository / 'node_modules', target_is_directory=True)
        command = ['pnpm', 'exec', 'vitest', 'run', 'tests/tasks/schema-review/source-acquisition.spec.ts', 'tests/lib/github.spec.ts', '--maxWorkers=1', '--minWorkers=1', '--no-file-parallelism', '--reporter=json', '--outputFile=' + os.environ.get('ROOT4590_PREDECESSOR_SOURCE_REPORT', str(repository / 'qualification/root4590/predecessor-source-final.json'))]
        working_directory = baseline
    elif kind == 'dist':
        environment['ROOT4590_BUNDLE'] = str(baseline / 'dist/index.js')
        environment['ROOT4590_EVIDENCE'] = os.environ.get('ROOT4590_PREDECESSOR_EVIDENCE', str(repository / 'qualification/root4590/predecessor-shipped'))
        command = ['node', '--test', str(repository / 'qualification/root4590/check-dist.cjs')]
        working_directory = repository
    else:
        raise SystemExit('Expected source or dist')
    print('Exact predecessor:', predecessor, flush=True)
    print('Command:', ' '.join(command), flush=True)
    raise SystemExit(subprocess.run(command, cwd=working_directory, env=environment).returncode)
