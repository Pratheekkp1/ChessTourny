#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
  echo "Creating virtualenv..."
  python3 -m venv venv
  venv/bin/pip install -r requirements.txt
fi

if [ ! -f ".env" ]; then
  echo "No .env found — copy .env.example and add your ANTHROPIC_API_KEY"
  exit 1
fi

venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
