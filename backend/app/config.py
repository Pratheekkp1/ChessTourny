from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///./chess_tourny.db"
    upload_dir: str = "./uploads"
    max_image_size_mb: int = 20

    class Config:
        env_file = ".env"


settings = Settings()

UPLOAD_PATH = Path(settings.upload_dir)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
