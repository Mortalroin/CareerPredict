"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { ArrowRight, CheckCircle2, CircleDashed, TimerReset } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { saveRoadmapDetailSnapshot } from "@/lib/job-detail-storage"
import type { CapabilityScoreCard, RoadmapStep, RoadmapTask } from "@/lib/types"

interface CareerRoadmapProps {
  steps: RoadmapStep[]
  candidateName: string
  reportTitle: string
  targetRole: string
  capabilityScores: CapabilityScoreCard[]
}

export function CareerRoadmap({
  steps,
  candidateName,
  reportTitle,
  targetRole,
  capabilityScores,
}: CareerRoadmapProps) {
  const defaultCurrent = steps.find((step) => step.status === "current")?.id ?? steps[0]?.id ?? 1
  const [activeStepId, setActiveStepId] = useState(defaultCurrent)

  const normalizedSteps = useMemo(
    () =>
      steps.map((step) => ({
        ...step,
        status:
          step.id === activeStepId
            ? ("current" as const)
            : step.status === "done" && step.id < activeStepId
              ? ("done" as const)
              : ("next" as const),
      })),
    [activeStepId, steps],
  )

  return (
    <section className="py-14 lg:py-20" id="roadmap">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">职业路径规划</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">从当前能力到目标岗位的清晰路线</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            你可以自由切换当前所处阶段，查看每一阶段的任务建议、能力差距和下一步行动。阶段详情页会继续提供可编辑任务与完成回滚能力。
          </p>
        </div>

        <div className="space-y-5">
          {normalizedSteps.map((step, index) => {
            const nextStep = normalizedSteps[index + 1]
            const suggestedTasks = buildSuggestedTasks(step)

            return (
              <Card
                key={step.id}
                className={`border-border/60 transition ${
                  step.status === "current" ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10" : "bg-card/85"
                }`}
              >
                <CardContent className="flex flex-col gap-5 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <span className="rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
                        {step.status === "done" ? "已完成" : step.status === "current" ? "当前阶段" : "下一阶段"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={step.status === "current" ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => setActiveStepId(step.id)}
                        >
                          设为当前阶段
                        </Button>
                        <Link
                          href={`/roadmap/${step.id}`}
                          onClick={() =>
                            saveRoadmapDetailSnapshot(
                              {
                                selectedStep: step,
                                nextStep,
                                reportTitle,
                                candidateName,
                                targetRole,
                                capabilityScores,
                                suggestedTasks,
                              },
                              step.id,
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
                        >
                          查看详情
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {suggestedTasks.slice(0, 3).map((task) => (
                      <span key={task.id} className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground">
                        {task.title}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function buildSuggestedTasks(step: RoadmapStep): RoadmapTask[] {
  const title = step.title

  if (title.includes("简历解析")) {
    return [
      { id: `${step.id}-resume-upload`, title: "上传最新简历", description: "上传最新版 PDF / DOCX 简历，确保系统拿到最新经历。" },
      { id: `${step.id}-skill-tags`, title: "补充能力标签", description: "手动补充遗漏的技能、证书和目标岗位标签。" },
      { id: `${step.id}-intention`, title: "确认求职意向", description: "完善目标岗位、目标城市和偏好说明。" },
    ]
  }

  if (title.includes("锁定目标")) {
    return [
      { id: `${step.id}-compare-jobs`, title: "对比目标岗位", description: "从推荐岗位中选 3 个最想投递的岗位进行对比。" },
      { id: `${step.id}-job-portrait`, title: "查看岗位画像", description: "重点阅读目标岗位的技能、实践和证书要求。" },
      { id: `${step.id}-self-positioning`, title: "明确当前定位", description: "判断自己更适合应届、初级还是转岗路径。" },
    ]
  }

  if (title.includes("补齐关键差距")) {
    return [
      { id: `${step.id}-gap-skill`, title: "补足关键技能", description: "优先补足报告中频繁出现的技能差距。" },
      { id: `${step.id}-project-proof`, title: "形成项目证据", description: "围绕目标岗位完成 1 个可量化项目案例。" },
      { id: `${step.id}-certificate-proof`, title: "补充证明材料", description: "整理证书、作品集或项目截图，增强可信度。" },
    ]
  }

  return [
    { id: `${step.id}-resume-tailor`, title: "定制投递简历", description: "围绕目标岗位重写简历关键词和项目表达。" },
    { id: `${step.id}-interview-story`, title: "准备面试故事", description: "准备 2-3 段问题、行动、结果清晰的案例。" },
    { id: `${step.id}-delivery-rhythm`, title: "建立投递节奏", description: "按周规划投递、复盘和后续跟进安排。" },
  ]
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
