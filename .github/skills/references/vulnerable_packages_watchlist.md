# Vulnerable & High-Risk Package Watchlist — Spec Review Reference

## Purpose

Use this reference when evaluating dependency and supply-chain risks in a specification. Check whether the spec addresses version requirements, upgrade strategies, and known-risk packages for its technology stack.

---

## npm / Node.js

| Package | Vulnerable Versions | Issue | Safe Version |
|---------|-------------------|-------|--------------|
| lodash | < 4.17.21 | Prototype pollution (CVE-2021-23337) | >= 4.17.21 |
| axios | < 1.6.0 | SSRF, open redirect | >= 1.6.0 |
| jsonwebtoken | < 9.0.0 | Algorithm confusion bypass | >= 9.0.0 |
| node-jose | < 2.2.0 | Key confusion | >= 2.2.0 |
| shelljs | < 0.8.5 | ReDoS | >= 0.8.5 |
| tar | < 6.1.9 | Path traversal | >= 6.1.9 |
| minimist | < 1.2.6 | Prototype pollution | >= 1.2.6 |
| express | < 4.19.2 | Open redirect | >= 4.19.2 |
| xml2js | < 0.5.0 | Prototype pollution | >= 0.5.0 |
| vm2 | ANY | Sandbox escape (deprecated) | Use isolated-vm |
| node-fetch | < 2.6.7 | Open redirect | >= 2.6.7 or 3.x |

---

## Python / pip

| Package | Vulnerable Versions | Issue | Safe Version |
|---------|-------------------|-------|--------------|
| Pillow | < 10.0.1 | Multiple CVEs, buffer overflow | >= 10.0.1 |
| cryptography | < 41.0.0 | OpenSSL vulnerabilities | >= 41.0.0 |
| PyYAML | < 6.0 | Arbitrary code via yaml.load() | >= 6.0 |
| paramiko | < 3.4.0 | Authentication bypass | >= 3.4.0 |
| requests | < 2.31.0 | Proxy auth info leak | >= 2.31.0 |
| urllib3 | < 2.0.7 | Header injection | >= 2.0.7 |
| Django | < 4.2.16 | Various | >= 4.2.16 |
| Flask | < 3.0.3 | Various | >= 3.0.3 |
| Jinja2 | < 3.1.4 | HTML attribute injection | >= 3.1.4 |
| sqlalchemy | < 2.0.28 | Various | >= 2.0.28 |
| aiohttp | < 3.9.4 | SSRF, path traversal | >= 3.9.4 |

---

## Java / Maven

| Package | Vulnerable Versions | Issue |
|---------|-------------------|-------|
| log4j-core | 2.0–2.14.1 | Log4Shell RCE (CVE-2021-44228) — CRITICAL |
| log4j-core | 2.15.0 | Incomplete fix — still vulnerable |
| Spring Framework | < 5.3.28, < 6.0.13 | Various CVEs |
| Spring Boot | < 3.1.4 | Various |
| Jackson-databind | < 2.14.0 | Deserialization |
| Apache Commons Text | < 1.10.0 | Text4Shell RCE (CVE-2022-42889) |
| Apache Struts | < 6.3.0 | Various RCE |
| Netty | < 4.1.94 | HTTP request smuggling |

---

## Ruby / Gems

| Gem | Vulnerable Versions | Issue |
|-----|-------------------|-------|
| rails | < 7.1.3 | Various |
| nokogiri | < 1.16.2 | XXE, various |
| rexml | < 3.2.7 | ReDoS |
| rack | < 3.0.9 | Various |
| devise | < 4.9.3 | Various |

---

## Rust / Cargo

| Crate | Issue |
|-------|-------|
| openssl | Check advisory db for current version |
| hyper | Check advisory db for current version |

Reference: https://rustsec.org/advisories/

---

## Go

Reference: https://pkg.go.dev/vuln/ and https://vuln.go.dev

Common risky patterns:
- `golang.org/x/crypto` — check if version is within 6 months of current
- Any dependency using `syscall` package directly — review carefully

---

## General Red Flags (Any Ecosystem)

Flag any dependency that:
1. Has not been updated in > 2 years AND has open security issues
2. Has been deprecated by its maintainer with a security advisory
3. Is a fork of a known package from an unknown publisher (typosquatting risk)
4. Has a name one character off from a popular package (e.g., `lodash` vs `1odash`)
5. Was recently transferred to a new owner (check npm/git transfer notices)
6. Has extremely broad permissions for its stated purpose
7. Pulls in a large transitive dependency tree for a simple function

---

## Spec Review Questions

When reviewing a specification that names or implies specific dependencies:

- Does the spec pin or constrain dependency versions?
- Is there a defined upgrade cadence for security patches?
- Are critical dependencies identified with fallback or isolation strategies?
- Does the spec require dependency scanning in CI/CD?
- Is there a policy for evaluating new dependencies before adoption?
- Are deprecated or end-of-life dependencies flagged for replacement?
