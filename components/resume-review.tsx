"use client"

import { AlertTriangle, CircleCheckBig, FileBadge2, PencilRuler, ScrollText } from "lucide-react"

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

  return (
    <section className="py-14 lg:py-20" id="resume-review">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium text-primary">简历初筛反馈</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">先看简历还缺什么，再进入能力画像</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            系统会先把简历拆成基础信息、项目证据、技能标签和岗位表达，再告诉同学当前还缺哪些关键信息，方便继续补充与润色。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileBadge2 className="h-5 w-5 text-primary" />
                当前简历快照
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {resumeFacts.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-4">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-3 text-lg font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">简历完整度</p>
                    <p className="mt-2 text-3xl font-semibold">{report.completionRate} 分</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {report.completionRate >= 85 ? "信息较完整" : report.completionRate >= 70 ? "仍可补强" : "需要重点完善"}
                  </div>
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-secondary">
                  <div
                    className="h-2.5 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(8, Math.min(report.completionRate, 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">已识别到的关键信息</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.slice(0, 10).map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-sm text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <FeedbackCard
              title="当前亮点"
              icon={CircleCheckBig}
              tone="positive"
              items={highlights}
              emptyLabel="系统暂未提炼出明显亮点，建议补充量化成果与项目证据。"
            />
            <FeedbackCard
              title="信息缺口"
              icon={AlertTriangle}
              tone="warning"
              items={gaps}
              emptyLabel="当前简历结构较完整，可重点继续优化表达质量。"
            />
            <FeedbackCard
              title="建议补充内容"
              icon={PencilRuler}
              tone="neutral"
              items={suggestions}
              emptyLabel="可以继续补充更贴近目标岗位的项目案例、职责拆解与结果指标。"
            />
          </div>
        </div>

        <Card className="mt-6 border-border/60 bg-card/90">
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
      ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-700"
      : tone === "warning"
        ? "border-amber-500/15 bg-amber-500/5 text-amber-700"
        : "border-primary/15 bg-primary/5 text-primary"

  const rendered = items.length > 0 ? items : [emptyLabel]

  return (
    <Card className={`border-border/60 ${palette}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rendered.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-2xl bg-background/80 px-4 py-3 text-sm leading-7 text-foreground">
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
    { label: "工作经验", value: years },
  ]
}

function buildHighlights(profile: CareerProfileData, projects: ProjectHighlight[]) {
  const items = [...profile.strengths]

  if (projects.length > 0) {
    items.push(`已识别 ${projects.length} 段项目或实践证据，可继续往量化成果方向深化。`)
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

  items.push(`在简历开头增加清晰的求职方向说明，突出你想申请的“${profile.suggestedDirection}”岗位。`)

  return dedupe(items).slice(0, 6)
}

function buildTemplateFields(profile: CareerProfileData, projects: ProjectHighlight[]): ResumeTemplateField[] {
  const targetRole = profile.suggestedDirection || "目标岗位"
  const topSkill = profile.skills[0] || "核心工具"
  const scenario = projects[0]?.title || "某个项目/实习场景"

  return [
    {
      label: "项目背景",
      hint: "说明项目服务的业务场景、你所在的团队、你承担的任务，不要只写项目名称。",
      example: `在 ${scenario} 中，我作为${targetRole}相关负责人之一，负责围绕业务目标推进需求分析与方案落地。`,
    },
    {
      label: "你的动作",
      hint: "写清你做了什么，而不是团队做了什么，建议用“调研、设计、推进、协同、复盘”等动词开头。",
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
      example: `使用 ${profile.skills.slice(0, 3).join("、") || "相关工具"} 完成资料整理、方案输出与跨团队协同。`,
    },
    {
      label: "业务价值",
      hint: "说明这段经历对业务、用户或团队带来了什么价值，避免只写执行过程。",
      example: `这段经历证明我不仅能完成执行任务，还能从业务目标出发，为 ${targetRole} 岗位提供可迁移的项目证据。`,
    },
  ]
}

function findCardValue(profile: CareerProfileData, keyword: string) {
  return profile.cards.find((item) => item.label.includes(keyword))?.value || ""
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}
