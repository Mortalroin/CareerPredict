export interface AnalysisRequestPayload {
  targetRole: string
  notes: string
}

export interface BackendMatchBreakdown {
  degree_pass: boolean
  experience_pass: boolean
  city_pass: boolean
  language_pass: boolean
  hard_filter_bonus: number
  skill_overlap: string[]
  missing_required_skills: string[]
}

export interface BackendJobMatchItem {
  job_id: string
  title: string
  company_name: string
  city: string
  similarity_score: number
  total_score: number
  breakdown: BackendMatchBreakdown
}

export interface BackendResumeMatchResponse {
  structured_resume: {
    basics: {
      name: string
      current_city: string
    }
    profile: {
      summary: string
    }
    derived: {
      highest_degree_label: string
      total_years_experience: number
      core_skills: string[]
      role_tags: string[]
    }
  }
  hard_conditions: {
    target_roles: string[]
    target_cities: string[]
  }
  soft_conditions: {
    tool_skills: string[]
  }
  matches: BackendJobMatchItem[]
}

export interface ProfileCardItem {
  label: string
  value: string
}

export interface CareerProfileData {
  name: string
  headline: string
  summary: string
  cards: ProfileCardItem[]
  skills: string[]
  strengths: string[]
  suggestedDirection: string
}

export interface JobRecommendation {
  id: string
  title: string
  company: string
  matchScore: number
  salary: string
  location: string
  tags: string[]
  reason: string
}

export interface RoadmapStep {
  id: number
  title: string
  subtitle: string
  description: string
  timeframe: string
  status: "done" | "current" | "next"
}

export interface GrowthStage {
  id: number
  role: string
  level: string
  timeframe: string
  salary: string
  focus: string[]
  current?: boolean
}

export interface KnowledgeDocument {
  title: string
  relevance: number
  category: string
}

export interface TrendItem {
  title: string
  value: string
}

export interface SkillDemand {
  name: string
  demand: number
}

export interface KnowledgeInsightsData {
  documents: KnowledgeDocument[]
  trends: TrendItem[]
  skills: SkillDemand[]
  certifications: string[]
}

export interface ReportSummary {
  completionRate: number
  reportTitle: string
  updatedAt: string
  highlights: string[]
}

export interface CareerAnalysisResponse {
  profile: CareerProfileData
  jobs: JobRecommendation[]
  roadmap: RoadmapStep[]
  growth: GrowthStage[]
  knowledge: KnowledgeInsightsData
  report: ReportSummary
}
