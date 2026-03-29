export interface AnalysisRequestPayload {
  targetRole: string
  notes: string
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
