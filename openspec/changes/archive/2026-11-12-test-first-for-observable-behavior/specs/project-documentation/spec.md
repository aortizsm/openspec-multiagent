# Spec Delta

## MODIFIED Requirements

### Requirement: Documentation language
Documentation in `docs/` MUST be written in Spanish unless the user explicitly requests another language for an individual document; that document MUST use the requested language, and the rest of `docs/` MUST retain Spanish as the default. OpenSpec specs and `README.md` MUST remain in English.

#### Scenario: Spanish change entry
- **WHEN** a `docs/changes/` entry is written without a different language request
- **THEN** the text is in Spanish, with file names and commands in their literal form

#### Scenario: OpenSpec spec in English
- **WHEN** a delta is synced during archive
- **THEN** the resulting spec in `openspec/specs/` is in English

#### Scenario: Requested alternate language for an individual document
- **WHEN** the user explicitly requests another language for an individual document
- **THEN** that document uses the requested language, and the rest of `docs/` retains Spanish as the default
