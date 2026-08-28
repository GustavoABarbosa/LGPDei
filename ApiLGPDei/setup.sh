#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if command -v py >/dev/null 2>&1; then
  PYTHON="py -3.12"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON="python3"
else
  echo "Python not found. Install Python 3.12+ and retry."
  exit 1
fi

$PYTHON -m pip install -e ".[dev]"
echo ""
echo "Dependencies installed. Start the API with:"
echo "  $PYTHON run.py"
