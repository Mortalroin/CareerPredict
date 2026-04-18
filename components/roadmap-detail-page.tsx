"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  ArrowLeft,
  BookCheck,
  CheckCircle2,
  CirclePlus,
  ClipboardPenLine,
  CircleDot,
  GitBranch,
  MailCheck,
  Mic,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { readRoadmapDetailSnapshot } from "@/lib/job-detail-storage"
import type { RoadmapDetailSnapshot, RoadmapTask } from "@/lib/types"

interface RoadmapDetailPageProps {
  stepId: string
}

interface NextStageAdvice {
  title: string
  description: string
  icon: typeof ClipboardPenLine
}

function getStepSummary(currentTitle: string) {
  if (currentTitle.includes("补齐关键差距")) {
    return {
      title: "形成项目证据",
      subtitle: "打造可投递作品案例",
    }
  }

  if (currentTitle.includes("锁定目标")) {
    return {
      title: "明确目标方向",
      subtitle: "建立清晰的岗位选择依据",
    }
  }

  if (currentTitle.includes("简历")) {
    return {
      title: "夯实简历基础",
      subtitle: "让简历信息足够完整可信",
    }
  }

  return {
    title: currentTitle,
    subtitle: "把阶段目标拆成可执行动作",
  }
}

function buildNextStageAdvice(currentTitle: string, nextTitle: string): NextStageAdvice[] {
  if (currentTitle.includes("补齐关键差距")) {
    return [
      {
        title: "优化简历版本",
        description: "针对高匹配岗位定制关键词与项目表达，提升简历通过率。",
        icon: ClipboardPenLine,
      },
      {
        title: "准备面试故事",
        description: "围绕问题、行动、结果整理 2-3 段能直接复用的回答素材。",
        icon: Sparkles,
      },
      {
        title: "建立投递复盘",
        description: "按周跟踪投递、面试与反馈，及时调整后续策略。",
        icon: MailCheck,
      },
    ]
  }

  if (currentTitle.includes("锁定目标")) {
    return [
      {
        title: "对比目标岗位",
        description: `围绕“${nextTitle}”筛选 2-3 个典型岗位，沉淀差距与机会点。`,
        icon: Target,
      },
      {
        title: "补全岗位表达",
        description: "把当前经验改写成目标岗位熟悉的关键词、项目标题与成果表达。",
        icon: ClipboardPenLine,
      },
      {
        title: "建立能力清单",
        description: "把还缺的技能、案例、证明材料整理成逐周行动计划。",
        icon: Sparkles,
      },
    ]
  }

  return [
    {
      title: "补充关键信息",
      description: "完善简历、目标岗位和项目经历，让后续分析更稳定准确。",
      icon: ClipboardPenLine,
    },
    {
      title: "搭建岗位样本",
      description: "从推荐岗位中挑出高匹配样本，观察共同要求与差距。",
      icon: Target,
    },
    {
      title: "开始小步投递",
      description: "先做少量试投，尽快积累真实反馈，再迭代简历版本。",
      icon: MailCheck,
    },
  ]
}

