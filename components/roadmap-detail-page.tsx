"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { ArrowLeft, BookCheck, CirclePlus, RotateCcw, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { readRoadmapDetailSnapshot } from "@/lib/job-detail-storage"
import type { RoadmapDetailSnapshot, RoadmapTask } from "@/lib/types"

interface RoadmapDetailPageProps {
  stepId: string
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
    if (!snapshot) {
      return []
    }

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
    if (!title) {
      return
    }

    setTasks((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        title,
        description: "这是你手动新增的阶段任务，可以完成后回滚。",
      },
    ])
    setDraftTask("")
  }

  function toggleCompleted(taskId: string) {
    setCompletedIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>

          <Card className="mt-6 border-border/60">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-3xl font-semibold tracking-tight">暂未找到路线阶段详情</h1>
              <p className="text-muted-foreground">请从首页的职业路径规划区域点击“查看详情”进入，这样系统才能携带当前阶段与任务建议。</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { selectedStep, nextStep, candidateName, targetRole, reportTitle } = snapshot

  return (
    <main className="min-h-screen bg-secondary/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80">
              <ArrowLeft className="h-4 w-4" />
              返回职业路径
            </button>
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">路线阶段详情</p>
              <h1 className="text-4xl font-semibold tracking-tight">{selectedStep.title}</h1>
              <p className="text-lg text-muted-foreground">{selectedStep.subtitle}</p>
            </div>
          </div>

          <Card className="min-w-[280px] border-primary/20 bg-card/90">
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <p>候选人：{candidateName}</p>
              <p>目标岗位：{targetRole}</p>
              <p>当前阶段：{selectedStep.timeframe}</p>
              <p>下一阶段：{nextStep?.title || "继续夯实当前阶段"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">当前阶段画像</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="leading-7 text-muted-foreground">{selectedStep.description}</p>
                <div className="rounded-2xl bg-secondary/40 p-4">
                  <p className="text-sm font-medium text-foreground">当前与你目标岗位的差距</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {gapItems.length > 0 ? (
                      gapItems.map((item, index) => (
                        <span key={`${item}-${index}`} className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">当前未识别到明显差距，可继续强化项目证据与岗位表达。</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">阶段任务面板</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    value={draftTask}
                    onChange={(event) => setDraftTask(event.target.value)}
                    placeholder="输入你想补充的新任务，例如：重写项目经历"
                  />
                  <Button type="button" onClick={addTask} className="rounded-full">
                    <CirclePlus className="h-4 w-4" />
                    新增任务
                  </Button>
                </div>

                <div className="space-y-3">
                  {orderedTasks.map((task) => {
                    const done = completedIds.includes(task.id)

                    return (
                      <div
                        key={task.id}
                        className={`rounded-2xl border p-4 transition ${
                          done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-background"
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <p className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                            <p className="text-sm leading-7 text-muted-foreground">{task.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant={done ? "outline" : "default"} className="rounded-full" onClick={() => toggleCompleted(task.id)}>
                              <BookCheck className="h-4 w-4" />
                              {done ? "已完成" : "标记完成"}
                            </Button>
                            {done ? (
                              <Button type="button" variant="outline" className="rounded-full" onClick={() => toggleCompleted(task.id)}>
                                <RotateCcw className="h-4 w-4" />
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

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-5 w-5 text-primary" />
                  通往下一阶段的行动建议
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextStep ? (
                  <div className="rounded-2xl bg-primary/5 p-4">
                    <p className="text-sm font-medium text-primary">下一阶段目标</p>
                    <p className="mt-2 text-lg font-semibold">{nextStep.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{nextStep.description}</p>
                  </div>
                ) : null}

                {buildNextStageAdvice(selectedStep.title, nextStep?.title || targetRole).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-2xl border border-border/60 bg-background p-4">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                  </div>
                ))}

                <div className="rounded-2xl bg-secondary/40 p-4 text-sm leading-7 text-muted-foreground">报告来源：{reportTitle}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function buildNextStageAdvice(currentTitle: string, nextTitle: string) {
  if (currentTitle.includes("简历解析")) {
    return [
      { title: "补全基础材料", description: "完善简历、目标岗位、目标城市和能力标签，让系统拿到更完整的起点信息。" },
      { title: "检查关键信息", description: "确认学历、年限、项目与技能提取是否准确，避免后续分析偏差。" },
      { title: "开始筛选岗位", description: `围绕“${nextTitle}”开始阅读推荐岗位与岗位画像，建立清晰的定位。` },
    ]
  }

  if (currentTitle.includes("锁定目标")) {
    return [
      { title: "查看岗位画像", description: "重点阅读目标岗位的技能要求、实践要求与证书建议。" },
      { title: "聚焦差距项", description: "把能力分析里的待补齐项转成可执行任务，避免只停留在判断阶段。" },
      { title: "形成阶段目标", description: `围绕“${nextTitle}”设定未来 2-4 周的能力补强清单。` },
    ]
  }

  if (currentTitle.includes("补齐关键差距")) {
    return [
      { title: "完成项目证据", description: "优先形成 1 个能量化结果的项目案例，增强岗位说服力。" },
      { title: "沉淀岗位表达", description: "把技能、项目与业务成果改写成更贴近目标岗位的语言。" },
      { title: "准备投递节奏", description: `为“${nextTitle}”提前准备简历版本、岗位清单与面试故事。` },
    ]
  }

  return [
    { title: "优化简历版本", description: "针对高匹配岗位定制关键词与项目表达，提升简历通过率。" },
    { title: "准备面试故事", description: "围绕问题、行动、结果整理 2-3 段能直接复用的回答素材。" },
    { title: "建立投递复盘", description: "按周跟踪投递、面试与反馈，及时调整后续策略。" },
  ]
}
