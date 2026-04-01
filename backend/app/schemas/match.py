from pydantic import BaseModel, Field

from app.schemas.resume import (
    ResumeHardConditions,
    ResumeSoftConditions,
    StructuredResume,
)


class MatchBreakdown(BaseModel):
    degree_pass: bool = False
    experience_pass: bool = False
    city_pass: bool = False
    language_pass: bool = False
    hard_filter_bonus: float = 0.0
    skill_overlap: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)


class JobMatchItem(BaseModel):
    job_id: str
    title: str
    company_name: str
    city: str
    similarity_score: float
    total_score: float
    breakdown: MatchBreakdown


class ResumeMatchResponse(BaseModel):
    structured_resume: StructuredResume
    hard_conditions: ResumeHardConditions
    soft_conditions: ResumeSoftConditions
    matches: list[JobMatchItem]
