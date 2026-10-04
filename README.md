# MinIO — Security-Hardened Community Build

[![license](https://img.shields.io/badge/license-AGPL%20V3-blue)](LICENSE)

[![MinIO](https://raw.githubusercontent.com/cbuntingde/minio/master/.github/logo.svg?sanitize=true)](https://github.com/cbuntingde/minio)

MinIO is a high-performance, S3-compatible object storage server released under the
GNU AGPL v3.0 license. This is a **security-hardened fork of the MinIO community
edition**. The original upstream README is preserved verbatim at
[`README.md.orig`](README.md.orig).

Upstream commercial alternatives remain available at
[AIStor Free](https://min.io/download) and
[AIStor Enterprise](https://min.io/pricing).

## What Changed in This Build (October 2026 Security Audit)

This fork was hardened following a comprehensive security audit: a manual source
review of the authentication, authorization, crypto, and HTTP layers, plus a
symbol-level dependency audit with `govulncheck` (run in Docker against the exact
project toolchain).

**Audit result: 55 vulnerabilities reachable from MinIO code → 0 after remediation.**
Before/after evidence: [`security-audit-vulncheck-BEFORE.txt`](security-audit-vulncheck-BEFORE.txt)
and [`security-audit-vulncheck-AFTER.txt`](security-audit-vulncheck-AFTER.txt).

### 1. Toolchain upgraded: Go 1.24.8 → Go 1.26.8

`go.mod` now requires `go 1.26.0` with `toolchain go1.26.8`. This resolved ~20
reachable Go standard-library advisories, including multiple `html/template`
XSS escaper bypasses, the unauthenticated TLS 1.3 KeyUpdate DoS and ECH privacy
leak in `crypto/tls`, recursion DoS in `encoding/xml`/`encoding/asn1`, unbounded
allocation in `archive/tar`, and several `net/url`/`net/http` parsing issues.

### 2. Vulnerable dependencies upgraded

| Module | From | To | Reachable vulns fixed |
|---|---|---|---|
| `golang.org/x/crypto` | v0.37.0 | v0.57.0 | 14 — SSH server deadlock, certificate-restriction bypass, FIDO/U2F bypass (exposed via the embedded SFTP server) |
| `github.com/rabbitmq/amqp091-go` | v1.10.0 | v1.13.0 | 10 — OOM, frame injection, TLS config overwrite, credential exposure |
| `golang.org/x/net` | v0.39.0 | v0.59.0 | 2 |
| `go.opentelemetry.io/otel/sdk` | v1.35.0 | v1.45.0 | 2 — incl. arbitrary code execution via PATH |
| `google.golang.org/grpc` | v1.72.0 | v1.83.2 | 2 — HTTP/2 OOM, xDS RBAC bypass |
| `github.com/prometheus/prometheus` | v0.303.0 | v0.311.3 | 1 — Azure AD OAuth secret exposure |
| `github.com/go-jose/go-jose/v4` | v4.1.0 | v4.1.4 | 1 — JWE decryption panics |
| `golang.org/x/text` | v0.24.0 | v0.42.0 | 1 — infinite loop |
| `github.com/eclipse/paho.mqtt.golang` | v1.5.0 | v1.5.1 | 1 |
| `klauspost/compress`, `buger/jsonparser`, `filippo.io/edwards25519`, `Azure/go-ntlmssp`, `go.etcd.io/etcd/client/pkg/v3` | — | latest fixed | 6 additional (non-reachable, defense-in-depth) |

All cascading transitive upgrades required by Go module version selection are
included in `go.mod` / `go.sum`.

### 3. CORS default hardened (behavior change)

Previously, an unconfigured server reflected *any* request origin together with
`Access-Control-Allow-Credentials: true`, allowing any website to issue
credentialed cross-origin requests to the server. The behavior is now:

- **Default (no origins configured):** non-credentialed wildcard —
  `Access-Control-Allow-Origin: *` with no credentials header.
- **Explicit origins configured** via `MINIO_API_CORS_ALLOW_ORIGIN`
  (comma-separated): those origins (wildcard patterns allowed) may issue
  credentialed cross-origin requests.

`TestCors` was updated to assert the new behavior and to fail if credentials are
ever re-enabled by default.

### 4. Upstream go-openapi packaging workaround

`go mod tidy` fails against the new `go-openapi` split modules because they
reference a package (`testify/v2/assert/yaml`) that was never published. This is
an upstream packaging bug. We pin it with the same `replace` directive that
`prometheus/prometheus` uses internally — documented with an explanatory
comment in `go.mod`.

### 5. CI and build infrastructure fixed

- `.github/workflows/vulncheck.yml` was **silently broken** — it installed
  `govulncheck@latest` on Go 1.24, which now requires Go 1.26. It now runs on
  Go 1.26.x so dependency regressions are caught on every PR.
- All CI workflows (`go`, `go-cross`, `go-lint`, `go-healing`, `go-resiliency`,
  `mint`) upgraded from Go 1.24.x to 1.26.x.
- Release Dockerfiles (`Dockerfile.release`, `Dockerfile.release.old_cpu`,
  `Dockerfile.hotfix`) upgraded from `golang:1.24-alpine` to `golang:1.26-alpine`.

### Verification (performed in Docker, go1.26.8)

- `go build ./...` — clean compile of the full tree
- Security test suite — all pass: `internal/{auth,jwt,crypto,config}` and the
  `cmd` signature/POST-policy/presigned/JWT/session-policy tests
- `govulncheck ./...` — **"No vulnerabilities found. Your code is affected by
  0 vulnerabilities."**
- Runtime smoke test — server boots, health endpoint returns 200, and CORS
  headers verified: arbitrary origins now receive `Access-Control-Allow-Origin: *`
  with no credentials header

**Known remaining item:** GO-2026-5932 is reported informationally; MinIO code does
not call the affected symbols and no upstream fix has been released yet.


## Deployment Security Recommendations

- **Always set `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`.** Without them the
  server starts with default `minioadmin:minioadmin` credentials.
- Enable TLS (certificates under `~/.minio/certs` or `--certs-dir`). HSTS and
  security headers (`X-Content-Type-Options`, `X-XSS-Protection`) are set on all
  responses.
- Set `MINIO_API_CORS_ALLOW_ORIGIN` only if browser clients require credentialed
  access to the S3 API.
- If the optional SFTP/FTP servers are enabled (`--sftp`, `--ftp`), restrict their
  network exposure — they present additional authenticated attack surface.
- **Disable the self-updater (`MINIO_UPDATE=off`).** `mc admin update` fetches
  binaries from the frozen legacy upstream release channel (`dl.min.io`), which
  no longer receives security fixes — it would replace a patched build with an
  unpatched 2024 binary. Rebuild from source (or replace the container image)
  to update.
- When deploying with the Helm chart, note that the default `image.tag` is the
  final legacy upstream binary release and does **not** contain these security
  fixes. Build your own image and set `image.repository` / `image.tag` (the
  chart sets `MINIO_UPDATE=off` for you).

## Install from Source

Requires [Go 1.26](https://golang.org/doc/install) or later.

```sh
git clone https://github.com/cbuntingde/minio.git
cd minio
go build
```

You can alternatively run `go build` and use the `GOOS` and `GOARCH` environment
variables to control the OS and architecture target:

```sh
env GOOS=linux GOARCH=arm64 go build
```

Start MinIO by running `minio server PATH` where `PATH` is any empty folder on
your local filesystem:

```sh
export MINIO_ROOT_USER=myadmin
export MINIO_ROOT_PASSWORD=my-secret-key
minio server /tmp/minio
```

## Build Docker Image

First [build MinIO from source](#install-from-source) and ensure the `minio`
binary exists in the project root, then:

```sh
docker build -t myminio:minio .
docker run -p 9000:9000 myminio:minio server /tmp/minio
```

## Install using Helm Charts

See the community-maintained [Helm charts](helm/minio) (instructions in the
folder-level README).

## Test MinIO Connectivity using `mc`

`mc` provides a modern alternative to UNIX commands like ls, cat, cp, mirror,
diff etc. It supports filesystems and Amazon S3 compatible cloud storage services.

```sh
mc alias set local http://localhost:9000 myadmin my-secret-key
mc admin info local
mc mb local/data
mc cp ~/Downloads/mydata local/data/
mc ls local/data/
```

## Explore Further

- [About this fork](docs/fork.md) — why it exists and what changed
- [Security](docs/security.md) — the audit, fixes, and verification evidence
- [Deploying this fork](docs/deploy.md) — source, Docker, and Helm builds
- [Security-relevant configuration](docs/configuration.md) — credentials, TLS, CORS, updates
- [Legacy upstream documentation](legacy-docs) — unmaintained, kept for reference

## Contribute to the MinIO Project

Please follow the MinIO [Contributor's Guide](CONTRIBUTING.md) for guidance on
making new contributions to the repository.

## License

- MinIO source is licensed under the [GNU AGPLv3](LICENSE).
- This fork's [documentation](docs) is part of the repository and covered by its license.
- The [legacy upstream documentation](legacy-docs) remains licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) as published by MinIO.
- [License Compliance](COMPLIANCE.md)

