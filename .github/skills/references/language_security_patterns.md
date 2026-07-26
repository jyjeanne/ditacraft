# Language & Framework Security Patterns — Spec Review Reference

## Purpose

Use this reference when evaluating a specification that targets a specific language or framework. Each section lists the vulnerability patterns most commonly seen in that ecosystem, so the reviewer can check whether the spec defines adequate controls.

---

## JavaScript / TypeScript (Node.js, Express, React, Next.js)

### Critical areas to verify in the spec
- **Input validation**: Does the spec define validation for all user input before it reaches queries, templates, or commands?
- **Output encoding**: Does the spec require encoding for user-generated content rendered in HTML?
- **Dependency security**: Does the spec address npm supply-chain risks (lockfile integrity, audit gates)?
- **Server-side rendering**: Does the spec address XSS risks in SSR contexts?

### Framework-specific concerns

**Express.js**
- Security headers (helmet middleware required?)
- Body size limits to prevent DoS
- CORS policy restrictions (not `origin: '*'`)
- Trust proxy configuration for reverse proxy environments
- Rate limiting middleware for auth endpoints

**React**
- `dangerouslySetInnerHTML` usage rules
- `javascript:` URL injection via user-controlled href attributes
- Client-side state containing sensitive data

**Next.js**
- Server Actions and API Routes requiring authentication
- API route method validation (prevent unintended methods)
- Middleware-based auth for protected pages
- Environment variable exposure (NEXT_PUBLIC_ prefix leaks to client)

---

## Python (Django, Flask, FastAPI)

### Critical areas to verify in the spec
- **SQL safety**: Does the spec require ORM usage or parameterized queries?
- **Template safety**: Does the spec address server-side template injection (SSTI)?
- **Debug mode**: Does the spec prohibit debug mode in production?
- **Secret management**: Does the spec address SECRET_KEY, database credentials?

### Framework-specific concerns

**Django**
- CSRF protection enabled (exempt only for token-authenticated APIs)
- `DEBUG = False` in production
- `ALLOWED_HOSTS` restricted (not `['*']`)
- `SECRET_KEY` loaded from environment, not hardcoded
- Raw SQL usage restricted or audited

**Flask**
- `debug=True` prohibited in production
- `secret_key` loaded from environment with sufficient entropy
- `render_template_string()` never used with user input (SSTI risk)
- Session cookie security attributes

**FastAPI**
- Authentication dependency (`Depends()`) required on sensitive endpoints
- File path parameters validated to prevent path traversal
- Request body size limits
- CORS middleware configuration

---

## Java (Spring Boot, Spring Framework)

### Critical areas to verify in the spec
- **Injection**: Does the spec prohibit string concatenation in SQL/JPQL queries?
- **Deserialization**: Does the spec restrict deserialization of untrusted input?
- **XML processing**: Does the spec require disabling external entities (XXE prevention)?
- **Actuator exposure**: Does the spec restrict management endpoint access?

### Framework-specific concerns

**Spring Boot**
- Spring Security configuration (no `permitAll()` on sensitive endpoints)
- Actuator endpoints restricted to internal network or authenticated access
- CSRF enabled for browser-based clients
- `ObjectInputStream` usage restricted to allowlisted types
- `DocumentBuilderFactory` configured to prevent XXE

---

## PHP

### Critical areas to verify in the spec
- **SQL injection**: Does the spec require prepared statements (PDO)?
- **File inclusion**: Does the spec prohibit dynamic `include`/`require` with user input?
- **Type safety**: Does the spec require strict comparison (`===` not `==`)?
- **Serialization**: Does the spec prohibit `unserialize()` on user input?

### Common PHP-specific risks
- `extract()` with user input (variable injection)
- `eval()` or backtick operator with user input
- Loose type comparison in security contexts
- `file_get_contents()` with user-controlled URLs (SSRF)

---

## Go

### Critical areas to verify in the spec
- **Command execution**: Does the spec restrict `exec.Command` usage with user input?
- **SQL safety**: Does the spec require parameterized queries?
- **TLS**: Does the spec prohibit `InsecureSkipVerify: true`?
- **Concurrency**: Does the spec address goroutine lifecycle and context cancellation?

### Go-specific concerns
- Path traversal via `filepath.Join` with unsanitized input
- Goroutine leaks from missing context cancellation
- Panic recovery strategy for production services
- Error handling (not silently discarding errors)

---

## Ruby on Rails

### Critical areas to verify in the spec
- **SQL safety**: Does the spec require parameterized queries (not string interpolation)?
- **Mass assignment**: Does the spec require strong parameters (`permit`)?
- **Serialization**: Does the spec prohibit `YAML.load` with user input (use `YAML.safe_load`)?
- **Redirects**: Does the spec validate redirect targets to prevent open redirects?

### Rails-specific concerns
- `eval()` and `send()` with user-controlled arguments
- `redirect_to params[:url]` without allowlisting
- Cookie-based sessions without encryption configuration
- `html_safe` or `raw` on user content without sanitization

---

## Rust

### Critical areas to verify in the spec
- **Unsafe code**: Does the spec define policy for `unsafe` blocks (minimize, document, audit)?
- **Integer overflow**: Does the spec require checked arithmetic for financial or safety-critical calculations?
- **Error handling**: Does the spec prohibit `unwrap()`/`expect()` in production code paths?
- **Deserialization**: Does the spec restrict deserialization from untrusted sources?

### Rust-specific concerns
- `unsafe` blocks without documented safety invariants
- Integer wrapping in release builds (debug builds panic, release silently wraps)
- Panics from `unwrap()` causing service crashes
- `bincode::deserialize` from untrusted input

---

## Cross-Language Concerns

Regardless of language, verify the spec addresses:

1. **Input validation** — defined at trust boundaries, not just at the UI layer
2. **Output encoding** — context-appropriate encoding for HTML, SQL, shell, logs
3. **Authentication** — on every sensitive endpoint, not assumed from middleware ordering
4. **Authorization** — per-resource ownership checks, not just role-based gates
5. **Error handling** — no stack traces or internal details in user-facing errors
6. **Logging** — sensitive data redacted, security events captured
7. **Dependencies** — version pinning, audit gates, lockfile integrity
8. **Configuration** — environment-specific settings, no hardcoded secrets
