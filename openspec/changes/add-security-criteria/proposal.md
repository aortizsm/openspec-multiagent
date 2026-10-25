## Why
The multi-agent workflow has no security review gate. Code can be implemented and reviewed for clean code and correctness without any security analysis. This leaves vulnerabilities undetected until production.

## What Changes
- Add a new `security-criteria` OpenSpec capability with objective, verifiable security rules
- Add `@security-reviewer` agent that evaluates code against these criteria
- Integrate security review into the implementation loop: `@developer` → `@code-reviewer` → `@security-reviewer` → `@verifier` → `@architect`
- Update `@code-reviewer` and `@developer` agent definitions to reference security criteria

## Scope
- **In scope**: Objective security criteria for PHP (CodeIgniter 4) and Node.js projects; new `@security-reviewer` agent; integration into the review loop
- **Out of scope**: Automated vulnerability scanning tools (SAST/DAST), infrastructure security, dependency vulnerability scanning (future enhancement)

## Success Criteria
- Security criteria are 100% verifiable without interpreting intent (same standard as clean-code-criteria)
- `@security-reviewer` agent can evaluate any codebase against the criteria
- Security review is a mandatory gate before `@verifier`
- `openspec validate --all` passes
- `npm test` passes
