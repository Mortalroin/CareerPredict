from pydantic import BaseModel, Field


class ResumeProject(BaseModel):
    name: str
    description: str
    keywords: list[str] = Field(default_factory=list)


class ResumeProfile(BaseModel):
    candidate_name: str = ""
    email: str = ""
    phone: str = ""
    education_level: str = ""
    education_level_raw: str = ""
    education_level_score: int = 0
    graduation_school: str = ""
    target_role: str = ""
    target_roles: list[str] = Field(default_factory=list)
    target_city: str = ""
    current_city: str = ""
    years_experience: float = 0.0
    languages: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    project_experience: list[ResumeProject] = Field(default_factory=list)
    work_experience: list[str] = Field(default_factory=list)
    summary: str = ""
    notes: str = ""


class ResumeEducation(BaseModel):
    school: str = ""
    college: str = ""
    major: str = ""
    degree_name_raw: str = ""
    degree_label: str = ""
    degree_level: int = 0
    start_date: str = ""
    end_date: str = ""
    is_full_time: bool = True


class ResumeLanguage(BaseModel):
    name: str
    level: str = ""


class ResumeWorkExperience(BaseModel):
    company: str = ""
    industry: str = ""
    position: str = ""
    start_date: str = ""
    end_date: str = ""
    duration_months: int = 0
    responsibilities: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)


class ResumeBasics(BaseModel):
    name: str = ""
    gender: str = ""
    age: int | None = None
    phone: str = ""
    email: str = ""
    current_city: str = ""
    hukou_city: str = ""
    marital_status: str = ""


class ResumeJobIntention(BaseModel):
    target_roles: list[str] = Field(default_factory=list)
    target_city: list[str] = Field(default_factory=list)
    target_salary_min: int | None = None
    target_salary_max: int | None = None
    job_type: list[str] = Field(default_factory=list)


class ResumeSkills(BaseModel):
    domain_skills: list[str] = Field(default_factory=list)
    technical_skills: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    office_tools: list[str] = Field(default_factory=list)
    certificates: list[str] = Field(default_factory=list)
    languages: list[ResumeLanguage] = Field(default_factory=list)


class ResumeProfileSection(BaseModel):
    summary: str = ""
    self_evaluation: str = ""
    strengths: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)


class ResumeDerived(BaseModel):
    highest_degree_label: str = ""
    highest_degree_level: int = 0
    total_years_experience: float = 0.0
    latest_position: str = ""
    latest_company: str = ""
    core_skills: list[str] = Field(default_factory=list)
    role_tags: list[str] = Field(default_factory=list)
    industry_tags: list[str] = Field(default_factory=list)
    city_tags: list[str] = Field(default_factory=list)
    qualification_tags: list[str] = Field(default_factory=list)
    embedding_text: str = ""


class StructuredResume(BaseModel):
    schema_version: str = "resume_v1"
    resume_id: str = ""
    source_filename: str = ""
    content_type: str = ""
    raw_text: str = ""
    basics: ResumeBasics = Field(default_factory=ResumeBasics)
    job_intention: ResumeJobIntention = Field(default_factory=ResumeJobIntention)
    education: list[ResumeEducation] = Field(default_factory=list)
    work_experience: list[ResumeWorkExperience] = Field(default_factory=list)
    projects: list[ResumeProject] = Field(default_factory=list)
    skills: ResumeSkills = Field(default_factory=ResumeSkills)
    profile: ResumeProfileSection = Field(default_factory=ResumeProfileSection)
    derived: ResumeDerived = Field(default_factory=ResumeDerived)


class ResumeHardConditions(BaseModel):
    highest_degree_label: str = ""
    highest_degree_level: int = 0
    total_years_experience: float = 0.0
    target_roles: list[str] = Field(default_factory=list)
    target_cities: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    current_city: str = ""


class ResumeSoftConditions(BaseModel):
    core_skills: list[str] = Field(default_factory=list)
    tool_skills: list[str] = Field(default_factory=list)
    domain_tags: list[str] = Field(default_factory=list)
    work_keywords: list[str] = Field(default_factory=list)
    project_keywords: list[str] = Field(default_factory=list)
    summary: str = ""
    embedding_text: str = ""


class ResumeVectorizationPayload(BaseModel):
    hard_filter_fields: ResumeHardConditions
    soft_match_fields: ResumeSoftConditions
    embedding_text: str
    metadata: dict[str, str | int | float | list[str]] = Field(default_factory=dict)


class ResumeParseResponse(BaseModel):
    filename: str
    content_type: str
    text_length: int
    extracted_text: str
    profile: ResumeProfile
    structured_resume: StructuredResume
    hard_conditions: ResumeHardConditions
    soft_conditions: ResumeSoftConditions
    vectorization_payload: ResumeVectorizationPayload
    embedding_text: str
