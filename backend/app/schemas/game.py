from datetime import datetime, date
from pydantic import BaseModel
from app.models.game import GameResult


class MoveResponse(BaseModel):
    move_number: int
    white_san: str | None
    black_san: str | None
    white_uci: str | None
    black_uci: str | None
    fen_after_white: str | None
    fen_after_black: str | None
    white_annotation: str | None
    black_annotation: str | None

    model_config = {"from_attributes": True}


class GameSummary(BaseModel):
    id: int
    tournament_id: int | None
    game_number: int | None
    display_name: str
    white_player: str | None
    black_player: str | None
    game_date: date | None
    added_at: datetime
    result: GameResult
    total_moves: int
    has_image: bool

    model_config = {"from_attributes": True}


class GameResponse(GameSummary):
    event: str | None
    round: str | None
    board: str | None
    section: str | None
    opening: str | None
    pairing_no: str | None
    pgn: str | None
    ocr_warnings: str | None
    updated_at: datetime
    moves: list[MoveResponse]


class GameUpdate(BaseModel):
    """Fields the user can correct after a bad OCR scan."""
    white_player: str | None = None
    black_player: str | None = None
    result: GameResult | None = None
    game_date: date | None = None
    round: str | None = None
    board: str | None = None
    event: str | None = None
    opening: str | None = None
    notes: str | None = None          # stored in ocr_warnings for now


class GameCreate(BaseModel):
    """Create a game without a score sheet (metadata-only)."""
    white_player: str | None = None
    black_player: str | None = None
    result: GameResult = GameResult.unknown
    game_date: date | None = None
    round: str | None = None
    event: str | None = None
    tournament_id: int | None = None


class PositionResponse(BaseModel):
    fen: str
    move_number: int
    # Which half of the move we're at: 0 = start, 1 = after white, 2 = after black
    ply: int
    san: str | None
    uci: str | None
    is_check: bool
    is_checkmate: bool
    is_game_over: bool
