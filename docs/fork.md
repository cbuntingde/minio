# About This Fork

## Why this fork exists

The upstream [MinIO](https://github.com/minio/minio) community repository was
archived and is no longer maintained. Its final binary release
(`RELEASE.2024-12-18T13-15-44Z`) is frozen and no longer receives security
updates — neither for its dependencies nor for the Go toolchain it was built
with. Because MinIO remains widely deployed, this fork exists to keep the
community edition **secure and buildable**.

## What this fork is

This is a **security-first maintenance fork**. Its priorities, in order:

1. **Security** — patch reachable vulnerabilities (code, dependencies, Go
   toolchain), and prevent regressions with a CI `govulncheck` gate.
2. **Buildability** — keep the source tree compiling with a current, supported
   Go toolchain.
3. **Compatibility** — remain a drop-in S3-compatible replacement for existing
   community-edition deployments.

It is *not* a feature fork: new features from the commercial AIStor product are
not backported. See the upstream alternatives
([AIStor Free](https://min.io/download) / [AIStor Enterprise](https://min.io/pricing))
if you need those.

## What changed relative to upstream

The fork diverges from the final upstream state in October 2026 with a
comprehensive security remediation:

- **Toolchain**: Go 1.24.8 → Go 1.26.8 (resolves ~20 reachable Go
  standard-library vulnerabilities). See [security.md](security.md).
- **Dependencies**: 10+ modules upgraded, eliminating 55 vulnerabilities
  reachable from MinIO code — including 14 in `golang.org/x/crypto/ssh`
  reachable through the embedded SFTP server.
- **CORS hardening** (behavior change): the default is now a non-credentialed
  wildcard policy instead of reflecting any origin with credentials. See
  [configuration.md](configuration.md#cors).
- **Self-updater**: documented as disabled — `mc admin update` fetches frozen,
  unpatched legacy binaries from `dl.min.io`. See
  [deploy.md](deploy.md#upgrade-policy).
- **CI**: all workflows run on Go 1.26.x and a `govulncheck` gate runs on every
  push and pull request.
- **Docs**: this `docs/` tree is the fork's own documentation; the upstream
  docs are preserved in [../legacy-docs](../legacy-docs).

## Verification

Every change above was verified in Docker (`golang:1.26`): full-tree build,
the signature/policy/JWT/crypto security test suites, a runtime smoke test,
and `govulncheck` reporting **zero reachable vulnerabilities**. Evidence:
[`security-audit-vulncheck-BEFORE.txt`](../security-audit-vulncheck-BEFORE.txt)
and
[`security-audit-vulncheck-AFTER.txt`](../security-audit-vulncheck-AFTER.txt).

## Support and licensing

The code remains licensed under the [GNU AGPLv3](../LICENSE), same as
upstream. Support is community-driven via GitHub issues. Security reports
follow [SECURITY.md](../SECURITY.md). The fork carries no warranty — running
it is at your own risk, per AGPLv3.

MinIO is a trademark of MinIO, Inc. This fork is not affiliated with or
endorsed by MinIO, Inc.
