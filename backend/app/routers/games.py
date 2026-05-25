from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Game, Move, Tournament
from app.models.game import GameResult
from app.schemas import GameResponse, GameSummary, GameUpdate, GameCreate, PositionResponse
from app.services import ocr_service, chess_service, storage_service
from pathlib import Path
import json

router = APIRouter(prefix="/games", tags=["games"])


# ── OCR test endpoint (dry run — no DB writes) ────────────────────────────────

@router.post("/ocr-test")
async def ocr_test(image: UploadFile = File(...)):
    """
    Upload a score sheet photo and get the raw OCR result back — no game is
    created or saved.  Use this to validate the handwriting model against a
    real score sheet before committing to the database.

    Returns the full structured dict:
      { event, date, white_player, black_player, moves: [...], warnings: [...] }
    """
    image_path = await storage_service.save_score_sheet(image)
    try:
        result = await ocr_service.analyze_score_sheet(image_path)
    except Exception as exc:
        storage_service.delete_score_sheet(image_path)
        raise HTTPException(422, f"OCR failed: {exc}")
    finally:
        # Clean up — this endpoint never persists images
        storage_service.delete_score_sheet(image_path)

    return result


# ── Create a game by scanning a score sheet image ─────────────────────────────

@router.post("", response_model=GameResponse, status_code=201)
async def create_game(
    image: UploadFile = File(...),
    tournament_id: int | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a photo of a score sheet. The backend will OCR it with TrOCR
    (handwriting model), validate all moves, and store the full game.
    """
    if tournament_id is not None:
        t = await db.get(Tournament, tournament_id)
        if not t:
            raise HTTPException(404, "Tournament not found")

    image_path = await storage_service.save_score_sheet(image)

    try:
        ocr_data = await ocr_service.analyze_score_sheet(image_path)
    except Exception as e:
        storage_service.delete_score_sheet(image_path)
        raise HTTPException(422, f"OCR failed: {e}")

    chess_result = chess_service.parse_and_validate_moves(ocr_data.get("moves", []))

    # Count games in tournament for game_number
    game_number = None
    if tournament_id is not None:
        result = await db.execute(
            select(Game).where(Game.tournament_id == tournament_id)
        )
        game_number = len(result.scalars().all()) + 1

    # Parse game_date
    game_date = None
    if ocr_data.get("date"):
        try:
            from datetime import date
            game_date = date.fromisoformat(ocr_data["date"])
        except ValueError:
            pass

    all_warnings = (ocr_data.get("warnings") or []) + (chess_result.get("warnings") or [])

    game = Game(
        tournament_id=tournament_id,
        game_number=game_number,
        event=ocr_data.get("event"),
        white_player=ocr_data.get("white_player"),
        black_player=ocr_data.get("black_player"),
        round=ocr_data.get("round"),
        board=ocr_data.get("board"),
        section=ocr_data.get("section"),
        opening=ocr_data.get("opening"),
        pairing_no=ocr_data.get("pairing_no"),
        game_date=game_date,
        result=GameResult(ocr_data.get("result", "unknown")),
        total_moves=chess_result["total_moves"],
        pgn=chess_result["pgn"],
        raw_ocr_text=json.dumps(ocr_data),
        image_path=image_path,
        ocr_warnings="\n".join(all_warnings) if all_warnings else None,
    )
    db.add(game)
    await db.flush()  # get game.id

    for m in chess_result["parsed_moves"]:
        move = Move(
            game_id=game.id,
            move_number=m["move_number"],
            white_san=m.get("white_san"),
            black_san=m.get("black_san"),
            white_uci=m.get("white_uci"),
            black_uci=m.get("black_uci"),
            fen_after_white=m.get("fen_after_white"),
            fen_after_black=m.get("fen_after_black"),
            white_annotation=m.get("white_annotation"),
            black_annotation=m.get("black_annotation"),
        )
        db.add(move)

    await db.commit()
    await db.refresh(game)
    return _serialize_game(game)


# ── Create a game without a score sheet (metadata only) ──────────────────────

@router.post("/manual", response_model=GameResponse, status_code=201)
async def create_game_manual(body: GameCreate, db: AsyncSession = Depends(get_db)):
    """
    Record a game result without uploading a score sheet.
    Useful when the score sheet was lost or the game was informal.
    No OCR or move validation is performed — only metadata is stored.
    """
    if body.tournament_id is not None:
        t = await db.get(Tournament, body.tournament_id)
        if not t:
            raise HTTPException(404, "Tournament not found")

    game_number = None
    if body.tournament_id is not None:
        result = await db.execute(
            select(Game).where(Game.tournament_id == body.tournament_id)
        )
        game_number = len(result.scalars().all()) + 1

    game = Game(
        tournament_id=body.tournament_id,
        game_number=game_number,
        white_player=body.white_player,
        black_player=body.black_player,
        result=body.result,
        game_date=body.game_date,
        round=body.round,
        event=body.event,
        total_moves=0,
        image_path=None,
        ocr_warnings=None,
    )
    db.add(game)
    await db.commit()
    await db.refresh(game)
    return _serialize_game(game)


# ── List games (optionally scoped to a tournament) ────────────────────────────

@router.get("", response_model=list[GameSummary])
async def list_games(
    tournament_id: int | None = Query(None),
    q: str | None = Query(None, description="Search by player name (white or black)"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Game).order_by(Game.added_at.desc())
    if tournament_id is not None:
        stmt = stmt.where(Game.tournament_id == tournament_id)
    if q:
        pattern = f"%{q}%"
        from sqlalchemy import or_, func
        stmt = stmt.where(
            or_(
                Game.white_player.ilike(pattern),
                Game.black_player.ilike(pattern),
            )
        )
    result = await db.execute(stmt)
    games = result.scalars().all()
    return [_serialize_summary(g) for g in games]


# ── Get a single game with all moves ─────────────────────────────────────────

@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: int, db: AsyncSession = Depends(get_db)):
    game = await _fetch_game(game_id, db)
    return _serialize_game(game)


# ── Get board position at a specific ply ─────────────────────────────────────

@router.get("/{game_id}/position/{ply}", response_model=PositionResponse)
async def get_position(game_id: int, ply: int, db: AsyncSession = Depends(get_db)):
    """
    ply=0 → starting position
    ply=1 → after White's first move
    ply=2 → after Black's first move
    etc.
    """
    game = await _fetch_game(game_id, db)
    moves_raw = [
        {
            "move_number": m.move_number,
            "white_san": m.white_san,
            "black_san": m.black_san,
            "white_uci": m.white_uci,
            "black_uci": m.black_uci,
        }
        for m in game.moves
    ]
    max_ply = sum(
        (1 if m.white_uci else 0) + (1 if m.black_uci else 0) for m in game.moves
    )
    ply = max(0, min(ply, max_ply))
    return chess_service.get_position_at_ply(moves_raw, ply)


# ── Export game as PGN text ────────────────────────────────────────────────────

@router.get("/{game_id}/pgn", response_class=PlainTextResponse)
async def export_pgn(game_id: int, db: AsyncSession = Depends(get_db)):
    game = await _fetch_game(game_id, db)
    moves_raw = [
        {
            "move_number": m.move_number,
            "white_san": m.white_san,
            "black_san": m.black_san,
            "white_annotation": m.white_annotation,
            "black_annotation": m.black_annotation,
        }
        for m in game.moves
    ]
    pgn = chess_service.build_full_pgn(
        {
            "event": game.event,
            "white_player": game.white_player,
            "black_player": game.black_player,
            "game_date": game.game_date,
            "round": game.round,
            "result": game.result.value if game.result else "unknown",
        },
        moves_raw,
    )
    return pgn


# ── Download original score sheet image ──────────────────────────────────────

@router.get("/{game_id}/image")
async def get_image(game_id: int, db: AsyncSession = Depends(get_db)):
    game = await _fetch_game(game_id, db)
    if not game.image_path or not Path(game.image_path).exists():
        raise HTTPException(404, "Image not found")
    return FileResponse(game.image_path)


# ── Update a game (patch player names, result, date, notes, etc.) ────────────

@router.patch("/{game_id}", response_model=GameResponse)
async def update_game(game_id: int, body: GameUpdate, db: AsyncSession = Depends(get_db)):
    """
    Correct metadata after a scan — player names, result, date, round, etc.
    Only supplied fields are updated (PATCH semantics).
    """
    game = await _fetch_game(game_id, db)
    update_data = body.model_dump(exclude_none=True)
    notes = update_data.pop("notes", None)

    for field, value in update_data.items():
        setattr(game, field, value)

    if notes is not None:
        # Append to OCR warnings so original context isn't lost
        existing = game.ocr_warnings or ""
        game.ocr_warnings = (existing + "\n[user note] " + notes).strip()

    await db.commit()
    await db.refresh(game)
    await db.refresh(game, ["moves"])
    return _serialize_game(game)


# ── Delete a game ─────────────────────────────────────────────────────────────

@router.delete("/{game_id}", status_code=204)
async def delete_game(game_id: int, db: AsyncSession = Depends(get_db)):
    game = await _fetch_game(game_id, db)
    storage_service.delete_score_sheet(game.image_path)
    await db.delete(game)
    await db.commit()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _fetch_game(game_id: int, db: AsyncSession) -> Game:
    result = await db.execute(
        select(Game).where(Game.id == game_id)
    )
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(404, "Game not found")
    # Eagerly load moves
    await db.refresh(game, ["moves"])
    return game


def _serialize_game(game: Game) -> dict:
    return {
        **_serialize_summary(game),
        "event": game.event,
        "round": game.round,
        "board": game.board,
        "section": game.section,
        "opening": game.opening,
        "pairing_no": game.pairing_no,
        "pgn": game.pgn,
        "ocr_warnings": game.ocr_warnings,
        "updated_at": game.updated_at,
        "moves": [
            {
                "move_number": m.move_number,
                "white_san": m.white_san,
                "black_san": m.black_san,
                "white_uci": m.white_uci,
                "black_uci": m.black_uci,
                "fen_after_white": m.fen_after_white,
                "fen_after_black": m.fen_after_black,
                "white_annotation": m.white_annotation,
                "black_annotation": m.black_annotation,
            }
            for m in game.moves
        ],
    }


def _serialize_summary(game: Game) -> dict:
    return {
        "id": game.id,
        "tournament_id": game.tournament_id,
        "game_number": game.game_number,
        "display_name": game.display_name,
        "white_player": game.white_player,
        "black_player": game.black_player,
        "game_date": game.game_date,
        "added_at": game.added_at,
        "result": game.result,
        "total_moves": game.total_moves,
        "has_image": bool(game.image_path),
    }
