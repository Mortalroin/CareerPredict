from pydantic import BaseModel, Field


class JobImportItem(BaseModel):
    job_id: str = ""
    title: str
    company_name: str
    city: str = ""
    district: str = ""
    industry: list[str] = Field(default_factory=list)
    job_type: str = "full_time"
    salary_min: int | None = None
    salary_max: int | None = None
    degree_name_raw: str = ""
    min_degree_label: str = ""
    min_degree_level: int = 0
    min_years_experience: float = 0.0
    required_languages: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    required_tools: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    description: str = ""


class JobBasicInfo(BaseModel):
    title: str = ""
    company_name: str = ""
    city: str = ""
    district: str = ""
    job_type: str = ""
    industry: list[str] = Field(default_factory=list)


class JobRequirements(BaseModel):
    degree_name_raw: str = ""
    min_degree_label: str = ""
    min_degree_level: int = 0
    min_years_experience: float = 0.0
    required_languages: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    required_tools: list[str] = Field(default_factory=list)


class JobResponsibilities(BaseModel):
    main_tasks: list[str] = Field(default_factory=list)
    description: str = ""


class JobTags(BaseModel):
    role_tags: list[str] = Field(default_factory=list)
    industry_tags: list[str] = Field(default_factory=list)
    skill_tags: list[str] = Field(default_factory=list)
    tool_tags: list[str] = Field(default_factory=list)
    qualification_tags: list[str] = Field(default_factory=list)
    city_tags: list[str] = Field(default_factory=list)


class JobDerived(BaseModel):
    embedding_text: str = ""


class StructuredJob(BaseModel):
    schema_version: str = "job_v1"
    job_id: str
    basic_info: JobBasicInfo
    salary_min: int | None = None
    salary_max: int | None = None
    requirements: JobRequirements
    responsibilities: JobResponsibilities
    tags: JobTags
    derived: JobDerived


class JobHardConditions(BaseModel):
    min_degree_level: int = 0
    min_years_experience: float = 0.0
    city: str = ""
    job_type: str = ""
    required_languages: list[str] = Field(default_factory=list)


class JobSoftConditions(BaseModel):
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    required_tools: list[str] = Field(default_factory=list)
    role_tags: list[str] = Field(default_factory=list)
    industry_tags: list[str] = Field(default_factory=list)
    embedding_text: str = ""


class JobVectorizationPayload(BaseModel):
    hard_filter_fields: JobHardConditions
    soft_match_fields: JobSoftConditions
    embedding_text: str
    metadata: dict[str, str | int | float | list[str]] = Field(default_factory=dict)


class JobRecord(BaseModel):
    structured_job: StructuredJob
    hard_conditions: JobHardConditions
    soft_conditions: JobSoftConditions
    vectorization_payload: JobVectorizationPayload


class JobImportResponse(BaseModel):
    imported_count: int
    jobs: list[JobRecord]
