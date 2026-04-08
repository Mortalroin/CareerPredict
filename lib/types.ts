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

export interface BackendCapabilityScore {
  dimension: string
  score: number
  weight: number
  summary: string
  matched_items: string[]
  gap_items: string[]
}

export interface BackendJobPortrait {
  role_name: string
  role_family: string
  summary: string
  professional_skills: string[]
  certificates: string[]
  innovation_points: string[]
  learning_requirements: string[]
  stress_requirements: string[]
  communication_requirements: string[]
  internship_requirements: string[]
  representative_companies: string[]
}

export interface BackendPathNode {
  title: string
  stage: string
  description: string
  skills: string[]
}

export interface BackendVerticalPath {
  role_family: string
  description: string
  nodes: BackendPathNode[]
}

export interface BackendTransitionPath {
  source_role: string
  target_role: string
  reason: string
  bridge_skills: string[]
  action_items: string[]
}

export interface BackendActionPlanPhase {
  phase: string
  timeline: string
  goals: string[]
  actions: string[]
  metrics: string[]
}

export interface BackendResumeMatchResponse {
  structured_resume: {
    basics: {
      name: string
      current_city: string
    }
    job_intention: {
      target_roles: string[]
      target_city: string[]
    }
    projects: {
      name: string
      description: string
      keywords: string[]
    }[]
    skills: {
      certificates: string[]
    }
    work_experience: {
      responsibilities: string[]
      keywords: string[]
    }[]
    profile: {
      summary: string
      strengths: string[]
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
  capability_scores: BackendCapabilityScore[]
  job_portraits: BackendJobPortrait[]
  vertical_paths: BackendVerticalPath[]
  transition_paths: BackendTransitionPath[]
  career_report: {
    target_role: string
    target_city: string
    completeness_score: number
    competitiveness_score: number
    readiness_score: number
    llm_enabled: boolean
    overview: string
    exploration: string
    path_plan: string
    edit_tips: string[]
    action_plan: BackendActionPlanPhase[]
    export_ready: boolean
  }
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
  certificates: string[]
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

export interface CapabilityScoreCard {
  dimension: string
  score: number
  weight: number
  summary: string
  matchedItems: string[]
  gapItems: string[]
}

export interface ProjectHighlight {
  title: string
  description: string
  tags: string[]
}

export interface JobPortraitCard {
  roleName: string
  roleFamily: string
  summary: string
  professionalSkills: string[]
  certificates: string[]
  innovationPoints: string[]
  learningRequirements: string[]
  stressRequirements: string[]
  communicationRequirements: string[]
  internshipRequirements: string[]
  representativeCompanies: string[]
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

export interface RoadmapTask {
  id: string
  title: string
  description: string
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
  overview: string
  pathPlan: string
  editTips: string[]
  llmEnabled: boolean
  exportReady: boolean
  actionPlan: {
    phase: string
    timeline: string
    goals: string[]
    actions: string[]
    metrics: string[]
  }[]
}

export interface CareerAnalysisResponse {
  profile: CareerProfileData
  projects: ProjectHighlight[]
  capabilityScores: CapabilityScoreCard[]
  jobs: JobRecommendation[]
  jobPortraits: JobPortraitCard[]
  roadmap: RoadmapStep[]
  growth: GrowthStage[]
  transitionPaths: {
    sourceRole: string
    targetRole: string
    reason: string
    bridgeSkills: string[]
    actionItems: string[]
  }[]
  knowledge: KnowledgeInsightsData
  report: ReportSummary
}

export interface JobDetailSnapshot {
  job: JobRecommendation
  portrait?: JobPortraitCard
  reportTitle: string
  candidateName: string
}

export interface GrowthDetailSnapshot {
  selectedStage: GrowthStage
  nextStage?: GrowthStage
  reportTitle: string
  candidateName: string
  targetRole: string
  capabilityScores: CapabilityScoreCard[]
}

export interface RoadmapDetailSnapshot {
  selectedStep: RoadmapStep
  nextStep?: RoadmapStep
  reportTitle: string
  candidateName: string
  targetRole: string
  capabilityScores: CapabilityScoreCard[]
  suggestedTasks: RoadmapTask[]
}
