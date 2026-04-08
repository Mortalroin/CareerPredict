"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { ArrowLeft, ArrowRight, BriefcaseBusiness, MapPin, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readJobRecommendationsSnapshot, saveJobDetailSnapshot } from "@/lib/job-detail-storage"
import type { JobPortraitCard, JobRecommendation, JobRecommendationsSnapshot } from "@/lib/types"

function scoreStyle(score: number) {
  if (score >= 85) return "bg-emerald-500/10 text-emerald-700"
  if (score >= 70) return "bg-primary/10 text-primary"
  return "bg-secondary text-foreground"
}

function findPortrait(job: JobRecommendation, portraits: JobPortraitCard[]) {
  const normalizedTitle = job.title.trim().toLowerCase()

  return (
    portraits.find((portrait) => portrait.roleName.trim().toLowerCase() === normalizedTitle) ||
    portraits.find((portrait) => portrait.roleName.includes(job.title) || job.title.includes(portrait.roleName))
  )
}

export function RecommendedJobsPage() {
  const [snapshot, setSnapshot] = useState<JobRecommendationsSnapshot | null>(null)

  useEffect(() => {
    setSnapshot(readJobRecommendationsSnapshot())
  }, [])

  const sortedJobs = useMemo(() => {
    return snapshot ? [...snapshot.jobs].sort((a, b) => b.matchScore - a.matchScore) : []
  }, [snapshot])

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          <Card className="mt-6 border-border/60">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-3xl font-semibold tracking-tight">暂未找到推荐岗位列表</h1>
              <p className="text-muted-foreground">请先从首页进入“更多推荐岗位”，这样系统才能带上当前分析结果。</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-secondary/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80">
              <ArrowLeft className="h-4 w-4" />
              返回推荐结果
            </Link>
            <p className="mt-4 text-sm font-medium text-primary">推荐岗位扩展列表</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">更多推荐岗位</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-muted-foreground">
              当前为 {snapshot.candidateName || "你"} 展示全部推荐岗位，可继续查看详情并挑选更适合投递的方向。
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/90 px-5 py-4 text-sm text-muted-foreground">
            共 {sortedJobs.length} 个推荐岗位
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {sortedJobs.map((job, index) => {
            const portrait = findPortrait(job, snapshot.portraits)

            return (
              <Card key={job.id} className="border-border/60 bg-card/90 shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-primary">推荐岗位 {index + 1}</p>
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-sm font-medium ${scoreStyle(job.matchScore)}`}>
                      匹配度 {job.matchScore}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BriefcaseBusiness className="h-4 w-4" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, tagIndex) => (
                      <span key={`${job.id}-${tag}-${tagIndex}`} className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-primary/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                      <TrendingUp className="h-4 w-4" />
                      推荐理由
                    </p>
                    <p className="text-sm leading-7 text-muted-foreground">{job.reason}</p>
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    onClick={() =>
                      saveJobDetailSnapshot({
                        job,
                        portrait,
                        reportTitle: snapshot.reportTitle,
                        candidateName: snapshot.candidateName,
                      })
                    }
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
                  >
                    查看岗位详情
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
