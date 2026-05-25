"""
Chess logic: parse moves from OCR output, validate them against python-chess,
build per-ply FEN snapshots, and generate PGN.
"""
import re
import chess
import chess.pgn
from io import StringIO
from datetime import date as date_type


ANNOTATION_PATTERN = re.compile(r"([!?]{1,2})$")


def strip_annotation(san: str) -> tuple[str, str | None]:
    """Separate move annotation from the SAN string. Returns (clean_san, annotation)."""
    match = ANNOTATION_PATTERN.search(san.strip())
    if match:
        annotation = match.group(1)
        clean = san[: match.start()].strip()
        return clean, annotation
    return san.strip(), None


def parse_and_validate_moves(raw_moves: list[dict]) -> dict:
    """
    Takes the raw OCR move list and attempts to play each move on a chess board.
    Returns a dict with:
      - parsed_moves: list of dicts with SAN, UCI, FENs, annotations
      - pgn: PGN string
      - warnings: list of warning strings
      - total_moves: number of full moves successfully parsed
    """
    board = chess.Board()
    parsed_moves = []
    warnings = []

    for entry in raw_moves:
        move_number = entry.get("move_number", len(parsed_moves) + 1)
        white_raw = (entry.get("white") or "").strip()
        black_raw = (entry.get("black") or "").strip()
        white_annotation = entry.get("white_annotation")
        black_annotation = entry.get("black_annotation")

        move_data = {
            "move_number": move_number,
            "white_san": None,
            "black_san": None,
            "white_uci": None,
            "black_uci": None,
            "fen_after_white": None,
            "fen_after_black": None,
            "white_annotation": white_annotation,
            "black_annotation": black_annotation,
        }

        if not white_raw and not black_raw:
            break  # No more moves

        # --- White's move ---
        if white_raw:
            clean_white, auto_ann = strip_annotation(white_raw)
            if not white_annotation:
                white_annotation = auto_ann
            move_data["white_annotation"] = white_annotation

            white_move, white_san_valid = _try_push_san(board, clean_white, move_number, "White", warnings)
            if white_move:
                move_data["white_san"] = white_san_valid  # canonical validated SAN
                move_data["white_uci"] = white_move.uci()
                move_data["fen_after_white"] = board.fen()
            else:
                # Can't continue — illegal move breaks the game
                warnings.append(f"Move {move_number}W: stopped replaying after illegal move '{white_raw}'")
                parsed_moves.append(move_data)
                break

        # --- Black's move ---
        if black_raw:
            clean_black, auto_ann = strip_annotation(black_raw)
            if not black_annotation:
                black_annotation = auto_ann
            move_data["black_annotation"] = black_annotation

            black_move, black_san_valid = _try_push_san(board, clean_black, move_number, "Black", warnings)
            if black_move:
                move_data["black_san"] = black_san_valid  # canonical validated SAN
                move_data["black_uci"] = black_move.uci()
                move_data["fen_after_black"] = board.fen()
            else:
                warnings.append(f"Move {move_number}B: stopped replaying after illegal move '{black_raw}'")
                parsed_moves.append(move_data)
                break

        parsed_moves.append(move_data)

    pgn_str = _build_pgn(parsed_moves)
    return {
        "parsed_moves": parsed_moves,
        "pgn": pgn_str,
        "warnings": warnings,
        "total_moves": len(parsed_moves),
    }


def _try_push_san(
    board: chess.Board, san: str, move_number: int, side: str, warnings: list
) -> tuple[chess.Move | None, str | None]:
    """
    Try to parse and push a SAN move.
    Returns (move, validated_san) on success, (None, None) on failure.
    validated_san is the canonical python-chess SAN computed BEFORE the push
    so it reflects the board state at the time the move was made.
    """
    san = san.replace("0-0-0", "O-O-O").replace("0-0", "O-O")  # normalize zeros
    try:
        move = board.parse_san(san)
        validated_san = board.san(move)   # canonical SAN before push
        board.push(move)
        return move, validated_san
    except (chess.IllegalMoveError, chess.InvalidMoveError, chess.AmbiguousMoveError, ValueError) as e:
        warnings.append(f"Move {move_number}{side[0]}: '{san}' — {e}")
        return None, None


def _build_pgn(parsed_moves: list[dict]) -> str:
    parts = []
    for m in parsed_moves:
        n = m["move_number"]
        w = m.get("white_san") or ""
        b = m.get("black_san") or ""
        wa = m.get("white_annotation") or ""
        ba = m.get("black_annotation") or ""
        if w:
            parts.append(f"{n}. {w}{wa}")
        if b:
            parts.append(f"{b}{ba}")
    return " ".join(parts)


def get_position_at_ply(moves: list[dict], ply: int) -> dict:
    """
    Given the stored moves and a ply index (0 = start), return board state.
    ply 1 = after white move 1, ply 2 = after black move 1, etc.
    """
    board = chess.Board()
    current_san = None
    current_uci = None

    for i, m in enumerate(moves):
        white_uci = m.get("white_uci")
        black_uci = m.get("black_uci")

        white_ply = i * 2 + 1
        black_ply = i * 2 + 2

        if ply >= white_ply and white_uci:
            move = chess.Move.from_uci(white_uci)
            current_san = m.get("white_san")
            current_uci = white_uci
            board.push(move)
        else:
            break

        if ply >= black_ply and black_uci:
            move = chess.Move.from_uci(black_uci)
            current_san = m.get("black_san")
            current_uci = black_uci
            board.push(move)
        elif ply < black_ply:
            break

    return {
        "fen": board.fen(),
        "move_number": (ply // 2) + 1,
        "ply": ply,
        "san": current_san,
        "uci": current_uci,
        "is_check": board.is_check(),
        "is_checkmate": board.is_checkmate(),
        "is_game_over": board.is_game_over(),
    }


def build_full_pgn(game_data: dict, moves: list[dict]) -> str:
    """Build a full PGN string with headers for export."""
    headers = []
    if game_data.get("event"):
        headers.append(f'[Event "{game_data["event"]}"]')
    if game_data.get("white_player"):
        headers.append(f'[White "{game_data["white_player"]}"]')
    if game_data.get("black_player"):
        headers.append(f'[Black "{game_data["black_player"]}"]')
    if game_data.get("game_date"):
        d = game_data["game_date"]
        date_str = d.strftime("%Y.%m.%d") if hasattr(d, "strftime") else str(d)
        headers.append(f'[Date "{date_str}"]')
    if game_data.get("round"):
        headers.append(f'[Round "{game_data["round"]}"]')
    result_pgn = {"white_won": "1-0", "black_won": "0-1", "draw": "1/2-1/2"}.get(
        game_data.get("result", ""), "*"
    )
    headers.append(f'[Result "{result_pgn}"]')

    move_text = _build_pgn(moves)
    return "\n".join(headers) + "\n\n" + move_text + " " + result_pgn
