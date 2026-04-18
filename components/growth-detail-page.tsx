"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Gauge,
  UserCircle2,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { readGrowthDetailSnapshot } from "@/lib/job-detail-storage"
import type { CapabilityScoreCard, GrowthDetailSnapshot } from "@/lib/types"

interface GrowthDetailPageProps {
  stageId: string
}

interface LearningTask {
  key: string
  title: string
  description: string
  detail: string
}

function translateDimensionLabel(label: string) {
  const normalized = label.trim()

  if (normalized.includes("基础")) return "业务基础"
  if (normalized.includes("技能")) return "专业能力"
  if (normalized.includes("素养")) return "协同素养"
  if (normalized.includes("潜力")) return "成长潜力"

  return normalized
}

function buildRadarPoints(values: number[], radius: number, center = 110) {
  const total = values.length

  return values
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / total - Math.PI / 2
      const scaledRadius = (Math.max(25, Math.min(100, value)) / 100) * radius
      const x = center + Math.cos(angle) * scaledRadius
      const y = center + Math.sin(angle) * scaledRadius

      return `${x},${y}`
    })
    .join(" ")
}

function buildAxisLabels(dimensions: string[], radius: number, center = 110) {
  return dimensions.map((dimension, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    const x = center + Math.cos(angle) * (radius + 24)
    const y = center + Math.sin(angle) * (radius + 24)

    return {
      dimension,
      x,
      y,
      anchor: x < center - 8 ? "end" : x > center + 8 ? "start" : "middle",
    }
  })
}

function deriveStageSummary(capabilityScores: CapabilityScoreCard[]) {
  const strongest = [...capabilityScores].sort((a, b) => b.score - a.score).slice(0, 2)
  const summary = strongest.map((item) => item.summary).filter(Boolean)

  if (summary.length > 0) {
    return summary.join(" ")
  }

  return "先把当前阶段已经具备的经验讲清楚，再围绕下一阶段要求补齐项目证据、协同案例和结果表达。"
}

function buildLearningTasks(snapshot: GrowthDetailSnapshot): LearningTask[] {
  const currentFocus = snapshot.selectedStage.focus
  const nextFocus = snapshot.nextStage?.focus ?? []
  const missingTopics = nextFocus.filter((item) => !currentFocus.includes(item))
  const topics = missingTopics.length > 0 ? missingTopics : [...currentFocus].slice(0, 3)

  return topics.map((topic, index) => ({
    key: `${topic}-${index}`,
    title: topic,
    description:
      index === 0
        ? `优先围绕“${topic}”补齐一段可量化的项目或实习成果。`
        : index === 1
          ? `把“${topic}”转成能直接放进简历和面试中的表达。`
          : `把“${topic}”补成可以稳定复用的岗位说服材料。`,
    detail:
      index === 0
        ? `建议补充目标、动作、结果完整闭环的案例，至少准备 1 个量化成果，突出你在“${topic}”上的真实贡献。`
        : index === 1
          ? `围绕“${topic}”整理关键词、项目标题和面试回答模板，让它既能写进简历，也能在面试中讲清楚。`
          : `围绕“${topic}”整理证书、作品、复盘记录或业务反馈，形成能反复使用的说服材料。`,
  }))
}

