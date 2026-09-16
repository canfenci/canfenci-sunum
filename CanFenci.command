#!/bin/bash
cd "$(dirname "$0")"

URL="http://127.0.0.1:4173"

# Port 4173 veya HTTP sunucusu halihazırda çalışıyor mu kontrol et
is_server_running() {
  if command -v curl >/dev/null 2>&1; then
    curl -s --connect-timeout 1 -m 2 "$URL" >/dev/null 2>&1 && return 0
  fi
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 4173 >/dev/null 2>&1 && return 0
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -i :4173 >/dev/null 2>&1 && return 0
  fi
  return 1
}

if is_server_running; then
  echo "CanFenci zaten çalışıyor: $URL"
  open "$URL"
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "HATA: Python 3 bulunamadı."
  echo "Lütfen macOS için Python 3 kurun."
  read -n 1 -s -r -p "Kapatmak için bir tuşa basın..."
  echo
  exit 1
fi

exec python3 scripts/serve.py
