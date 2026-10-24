"""SQLAlchemy engine, session, and FastAPI dependency for MySQL with automatic SQLite fallback."""

import os
from collections.abc import Generator
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "bookflow")

Base = declarative_base()


def create_db_engine():
    """Create database engine, trying MySQL first and gracefully falling back to SQLite."""
    mysql_url = (
        f"mysql+pymysql://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    # If user explicitly specified SQLite or no MySQL port open
    use_sqlite = os.getenv("USE_SQLITE", "").lower() in ("true", "1", "yes")
    if not use_sqlite:
        try:
            eng = create_engine(
                mysql_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"charset": "utf8mb4", "connect_timeout": 2},
            )
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("[Database] Connected successfully to MySQL database.")
            return eng
        except Exception as e:
            print(f"[Database] MySQL connection unavailable ({e}). Falling back to SQLite.")

    # SQLite Fallback
    sqlite_url = "sqlite:///./bookflow.db"
    print(f"[Database] Using local SQLite database: {sqlite_url}")
    return create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
    )


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables in the database if they do not exist."""
    try:
        from app.models import TrafficRecord  # noqa: F401

        Base.metadata.create_all(bind=engine)
        print("[Database] Database tables initialized successfully.")
    except Exception as e:
        print(f"[Database] Warning: Failed to initialize tables: {e}")


def get_db() -> Generator[Session, None, None]:
    """Yield a request-scoped SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
