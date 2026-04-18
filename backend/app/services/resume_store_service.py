from __future__ import annotations

import json

from app.core.db import get_connection
from app.schemas.resume import ResumeOptimizationPayload, ResumeParseResponse


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

    def resume_exists(self, resume_id: str) -> bool:
        with get_connection() as connection:
            row = connection.execute(
                "SELECT 1 FROM resumes WHERE resume_id = ? LIMIT 1",
                (resume_id,),
            ).fetchone()
        return row is not None

    def save_resume_optimization(self, resume_id: str, payload: ResumeOptimizationPayload) -> dict:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO resume_optimizations (
                    resume_id, target_role, notes, optimization_json, merged_notes, updated_at
                )
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(resume_id) DO UPDATE SET
                    target_role=excluded.target_role,
                    notes=excluded.notes,
                    optimization_json=excluded.optimization_json,
                    merged_notes=excluded.merged_notes,
                    updated_at=CURRENT_TIMESTAMP
                """,
                (
                    resume_id,
                    payload.target_role,
                    payload.notes,
                    json.dumps(payload.optimization_drafts, ensure_ascii=False),
                    payload.merged_notes,
                ),
            )
            row = connection.execute(
                """
                SELECT resume_id, target_role, notes, optimization_json, merged_notes, updated_at
                FROM resume_optimizations
                WHERE resume_id = ?
                """,
                (resume_id,),
            ).fetchone()

        if row is None:
            return {}

        record = dict(row)
        record["optimization_drafts"] = json.loads(record.pop("optimization_json"))
        return record

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
