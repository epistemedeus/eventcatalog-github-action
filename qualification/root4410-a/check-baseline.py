#!/usr/bin/env python3
"""Run the final regression corpus on the exact pinned product sources."""
import io
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

repository = Path(__file__).resolve().parents[2]
base = 'd721c06b0142c55cd23c461734c1423bf95cedb2'
with tempfile.TemporaryDirectory(prefix='root4410-a-baseline-') as directory:
    baseline = Path(directory)
    archive = subprocess.check_output(['git', 'archive', base], cwd=repository)
    with tarfile.open(fileobj=io.BytesIO(archive)) as source:
        source.extractall(baseline, filter='data')
    for relative in ['tests/ai-models', 'tests/tasks/schema-review/outcomes.spec.ts']:
        source = repository / relative
        target = baseline / relative
        if source.is_dir():
            shutil.copytree(source, target)
        else:
            shutil.copyfile(source, target)
    (baseline / 'node_modules').symlink_to(repository / 'node_modules', target_is_directory=True)
    command = ['pnpm', 'exec', 'vitest', 'run', 'tests/ai-models/openai.spec.ts', 'tests/tasks/schema-review/outcomes.spec.ts', '--maxWorkers=1', '--minWorkers=1', '--no-file-parallelism', '--reporter=verbose', '--reporter=json', '--outputFile=' + os.environ.get('ROOT4410_BASELINE_REPORT', str(repository / 'qualification/root4410-a/logs/baseline-final-cases.json'))]
    print('Pinned baseline:', base, flush=True)
    print('Command:', ' '.join(command), flush=True)
    completed = subprocess.run(command, cwd=baseline)
    # Keep exit 1: this is an intentionally red regression run, not a passing suite.
    raise SystemExit(completed.returncode)
