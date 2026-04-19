import type {
  CareerProfileData,
  ProjectHighlight,
  ResumeOptimizationDraft,
  ResumeOptimizationField,
} from "@/lib/types"

export function buildResumeOptimizationFields(
  profile: CareerProfileData,
  projects: ProjectHighlight[],
  suggestedCertificates: string[] = [],
): ResumeOptimizationField[] {
  const profileSkills = dedupeTextList(profile.skills)
  const profileStrengths = dedupeTextList(profile.strengths)
  const profileCertificates = dedupeTextList(profile.certificates)
  const seenEvidence = new Set<string>()
  const fields: Array<ResumeOptimizationField | null> = [
    ...projects.map((project, index) => buildExperienceOptimizationField(project, index, profileSkills)),
    ...buildCertificateOptimizationFields(profileCertificates, suggestedCertificates),
    buildSkillUsageOptimizationField(profileSkills, projects),
    buildStrengthOptimizationField(profileStrengths, projects),
  ]

  return fields
    .filter((field): field is ResumeOptimizationField => {
      if (!field) return false

      const normalizedEvidence = cleanOptimizationText(field.example)
      if (seenEvidence.has(normalizedEvidence)) return false

      seenEvidence.add(normalizedEvidence)
      return true
    })
    .slice(0, 8)
}

function cleanOptimizationText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function dedupeTextList(values: string[]) {
  return Array.from(new Set(values.map(cleanOptimizationText).filter(Boolean)))
}

function buildExperienceOptimizationField(
  project: ProjectHighlight,
  index: number,
  profileSkills: string[],
): ResumeOptimizationField | null {
  const title = cleanOptimizationText(project.title)
  const description = cleanOptimizationText(project.description)
  const tags = dedupeTextList(project.tags)
  const evidence = formatProjectEvidence(title, description, tags)
  const missingItems = getMissingExperienceItems(description, tags, profileSkills)

  if (!evidence || missingItems.length === 0) {
    return null
  }

  return {
    key: `experience-${index}-${slugifyKey(title || description)}`,
    label: `补充经历：${title || `经历 ${index + 1}`}`,
    hint: `这段经历已有内容可以保留，但还缺少${formatMissingItems(missingItems)}。请只补充这段经历，不需要重复填写其他经历。`,
    example: evidence,
  }
}

function formatProjectEvidence(title: string, description: string, tags: string[]) {
  const details = [
    shouldShowDescription(description) ? description : "",
    tags.length > 0 ? `关键词：${tags.join("、")}` : "",
  ]
    .filter(Boolean)
    .join("；")

  if (!title && !details) return ""
  if (!details) {
    return title
  }

  return title ? `${title}：${details}` : details
}

function getMissingExperienceItems(description: string, tags: string[], profileSkills: string[]) {
  const missingItems: string[] = []
  const usefulDescription = shouldShowDescription(description) ? description : ""
  const evidenceText = `${usefulDescription} ${tags.join(" ")}`

  if (!usefulDescription || usefulDescription.length < 36) {
    missingItems.push("业务背景和职责范围")
  }

  if (!hasActionSignal(evidenceText)) {
    missingItems.push("你亲自完成的动作")
  }

  if (!hasResultSignal(evidenceText)) {
    missingItems.push("量化结果或业务影响")
  }

  if (tags.length === 0 && profileSkills.length > 0) {
    missingItems.push("使用的工具、方法或技能")
  }

  return missingItems
}

function buildCertificateOptimizationFields(certificates: string[], suggestedCertificates: string[]) {
  const actualCertificateFields = certificates
    .map((certificate, index): ResumeOptimizationField | null => {
      const missingItems = getMissingCertificateItems(certificate)

      if (missingItems.length === 0) {
        return null
      }

      return {
        key: `certificate-${index}-${slugifyKey(certificate)}`,
        label: `补充证书：${certificate}`,
        hint: `这项证书或证明材料已在简历中出现，但还缺少${formatMissingItems(missingItems)}。如果它与目标岗位无关，可以不补；如果相关，请补全证明力。`,
        example: certificate,
      }
    })
    .filter((field): field is ResumeOptimizationField => Boolean(field))

  const certificateText = certificates.join(" ")
  const missingSuggestedCertificateFields = dedupeTextList(suggestedCertificates)
    .filter((certificate) => certificate && !certificateText.includes(certificate))
    .slice(0, 4)
    .map((certificate, index): ResumeOptimizationField => ({
      key: `suggested-certificate-${index}-${slugifyKey(certificate)}`,
      label: `补充证明材料：${certificate}`,
      hint: "这项证明材料是目标岗位可能看重的内容，但没有在简历中出现。如果你没有相关材料，可以不补；如果实际有，请补充获得时间、产出形式和能证明的能力。",
      example: "无",
    }))

  return [...actualCertificateFields, ...missingSuggestedCertificateFields]
}

