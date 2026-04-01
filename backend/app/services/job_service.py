from __future__ import annotations

import json
from collections import OrderedDict
from uuid import uuid4

from app.core.db import get_connection
from app.schemas.job import (
    JobBasicInfo,
    JobDerived,
    JobHardConditions,
    JobImportItem,
    JobImportResponse,
    JobRecord,
    JobRequirements,
    JobResponsibilities,
    JobSoftConditions,
    JobTags,
    JobVectorizationPayload,
    StructuredJob,
)
from app.services.vectorizer import SimpleVectorizer


DEGREE_LEVELS = {
    "high_school": 1,
    "vocational": 2,
    "college": 3,
    "bachelor": 4,
    "master": 5,
    "phd": 6,
}


class JobService:
    def __init__(self) -> None:
        self.vectorizer = SimpleVectorizer()

    def import_jobs(self, items: list[JobImportItem]) -> JobImportResponse:
        records = [self._build_job_record(item) for item in items]

        with get_connection() as connection:
            for record in records:
                connection.execute(
                    """
                    INSERT INTO jobs (
                        job_id, title, company_name, city, min_degree_level,
                        min_years_experience, job_type, embedding_text, vector_json, structured_json, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(job_id) DO UPDATE SET
                        title=excluded.title,
                        company_name=excluded.company_name,
                        city=excluded.city,
                        min_degree_level=excluded.min_degree_level,
                        min_years_experience=excluded.min_years_experience,
                        job_type=excluded.job_type,
                        embedding_text=excluded.embedding_text,
                        vector_json=excluded.vector_json,
                        structured_json=excluded.structured_json,
                        updated_at=CURRENT_TIMESTAMP
                    """,
                    (
                        record.structured_job.job_id,
                        record.structured_job.basic_info.title,
                        record.structured_job.basic_info.company_name,
                        record.structured_job.basic_info.city,
                        record.hard_conditions.min_degree_level,
                        record.hard_conditions.min_years_experience,
                        record.hard_conditions.job_type,
                        record.vectorization_payload.embedding_text,
                        json.dumps(self.vectorizer.embed(record.vectorization_payload.embedding_text)),
                        record.structured_job.model_dump_json(),
                    ),
                )

        return JobImportResponse(imported_count=len(records), jobs=records)

    def list_jobs(self, limit: int = 50) -> list[JobRecord]:
        with get_connection() as connection:
            rows = connection.execute(
                "SELECT structured_json FROM jobs ORDER BY updated_at DESC LIMIT ?",
                (limit,),
            ).fetchall()

        records: list[JobRecord] = []
        for row in rows:
            structured = StructuredJob.model_validate_json(row["structured_json"])
            hard = JobHardConditions(
                min_degree_level=structured.requirements.min_degree_level,
                min_years_experience=structured.requirements.min_years_experience,
                city=structured.basic_info.city,
                job_type=structured.basic_info.job_type,
                required_languages=structured.requirements.required_languages,
            )
            soft = JobSoftConditions(
                required_skills=structured.requirements.required_skills,
                preferred_skills=structured.requirements.preferred_skills,
                required_tools=structured.requirements.required_tools,
                role_tags=structured.tags.role_tags,
                industry_tags=structured.tags.industry_tags,
                embedding_text=structured.derived.embedding_text,
            )
            records.append(
                JobRecord(
                    structured_job=structured,
                    hard_conditions=hard,
                    soft_conditions=soft,
                    vectorization_payload=JobVectorizationPayload(
                        hard_filter_fields=hard,
                        soft_match_fields=soft,
                        embedding_text=structured.derived.embedding_text,
                        metadata={
                            "job_id": structured.job_id,
                            "title": structured.basic_info.title,
                            "city": structured.basic_info.city,
                        },
                    ),
                )
            )
        return records

    def fetch_index_rows(self) -> list[dict]:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT job_id, title, company_name, city, min_degree_level,
                       min_years_experience, embedding_text, vector_json, structured_json
                FROM jobs
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def _build_job_record(self, item: JobImportItem) -> JobRecord:
        min_degree_label = item.min_degree_label or self._infer_degree_label(item.degree_name_raw)
        min_degree_level = item.min_degree_level or DEGREE_LEVELS.get(min_degree_label, 0)
        role_tags = self._build_role_tags(item.title)
        industry_tags = [value.lower() for value in item.industry]
        skill_tags = list(OrderedDict.fromkeys(item.required_skills + item.preferred_skills))
        embedding_text = self._build_embedding_text(
            title=item.title,
            company_name=item.company_name,
            city=item.city,
            industry=item.industry,
            min_degree_label=min_degree_label,
            min_years_experience=item.min_years_experience,
            required_skills=item.required_skills,
            preferred_skills=item.preferred_skills,
            responsibilities=item.responsibilities,
            description=item.description,
        )

        structured_job = StructuredJob(
            job_id=item.job_id or f"job_{uuid4().hex[:12]}",
            basic_info=JobBasicInfo(
                title=item.title,
                company_name=item.company_name,
                city=item.city,
                district=item.district,
                job_type=item.job_type,
                industry=item.industry,
            ),
            salary_min=item.salary_min,
            salary_max=item.salary_max,
            requirements=JobRequirements(
                degree_name_raw=item.degree_name_raw,
                min_degree_label=min_degree_label,
                min_degree_level=min_degree_level,
                min_years_experience=item.min_years_experience,
                required_languages=item.required_languages,
                required_skills=item.required_skills,
                preferred_skills=item.preferred_skills,
                required_tools=item.required_tools,
            ),
            responsibilities=JobResponsibilities(
                main_tasks=item.responsibilities,
                description=item.description,
            ),
            tags=JobTags(
                role_tags=role_tags,
                industry_tags=industry_tags,
                skill_tags=skill_tags,
                tool_tags=item.required_tools,
                qualification_tags=self._build_qualification_tags(min_degree_level, item.min_years_experience),
                city_tags=[item.city] if item.city else [],
            ),
            derived=JobDerived(
                embedding_text=embedding_text,
            ),
        )

        hard = JobHardConditions(
            min_degree_level=min_degree_level,
            min_years_experience=item.min_years_experience,
            city=item.city,
            job_type=item.job_type,
            required_languages=item.required_languages,
        )
        soft = JobSoftConditions(
            required_skills=item.required_skills,
            preferred_skills=item.preferred_skills,
            required_tools=item.required_tools,
            role_tags=role_tags,
            industry_tags=industry_tags,
            embedding_text=embedding_text,
        )
        vectorization_payload = JobVectorizationPayload(
            hard_filter_fields=hard,
            soft_match_fields=soft,
            embedding_text=embedding_text,
            metadata={
                "job_id": structured_job.job_id,
                "title": item.title,
                "company_name": item.company_name,
                "city": item.city,
                "min_degree_level": min_degree_level,
                "min_years_experience": item.min_years_experience,
                "role_tags": role_tags,
                "industry_tags": industry_tags,
            },
        )

        return JobRecord(
            structured_job=structured_job,
            hard_conditions=hard,
            soft_conditions=soft,
            vectorization_payload=vectorization_payload,
        )

    @staticmethod
    def _infer_degree_label(raw_value: str) -> str:
        lower = raw_value.lower()
        if "phd" in lower or "\u535a\u58eb" in raw_value:
            return "phd"
        if "master" in lower or "\u7855\u58eb" in raw_value or "\u7814\u7a76\u751f" in raw_value:
            return "master"
        if "bachelor" in lower or "\u672c\u79d1" in raw_value:
            return "bachelor"
        if "college" in lower or "\u5927\u4e13" in raw_value or "\u4e13\u79d1" in raw_value:
            return "college"
        if "\u9ad8\u4e2d" in raw_value:
            return "high_school"
        return ""

    @staticmethod
    def _build_role_tags(title: str) -> list[str]:
        lower = title.lower()
        tags: list[str] = []
        rules = OrderedDict(
            [
                ("customer_service", ["\u5ba2\u670d", "customer service"]),
                ("assistant", ["\u52a9\u7406", "assistant"]),
                ("backend", ["backend", "python", "\u540e\u7aef"]),
                ("frontend", ["frontend", "\u524d\u7aef"]),
                ("ai_application", ["ai", "llm", "rag"]),
                ("product", ["product", "\u4ea7\u54c1"]),
                ("data", ["data", "\u6570\u636e"]),
                ("testing", ["\u6d4b\u8bd5", "test"]),
            ]
        )
        for tag, keywords in rules.items():
            if any(keyword in lower for keyword in keywords):
                tags.append(tag)
        return tags

    @staticmethod
    def _build_qualification_tags(min_degree_level: int, min_years_experience: float) -> list[str]:
        tags: list[str] = []
        if min_degree_level >= DEGREE_LEVELS["bachelor"]:
            tags.append("bachelor_or_above")
        if min_degree_level >= DEGREE_LEVELS["master"]:
            tags.append("master_or_above")
        if min_years_experience >= 2:
            tags.append("2_plus_years_experience")
        if min_years_experience >= 3:
            tags.append("3_plus_years_experience")
        if min_years_experience >= 5:
            tags.append("5_plus_years_experience")
        return tags

    @staticmethod
    def _build_embedding_text(
        title: str,
        company_name: str,
        city: str,
        industry: list[str],
        min_degree_label: str,
        min_years_experience: float,
        required_skills: list[str],
        preferred_skills: list[str],
        responsibilities: list[str],
        description: str,
    ) -> str:
        return " | ".join(
            [
                f"title={title}",
                f"company={company_name}",
                f"city={city or 'unknown'}",
                f"industry={', '.join(industry) or 'unknown'}",
                f"min_degree={min_degree_label or 'unknown'}",
                f"min_years_experience={min_years_experience:g}",
                f"required_skills={', '.join(required_skills) or 'unknown'}",
                f"preferred_skills={', '.join(preferred_skills) or 'unknown'}",
                f"responsibilities={', '.join(responsibilities) or description or 'unknown'}",
            ]
        )
