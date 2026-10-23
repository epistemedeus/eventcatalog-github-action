# Maintainer delivery

One coherent upstream candidate is ready for independent Root receiving and the maintainer submission decision. It contains the received compatibility/fetch-failure repairs, ordinary regressions and generated action, without historical qualification. No upstream PR has been opened.

## Exact source

- Preserved fork: `https://github.com/epistemedeus/eventcatalog-github-action.git`.
- Preserved owner: `codex/root4410-a-eventcatalog-compatibility-20261023`, retaining original `8d7414c04abccebf4a3d36dc94aad074b0b0c93d` and every prior source/test/dist/qualification byte. The checkout was never reset or switched; only `qualification/root4842/` advances its history.
- Candidate: `codex/root4842-eventcatalog-compatibility-20261023`.
- Base: `d721c06b0142c55cd23c461734c1423bf95cedb2`.
- Head: `f46aaa3d9b62ea83659514fc2c791192e22cd2ec`.
- Tree: `64e9216af767db7cd2431090920a49d5d076472d`.

This is one direct commit on upstream, with no stacked dependency or split refs. Provider and fetch repairs share result validation, failure precedence, comments, valid zero scores and the shipped action. The grouping keeps the complete consumer and exact received production inputs together. It makes no claim that an independently received split is impossible.

[PROJECTIONS.json](PROJECTIONS.json) lists all 23 changed paths and Git blob/SHA-256 identities. [PROJECTED-TREE.json](PROJECTED-TREE.json) seals all 57 tracked candidate members. [candidate.diff](candidate.diff) is the complete raw binary-capable Git diff, with its hash recorded. Ten source modules, narrow README/action changes, two generated files and focused tests change. Package/lock, workflows, license gate and generated sidecars are unchanged.

## Minimal regressions

The Vitest regressions and actual SDK request snapshots remain under ordinary `tests/`. Three shipped-action scripts move to `tests/action/review-outcomes.cjs`, `tests/action/source-acquisition.cjs` and `tests/action/fixtures/action-child.cjs`, with a reproduction README. [RELOCATION.diff](RELOCATION.diff) shows only path, optional bundle/evidence variable, temporary-directory and harness-wording changes, plus corresponding formatting. No assertion or scenario changed.

The harness reuses the existing synthetic catalog and generates temporary extra event/service data. No saved response corpus, qualification, logs, internal Root IDs or historical receipts enter the candidate. Its explicit Node entrypoints do not change Vitest's seven-file discovery.

Explicit OpenAI/Anthropic/Google requests, license refusal, invalid/absent reviews, secret redaction, zero/thresholds, mixed results and recovery remain covered. Fetch failures retain typed status/cause internally and fail before a provider call for that item. Additions use metadata-proved absent base; renames use previous/base and current/head paths. Removed, ambiguous, out-of-scope and empty schemas fail explicitly for manual review.

## Actual projected receiving

The candidate was frozen at **14:15:55.626 UTC**, before receiving. All current passes belong to that exact head/tree.

| Command                                                                              | Outcome                                                  | Receipt                       |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------- | ----------------------------- |
| Focused Vitest: provider, outcomes, acquisition and GitHub helpers; one worker       | 96/96, exit 0                                            | `logs/focused.json`           |
| Complete `pnpm exec vitest run --maxWorkers=1 --minWorkers=1 --no-file-parallelism`  | 104/104, seven files, zero skips, exit 0                 | `logs/full.json`              |
| `pnpm exec tsc --noEmit`                                                             | Exit 0                                                   | `logs/typecheck.json`         |
| Scoped Prettier check of all 20 changed non-generated code/document paths            | Exit 0                                                   | `logs/format-projection.json` |
| Canonical-CWD ncc build to fresh external output                                     | Exit 0                                                   | `logs/canonical-build.json`   |
| `python3 qualification/root4842/prove-projection.py --dist`                          | Frozen tree/owner bytes and all six raw dist files equal | `logs/raw-dist-proof.json`    |
| `node --test --test-concurrency=1 tests/action/review-outcomes.cjs` in projection    | 18/18, zero skips, exit 0                                | `logs/shipped-review.json`    |
| `node --test --test-concurrency=1 tests/action/source-acquisition.cjs` in projection | 40/40, zero skips, exit 0                                | `logs/shipped-source.json`    |
| Preload external socket/fetch refusal and real loopback control                      | Exit 0                                                   | `logs/guard-control.json`     |

