"use client"

import { Award, Compass, Sparkles, Star } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CareerProfileData, JobRecommendation } from "@/lib/types"

interface CareerProfileProps {
  profile: CareerProfileData
  jobs: JobRecommendation[]
}

interface GaugeMetric {
  label: string
  score: number
}

export function CareerProfile({ profile, jobs }: CareerProfileProps) {
  const recommendedRoles = buildRecommendedRoles(profile, jobs)
  const primaryRole = recommendedRoles[0] || profile.suggestedDirection || "目标岗位"
  const summaryCards = profile.cards.filter(
    (item) => !["完整度", "竞争力", "就绪度", "匹配度"].some((keyword) => item.label.includes(keyword)),
  )

  const metrics: GaugeMetric[] = [
    {
      label: "完整度",
      score: getNumericValue(profile.cards, ["完整度", "完整"]) ?? 86,
    },
    {
      label: "竞争力",
      score: getNumericValue(profile.cards, ["竞争力", "竞争"]) ?? 78,
    },
    {
      label: "匹配度",
      score: jobs[0]?.matchScore ?? getNumericValue(profile.cards, ["匹配度", "就绪度"]) ?? 76,
    },
  ]

  return (
    <section className="py-14 lg:py-20" id="profile">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-4xl">
          <p className="text-sm font-medium text-primary">目标岗位画像</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{primaryRole} 就业能力画像</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{profile.summary}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="flex h-full flex-col border-border/60 bg-card/90">
              <CardContent className="space-y-6 p-6 lg:p-8">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {summaryCards.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="rounded-3xl border border-border/60 bg-secondary/20 p-4">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="mt-3 text-lg font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <InfoCard title="核心技能" icon={Sparkles} items={profile.skills} emptyLabel="暂未识别到技能信息" />
                  <InfoCard title="优势亮点" icon={Star} items={profile.strengths} emptyLabel="暂未识别到明显优势" />
                  <InfoCard title="证书与资质" icon={Award} items={profile.certificates} emptyLabel="暂未识别到证书信息" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="h-full border-primary/20 bg-[linear-gradient(145deg,rgba(42,97,255,0.10),rgba(13,148,136,0.10))]">
              <CardHeader>
                <CardTitle className="text-xl">目标岗位胜任概览</CardTitle>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-5">
                {metrics.map((metric) => (
                  <GaugeCard key={metric.label} label={metric.label} score={metric.score} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6 border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Compass className="h-5 w-5 text-primary" />
              建议发展方向
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {recommendedRoles.map((role, index) => (
                <div key={`${role}-${index}`} className="rounded-3xl border border-border/60 bg-secondary/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="font-semibold">{role}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {index === 0
                      ? "建议优先围绕这个方向继续优化简历、项目表达和投递策略。"
                      : "可以作为相近发展方向同步准备，提升后续匹配机会。"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function InfoCard({
  title,
  icon: Icon,
  items,
  emptyLabel,
}: {
  title: string
  icon: typeof Sparkles
  items: string[]
  emptyLabel: string
}) {
  const renderedItems = items.length > 0 ? items : [emptyLabel]

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {renderedItems.map((item, index) => (
          <span key={`${title}-${item}-${index}`} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
            {item}
          </span>
        ))}
      </CardContent>
    </Card>
  )
}

function GaugeCard({ label, score }: GaugeMetric) {
  const color = getGaugeColor(score)

  return (
    <div className="flex min-h-[11.5rem] items-center justify-between gap-6 rounded-3xl border border-border/60 bg-background/85 p-6">
      <div className="space-y-4">
        <p className="text-base font-medium text-muted-foreground">{label}</p>
        <p className="text-4xl font-semibold leading-none" style={{ color }}>
          {score}
          <span className="ml-2 text-2xl">分</span>
        </p>
      </div>

      <div className="shrink-0">
        <MiniGauge score={score} color={color} />
      </div>
    </div>
  )
}

function MiniGauge({ score, color }: { score: number; color: string }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const normalizedScore = Math.max(0, Math.min(100, score))
  const offset = circumference * (1 - normalizedScore / 100)

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold" style={{ color }}>
        {normalizedScore}
      </div>
    </div>
  )
}

function buildRecommendedRoles(profile: CareerProfileData, jobs: JobRecommendation[]) {
  const fromJobs = jobs.map((job) => job.title.trim()).filter(Boolean)
  const fromDirection = profile.suggestedDirection
    .split(/[\/|、，,]/)
    .map((item) => item.trim())
    .filter(Boolean)

  return Array.from(new Set([...fromJobs, ...fromDirection])).slice(0, 4)
}

function getNumericValue(cards: CareerProfileData["cards"], keywords: string[]) {
  const matched = cards.find((item) => keywords.some((keyword) => item.label.includes(keyword)))
  if (!matched) {
    return null
  }

  const value = Number.parseInt(matched.value, 10)
  return Number.isFinite(value) ? value : null
}

function getGaugeColor(score: number) {
  if (score < 60) {
    return "#ef4444"
  }

  if (score < 80) {
    return "#f59e0b"
  }

  return "#10b981"
}
