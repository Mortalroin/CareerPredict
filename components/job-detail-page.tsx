"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { ArrowLeft, Award, BriefcaseBusiness, Compass, MapPin, Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readJobDetailSnapshot } from "@/lib/job-detail-storage"
import type { JobDetailSnapshot } from "@/lib/types"

interface JobDetailPageProps {
  jobId: string
}

export function JobDetailPage({ jobId }: JobDetailPageProps) {
  const [snapshot, setSnapshot] = useState<JobDetailSnapshot | null>(null)

  useEffect(() => {
    setSnapshot(readJobDetailSnapshot(jobId))
  }, [jobId])

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
              <h1 className="text-3xl font-semibold tracking-tight">暂未找到岗位详情</h1>
              <p className="text-muted-foreground">
                请从首页推荐岗位卡片点击“查看岗位详情”进入，这样系统才能携带目标岗位画像。
              </p>
              <p className="text-sm text-muted-foreground">如果你直接刷新或单独打开该地址，会因为没有会话快照而无法展示详情。</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { job, portrait, reportTitle, candidateName } = snapshot

  return (
    <main className="min-h-screen bg-secondary/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80">
              <ArrowLeft className="h-4 w-4" />
              返回推荐结果
            </Link>
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">推荐岗位详情</p>
              <h1 className="text-4xl font-semibold tracking-tight">{job.title}</h1>
              <p className="text-lg text-muted-foreground">{job.company}</p>
            </div>
          </div>

          <Card className="min-w-[260px] border-primary/20 bg-card/90">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">匹配度</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {job.matchScore}%
                </span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {job.salary}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </p>
                <p className="flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  候选人：{candidateName || "当前候选人"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/60 bg-card/90">
            <CardHeader className="space-y-4">
              <div>
                <p className="text-sm font-medium text-primary">岗位画像</p>
                <CardTitle className="mt-2 text-2xl">{portrait?.roleName || job.title}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{portrait?.roleFamily || "岗位要求画像"}</p>
              </div>
              <p className="leading-8 text-muted-foreground">
                {portrait?.summary || "系统尚未返回该岗位的详细画像，当前先展示推荐理由与基础标签。"}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <DetailBlock title="核心技能" icon={Sparkles} items={portrait?.professionalSkills ?? job.tags} />
              <DetailBlock title="证书与资质" icon={Award} items={portrait?.certificates ?? []} emptyLabel="暂未识别到明确证书要求" />

              <div className="grid gap-4 md:grid-cols-2">
                <RequirementCard title="学习要求" items={portrait?.learningRequirements ?? []} />
                <RequirementCard title="沟通要求" items={portrait?.communicationRequirements ?? []} />
                <RequirementCard title="抗压要求" items={portrait?.stressRequirements ?? []} />
                <RequirementCard title="实践要求" items={portrait?.internshipRequirements ?? []} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">为什么推荐这个岗位</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-8 text-muted-foreground">{job.reason}</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">岗位标签</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <span key={`${job.id}-${tag}-${index}`} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
                    {tag}
                  </span>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">报告来源</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{reportTitle}</p>
                <p>该详情页用于集中展示目标岗位的岗位画像、关键技能要求与推荐理由，方便做岗位对比和职业决策。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function DetailBlock({
  title,
  icon: Icon,
  items,
  emptyLabel = "暂无数据",
}: {
  title: string
  icon: typeof Sparkles
  items: string[]
  emptyLabel?: string
}) {
  const renderedItems = items.length > 0 ? items : [emptyLabel]

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium text-primary">
        <Icon className="h-4 w-4" />
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {renderedItems.map((item, index) => (
          <span key={`${title}-${item}-${index}`} className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function RequirementCard({ title, items }: { title: string; items: string[] }) {
  const renderedItems = items.length > 0 ? items : ["暂无明确要求"]

  return (
    <div className="rounded-2xl bg-secondary/40 p-5">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        {renderedItems.map((item, index) => (
          <p key={`${title}-${item}-${index}`}>{item}</p>
        ))}
      </div>
    </div>
  )
}
