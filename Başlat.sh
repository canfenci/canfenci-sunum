#!/usr/bin/env sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$PROJECT_DIR"

if command -v python3 >/dev/null 2>&1; then
  exec python3 scripts/serve.py
fi

printf '%s\n' "Python 3 bulunamadı. Pardus yazılım yöneticisinden Python 3 kurun."
printf '%s' "Kapatmak için Enter tuşuna basın..."
read -r _
