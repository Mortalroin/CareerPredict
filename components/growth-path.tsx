"use client"

import Link from "next/link"

import { ArrowRight, Sparkles } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { saveDashboardScrollPosition, saveGrowthDetailSnapshot } from "@/lib/job-detail-storage"
import type { CapabilityScoreCard, GrowthStage } from "@/lib/types"

interface GrowthPathProps {
  stages: GrowthStage[]
  candidateName?: string
  reportTitle?: string
  targetRole: string
  capabilityScores: CapabilityScoreCard[]
}

export function GrowthPath({
  stages,
  candidateName = "当前候选人",
  reportTitle = "职业规划报告",
  targetRole,
  capabilityScores,
}: GrowthPathProps) {
  const currentIndex = stages.findIndex((stage) => stage.current)
  const activeIndex = currentIndex >= 0 ? currentIndex : 0
  const currentStage = stages[activeIndex]
  const nextStage = stages[activeIndex + 1]

  return (
    <section className="bg-secondary/25 py-14 lg:py-20" id="growth">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-10 max-w-3xl">
              <p className="text-sm font-medium text-primary">成长阶段</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">清晰查看未来职业成长路径</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                这里会把你的当前阶段、下一步目标以及中长期成长节点拆开展示。点击任一阶段后，可以继续查看“通向下一阶段需要学什么、补什么、做什么”。
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {stages.map((stage, index) => {
                const next = stages[index + 1]

                return (
                  <Card
                    key={stage.id}
                    className={`border-border/60 transition hover:-translate-y-1 hover:shadow-lg ${
                      stage.current ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10" : "bg-card/90"
                    }`}
                  >
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">阶段 {stage.id}</p>
                          <h3 className="mt-3 text-2xl font-semibold">{stage.role}</h3>
                          <p className="mt-3 text-sm text-muted-foreground">{stage.timeframe}</p>
                          <p className="mt-2 text-sm font-medium text-primary">{stage.salary}</p>
                        </div>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-medium ${
                            stage.current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {stage.level}
                        </span>
                      </div>

                      <p className="mt-5 text-lg font-medium leading-8 text-primary">{buildStageSummary(stage)}</p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {stage.focus.slice(0, 3).map((item) => (
                          <span key={item} className="rounded-full border border-border/60 px-3 py-1 text-sm text-foreground">
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 space-y-3">
                        {buildStageActions(stage).slice(0, 3).map((item, actionIndex) => (
                          <div key={`${stage.id}-${actionIndex}`} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                            <p className="text-sm leading-7 text-muted-foreground">{item}</p>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={`/growth/${stage.id}`}
                        onClick={() => {
                          saveDashboardScrollPosition(window.scrollY)
                          saveGrowthDetailSnapshot(
                            {
                              selectedStage: stage,
                              nextStage: next,
                              reportTitle,
                              candidateName,
                              targetRole,
                              capabilityScores,
                            },
                            stage.id,
                          )
                        }}
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

          <Card className="border-primary/20 bg-[linear-gradient(155deg,rgba(42,97,255,0.08),rgba(13,148,136,0.08))] xl:sticky xl:top-24">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                当前成长焦点
              </div>

              <div>
                <p className="text-sm text-muted-foreground">当前阶段</p>
                <h3 className="mt-2 text-3xl font-semibold">{currentStage?.role ?? "待确认阶段"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{currentStage?.timeframe ?? "暂无时间范围"}</p>
                <p className="mt-2 text-sm font-medium text-primary">{currentStage?.salary ?? "薪资区间待补充"}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-sm font-medium text-foreground">阶段目标</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{buildStageGoal(currentStage, nextStage)}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-sm font-medium text-foreground">当前建议</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{buildStageAdvice(currentStage, nextStage)}</p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-foreground">优先补足能力</p>
                <div className="flex flex-wrap gap-2">
                  {(nextStage?.focus ?? currentStage?.focus ?? []).slice(0, 5).map((item) => (
                    <span key={item} className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-foreground">下一步行动</p>
                <div className="space-y-3">
                  {buildRightPanelActions(currentStage, nextStage).map((item, index) => (
                    <div key={`focus-${index}`} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                      <p className="text-sm leading-7 text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function buildStageSummary(stage: GrowthStage) {
  if (stage.current) {
    return "优先补足当前最影响匹配度的能力，并同步优化简历与项目表达。"
  }

  if (stage.id <= 2) {
    return "建立更强的岗位竞争力，完成从基础能力到岗位胜任力的过渡。"
  }

  return "逐步走向更高阶岗位，强化业务深度、项目影响力与综合统筹能力。"
}

function buildStageActions(stage: GrowthStage) {
  const focus = stage.focus

  if (stage.current) {
    return [
      "补足当前最高频缺口能力。",
      "把简历经历改写为更面向岗位的成果表达。",
      `围绕 ${focus.join("、")} 制定每周学习与输出节奏。`,
      "将至少 1 个项目或实习经历整理成 STAR 结构。",
    ]
  }

  if (stage.id <= 2) {
    return [
      "建立更强的岗位竞争力。",
      "验证主路径与一条备选转岗路径。",
      `围绕 ${focus.join("、")} 准备作品集或案例材料。`,
      "整理 1-2 组能体现问题、行动与结果的面试故事。",
    ]
  }

  return [
    "补强面向更高阶岗位的统筹能力。",
    "逐步承担跨团队或跨项目协同任务。",
    `围绕 ${focus.join("、")} 建立更系统的方法论。`,
    "沉淀可复用的成果案例，为下一阶段晋升做准备。",
  ]
}

function buildStageGoal(currentStage?: GrowthStage, nextStage?: GrowthStage) {
  if (!currentStage && !nextStage) {
    return "先确认当前所处阶段，再继续拆解下一步目标。"
  }

  if (!nextStage) {
    return `当前已处于 ${currentStage?.role ?? "当前岗位"} 的较高阶段，接下来可以把重心转向更高阶职责与长期职业布局。`
  }

  return `从 ${currentStage?.role ?? "当前阶段"} 走向 ${nextStage.role}，重点是补足 ${nextStage.focus.slice(0, 2).join("、")} 相关能力，并形成可展示的项目成果。`
}

function buildStageAdvice(currentStage?: GrowthStage, nextStage?: GrowthStage) {
  if (!currentStage) {
    return "建议先补齐当前阶段信息，再根据目标岗位继续制定行动计划。"
  }

  if (!nextStage) {
    return "建议把经验沉淀为方法论、管理能力和跨团队影响力，继续为更高层级角色做准备。"
  }

  return `当前阶段先围绕 ${currentStage.focus.slice(0, 2).join("、")} 保持稳定输出，再通过项目、案例和面试故事，把能力迁移到 ${nextStage.role} 所要求的层次。`
}

function buildRightPanelActions(currentStage?: GrowthStage, nextStage?: GrowthStage) {
  if (!currentStage) {
    return ["补充阶段信息后再继续制定行动计划。"]
  }

  if (!nextStage) {
    return [
      "梳理过去阶段的代表性成果，沉淀成可复用方法论。",
      "争取承担更高阶职责，如跨团队推进、业务统筹或培养新人。",
      "围绕长期职业目标继续扩展管理与战略视角。",
    ]
  }

  return [
    `围绕 ${nextStage.focus[0] ?? "核心能力"} 制定 2-4 周的小目标。`,
    "挑选 1 个最能体现价值的项目，补全背景、动作与量化结果。",
    `准备通向 ${nextStage.role} 的面试故事和岗位表达。`,
  ]
}
