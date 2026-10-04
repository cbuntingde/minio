# Deploying This Fork

The fork is distributed **as source only** — there are no official pre-compiled
binaries or container images. Building from source is the only supported
distribution, which guarantees you get the patched toolchain and dependencies.

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
> The chart's default `image.tag` is the final legacy upstream binary release
> (`RELEASE.2024-12-18T13-15-44Z`) and does **not** contain this fork's
> security fixes. Build your own image (see above) and set `image.repository`
> and `image.tag` to it before deploying. The chart sets `MINIO_UPDATE=off`
> so the server never self-updates to an unpatched binary.

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
