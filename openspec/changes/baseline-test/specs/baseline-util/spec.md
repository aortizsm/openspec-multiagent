# baseline-util Specification

## Scenario: formatTimestamp returns ISO string
- **WHEN** `formatTimestamp()` is called
- **THEN** returns current timestamp in ISO 8601 format

## Scenario: formatTimestamp accepts custom date
- **WHEN** `formatTimestamp(date)` is called with a Date object
- **THEN** returns that date in ISO 8601 format
