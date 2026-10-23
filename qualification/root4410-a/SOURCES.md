# Source and evidence boundaries

Product input: `event-catalog/github-action@d721c06b0142c55cd23c461734c1423bf95cedb2`, received through the admitted project-owned fork `https://github.com/epistemedeus/eventcatalog-github-action.git`. No floating product branch was used.

Operating input: `epistemedeus/pilot@8aded3ca3bb5f22b32454f962091ef3750715a76`. All four staged receipt members matched their declared SHA-256 and Git blob IDs. Receipt SHA-256: `148b2904498ef56198779236422a485b693dcf42f62b74f9045ecceda72371ab`. The three phase references were read from that same pinned Git object store.

Official OpenAI documentation was retrieved October 23, 2026 using the OpenAI Docs skill:

- [Deprecations](https://developers.openai.com/api/docs/deprecations) names October 23, 2026 and `gpt-5.6-terra` for `o4-mini`'s announced retirement. A date does not establish endpoint availability at the time of this work.
- [GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) documents Chat Completions and structured output support.
- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) describes the schema-constrained output contract.

[Issue 1](https://github.com/event-catalog/github-action/issues/1) was read through enrolled GH. Its author's live rejection/success observations, including the temperature restriction and function-tool rejection, are supplied evidence, not worker-executed provider tests. The local contract emulator encodes those observations; it does not establish live availability or semantic parity.

The independent worker evidence is the installed locked SDK's actual fetch body, Zod-validated complete outputs, baseline/repaired task outcomes and generated-bundle execution. Request snapshots contain synthetic prompts and no headers. The generated-action captures use the real prompt, synthetic schema contents and local boundaries. `fixtures/baseline-dist/` intentionally retains the old unsafe comments and synthetic error leakage as negative evidence.

No dependency upgrade was needed: `ai@4.3.16` and `@ai-sdk/openai@1.3.22` already support native `structuredOutputs: true`; a separate object-generation temperature selects 1 for the two qualified IDs. `gpt-5.6-luna` is an explicit compatibility control, never a fallback. Other model IDs retain the locked SDK's prior behavior.

The repository's BSL-1.1 notices and runtime license gate are retained. Tests use synthetic license responses for evaluation. Maintainer acceptance, a licensed production invocation, model quality and live endpoint availability remain unreceived. Root owns upstream submission and installation.
