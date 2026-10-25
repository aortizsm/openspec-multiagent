# Design

## Context

The workflow currently has `@code-reviewer` evaluating clean-code criteria (12 objective rules) but no security review. Security concerns are not systematically checked during the implementation loop. The stack includes PHP/CodeIgniter 4 (kaloria) and Node.js (opencode-openspec-multiagent).

## Goals / Non-Goals

**Goals:**
- Define objective, verifiable security criteria (same standard as clean-code-criteria)
- Create `@security-reviewer` agent that evaluates code against these criteria
- Integrate security review as a mandatory gate before `@verifier`
- Support PHP and Node.js stacks

**Non-Goals:**
- Automated SAST/DAST tooling (future enhancement)
- Dependency vulnerability scanning (`npm audit`, `composer audit`)
- Infrastructure security (TLS, firewalls, cloud config)
- Compliance frameworks (SOC2, HIPAA, PCI-DSS)

## Decisions

### Decision 1: Separate agent vs. criteria in code-reviewer

**Chosen**: Separate `@security-reviewer` agent.

**Rationale**: Security is a distinct domain from clean code. The 12 clean-code criteria cover style, SRP, DRY, naming — security criteria cover OWASP patterns, injection prevention, auth checks, secure headers. Mixing them would make the code-reviewer table unwieldy and dilute focus.

**Alternative**: Add security as additional criteria to `@code-reviewer`.
**Trade-off**: Simpler loop (one review step) but criteria become harder to maintain and less focused.

### Decision 2: Criteria must be 100% verifiable and language-agnostic

**Chosen**: Every criterion is a regex pattern match or structural check that works regardless of programming language. No language-specific function names in the criteria text.

**Rationale**: Same principle as clean-code-criteria. The user works with PHP, Node.js, and potentially other languages. Criteria must apply universally.

**Examples**:
- ✅ "No `eval(` in code" → grep pattern, works in any language
- ✅ "No string concatenation in SQL" → pattern matches SQL keywords + concatenation operators
- ❌ "No `realpath()` usage" → too PHP-specific
- ✅ "Path validated against base directory" → pattern matches `realpath`, `path.resolve`, `normalize`, etc.

### Decision 3: Security review is mandatory, not optional

**Chosen**: `@security-reviewer` is a required gate before `@verifier`.

**Rationale**: Security is not a "nice to have". If the security review finds CRITICAL issues, the change cannot proceed until fixed.

**Alternative**: Optional security review (only for high-risk changes).
**Trade-off**: Faster loop for simple changes, but security becomes inconsistent.

### Decision 4: Severity levels for security criteria

| Severity | Meaning | Examples |
|----------|---------|----------|
| CRITICAL | Vulnerability that can be exploited | SQL injection, hardcoded secrets, eval() with user input |
| WARNING | Security best practice violation | Missing CSRF, weak session config, no XSS escaping |
| SUGGESTION | Hardening recommendation | Missing security headers, debug output in non-test files |

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Criteria too broad for some projects | Criteria are project-agnostic; agents apply what's relevant to the stack |
| False positives from regex patterns | Agents review matches; criteria flag, don't auto-reject |
| New vulnerability patterns emerge | Criteria can be updated via new changes (same process as clean-code-criteria) |
| Slower review loop (extra agent) | Security review is read-only; can be parallelized with code review in future |

## Migration Plan

1. Create `@security-reviewer` agent definition (`opencode/agents/security-reviewer.md`)
2. Update `@code-reviewer` to reference security criteria (no duplication)
3. Update `@developer` with security expectations
4. Update `AGENTS.md` with security criteria table
5. Update `opencode/agents/architect.md` with `@security-reviewer` invocation instructions
6. Update README.md with new agent and loop diagram

## Open Questions

None. All criteria are derived from established OWASP patterns and are verifiable by code inspection.
