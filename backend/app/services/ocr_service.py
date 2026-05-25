"""
Open-source OCR for handwritten chess score sheets.

Two backends (set OCR_BACKEND in .env):
  easyocr  (default) — runs entirely locally; downloads ~300 MB of models on first use.
  ollama            — delegates to a local Ollama vision model for Claude-level accuracy.
                      Requires Ollama running with a vision model pulled:
                        brew install ollama && ollama serve
                        ollama pull llama3.2-vision   # or: moondream, qwen2.5vl
                      Then set OLLAMA_MODEL=llama3.2-vision in .env.

Both backends return the same structured dict so the rest of the app is unaffected.
"""

import asyncio
import base64
import json
import logging
import re
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


# ─── Chess notation constants & helpers ───────────────────────────────────────

RESULT_MAP: dict[str, str] = {
    "white won": "white_won",
    "white_won": "white_won",
    "1-0": "white_won",
    "black won": "black_won",
    "black_won": "black_won",
    "0-1": "black_won",
    "draw": "draw",
    "½-½": "draw",
    "1/2-1/2": "draw",
    "1/2": "draw",
}

# Common OCR misreads in chess notation and how to fix them
_MOVE_FIXES: list[tuple[str, str]] = [
    # Zero → letter-O for castling (must come first, anchored)
    (r"^0-0-0", "O-O-O"),
    (r"^0-0",   "O-O"),
    # lowercase l → 1 at the start (e.g. "l.e4" → "1.e4" handled upstream)
    (r"^l([a-h])", r"1\1"),
    # Stray move-number prefix like "1." before the move
    (r"^\d+\.\s*", ""),
    # Spaces inside a move token
    (r"\s+", ""),
    # Stray en-passant suffix
    (r"\s*e\.p\.?$", ""),
]

_ANNOTATION_RE = re.compile(r"([!?]{1,2})$")
_MOVE_NUM_RE   = re.compile(r"^(\d{1,3})\.?$")
_VALID_SAN_RE  = re.compile(
    r"^([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?[+#]?|O-O-O|O-O)[!?]{0,2}$"
)


def _clean_move(raw: str) -> tuple[str, Optional[str]]:
    """
    Apply chess-specific corrections to a raw OCR string.
    Returns (cleaned_san, annotation_or_None).
    """
    s = (raw or "").strip()
    if not s:
        return "", None

    # Pull off trailing annotation
    ann = None
    m = _ANNOTATION_RE.search(s)
    if m:
        ann = m.group(1)
        s = s[: -len(ann)]

    # Sequential fixups
    for pattern, replacement in _MOVE_FIXES:
        s = re.sub(pattern, replacement, s)

    return s, ann


def _normalize_result(raw: str) -> str:
    return RESULT_MAP.get(raw.lower().strip(), "unknown")


def _normalize_date(raw: str) -> Optional[str]:
    """M/D/YY or M-D-YYYY → YYYY-MM-DD, or return raw if unparseable."""
    if not raw:
        return None
    parts = re.split(r"[-/]", raw.strip())
    if len(parts) == 3:
        try:
            m, d, y = int(parts[0]), int(parts[1]), int(parts[2])
            if y < 100:
                y += 2000 if y < 50 else 1900
            return f"{y:04d}-{m:02d}-{d:02d}"
        except ValueError:
            pass
    return raw


def _empty_result(warnings: list[str]) -> dict:
    return {
        "event": None, "date": None, "round": None, "board": None,
        "section": None, "opening": None, "pairing_no": None,
        "white_player": None, "black_player": None,
        "result": "unknown", "moves": [], "warnings": warnings,
    }


# ─── EasyOCR backend ─────────────────────────────────────────────────────────

_easyocr_reader = None  # lazy-loaded


def _get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr  # type: ignore
        except ImportError:
            raise RuntimeError(
                "easyocr is not installed. Run:  pip install easyocr"
            )
        logger.info("Loading EasyOCR model (first run downloads ~300 MB) …")
        _easyocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        logger.info("EasyOCR ready.")
    return _easyocr_reader


