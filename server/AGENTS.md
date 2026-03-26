# AGENTS.md

## Project intent
Deno + Preact project that provides browser sources for streaming with OBS.

## Working style
- Keep the architecture lean and pragmatic.
- Prefer simple, readable TypeScript over clever abstractions.
- Prefer feature-oriented structure over enterprise layering.
- Keep changes scoped to the requested task.
- Do not rewrite unrelated files.

## Dependencies
- Do not add any new dependency without my explicit permission.
- Do not add production dependencies without asking first.
- Do not add dev dependencies without asking first.
- Prefer built-in Deno APIs and existing project dependencies.
- If a new dependency seems useful, explain why it is needed and what problem it solves before making any change.

## Code preferences
- Prefer boring, readable code.
- Prefer simple TypeScript unions and primitives over advanced type gymnastics unless clearly justified.
- Keep files focused and reasonably small.
- Avoid unnecessary indirection, interfaces, and abstraction layers.
- Do not introduce enterprise patterns unless explicitly requested.

## Persistence
- Prefer local JSON persistence unless told otherwise.
- Keep persistence straightforward and inspectable.

## Validation
- Run relevant format, lint, and type-check commands after making changes.
- Report what commands were run and whether they passed.

## Output expectations
- Summarize the plan briefly before larger edits.
- After changes, summarize:
  - what changed
  - which files changed
  - any assumptions made
  - any follow-up recommendations
