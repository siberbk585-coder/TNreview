#!/usr/bin/env bash
# Build deploy-max-clean-v8.zip for TNreview (no npm build — runtime-only copy)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="v8"
DEPLOY_DIR="deploy-max-clean-${VERSION}"
ZIP_FILE="${DEPLOY_DIR}.zip"

cd "$ROOT"

echo "==> Detect stack"
test -f server.js
test -f index.html
test -f package.json
test -d form5-dist
node -e "const p=require('./package.json'); if(!p.scripts?.start) process.exit(1)"
echo "    Node app: npm start -> node server.js (no build step)"

echo "==> Clean old artifacts"
rm -rf "$DEPLOY_DIR" "$ZIP_FILE"

echo "==> Create $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cp server.js app.js app.cjs index.html package.json "$DEPLOY_DIR/"
cp -R form5-dist "$DEPLOY_DIR/"
if [[ -f .env.example ]]; then
  cp .env.example "$DEPLOY_DIR/"
fi
if [[ -f .htaccess ]]; then
  cp .htaccess "$DEPLOY_DIR/"
fi
# Bản nhìn thấy được — cPanel thường ẩn file .htaccess sau khi giải nén
if [[ -f htaccess.txt ]]; then
  cp htaccess.txt "$DEPLOY_DIR/"
fi
cp DEPLOY-max-clean-v8.md "$DEPLOY_DIR/DEPLOY.md"

echo "==> Validate"
test -f "$DEPLOY_DIR/index.html"
test -f "$DEPLOY_DIR/server.js"
test -f "$DEPLOY_DIR/app.cjs"
test -f "$DEPLOY_DIR/app.js"
test -f "$DEPLOY_DIR/form5-dist/index.html"
if [[ -d "$DEPLOY_DIR/node_modules" ]]; then
  echo "ERROR: node_modules must not be in package" >&2
  exit 1
fi
if find "$DEPLOY_DIR" -name '.env' -o -name '.env.local' | grep -q .; then
  echo "ERROR: secret env files in package" >&2
  exit 1
fi

echo "==> Zip $ZIP_FILE"
zip -r -q "$ZIP_FILE" "$DEPLOY_DIR"
ls -lh "$ZIP_FILE"
echo "Done: $ROOT/$ZIP_FILE"
