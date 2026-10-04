# Deploying This Fork

This fork is distributed **as source**: there are no pre-compiled binaries, and
the only container images that contain the fork's fixes are built from this
source (see [Docker](#docker)). Building from source guarantees that you get the
patched toolchain and dependencies.

## Upgrade policy

- **Never use `mc admin update` (self-update).** It fetches binaries from the
  frozen legacy upstream channel (`dl.min.io`) which does not contain this
  fork's security fixes — it would *downgrade* your security.
- Set `MINIO_UPDATE=off` (the Helm chart sets it by default).
- To update, pull the latest `master`, rebuild, and restart — or replace the
  container image.

## Install from source

Requires [Go 1.26](https://golang.org/doc/install) or later.

```sh
git clone https://github.com/cbuntingde/minio.git
cd minio
go build
```

Or build with a specific target:

```sh
env GOOS=linux GOARCH=arm64 go build
```

Run it (always set root credentials — see
[configuration.md](configuration.md#root-credentials)):

```sh
export MINIO_ROOT_USER=myadmin
export MINIO_ROOT_PASSWORD=my-secret-key
minio server /tmp/minio
```

## Docker

Pre-built multi-arch images (linux/amd64, linux/arm64) are published to GitHub
Container Registry by the
[`Publish Container Image`](../.github/workflows/publish-image.yml) workflow:

```sh
docker run -p 9000:9000 \
  -e MINIO_ROOT_USER=myadmin -e MINIO_ROOT_PASSWORD=my-secret-key \
  ghcr.io/cbuntingde/minio:master server /tmp/minio
```

Tags: `:master` tracks the fork's main branch; pushing a version tag builds
`:<tag>` and `:latest`.

### Publishing images to GHCR

The publish workflow authenticates with the repository's `GITHUB_TOKEN`. GHCR
only grants that token push access to a package that is **linked to this
repository**, and only a first publish *from* this repository creates that link.
If `ghcr.io/cbuntingde/minio` already exists from an earlier push made with
different credentials, publishing fails with:

```text
ERROR: failed to push ghcr.io/cbuntingde/minio:master: denied: permission_denied: write_package
```

GHCR does not grant push for an unlinked package, and it also refuses package
names that match no repository, so renaming the image does not help. The
`Verify GHCR push access` job detects this before the build (`~5s` instead of
after a full multi-arch build) and prints both fixes:

1. Grant this repository write access to the existing package:
   <https://github.com/users/cbuntingde/packages/container/minio/settings> →
   *Manage Actions access* → *Add Repository* → `cbuntingde/minio` → Role **Write**.
2. Or create a personal access token (classic) with the `write:packages` scope,
   store it as the repository secret `GHCR_TOKEN`, and let the workflow use it —
   the login steps prefer `GHCR_TOKEN` over `GITHUB_TOKEN`.

To build the image from source yourself (the multi-stage
[`Dockerfile.source`](../Dockerfile.source)):

```sh
docker build -f Dockerfile.source -t myminio:minio .
docker run -p 9000:9000 myminio:minio server /tmp/minio
```

> [!IMPORTANT]
> The legacy `Dockerfile`, `Dockerfile.release`, `Dockerfile.release.old_cpu`
> and `Dockerfile.hotfix` do **not** build from source — they download the
> frozen upstream binary from `dl.min.io` and therefore do not contain this
> fork's security fixes. Use `Dockerfile.source`.

## Helm / Kubernetes

The community chart is in [`helm/minio`](../helm/minio).

> [!IMPORTANT]
> The chart's default image is `ghcr.io/cbuntingde/minio:master`, built from this
> fork's source. Do not override `image.repository` / `image.tag` with legacy
> `RELEASE.*` tags or `quay.io/minio/*` images: those are frozen upstream builds
> without this fork's security fixes. The chart sets `MINIO_UPDATE=off` so the
> server never self-updates to an unpatched binary.

## Verifying a deployment

```sh
mc alias set local http://localhost:9000 myadmin my-secret-key
mc admin info local
mc mb local/data
mc cp ~/Downloads/mydata local/data/
mc ls local/data/
```

## Deployment checklist

- [ ] Root credentials set (`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`)
- [ ] TLS enabled
- [ ] `MINIO_UPDATE=off`
- [ ] `MINIO_API_CORS_ALLOW_ORIGIN` configured only if browser clients need
      credentialed access
- [ ] SFTP/FTP servers firewalled unless explicitly needed
- [ ] Image/binary built from current `master` of this repository
