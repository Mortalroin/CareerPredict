"use client"

import {
  AlertTriangle,
  CircleCheckBig,
  FileBadge2,
  FolderKanban,
  PencilRuler,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  CapabilityScoreCard,
  CareerProfileData,
  ProjectHighlight,
  ReportSummary,
  ResumeOptimizationField,
} from "@/lib/types"

interface ResumeReviewProps {
  profile: CareerProfileData
  projects: ProjectHighlight[]
  capabilityScores: CapabilityScoreCard[]
  report: ReportSummary
  templateFields: ResumeOptimizationField[]
  onContinueOptimize: () => void
}

interface SkillGroup {
  label: string
  items: string[]
  emptyLabel: string
}

export function ResumeReview({
  profile,
  projects,
  capabilityScores,
  report,
  templateFields,
  onContinueOptimize,
}: ResumeReviewProps) {
  const resumeFacts = buildResumeFacts(profile)
  const highlights = buildHighlights(profile, projects)
  const gaps = buildGaps(profile, projects, capabilityScores, report)
  const suggestions = buildSuggestions(profile, projects, capabilityScores, report)
  const completionStatus = getCompletionStatus(report.completionRate)
  const displayedSkills = profile.skills.slice(0, 12)
  const groupedSkills = buildSkillGroups(displayedSkills)
  const projectEvidence = projects.slice(0, 3)
  const priorityItems = dedupe([...gaps.slice(0, 2), ...suggestions.slice(0, 2), ...highlights.slice(0, 1)]).slice(0, 3)

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
                  梳理关键履历信息，判断简历缺口，并给出可以直接动手修改的方向。
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

                <div className="mt-4 rounded-2xl border border-border/60 bg-background/85 p-4">
                  <p className="text-sm font-medium text-foreground">当前判断</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{completionStatus.summary}</p>
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

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-border/60 bg-background/75 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">已识别到的关键信息</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      按类型查看系统提取到的技能、工具、经验和语言信息，方便判断哪些内容已经写清楚。
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    共 {displayedSkills.length || 0} 项
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {groupedSkills.map((group) => (
                    <div key={group.label} className="rounded-2xl border border-border/60 bg-secondary/10 p-4">
                      <p className="text-sm font-medium text-foreground">{group.label}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.items.length > 0 ? (
                          group.items.map((item) => (
                            <span
                              key={`${group.label}-${item}`}
                              className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm text-foreground"
                            >
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">{group.emptyLabel}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/75 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">优先补充顺序</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      先处理最影响匹配度的内容，再处理表达优化，修改效率会更高。
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {priorityItems.map((item, index) => {
                    const palette = getPriorityPalette(index)
                    const title = index === 0 ? "项目证据" : index === 1 ? "岗位表达" : "说服材料"

                    return (
                      <div
                        key={`priority-${index}`}
                        className={`flex gap-4 rounded-2xl border p-4 ${palette.container}`}
                      >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${palette.badge}`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{title}</p>
                          <p className="mt-1 text-sm leading-7 text-muted-foreground">{item}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.08fr]">
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

          <Card className="border-border/60 bg-card/95 shadow-lg shadow-primary/5 xl:sticky xl:top-24">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <PencilRuler className="h-5 w-5 text-primary" />
                建议补充内容
              </CardTitle>
              <p className="text-sm leading-7 text-muted-foreground">
                这一栏优先给你可直接动手修改的内容，尽量把每一条都落到简历里的真实材料上，而不是停留在空泛描述。
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Button type="button" className="mt-4 rounded-full" onClick={onContinueOptimize}>
                  返回上传区继续优化
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
    items.push(`已识别到 ${projects.length} 段项目或实践证据，可以继续往量化结果方向深化。`)
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
    items.push("专业技能展示偏少，建议补充工具、方法、业务场景和协作方式关键词。")
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
    items.push("把已有项目经历改写成“任务背景 - 关键动作 - 量化结果”的结构，增强说服力。")
  }

  if (profile.certificates.length === 0) {
    items.push("增加证书、竞赛、课程项目、培训结业证明等可验证材料。")
  }

  if (profile.skills.length < 6) {
    items.push("围绕目标岗位补充核心技能关键词，如工具、方法、业务场景和协作方式。")
  }

  const hasSoftGap = capabilityScores.some((item) => item.dimension === "职业素养" && item.gapItems.length > 0)
  if (hasSoftGap) {
    items.push("补充能体现沟通协作、推进落地和抗压处理问题的案例描述。")
  }

  items.push(`在简历开头增加清晰的求职方向说明，突出你想申请的“${profile.suggestedDirection || "目标岗位"}”。`)

  return dedupe(items).slice(0, 6)
}

function buildSkillGroups(skills: string[]): SkillGroup[] {
  const toolKeywords = ["excel", "word", "ppt", "powerpoint", "photoshop", "cad", "sql", "python", "java", "figma", "axure"]
  const languageKeywords = ["普通话", "英语", "日语", "粤语", "韩语", "mandarin", "english", "japanese", "cantonese"]
  const businessKeywords = ["客户服务", "报关", "外贸", "运营", "销售支持", "用户研究", "需求分析", "项目管理"]

  const groups: SkillGroup[] = [
    { label: "技能", items: [], emptyLabel: "建议补充专业能力关键词" },
    { label: "工具", items: [], emptyLabel: "建议补充常用工具与软件" },
    { label: "业务经验", items: [], emptyLabel: "建议补充业务场景与实践经验" },
    { label: "语言能力", items: [], emptyLabel: "建议补充语言或沟通能力信息" },
  ]

  skills.forEach((rawSkill) => {
    const skill = rawSkill.trim()
    const lowerSkill = skill.toLowerCase()

    if (toolKeywords.some((keyword) => lowerSkill.includes(keyword))) {
      groups[1].items.push(skill)
      return
    }

    if (languageKeywords.some((keyword) => lowerSkill.includes(keyword.toLowerCase()))) {
      groups[3].items.push(skill)
      return
    }

    if (businessKeywords.some((keyword) => skill.includes(keyword))) {
      groups[2].items.push(skill)
      return
    }

    groups[0].items.push(skill)
  })

  return groups.map((group) => ({ ...group, items: dedupe(group.items) }))
}

function getPriorityPalette(index: number) {
  if (index === 0) {
    return {
      container: "border-rose-200 bg-rose-50/80",
      badge: "bg-rose-100 text-rose-600",
    }
  }

  if (index === 1) {
    return {
      container: "border-amber-200 bg-amber-50/80",
      badge: "bg-amber-100 text-amber-600",
    }
  }

  return {
    container: "border-sky-200 bg-sky-50/80",
    badge: "bg-sky-100 text-sky-600",
  }
}

function getCompletionStatus(score: number) {
  if (score >= 85) {
    return {
      label: "信息较完整",
      className: "bg-emerald-500/15 text-emerald-700",
      barClassName: "bg-emerald-500",
      summary: "整体信息已经比较完整，接下来重点提升项目结果表达和岗位贴合度。",
    }
  }

  if (score >= 70) {
    return {
      label: "仍可补强",
      className: "bg-amber-500/15 text-amber-700",
      barClassName: "bg-amber-500",
      summary: "基础信息已经具备，但项目、成果或技能标签仍有继续补强空间。",
    }
  }

  return {
    label: "需要重点完善",
    className: "bg-rose-500/15 text-rose-700",
    barClassName: "bg-rose-500",
    summary: "当前简历仍缺少较多关键信息，建议先补齐项目、技能和目标方向表达。",
  }
}

function findCardValue(profile: CareerProfileData, keyword: string) {
  return profile.cards.find((item) => item.label.includes(keyword))?.value || ""
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}
