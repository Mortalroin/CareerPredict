"use client"

import Link from "next/link"

import { ArrowRight, BriefcaseBusiness, ChevronRight, MapPin, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveDashboardScrollPosition, saveJobDetailSnapshot, saveJobRecommendationsSnapshot } from "@/lib/job-detail-storage"
import type { JobPortraitCard, JobRecommendation } from "@/lib/types"

interface JobRecommendationsProps {
  jobs: JobRecommendation[]
  portraits: JobPortraitCard[]
  candidateName: string
  reportTitle: string
}

function scoreStyle(score: number) {
  if (score >= 85) return "bg-emerald-500/10 text-emerald-700"
  if (score >= 70) return "bg-primary/10 text-primary"
  return "bg-secondary text-foreground"
}

function findPortrait(job: JobRecommendation, portraits: JobPortraitCard[]) {
  const normalizedTitle = job.title.trim().toLowerCase()

  return (
    portraits.find((portrait) => portrait.jobId === job.id) ||
    portraits.find((portrait) => portrait.roleName.trim().toLowerCase() === normalizedTitle) ||
    portraits.find((portrait) => portrait.roleName.includes(job.title) || job.title.includes(portrait.roleName))
  )
}

export function JobRecommendations({
  jobs,
  portraits,
  candidateName,
  reportTitle,
}: JobRecommendationsProps) {
  const visibleJobs = jobs.slice(0, 4)
  const hasMoreJobs = jobs.length > 4

  function handleOpenMoreJobs() {
    saveDashboardScrollPosition(window.scrollY)
    saveJobRecommendationsSnapshot({
      jobs,
      portraits,
      candidateName,
      reportTitle,
    })
  }

  return (
    <section className="bg-secondary/30 py-14 lg:py-20" id="jobs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary">目标岗位匹配结果</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">目标岗位胜任力匹配分析</h2>
          </div>

          {hasMoreJobs ? (
            <Link href="/jobs" onClick={handleOpenMoreJobs}>
              <Button variant="outline" className="rounded-full">
                更多推荐岗位
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {visibleJobs.map((job) => {
            const portrait = findPortrait(job, portraits)

            return (
              <Card
                key={job.id}
                className="flex h-full flex-col border-border/60 bg-card/85 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader className="space-y-4">
                  <div className="flex min-h-[8.5rem] items-start justify-between gap-4">
                    <div className="flex min-h-[8.5rem] flex-1 flex-col justify-between">
                      <div className="space-y-2">
                        <CardTitle className="min-h-[4rem] text-[2rem] leading-tight lg:text-[1.9rem] xl:text-[1.7rem]">
                          {job.title}
                        </CardTitle>
                        <p className="min-h-[1.5rem] text-sm text-muted-foreground">{job.company}</p>
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
                    </div>

                    <div className="flex min-w-[7rem] justify-end pt-1">
                      <div className={`rounded-full px-3 py-1 text-sm font-medium ${scoreStyle(job.matchScore)}`}>
                        匹配度 {job.matchScore}%
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex min-h-[4.5rem] flex-wrap content-start gap-2">
                    {job.tags.map((tag, index) => (
                      <span key={`${job.id}-${tag}-${index}`} className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex min-h-[10rem] flex-1 flex-col rounded-2xl bg-primary/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                      <TrendingUp className="h-4 w-4" />
                      推荐理由
                    </p>
                    <p className="text-sm leading-7 text-muted-foreground">{job.reason}</p>
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    onClick={() => {
                      saveDashboardScrollPosition(window.scrollY)
                      saveJobDetailSnapshot({
                        job,
                        portrait,
                        reportTitle,
                        candidateName,
                      })
                    }}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
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
    </section>
  )
}