function buildSkillUsageOptimizationField(
  skills: string[],
  projects: ProjectHighlight[],
): ResumeOptimizationField | null {
  const projectEvidenceText = projects
    .map((project) => [project.title, project.description, ...project.tags].join(" "))
    .join(" ")
  const ungroundedSkills = skills.filter((skill) => !projectEvidenceText.includes(skill)).slice(0, 8)

  if (ungroundedSkills.length === 0) {
    return null
  }

  return {
    key: "skill-usage-context",
    label: "补充技能使用场景",
    hint: "这些技能已从简历中识别出来，但还没有清晰落到具体经历里。请选择真正用过的技能，补充在哪段项目、任务或工作中使用，以及解决了什么问题。",
    example: ungroundedSkills.join("、"),
  }
}

function buildStrengthOptimizationField(
  strengths: string[],
  projects: ProjectHighlight[],
): ResumeOptimizationField | null {
  const evidenceText = projects.map((project) => `${project.title} ${project.description}`).join(" ")
  const unsupportedStrengths = strengths
    .filter((strength) => isIncompleteStrength(strength) && !evidenceText.includes(strength))
    .slice(0, 4)

  if (unsupportedStrengths.length === 0) {
    return null
  }

  return {
    key: "strength-proof",
    label: "补充优势证明",
    hint: "这些优势已经出现在简历画像里，但还缺少能支撑它们的具体场景。请补充对应经历、你的动作和结果，避免只停留在自我评价。",
    example: unsupportedStrengths.join("\n"),
  }
}

function getMissingCertificateItems(certificate: string) {
  const missingItems: string[] = []

  if (!hasDateSignal(certificate)) {
    missingItems.push("获得时间")
  }

  if (!hasIssuerSignal(certificate)) {
    missingItems.push("颁发机构或等级")
  }

  if (!hasProofValueSignal(certificate)) {
    missingItems.push("能证明的能力或适用方向")
  }

  return missingItems
}

function shouldShowDescription(value: string) {
  if (!value) return false

  return !/已从简历中识别到项目线索|已识别到工作职责|建议后续补充/.test(value)
}

function formatMissingItems(items: string[]) {
  if (items.length === 1) return items[0]

  const head = items.slice(0, -1).join("、")
  return `${head}和${items[items.length - 1]}`
}

function hasActionSignal(value: string) {
  return /负责|主导|参与|推动|设计|搭建|制定|协调|沟通|分析|调研|梳理|优化|开发|运营|执行|复盘|管理|落地|跟进|完成/.test(value)
}

function hasResultSignal(value: string) {
  return /(\d+(\.\d+)?%?)|提升|增长|降低|减少|缩短|完成|上线|交付|转化|留存|效率|成本|营收|收入|获客|复盘|闭环/.test(value)
}

function hasDateSignal(value: string) {
  return /(20\d{2}|19\d{2}|至今|目前|现在|\d+\s*(年|个月|月))/.test(value)
}

function hasIssuerSignal(value: string) {
  return /协会|机构|大学|学院|学校|公司|平台|官方|认证|证书|等级|高级|中级|初级|一级|二级|三级|PMP|NPDP|CET|CPA|ACCA|AWS|PMP/i.test(value)
}

function hasProofValueSignal(value: string) {
  return /证明|能力|方向|适用|掌握|熟悉|项目|课程|作品|训练|实操|实践|产品|数据|运营|开发|设计|分析/.test(value)
}

function isIncompleteStrength(value: string) {
  return value.length < 28 || (!hasActionSignal(value) && !hasResultSignal(value))
}

function slugifyKey(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized.slice(0, 32) || "item"
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
