"use client"

import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { saveGrowthDetailSnapshot } from "@/lib/job-detail-storage"
import type { GrowthStage } from "@/lib/types"

interface GrowthPathProps {
  stages: GrowthStage[]
  candidateName?: string
  reportTitle?: string
}

export function GrowthPath({ stages, candidateName = "当前候选人", reportTitle = "职业规划报告" }: GrowthPathProps) {
  return (
    <section className="bg-secondary/25 py-14 lg:py-20" id="growth">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">成长阶段</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">清晰查看未来职业成长路径</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            这里会把你的当前阶段、下一步目标以及中期成长节点拆开展示。点击任一阶段，可继续查看通向下一阶段所需补足的学习内容与行动建议。
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {stages.map((stage, index) => {
            const nextStage = stages[index + 1]

            return (
              <Card
                key={stage.id}
                className={`border-border/60 transition hover:-translate-y-1 hover:shadow-lg ${
                  stage.current ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10" : "bg-card/85"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">阶段 {stage.id}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        stage.current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {stage.level}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold">{stage.role}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{stage.timeframe}</p>
                  <p className="mt-2 text-sm font-medium text-primary">{stage.salary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {stage.focus.map((item) => (
                      <span key={item} className="rounded-full border border-border/60 px-3 py-1 text-sm text-foreground">
                        {item}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/growth/${stage.id}`}
                    onClick={() =>
                      saveGrowthDetailSnapshot(
                        {
                          selectedStage: stage,
                          nextStage,
                          reportTitle,
                          candidateName,
                        },
                        stage.id,
                      )
                    }
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
                  >
                    查看成长建议
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
