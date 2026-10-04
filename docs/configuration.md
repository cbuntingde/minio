# Security-Relevant Configuration

This page covers the configuration options that matter most for the security
posture of this fork. It is not an exhaustive list of all server options —
the upstream reference for those is preserved (unmaintained) in
[../legacy-docs](../legacy-docs).

## Root credentials

```sh
export MINIO_ROOT_USER=myadmin
export MINIO_ROOT_PASSWORD=my-secret-key
```

**Without these variables the server starts with `minioadmin:minioadmin`.**
Always set them in production.

## TLS

Place certificates in `~/.minio/certs/` (or pass `--certs-dir`). With TLS
enabled the server sets `Strict-Transport-Security` (max-age 1 year,
includeSubDomains), `X-Content-Type-Options: nosniff`, and
`X-XSS-Protection` on all responses. The minimum TLS version is 1.2 with a
secure cipher list; backward-compatible weaker ciphers require an explicit
opt-out (`MINIO_API_SECURE_CIPHERS=off`).

## CORS

Behavior in this fork (changed from upstream):

- **Default (no origins configured):** the server responds with a
  non-credentialed wildcard policy — `Access-Control-Allow-Origin: *` and no
  `Access-Control-Allow-Credentials` header. Any website can read public
  responses, but none can make *credentialed* cross-origin requests.
- **Explicit origins configured:** only those origins may make credentialed
  cross-origin requests.

```sh
export MINIO_API_CORS_ALLOW_ORIGIN="https://app.example.com,https://console.example.com"
```

Wildcard patterns such as `https://*.example.com` are supported. This matches
AWS S3 semantics, where cross-origin access is always opt-in.

## Self-update

```sh
export MINIO_UPDATE=off
```

`mc admin update` / the in-place self-updater downloads binaries from the
frozen legacy upstream channel (`dl.min.io`), which does not contain this
fork's security fixes. Keep it disabled (the Helm chart sets it by default)
and update by rebuilding from source. See [deploy.md](deploy.md#upgrade-policy).

## SFTP / FTP servers

The optional SFTP (`--sftp="address=:8022"`) and FTP (`--ftp`) servers expose
additional authenticated attack surface (the SFTP server's SSH stack was the
vector for 14 of the 55 audit findings in `x/crypto`). Keep them disabled or
firewalled unless required.

## Identity and KMS

External identity (LDAP/OIDC), TLS client-certificate STS, KMS/KES
integration, and site replication are supported as in upstream. Their
configuration reference is preserved in
[../legacy-docs/sts](../legacy-docs/sts),
[../legacy-docs/kms](../legacy-docs/kms) and related folders — treat it as
conceptually correct but unmaintained. If TLS certificate verification
skip flags (`MINIO_IDENTITY_TLS_SKIP_VERIFY`, LDAP `tls_skip_verify`) are
used, the server logs a production warning; avoid them.

## Reporting

Found a security issue? Follow [../SECURITY.md](../SECURITY.md).
