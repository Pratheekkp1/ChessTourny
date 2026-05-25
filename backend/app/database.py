from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Migrations: add new columns if they don't exist yet (SQLite doesn't
        # support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we catch the error)
        for sql in [
            "ALTER TABLE tournaments ADD COLUMN num_rounds INTEGER",
        ]:
            try:
                await conn.exec_driver_sql(sql)
            except Exception:
                pass  # Column already exists
