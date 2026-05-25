from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # ── OCR backend ───────────────────────────────────────────────────────────
    # "easyocr"  — local EasyOCR + OpenCV pipeline (default, no extra services needed)
    # "ollama"   — local Ollama vision model (higher accuracy; requires Ollama running)
    ocr_backend: str = "easyocr"

    # Ollama settings (only used when ocr_backend = "ollama")
    ollama_url:   str = "http://localhost:11434"
    ollama_model: str = "llama3.2-vision"   # or: moondream, qwen2.5vl, etc.

    # ── Storage ───────────────────────────────────────────────────────────────
    database_url:       str = "sqlite+aiosqlite:///./chess_tourny.db"
    upload_dir:         str = "./uploads"
    max_image_size_mb:  int = 20

    class Config:
        env_file = ".env"


settings = Settings()

UPLOAD_PATH = Path(settings.upload_dir)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