def _bbox_center(bbox) -> tuple[float, float]:
    """EasyOCR bbox format: [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]"""
    xs = [p[0] for p in bbox]
    ys = [p[1] for p in bbox]
    return (sum(xs) / len(xs), sum(ys) / len(ys))


def _preprocess_image_for_ocr(image_path: str) -> np.ndarray:
    """
    Load and enhance a score sheet image for maximum OCR accuracy.
    Returns an RGB numpy array.
    """
    try:
        import cv2  # type: ignore
        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            raise ValueError("cv2.imread returned None")

        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # Mild denoising (preserves ink strokes)
        gray = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

        # Adaptive threshold — handles uneven lighting & shadows
        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY,
            blockSize=31, C=10,
        )

        # Convert back to RGB for EasyOCR
        return cv2.cvtColor(thresh, cv2.COLOR_GRAY2RGB)

    except Exception as exc:
        logger.warning(f"Image preprocessing failed ({exc}); using raw PIL load.")
        pil = Image.open(image_path).convert("RGB")
        return np.array(pil)


def _run_easyocr(image_path: str) -> list[tuple[float, float, str, float]]:
    """
    Run EasyOCR and return a flat list of (center_x, center_y, text, confidence).
    """
    reader = _get_easyocr_reader()
    img = _preprocess_image_for_ocr(image_path)

    try:
        raw = reader.readtext(img)
    except Exception:
        # Fallback: try on the original path
        raw = reader.readtext(image_path)

    blocks = []
    for bbox, text, conf in raw:
        cx, cy = _bbox_center(bbox)
        blocks.append((cx, cy, text.strip(), float(conf)))
    return blocks


# ── Header parsing ────────────────────────────────────────────────────────────

def _parse_header(
    blocks: list[tuple[float, float, str, float]],
    img_w: float,
) -> dict:
    """
    Extract game metadata from the header region of the score sheet.
    Approach: build a single string from all header blocks then regex-extract fields.
    """
    base = {
        "event": None, "date": None, "round": None, "board": None,
        "section": None, "opening": None, "pairing_no": None,
        "white_player": None, "black_player": None, "result": "unknown",
    }
    if not blocks:
        return base

    # Sort left→right, top→bottom; join into one searchable string
    ordered = sorted(blocks, key=lambda b: (b[1], b[0]))
    text = " ".join(t for _, _, t, _ in ordered)
    logger.debug(f"Header OCR text: {text!r}")

    # _LABEL_STOP matches any known field label prefix — used to prevent greedy
    # capture from running into the next field when blocks are concatenated.
    _STOP = r"(?=\s*(?:Event|Date|Round|Board|Section|Opening|Pairing|White|Black|Time|Result)\b|$)"

    def grep(*patterns: str) -> Optional[str]:
        for pat in patterns:
            m = re.search(pat, text, re.I)
            if m:
                return m.group(1).strip()
        return None

    base["event"]      = grep(
        r"Event[:\s]+([^\|/\[\]:]{2,50}?)" + _STOP,
        r"Tournament[:\s]+([^\|/\[\]:]{2,50}?)" + _STOP,
    )
    base["round"]      = grep(r"Round[:\s]*(\S+)")
    base["board"]      = grep(r"Board[:\s]*(\S+)")
    base["section"]    = grep(r"Section[:\s]+(\w[\w\s]{0,20}?)" + _STOP)
    base["opening"]    = grep(r"Opening[:\s]+([^\|/\[\]:]{2,40}?)" + _STOP)
    base["pairing_no"] = grep(r"Pairing\s*(?:No)?[:\s]*(\S+)")

    date_raw = grep(
        r"Date[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        r"(\d{1,2}[-/]\d{1,2}[-/]\d{4})",
    )
    if date_raw:
        base["date"] = _normalize_date(date_raw)

    base["white_player"] = grep(r"White[:\s]+([^\|/\[\]:]{2,50}?)" + _STOP)
    base["black_player"] = grep(r"Black[:\s]+([^\|/\[\]:]{2,50}?)" + _STOP)

    res_raw = grep(r"\b(1-0|0-1|½[-–]½|1/2-1/2|Draw|White\s+Won|Black\s+Won)\b")
    if res_raw:
        base["result"] = _normalize_result(res_raw)

    return base


