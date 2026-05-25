"""
Uses Claude Vision to extract moves and metadata from a handwritten chess score sheet.
The score sheet follows the USCF Official Score Sheet format.
"""
import base64
import json
import re
from pathlib import Path
import anthropic
from app.config import settings


SCORE_SHEET_PROMPT = """You are analyzing a handwritten USCF (US Chess Federation) official score sheet photo.

Extract ALL of the following information and return it as a JSON object:

1. Header metadata:
   - event: the event/tournament name (string or null)
   - date: game date in YYYY-MM-DD format (string or null)
   - round: round number (string or null)
   - board: board number (string or null)
   - section: section name (string or null)
   - opening: opening name if written (string or null)
   - pairing_no: pairing number (string or null)
   - white_player: name of the White player (string or null)
   - black_player: name of the Black player (string or null)
   - result: one of "white_won", "black_won", "draw", or "unknown"

2. Moves list — an array of objects, one per move-pair:
   [
     {
       "move_number": 1,
       "white": "e4",          // White's move in Standard Algebraic Notation, or null
       "black": "e5",          // Black's move in SAN, or null
       "white_annotation": null, // any annotation symbol: !, !!, ?, ??, !?, ?! or null
       "black_annotation": null
     },
     ...
   ]

IMPORTANT RULES for reading chess moves:
- Use standard SAN: pieces are K, Q, R, B, N (not p for pawn — pawn moves are just the square, e.g. "e4")
- Castling is "O-O" (kingside) or "O-O-O" (queenside) — use capital letter O, not zero
- Captures use "x" (e.g. "Nxf3", "exd5")
- Check is "+" and checkmate is "#"
- Promotions: "e8=Q" format
- If a move is illegible or ambiguous, use your best guess and add a "?" suffix to indicate uncertainty
- Stop the list when the moves end (empty rows)
- Include any annotation symbols the player wrote next to moves

Return ONLY valid JSON with this exact structure — no explanation text, no markdown code fences:
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
  "moves": [],
  "warnings": []
}

Put any OCR difficulties or uncertainties in the "warnings" array as strings."""


async def analyze_score_sheet(image_path: str) -> dict:
    """
    Send the score sheet image to Claude Vision and get structured move data back.
    Returns a dict with metadata and moves list.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    suffix = path.suffix.lower()
    media_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    media_type = media_type_map.get(suffix, "image/jpeg")

    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": SCORE_SHEET_PROMPT,
                    },
                ],
            }
        ],
    )

    raw_text = message.content[0].text.strip()

    # Strip markdown fences if Claude wrapped it anyway
    if raw_text.startswith("```"):
        raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
        raw_text = re.sub(r"\n?```$", "", raw_text)

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Claude returned invalid JSON: {e}\n\nRaw response:\n{raw_text}")

    # Normalize result field
    result_map = {
        "white won": "white_won",
        "white_won": "white_won",
        "black won": "black_won",
        "black_won": "black_won",
        "draw": "draw",
        "½-½": "draw",
        "1-0": "white_won",
        "0-1": "black_won",
    }
    raw_result = str(data.get("result", "")).lower().strip()
    data["result"] = result_map.get(raw_result, "unknown")

    return data
