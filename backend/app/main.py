import asyncio
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

    # Pre-load OCR models in a background thread so the first scan is instant.
    # Uses run_in_executor so the server finishes starting before the download
    # completes — no user-visible delay at boot.
    from app.services.ocr_service import warm_up_models
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, warm_up_models)

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
