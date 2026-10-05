#!/usr/bin/env pwsh
# Sync the vendored console tree in this repository from the private console
# repository, then build and serve the result so the branding can be checked
# before anything is committed.
#
# The console is vendored rather than resolved as a module on purpose:
#
#   - a filesystem replace needs no token, no GOPRIVATE entry and no go.sum
#     churn, so the build works the same in CI and on a laptop
#   - the console source has to be in the build context anyway, because the
#     console an image serves is the prebuilt web-app/build bundle embedded via
#     //go:embed in the console's web-app/assets.go
#
# The private repository at github.com/cbuntingde/minio-console is the source
# of truth. Upstream github.com/minio/console is no longer publicly accessible,
# so this vendored copy is the only place the console exists in a buildable
# form.
#
# Usage:
#   pwsh hack/sync-console.ps1              # sync and build, do not serve
#   pwsh hack/sync-console.ps1 -Serve       # sync, build, and serve on 19200/19201

[CmdletBinding()]
param(
  [string]$Source = "C:\ai-development\minio-console",
  [string]$Destination = (Join-Path (Split-Path -Parent $PSScriptRoot) "console"),
  [switch]$Serve,
  [int]$ApiPort = 19200,
  [int]$ConsolePort = 19201
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path (Join-Path $Source ".git"))) {
  throw "Source '$Source' is not a git checkout. Clone https://github.com/cbuntingde/minio-console (private) first."
}

Write-Host "syncing $Source -> $Destination"
if (Test-Path $Destination) {
  # Remove the tree so deleted files upstream do not linger here.
  Remove-Item $Destination -Recurse -Force
}
# /XD .git node_modules - the console's own history and its dev dependencies
# have no business in the fork, and node_modules is not present anyway because
# the frontend cannot be built: its mds dependency is unobtainable.
& robocopy $Source $Destination /E /XD ".git" "node_modules" /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

$files = (Get-ChildItem $Destination -Recurse -File | Measure-Object).Count
Write-Host "synced $files files"

# Build in a Linux container so the toolchain matches the published image, and
# so no Go install is needed on the host.
$repo = Split-Path -Parent $PSScriptRoot
$cmd = "CGO_ENABLED=0 go build -tags kqueue -trimpath -o /tmp/minio ."
if ($Serve) {
  $cmd = "CGO_ENABLED=0 go build -tags kqueue -trimpath -o /tmp/minio . && mkdir -p /data && exec /tmp/minio server /data --console-address :9001"
}

$dockerArgs = @(
  "run", "--rm"
)
if ($Serve) {
  $dockerArgs += @("-d", "--name", "minio-forked-test",
    "-p", "${ApiPort}:9000", "-p", "${ConsolePort}:9001",
    "-e", "MINIO_ROOT_USER=demouser", "-e", "MINIO_ROOT_PASSWORD=demo-password-123")
}
$dockerArgs += @(
  "-v", "${repo}:/src",
  "-v", "minio-gocache:/root/.cache/go-build",
  "-v", "minio-gomodcache:/go/pkg/mod",
  "-w", "/src",
  "--entrypoint", "sh", "golang:1.26-alpine", "-c", $cmd
)

& docker @dockerArgs
if ($LASTEXITCODE -ne 0) { throw "docker build failed with exit code $LASTEXITCODE" }

if ($Serve) {
  Write-Host ""
  Write-Host "console: http://127.0.0.1:$ConsolePort   (demouser / demo-password-123)"
  Write-Host "api:     http://127.0.0.1:$ApiPort"
  Write-Host "stop with: docker rm -f minio-forked-test"
}
