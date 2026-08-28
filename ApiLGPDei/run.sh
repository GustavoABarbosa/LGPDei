#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if command -v py >/dev/null 2>&1; then
  exec py -3.12 -m app
elif command -v python3 >/dev/null 2>&1; then
  exec python3 -m app
else
  echo "Python not found."
  exit 1
fi
