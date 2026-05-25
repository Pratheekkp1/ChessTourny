#!/bin/bash
set -e
cd "$(dirname "$0")"

# ── Virtualenv setup ─────────────────────────────────────────────────────────
if [ ! -d "venv" ]; then
  echo "Creating virtualenv…"
  python3 -m venv venv
fi

# Always sync deps so new packages are installed after a git pull
echo "Installing / updating dependencies…"
venv/bin/pip install -q -r requirements.txt

# ── .env check ───────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo ""
  echo "  No .env file found."
  echo "  Copy the example and edit if needed:"
  echo "    cp .env.example .env"
  echo ""
  echo "  Defaults work fine for local dev (OCR_BACKEND=easyocr)."
  echo "  EasyOCR will download its models (~300 MB) on the first scan."
  echo ""
  cp .env.example .env
  echo "  Created .env from .env.example — starting with defaults."
fi

# ── Start server ─────────────────────────────────────────────────────────────
echo ""
echo "Starting ChessTourny backend on http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""
venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
