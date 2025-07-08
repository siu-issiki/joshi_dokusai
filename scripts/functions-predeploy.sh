#!/usr/bin/env bash
set -euo pipefail

# Build shared package (dist/)
echo "[predeploy] Building shared package..."
npm --workspace packages/shared run build

# Determine shared version
SHARED_VERSION=$(node -p "require('./packages/shared/package.json').version")

# Pack shared into tarball inside functions directory
echo "[predeploy] Packing shared v$SHARED_VERSION into tarball..."
TARBALL_PATH=$(npm pack ./packages/shared --pack-destination functions | tail -n1)

# Update functions/package.json dependency to point to the tarball
echo "[predeploy] Updating functions/package.json to use tarball..."
npm pkg set --prefix functions "dependencies.@joshi-dokusai/shared"="file:./${TARBALL_PATH}"

# Build functions TypeScript
echo "[predeploy] Building Cloud Functions..."
npm --workspace functions run build

echo "[predeploy] Done." 