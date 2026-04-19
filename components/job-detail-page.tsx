"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Award, BriefcaseBusiness, Compass, MapPin, Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { readJobDetailSnapshot } from "@/lib/job-detail-storage"
import type { JobDetailSnapshot, JobPortraitCard } from "@/lib/types"

interface JobDetailPageProps {
  jobId: string
}

export function JobDetailPage({ jobId }: JobDetailPageProps) {
  const [snapshot, setSnapshot] = useState<JobDetailSnapshot | null>(null)
  const router = useRouter()

  useEffect(() => {
    setSnapshot(readJobDetailSnapshot(jobId))
  }, [jobId])

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push("/")
  }

  const displayPortrait = useMemo(() => {
    if (!snapshot) return null

    const { job, portrait } = snapshot
    return portrait ?? buildFallbackPortrait(job.title, job.tags, job.reason)
  }, [snapshot])

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>

          <Card className="mt-6 border-border/60">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-3xl font-semibold tracking-tight">暂未找到岗位详情</h1>
              <p className="text-muted-foreground">
                请从首页推荐岗位卡片点击“查看岗位详情”进入，这样系统才能携带目标岗位画像。
              </p>
              <p className="text-sm text-muted-foreground">
                如果你直接刷新或单独打开该地址，会因为没有会话快照而无法展示详情。
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!displayPortrait) {
    return null
  }

  const { job, reportTitle, candidateName } = snapshot

  return (
    <main className="min-h-screen bg-secondary/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
            >
              <ArrowLeft className="h-4 w-4" />
              返回推荐结果
            </button>
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">推荐岗位详情</p>
              <h1 className="text-4xl font-semibold tracking-tight">{job.title}</h1>
              <p className="text-lg text-muted-foreground">{job.company}</p>
            </div>
          </div>

          <Card className="min-w-[260px] border-primary/20 bg-card/90">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">匹配度</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {job.matchScore}%
                </span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {job.salary}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </p>
                <p className="flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  候选人：{candidateName || "当前候选人"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/60 bg-card/90">
            <CardHeader className="space-y-4">
              <div>
                <p className="text-sm font-medium text-primary">岗位画像</p>
                <CardTitle className="mt-2 text-2xl">{displayPortrait.roleName}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{displayPortrait.roleFamily}</p>
              </div>
              <p className="leading-8 text-muted-foreground">{displayPortrait.summary}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <DetailBlock title="核心技能" icon={Sparkles} items={displayPortrait.professionalSkills} />
              <DetailBlock
                title="证书与资质"
                icon={Award}
                items={displayPortrait.certificates}
                emptyLabel="可优先准备项目证明、课程证明或岗位相关材料"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <RequirementCard title="学习要求" items={displayPortrait.learningRequirements} />
                <RequirementCard title="沟通要求" items={displayPortrait.communicationRequirements} />
                <RequirementCard title="抗压要求" items={displayPortrait.stressRequirements} />
                <RequirementCard title="实践要求" items={displayPortrait.internshipRequirements} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">为什么推荐这个岗位</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-8 text-muted-foreground">{job.reason}</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">岗位标签</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <span
                    key={`${job.id}-${tag}-${index}`}
                    className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">报告来源</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{reportTitle}</p>
                <p>
                  该详情页用于集中展示目标岗位的岗位画像、关键技能要求与推荐理由，方便做岗位对比和职业决策。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function DetailBlock({
  title,
  icon: Icon,
  items,
  emptyLabel = "暂无数据",
}: {
  title: string
  icon: typeof Sparkles
  items: string[]
  emptyLabel?: string
}) {
  const renderedItems = items.length > 0 ? items : [emptyLabel]

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium text-primary">
        <Icon className="h-4 w-4" />
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {renderedItems.map((item, index) => (
          <span
            key={`${title}-${item}-${index}`}
            className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function RequirementCard({ title, items }: { title: string; items: string[] }) {
  const renderedItems = items.length > 0 ? items : ["暂无明确要求"]

  return (
    <div className="rounded-2xl bg-secondary/40 p-5">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        {renderedItems.map((item, index) => (
          <p key={`${title}-${item}-${index}`}>{item}</p>
        ))}
      </div>
    </div>
  )
}

function buildFallbackPortrait(roleName: string, tags: string[], reason: string): JobPortraitCard {
  const family = inferRoleFamily(roleName)
  const skills = dedupeList(tags).slice(0, 6)

  const defaults: Record<
    string,
    {
      summary: string
      learningRequirements: string[]
      communicationRequirements: string[]
      stressRequirements: string[]
      internshipRequirements: string[]
      certificates: string[]
    }
  > = {
    product: {
      summary:
        `${roleName}更看重需求拆解、平台规划与跨团队协同能力，通常需要候选人能够围绕业务目标做抽象设计，并稳定推动方案落地。`,
      learningRequirements: [
        "持续学习平台型产品的方法论、系统设计思维和业务抽象能力。",
        "结合真实业务场景补足需求分析、产品方案设计与迭代复盘能力。",
      ],
      communicationRequirements: [
        "能够在研发、运营、业务之间清晰同步目标、范围与推进节奏。",
        "能够将复杂需求拆成阶段任务，并推进多方形成一致决策。",
      ],
      stressRequirements: [
        "能在多需求并行、优先级频繁变化时保持判断稳定。",
        "面对跨部门反馈和版本压力时，能够稳住节奏并推动闭环。",
      ],
      internshipRequirements: [
        "产品实习、平台项目、校园项目或竞赛经历都可以作为有效证明。",
        "建议补充能体现业务抽象、方案设计与落地结果的项目案例。",
      ],
      certificates: ["项目成果证明", "产品方案材料"],
    },
    implementation: {
      summary:
        `${roleName}更看重客户沟通、实施交付与问题处理能力，通常需要候选人围绕交付场景稳定完成支持、排查和培训工作。`,
      learningRequirements: [
        "持续学习实施流程、交付方法和常见问题排查思路。",
        "结合交付场景补足演示、培训与远程支持能力。",
      ],
      communicationRequirements: [
        "能够与客户、内部团队同步实施进度、风险与处理结果。",
        "能把复杂问题拆解成清晰步骤并推动闭环解决。",
      ],
      stressRequirements: [
        "能够在现场支持、交付节点和多任务并行时保持稳定执行。",
        "面对临时需求、客户反馈和问题升级时能快速响应。",
      ],
      internshipRequirements: [
        "实施、技术支持、客户服务类实习经历都可以作为证明。",
        "建议补充培训、演示、排查或交付相关案例。",
      ],
      certificates: ["交付案例证明", "工具熟练证明"],
    },
    testing: {
      summary:
        `${roleName}更看重测试思维、问题发现与质量闭环能力，通常需要候选人围绕验证场景稳定开展测试设计、执行与缺陷跟踪。`,
      learningRequirements: [
        "持续学习测试方法、用例设计和质量标准。",
        "结合真实场景补足功能验证、缺陷分析与回归测试经验。",
      ],
      communicationRequirements: [
        "能够把问题现象、复现步骤与影响范围表达清楚。",
        "能与研发、产品协同推动缺陷修复与质量闭环。",
      ],
      stressRequirements: [
        "需要在回归高峰期保持细致验证与优先级判断。",
        "面对缺陷堆积和时间压力时能保证测试闭环。",
      ],
      internshipRequirements: [
        "测试实习、课程验证项目或竞赛经历都可以作为证明。",
        "建议补充用例设计、缺陷跟踪或回归验证案例。",
      ],
      certificates: ["测试案例证明", "质量闭环材料"],
    },
    operations: {
      summary:
        `${roleName}更看重执行稳定性、数据意识与结果优化能力，通常需要候选人围绕业务目标推进活动、流程和增长闭环。`,
      learningRequirements: [
        "持续学习数据分析、运营节奏和业务复盘方法。",
        "结合业务目标补足活动执行、内容优化或转化提升经验。",
      ],
      communicationRequirements: [
        "能够与上下游团队保持顺畅协同，及时同步执行情况。",
        "能够围绕目标拆分动作并协调资源推动结果落地。",
      ],
      stressRequirements: [
        "能够在任务密集和结果压力下保持执行稳定。",
        "面对多条业务线并行时能做好节奏管理与优先级判断。",
      ],
      internshipRequirements: [
        "运营实习、社团项目、内容活动或数据分析实践都可作为证明。",
        "建议补充转化、活跃、增长或复盘类案例。",
      ],
      certificates: ["数据分析证明", "运营项目材料"],
    },
  }

  const fallback = defaults[family] ?? {
    summary:
      `${roleName}通常需要候选人具备稳定的通用岗位能力，并能在真实业务场景中完成协作、执行与结果闭环。`,
    learningRequirements: [
      "持续学习目标岗位常用工具、方法和业务场景知识。",
      "围绕岗位要求补足高频技能，并形成周期性的学习与复盘计划。",
    ],
    communicationRequirements: [
      "能够清晰表达任务进度、问题与解决方案。",
      "能够在跨团队协作中保持顺畅配合和有效反馈。",
    ],
    stressRequirements: [
      "能在多任务并行与节奏变化中保持稳定执行。",
      "面对临时需求和反馈调整时能够快速适应。",
    ],
    internshipRequirements: [
      "实习、校园项目、竞赛或课程实践都可以形成加分证明。",
      "建议补充能体现岗位相关能力的项目案例与量化结果。",
    ],
    certificates: ["项目证明材料", "工具熟练证明"],
  }

  return {
    jobId: "",
    roleName,
    roleFamily: formatRoleFamilyLabel(family),
    summary: reason ? `${fallback.summary} ${reason}` : fallback.summary,
    professionalSkills: skills.length > 0 ? skills : ["沟通协作", "问题分析", "执行落地"],
    certificates: fallback.certificates,
    innovationPoints: [],
    learningRequirements: fallback.learningRequirements,
    stressRequirements: fallback.stressRequirements,
    communicationRequirements: fallback.communicationRequirements,
    internshipRequirements: fallback.internshipRequirements,
    representativeCompanies: [],
  }
}

function inferRoleFamily(title: string) {
  const lower = title.toLowerCase()
  if (lower.includes("platform") || title.includes("平台") || title.includes("产品")) return "product"
  if (lower.includes("implement") || title.includes("实施") || title.includes("交付")) return "implementation"
  if (lower.includes("test") || title.includes("测试") || title.includes("质量")) return "testing"
  if (lower.includes("operat") || title.includes("运营")) return "operations"
  return "general"
}

function formatRoleFamilyLabel(family: string) {
  const mapping: Record<string, string> = {
    product: "产品方向",
    implementation: "实施交付",
    testing: "测试质控",
    operations: "运营方向",
    general: "通用岗位",
  }

  return mapping[family] || "岗位画像"
}

function dedupeList(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}
