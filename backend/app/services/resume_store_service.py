from __future__ import annotations

from app.core.db import get_connection
from app.schemas.resume import ResumeParseResponse


class ResumeStoreService:
    def save_resume(self, data: ResumeParseResponse) -> None:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO resumes (
                    resume_id, source_filename, content_type, text_length, extracted_text,
                    structured_json, hard_json, soft_json, vector_payload_json, embedding_text, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(resume_id) DO UPDATE SET
                    source_filename=excluded.source_filename,
                    content_type=excluded.content_type,
                    text_length=excluded.text_length,
                    extracted_text=excluded.extracted_text,
                    structured_json=excluded.structured_json,
                    hard_json=excluded.hard_json,
                    soft_json=excluded.soft_json,
                    vector_payload_json=excluded.vector_payload_json,
                    embedding_text=excluded.embedding_text,
                    updated_at=CURRENT_TIMESTAMP
                """,
                (
                    data.structured_resume.resume_id,
                    data.filename,
                    data.content_type,
                    data.text_length,
                    data.extracted_text,
                    data.structured_resume.model_dump_json(),
                    data.hard_conditions.model_dump_json(),
                    data.soft_conditions.model_dump_json(),
                    data.vectorization_payload.model_dump_json(),
                    data.embedding_text,
                ),
            )

    def list_resumes(self, limit: int = 50) -> list[dict]:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT resume_id, source_filename, content_type, text_length, updated_at
                FROM resumes
                ORDER BY updated_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(row) for row in rows]
