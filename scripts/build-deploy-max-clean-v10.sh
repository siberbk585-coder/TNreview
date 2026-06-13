#!/usr/bin/env bash
# Build deploy-max-clean-v10.zip for TNreview (Layout B — no npm build)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="v10"
DEPLOY_DIR="deploy-max-clean-${VERSION}"
ZIP_FILE="${DEPLOY_DIR}.zip"
DEPLOY_DOC="DEPLOY-max-clean-${VERSION}.md"

cd "$ROOT"

echo "==> Detect stack (Layout B)"
test -f server.js
test -f index.html
test -f package.json
test -f app.js
test -f app.cjs
test -d form5-dist
node -e "const p=require('./package.json'); if(!p.scripts?.start) process.exit(1)"
echo "    npm start -> node server.js"

echo "==> Clean old artifacts"
rm -rf "$DEPLOY_DIR" "$ZIP_FILE"

echo "==> Create $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cp server.js app.js app.cjs index.html package.json "$DEPLOY_DIR/"
cp -R form5-dist "$DEPLOY_DIR/"
[[ -f .env.example ]] && cp .env.example "$DEPLOY_DIR/"
[[ -f .htaccess ]] && cp .htaccess "$DEPLOY_DIR/"
[[ -f htaccess.txt ]] && cp htaccess.txt "$DEPLOY_DIR/"
if [[ -f "$DEPLOY_DOC" ]]; then
  cp "$DEPLOY_DOC" "$DEPLOY_DIR/DEPLOY.md"
else
  echo "WARN: $DEPLOY_DOC not found" >&2
fi

find "$DEPLOY_DIR" -name .DS_Store -delete 2>/dev/null || true

echo "==> Validate"
test -f "$DEPLOY_DIR/index.html"
test -f "$DEPLOY_DIR/server.js"
test -f "$DEPLOY_DIR/app.cjs"
test -f "$DEPLOY_DIR/app.js"
test -f "$DEPLOY_DIR/form5-dist/index.html"
! find "$DEPLOY_DIR" \( -name node_modules -o -name .env -o -name .env.local \) | grep -q .

echo "==> Zip $ZIP_FILE"
zip -r -q "$ZIP_FILE" "$DEPLOY_DIR"
ls -lh "$ZIP_FILE"
echo "Done: $ROOT/$ZIP_FILE"
