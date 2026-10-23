## Motivation

The action's default model has an announced retirement, and the locked SDK sends its named substitute an incompatible request shape. Failed AI calls, zero scores and failed GitHub schema retrieval can also produce misleading Safe reviews.

Use `gpt-5.6-terra` with the existing SDK's strict schema output and temperature 1, and update the copied workflow example. Preserve explicit models and the Anthropic/Google paths.

Require complete, verified UTF-8 schema content before requesting AI review. Preserve PR status and previous filename metadata: additions have an explicit absent base, and renames fetch the old path at base and new path at head. Removed schemas, ambiguous metadata, moves outside the selected schema scope and empty schemas produce clear failed reviews without an AI score. Retrieval failures retain their original cause/status internally and expose safe diagnostics. Successful siblings remain visible, zero and thresholds remain correct, and comment publication cannot erase a source failure.

Validation: 104 Vitest tests, TypeScript no-emit, scoped Prettier, the existing ncc production build, and 58 Node 20 shipped-action scenarios pass (18 original plus 40 source-acquisition cases). The preserved predecessor fails 60 of 67 focused source assertions and 35 of 40 acquisition bundle assertions. Tests use synthetic inputs and local GitHub/license/provider boundaries. No dependency upgrade or license-gate change is needed.

See `qualification/root4590/WORKER-HANDBACK.md` for exact source/artifact identities, commands, retained failures and limits. Live provider quality, licensed installed behavior and hosted CI remain unreceived.
