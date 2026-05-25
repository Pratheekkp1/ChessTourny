from sqlalchemy import Integer, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Move(Base):
    __tablename__ = "moves"

    id: Mapped[int] = mapped_column(primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id", ondelete="CASCADE"))
    move_number: Mapped[int] = mapped_column(Integer)

    # SAN notation for each side
    white_san: Mapped[str | None] = mapped_column(String(20), nullable=True)
    black_san: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # FEN string after each half-move (ply)
    fen_after_white: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fen_after_black: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # UCI notation (e.g. "e2e4") — useful for frontend board libraries
    white_uci: Mapped[str | None] = mapped_column(String(10), nullable=True)
    black_uci: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Annotation symbols (!, !!, ?, ??, !?, ?!)
    white_annotation: Mapped[str | None] = mapped_column(String(5), nullable=True)
    black_annotation: Mapped[str | None] = mapped_column(String(5), nullable=True)

    game: Mapped["Game"] = relationship("Game", back_populates="moves")
