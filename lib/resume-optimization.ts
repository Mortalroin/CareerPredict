import type {
  CareerProfileData,
  ProjectHighlight,
  ResumeOptimizationDraft,
  ResumeOptimizationField,
} from "@/lib/types"

export function buildResumeOptimizationFields(
  profile: CareerProfileData,
  projects: ProjectHighlight[],
): ResumeOptimizationField[] {
  const targetRole = profile.suggestedDirection || "目标岗位"
  const topSkill = profile.skills[0] || "核心工具"
  const scenario = projects[0]?.title || "某个项目 / 实习场景"
  const tools = profile.skills.slice(0, 3).join("、") || "相关工具"

  return [
    {
      key: "projectContext",
      label: "项目背景",
      hint: "说明项目服务的业务场景、你所在的团队以及你承担的职责，不要只写项目名称。",
      example: `在 ${scenario} 中，我作为与 ${targetRole} 相关的核心参与者之一，负责围绕业务目标推进需求分析与方案落地。`,
    },
    {
      key: "yourAction",
      label: "你的动作",
      hint: "写清你亲自做了什么，而不是团队做了什么，建议用“调研、设计、推进、协调、复盘”等动词开头。",
      example: `我独立完成需求梳理、跨团队沟通和执行跟进，并主导使用 ${topSkill} 相关方法推动任务闭环。`,
    },
    {
      key: "quantifiedResult",
      label: "量化结果",
      hint: "尽量给出数据结果，比如效率提升、转化提升、交付周期缩短、问题关闭率等。",
      example: "最终推动关键任务按期上线，提升协作效率或业务结果，并形成可复用的方法与流程。",
    },
    {
      key: "toolsUsed",
      label: "使用工具",
      hint: "写出具体工具、平台、方法论、协作软件或分析方式，帮助企业快速判断你的上手能力。",
      example: `使用 ${tools} 完成资料整理、方案输出与跨团队协同。`,
    },
    {
      key: "businessValue",
      label: "业务价值",
      hint: "说明这段经历对业务、用户或团队带来了什么价值，避免只写执行过程。",
      example: `这段经历证明我不仅能完成执行任务，还能从业务目标出发，为 ${targetRole} 岗位提供可迁移的项目证据。`,
    },
  ]
}

export function syncResumeOptimizationDrafts(
  fields: ResumeOptimizationField[],
  drafts: ResumeOptimizationDraft,
): ResumeOptimizationDraft {
  return fields.reduce<ResumeOptimizationDraft>((accumulator, field) => {
    accumulator[field.key] = drafts[field.key] || ""
    return accumulator
  }, {})
}

export function countFilledResumeOptimizationDrafts(drafts: ResumeOptimizationDraft): number {
  return Object.values(drafts).filter((value) => value.trim().length > 0).length
}

export function buildResumeOptimizationNotes(
  fields: ResumeOptimizationField[],
  drafts: ResumeOptimizationDraft,
): string {
  const lines = fields
    .map((field) => {
      const value = drafts[field.key]?.trim()
      if (!value) {
        return ""
      }

      return `${field.label}：${value}`
    })
    .filter(Boolean)

  if (lines.length === 0) {
    return ""
  }

  return ["继续优化补充信息：", ...lines].join("\n")
}

export function mergeResumeNotes(
  notes: string,
  fields: ResumeOptimizationField[],
  drafts: ResumeOptimizationDraft,
): string {
  return [notes.trim(), buildResumeOptimizationNotes(fields, drafts)].filter(Boolean).join("\n\n")
}
