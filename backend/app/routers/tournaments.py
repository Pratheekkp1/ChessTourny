from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Tournament, Game
from app.schemas import TournamentCreate, TournamentUpdate, TournamentResponse, TournamentSummary

router = APIRouter(prefix="/tournaments", tags=["tournaments"])


@router.post("", response_model=TournamentResponse, status_code=201)
async def create_tournament(body: TournamentCreate, db: AsyncSession = Depends(get_db)):
    tournament = Tournament(**body.model_dump())
    db.add(tournament)
    await db.commit()
    await db.refresh(tournament)
    return _with_game_count(tournament, 0)


@router.get("", response_model=list[TournamentSummary])
async def list_tournaments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Tournament, func.count(Game.id).label("game_count"))
        .outerjoin(Game, Game.tournament_id == Tournament.id)
        .group_by(Tournament.id)
        .order_by(Tournament.created_at.desc())
    )
    rows = result.all()
    return [_with_game_count(t, count) for t, count in rows]


@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament(tournament_id: int, db: AsyncSession = Depends(get_db)):
    t, count = await _fetch_with_count(tournament_id, db)
    return _with_game_count(t, count)


@router.put("/{tournament_id}", response_model=TournamentResponse)
async def update_tournament(
    tournament_id: int, body: TournamentUpdate, db: AsyncSession = Depends(get_db)
):
    t, count = await _fetch_with_count(tournament_id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(t, field, value)
    await db.commit()
    await db.refresh(t)
    return _with_game_count(t, count)


@router.delete("/{tournament_id}", status_code=204)
async def delete_tournament(tournament_id: int, db: AsyncSession = Depends(get_db)):
    t, _ = await _fetch_with_count(tournament_id, db)
    await db.delete(t)
    await db.commit()


async def _fetch_with_count(tournament_id: int, db: AsyncSession):
    result = await db.execute(
        select(Tournament, func.count(Game.id).label("game_count"))
        .outerjoin(Game, Game.tournament_id == Tournament.id)
        .where(Tournament.id == tournament_id)
        .group_by(Tournament.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(404, "Tournament not found")
    return row


def _with_game_count(tournament: Tournament, count: int) -> dict:
    data = {
        "id": tournament.id,
        "name": tournament.name,
        "description": tournament.description,
        "location": tournament.location,
        "start_date": tournament.start_date,
        "end_date": tournament.end_date,
        "game_count": count,
        "created_at": tournament.created_at,
        "updated_at": tournament.updated_at,
    }
    return data
