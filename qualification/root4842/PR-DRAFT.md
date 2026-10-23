# Fix schema review model compatibility and fail incomplete reviews

## Motivation

The default model has an announced retirement, and the locked SDK sends its named substitute an incompatible request. Failed AI calls and failed GitHub schema downloads can also produce misleading Safe reviews: download errors become prompt text that the model can score 100.

Use `gpt-5.6-terra` with the existing SDK's strict JSON-schema output and supported temperature, and update the action default, fallbacks and copied workflow example. Explicit model/provider inputs remain honored, including legacy OpenAI, Anthropic and Google paths.

Require complete UTF-8 schema contents before requesting review. Preserve PR status and previous filename: additions have a verified absent base, and renames fetch the previous path at base and current path at head. Unsupported removals, ambiguous changes and empty schemas fail visibly for manual review. Retrieval failures remain typed, retain status/cause internally, and expose safe diagnostics. A failed or missing review has no risk score and fails the action, including among successful siblings. Zero scores and threshold behavior remain valid. The license gate and dependencies are unchanged.

## Validation

The projected candidate passes 104 Vitest tests, TypeScript no-emit, and 58 shipped-action cases using synthetic GitHub/license/provider boundaries. The generated action was rebuilt with the existing ncc command in the original build context and all six generated files compared as raw bytes. The minimal reusable harness lives in `tests/action/`, with reproduction commands in its README.

The shipped cases cover supported requests, license refusal, provider and fetch failures, secret redaction, zero/thresholds, additions/renames, mixed results, comment publication failure and later recovery. Live provider quality/availability, installed licensed invocation and hosted CI have not been tested. No dependency upgrade or workflow change is included.
