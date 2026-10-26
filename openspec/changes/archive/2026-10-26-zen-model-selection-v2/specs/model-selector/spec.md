# Spec Delta

## Purpose

Provides a reusable interactive arrow-key model selector that displays a pricing table once and updates only the highlighted row on navigation, avoiding full-table re-renders.

## ADDED Requirements

### Requirement: Selector renders model table once
The selector SHALL render the complete model table exactly once during initialization, then update only the highlighted row on arrow-key navigation.

#### Scenario: Initial render
- **WHEN** `selectModelFromList` is called with a model list
- **THEN** the full table (header, separator, all model rows, hint line) is printed once

#### Scenario: No duplicate renders on navigation
- **WHEN** user presses ↑ or ↓ arrow keys
- **THEN** only the previously highlighted row and newly highlighted row are updated in place; the rest of the table remains unchanged

### Requirement: Arrow-key navigation with wrapping
The selector SHALL support ↑ and ↓ arrow keys to move the highlight, with wrap-around at the first and last rows.

#### Scenario: Move down with wrap
- **WHEN** user presses ↓ on the last row
- **THEN** highlight wraps to the first row

#### Scenario: Move up with wrap
- **WHEN** user presses ↑ on the first row
- **THEN** highlight wraps to the last row

### Requirement: Enter confirms selection
The selector SHALL return the selected model ID when user presses Enter.

#### Scenario: Confirm with Enter
- **WHEN** user presses Enter
- **THEN** promise resolves with the model ID at the current highlight position

### Requirement: Escape cancels and falls back to recommended
The selector SHALL return the recommended model ID when user presses Escape or Ctrl+C.

#### Scenario: Cancel with Escape
- **WHEN** user presses Escape
- **THEN** promise resolves with the recommended model ID

### Requirement: Non-interactive fallback
The selector SHALL immediately return the recommended model ID when stdin is not a TTY (non-interactive).

#### Scenario: Non-interactive fallback
- **WHEN** `isInteractive()` returns false
- **THEN** `selectModelFromList` returns `recommendedId` without rendering anything

### Requirement: Highlight and recommended markers
The selector SHALL display `▶` prefix on the currently highlighted row and `★` suffix on the recommended model row.

#### Scenario: Both markers on same row
- **WHEN** the recommended model is the currently highlighted row
- **THEN** the row displays `▶` prefix and `★` suffix simultaneously