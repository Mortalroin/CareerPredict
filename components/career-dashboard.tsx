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
import { ResumeReview } from "@/components/resume-review"
import { ResumeUpload } from "@/components/resume-upload"
import { TransitionPaths } from "@/components/transition-paths"
import { analyzeResume, checkBackendHealth, saveResumeOptimization } from "@/lib/api"
import { readDashboardScrollPosition, readDashboardSnapshot, saveDashboardSnapshot } from "@/lib/job-detail-storage"
import { mockCareerAnalysis } from "@/lib/mock-data"
import {
  buildResumeOptimizationFields,
  mergeResumeNotes,
  syncResumeOptimizationDrafts,
} from "@/lib/resume-optimization"
import type { CareerAnalysisResponse, ResumeOptimizationDraft, ResumeUploadMode } from "@/lib/types"

export function CareerDashboard() {
  const [analysis, setAnalysis] = useState<CareerAnalysisResponse>(mockCareerAnalysis)
  const [resumeId, setResumeId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState("AI 产品经理")
  const [notes, setNotes] = useState("")
  const [uploadMode, setUploadMode] = useState<ResumeUploadMode>("default")
  const [optimizationDrafts, setOptimizationDrafts] = useState<ResumeOptimizationDraft>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingOptimization, setIsSavingOptimization] = useState(false)
  const [backendReady, setBackendReady] = useState<boolean | null>(null)
  const [statusMessage, setStatusMessage] = useState(
    "当前页面会先展示演示报告数据。上传简历后，系统会调用 FastAPI 进行真实解析、岗位匹配与职业规划生成。",
  )
  const optimizationFields = useMemo(
    () => buildResumeOptimizationFields(analysis.profile, analysis.projects),
    [analysis.profile, analysis.projects],
  )

  useEffect(() => {
    let active = true
    const cached = readDashboardSnapshot()
    const cachedScroll = readDashboardScrollPosition()

    if (cached) {
      setAnalysis(cached.analysis)
      setResumeId(cached.resumeId || cached.analysis.resumeId || "")
      setTargetRole(cached.targetRole)
      setNotes(cached.notes)
      setStatusMessage(cached.statusMessage)
      setUploadMode(cached.uploadMode || "default")
      setOptimizationDrafts(cached.optimizationDrafts || {})
    }

    if (cachedScroll !== null) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: cachedScroll, behavior: "auto" })
      })
    }

    void checkBackendHealth().then((healthy) => {
      if (active) {
        setBackendReady(healthy)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setOptimizationDrafts((currentDrafts) => syncResumeOptimizationDrafts(optimizationFields, currentDrafts))
  }, [optimizationFields])

  useEffect(() => {
    saveDashboardSnapshot({
      analysis,
      resumeId,
      targetRole,
      notes,
      statusMessage,
      uploadMode,
      optimizationDrafts,
    })
  }, [analysis, notes, optimizationDrafts, resumeId, statusMessage, targetRole, uploadMode])

  const reportBadge = useMemo(() => {
    if (backendReady === null) {
      return "检查中"
    }

    return backendReady ? "后端已连接" : "演示模式"
  }, [backendReady])

  const mergedNotes = useMemo(
    () => mergeResumeNotes(notes, optimizationFields, optimizationDrafts),
    [notes, optimizationDrafts, optimizationFields],
  )

  const canSaveOptimization = Boolean(backendReady && resumeId)

  function scrollToElement(id: string) {
    if (typeof document === "undefined") {
      return
    }

    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  function handleOpenOptimizeMode() {
    setUploadMode("optimize")
    scrollToElement("upload")
  }

  function handleUploadModeChange(nextMode: ResumeUploadMode) {
    setUploadMode(nextMode)
  }

  function handleOptimizationDraftChange(key: string, value: string) {
    setOptimizationDrafts((currentDrafts) => ({
      ...currentDrafts,
      [key]: value,
    }))
  }

  async function handleAnalyze() {
    if (!file) {
      setStatusMessage("请先上传 PDF、DOC 或 DOCX 简历，再开始分析。")
      return
    }

    setIsSubmitting(true)
    setStatusMessage("正在解析简历、匹配岗位并刷新职业报告，请稍候。")

    try {
      const result = await analyzeResume(file, {
        targetRole,
        notes: mergedNotes,
        resumeId: resumeId || undefined,
      })
      setAnalysis(result)
      setResumeId(result.resumeId || "")
      setStatusMessage("简历解析与岗位匹配已完成，页面已更新为真实后端数据。")
      setUploadMode("default")
      scrollToElement("resume-review")
    } catch (error) {
      const message = error instanceof Error ? error.message : "分析失败，请稍后重试。"
      setStatusMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveOptimization() {
    if (!backendReady) {
      setStatusMessage("后端当前不可用，暂时无法把优化内容保存到数据库。")
      return
    }

    if (!resumeId) {
      setStatusMessage("请先上传真实简历并生成一次报告，然后再把优化内容保存到数据库。")
      return
    }

    setIsSavingOptimization(true)
    setStatusMessage("正在保存优化内容到数据库，请稍候。")

    try {
      await saveResumeOptimization({
        resumeId,
        targetRole,
        notes,
        optimizationDrafts,
        mergedNotes,
      })
      setStatusMessage("优化内容已保存到数据库。你可以稍后继续编辑，或直接重新生成新报告。")
      setUploadMode("default")
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存优化内容失败，请稍后重试。"
      setStatusMessage(message)
    } finally {
      setIsSavingOptimization(false)
    }
  }

  function handleLoadDemo() {
    setAnalysis(mockCareerAnalysis)
    setResumeId("")
    setStatusMessage("演示报告已加载，你仍然可以随时上传真实简历重新分析。")
    scrollToElement("resume-review")
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
          uploadMode={uploadMode}
          optimizationFields={optimizationFields}
          optimizationDrafts={optimizationDrafts}
          isSubmitting={isSubmitting}
          isSavingOptimization={isSavingOptimization}
          canSaveOptimization={canSaveOptimization}
          statusMessage={statusMessage}
          backendReady={backendReady}
          onFileChange={setFile}
          onTargetRoleChange={setTargetRole}
          onNotesChange={setNotes}
          onUploadModeChange={handleUploadModeChange}
          onOptimizationDraftChange={handleOptimizationDraftChange}
          onSaveOptimization={handleSaveOptimization}
          onAnalyze={handleAnalyze}
          onLoadDemo={handleLoadDemo}
        />
        <ResumeReview
          profile={analysis.profile}
          projects={analysis.projects}
          capabilityScores={analysis.capabilityScores}
          report={analysis.report}
          templateFields={optimizationFields}
          onContinueOptimize={handleOpenOptimizeMode}
        />
        <CareerProfile profile={analysis.profile} jobs={analysis.jobs} />
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
          <p>建议后端接口：`POST /api/v1/match/resume-to-jobs`、`POST /api/v1/resumes/:id/optimization`、`GET /api/v1/health`。</p>
        </div>
      </footer>
    </div>
  )
}
