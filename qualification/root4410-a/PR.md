## Motivation

The default `o4-mini` has an announced retirement, and the locked AI SDK sends the named substitute a request shape reported as unsupported in #1. A failed AI call also becomes a green “Safe” schema review because absent reviews and score zero are replaced with 100.

Use `gpt-5.6-terra` by default with the existing SDK's native schema-constrained output and temperature 1. Update the README workflow and explain explicit copied inputs. Preserve explicit models, including an additional Luna compatibility case, and the Anthropic/Google paths.

Validate review results, render failed items without a score, fail incomplete reviews even beside successful siblings, and preserve zero and threshold behavior. Keep original thrown errors while exposing safe status/parameter diagnostics. Rebuild the committed action with the existing ncc command.

Validation: 40 Vitest tests, TypeScript no-emit, scoped Prettier, production build and 18 Node 20 generated-action scenarios pass. The exact baseline fails 22/29 source regressions and 15/18 bundle assertions; legacy and license controls pass. All final action tests use synthetic inputs and local GitHub/license/provider boundaries. No live provider qualification or licensed production run is claimed. See `qualification/root4410-a/RESULT.md` for preserved setup failures and commands.
