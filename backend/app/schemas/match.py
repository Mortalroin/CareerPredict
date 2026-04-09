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


class CapabilityDimensionScore(BaseModel):
    dimension: str
    score: float
    weight: float
    summary: str
    matched_items: list[str] = Field(default_factory=list)
    gap_items: list[str] = Field(default_factory=list)


class JobPortrait(BaseModel):
    job_id: str = ""
    role_name: str
    role_family: str
    summary: str
    professional_skills: list[str] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    innovation_points: list[str] = Field(default_factory=list)
    learning_requirements: list[str] = Field(default_factory=list)
    stress_requirements: list[str] = Field(default_factory=list)
    communication_requirements: list[str] = Field(default_factory=list)
    internship_requirements: list[str] = Field(default_factory=list)
    representative_companies: list[str] = Field(default_factory=list)


class PathNode(BaseModel):
    title: str
    stage: str
    description: str
    skills: list[str] = Field(default_factory=list)


class VerticalPath(BaseModel):
    role_family: str
    description: str
    nodes: list[PathNode] = Field(default_factory=list)


class TransitionPath(BaseModel):
    source_role: str
    target_role: str
    reason: str
    bridge_skills: list[str] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list)


class ActionPlanPhase(BaseModel):
    phase: str
    timeline: str
    goals: list[str] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)
    metrics: list[str] = Field(default_factory=list)


class CareerReport(BaseModel):
    target_role: str
    target_city: str
    completeness_score: float
    competitiveness_score: float
    readiness_score: float
    llm_enabled: bool = False
    overview: str
    exploration: str
    path_plan: str
    edit_tips: list[str] = Field(default_factory=list)
    action_plan: list[ActionPlanPhase] = Field(default_factory=list)
    export_ready: bool = True


class ResumeMatchResponse(BaseModel):
    structured_resume: StructuredResume
    hard_conditions: ResumeHardConditions
    soft_conditions: ResumeSoftConditions
    matches: list[JobMatchItem]
    capability_scores: list[CapabilityDimensionScore] = Field(default_factory=list)
    job_portraits: list[JobPortrait] = Field(default_factory=list)
    vertical_paths: list[VerticalPath] = Field(default_factory=list)
    transition_paths: list[TransitionPath] = Field(default_factory=list)
    career_report: CareerReport
