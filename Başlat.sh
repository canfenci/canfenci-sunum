#!/usr/bin/env sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$PROJECT_DIR"

if command -v python3 >/dev/null 2>&1; then
  exec python3 scripts/serve.py
fi

if command -v python >/dev/null 2>&1; then
  exec python scripts/serve.py
fi

printf '%s\n' "HATA: Python 3 bulunamadı."
printf '%s\n' "- Pardus / Linux: Yazılım Yöneticisinden veya 'sudo apt install python3' ile yükleyin."
printf '%s\n' "- macOS: Terminal üzerinden python3 kurun."
printf '%s' "Kapatmak için Enter tuşuna basın..."
read -r _
