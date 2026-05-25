from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, Integer, Text, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.database import Base


class GameResult(str, enum.Enum):
    WHITE_WON = "white_won"
    BLACK_WON = "black_won"
    DRAW = "draw"
    UNKNOWN = "unknown"


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True)
    tournament_id: Mapped[int | None] = mapped_column(
        ForeignKey("tournaments.id", ondelete="SET NULL"), nullable=True
    )
    game_number: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # From score sheet header fields
    event: Mapped[str | None] = mapped_column(String(255), nullable=True)
    white_player: Mapped[str | None] = mapped_column(String(255), nullable=True)
    black_player: Mapped[str | None] = mapped_column(String(255), nullable=True)
    round: Mapped[str | None] = mapped_column(String(50), nullable=True)
    board: Mapped[str | None] = mapped_column(String(50), nullable=True)
    section: Mapped[str | None] = mapped_column(String(100), nullable=True)
    opening: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pairing_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    game_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    result: Mapped[GameResult] = mapped_column(
        Enum(GameResult), default=GameResult.UNKNOWN
    )
    total_moves: Mapped[int] = mapped_column(Integer, default=0)

    # Raw PGN and move data
    pgn: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Image of the original score sheet
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Notes if OCR had trouble parsing certain moves
    ocr_warnings: Mapped[str | None] = mapped_column(Text, nullable=True)

    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    tournament: Mapped["Tournament"] = relationship("Tournament", back_populates="games")
    moves: Mapped[list["Move"]] = relationship(
        "Move", back_populates="game", cascade="all, delete-orphan", order_by="Move.move_number"
    )

    @property
    def display_name(self) -> str:
        if self.black_player and self.black_player.strip():
            return f"vs {self.black_player}"
        if self.game_number:
            return f"Game #{self.game_number}"
        return f"Game #{self.id}"
