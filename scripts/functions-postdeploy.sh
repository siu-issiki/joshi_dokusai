#!/usr/bin/env bash
set -euo pipefail

echo "[postdeploy] Cleaning up tarball and restoring package.json..."

# Remove packed tarball inside functions directory
TARBALL_PATTERN="joshi-dokusai-shared-*.tgz"
rm -f functions/${TARBALL_PATTERN} || true

# Restore dependency to workspace reference so that local dev keeps working
npm pkg set --prefix functions "dependencies.@joshi-dokusai/shared"="file:../packages/shared"

echo "[postdeploy] Cleanup finished." 