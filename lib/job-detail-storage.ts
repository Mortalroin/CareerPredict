"use client"

import type {
  GrowthDetailSnapshot,
  JobDetailSnapshot,
  JobRecommendationsSnapshot,
  RoadmapDetailSnapshot,
} from "@/lib/types"

const JOB_PREFIX = "career-job-detail:"
const JOB_LIST_KEY = "career-job-recommendations"
const GROWTH_PREFIX = "career-growth-detail:"
const ROADMAP_PREFIX = "career-roadmap-detail:"

export function saveJobDetailSnapshot(snapshot: JobDetailSnapshot) {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(`${JOB_PREFIX}${snapshot.job.id}`, JSON.stringify(snapshot))
}

export function readJobDetailSnapshot(jobId: string): JobDetailSnapshot | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.sessionStorage.getItem(`${JOB_PREFIX}${jobId}`)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as JobDetailSnapshot
  } catch {
    return null
  }
}

export function saveJobRecommendationsSnapshot(snapshot: JobRecommendationsSnapshot) {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(JOB_LIST_KEY, JSON.stringify(snapshot))
}

export function readJobRecommendationsSnapshot(): JobRecommendationsSnapshot | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.sessionStorage.getItem(JOB_LIST_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as JobRecommendationsSnapshot
  } catch {
    return null
  }
}

export function saveGrowthDetailSnapshot(snapshot: GrowthDetailSnapshot, stageId: number) {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(`${GROWTH_PREFIX}${stageId}`, JSON.stringify(snapshot))
}

export function readGrowthDetailSnapshot(stageId: string): GrowthDetailSnapshot | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.sessionStorage.getItem(`${GROWTH_PREFIX}${stageId}`)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as GrowthDetailSnapshot
  } catch {
    return null
  }
}

export function saveRoadmapDetailSnapshot(snapshot: RoadmapDetailSnapshot, stepId: number) {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(`${ROADMAP_PREFIX}${stepId}`, JSON.stringify(snapshot))
}

export function readRoadmapDetailSnapshot(stepId: string): RoadmapDetailSnapshot | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.sessionStorage.getItem(`${ROADMAP_PREFIX}${stepId}`)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as RoadmapDetailSnapshot
  } catch {
    return null
  }
}
