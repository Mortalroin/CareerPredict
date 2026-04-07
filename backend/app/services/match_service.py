from __future__ import annotations

import json

from app.schemas.match import JobMatchItem, MatchBreakdown, ResumeMatchResponse
from app.schemas.resume import ResumeParseResponse
from app.services.career_report_service import CareerReportService
from app.services.job_service import JobService
from app.services.vectorizer import SimpleVectorizer


class MatchService:
    def __init__(self) -> None:
        self.job_service = JobService()
        self.vectorizer = SimpleVectorizer()
        self.career_report_service = CareerReportService()

    def match_resume(self, resume_data: ResumeParseResponse, limit: int = 10) -> ResumeMatchResponse:
        jobs = self.job_service.fetch_index_rows()
        resume_vector = self.vectorizer.embed(resume_data.embedding_text)

        results: list[JobMatchItem] = []
        for row in jobs:
            job_vector = json.loads(row["vector_json"])
            similarity = self.vectorizer.cosine_similarity(resume_vector, job_vector)
            breakdown = self._build_breakdown(resume_data, row)
            total_score = similarity * 100 + breakdown.hard_filter_bonus
            if breakdown.skill_overlap:
                total_score += min(len(breakdown.skill_overlap) * 2.0, 10.0)

            results.append(
                JobMatchItem(
                    job_id=row["job_id"],
                    title=row["title"],
                    company_name=row["company_name"],
                    city=row["city"] or "",
                    similarity_score=round(similarity, 4),
                    total_score=round(total_score, 2),
                    breakdown=breakdown,
                )
            )

        ordered = sorted(results, key=lambda item: item.total_score, reverse=True)[:limit]
        bundle = self.career_report_service.build_report_bundle(
            resume_data=resume_data,
            matches=ordered,
            all_job_rows=jobs,
        )
        return ResumeMatchResponse(
            structured_resume=resume_data.structured_resume,
            hard_conditions=resume_data.hard_conditions,
            soft_conditions=resume_data.soft_conditions,
            matches=ordered,
            capability_scores=bundle["capability_scores"],
            job_portraits=bundle["job_portraits"],
            vertical_paths=bundle["vertical_paths"],
            transition_paths=bundle["transition_paths"],
            career_report=bundle["career_report"],
        )

    @staticmethod
    def _build_breakdown(resume_data: ResumeParseResponse, job_row: dict) -> MatchBreakdown:
        structured = json.loads(job_row["structured_json"])
        requirements = structured["requirements"]
        basic_info = structured["basic_info"]

        degree_pass = resume_data.hard_conditions.highest_degree_level >= requirements["min_degree_level"]
        experience_pass = (
            resume_data.hard_conditions.total_years_experience >= requirements["min_years_experience"]
        )
        city_pass = not basic_info["city"] or not resume_data.hard_conditions.target_cities or (
            basic_info["city"] in resume_data.hard_conditions.target_cities
        )
        required_languages = set(requirements["required_languages"])
        candidate_languages = set(resume_data.hard_conditions.languages)
        language_pass = not required_languages or required_languages.issubset(candidate_languages)

        required_skills = set(requirements["required_skills"])
        candidate_skills = set(resume_data.soft_conditions.core_skills + resume_data.soft_conditions.tool_skills)
        skill_overlap = sorted(candidate_skills & required_skills)
        missing_required_skills = sorted(required_skills - candidate_skills)

        hard_bonus = 0.0
        hard_bonus += 8.0 if degree_pass else -25.0
        hard_bonus += 8.0 if experience_pass else -20.0
        hard_bonus += 4.0 if city_pass else -8.0
        hard_bonus += 3.0 if language_pass else -6.0

        return MatchBreakdown(
            degree_pass=degree_pass,
            experience_pass=experience_pass,
            city_pass=city_pass,
            language_pass=language_pass,
            hard_filter_bonus=round(hard_bonus, 2),
            skill_overlap=skill_overlap[:10],
            missing_required_skills=missing_required_skills[:10],
        )
