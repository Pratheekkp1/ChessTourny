from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import tournaments, games
from app.config import UPLOAD_PATH


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Chess Tourny API",
    description="Scan handwritten chess score sheets and replay your games.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tournaments.router)
app.include_router(games.router)

# Serve uploaded score sheet images directly
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_PATH)), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok"}
