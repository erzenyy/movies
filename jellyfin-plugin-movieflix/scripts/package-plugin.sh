#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_DIR="$ROOT_DIR/Jellyfin.Plugin.MovieFlix"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
PUBLISH_DIR="$ARTIFACTS_DIR/publish"
PACKAGE_NAME="${1:-movieflix-jellyfin}"
VERSION="${2:-0.1.0.0}"

rm -rf "$ARTIFACTS_DIR"
mkdir -p "$PUBLISH_DIR"

dotnet publish "$PROJECT_DIR/Jellyfin.Plugin.MovieFlix.csproj" -c Release -o "$PUBLISH_DIR"

pushd "$PUBLISH_DIR" >/dev/null
zip -r "../${PACKAGE_NAME}_${VERSION}.zip" .
popd >/dev/null

echo "Created: $ARTIFACTS_DIR/${PACKAGE_NAME}_${VERSION}.zip"
