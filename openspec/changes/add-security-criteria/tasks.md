# Tasks

## 1. Create @security-reviewer agent

- [x] 1.1 Create `opencode/agents/security-reviewer.md` with security criteria evaluation rules and verify the file exists and has the correct structure
- [x] 1.2 Add `@security-reviewer` to `~/.config/opencode/agents/` and to the OpenCode config agents section, verify it loads correctly

## 2. Update @code-reviewer agent

- [x] 2.1 Add security criteria reference to `opencode/agents/code-reviewer.md` (point to security-criteria spec, no duplication) and verify the reference is present
- [x] 2.2 Update AGENTS.md to include security criteria table alongside clean-code criteria table and verify both tables render correctly

## 3. Update @developer agent

- [x] 3.1 Add security expectations to `opencode/agents/developer.md` ("Explore Existing Conventions" and "Implementation expectations") and verify the security rules are present
- [x] 3.2 Update README.md agent table to include `@security-reviewer` and verify the table is consistent

## 4. Update @architect agent

- [x] 4.1 Add `@security-reviewer` invocation instructions to `opencode/agents/architect.md` (implementation loop section) and verify the loop order is correct
- [x] 4.2 Update README.md loop diagram to include `@security-reviewer` step and verify the Mermaid diagram renders without errors

## 5. Validation

- [x] 5.1 Run `openspec validate --all` and verify it exits 0 with all specs passing
- [x] 5.2 Run `npm test` and verify all tests pass
- [x] 5.3 Verify `git diff` only affects files within the change scope

## Workflow follow-up

- Archive the change after verification passes.
- Verify the archived result.
