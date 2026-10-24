# Agent Memory Policy Specification

## Purpose

Define how the workflow's agents use Engram as working memory to keep long or compacted conversations on track, and how final decisions and project memory are recorded in OpenSpec specs and `AGENTS.md`.

## Requirements

### Requirement: Scoped recall before deciding

`architect` MUST run `mem_context` at session start and `developer` MUST run a scoped `mem_search` (change name, capability or affected stack); neither MUST load the whole memory. `code-reviewer`, `repo-scout` and `diff-summarizer` MUST NOT consult Engram while working: they use the spec, the design and the diff.

#### Scenario: Architect recalls prior context
- **WHEN** `architect` starts a session in a project with Engram available
- **THEN** it runs `mem_context` before proposing and uses the relevant recalls as design input

#### Scenario: Developer searches only what is relevant
- **WHEN** `developer` receives a change to implement
- **THEN** it runs `mem_search` scoped to the change, capability or affected stack, and does not dump the whole project memory

#### Scenario: Recall does not change the outcome
- **WHEN** memory holds nothing relevant to the task
- **THEN** the agent continues with the normal workflow and does not treat the absence of recalls as a blocker

#### Scenario: Reviewer does not consult memory
- **WHEN** `code-reviewer` receives a change to review
- **THEN** it works from the spec, the design and the diff, and does not consult Engram

### Requirement: Continuity in long conversations

Engram MUST store the state needed to resume work after a compaction or a long session: current intent, open threads, unresolved questions and constraints the user stated. When resuming, `architect` MUST recover that state before re-asking anything already settled.

#### Scenario: Session resumed after compaction
- **WHEN** `architect` resumes a compacted or multi-session conversation
- **THEN** it recovers the stored state and continues from the open threads without re-asking what was already resolved

#### Scenario: Doubt about something already discussed
- **WHEN** a doubt arises about a topic that may have been covered before
- **THEN** the agent searches Engram first and asks the user only if memory does not resolve it

#### Scenario: Closing a long session without archiving
- **WHEN** a session ends without archiving a change and open threads remain
- **THEN** `architect` saves a digest of the current state (intent, open threads, pending questions) for the next session

### Requirement: Minimal save taxonomy

`architect` and `developer` write to Engram. `architect` saves conversation state, decisions with their rationale and the conventions it adopts; `developer` saves implementation gotchas and resolved blockers. Every save MUST carry enough context to be useful without this session's history.

#### Scenario: Conversation digest
- **WHEN** the conversation moves forward on a topic with open threads
- **THEN** `architect` saves a structured digest (intent, what was agreed, what is pending), not a transcript

#### Scenario: Implementation gotcha
- **WHEN** `developer` finds an undocumented constraint that cost time to resolve
- **THEN** it saves a memory with the constraint and the applied solution

#### Scenario: Recurring review finding
- **WHEN** `code-reviewer` finds a defect that already appeared in earlier reviews of the project
- **THEN** it reports it in its feedback and `architect` saves it with the pattern and how to avoid it

### Requirement: Explicit do-not-save list

Agents MUST NOT save to Engram: verbatim conversation transcripts, routine edits with no associated decision, lists of changed files, requirement text that already lives in a spec or `AGENTS.md`, or secrets, credentials or personal data.

#### Scenario: Routine change
- **WHEN** `developer` completes a task with no new decisions or discoveries
- **THEN** it writes no memory

#### Scenario: Requirement text already specified
- **WHEN** the content to save is a requirement statement that already exists in `openspec/specs/`
- **THEN** the agent does not duplicate it and, if it adds conversation context, saves only that context

#### Scenario: Attempt to save a secret
- **WHEN** the candidate content includes credentials, tokens or personal data
- **THEN** the agent does not save it and continues without recording the value

### Requirement: The spec is the final record

Final decisions and project memory MUST live in `openspec/specs/` or `AGENTS.md`; while a change is in progress, its `design.md` counts as the record. An Engram recall MUST NOT be treated as a taken decision: anything not recorded in the spec, the change design or `AGENTS.md` MUST be treated as unresolved and taken there before implementation.

#### Scenario: Decision that exists only in memory
- **WHEN** a recall describes a decision that no spec records
- **THEN** the agent does not implement it; `architect` takes it to the spec or the change design, confirming with the user when it is unclear

#### Scenario: Conversation is not a decision
- **WHEN** memory shows that a topic was discussed but not settled
- **THEN** the agent treats it as undecided and does not present it as agreed

#### Scenario: Approved decision
- **WHEN** the user approves a decision
- **THEN** `architect` records it in the spec; Engram may keep the conversation trail, but the spec is the reference

### Requirement: Precedence over OpenSpec and AGENTS.md

OpenSpec specs and `AGENTS.md` MUST be the source of truth for requirements and conventions. An Engram recall MUST NOT override them; on conflict the agent MUST follow the repo artifact and MUST NOT persist the conflicting recall as current.

#### Scenario: Stale recall
- **WHEN** a recall contradicts an in-force spec or `AGENTS.md`
- **THEN** the agent follows the spec or `AGENTS.md` and does not persist the stale version

#### Scenario: Outdated recall detected
- **WHEN** a recall reflects a decision the repo has already reverted
- **THEN** the agent points it out to the user and does not reuse it as the basis for a new decision

### Requirement: Degradation when Engram is unavailable

Engram is optional. If the memory tools (`mem_*`) are not available in the session, agents MUST continue the workflow normally, MUST NOT block or ask to install Engram, and at most MUST report once that persistent memory is inactive.

#### Scenario: Engram not configured
- **WHEN** an agent runs in a session without the Engram MCP server
- **THEN** it completes its task normally without trying to save or read memory

#### Scenario: Tools not visible but server configured
- **WHEN** the Engram server is configured but its tools are not listed directly in the agent's catalog
- **THEN** the agent tries to reach them through `execute` in the `engram` namespace and, if that fails, continues without memory

### Requirement: Provider independence, local first

The policy MUST apply the same way with local models and cloud providers: memory lives in the OpenCode client and the local Engram MCP server, not in the model provider. It MUST NOT depend on prompt caching, large context windows or proprietary tool calling.

#### Scenario: Long session with a local model
- **WHEN** work runs on a local model with a limited context window
- **THEN** the session keeps recovering only what it needs from Engram instead of trying to hold the whole history in the window

#### Scenario: Provider switch mid-project
- **WHEN** work moves from a local model to a cloud one, or the other way round
- **THEN** memory and specs stay valid with no migration or policy reconfiguration

#### Scenario: Model without reliable tool use
- **WHEN** the model does not invoke the MCP tools reliably
- **THEN** the degradation rule applies, the workflow continues without memory and it is reported once, without blocking

### Requirement: Ownership by role

Every type of recall MUST have a single owner: `architect` saves conversation state and decisions; `developer` saves implementation gotchas and resolved blockers. `code-reviewer`, `repo-scout` and `diff-summarizer` MUST NOT write memory: they report in their response and `architect` decides what is kept.

#### Scenario: Conventions detected by repo-scout
- **WHEN** `repo-scout` reports conventions and `architect` adopts them for the design
- **THEN** `architect` is the one who saves them; `repo-scout` writes nothing

#### Scenario: Read-only agents with Engram configured
- **WHEN** `code-reviewer`, `repo-scout` or `diff-summarizer` run in a session with Engram and the MCP's generic instruction invites them to save
- **THEN** they write no memory: they report, and `architect` decides what is kept

#### Scenario: Closing a spec
- **WHEN** `architect` archives an approved change
- **THEN** it records a session summary with what was implemented, the criteria met and the relevant tradeoffs