# ── Move table parsing ────────────────────────────────────────────────────────

def _parse_move_table(
    blocks: list[tuple[float, float, str, float]],
    img_w: float,
) -> tuple[list[dict], list[str]]:
    """
    Extract the move list from the tabular region of the score sheet.

    All USCF-style score sheets share this 3-column layout:
        [ move# ][ white's move ][ black's move ]

    Algorithm:
    1. Group OCR blocks into rows by approximate Y position.
    2. Locate the move-number column (leftmost col containing "1", "2", … tokens).
    3. Split the remaining width at the midpoint → white column / black column.
    4. Assemble into structured move dicts.
    """
    if not blocks:
        return [], ["No blocks in the move-table region."]

    warnings: list[str] = []

    # ── Step 1: group into rows ───────────────────────────────────────────────
    ROW_TOL = max(img_w * 0.018, 14.0)  # blocks within this many px = same row
    rows: list[list[tuple]] = []
    current_row: list[tuple] = []
    current_y: float = blocks[0][1]

    for block in sorted(blocks, key=lambda b: (b[1], b[0])):
        cx, cy, text, conf = block
        if abs(cy - current_y) <= ROW_TOL:
            current_row.append(block)
        else:
            if current_row:
                rows.append(current_row)
            current_row = [block]
            current_y = cy
    if current_row:
        rows.append(current_row)

    # ── Step 2: locate the move-number column ────────────────────────────────
    move_num_xs: list[float] = []
    for row in rows:
        for cx, cy, text, conf in row:
            if _MOVE_NUM_RE.match(text.strip()):
                move_num_xs.append(cx)

    if move_num_xs:
        # Use median X of all detected move-number tokens
        move_num_xs.sort()
        col_move_right = move_num_xs[len(move_num_xs) // 2] + img_w * 0.08
        remaining_w    = img_w - col_move_right
        col_white_x    = col_move_right + remaining_w * 0.50   # midpoint → white/black boundary
    else:
        col_move_right = img_w * 0.12
        col_white_x    = img_w * 0.55
        warnings.append("Could not auto-detect move-number column; using fallback column split.")

    # ── Step 3: extract move pairs ────────────────────────────────────────────
    moves: list[dict] = []

    for row in rows:
        row_sorted = sorted(row, key=lambda b: b[0])

        move_no_text  = ""
        white_parts:  list[str] = []
        black_parts:  list[str] = []

        for cx, cy, text, conf in row_sorted:
            if cx <= col_move_right:
                move_no_text = text          # leftmost = move number
            elif cx <= col_white_x:
                white_parts.append(text)     # middle = white
            else:
                black_parts.append(text)     # right = black

        # Validate move number
        mn_clean = re.sub(r"[^\d]", "", move_no_text)
        if not mn_clean:
            continue
        try:
            move_no = int(mn_clean)
        except ValueError:
            continue
        if not (1 <= move_no <= 150):
            continue

        white_raw = " ".join(white_parts).strip()
        black_raw = " ".join(black_parts).strip()
        white_san, white_ann = _clean_move(white_raw)
        black_san, black_ann = _clean_move(black_raw)

        if white_san or black_san:
            moves.append({
                "move_number":      move_no,
                "white":            white_san or None,
                "black":            black_san or None,
                "white_annotation": white_ann,
                "black_annotation": black_ann,
            })

    # Sort and deduplicate
    moves.sort(key=lambda m: m["move_number"])
    seen: set[int] = set()
    deduped: list[dict] = []
    for mv in moves:
        if mv["move_number"] not in seen:
            seen.add(mv["move_number"])
            deduped.append(mv)

    if not deduped:
        warnings.append("No valid moves extracted from the move table region.")

    return deduped, warnings


# ── Full EasyOCR pipeline ─────────────────────────────────────────────────────

def _parse_with_easyocr(image_path: str) -> dict:
    """
    End-to-end EasyOCR extraction.  Runs synchronously (call from executor).
    """
    logger.info(f"EasyOCR: processing {image_path}")
    blocks = _run_easyocr(image_path)
    if not blocks:
        return _empty_result(["EasyOCR returned no text from this image."])

    pil = Image.open(image_path)
    img_w, img_h = pil.size

    # Separate header region (top 28%) from move table (rest)
    header_y = img_h * 0.28
    header_blocks = [(cx, cy, t, c) for cx, cy, t, c in blocks if cy < header_y]
    table_blocks  = [(cx, cy, t, c) for cx, cy, t, c in blocks if cy >= header_y]

    metadata         = _parse_header(header_blocks, img_w)
    moves, warnings  = _parse_move_table(table_blocks, img_w)

    logger.info(f"EasyOCR: extracted {len(moves)} moves, {len(warnings)} warnings")
    return {**metadata, "moves": moves, "warnings": warnings}


# ─── Ollama backend ───────────────────────────────────────────────────────────

_OLLAMA_PROMPT = """\
You are analyzing a handwritten chess score sheet photograph.

Extract everything and return ONLY a single JSON object — no markdown, no explanation.

Schema:
{
  "event": null,
  "date": null,
  "round": null,
  "board": null,
  "section": null,
  "opening": null,
  "pairing_no": null,
  "white_player": null,
  "black_player": null,
  "result": "unknown",
  "moves": [
    {
      "move_number": 1,
      "white": "e4",
      "black": "e5",
      "white_annotation": null,
      "black_annotation": null
    }
  ],
  "warnings": []
}

Rules:
• date → YYYY-MM-DD or null
• result → one of: "white_won", "black_won", "draw", "unknown"
• moves → SAN notation; pieces K Q R B N; pawn moves are just the square (e4, d5)
• Castling → "O-O" or "O-O-O" (capital letter O, not zero)
• Captures → "x", Check → "+", Mate → "#"
• Stop the moves array when the written moves end
• Put any uncertainties in "warnings"
"""


async def _parse_with_ollama(image_path: str) -> dict:
    """
    Delegate OCR to a locally running Ollama vision model.
    Model and URL are configured via OLLAMA_MODEL / OLLAMA_URL in .env.
    """
    import httpx  # already in requirements

    ollama_url   = getattr(settings, "ollama_url",   "http://localhost:11434")
    ollama_model = getattr(settings, "ollama_model", "llama3.2-vision")

    logger.info(f"Ollama OCR: model={ollama_model} url={ollama_url}")

    with open(image_path, "rb") as f:
        image_b64 = base64.standard_b64encode(f.read()).decode()

    payload = {
        "model":  ollama_model,
        "prompt": _OLLAMA_PROMPT,
        "images": [image_b64],
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(f"{ollama_url}/api/generate", json=payload)
        resp.raise_for_status()

    raw = resp.json().get("response", "").strip()

    # Strip markdown fences if the model added them
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$",          "", raw)

    data = json.loads(raw)
    data["result"] = _normalize_result(str(data.get("result", "")))
    return data


# ─── Public interface ─────────────────────────────────────────────────────────

async def analyze_score_sheet(image_path: str) -> dict:
    """
    Extract structured game data from a handwritten chess score sheet image.

    Backend priority:
      1. If OCR_BACKEND=ollama  → try Ollama; fall back to EasyOCR on failure
      2. If OCR_BACKEND=easyocr (default) → EasyOCR only

    Returns a dict with keys:
      event, date, round, board, section, opening, pairing_no,
      white_player, black_player, result, moves, warnings
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    backend = getattr(settings, "ocr_backend", "easyocr").lower()

    if backend == "ollama":
        try:
            return await _parse_with_ollama(image_path)
        except Exception as exc:
            logger.warning(f"Ollama backend failed ({exc}); falling back to EasyOCR.")

    # EasyOCR is synchronous — run in a thread pool so we don't block the event loop
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _parse_with_easyocr, image_path)
