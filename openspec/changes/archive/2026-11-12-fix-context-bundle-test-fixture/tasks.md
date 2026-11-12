# Tasks

## 1. Make context-bundle tests self-contained

- [x] 1.1 Replace the `orchestrate-refactor` references in `tests/lib.test.mjs` with a uniquely named temporary OpenSpec change containing proposal, design, tasks, and spec markdown; assert the expected bundle sections and fixture content, and remove the fixture in `finally`.
- [x] 1.2 Run `npm test` and verify both test scripts finish with exit code 0, including the missing-change error scenario.
