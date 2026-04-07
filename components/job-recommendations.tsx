"use client"

import Link from "next/link"

import { ArrowRight, BriefcaseBusiness, MapPin, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveJobDetailSnapshot } from "@/lib/job-detail-storage"
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
  return (
    <section className="bg-secondary/30 py-14 lg:py-20" id="jobs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">岗位匹配结果</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">根据分析结果，匹配度高的职位</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            系统会综合基础要求、职业技能、职业素养与发展潜力，给出带解释的岗位推荐结果。点击卡片可查看该岗位的详细画像。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {jobs.map((job) => {
            const portrait = findPortrait(job, portraits)

            return (
              <Card
                key={job.id}
                className="border-border/60 bg-card/85 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-sm font-medium ${scoreStyle(job.matchScore)}`}>
                      匹配度{job.matchScore}%
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
                    {job.tags.map((tag, index) => (
                      <span key={`${job.id}-${tag}-${index}`} className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-primary/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                      <TrendingUp className="h-4 w-4" />
                      为什么适合
                    </p>
                    <p className="text-sm leading-7 text-muted-foreground">{job.reason}</p>
                  </div>

                  <Link
                    href={`/jobs/${job.id}`}
                    onClick={() =>
                      saveJobDetailSnapshot({
                        job,
                        portrait,
                        reportTitle,
                        candidateName,
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
    </section>
  )
}
