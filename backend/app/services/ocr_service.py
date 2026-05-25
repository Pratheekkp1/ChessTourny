"""
Handwritten chess score sheet OCR.

Pipeline (EasyOCR backend, the default):
  1. OpenCV  — denoise + adaptive threshold the score sheet photo
  2. CRAFT   — text region detection via EasyOCR (finds every handwritten token)
  3. TrOCR   — microsoft/trocr-base-handwritten reads each region in a single
               batched forward pass (this is the actual handwriting model)
  4. Layout  — spatial grouping into header fields and White/Black move columns
  5. Chess   — notation post-processing + python-chess validation

Optional backend (OCR_BACKEND=ollama in .env):
  Delegates to a local Ollama vision model — Claude-quality, requires Ollama running.
  See .env.example for setup instructions.

Models are downloaded once on first use and then cached by HuggingFace / EasyOCR.
Call warm_up_models() at startup to pre-download so the first real scan is instant.
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


# ─── Lazy model handles ───────────────────────────────────────────────────────

_easyocr_reader   = None   # CRAFT text detector
_trocr_processor  = None   # TrOCR feature extractor
_trocr_model      = None   # TrOCR encoder-decoder


def _get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr  # type: ignore
        except ImportError:
            raise RuntimeError("easyocr not installed. Run: pip install easyocr")
        logger.info("Loading CRAFT text detector (EasyOCR) — first run downloads ~300 MB …")
        _easyocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        logger.info("CRAFT ready.")
    return _easyocr_reader


def _get_trocr():
    global _trocr_processor, _trocr_model
    if _trocr_processor is None:
        try:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel  # type: ignore
        except ImportError:
            raise RuntimeError("transformers not installed. Run: pip install transformers")

        MODEL_ID = "microsoft/trocr-base-handwritten"
        logger.info(f"Loading TrOCR handwriting model ({MODEL_ID}) — first run ~300 MB …")
        _trocr_processor = TrOCRProcessor.from_pretrained(MODEL_ID)
        _trocr_model     = VisionEncoderDecoderModel.from_pretrained(MODEL_ID)
        _trocr_model.eval()
        logger.info("TrOCR ready.")
    return _trocr_processor, _trocr_model


def warm_up_models() -> None:
    """
    Pre-load and cache all OCR models.
    Call once at server startup so the first real scan is instant.
    Runs synchronously — intended to be called from a background thread at boot.
    """
    backend = getattr(settings, "ocr_backend", "easyocr").lower()
    if backend != "easyocr":
        logger.info(f"OCR backend is '{backend}' — skipping local model warm-up.")
        return

    logger.info("Warming up OCR models …")
    _get_easyocr_reader()
    _get_trocr()
    logger.info("OCR models warm-up complete.")


# ─── Chess notation helpers ───────────────────────────────────────────────────

RESULT_MAP: dict[str, str] = {
    "white won":  "white_won",
    "white_won":  "white_won",
    "1-0":        "white_won",
    "black won":  "black_won",
    "black_won":  "black_won",
    "0-1":        "black_won",
    "draw":       "draw",
    "½-½":        "draw",
    "1/2-1/2":    "draw",
    "1/2":        "draw",
}

# Ordered fixup rules: (regex_pattern, replacement)
_MOVE_FIXES: list[tuple[str, str]] = [
    (r"^0-0-0",     "O-O-O"),  # zero → O for queenside castle
    (r"^0-0",       "O-O"),    # zero → O for kingside castle
    (r"^\d+\.\s*",  ""),       # strip leading "1." or "3. "
    (r"\s+",        ""),       # no spaces inside a move token
    (r"\s*e\.p\.?$",""),       # drop trailing en-passant marker
]

_ANNOTATION_RE = re.compile(r"([!?]{1,2})$")
_MOVE_NUM_RE   = re.compile(r"^(\d{1,3})\.?$")


def _clean_move(raw: str) -> tuple[str, Optional[str]]:
    """Apply chess-specific corrections to one raw OCR string."""
    s = (raw or "").strip()
    if not s:
        return "", None

    ann = None
    m = _ANNOTATION_RE.search(s)
    if m:
        ann = m.group(1)
        s = s[: -len(ann)]

    for pattern, repl in _MOVE_FIXES:
        s = re.sub(pattern, repl, s)

    return s, ann


def _normalize_result(raw: str) -> str:
    return RESULT_MAP.get(raw.lower().strip(), "unknown")


def _normalize_date(raw: str) -> Optional[str]:
    """Convert M/D/YY or M-D-YYYY → YYYY-MM-DD."""
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


# ─── Image preprocessing ─────────────────────────────────────────────────────

_MAX_SIDE = 2800   # pixels — phone photos are often 12 MP+; cap for speed


def _load_and_orient(image_path: str) -> Image.Image:
    """
    Open an image with PIL, apply EXIF orientation, and downscale if needed.
    Phone photos arrive with EXIF rotation tags; OpenCV ignores them, causing
    90°/180°-rotated detection results.  PIL's ImageOps.exif_transpose fixes it.
    """
    from PIL import ImageOps
    pil = Image.open(image_path).convert("RGB")

    # Fix EXIF rotation (portrait shots, etc.)
    try:
        pil = ImageOps.exif_transpose(pil)
    except Exception:
        pass  # some images have no EXIF; that's fine

    # Downscale very large photos — CRAFT + TrOCR don't need 12 MP resolution
    w, h = pil.size
    if max(w, h) > _MAX_SIDE:
        scale = _MAX_SIDE / max(w, h)
        pil = pil.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
        logger.info(f"Resized {w}×{h} → {pil.size[0]}×{pil.size[1]} for OCR performance")

    return pil


def _preprocess(image_path: str) -> np.ndarray:
    """
    Load the score sheet, apply EXIF rotation + downscale, then enhance for
    handwriting detection (denoise + adaptive threshold).
    Returns an RGB numpy array ready for CRAFT.
    """
    try:
        import cv2  # type: ignore

        pil = _load_and_orient(image_path)
        img_rgb = np.array(pil)
        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

        gray   = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        gray   = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY,
            blockSize=31, C=10,
        )
        return cv2.cvtColor(thresh, cv2.COLOR_GRAY2RGB)

    except Exception as exc:
        logger.warning(f"Preprocessing failed ({exc}); falling back to raw PIL load.")
        return np.array(_load_and_orient(image_path))


# ─── TrOCR batched recognition ────────────────────────────────────────────────

def _pad_crop(crop_rgb: np.ndarray, padding: int = 8) -> Image.Image:
    """Add white padding around a crop so TrOCR has context at the edges."""
    h, w = crop_rgb.shape[:2]
    canvas = np.full((h + 2 * padding, w + 2 * padding, 3), 255, dtype=np.uint8)
    canvas[padding:padding + h, padding:padding + w] = crop_rgb
    return Image.fromarray(canvas)


def _recognize_batch(img_rgb: np.ndarray, detections: list[dict]) -> list[tuple]:
    """
    Run TrOCR on all detected text regions in one batched forward pass.

    detections: list of {x1, y1, x2, y2, cx, cy, easy_text}
    Returns:    list of (cx, cy, text, confidence)
    """
    import torch  # type: ignore

    processor, model = _get_trocr()

    pil_crops:     list[Image.Image] = []
    valid_regions: list[dict]        = []

    for det in detections:
        x1, y1, x2, y2 = det["x1"], det["y1"], det["x2"], det["y2"]
        crop = img_rgb[y1:y2, x1:x2]
        if crop.size == 0 or crop.shape[0] < 4 or crop.shape[1] < 4:
            continue
        pil_crops.append(_pad_crop(crop))
        valid_regions.append(det)

    if not pil_crops:
        return []

    # Process in chunks to stay within CPU memory limits
    CHUNK = 32
    all_texts: list[str] = []
    for i in range(0, len(pil_crops), CHUNK):
        chunk = pil_crops[i : i + CHUNK]
        pv = processor(images=chunk, return_tensors="pt", padding=True).pixel_values
        with torch.no_grad():
            generated = model.generate(pv, max_new_tokens=32, num_beams=2)
        all_texts.extend(processor.batch_decode(generated, skip_special_tokens=True))

    results: list[tuple] = []
    for det, text in zip(valid_regions, all_texts):
        clean = text.strip()
        # If TrOCR returned nothing, fall back to EasyOCR's own guess
        if not clean:
            clean = det.get("easy_text", "")
        results.append((det["cx"], det["cy"], clean, 0.9))

    return results


# ─── CRAFT detection via EasyOCR ─────────────────────────────────────────────

def _bbox_center(bbox) -> tuple[float, float]:
    """EasyOCR bbox: [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]"""
    xs = [p[0] for p in bbox]
    ys = [p[1] for p in bbox]
    return (sum(xs) / len(xs), sum(ys) / len(ys))


def _run_ocr_pipeline(
    image_path: str,
) -> tuple[list[tuple[float, float, str, float]], int, int]:
    """
    Stage 1 — CRAFT detects text regions.
    Stage 2 — TrOCR reads each region.

    Returns:
        (blocks, img_w, img_h)
        blocks  — flat list of (cx, cy, text, confidence)
        img_w/h — pixel dimensions of the preprocessed image that CRAFT ran on
                  (may differ from the original after EXIF rotation or downscale)
    """
    reader  = _get_easyocr_reader()
    img_rgb = _preprocess(image_path)
    img_h, img_w = img_rgb.shape[:2]   # preprocessed dimensions (post-rotate/resize)

    logger.info("CRAFT: detecting text regions …")
    raw = reader.readtext(img_rgb, detail=1)   # [(bbox, text, conf), ...]
    logger.info(f"CRAFT: {len(raw)} regions detected.")

    if not raw:
        return [], img_w, img_h

    # Build detection list with EasyOCR's own text as fallback
    detections: list[dict] = []
    for bbox, easy_text, easy_conf in raw:
        cx, cy = _bbox_center(bbox)
        xs = [p[0] for p in bbox]
        ys = [p[1] for p in bbox]
        x1, y1 = max(0, int(min(xs))), max(0, int(min(ys)))
        x2, y2 = int(max(xs)), int(max(ys))
        detections.append({
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "cx": cx, "cy": cy,
            "easy_text": easy_text,
        })

    logger.info("TrOCR: recognizing handwriting …")
    results = _recognize_batch(img_rgb, detections)
    logger.info(f"TrOCR: recognition complete ({len(results)} tokens).")
    return results, img_w, img_h


# ─── Layout analysis ─────────────────────────────────────────────────────────

def _parse_header(
    blocks: list[tuple[float, float, str, float]],
    img_w:  float,
) -> dict:
    """
    Extract game metadata from header text blocks.
    Concatenates all blocks into one string then regex-extracts known fields.
    The _STOP lookahead prevents any field from consuming the next label.
    """
    base = {
        "event": None, "date": None, "round": None, "board": None,
        "section": None, "opening": None, "pairing_no": None,
        "white_player": None, "black_player": None, "result": "unknown",
    }
    if not blocks:
        return base

    ordered = sorted(blocks, key=lambda b: (b[1], b[0]))
    text = " ".join(t for _, _, t, _ in ordered)
    logger.debug(f"Header text: {text!r}")

    # Stop capturing before the next known field label
    _STOP = r"(?=\s*(?:Event|Date|Round|Board|Section|Opening|Pairing|White|Black|Time|Result)\b|$)"

    def grep(*patterns: str) -> Optional[str]:
        for pat in patterns:
            m = re.search(pat, text, re.I)
            if m:
                return m.group(1).strip()
        return None

    base["event"]      = grep(r"Event[:\s]+([^\|/\[\]:]{2,50}?)" + _STOP,
                              r"Tournament[:\s]+([^\|/\[\]:]{2,50}?)" + _STOP)
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


def _parse_move_table(
    blocks:  list[tuple[float, float, str, float]],
    img_w:   float,
) -> tuple[list[dict], list[str]]:
    """
    Extract the move list from the tabular body of the score sheet.

    Score sheet column layout (all USCF / Chess4Life variants):
        [ move# ] [ White's move ] [ Black's move ]

    Steps:
    1. Group blocks into rows by approximate Y position.
    2. Find the move-number column from tokens that match \\d{1,3}.
    3. Split the remaining width at midpoint → White | Black.
    4. Assemble structured move dicts.
    """
    if not blocks:
        return [], ["No blocks in the move-table region."]

    warnings: list[str] = []

    # ── Row grouping ──────────────────────────────────────────────────────────
    ROW_TOL = max(img_w * 0.018, 14.0)
    rows: list[list[tuple]] = []
    current_row: list[tuple] = []
    current_y = blocks[0][1]

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

    # ── Column boundaries ─────────────────────────────────────────────────────
    move_num_xs: list[float] = []
    for row in rows:
        for cx, cy, text, conf in row:
            if _MOVE_NUM_RE.match(text.strip()):
                move_num_xs.append(cx)

    if move_num_xs:
        move_num_xs.sort()
        col_move_right = move_num_xs[len(move_num_xs) // 2] + img_w * 0.08
        remaining_w    = img_w - col_move_right
        col_white_x    = col_move_right + remaining_w * 0.50
    else:
        col_move_right = img_w * 0.12
        col_white_x    = img_w * 0.55
        warnings.append("Could not auto-detect move-number column; using fallback split.")

    # ── Move extraction ───────────────────────────────────────────────────────
    moves: list[dict] = []
    for row in rows:
        row_sorted = sorted(row, key=lambda b: b[0])
        move_no_text = ""
        white_parts:  list[str] = []
        black_parts:  list[str] = []

        for cx, cy, text, conf in row_sorted:
            if cx <= col_move_right:
                move_no_text = text
            elif cx <= col_white_x:
                white_parts.append(text)
            else:
                black_parts.append(text)

        mn_clean = re.sub(r"[^\d]", "", move_no_text)
        if not mn_clean:
            continue
        try:
            move_no = int(mn_clean)
        except ValueError:
            continue
        if not (1 <= move_no <= 150):
            continue

        white_san, white_ann = _clean_move(" ".join(white_parts))
        black_san, black_ann = _clean_move(" ".join(black_parts))

        if white_san or black_san:
            moves.append({
                "move_number":      move_no,
                "white":            white_san or None,
                "black":            black_san or None,
                "white_annotation": white_ann,
                "black_annotation": black_ann,
            })

    # Sort + deduplicate
    moves.sort(key=lambda m: m["move_number"])
    seen: set[int] = set()
    deduped: list[dict] = []
    for mv in moves:
        if mv["move_number"] not in seen:
            seen.add(mv["move_number"])
            deduped.append(mv)

    if not deduped:
        warnings.append("No moves extracted from the move-table region.")

    return deduped, warnings


# ─── Local model full pipeline ────────────────────────────────────────────────

def _parse_with_local_models(image_path: str) -> dict:
    """
    End-to-end local OCR: CRAFT detection → TrOCR recognition → layout parsing.
    Runs synchronously (call from executor to avoid blocking the event loop).

    We use the preprocessed image's dimensions (post-EXIF-rotate, post-resize)
    for layout math, because CRAFT bounding boxes are in that coordinate space.
    """
    logger.info(f"Local OCR: starting pipeline for {image_path}")

    blocks, img_w, img_h = _run_ocr_pipeline(image_path)
    if not blocks:
        return _empty_result(["No text detected in image."])

    # Split: top 28% = header region, rest = move table
    header_y      = img_h * 0.28
    header_blocks = [(cx, cy, t, c) for cx, cy, t, c in blocks if cy < header_y]
    table_blocks  = [(cx, cy, t, c) for cx, cy, t, c in blocks if cy >= header_y]

    metadata        = _parse_header(header_blocks, img_w)
    moves, warnings = _parse_move_table(table_blocks, img_w)

    logger.info(f"Local OCR: {len(moves)} moves, {len(warnings)} warning(s).")
    return {**metadata, "moves": moves, "warnings": warnings}


# ─── Ollama backend ───────────────────────────────────────────────────────────

_OLLAMA_PROMPT = """\
You are analyzing a handwritten chess score sheet photograph.

Return ONLY a single JSON object — no markdown, no explanation.

Schema:
{
  "event": null, "date": null, "round": null, "board": null,
  "section": null, "opening": null, "pairing_no": null,
  "white_player": null, "black_player": null,
  "result": "unknown",
  "moves": [
    {"move_number": 1, "white": "e4", "black": "e5",
     "white_annotation": null, "black_annotation": null}
  ],
  "warnings": []
}

Rules:
• date → YYYY-MM-DD or null
• result → "white_won" | "black_won" | "draw" | "unknown"
• Pieces: K Q R B N; pawns are just the square (e4 d5)
• Castling → "O-O" or "O-O-O" (capital letter O, not zero)
• Captures → x, Check → +, Mate → #
• Stop moves array when the written moves end
• Put uncertainties in "warnings"
"""


async def _parse_with_ollama(image_path: str) -> dict:
    """Delegate to a local Ollama vision model for high-accuracy extraction."""
    import httpx

    ollama_url   = getattr(settings, "ollama_url",   "http://localhost:11434")
    ollama_model = getattr(settings, "ollama_model", "llama3.2-vision")
    logger.info(f"Ollama OCR: model={ollama_model} @ {ollama_url}")

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
    raw = re.sub(r"^```(?:json)?\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    data = json.loads(raw)
    data["result"] = _normalize_result(str(data.get("result", "")))
    return data


# ─── Public API ───────────────────────────────────────────────────────────────

async def analyze_score_sheet(image_path: str) -> dict:
    """
    Extract structured game data from a handwritten chess score sheet image.

    Returned dict keys:
        event, date, round, board, section, opening, pairing_no,
        white_player, black_player, result, moves, warnings

    Each move: {move_number, white, black, white_annotation, black_annotation}
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    backend = getattr(settings, "ocr_backend", "easyocr").lower()

    if backend == "ollama":
        try:
            return await _parse_with_ollama(image_path)
        except Exception as exc:
            logger.warning(f"Ollama failed ({exc}); falling back to local models.")

    # Local pipeline is synchronous — run in a thread pool
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _parse_with_local_models, image_path)
