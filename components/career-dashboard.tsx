"use client"

import { useEffect, useMemo, useState } from "react"

import { CTASection } from "@/components/cta-section"
import { CapabilityMatrix } from "@/components/capability-matrix"
import { CareerProfile } from "@/components/career-profile"
import { CareerRoadmap } from "@/components/career-roadmap"
import { GrowthPath } from "@/components/growth-path"
import { HeroSection } from "@/components/hero-section"
import { JobRecommendations } from "@/components/job-recommendations"
import { KnowledgeInsights } from "@/components/knowledge-insights"
import { Navbar } from "@/components/navbar"
import { ProjectHighlights } from "@/components/project-highlights"
import { ResumeReview } from "@/components/resume-review"
import { ResumeUpload } from "@/components/resume-upload"
import { TransitionPaths } from "@/components/transition-paths"
import { analyzeResume, checkBackendHealth } from "@/lib/api"
import { mockCareerAnalysis } from "@/lib/mock-data"
import type { CareerAnalysisResponse } from "@/lib/types"

export function CareerDashboard() {
  const [analysis, setAnalysis] = useState<CareerAnalysisResponse>(mockCareerAnalysis)
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState("AI 产品经理")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [backendReady, setBackendReady] = useState<boolean | null>(null)
  const [statusMessage, setStatusMessage] = useState(
    "当前页面会先展示演示报告数据。上传简历后，系统会调用 FastAPI 进行真实解析、岗位匹配与职业规划生成。",
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
      return "检查中"
    }

    return backendReady ? "后端已连接" : "演示模式"
  }, [backendReady])

  async function handleAnalyze() {
    if (!file) {
      setStatusMessage("请先上传 PDF、DOC 或 DOCX 简历，再开始分析。")
      return
    }

    setIsSubmitting(true)
    setStatusMessage("正在解析简历、匹配岗位并刷新职业报告，请稍候…")

    try {
      const result = await analyzeResume(file, { targetRole, notes })
      setAnalysis(result)
      setStatusMessage("简历解析与岗位匹配已完成，页面已更新为真实后端数据。")
    } catch (error) {
      const message = error instanceof Error ? error.message : "分析失败，请稍后重试。"
      setStatusMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLoadDemo() {
    setAnalysis(mockCareerAnalysis)
    setStatusMessage("演示报告已加载，你仍然可以随时上传真实简历重新分析。")
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
        <ResumeReview
          profile={analysis.profile}
          projects={analysis.projects}
          capabilityScores={analysis.capabilityScores}
          report={analysis.report}
        />
        <CareerProfile profile={analysis.profile} />
        <ProjectHighlights projects={analysis.projects} />
        <CapabilityMatrix items={analysis.capabilityScores} />
        <JobRecommendations
          jobs={analysis.jobs}
          portraits={analysis.jobPortraits}
          candidateName={analysis.profile.name}
          reportTitle={analysis.report.reportTitle}
        />
        <CareerRoadmap
          steps={analysis.roadmap}
          candidateName={analysis.profile.name}
          reportTitle={analysis.report.reportTitle}
          targetRole={analysis.profile.suggestedDirection}
          capabilityScores={analysis.capabilityScores}
        />
        <GrowthPath
          stages={analysis.growth}
          candidateName={analysis.profile.name}
          reportTitle={analysis.report.reportTitle}
          targetRole={analysis.profile.suggestedDirection}
          capabilityScores={analysis.capabilityScores}
        />
        <TransitionPaths paths={analysis.transitionPaths} portraits={analysis.jobPortraits} />
        <KnowledgeInsights data={analysis.knowledge} />
        <CTASection report={analysis.report} />
      </main>
      <footer className="border-t border-border/60 bg-card/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>当前前端已同时支持真实 FastAPI 简历匹配与本地演示回退两种模式。</p>
          <p>建议后端接口：`POST /api/v1/match/resume-to-jobs` 与 `GET /api/v1/health`。</p>
        </div>
      </footer>
    </div>
  )
}
