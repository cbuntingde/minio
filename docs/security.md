# Security

This page documents the security posture of this fork: the October 2026
comprehensive audit, every remediation, and how the results are verified and
enforced going forward.

## Audit summary

| | |
| --- | --- |
| Method | Manual source review (authentication, authorization, crypto, HTTP layers) + symbol-level dependency audit with `govulncheck`, run in Docker against the project's exact toolchain |
| Findings | **55 vulnerabilities reachable from MinIO code** (dependencies + Go standard library) |
| Status | **0 reachable vulnerabilities** after remediation |

Evidence files at the repository root:

- [`security-audit-vulncheck-BEFORE.txt`](../security-audit-vulncheck-BEFORE.txt)
- [`security-audit-vulncheck-AFTER.txt`](../security-audit-vulncheck-AFTER.txt)

## Fixes

### Toolchain: Go 1.24.8 → Go 1.26.8

The largest single fix. Resolved ~20 reachable standard-library advisories,
including multiple `html/template` XSS escaper bypasses, the unauthenticated
TLS 1.3 KeyUpdate DoS and ECH privacy leak in `crypto/tls`, recursion DoS in
`encoding/xml`/`encoding/asn1`, unbounded allocation in `archive/tar`, and
`net/url`/`net/http` parsing issues. The toolchain directive in `go.mod` is
`go1.26.8`; CI builds with Go 1.26.x.

### Vulnerable dependencies

| Module | From | To | Reachable vulns fixed |
|---|---|---|---|
| `golang.org/x/crypto` | v0.37.0 | v0.57.0 | 14 — SSH server deadlock, certificate-restriction bypass, FIDO/U2F bypass (reachable via the embedded SFTP server) |
| `github.com/rabbitmq/amqp091-go` | v1.10.0 | v1.13.0 | 10 — OOM, frame injection, TLS config overwrite, credential exposure |
| `golang.org/x/net` | v0.39.0 | v0.59.0 | 2 |
| `go.opentelemetry.io/otel/sdk` | v1.35.0 | v1.45.0 | 2 — incl. arbitrary code execution via PATH |
| `google.golang.org/grpc` | v1.72.0 | v1.83.2 | 2 — HTTP/2 OOM, xDS RBAC bypass |
| `github.com/prometheus/prometheus` | v0.303.0 | v0.311.3 | 1 — Azure AD OAuth secret exposure |
| `github.com/go-jose/go-jose/v4` | v4.1.0 | v4.1.4 | 1 — JWE decryption panics |
| `golang.org/x/text` | v0.24.0 | v0.42.0 | 1 — infinite loop |
| `github.com/eclipse/paho.mqtt.golang` | v1.5.0 | v1.5.1 | 1 |
| `klauspost/compress`, `buger/jsonparser`, `filippo.io/edwards25519`, `Azure/go-ntlmssp`, `go.etcd.io/etcd/client/pkg/v3` | — | latest fixed | 6 additional (non-reachable; bumped for defense-in-depth) |

`go mod tidy` required one workaround for an upstream `go-openapi` packaging
bug (split modules referencing a never-published package): the same
`replace` pin that `prometheus/prometheus` uses internally, documented in
`go.mod`.

### CORS hardening (behavior change)

The server no longer reflects arbitrary origins with credentials by default.
See [configuration.md](configuration.md#cors) for the exact behavior and how
to enable credentialed CORS for specific origins.

### Code-level strengths verified during the audit

- Constant-time comparisons for signatures, session tokens, and SSE-C keys.
- Presigned URLs capped at 7 days; all query parameters cross-validated.
- `crypto/rand` for all key material; TLS 1.2 minimum with secure ciphers.
- IAM is default-deny; session policies demote `IsOwner`/`DenyOnly`.
- Tar extraction ignores symlinks; object names validated against traversal.

## Continuous enforcement

- `.github/workflows/vulncheck.yml` runs `govulncheck` on every push and PR
  with the current toolchain; a PR introducing a reachable vulnerability fails.
- Report new vulnerabilities per [SECURITY.md](../SECURITY.md).

## Reproducing the audit

With Docker:

```sh
docker run --rm -v "$PWD:/minio" -w /minio golang:1.26 bash -c \
  "go install golang.org/x/vuln/cmd/govulncheck@latest && govulncheck ./..."
```

Known residual: `GO-2026-5932` is reported informationally — MinIO code does
not call the affected symbols and no upstream fix has been released yet
("Fixed in: N/A" as of the last audit).
