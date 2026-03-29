"use client"

import { BriefcaseBusiness, MapPin, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { JobRecommendation } from "@/lib/types"

interface JobRecommendationsProps {
  jobs: JobRecommendation[]
}

function scoreStyle(score: number) {
  if (score >= 90) return "bg-emerald-500/10 text-emerald-600"
  if (score >= 80) return "bg-primary/10 text-primary"
  return "bg-secondary text-foreground"
}

export function JobRecommendations({ jobs }: JobRecommendationsProps) {
  return (
    <section className="bg-secondary/30 py-14 lg:py-20" id="jobs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium text-primary">Job matches</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">High-fit roles based on the analyzed profile</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            The component is already shaped around backend response data, so your FastAPI teammate can return JSON and drop it in.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="border-border/60 bg-card/85 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">{job.company}</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-sm font-medium ${scoreStyle(job.matchScore)}`}>
                    {job.matchScore}% match
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
                  {job.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                    <TrendingUp className="h-4 w-4" />
                    Why it fits
                  </p>
                  <p className="text-sm leading-7 text-muted-foreground">{job.reason}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
