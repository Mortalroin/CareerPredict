"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { ArrowLeft, BookOpen, CheckCircle2, Compass, GraduationCap, Target } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readGrowthDetailSnapshot } from "@/lib/job-detail-storage"
import type { GrowthDetailSnapshot } from "@/lib/types"

interface GrowthDetailPageProps {
  stageId: string
}

export function GrowthDetailPage({ stageId }: GrowthDetailPageProps) {
  const [snapshot, setSnapshot] = useState<GrowthDetailSnapshot | null>(null)
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0)
  const [completedTopicKeys, setCompletedTopicKeys] = useState<string[]>([])

  useEffect(() => {
    setSnapshot(readGrowthDetailSnapshot(stageId))
  }, [stageId])

  const gapItems = useMemo(() => {
    if (!snapshot) {
      return []
    }

    return snapshot.capabilityScores.flatMap((score) => score.gapItems).filter(Boolean).slice(0, 6)
  }, [snapshot])

  const learningPlan = useMemo(() => {
    if (!snapshot) {
      return []
    }

    const currentFocus = snapshot.selectedStage.focus
    const nextFocus = snapshot.nextStage?.focus ?? []
    const missingTopics = nextFocus.filter((item) => !currentFocus.includes(item))
    const topics = missingTopics.length > 0 ? missingTopics : currentFocus.slice(0, 3)

    return topics.map((topic, index) => ({
      key: `${topic}-${index}`,
      topic,
      actions: [
        `围绕“${topic}”补充 1 个可量化的项目案例或实践任务。`,
        `每周固定安排学习时间，整理与“${topic}”相关的方法、工具与岗位要求。`,
        `把“${topic}”转化为简历与面试中的可表达成果。`,
      ],
    }))
  }, [snapshot])

  const orderedLearningPlan = useMemo(() => {
    return [...learningPlan].sort(
      (a, b) => Number(completedTopicKeys.includes(a.key)) - Number(completedTopicKeys.includes(b.key)),
    )
  }, [completedTopicKeys, learningPlan])

  const selectedTopic = orderedLearningPlan[selectedTopicIndex] ?? orderedLearningPlan[0]

  function toggleTopicCompleted(topicKey: string) {
    setCompletedTopicKeys((prev) =>
      prev.includes(topicKey) ? prev.filter((item) => item !== topicKey) : [...prev, topicKey],
    )
  }

  useEffect(() => {
    if (selectedTopicIndex >= orderedLearningPlan.length) {
      setSelectedTopicIndex(0)
    }
  }, [orderedLearningPlan.length, selectedTopicIndex])

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          <Card className="mt-6 border-border/60">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-3xl font-semibold tracking-tight">暂未找到成长阶段详情</h1>
              <p className="text-muted-foreground">
                请从首页的成长阶段卡片点击“查看成长建议”进入，这样系统才能携带当前阶段与学习建议。
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { selectedStage, nextStage, candidateName, reportTitle } = snapshot

  return (
    <main className="min-h-screen bg-secondary/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80">
              <ArrowLeft className="h-4 w-4" />
              返回成长路径
            </Link>
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">成长阶段详情</p>
              <h1 className="text-4xl font-semibold tracking-tight">{selectedStage.role}</h1>
              <p className="text-lg text-muted-foreground">{selectedStage.timeframe}</p>
            </div>
          </div>

          <Card className="min-w-[260px] border-primary/20 bg-card/90">
            <CardContent className="space-y-4 p-6">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Compass className="h-4 w-4" />
                候选人：{candidateName}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                当前阶段：{selectedStage.level}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                下一目标：{nextStage?.role || "继续夯实当前阶段"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">当前阶段画像</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">阶段定位</p>
                <p className="mt-2 text-lg font-semibold">{selectedStage.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">建议重点</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedStage.focus.map((item) => (
                    <span key={item} className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-secondary/40 p-5">
                <p className="text-sm font-medium text-foreground">当前与你目标岗位的差距</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {gapItems.length > 0 ? (
                    gapItems.map((item, index) => (
                      <span key={`${item}-${index}`} className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">目前未识别到明显短板，可继续提升项目证据与岗位表达。</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-primary" />
                通往下一阶段的学习建议
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {nextStage ? (
                <div className="rounded-2xl bg-primary/5 p-5">
                  <p className="text-sm font-medium text-primary">目标阶段</p>
                  <p className="mt-2 text-lg font-semibold">{nextStage.role}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    你需要开始为下一阶段所要求的核心能力做准备，优先补足那些当前阶段还未充分体现、但下一阶段明确要求的能力标签。
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                {orderedLearningPlan.map((item, index) => {
                  const completed = completedTopicKeys.includes(item.key)
                  const selected = selectedTopic?.key === item.key

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedTopicIndex(index)}
                      onDoubleClick={() => toggleTopicCompleted(item.key)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected ? "border-primary bg-primary/5" : "border-border/60 bg-background"
                      } ${completed ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{item.topic}</p>
                        {completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        单击切换主题，双击标记完成；完成后会自动移动到下方。
                      </p>
                    </button>
                  )
                })}
              </div>

              {selectedTopic ? (
                <div className="rounded-2xl border border-border/60 bg-background p-5">
                  <p className="text-sm font-medium text-primary">当前学习主题</p>
                  <p className="mt-2 text-lg font-semibold">{selectedTopic.topic}</p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                    {selectedTopic.actions.map((action, index) => (
                      <p key={`${selectedTopic.key}-${index}`}>{action}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl bg-secondary/40 p-5 text-sm leading-7 text-muted-foreground">
                报告来源：{reportTitle}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
