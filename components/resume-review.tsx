"use client"

import { AlertTriangle, CircleCheckBig, FileBadge2, FolderKanban, PencilRuler, ScrollText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CapabilityScoreCard, CareerProfileData, ProjectHighlight, ReportSummary } from "@/lib/types"

interface ResumeReviewProps {
  profile: CareerProfileData
  projects: ProjectHighlight[]
  capabilityScores: CapabilityScoreCard[]
  report: ReportSummary
}

interface ResumeTemplateField {
  label: string
  hint: string
  example: string
}

export function ResumeReview({ profile, projects, capabilityScores, report }: ResumeReviewProps) {
  const resumeFacts = buildResumeFacts(profile)
  const highlights = buildHighlights(profile, projects)
  const gaps = buildGaps(profile, projects, capabilityScores, report)
  const suggestions = buildSuggestions(profile, projects, capabilityScores, report)
  const templateFields = buildTemplateFields(profile, projects)
  const completionStatus = getCompletionStatus(report.completionRate)
  const displayedSkills = profile.skills.slice(0, 10)
  const projectEvidence = projects.slice(0, 3)
  const priorityItems = dedupe([...suggestions.slice(0, 2), ...gaps.slice(0, 2), ...highlights.slice(0, 1)]).slice(0, 3)

  function handleOptimize() {
    if (typeof document === "undefined") {
      return
    }

    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section className="py-14 lg:py-20" id="resume-review">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <Card className="border-border/60 bg-card/95 shadow-lg shadow-primary/5">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileBadge2 className="h-5 w-5" />
                  </span>
                  当前简历快照
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground lg:text-lg">
                  先看系统已经识别到的核心信息，再决定应该补哪些经历、成果和关键词，避免后面的能力分析失焦。
                </p>
              </div>

              <div className="w-full rounded-3xl border border-border/60 bg-secondary/25 p-5 lg:max-w-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">简历完整度</p>
                    <p className="mt-2 text-3xl font-semibold">{report.completionRate} 分</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${completionStatus.className}`}>
                    {completionStatus.label}
                  </span>
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-background/80">
                  <div
                    className={`h-2.5 rounded-full transition-all ${completionStatus.barClassName}`}
                    style={{ width: `${Math.max(8, Math.min(report.completionRate, 100))}%` }}
                  />
                </div>
                <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                  {suggestions.slice(0, 2).map((item, index) => (
                    <p key={`quick-tip-${index}`}>{item}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {resumeFacts.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-4">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-border/60 bg-background/75 p-5">
              <p className="text-sm font-medium text-foreground">已识别到的关键信息</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {displayedSkills.length > 0 ? (
                  displayedSkills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1.5 text-sm text-foreground"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">暂未识别到明确技能标签，建议补充工具、方法和项目关键词。</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.08fr]">
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  项目与实践
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectEvidence.length > 0 ? (
                  projectEvidence.map((project, index) => (
                    <div key={`${project.title}-${index}`} className="rounded-3xl border border-border/60 bg-secondary/15 p-4">
                      <p className="text-base font-semibold">{project.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{project.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.tags.length > 0 ? (
                          project.tags.map((tag) => (
                            <span
                              key={`${project.title}-${tag}`}
                              className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm text-foreground"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-dashed border-border/60 px-3 py-1 text-sm text-muted-foreground">
                            建议继续补充关键词
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-secondary/10 p-5 text-sm leading-7 text-muted-foreground">
                    当前还没有足够清晰的项目或实践证据，建议补充 1-2 段与目标岗位相关的项目、实习或校园实践经历。
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <FeedbackCard
                title="当前亮点"
                icon={CircleCheckBig}
                tone="positive"
                items={highlights}
                emptyLabel="系统暂未提炼出明显亮点，建议补充可量化成果和项目证据。"
              />
              <FeedbackCard
                title="信息缺口"
                icon={AlertTriangle}
                tone="warning"
                items={gaps}
                emptyLabel="当前简历结构较完整，可以继续优化表达质量。"
              />
            </div>
          </div>

          <Card className="flex h-full flex-col border-border/60 bg-card/95 shadow-lg shadow-primary/5">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <PencilRuler className="h-5 w-5 text-primary" />
                建议补充内容
              </CardTitle>
              <p className="text-sm leading-7 text-muted-foreground">
                这一栏优先给你可直接动手改的内容，尽量把每一条都改成能落到简历里的真实材料。
              </p>
            </CardHeader>
            <CardContent className="flex h-full flex-col gap-4">
              {suggestions.length > 0 ? (
                suggestions.map((item, index) => (
                  <div key={`suggestion-${index}`} className="rounded-3xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-sm leading-7 text-foreground">{item}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border/60 bg-secondary/10 p-5 text-sm leading-7 text-muted-foreground">
                  可以继续补充更贴近目标岗位的项目案例、职责拆解和结果指标。
                </div>
              )}

              <div className="rounded-3xl border border-border/60 bg-secondary/20 p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  一键优化建议
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  如果你准备继续优化简历，可以回到上传与分析区，重新调整目标岗位和补充说明，再生成一版更贴近目标岗位的新报告。
                </p>
                <Button type="button" className="mt-4 rounded-full" onClick={handleOptimize}>
                  一键优化简历
                </Button>
              </div>
              <div className="mt-auto rounded-3xl border border-border/60 bg-background/80 p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {priorityItems.map((item, index) => (
                    <div key={`priority-${index}`} className="rounded-2xl border border-border/60 bg-secondary/10 p-4">
                      <p className="text-xs font-medium tracking-[0.18em] text-primary/80">优先项 {index + 1}</p>
                      <p className="mt-3 text-sm leading-7 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ScrollText className="h-5 w-5 text-primary" />
              建议补充到简历里的具体字段模板
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {templateFields.map((field) => (
              <div key={field.label} className="rounded-3xl border border-border/60 bg-secondary/20 p-5">
                <p className="text-base font-semibold">{field.label}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{field.hint}</p>
                <div className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm leading-7 text-foreground">
                  <span className="font-medium text-primary">示例：</span>
                  {field.example}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function FeedbackCard({
  title,
  icon: Icon,
  tone,
  items,
  emptyLabel,
}: {
  title: string
  icon: typeof CircleCheckBig
  tone: "positive" | "warning" | "neutral"
  items: string[]
  emptyLabel: string
}) {
  const palette =
    tone === "positive"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : tone === "warning"
        ? "border-amber-500/20 bg-amber-500/5"
        : "border-primary/20 bg-primary/5"

  const iconColor =
    tone === "positive" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-primary"

  const rendered = items.length > 0 ? items : [emptyLabel]

  return (
    <Card className={`border-border/60 ${palette}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rendered.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-2xl bg-background/85 px-4 py-3 text-sm leading-7 text-foreground">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function buildResumeFacts(profile: CareerProfileData) {
  const city = findCardValue(profile, "城市") || "待补充"
  const degree = findCardValue(profile, "学历") || "待补充"
  const years = findCardValue(profile, "年限") || "待补充"

  return [
    { label: "目标方向", value: profile.suggestedDirection || "待明确" },
    { label: "当前城市", value: city },
    { label: "学历层次", value: degree },
    { label: "工作年限", value: years },
  ]
}

function buildHighlights(profile: CareerProfileData, projects: ProjectHighlight[]) {
  const items = [...profile.strengths]

  if (projects.length > 0) {
    items.push(`已识别 ${projects.length} 段项目或实践证据，可以继续往量化成果方向深化。`)
  }

  if (profile.certificates.length > 0) {
    items.push(`已包含 ${profile.certificates.length} 项证书或资质信息，可作为投递加分项。`)
  }

  if (profile.skills.length >= 5) {
    items.push("核心技能展示较完整，已经具备初步岗位匹配基础。")
  }

  return dedupe(items).slice(0, 5)
}

function buildGaps(
  profile: CareerProfileData,
  projects: ProjectHighlight[],
  capabilityScores: CapabilityScoreCard[],
  report: ReportSummary,
) {
  const items = capabilityScores.flatMap((item) => item.gapItems)

  if (projects.length === 0) {
    items.push("缺少清晰的项目、实习或校园实践经历，难以支撑能力证明。")
  }

  if (profile.certificates.length === 0) {
    items.push("证书、竞赛、培训或课程成果信息较少，建议补充可验证材料。")
  }

  if (profile.skills.length < 4) {
    items.push("专业技能展示偏少，建议补充工具、方法和业务场景关键词。")
  }

  if (report.completionRate < 70) {
    items.push("当前简历完整度偏低，仍有多处关键信息尚未补齐。")
  }

  return dedupe(items).slice(0, 6)
}

function buildSuggestions(
  profile: CareerProfileData,
  projects: ProjectHighlight[],
  capabilityScores: CapabilityScoreCard[],
  report: ReportSummary,
) {
  const items = [...report.editTips]

  if (projects.length === 0) {
    items.push("补充 1-2 段与目标岗位相关的项目、实习或校园实践，写清背景、动作与结果。")
  } else {
    items.push("把已有项目经历改写成“任务背景-关键动作-量化结果”的结构，增强说服力。")
  }

  if (profile.certificates.length === 0) {
    items.push("增加证书、竞赛、课程项目、培训结业证明等可验证材料。")
  }

  if (profile.skills.length < 6) {
    items.push("围绕目标岗位补充核心技能关键词，如工具、方法、业务场景和协作方式。")
  }

  const hasSoftGap = capabilityScores.some((item) => item.dimension === "职业素养" && item.gapItems.length > 0)
  if (hasSoftGap) {
    items.push("补充能体现沟通协作、推进落地、抗压处理问题的案例描述。")
  }

  items.push(`在简历开头增加清晰的求职方向说明，突出你想申请的“${profile.suggestedDirection || "目标岗位"}”岗位。`)

  return dedupe(items).slice(0, 6)
}

function buildTemplateFields(profile: CareerProfileData, projects: ProjectHighlight[]): ResumeTemplateField[] {
  const targetRole = profile.suggestedDirection || "目标岗位"
  const topSkill = profile.skills[0] || "核心工具"
  const scenario = projects[0]?.title || "某个项目 / 实习场景"
  const tools = profile.skills.slice(0, 3).join("、") || "相关工具"

  return [
    {
      label: "项目背景",
      hint: "说明项目服务的业务场景、你所在的团队、你承担的任务，不要只写项目名称。",
      example: `在 ${scenario} 中，我作为 ${targetRole} 相关负责人之一，负责围绕业务目标推进需求分析与方案落地。`,
    },
    {
      label: "你的动作",
      hint: "写清你做了什么，而不是团队做了什么，建议用“调研、设计、推进、协调、复盘”等动词开头。",
      example: `我独立完成需求梳理、跨团队沟通和执行跟进，并主导使用 ${topSkill} 相关方法推进任务闭环。`,
    },
    {
      label: "量化结果",
      hint: "尽量写出数据结果，比如效率提升、转化提升、交付周期缩短、问题关闭率等。",
      example: "最终推动关键任务按期上线，提升协作效率或业务结果，并形成可复用的方法与流程。",
    },
    {
      label: "使用工具",
      hint: "写出具体工具、平台、方法论、协作软件或分析方式，帮助企业快速判断你的上手能力。",
      example: `使用 ${tools} 完成资料整理、方案输出与跨团队协同。`,
    },
    {
      label: "业务价值",
      hint: "说明这段经历对业务、用户或团队带来了什么价值，避免只写执行过程。",
      example: `这段经历证明我不仅能完成执行任务，还能从业务目标出发，为 ${targetRole} 岗位提供可迁移的项目证据。`,
    },
  ]
}

function getCompletionStatus(score: number) {
  if (score >= 85) {
    return {
      label: "信息较完整",
      className: "bg-emerald-500/15 text-emerald-700",
      barClassName: "bg-emerald-500",
    }
  }

  if (score >= 70) {
    return {
      label: "仍可补强",
      className: "bg-amber-500/15 text-amber-700",
      barClassName: "bg-amber-500",
    }
  }

  return {
    label: "需要重点完善",
    className: "bg-rose-500/15 text-rose-700",
    barClassName: "bg-rose-500",
  }
}

function findCardValue(profile: CareerProfileData, keyword: string) {
  return profile.cards.find((item) => item.label.includes(keyword))?.value || ""
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}
