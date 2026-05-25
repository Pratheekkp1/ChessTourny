from datetime import datetime
from pydantic import BaseModel


class TournamentCreate(BaseModel):
    name: str
    description: str | None = None
    location: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    num_rounds: int | None = None
    color: str | None = None


class TournamentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    num_rounds: int | None = None
    color: str | None = None


class TournamentSummary(BaseModel):
    id: int
    name: str
    description: str | None
    location: str | None
    start_date: datetime | None
    end_date: datetime | None
    num_rounds: int | None
    color: str | None
    game_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TournamentResponse(TournamentSummary):
    updated_at: datetime
