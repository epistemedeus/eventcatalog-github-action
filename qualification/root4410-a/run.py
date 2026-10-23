#!/usr/bin/env python3
"""Record one serial offline qualification command and its process-tree RSS."""
import datetime
import json
import os
from pathlib import Path
import subprocess
import sys
import time

name, *command = sys.argv[1:]
directory = Path(__file__).resolve().parent / "logs"
directory.mkdir(exist_ok=True)
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
def snapshot():
    result = {}
    for entry in Path('/proc').iterdir():
        if not entry.name.isdigit():
            continue
        try:
            fields = dict(line.split(':', 1) for line in (entry / 'status').read_text().splitlines() if ':' in line)
            result[int(entry.name)] = (int(fields['PPid']), int(fields.get('VmRSS', '0 kB').split()[0]), fields['Name'].strip())
        except (OSError, KeyError, ValueError):
            pass
    return result

initial = snapshot()
ancestor = os.getppid()
owner = None
while ancestor in initial:
    parent, _, process_name = initial[ancestor]
    if process_name == 'codex':
        owner = ancestor
        break
    ancestor = parent
peak_command = peak_owner = 0
exceeded = False
with (directory / f"{name}.log").open("w") as log:
    process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    while process.poll() is None:
        try:
            processes = snapshot()
            descendants = {process.pid}
            while True:
                expanded = descendants | {pid for pid, (parent, _, _) in processes.items() if parent in descendants}
                if expanded == descendants:
                    break
                descendants = expanded
            rss = sum(processes.get(pid, (0, 0, ''))[1] for pid in descendants)
            owned = {owner} if owner else descendants | {os.getpid()}
            while True:
                expanded = owned | {pid for pid, (parent, _, _) in processes.items() if parent in owned}
                if expanded == owned:
                    break
                owned = expanded
            owner_rss = sum(processes.get(pid, (0, 0, ''))[1] for pid in owned)
            peak_command = max(peak_command, rss)
            peak_owner = max(peak_owner, owner_rss)
            if owner_rss > 2097152:
                exceeded = True
                os.killpg(process.pid, 15)
        except ProcessLookupError:
            pass
        time.sleep(0.05)
exit_code = process.wait()
result = {
    "command": command,
    "started_utc": started,
    "finished_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "exit_code": exit_code,
    "sample_interval_seconds": 0.05,
    "peak_command_tree_rss_kib": peak_command,
    "peak_command_plus_native_owner_rss_kib": peak_owner,
    "native_owner_found": owner is not None,
    "memory_method": "sampled RSS sum of the entire native owner process tree, including all command descendants",
    "reserve_kib": 2097152,
    "reserve_exceeded": exceeded,
}
(directory / f"{name}.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
print((directory / f"{name}.log").read_text()[-14000:])
sys.exit(exit_code if exit_code >= 0 else 128 - exit_code)