export function GrowthDetailPage({ stageId }: GrowthDetailPageProps) {
  const [snapshot, setSnapshot] = useState<GrowthDetailSnapshot | null>(null)
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0)
  const [completedTaskKeys, setCompletedTaskKeys] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    setSnapshot(readGrowthDetailSnapshot(stageId))
  }, [stageId])

  const gapItems = useMemo(() => {
    if (!snapshot) return []
    return snapshot.capabilityScores.flatMap((item) => item.gapItems).filter(Boolean).slice(0, 6)
  }, [snapshot])

  const learningTasks = useMemo(() => {
    if (!snapshot) return []
    return buildLearningTasks(snapshot)
  }, [snapshot])

  const orderedTasks = useMemo(() => {
    return [...learningTasks].sort(
      (a, b) => Number(completedTaskKeys.includes(a.key)) - Number(completedTaskKeys.includes(b.key)),
    )
  }, [completedTaskKeys, learningTasks])

  const selectedTask = orderedTasks[selectedTaskIndex] ?? orderedTasks[0]

  useEffect(() => {
    if (selectedTaskIndex >= orderedTasks.length) {
      setSelectedTaskIndex(0)
    }
  }, [orderedTasks.length, selectedTaskIndex])

  function toggleTaskCompleted(taskKey: string) {
    setCompletedTaskKeys((prev) =>
      prev.includes(taskKey) ? prev.filter((item) => item !== taskKey) : [...prev, taskKey],
    )
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push("/")
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#f9fbfd_50%,#ffffff_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            返回职业路径
          </button>

          <Card className="mt-6 rounded-[32px] border-primary/10 bg-white/90 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-3xl font-semibold tracking-tight">暂未找到成长阶段详情</h1>
              <p className="text-muted-foreground">
                请从首页的成长阶段卡片进入详情页，这样系统才能携带当前阶段信息、下一步目标和成长建议。
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { selectedStage, nextStage, candidateName, reportTitle, targetRole, capabilityScores } = snapshot
  const stageSummary = deriveStageSummary(capabilityScores)
  const translatedDimensions = capabilityScores.map((item) => translateDimensionLabel(item.dimension))
  const currentRadar = capabilityScores.map((item) => item.score)
  const targetRadar = capabilityScores.map((item) => Math.min(95, Math.max(item.score + 12, 75)))
  const radarLabels = buildAxisLabels(translatedDimensions, 70)
  const stageNodes = [selectedStage.role, nextStage?.role, targetRole].filter(
    (value, index, array): value is string => Boolean(value) && array.indexOf(value) === index,
  )
  const readinessScore = Math.round(
    capabilityScores.reduce((total, item) => total + item.score * item.weight, 0) / 100,
  )

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff_0%,#f6f9fc_42%,#fbfcfe_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-[34px] border border-primary/10 bg-white/85 p-8 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur">
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
              <span>当前处于路径的第 1 阶段（{Math.max(stageNodes.length, 3)}/5）</span>
            </div>

            <div className="mt-5 space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">{selectedStage.role}</h1>
              <p className="text-lg text-muted-foreground">{targetRole} 成长路径</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {stageNodes.map((node, index) => {
                const isCurrent = index === 0

                return (
                  <div key={`${node}-${index}`} className="flex items-center gap-2">
                    <div
                      className={`rounded-l-xl rounded-r-sm px-4 py-2 text-sm font-medium ${
                        isCurrent ? "bg-primary text-primary-foreground shadow-sm" : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {node}
                    </div>
                    {index < stageNodes.length - 1 ? <div className="h-px w-6 bg-primary/25" /> : null}
                  </div>
                )
              })}
            </div>
          </section>

          <aside className="rounded-[30px] border border-primary/10 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:self-start">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <UserCircle2 className="h-14 w-14" />
              </div>

              <div className="relative h-24 w-24 shrink-0">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#f59e0b 0 ${readinessScore * 3.6}deg, #e7eef7 ${readinessScore * 3.6}deg 360deg)`,
                  }}
                />
                <div className="absolute inset-[8px] flex items-center justify-center rounded-full bg-white text-xl font-semibold text-slate-800">
                  {readinessScore}%
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-900">候选人：</span>
                {candidateName}
              </p>
              <p>
                <span className="font-medium text-slate-900">目标岗位：</span>
                {targetRole}
              </p>
              <p>
                <span className="font-medium text-slate-900">当前阶段：</span>
                {selectedStage.level}
              </p>
              <p>
                <span className="font-medium text-slate-900">下一阶段：</span>
                {nextStage?.role ?? "继续夯实当前阶段"}
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="self-start rounded-[30px] border-primary/10 bg-white/90 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:sticky xl:top-24">
            <CardContent className="p-7">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">当前阶段画像</h2>
              </div>

              <p className="mt-5 text-base leading-8 text-slate-700">{stageSummary}</p>

              <div className="mt-8 space-y-6">
                <div className="rounded-[28px] border border-primary/10 bg-slate-50/90 p-5">
                  <p className="text-center text-sm font-medium text-slate-600">能力结构</p>
                  <div className="mt-4 flex justify-center">
                    <svg viewBox="0 0 220 220" className="h-[240px] w-[240px]">
                      {[25, 40, 55, 70].map((radius) => (
                        <polygon
                          key={radius}
                          points={buildRadarPoints(new Array(translatedDimensions.length).fill(100), radius)}
                          fill="none"
                          stroke="#dbe5f1"
                          strokeWidth="1"
                        />
                      ))}

                      {translatedDimensions.map((_, index) => {
                        const angle = (Math.PI * 2 * index) / translatedDimensions.length - Math.PI / 2
                        const x = 110 + Math.cos(angle) * 70
                        const y = 110 + Math.sin(angle) * 70
                        return <line key={`axis-${index}`} x1="110" y1="110" x2={x} y2={y} stroke="#dbe5f1" strokeWidth="1" />
                      })}

                      <polygon
                        points={buildRadarPoints(targetRadar, 70)}
                        fill="none"
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        strokeWidth="2"
                      />
                      <polygon
                        points={buildRadarPoints(currentRadar, 70)}
                        fill="rgba(245, 158, 11, 0.38)"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />

                      {radarLabels.map((item) => (
                        <text
                          key={item.dimension}
                          x={item.x}
                          y={item.y}
                          textAnchor={item.anchor as "start" | "middle" | "end"}
                          className="fill-slate-600 text-[11px]"
                        >
                          {item.dimension}
                        </text>
                      ))}
                    </svg>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-5 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-0.5 w-5 rounded-full bg-amber-500" />
                      当前
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-0.5 w-5 rounded-full border-t-2 border-dashed border-slate-400" />
                      下一阶段参考
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[28px] border border-primary/10 bg-slate-50/90 p-5">
                    <p className="text-sm font-semibold text-slate-900">与目标岗位的差距</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {gapItems.length > 0 ? (
                        gapItems.map((item, index) => {
                          const levelClass =
                            index === 0 || index === 1
                              ? "bg-rose-50 text-rose-700"
                              : index === 2 || index === 3
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-700"

                          return (
                            <span
                              key={`${item}-${index}`}
                              className={`rounded-full border border-border/60 px-3 py-1.5 text-sm ${levelClass}`}
                            >
                              {item}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-sm leading-7 text-muted-foreground">
                          当前没有明显短板，建议继续提升项目结果表达与更高阶岗位的业务包装。
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-primary/10 bg-slate-50/90 p-5">
                    <p className="text-sm font-semibold text-slate-900">阶段重点</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedStage.focus.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm text-primary"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-primary/10 bg-white/90 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="p-7">
              <div className="flex items-center gap-3">
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">阶段任务面板</h2>
              </div>

              <div className="mt-6 space-y-5">
                {orderedTasks.map((task, index) => {
                  const completed = completedTaskKeys.includes(task.key)
                  const statusLabel = completed ? "已完成" : index === selectedTaskIndex ? "进行中" : "待开始"
                  const statusClass = completed
                    ? "bg-emerald-50 text-emerald-700"
                    : index === selectedTaskIndex
                      ? "bg-sky-50 text-sky-700"
                      : "bg-amber-50 text-amber-700"

                  return (
                    <div key={task.key} className="grid grid-cols-[28px_1fr] gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-sm font-semibold text-white">
                          {index + 1}
                        </div>
                        {index < orderedTasks.length - 1 ? <div className="mt-2 h-full w-px bg-slate-300" /> : null}
                      </div>

                      <div className="rounded-[24px] border border-primary/10 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xl font-semibold text-slate-900">{task.title}</p>
                            <p className="mt-2 text-sm leading-7 text-slate-600">{task.description}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                          {task.detail}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskIndex(index)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
                          >
                            查看模板
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTaskCompleted(task.key)}
                            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                          >
                            {completed ? "取消完成" : "标记完成"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedTask ? (
                <div className="mt-6 rounded-2xl border border-border/60 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                  <span className="font-medium text-slate-900">当前任务提示：</span>
                  {selectedTask.detail}
                </div>
              ) : null}

              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium text-slate-900">数据来源：</span>
                {reportTitle}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
