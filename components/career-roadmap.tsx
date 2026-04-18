"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { ArrowRight, CheckCircle2, CircleDashed, Compass, Flag, TimerReset } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { saveDashboardScrollPosition, saveRoadmapDetailSnapshot } from "@/lib/job-detail-storage"
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
            : step.id < activeStepId
              ? ("done" as const)
              : ("next" as const),
      })),
    [activeStepId, steps],
  )

  const activeStep = normalizedSteps.find((step) => step.id === activeStepId) ?? normalizedSteps[0]
  const activeStepIndex = normalizedSteps.findIndex((step) => step.id === activeStep?.id)
  const nextStep = normalizedSteps[activeStepIndex + 1]
  const suggestedTasks = buildSuggestedTasks(activeStep)

  return (
    <section className="py-14 lg:py-20" id="roadmap">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-primary/10 bg-[linear-gradient(180deg,rgba(240,247,255,0.95)_0%,rgba(255,255,255,0.96)_48%,rgba(248,251,255,0.98)_100%)] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.07)] lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-primary">职业路径规划</p>
                <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                  从当前能力到目标岗位的阶段路线
                </h2>
                <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                  先看自己处在路径中的哪一段，再沿着时间轴确认下一步要补什么、做什么、如何证明自己。
                  点击任一阶段后，右侧会同步切换阶段目标、优先任务和可执行建议。
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {normalizedSteps.map((step) => {
                  const isCurrent = step.status === "current"

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStepId(step.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : step.status === "done"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-border/60 bg-white text-slate-600 hover:border-primary/30 hover:text-primary"
                      }`}
                    >
                      阶段 {step.id}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-5">
                {normalizedSteps.map((step, index) => {
                  const isCurrent = step.status === "current"
                  const suggestedStepTasks = buildSuggestedTasks(step)

                  return (
                    <div key={step.id} className="grid grid-cols-[32px_1fr] gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                            isCurrent
                              ? "border-primary bg-primary text-primary-foreground"
                              : step.status === "done"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-border/60 bg-white text-slate-500"
                          }`}
                        >
                          {step.id}
                        </div>
                        {index < normalizedSteps.length - 1 ? (
                          <div className="mt-2 h-full w-px bg-gradient-to-b from-primary/35 via-border to-transparent" />
                        ) : null}
                      </div>

                      <Card
                        className={`rounded-[28px] border transition ${
                          isCurrent
                            ? "border-primary/25 bg-primary/5 shadow-[0_16px_36px_rgba(37,99,235,0.12)]"
                            : "border-border/60 bg-white/90 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                        }`}
                      >
                        <CardContent className="space-y-5 p-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>阶段 {step.id}</span>
                                <span>·</span>
                                <span>{step.timeframe}</span>
                              </div>

                              <div>
                                <h3 className="text-2xl font-semibold tracking-tight">{step.title}</h3>
                                <p className="mt-1 font-medium text-primary">{step.subtitle}</p>
                              </div>

                              <p className="max-w-3xl leading-7 text-muted-foreground">{step.description}</p>
                            </div>

                            <div className="flex flex-col items-start gap-3 lg:items-end">
                              <span
                                className={`rounded-full px-4 py-2 text-sm font-medium ${
                                  step.status === "done"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : isCurrent
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {step.status === "done" ? "已完成阶段" : isCurrent ? "当前阶段" : "下一阶段"}
                              </span>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant={isCurrent ? "default" : "outline"}
                                  className="rounded-full"
                                  onClick={() => setActiveStepId(step.id)}
                                >
                                  聚焦这一阶段
                                </Button>

                                <Link
                                  href={`/roadmap/${step.id}`}
                                  onClick={() => {
                                    saveDashboardScrollPosition(window.scrollY)
                                    saveRoadmapDetailSnapshot(
                                      {
                                        selectedStep: step,
                                        nextStep: normalizedSteps[index + 1],
                                        reportTitle,
                                        candidateName,
                                        targetRole,
                                        capabilityScores,
                                        suggestedTasks: suggestedStepTasks,
                                      },
                                      step.id,
                                    )
                                  }}
                                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
                                >
                                  查看详情
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                            <div className="rounded-2xl bg-slate-50/90 p-4">
                              <p className="text-sm font-semibold text-slate-900">阶段目标</p>
                              <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.subtitle}</p>
                            </div>

                            <div className="rounded-2xl bg-slate-50/90 p-4">
                              <p className="text-sm font-semibold text-slate-900">本阶段重点动作</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {suggestedStepTasks.slice(0, 3).map((task) => (
                                  <span
                                    key={task.id}
                                    className="rounded-full border border-border/60 bg-white px-3 py-1.5 text-sm text-slate-700"
                                  >
                                    {task.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>

            <Card className="rounded-[30px] border-primary/15 bg-white/92 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:sticky xl:top-24">
              <CardContent className="space-y-6 p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Compass className="h-4 w-4" />
                    路线总览
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight">{activeStep?.title ?? "当前阶段"}</h3>
                  <p className="text-sm text-muted-foreground">{activeStep?.timeframe ?? "暂无时间信息"}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">候选人</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{candidateName}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">当前阶段</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{activeStep?.title}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">下一目标</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{nextStep?.title ?? "继续夯实当前阶段"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-slate-900">阶段目标</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{activeStep?.subtitle}</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">当前建议</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{activeStep?.description}</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">本阶段优先任务</p>
                  <div className="mt-4 space-y-3">
                    {suggestedTasks.slice(0, 3).map((task, index) => (
                      <div key={task.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {index + 1}. {task.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function buildSuggestedTasks(step?: RoadmapStep): RoadmapTask[] {
  if (!step) {
    return []
  }

  const title = step.title

  if (title.includes("简历") || title.includes("表达")) {
    return [
      { id: `${step.id}-resume-upload`, title: "上传最新简历", description: "同步最新 PDF 或 DOCX 简历，确保分析基于当前版本。" },
      { id: `${step.id}-skill-tags`, title: "补充能力标签", description: "补全技能、证书、工具链和目标岗位相关关键词。" },
      { id: `${step.id}-intention`, title: "确认求职意向", description: "明确目标岗位、目标城市和补充说明，提高匹配精度。" },
    ]
  }

  if (title.includes("目标") || title.includes("定位")) {
    return [
      { id: `${step.id}-compare-jobs`, title: "对比目标岗位", description: "从推荐岗位中筛出 2-3 个核心目标岗位做差异对比。" },
      { id: `${step.id}-job-portrait`, title: "查看岗位画像", description: "重点理解岗位技能、实习经历、证书和沟通要求。" },
      { id: `${step.id}-self-positioning`, title: "明确当前定位", description: "判断自己更适合应届、初级还是转岗路径，减少投递偏差。" },
    ]
  }

  if (title.includes("差距") || title.includes("补足")) {
    return [
      { id: `${step.id}-gap-skill`, title: "补足关键技能", description: "优先补全报告中高频出现的技能缺口与项目能力。" },
      { id: `${step.id}-project-proof`, title: "形成项目证据", description: "围绕目标岗位补 1 个可量化、可展示的项目案例。" },
      { id: `${step.id}-certificate-proof`, title: "补充证明材料", description: "整理证书、作品集或截图，增强简历可信度。" },
    ]
  }

  return [
    { id: `${step.id}-resume-tailor`, title: "定制投递简历", description: "围绕目标岗位重写简历关键词与项目表达。" },
    { id: `${step.id}-interview-story`, title: "准备面试故事", description: "准备 2-3 段问题、行动、结果清晰的案例。" },
    { id: `${step.id}-delivery-rhythm`, title: "建立投递复盘", description: "按周跟踪投递、面试与反馈，及时调整后续策略。" },
  ]
}

function getStepIcon(status: RoadmapStep["status"]) {
  if (status === "done") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
  }

  if (status === "current") {
    return <TimerReset className="h-5 w-5 text-primary" />
  }

  return <CircleDashed className="h-5 w-5 text-muted-foreground" />
}
