# Legacy Upstream Documentation

> [!WARNING]
> **These documents are NOT maintained and may be inaccurate for this fork.**

This directory contains the documentation of the original MinIO community
repository, frozen at the point the upstream project was archived. It is kept
for three reasons:

1. **Historical reference** — the concepts (erasure coding, replication,
   lifecycle, IAM, etc.) still apply to this fork's codebase.
2. **Functional test scripts** — several `make` verification targets invoke
   test scripts that live in this tree (see the `Makefile`). These scripts are
   still used by CI and remain functional.
3. **Debugging tools** — the sample programs under `debugging/` are still used
   to inspect server data.

However, this content was written for the archived upstream product and may
describe features, default behaviors, endpoints, or binaries that do not match
this security-hardened fork. Notable examples:

- Instructions that download pre-compiled binaries from `dl.min.io` — these
  are **frozen legacy releases that do not contain this fork's security fixes**.
- References to the embedded Console web UI.
- CORS behavior (see [../legacy-docs/configuration.md](../legacy-docs/configuration.md)) —
  this fork ships a hardened non-credentialed wildcard default.
- References to the upstream self-updater — this fork disables it
  (`MINIO_UPDATE=off`).

**Authoritative documentation for this fork lives in [../docs](../docs).**

The content in this directory remains licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) as originally
published by MinIO.
