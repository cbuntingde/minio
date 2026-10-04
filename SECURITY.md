# Security Policy

This repository is a **security-maintained community fork** of MinIO. The
upstream project is no longer maintained, so security fixes for this fork are
developed and released here. The original upstream policy is preserved at
[`SECURITY.md.orig`](SECURITY.md.orig).

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `master` branch of this fork | ✅ Yes |
| Legacy upstream binary releases (dl.min.io, `RELEASE.*` tags) | ❌ No — frozen since December 2024, contain known unpatched vulnerabilities |

Always run builds made from the latest `master` of this repository. Do **not**
use the self-updater (`mc admin update`) — it fetches frozen, unpatched legacy
binaries from `dl.min.io`. Rebuild from source to update, and set
`MINIO_UPDATE=off` to disable the update check.

## Reporting a Vulnerability

Report security vulnerabilities in this repository **privately via GitHub
Security Advisories**: use the "Report a vulnerability" option on this
repository's [Security tab](https://github.com/cbuntingde/minio/security/advisories).
This keeps your report private to the maintainers and allows a coordinated
disclosure with a CVE if warranted.

Please provide a detailed explanation of the issue, in particular:

- The component/file affected and the conditions required to exploit it.
- The type of security issue (DoS, authentication bypass, information
  disclosure, privilege escalation, ...).
- The assumptions your exploit makes (e.g. whether valid access credentials
  are required).

If GitHub private reporting is unavailable to you, open a regular issue marked
**"security-sensitive"** without exploit details, and maintainers will
provide a private channel.

### Disclosure Process

1. A maintainer verifies and reproduces the issue and assesses its impact.
2. The maintainer responds and either confirms or rejects the report; a
   rejection includes the reasoning.
3. Related code is audited for similar problems.
4. A fix is prepared and lands on `master`.
5. On the date the fix lands, a GitHub Security Advisory is published on this
   repository. Reporters are credited in the advisory unless they prefer to
   remain anonymous.

Dependency vulnerabilities are tracked continuously: CI runs
`govulncheck` on every pull request and push (`.github/workflows/vulncheck.yml`),
and audits are re-run against the current toolchain.
