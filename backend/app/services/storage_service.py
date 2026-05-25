import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image
import aiofiles
from app.config import settings, UPLOAD_PATH


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = settings.max_image_size_mb * 1024 * 1024


async def save_score_sheet(file: UploadFile) -> str:
    """Save uploaded image, return the relative path string."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported image type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(400, f"Image exceeds {settings.max_image_size_mb} MB limit")

    ext = Path(file.filename or "upload.jpg").suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    dest = UPLOAD_PATH / filename

    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)

    return str(dest)


def delete_score_sheet(image_path: str | None):
    if not image_path:
        return
    p = Path(image_path)
    if p.exists():
        p.unlink(missing_ok=True)
