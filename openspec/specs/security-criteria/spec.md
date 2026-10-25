# security-criteria Specification

## Purpose
Objective, verifiable security criteria that every agent applies when writing or reviewing code, regardless of programming language. Criteria are designed to be 100% checkable without interpreting intent.

## Requirements

### Requirement: No hardcoded secrets

The codebase SHALL NOT contain hardcoded secrets, API keys, tokens, passwords, or credentials.

#### Scenario: No cloud provider keys
- **WHEN** scanning code for patterns like `AKIA[0-9A-Z]{16}` (AWS), `AIza[0-9A-Za-z_-]{35}` (GCP), `00[A-Za-z0-9]{40}` (Azure)
- **THEN** zero matches found

#### Scenario: No generic API keys in code
- **WHEN** scanning code for patterns `sk-[a-zA-Z0-9]{20,}`, `Bearer [a-zA-Z0-9._-]{10,}`, `api[_-]?key\s*[:=]\s*['"][^'"]{8,}`
- **THEN** zero matches found

#### Scenario: No hardcoded passwords
- **WHEN** scanning code for patterns `password\s*[:=]\s*['"][^'"]{3,}`, `passwd\s*[:=]\s*['"][^'"]{3,}`, `secret\s*[:=]\s*['"][^'"]{6,}`
- **THEN** zero matches found

### Requirement: SQL injection prevention

All database queries SHALL use parameterized queries or an ORM. Raw SQL with string concatenation or interpolation for user input is prohibited.

#### Scenario: No string concatenation in SQL
- **WHEN** scanning code for SQL keywords (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`) combined with string concatenation operators (`+`, `.`, `.`.`) or string interpolation (`${`, `%s`, `%d`)
- **THEN** zero matches found

#### Scenario: Parameterized queries used
- **WHEN** checking database query files
- **THEN** all queries use parameter binding (`?`, `:name`, `$1`, or ORM methods)

### Requirement: XSS prevention

All user-controlled output rendered in HTML SHALL be escaped or encoded.

#### Scenario: No dangerous DOM manipulation
- **WHEN** scanning code for `.innerHTML`, `.outerHTML`, `.insertAdjacentHTML`, or `document.write`
- **THEN** zero matches found with user-controlled data

#### Scenario: Output escaping in templates
- **WHEN** scanning template files for variables rendered in HTML context
- **THEN** variables are passed through an escaping function (`esc()`, `escape()`, `htmlEncode()`, or framework auto-escaping)

### Requirement: Input validation

All external input (HTTP parameters, file uploads, headers, body) SHALL be validated before processing.

#### Scenario: Input validation exists for user-facing endpoints
- **WHEN** a route/controller/action accepts user input
- **THEN** validation rules are explicitly defined (type, length, format, range)

#### Scenario: File upload validation
- **WHEN** a file upload endpoint exists
- **THEN** file type, size, and name are validated before saving

### Requirement: Authentication checks on protected routes

All routes that modify state or access sensitive data SHALL enforce authentication.

#### Scenario: State-changing routes require auth
- **WHEN** a POST/PUT/DELETE/PATCH route exists
- **THEN** it has an authentication guard/filter/middleware applied

#### Scenario: Unauthenticated access denied
- **WHEN** a request without valid session/token hits a protected route
- **THEN** the response is 401 or 302 (redirect to login)

### Requirement: No unsafe execution functions

The codebase SHALL NOT use `eval()`, `exec()`, `system()`, `passthru()`, `shell_exec()`, `proc_open()`, or equivalent functions with user-controlled input.

#### Scenario: No eval() usage
- **WHEN** scanning code for `eval(`, `assert(`, `Function(` (JS), or equivalent dynamic code execution
- **THEN** zero matches found

#### Scenario: No shell execution with user input
- **WHEN** scanning code for `exec(`, `system(`, `passthru(`, `shell_exec(`, `proc_open(`, `spawn(`, `execSync(`, or equivalent
- **THEN** zero matches found

### Requirement: Path traversal prevention

All file operations SHALL validate file paths to prevent directory traversal attacks.

#### Scenario: No unsanitized path components
- **WHEN** scanning code for file operations (`readFile`, `include`, `require`, `fopen`, `FileReader`, etc.) using user-controlled input
- **THEN** the path is validated: no `..` sequences, or resolved against a base directory (`realpath`, `path.resolve`, `normalize`)

#### Scenario: Filename validation for downloads
- **WHEN** a file download/read endpoint accepts a filename or path parameter
- **THEN** the filename is validated (whitelist of allowed extensions, no `..` sequences)

### Requirement: Secure error handling

Error messages SHALL NOT leak internal details (stack traces, SQL queries, file paths, database names, usernames).

#### Scenario: No debug output in production code
- **WHEN** scanning code for `var_dump(`, `print_r(`, `debug_print_backtrace(`, `console.log(` with variable names containing `password`, `secret`, `key`, `token`, `sql`, `query`
- **THEN** zero matches found outside test files

#### Scenario: No stack traces in responses
- **WHEN** checking error handling code
- **THEN** error responses do not include stack traces, file paths, or SQL queries

### Requirement: CSRF protection

All state-changing HTTP endpoints SHALL enforce CSRF token validation.

#### Scenario: State-changing routes have CSRF
- **WHEN** a POST/PUT/DELETE/PATCH route exists
- **THEN** it has CSRF validation enabled (token check, origin/referrer validation, or SameSite cookie attribute)

#### Scenario: GET requests are safe
- **WHEN** a GET route exists
- **THEN** it does not modify server state (no side effects)

### Requirement: Secure password storage

Passwords SHALL be hashed using a strong algorithm (bcrypt, argon2, scrypt, PBKDF2). Plain-text password storage is prohibited.

#### Scenario: No plain-text password storage
- **WHEN** scanning code for password handling logic
- **THEN** all password storage uses a hashing function (`password_hash`, `bcrypt.hash`, `argon2`, `scrypt`, `pbkdf2`)

#### Scenario: No weak hashing for passwords
- **WHEN** scanning code for password hashing
- **THEN** no MD5, SHA1, or SHA256 is used alone for password hashing

### Requirement: Secure session configuration

Sessions SHALL be configured with secure flags (HttpOnly, Secure, SameSite).

#### Scenario: Session cookie flags are set
- **WHEN** checking session/cookie configuration
- **THEN** cookies have `HttpOnly = true`, `Secure = true` (in production), `SameSite = Lax` or `Strict`

### Requirement: Security headers

HTTP responses SHALL include security headers.

#### Scenario: Minimum security headers present
- **WHEN** checking HTTP response headers
- **THEN** at minimum `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` or `SAMEORIGIN` are present
