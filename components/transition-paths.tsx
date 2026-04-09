"use client"

import { useEffect, useMemo, useState } from "react"
import { Compass, GitBranchPlus, MoveRight, Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CareerAnalysisResponse, JobPortraitCard } from "@/lib/types"

interface TransitionPathsProps {
  paths: CareerAnalysisResponse["transitionPaths"]
  portraits: JobPortraitCard[]
}

type TransitionGroup = {
  sourceRole: string
  paths: CareerAnalysisResponse["transitionPaths"]
}

export function TransitionPaths({ paths, portraits }: TransitionPathsProps) {
  const groups = useMemo<TransitionGroup[]>(() => {
    const grouped = new Map<string, CareerAnalysisResponse["transitionPaths"]>()

    paths.forEach((path) => {
      const current = grouped.get(path.sourceRole) ?? []
      current.push(path)
      grouped.set(path.sourceRole, current)
    })

    return Array.from(grouped.entries()).map(([sourceRole, groupedPaths]) => ({
      sourceRole,
      paths: groupedPaths,
    }))
  }, [paths])

  const [activeSource, setActiveSource] = useState(groups[0]?.sourceRole ?? "")
  const activeGroup = groups.find((group) => group.sourceRole === activeSource) ?? groups[0]
  const [activeTarget, setActiveTarget] = useState(activeGroup?.paths[0]?.targetRole ?? "")

  useEffect(() => {
    if (!groups.some((group) => group.sourceRole === activeSource)) {
      setActiveSource(groups[0]?.sourceRole ?? "")
    }
  }, [activeSource, groups])

  useEffect(() => {
    if (!activeGroup) {
      setActiveTarget("")
      return
    }

    if (!activeGroup.paths.some((path) => path.targetRole === activeTarget)) {
      setActiveTarget(activeGroup.paths[0]?.targetRole ?? "")
    }
  }, [activeGroup, activeTarget])

  const activePath =
    activeGroup?.paths.find((path) => path.targetRole === activeTarget) ??
    activeGroup?.paths[0]

  const portraitLookup = useMemo(() => {
    const lookup = new Map<string, JobPortraitCard>()
    portraits.forEach((portrait) => {
      lookup.set(portrait.roleName, portrait)
    })
    return lookup
  }, [portraits])

  const activePortrait = activePath
    ? portraitLookup.get(activePath.targetRole) ?? buildFallbackBridgePortrait(activePath)
    : undefined

  return (
    <section className="py-14 lg:py-20" id="transition-paths">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">转岗路径图谱</p>
          <h2 className="mt-3 text-[2rem] font-semibold tracking-tight">可迁移岗位与岗位桥接</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            这里把多个岗位之间的可迁移关系整理成岗位桥接图。你可以先选择一个源岗位，再查看它延展出去的分支岗位，以及每条路径背后的桥接技能和行动建议。
          </p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <Card className="border-border/60 bg-card/90 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-hidden">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <GitBranchPlus className="h-4 w-4" />
                岗位关系图谱
              </div>
              <div className="rounded-3xl border border-border/60 bg-secondary/20 p-4 text-sm leading-6 text-muted-foreground">
                当前展示的是“源岗位 - 可转向岗位”的图谱关系。你可以先选左侧源岗位，再切换分支岗位，查看为什么这条路径成立，以及具体要补哪些桥接能力。
              </div>
            </CardHeader>

            <CardContent className="space-y-5 xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto xl:pr-2">
              {groups.map((group) => {
                const selected = group.sourceRole === activeSource
                const selectedPath =
                  group.paths.find((path) => path.targetRole === activeTarget) ??
                  group.paths[0]

                return (
                  <button
                    key={group.sourceRole}
                    type="button"
                    onClick={() => {
                      setActiveSource(group.sourceRole)
                      setActiveTarget(group.paths[0]?.targetRole ?? "")
                    }}
                    className={`w-full rounded-[32px] border p-5 text-left transition ${
                      selected
                        ? "border-primary/35 bg-primary/5 shadow-sm"
                        : "border-border/60 bg-background hover:border-primary/20 hover:bg-secondary/20"
                    }`}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            源岗位
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-[1.9rem] font-semibold leading-tight">{group.sourceRole}</h3>
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                              {group.paths.length} 条可迁移方向
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 rounded-full bg-background px-3 py-2 text-sm font-medium text-primary">
                          可转向
                        </div>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-[96px_1fr]">
                        <div className="hidden lg:flex lg:flex-col lg:items-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                            起点
                          </div>
                          <div className="min-h-12 w-px flex-1 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
                        </div>

                        <div className="space-y-3">
                          {group.paths.map((path, index) => {
                            const isActiveTarget = selected && path.targetRole === activeTarget

                            return (
                              <div
                                key={`${group.sourceRole}-${path.targetRole}`}
                                className="grid gap-3 md:grid-cols-[40px_1fr] md:items-start"
                              >
                                <div className="hidden h-full items-start justify-center md:flex">
                                  <div className="mt-4 flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-background text-xs font-semibold text-primary">
                                    {index + 1}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setActiveSource(group.sourceRole)
                                    setActiveTarget(path.targetRole)
                                  }}
                                  className={`rounded-2xl border p-4 text-left transition ${
                                    isActiveTarget
                                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                      : "border-border/60 bg-background hover:border-primary/25 hover:bg-primary/5"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p
                                        className={`text-xs font-medium uppercase tracking-[0.18em] ${
                                          isActiveTarget ? "text-primary-foreground/80" : "text-muted-foreground"
                                        }`}
                                      >
                                        分支岗位
                                      </p>
                                      <p className="mt-2 text-[1.35rem] font-semibold leading-tight">{path.targetRole}</p>
                                    </div>
                                    <MoveRight
                                      className={`h-5 w-5 shrink-0 ${
                                        isActiveTarget ? "text-primary-foreground" : "text-primary"
                                      }`}
                                    />
                                  </div>

                                  <p
                                    className={`mt-3 line-clamp-2 text-[0.95rem] leading-6 ${
                                      isActiveTarget ? "text-primary-foreground/90" : "text-muted-foreground"
                                    }`}
                                  >
                                    {path.reason}
                                  </p>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {selectedPath ? (
                        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-2xl bg-secondary/45 p-4">
                            <p className="text-sm font-medium text-foreground">关系说明</p>
                            <p className="mt-2 text-[0.95rem] leading-7 text-muted-foreground">{selectedPath.reason}</p>
                          </div>

                          <div className="rounded-2xl bg-background p-4">
                            <p className="text-sm font-medium text-foreground">桥接技能</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedPath.bridgeSkills.map((skill, index) => (
                                <span
                                  key={`${selectedPath.targetRole}-${skill}-${index}`}
                                  className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-sm xl:sticky xl:top-24 xl:self-start">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Compass className="h-4 w-4" />
                岗位桥接画像
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-[1.9rem] leading-tight">{activePath?.targetRole ?? "请选择一个转岗方向"}</CardTitle>
                {activePortrait ? (
                  <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                    {activePortrait.roleFamily}
                  </span>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {activePath && activePortrait ? (
                <>
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <p className="text-sm font-medium text-foreground">桥接判断</p>
                    <p className="mt-2 text-[0.95rem] leading-7 text-muted-foreground">{activePath.reason}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">可复用的桥接能力</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activePath.bridgeSkills.map((skill, index) => (
                        <span
                          key={`${activePath.targetRole}-${skill}-${index}-panel`}
                          className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-[0.95rem] leading-7 text-muted-foreground">{activePortrait.summary}</p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoBlock title="学习要求" items={activePortrait.learningRequirements} />
                    <InfoBlock title="沟通要求" items={activePortrait.communicationRequirements} />
                    <InfoBlock title="抗压要求" items={activePortrait.stressRequirements} />
                    <InfoBlock title="实践要求" items={activePortrait.internshipRequirements} />
                  </div>

                  <div className="rounded-2xl bg-secondary/40 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      证书与资质
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(activePortrait.certificates.length > 0
                        ? activePortrait.certificates.slice(0, 5)
                        : ["建议准备相关项目证明或岗位材料"]).map((certificate, index) => (
                        <span
                          key={`${activePortrait.roleName}-${certificate}-${index}`}
                          className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm"
                        >
                          {certificate}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-foreground">桥接动作建议</p>
                    <div className="space-y-3">
                      {activePath.actionItems.map((item, index) => (
                        <div
                          key={`${activePath.targetRole}-${index}`}
                          className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-[0.95rem] leading-7 text-muted-foreground"
                        >
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-secondary/40 p-6 text-sm leading-7 text-muted-foreground">
                  暂未生成可迁移岗位图谱。请先完成简历分析或加载演示报告。
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  const renderedItems = items.length > 0 ? items.slice(0, 2) : ["暂未明确要求"]

  return (
    <div className="rounded-2xl bg-secondary/50 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-3 min-h-[5.5rem] space-y-2">
        {renderedItems.map((item, index) => (
          <p key={`${title}-${item}-${index}`} className="text-[0.95rem] leading-6 text-muted-foreground">
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}

function buildFallbackBridgePortrait(
  path: CareerAnalysisResponse["transitionPaths"][number],
): JobPortraitCard {
  const family = inferRoleFamily(path.targetRole)
  const bridgeSkills = dedupeList(path.bridgeSkills)

  const defaults: Record<
    string,
    {
      roleFamily: string
      learningRequirements: string[]
      communicationRequirements: string[]
      stressRequirements: string[]
      internshipRequirements: string[]
      certificates: string[]
    }
  > = {
    product: {
      roleFamily: "产品",
      learningRequirements: ["理解平台或产品策略拆解", "补足指标体系和方案设计能力"],
      communicationRequirements: ["能与研发和设计高效协同", "能把复杂需求翻译成业务语言"],
      stressRequirements: ["能在多需求并行中保持判断", "能平衡范围与质量"],
      internshipRequirements: ["优先展示相关项目案例", "最好有量化结果"],
      certificates: ["产品项目作品集", "岗位相关案例材料"],
    },
    implementation: {
      roleFamily: "实施交付",
      learningRequirements: ["熟悉交付流程与问题排查方法", "补足客户场景理解能力"],
      communicationRequirements: ["能与客户和内部团队同步进度", "能清晰表达问题与处理结论"],
      stressRequirements: ["能承受交付节点压力", "能在多任务下保持推进节奏"],
      internshipRequirements: ["优先展示交付或支持案例", "最好有客户成功结果"],
      certificates: ["项目交付案例", "实施方法材料"],
    },
    operations: {
      roleFamily: "运营",
      learningRequirements: ["理解增长或运营核心指标", "补足活动与转化分析方法"],
      communicationRequirements: ["能与多团队协同推进活动", "能同步结果和优化建议"],
      stressRequirements: ["能适应高节奏业务推进", "能在结果压力下保持执行稳定"],
      internshipRequirements: ["优先展示增长或运营案例", "最好有数据提升结果"],
      certificates: ["运营项目案例", "数据分析证明"],
    },
    general: {
      roleFamily: "通用岗位",
      learningRequirements: ["补足目标岗位的核心方法论", "围绕岗位场景增加项目案例"],
      communicationRequirements: ["提升跨团队协同表达能力", "能清晰同步目标与风险"],
      stressRequirements: ["适应多任务并行与节奏变化", "在压力下保持执行稳定"],
      internshipRequirements: ["优先补充相关实习或项目", "最好有成果证明材料"],
      certificates: ["岗位相关作品集", "项目成果证明"],
    },
  }

  const preset = defaults[family] ?? defaults.general

  return {
    roleName: path.targetRole,
    roleFamily: preset.roleFamily,
    summary: path.reason,
    professionalSkills: bridgeSkills,
    certificates: preset.certificates,
    innovationPoints: [],
    learningRequirements: preset.learningRequirements,
    stressRequirements: preset.stressRequirements,
    communicationRequirements: preset.communicationRequirements,
    internshipRequirements: preset.internshipRequirements,
    representativeCompanies: [],
  }
}

function inferRoleFamily(title: string): string {
  const lower = title.toLowerCase()

  if (
    lower.includes("product") ||
    title.includes("产品") ||
    title.includes("平台") ||
    title.includes("增长")
  ) {
    return "product"
  }

  if (lower.includes("implement") || title.includes("实施") || title.includes("交付")) {
    return "implementation"
  }

  if (lower.includes("operat") || title.includes("运营")) {
    return "operations"
  }

  return "general"
}

function dedupeList(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)))
}