Receipts give exact argv, CWD, UTC times, exits and sampled RSS; matching logs retain output. [RUNTIME.json](RUNTIME.json) records actual Node **20.20.2**, pnpm **10.33.4**, ncc **0.38.3**, TypeScript **5.8.3**, Vitest **3.2.0**, AI **4.3.16**, provider/package and lock identities. Existing dependencies were reused; there was no install or upgrade. Source/build/test commands use Node 20 first on PATH and `NODE_OPTIONS=--max-old-space-size=1024` plus the copied process-local loopback preload. Shipped children receive clean synthetic inputs and their own socket/provider/license boundaries. [CASE-MATRIX.json](CASE-MATRIX.json) seals all 58 final captures; all have zero unexpected routes.

All commands ran serially. Peak sampled whole native-owner tree RSS was **1,096,388 KiB** within **2,097,152 KiB TOTAL**, including command descendants. Sampling is every 50 ms, not a kernel high-water guarantee. Zero model children, reserve increases or measured cap exceptions; no other job or enrollment was owned or stopped.

## Production inputs and raw build

[PRODUCTION-INPUTS.json](PRODUCTION-INPUTS.json) proves all **37** tracked non-test/non-dist inputs equal the actual canonical source/CWD as raw bytes: all source, package, lock, tsconfig, ncc script, license and root configuration. Both routes resolve dependencies and their license inputs to the identical real `node_modules` directory.

The unchanged ncc route ran from `/home/ubuntu/ae14-work/root4410-a-eventcatalog-compatibility-20261023` to fresh `/home/ubuntu/root-sol-window100337/root4842-eventcatalog-upstream-packaging-20261023/dist`. Only the output destination differs from `pnpm build`. [DIST-COMPARISON.json](DIST-COMPARISON.json) proves the exact six-file inventory and raw buffers equal the frozen candidate: entrypoint/map, split chunk/map, license output and source-map registration. Nothing was normalized, hand-edited or copied over canonical dist. Projected-tree/original-owner verification also passed after receiving.

Root4748's failed isolated-CWD raw comparison and Root4778's successful canonical proof remain unchanged at their original paths, hashed in [REFERENCES.json](REFERENCES.json). This operation has its own fresh canonical build and actual projected 58-case receiving. It neither borrows different-tree passes nor calls isolated-CWD drift equality.

## Failures, checkpoint and remaining decision

[PACKAGING-FAILURES.json](PACKAGING-FAILURES.json) retains the first inline input proof's incorrect evidence path (Python exit 1; subsequent focused command passed). The corrected explicit-canonical proof passed before build. It also retains staged whitespace check exit 2 on nested raw patch documents. Those diffs remain exact; the evidence check excludes only `.diff` documents, while the actual candidate diff and scoped formatter pass. No source or shipped-action regression failed in this packaging run.

Owner checkpoint `3972715743c5e51ed97b4c98861ba773fcff20ae` and candidate were pushed together. Controller handbacks were written **14:19:49.593 UTC**, before **14:20:16.646 UTC**. This same session completed under the new **15:58:42.142 UTC** horizon. Frozen operating source `pilot@86a423e97abe405ebc83db008e88fcbf87eb9e5a` is distinct from the product authority; receipt and four member hashes/blob IDs were verified. Controller handbacks carry literal final owner HEAD/tree and verified remote refs.

No required local receiving remains unmet. Live model availability/quality, installed licensed invocation and hosted CI remain unreceived. Existing workflows select pnpm 8 against the v9 lock; receiving uses qualified pnpm 10 and makes no CI promise. Existing event-only SDK and changed-file pagination limits remain. Source timeout units throw `TimeoutError`; shipped source timeouts use local HTTP 504 and network cases close the local socket.

Process-local guards do not prove whole-family no-egress; original refused synthetic-token GitHub attempts remain in the historical reports. There was no live GitHub/license/provider invocation, upstream PR/comment, account/credential change, installation, publication, release, deployment or payment. Only authorized fork Git exports were performed.

[PR-DRAFT.md](PR-DRAFT.md) gives recipient-scoped motivation, behavior and validation. Root independently receives and decides whether/when to submit this one candidate. Maintainer acceptance remains a recipient decision.
