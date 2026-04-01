from __future__ import annotations

import sqlite3
from pathlib import Path

from app.core.config import settings


def get_connection() -> sqlite3.Connection:
    db_path = Path(settings.sqlite_db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                company_name TEXT NOT NULL,
                city TEXT,
                min_degree_level INTEGER DEFAULT 0,
                min_years_experience REAL DEFAULT 0,
                job_type TEXT,
                embedding_text TEXT NOT NULL,
                vector_json TEXT NOT NULL,
                structured_json TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS resumes (
                resume_id TEXT PRIMARY KEY,
                source_filename TEXT NOT NULL,
                content_type TEXT,
                text_length INTEGER DEFAULT 0,
                extracted_text TEXT NOT NULL,
                structured_json TEXT NOT NULL,
                hard_json TEXT NOT NULL,
                soft_json TEXT NOT NULL,
                vector_payload_json TEXT NOT NULL,
                embedding_text TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
