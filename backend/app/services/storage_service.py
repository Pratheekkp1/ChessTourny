import io
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image
import aiofiles
from app.config import settings, UPLOAD_PATH


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",   # iOS default photo format
    "image/heif",   # HEIF container (same as HEIC)
}
HEIC_TYPES = {"image/heic", "image/heif"}
MAX_BYTES = settings.max_image_size_mb * 1024 * 1024


def _heic_to_jpeg(content: bytes) -> bytes:
    """Convert HEIC/HEIF bytes to JPEG bytes using pillow-heif."""
    try:
        import pillow_heif  # type: ignore
        pillow_heif.register_heif_opener()
    except ImportError:
        raise HTTPException(
            422,
            "HEIC images require pillow-heif. Install it: pip install pillow-heif"
        )
    img = Image.open(io.BytesIO(content)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


async def save_score_sheet(file: UploadFile) -> str:
    """
    Save uploaded score-sheet image, return the absolute path string.

    HEIC/HEIF files (the iOS default) are transparently converted to JPEG
    before saving so the rest of the pipeline always receives a standard format.
    """
    ct = (file.content_type or "").lower()
    if ct not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported image type: {ct!r}. "
                                 f"Accepted: jpeg, png, webp, heic/heif.")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(400, f"Image exceeds {settings.max_image_size_mb} MB limit")

    # Convert HEIC → JPEG so downstream code always gets a standard format
    if ct in HEIC_TYPES:
        content = _heic_to_jpeg(content)
        ext = ".jpg"
    else:
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
