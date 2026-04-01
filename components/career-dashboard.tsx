"use client"

import { useEffect, useMemo, useState } from "react"

import { CTASection } from "@/components/cta-section"
import { CareerProfile } from "@/components/career-profile"
import { CareerRoadmap } from "@/components/career-roadmap"
import { GrowthPath } from "@/components/growth-path"
import { HeroSection } from "@/components/hero-section"
import { JobRecommendations } from "@/components/job-recommendations"
import { KnowledgeInsights } from "@/components/knowledge-insights"
import { Navbar } from "@/components/navbar"
import { ResumeUpload } from "@/components/resume-upload"
import { analyzeResume, checkBackendHealth } from "@/lib/api"
import { mockCareerAnalysis } from "@/lib/mock-data"
import type { CareerAnalysisResponse } from "@/lib/types"

export function CareerDashboard() {
  const [analysis, setAnalysis] = useState<CareerAnalysisResponse>(mockCareerAnalysis)
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState("AI Product Lead")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [backendReady, setBackendReady] = useState<boolean | null>(null)
  const [statusMessage, setStatusMessage] = useState(
    "The page is currently showing demo report data. Upload a resume to run FastAPI parsing and job matching.",
  )

  useEffect(() => {
    let active = true

    void checkBackendHealth().then((healthy) => {
      if (active) {
        setBackendReady(healthy)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const reportBadge = useMemo(() => {
    if (backendReady === null) {
      return "Checking backend"
    }

    return backendReady ? "FastAPI connected" : "Mock fallback active"
  }, [backendReady])

  async function handleAnalyze() {
    if (!file) {
      setStatusMessage("Please upload a PDF or DOCX resume before starting analysis.")
      return
    }

    setIsSubmitting(true)
    setStatusMessage("Parsing the resume, matching jobs, and refreshing the dashboard...")

    try {
      const result = await analyzeResume(file, { targetRole, notes })
      setAnalysis(result)
      setStatusMessage("Resume parsed and matched successfully. The dashboard has been refreshed with live backend data.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed. Please try again."
      setStatusMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLoadDemo() {
    setAnalysis(mockCareerAnalysis)
    setStatusMessage("Demo report loaded. You can still upload a real resume at any time.")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar reportBadge={reportBadge} />
      <main>
        <HeroSection />
        <ResumeUpload
          file={file}
          targetRole={targetRole}
          notes={notes}
          isSubmitting={isSubmitting}
          statusMessage={statusMessage}
          backendReady={backendReady}
          onFileChange={setFile}
          onTargetRoleChange={setTargetRole}
          onNotesChange={setNotes}
          onAnalyze={handleAnalyze}
          onLoadDemo={handleLoadDemo}
        />
        <CareerProfile profile={analysis.profile} />
        <JobRecommendations jobs={analysis.jobs} />
        <CareerRoadmap steps={analysis.roadmap} />
        <GrowthPath stages={analysis.growth} />
        <KnowledgeInsights data={analysis.knowledge} />
        <CTASection report={analysis.report} />
      </main>
      <footer className="border-t border-border/60 bg-card/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>The frontend now supports live FastAPI resume matching and local mock fallback.</p>
          <p>Recommended backend endpoints: POST /api/v1/match/resume-to-jobs and GET /api/v1/health.</p>
        </div>
      </footer>
    </div>
  )
}
