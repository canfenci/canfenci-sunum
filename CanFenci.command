#!/bin/bash
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "HATA: Python 3 bulunamadı."
  echo "Lütfen macOS için Python 3 kurun."
  read -n 1 -s -r -p "Kapatmak için bir tuşa basın..."
  echo
  exit 1
fi

python3 scripts/serve.py
