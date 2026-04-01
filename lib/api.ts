import { mockCareerAnalysis } from "@/lib/mock-data"
import type {
  AnalysisRequestPayload,
  BackendJobMatchItem,
  BackendResumeMatchResponse,
  CareerAnalysisResponse,
  GrowthStage,
  JobRecommendation,
  RoadmapStep,
} from "@/lib/types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000"

const ENABLE_FALLBACK = process.env.NEXT_PUBLIC_ENABLE_API_FALLBACK !== "false"

function buildMockResponse(payload: AnalysisRequestPayload): CareerAnalysisResponse {
  return {
    ...mockCareerAnalysis,
    profile: {
      ...mockCareerAnalysis.profile,
      suggestedDirection: payload.targetRole || mockCareerAnalysis.profile.suggestedDirection,
    },
  }
}

function formatDegreeLabel(value: string): string {
  const labels: Record<string, string> = {
    bachelor: "Bachelor",
    master: "Master",
    phd: "PhD",
    college: "College",
    vocational: "Vocational",
    high_school: "High school",
  }

  return labels[value] || value || "Unknown"
}

function buildJobReason(match: BackendJobMatchItem): string {
  const reasons: string[] = []

  if (match.breakdown.skill_overlap.length > 0) {
    reasons.push(`Matched skills: ${match.breakdown.skill_overlap.join(", ")}`)
  }

  if (match.breakdown.degree_pass) {
    reasons.push("Degree requirement passed")
  }

  if (match.breakdown.experience_pass) {
    reasons.push("Experience requirement passed")
  }

  if (match.breakdown.city_pass) {
    reasons.push("Target city aligned")
  }

  if (match.breakdown.missing_required_skills.length > 0) {
    reasons.push(`Missing skills: ${match.breakdown.missing_required_skills.join(", ")}`)
  }

  if (reasons.length === 0) {
    reasons.push("Matched by overall resume similarity and structured filters")
  }

  return reasons.join(". ")
}

function buildRoadmap(targetRole: string): RoadmapStep[] {
  return [
    {
      id: 1,
      title: "Resume parsed",
      subtitle: "Structured profile created",
      description: "The uploaded resume has been parsed into hard conditions and soft conditions for matching.",
      timeframe: "Now",
      status: "done",
    },
    {
      id: 2,
      title: "Role targeting",
      subtitle: "Focus the search direction",
      description: `Prioritize roles related to ${targetRole || "your selected direction"} and refine target cities if needed.`,
      timeframe: "This week",
      status: "current",
    },
    {
      id: 3,
      title: "Skill alignment",
      subtitle: "Close the visible gaps",
      description: "Review missing skills in the matched jobs and strengthen the highest-frequency requirements first.",
      timeframe: "Next 2-4 weeks",
      status: "next",
    },
    {
      id: 4,
      title: "Application sprint",
      subtitle: "Apply with tailored versions",
      description: "Customize resume highlights for the top matched roles and start a focused application round.",
      timeframe: "Next month",
      status: "next",
    },
  ]
}

function buildGrowth(targetRole: string): GrowthStage[] {
  return [
    {
      id: 1,
      role: "Current profile",
      level: "Now",
      timeframe: "Present",
      salary: "Based on market match",
      focus: ["Resume parsing", "Structured profile", "Existing skills"],
      current: true,
    },
    {
      id: 2,
      role: "Target direction",
      level: "Next step",
      timeframe: "1-3 months",
      salary: "Depends on matched roles",
      focus: [targetRole || "Selected role", "Skill gap fixing", "Resume optimization"],
    },
    {
      id: 3,
      role: "Better-fit applications",
      level: "After iteration",
      timeframe: "3-6 months",
      salary: "Higher-fit range",
      focus: ["Higher match score", "Interview stories", "Role specialization"],
    },
  ]
}

function mapBackendResponse(
  response: BackendResumeMatchResponse,
  payload: AnalysisRequestPayload,
): CareerAnalysisResponse {
  const { structured_resume: resume, hard_conditions: hard, soft_conditions: soft, matches } = response
  const targetRole = hard.target_roles[0] || payload.targetRole || "General direction"
  const targetCity = hard.target_cities[0] || "Not specified"
  const highestDegree = formatDegreeLabel(resume.derived.highest_degree_label)
  const years = `${resume.derived.total_years_experience || 0} years`
  const skills = [...resume.derived.core_skills, ...soft.tool_skills].filter(Boolean)
  const uniqueSkills = Array.from(new Set(skills)).slice(0, 8)
  const jobs: JobRecommendation[] = matches.map((match) => ({
    id: match.job_id,
    title: match.title,
    company: match.company_name,
    matchScore: Math.round(match.total_score),
    salary: `Score ${Math.round(match.total_score)}`,
    location: match.city,
    tags: [
      ...match.breakdown.skill_overlap,
      ...(match.breakdown.city_pass ? ["City fit"] : []),
      ...(match.breakdown.degree_pass ? ["Degree fit"] : []),
    ].slice(0, 4),
    reason: buildJobReason(match),
  }))

  const topJob = jobs[0]
  const highlights = [
    `Top target role: ${targetRole}`,
    `Top matched job: ${topJob ? `${topJob.title} at ${topJob.company}` : "No match yet"}`,
    `Detected experience: ${years}`,
  ]

  return {
    profile: {
      name: resume.basics.name || "Candidate",
      headline: `${targetRole} - Structured Matching Report`,
      summary: resume.profile.summary,
      cards: [
        { label: "Current city", value: resume.basics.current_city || "Unknown" },
        { label: "Education", value: highestDegree },
        { label: "Experience", value: years },
      ],
      skills: uniqueSkills.length > 0 ? uniqueSkills : ["No skills extracted yet"],
      strengths:
        resume.derived.role_tags.length > 0 ? resume.derived.role_tags : ["Structured profile generated", "Ready for role matching"],
      suggestedDirection: targetRole,
    },
    jobs,
    roadmap: buildRoadmap(targetRole),
    growth: buildGrowth(targetRole),
    knowledge: {
      documents: matches.slice(0, 3).map((match, index) => ({
        title: `${match.title} at ${match.company_name}`,
        relevance: Math.round(match.total_score),
        category: index === 0 ? "Top match" : "Matched role",
      })),
      trends: [
        { title: "Target city", value: targetCity },
        { title: "Highest degree", value: highestDegree },
        { title: "Matched jobs returned", value: `${matches.length}` },
      ],
      skills: uniqueSkills.slice(0, 4).map((skill, index) => ({
        name: skill,
        demand: Math.max(60, 95 - index * 8),
      })),
      certifications: resume.derived.role_tags,
    },
    report: {
      completionRate: matches.length > 0 ? 88 : 52,
      reportTitle: "FastAPI Resume Matching Report",
      updatedAt: "Just updated",
      highlights,
    },
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function analyzeResume(
  file: File,
  payload: AnalysisRequestPayload,
): Promise<CareerAnalysisResponse> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("target_role", payload.targetRole)
  formData.append("notes", payload.notes)
  formData.append("limit", "8")

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/match/resume-to-jobs`, {
      method: "POST",
      body: formData,
    })

    const data = await parseJson<BackendResumeMatchResponse>(response)
    return mapBackendResponse(data, payload)
  } catch (error) {
    if (!ENABLE_FALLBACK) {
      throw error
    }

    await new Promise((resolve) => setTimeout(resolve, 800))
    return buildMockResponse(payload)
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: "GET",
    })

    return response.ok
  } catch {
    return false
  }
}
