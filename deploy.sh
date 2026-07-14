#!/bin/bash
# Publica o AIA na Vercel.
#   ./deploy.sh          -> deploy de produção (site oficial)
#   ./deploy.sh preview  -> deploy de preview (link de teste, não afeta produção)
set -e

cd "$(dirname "$0")"

if [ "$1" = "preview" ]; then
  echo "==> Publicando PREVIEW..."
  vercel --scope hexxa-s-projects
else
  echo "==> Publicando em PRODUÇÃO..."
  vercel --prod --scope hexxa-s-projects
fi
