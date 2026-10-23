#!/usr/bin/env python3
"""Apply the bundle receiving corpus to the exact committed pre-fix dist."""
import io
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile

repository = Path(__file__).resolve().parents[2]
base = 'd721c06b0142c55cd23c461734c1423bf95cedb2'
with tempfile.TemporaryDirectory(prefix='root4410-a-baseline-dist-') as directory:
    archive = subprocess.check_output(['git', 'archive', base, 'dist'], cwd=repository)
    with tarfile.open(fileobj=io.BytesIO(archive)) as source:
        source.extractall(directory, filter='data')
    environment = dict(os.environ)
    environment['ROOT4410_BUNDLE'] = str(Path(directory) / 'dist/index.js')
    environment['ROOT4410_DIST_EVIDENCE'] = str(repository / 'qualification/root4410-a/fixtures/baseline-dist')
    print('Exact baseline shipped bundle:', base, flush=True)
    completed = subprocess.run(['node', '--test', str(repository / 'qualification/root4410-a/check-dist.cjs')], cwd=repository, env=environment)
    raise SystemExit(completed.returncode)
