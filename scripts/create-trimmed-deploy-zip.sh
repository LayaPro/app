#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT_DIR/flomingo-deploy-trim.zip"

cd "$ROOT_DIR"

echo "Creating trimmed deploy bundle: $OUT"

if [ ! -d "api/services" ]; then
  echo "Error: api/services not found" >&2
  exit 1
fi

if [ ! -d "packages/shared" ]; then
  echo "Error: packages/shared not found" >&2
  exit 1
fi

rm -f "$OUT"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

mkdir -p "$TMPDIR/api/services"
mkdir -p "$TMPDIR/packages/shared"

# Copy service and shared package (preserve structure)
cp -a api/services/. "$TMPDIR/api/services/"
cp -a packages/shared/. "$TMPDIR/packages/shared/"

# Place the service Dockerfile at the archive root inside the temp dir
if [ -f api/services/Dockerfile ]; then
  cp api/services/Dockerfile "$TMPDIR/Dockerfile"
fi

# Create zip from temp dir, excluding node_modules/dist/.git
pushd "$TMPDIR" >/dev/null
zip -r "$OUT" . -x "*/node_modules/*" "*/dist/*" ".git/*" >/dev/null
popd >/dev/null

echo "Created $OUT"
unzip -l "$OUT" | sed -n '1,200p'

echo "Trimmed bundle ready: $OUT"
