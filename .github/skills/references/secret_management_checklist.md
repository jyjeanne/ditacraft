# Secret & Credential Management Checklist — Spec Review Reference

## Purpose

Use this reference when evaluating whether a specification adequately addresses secrets management, credential handling, and exposure prevention. This is a spec-level checklist — it verifies that the spec *defines the right requirements*, not that code implements them.

---

## 1. Secrets Storage & Access

### What the spec should define
- Where secrets are stored (vault, managed KMS, environment variables)
- Who and what can access secrets (roles, services, environments)
- How secrets are injected at runtime (environment variables, mounted files, API calls to vault)
- Separation between secret storage and application code

### Spec review signals (gaps to flag)
- No secrets management strategy defined
- Secrets assumed to be in environment variables without defining how they get there
- No access control model for secrets
- Application code expected to contain or bundle secrets

---

## 2. Secret Rotation

### What the spec should define
- Rotation schedule for each secret type (API keys, database credentials, signing keys)
- Rotation mechanism (automated vs manual)
- Grace period for old secrets during rotation
- Impact analysis if rotation fails

### Spec review signals
- Secrets mentioned without rotation requirements
- No distinction between short-lived and long-lived secrets
- No fallback if rotation breaks dependent services

---

## 3. Secrets in CI/CD & Infrastructure

### What the spec should define
- How secrets are managed in CI/CD pipelines (GitHub Actions secrets, vault integration)
- Whether build artifacts or container images can contain secrets
- How IaC (Terraform, CloudFormation) handles sensitive values
- Secret masking in CI/CD logs

### Spec review signals
- CI/CD pipeline defined without secrets management
- Container images or build artifacts without secrets exclusion rules
- No mention of secret masking in logs or build output
- IaC templates without sensitive value handling

### Common CI/CD secret risks to check for
- **GitHub Actions**: hardcoded values in `env:` blocks instead of `${{ secrets.NAME }}`
- **Docker**: secrets in `ENV` or `ARG` directives (persisted in image layers)
- **Terraform**: hardcoded sensitive values instead of variables or data sources
- **Kubernetes**: secrets in plain-text ConfigMaps instead of Secrets objects

---

## 4. Credential Types & Requirements

### API Keys & Tokens
- Scope: least privilege per key
- Expiry: defined lifetime with auto-revocation
- Rotation: automated rotation support
- Monitoring: usage tracking and anomaly detection

### Database Credentials
- Per-service credentials (no shared credentials)
- Read-only vs read-write separation
- Connection string format (no embedded passwords in connection strings)
- Credential rotation without downtime

### Signing & Encryption Keys
- Key generation requirements (key size, algorithm)
- Key storage (HSM, managed KMS)
- Key rotation schedule
- Key backup and recovery

### Service-to-Service Authentication
- Mutual TLS or service mesh identity
- Short-lived tokens (not static API keys)
- Certificate rotation

---

## 5. Files That Should Never Be Committed

### What the spec should address
- `.gitignore` requirements for secret-bearing files
- Pre-commit hooks or CI checks for secret detection

### Files to verify are excluded from version control
```
.env, .env.local, .env.production, .env.staging
*.pem, *.key, *.p12, *.pfx
id_rsa, id_ed25519
credentials.json, service-account.json, gcp-key.json
secrets.yaml, secrets.json, config/secrets.yml
```

---

## 6. Secret Detection & Prevention

### What the spec should define
- Pre-commit secret scanning (e.g., git-secrets, detect-secrets, truffleHog)
- CI pipeline secret scanning gates
- Incident response if a secret is committed

### High-confidence secret patterns to scan for
These patterns in source code almost always indicate real secrets:

| Type | Pattern |
|------|---------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` |
| GitHub Token | `gh[pousr]_[a-zA-Z0-9]{36,}` |
| Stripe Secret | `sk_live_[a-zA-Z0-9]{24,}` |
| Private Key | `-----BEGIN (RSA\|EC\|OPENSSH)?PRIVATE KEY-----` |
| Generic Secret | Variable named `password\|secret\|api_key\|auth_token` assigned a string > 8 chars |

### Entropy-based detection
Strings > 20 characters with Shannon entropy > 4.5 bits/char in assignment context are likely secrets.

### Safe placeholder patterns (do not flag)
```
"your-api-key-here"
"<YOUR_API_KEY>"
"${API_KEY}"
"${process.env.API_KEY}"
"REPLACE_WITH_YOUR_KEY"
```

---

## 7. Incident Response for Exposed Secrets

### What the spec should define
- Procedure when a secret is accidentally exposed
- Rotation timeline after exposure
- Audit trail review requirements
- Communication plan for affected parties

### Spec review signals
- No incident response plan for secret exposure
- No defined rotation SLA after breach
- No requirement to audit git history for previously committed secrets
