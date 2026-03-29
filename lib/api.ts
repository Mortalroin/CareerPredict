import { mockCareerAnalysis } from "@/lib/mock-data"
import type { AnalysisRequestPayload, CareerAnalysisResponse } from "@/lib/types"

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

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/career/analyze`, {
      method: "POST",
      body: formData,
    })

    return await parseJson<CareerAnalysisResponse>(response)
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
