"use client"

import type { ReactNode } from "react"

import { BookMarked, BrainCircuit, GraduationCap, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { KnowledgeInsightsData } from "@/lib/types"

interface KnowledgeInsightsProps {
  data: KnowledgeInsightsData
}

export function KnowledgeInsights({ data }: KnowledgeInsightsProps) {
  return (
    <section className="py-14 lg:py-20" id="knowledge">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">目标岗位市场分析</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">把市场信息转成下一步可执行动作</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            这里会汇总目标岗位的岗位样本、招聘趋势、热门技能与推荐学习项，帮助同学更快理解“市场看重什么”“自己下一步该补什么”。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <InsightCard title="关联岗位样本" icon={BookMarked}>
            {data.documents.map((doc, index) => (
              <div key={`${doc.title}-${doc.category}-${index}`} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{doc.category}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600">
                    相关度 {doc.relevance}%
                  </span>
                </div>
              </div>
            ))}
          </InsightCard>

          <InsightCard title="岗位趋势观察" icon={TrendingUp}>
            {data.trends.map((trend, index) => (
              <div key={`${trend.title}-${trend.value}-${index}`} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="font-medium">{trend.title}</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{trend.value}</p>
              </div>
            ))}
          </InsightCard>

          <InsightCard title="热门技能需求" icon={BrainCircuit}>
            {data.skills.map((skill, index) => (
              <div key={`${skill.name}-${skill.demand}-${index}`}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{skill.name}</span>
                  <span className="text-muted-foreground">{skill.demand}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${skill.demand}%` }}
                  />
                </div>
              </div>
            ))}
          </InsightCard>

          <InsightCard title="建议学习方向" icon={GraduationCap}>
            {data.certifications.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="font-medium">{item}</p>
              </div>
            ))}
          </InsightCard>
        </div>
      </div>
    </section>
  )
}

function InsightCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof BookMarked
  children: ReactNode
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
