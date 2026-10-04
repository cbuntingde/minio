# MinIO Fork Documentation

This directory contains the authoritative documentation for the
**security-hardened community fork** of MinIO.

| Document | Contents |
| --- | --- |
| [fork.md](fork.md) | About this fork: why it exists, what changed, maintenance stance |
| [security.md](security.md) | The October 2026 security audit: findings, fixes, verification, evidence |
| [deploy.md](deploy.md) | Building and deploying: source, Docker, Helm, upgrade policy |
| [configuration.md](configuration.md) | Security-relevant configuration: credentials, TLS, CORS, updates, SFTP/FTP |

For quick orientation, the repository [README](../README.md) summarizes the
fork's changes and how to get started.

The upstream project's original documentation is preserved, unmodified, in
[../legacy-docs](../legacy-docs). It is **not maintained** and may be
inaccurate for this fork — read its warning notice before using it.

## Documentation Conventions

- Documentation for this fork lives here and in the repository README only.
- Code, error messages, and the server startup banner refer to these pages.
- Pull requests that change server behavior should update these pages in the
  same PR (see the repository PR template).