export function RoadmapDetailPage({ stepId }: RoadmapDetailPageProps) {
  const [snapshot, setSnapshot] = useState<RoadmapDetailSnapshot | null>(null)
  const [tasks, setTasks] = useState<RoadmapTask[]>([])
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [draftTask, setDraftTask] = useState("")
  const router = useRouter()

  useEffect(() => {
    const nextSnapshot = readRoadmapDetailSnapshot(stepId)
    setSnapshot(nextSnapshot)
    setTasks(nextSnapshot?.suggestedTasks ?? [])
  }, [stepId])

  const gapItems = useMemo(() => {
    if (!snapshot) return []
    return snapshot.capabilityScores.flatMap((score) => score.gapItems).filter(Boolean).slice(0, 6)
  }, [snapshot])

  const orderedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => Number(completedIds.includes(a.id)) - Number(completedIds.includes(b.id)))
  }, [tasks, completedIds])

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push("/")
  }

  function addTask() {
    const title = draftTask.trim()
    if (!title) return

    setTasks((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        title,
        description: "这是你手动补充的阶段任务，可以继续编辑、完成或回滚。",
      },
    ])
    setDraftTask("")
  }

  function toggleCompleted(taskId: string) {
    setCompletedIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff_0%,#f6f9fc_42%,#fbfcfe_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>

          <Card className="mt-6 rounded-[32px] border-primary/10 bg-white/90 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-3xl font-semibold tracking-tight">暂未找到职业路径详情</h1>
              <p className="text-muted-foreground">请从首页的职业路径规划区域进入详情页，系统才能带入当前阶段和任务建议。</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { selectedStep, nextStep, candidateName, targetRole, reportTitle } = snapshot
  const summary = getStepSummary(selectedStep.title)
  const adviceItems = buildNextStageAdvice(selectedStep.title, nextStep?.title || targetRole)
  const phaseTrack = [
    "准备案例",
    "AI 工作流设计",
    "作品深度",
    "项目复盘",
    "进入投递冲刺",
  ]
  const activeTrackIndex = Math.min(Math.max(selectedStep.id + 1, 0), phaseTrack.length - 1)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff_0%,#f6f9fc_42%,#fbfcfe_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <section className="rounded-[34px] border border-primary/10 bg-white/88 p-8 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
            >
              <ArrowLeft className="h-4 w-4" />
              返回职业路径
            </button>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-primary">路线阶段详情</span>
              <span>当前为阶段 {selectedStep.id}</span>
            </div>

            <div className="mt-4 space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">{summary.title}</h1>
              <p className="text-xl text-muted-foreground">{summary.subtitle}</p>
            </div>

            <div className="mt-8 hidden items-center gap-3 xl:flex">
              {phaseTrack.map((item, index) => {
                const isDone = index < activeTrackIndex
                const isCurrent = index === activeTrackIndex

                return (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                          isCurrent
                            ? "border-cyan-300 bg-cyan-400 text-slate-900 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                            : isDone
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/70 bg-white text-slate-500"
                        }`}
                      >
                        {isCurrent ? <CircleDot className="h-4 w-4" /> : index + 1}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isCurrent ? "text-slate-900" : isDone ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {item}
                      </span>
                    </div>
                    {index < phaseTrack.length - 1 ? (
                      <div
                        className={`h-1 w-10 rounded-full ${
                          index < activeTrackIndex ? "bg-primary/70" : "bg-slate-200"
                        }`}
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>

          <aside className="rounded-[30px] border border-primary/10 bg-white/92 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:self-start">
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-900">候选姓名：</span>
                {candidateName}
              </p>
              <p>
                <span className="font-medium text-slate-900">目标角色：</span>
                {targetRole}
              </p>
              <p>
                <span className="font-medium text-slate-900">当前阶段：</span>
                {selectedStep.timeframe}
              </p>
              <p>
                <span className="font-medium text-slate-900">下一阶段：</span>
                {nextStep?.title ?? "继续夯实当前阶段"}
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">阶段状态</p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                  <span className="text-slate-600">当前进度</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                    阶段 {selectedStep.id}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                    style={{ width: `${Math.min(100, ((selectedStep.id + 1) / 5) * 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="rounded-lg bg-white px-3 py-2">当前：{selectedStep.timeframe}</div>
                  <div className="rounded-lg bg-white px-3 py-2">下一步：{nextStep?.title ?? "待确认"}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
          <div className="space-y-6">
            <Card className="rounded-[30px] border-primary/10 bg-white/92 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
              <CardContent className="space-y-6 p-6">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">当前阶段画像</h2>
              </div>

              <p className="text-lg leading-8 text-slate-700">{selectedStep.description}</p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] border border-primary/10 bg-sky-50/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">当前聚焦</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{summary.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{summary.subtitle}</p>
                </div>
                <div className="rounded-[22px] border border-primary/10 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">阶段标签</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStep.title.split(/[\s/]+/).slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm text-primary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-[22px] border border-primary/10 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">完成建议</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{Math.min(100, 42 + gapItems.length * 6)}%</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">基于当前差距项与阶段任务估算的准备度。</p>
                </div>
              </div>

              <div className="rounded-[26px] bg-sky-50/70 p-5">
                <p className="text-sm font-semibold text-slate-900">当前与目标岗位的差距</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {gapItems.length > 0 ? (
                      gapItems.map((item, index) => {
                        const tone =
                          index === 0 || index === 1
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : index === 2 || index === 3
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-white text-slate-700"

                        return (
                        <span
                          key={`${item}-${index}`}
                          className={`rounded-full border px-3 py-1.5 text-sm ${tone}`}
                        >
                          {item}
                        </span>
                        )
                      })
                    ) : (
                      <span className="text-sm leading-7 text-muted-foreground">
                        当前没有识别到明显短板，可继续强化项目证据与岗位表达。
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[30px] border-primary/10 bg-white/92 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold tracking-tight">阶段任务面板</h2>
                </div>

                <div className="mt-5 flex gap-3">
                  <Input
                    value={draftTask}
                    onChange={(event) => setDraftTask(event.target.value)}
                    placeholder="输入你想补充的新任务，例如：重写项目经历"
                    className="rounded-2xl bg-white"
                  />
                  <Button type="button" onClick={addTask} className="rounded-2xl px-5">
                    <CirclePlus className="mr-1 h-4 w-4" />
                    新增任务
                  </Button>
                </div>

                <div className="mt-5 space-y-4">
                  {orderedTasks.map((task, index) => {
                    const done = completedIds.includes(task.id)

                    return (
                      <div
                        key={task.id}
                        className={`rounded-[24px] border p-5 transition ${
                          done
                            ? "border-emerald-200 bg-emerald-50/70"
                            : "border-primary/10 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                                  done
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-500"
                                }`}
                              >
                                {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                              </div>
                              <p className={`text-xl font-semibold ${done ? "text-slate-500 line-through" : "text-slate-900"}`}>
                                {task.title}
                              </p>
                            </div>
                            <p className="text-base leading-7 text-slate-700">{task.description}</p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={done ? "outline" : "default"}
                              className="rounded-2xl"
                              onClick={() => toggleCompleted(task.id)}
                            >
                              <BookCheck className="mr-1 h-4 w-4" />
                              {done ? "已完成" : "标记完成"}
                            </Button>
                            {done ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => toggleCompleted(task.id)}
                              >
                                <RotateCcw className="mr-1 h-4 w-4" />
                                回滚
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[30px] border-primary/10 bg-white/92 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">行动建议 & 下一阶段目标</h2>
              </div>

              {nextStep ? (
                <div className="rounded-[24px] bg-primary/5 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-primary">下一阶段目标</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{nextStep.title}</p>
                      <p className="mt-3 text-base leading-7 text-slate-700">{nextStep.description}</p>
                    </div>
                    <div className="hidden h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300/25 to-primary/20 xl:flex">
                      <GitBranch className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                {adviceItems.map((item, index) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={`${item.title}-${index}`}
                      className="rounded-[24px] border border-primary/10 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-2 text-base leading-7 text-slate-700">{item.description}</p>
                        </div>
                        <ArrowLeft className="ml-auto h-5 w-5 rotate-180 text-primary/60" />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium text-slate-900">报告来源：</span>
                {reportTitle}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
