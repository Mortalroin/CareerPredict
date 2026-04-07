"use client"

import { CheckCircle2, CircleDashed, TimerReset } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { RoadmapStep } from "@/lib/types"

interface CareerRoadmapProps {
  steps: RoadmapStep[]
}

export function CareerRoadmap({ steps }: CareerRoadmapProps) {
  return (
    <section className="py-14 lg:py-20" id="roadmap">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">职业路径规划</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">从当前能力到目标岗位的清晰路线</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            每一步都基于后端结构化返回的数据生成，你可以清楚看到当前所处阶段、下一步重点以及中期行动方向。
          </p>
        </div>

        <div className="space-y-5">
          {steps.map((step) => (
            <Card
              key={step.id}
              className={`border-border/60 ${step.status === "current" ? "border-primary/40 bg-primary/5" : ""}`}
            >
              <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-4">
                  <div className="mt-1">{getStepIcon(step.status)}</div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      第 {step.id} 步 · {step.timeframe}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-1 font-medium text-primary">{step.subtitle}</p>
                    <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                <div className="rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
                  {step.status === "done" ? "已完成" : step.status === "current" ? "进行中" : "下一阶段"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function getStepIcon(status: RoadmapStep["status"]) {
  if (status === "done") {
    return <CheckCircle2 className="h-6 w-6 text-emerald-600" />
  }

  if (status === "current") {
    return <TimerReset className="h-6 w-6 text-primary" />
  }

  return <CircleDashed className="h-6 w-6 text-muted-foreground" />
}
