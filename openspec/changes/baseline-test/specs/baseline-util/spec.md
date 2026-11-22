# Spec Delta: baseline-test

## ADDED Requirements

### Requirement: Timestamp formatting helper
`formatTimestamp` MUST return a timestamp in ISO 8601 format. When called with an explicit `Date` argument, it MUST format that value instead of the current time.

#### Scenario: formatTimestamp returns ISO string
- **WHEN** `formatTimestamp()` is called
- **THEN** it returns the current timestamp in ISO 8601 format

#### Scenario: formatTimestamp accepts custom date
- **WHEN** `formatTimestamp(date)` is called with a `Date` object
- **THEN** it returns that date in ISO 8601 format
