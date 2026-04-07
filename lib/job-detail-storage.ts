"use client"

import type { GrowthDetailSnapshot, JobDetailSnapshot } from "@/lib/types"

const JOB_PREFIX = "career-job-detail:"
const GROWTH_PREFIX = "career-growth-detail:"

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
