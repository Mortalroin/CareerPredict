import type {
  AnalysisRequestPayload,
  BackendActionPlanPhase,
  BackendCapabilityScore,
  BackendJobMatchItem,
  BackendResumeMatchResponse,
  CareerAnalysisResponse,
  GrowthStage,
  JobRecommendation,
  ProjectHighlight,
  RoadmapStep,
} from "@/lib/types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000"

function cleanText(value: string | undefined | null): string {
  if (!value) {
    return ""
  }

  return value
    .replace(/[\uFFFD]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s*-\s*/g, "-")
    .trim()
}

function hasChinese(value: string): boolean {
  return /[\u4e00-\u9fff]/.test(value)
}

function looksEnglishHeavy(value: string): boolean {
  const englishChars = (value.match(/[A-Za-z]/g) || []).length
  const chineseChars = (value.match(/[\u4e00-\u9fff]/g) || []).length
  return englishChars > chineseChars * 2 && englishChars > 18
}

function dedupeList(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => cleanText(item)).filter(Boolean)))
}

function formatDegreeLabel(value: string): string {
  const mapping: Record<string, string> = {
    bachelor: "本科",
    master: "硕士",
    phd: "博士",
    college: "大专",
    vocational: "职业教育",
    high_school: "高中",
  }

  return mapping[value] || cleanText(value) || "未知"
}

function formatDimensionLabel(value: string): string {
  const mapping: Record<string, string> = {
    basic_requirements: "基础要求",
    professional_skills: "职业技能",
    professional_literacy: "职业素养",
    growth_potential: "发展潜力",
  }

  return mapping[value] || cleanText(value)
}

function formatRoleFamily(value: string): string {
  const mapping: Record<string, string> = {
    product: "产品",
    implementation: "实施交付",
    operation: "运营",
    operations: "运营",
    testing: "测试质控",
    engineering: "研发工程",
    development: "研发工程",
    customer_service: "客户服务",
    sales: "销售商务",
    assistant: "助理支持",
    data_ai: "数据 / AI",
    general: "通用岗位",
  }

  return mapping[value] || cleanText(value) || "岗位族群"
}

function formatSkill(value: string): string {
  const raw = cleanText(value)
  if (!raw) {
    return ""
  }

  const normalized = raw.toLowerCase()
  const mapping: Record<string, string> = {
    cad: "CAD",
    excel: "Excel",
    word: "Word",
    ppt: "PPT",
    sql: "SQL",
    ai: "AI",
    llm: "LLM",
    rag: "RAG",
    photoshop: "Photoshop",
    figma: "Figma",
    english: "英语",
    japanese: "日语",
    mandarin: "普通话",
    cantonese: "粤语",
    customer_service: "客户服务",
    sales_support: "销售支持",
    foreign_trade: "外贸",
    operations: "运营",
  }

  return mapping[normalized] || raw
}

function normalizeTagLabel(value: string): string {
  const raw = cleanText(value)
  const normalized = raw.toLowerCase()
  const mapping: Record<string, string> = {
    customer_service: "客户服务",
    sales_support: "销售支持",
    foreign_trade: "外贸",
    operations: "运营",
    product: "产品",
    implementation: "实施交付",
    development: "研发工程",
    testing: "测试质控",
    operation: "运营",
    sales: "销售商务",
    english: "英语",
    japanese: "日语",
    mandarin: "普通话",
    cantonese: "粤语",
  }

  return mapping[normalized] || formatSkill(raw)
}

function normalizeProfileSummary(
  summary: string,
  name: string,
  degree: string,
  years: number,
  targetRole: string,
  currentCity: string,
  skills: string[],
): string {
  const cleaned = cleanText(summary)
  if (cleaned && hasChinese(cleaned) && !looksEnglishHeavy(cleaned)) {
    return cleaned
  }

  const skillText = skills.slice(0, 6).join("、") || "岗位相关技能"
  return `${name || "候选人"}目前具备约 ${years || 0} 年相关经历，学历层次为${degree}，目标岗位为${targetRole}。已识别出的核心技能包括${skillText}，当前所在城市为${currentCity || "未填写"}。`
}

function formatCapabilitySummary(dimension: string, summary: string): string {
  const cleaned = cleanText(summary)
  if (cleaned && hasChinese(cleaned) && !looksEnglishHeavy(cleaned)) {
    return cleaned
  }

  const fallback: Record<string, string> = {
    基础要求: "主要评估候选人在学历、经验、城市及语言等基础门槛上的满足程度。",
    职业技能: "主要对比简历中提取的技能、工具与岗位显性要求之间的契合程度。",
    职业素养: "结合语言表达、协作信号与经历内容，评估沟通、协作和抗压等职业素养。",
    发展潜力: "结合项目经历、技能广度和可迁移性，评估候选人的后续成长空间。",
  }

  return fallback[dimension] || "系统正在根据结构化信息评估该维度的匹配情况。"
}

function normalizeCapabilityItem(value: string): string {
  const cleaned = cleanText(value)
  const normalized = cleaned.toLowerCase().replace(/\s+/g, " ")
  const compact = normalized.replace(/\s*-\s*/g, "-")

  const mapping: Record<string, string> = {
    "degree gate passed": "学历门槛已满足",
    "experience gate passed": "经验门槛已满足",
    "city alignment exists": "存在城市匹配岗位",
    "language gate passed": "语言要求已满足",
    "target city differs from many openings": "目标城市与部分岗位所在地存在偏差",
    "soft-skill evidence is weak in the resume": "简历中对沟通协作等软素质的体现仍偏弱",
    "project evidence is missing": "缺少清晰的项目成果证据",
    "transferability to target roles is still weak": "与目标岗位之间的迁移证明还不够强",
    "cross-context communication evidence is limited": "跨场景沟通证据仍不够充分",
    "experience is below many job thresholds": "经验与部分岗位门槛仍有差距",
    "language requirements may need attention": "语言要求仍需重点关注",
  }

  if (mapping[normalized]) {
    return mapping[normalized]
  }

  if (mapping[compact]) {
    return mapping[compact]
  }

  if (normalized.startsWith("soft-skill evidence")) {
    return "简历中对沟通协作等软素质的体现仍偏弱"
  }

  if (normalized.startsWith("project evidence")) {
    return "项目经历证明仍可继续加强"
  }

  if (normalized.startsWith("transferability")) {
    return "转岗迁移能力仍需要更多案例支撑"
  }

  return normalizeTagLabel(cleaned)
}

function buildJobReason(match: BackendJobMatchItem): string {
  const reasons: string[] = []

  if (match.breakdown.skill_overlap.length > 0) {
    reasons.push(`技能匹配：${match.breakdown.skill_overlap.map(formatSkill).join("、")}`)
  }

  if (match.breakdown.degree_pass) {
    reasons.push("学历要求满足")
  }

  if (match.breakdown.experience_pass) {
    reasons.push("经验要求满足")
  }

  if (match.breakdown.city_pass) {
    reasons.push("城市偏好匹配")
  }

  if (match.breakdown.missing_required_skills.length > 0) {
    reasons.push(`仍需补强：${match.breakdown.missing_required_skills.map(formatSkill).join("、")}`)
  }

  if (reasons.length === 0) {
    reasons.push("系统基于整体简历语义和结构化条件给出匹配结果")
  }

  return reasons.join("；")
}

function buildRoadmap(targetRole: string): RoadmapStep[] {
  return [
    {
      id: 1,
      title: "完成简历解析",
      subtitle: "建立学生能力画像",
      description: "系统已将上传简历拆解为基础要求、技能标签与发展潜力信息。",
      timeframe: "当前",
      status: "done",
    },
    {
      id: 2,
      title: "锁定目标方向",
      subtitle: "明确优先求职岗位",
      description: `优先围绕 ${targetRole || "目标岗位"} 完成岗位研究，并识别当前最关键的差距项。`,
      timeframe: "本周",
      status: "current",
    },
    {
      id: 3,
      title: "补齐关键差距",
      subtitle: "提升高频能力要求",
      description: "聚焦岗位要求中出现频率较高的技能、证书与项目能力，分阶段补强。",
      timeframe: "未来 2-4 周",
      status: "next",
    },
    {
      id: 4,
      title: "进入投递冲刺",
      subtitle: "围绕目标岗位优化材料",
      description: "结合高匹配岗位定制简历、项目故事和面试话术，集中开展投递。",
      timeframe: "未来 1 个月",
      status: "next",
    },
  ]
}

function buildGrowth(targetRole: string): GrowthStage[] {
  return [
    {
      id: 1,
      role: "当前能力阶段",
      level: "现阶段",
      timeframe: "现在",
      salary: "以当前市场匹配度为准",
      focus: ["已完成简历解析", "已有技能基础", "已有项目经历"],
      current: true,
    },
    {
      id: 2,
      role: "目标方向准备期",
      level: "下一步",
      timeframe: "1-3 个月",
      salary: "取决于目标岗位",
      focus: [targetRole || "目标岗位", "技能补齐", "项目增强"],
    },
    {
      id: 3,
      role: "高匹配投递阶段",
      level: "进阶阶段",
      timeframe: "3-6 个月",
      salary: "更高匹配区间",
      focus: ["更高匹配度", "更强案例表达", "更清晰岗位定位"],
    },
  ]
}

function mapProjects(response: BackendResumeMatchResponse): ProjectHighlight[] {
  const projectItems = response.structured_resume.projects.map((project, index) => ({
    title: cleanText(project.name) || `项目经历 ${index + 1}`,
    description: cleanText(project.description) || "已从简历中识别到项目线索，建议后续补充更完整的目标、动作和结果。",
    tags: dedupeList(project.keywords.map(formatSkill)).slice(0, 5),
  }))

  if (projectItems.length > 0) {
    return projectItems
  }

  return response.structured_resume.work_experience.slice(0, 3).map((item, index) => ({
    title: `工作成果 ${index + 1}`,
    description: cleanText(item.responsibilities[0]) || "已识别到工作职责，建议补充量化结果与业务影响。",
    tags: dedupeList(item.keywords.map(formatSkill)).slice(0, 5),
  }))
}

function mapVerticalPathsToRoadmap(paths: BackendResumeMatchResponse["vertical_paths"]): RoadmapStep[] {
  const firstPath = paths[0]
  if (!firstPath) {
    return buildRoadmap("目标岗位")
  }

  return firstPath.nodes.map((node, index) => ({
    id: index + 1,
    title: cleanText(node.title) || `阶段 ${index + 1}`,
    subtitle: `${formatRoleFamily(firstPath.role_family)}发展路径`,
    description: `${cleanText(node.description)}。关键能力：${dedupeList(node.skills.map(formatSkill)).join(" / ") || "待补充"}`,
    timeframe: cleanText(node.stage) || `阶段 ${index + 1}`,
    status: index === 0 ? "done" : index === 1 ? "current" : "next",
  }))
}

function mapActionPlanToGrowth(actionPlan: BackendActionPlanPhase[], targetRole: string): GrowthStage[] {
  if (actionPlan.length === 0) {
    return buildGrowth(targetRole)
  }

  return actionPlan.map((item, index) => ({
    id: index + 1,
    role:
      item.phase === "short_term"
        ? "短期成长计划"
        : item.phase === "mid_term"
          ? "中期成长计划"
          : cleanText(item.phase),
    level: cleanText(item.timeline) || `阶段 ${index + 1}`,
    timeframe: cleanText(item.timeline) || `阶段 ${index + 1}`,
    salary: cleanText(item.goals[0]) || "阶段目标",
    focus: dedupeList([...item.goals, ...item.actions]).slice(0, 4),
    current: index === 0,
  }))
}

function mapCapabilityTrend(score: BackendCapabilityScore) {
  return {
    title: formatDimensionLabel(score.dimension),
    value: `${Math.round(score.score)} / 100`,
  }
}

function mapKnowledgeSkills(response: BackendResumeMatchResponse) {
  if (response.job_portraits.length > 0) {
    return response.job_portraits.slice(0, 4).map((portrait, index) => ({
      name: cleanText(portrait.role_name) || `岗位 ${index + 1}`,
      demand: Math.max(60, 94 - index * 8),
    }))
  }

  return response.capability_scores.slice(0, 4).map((score, index) => ({
    name: formatDimensionLabel(score.dimension),
    demand: Math.max(60, 92 - index * 7),
  }))
}

function buildPortraitSummary(roleName: string, roleFamily: string, skills: string[]): string {
  const core = skills.slice(0, 3).join("、") || "岗位核心能力"
  return `${roleName}属于${formatRoleFamily(roleFamily)}方向，通常要求候选人具备${core}等核心能力，并能够在真实业务场景中稳定完成工作闭环。`
}

function normalizePortraitSummary(summary: string, roleName: string, roleFamily: string, skills: string[]): string {
  const cleaned = cleanText(summary)
  if (!cleaned || looksEnglishHeavy(cleaned)) {
    return buildPortraitSummary(roleName, roleFamily, skills)
  }

  if (hasChinese(cleaned) && /focuses on|typically|rewards|candidate/i.test(cleaned)) {
    return buildPortraitSummary(roleName, roleFamily, skills)
  }

  return cleaned
}

function buildRequirementFallback(
  kind: "learning" | "communication" | "stress" | "internship",
  roleName: string,
  skills: string[],
): string[] {
  const topSkills = skills.slice(0, 2).join("、") || "岗位核心技能"

  const templates = {
    learning: [
      `持续学习 ${topSkills} 相关工具、方法与业务场景。`,
      `结合 ${roleName} 的典型任务，形成每周学习与复盘计划。`,
    ],
    communication: [
      "能够清晰同步进度、问题与风险，保持跨团队协作顺畅。",
      "遇到复杂问题时，能够拆解步骤并推动闭环。",
    ],
    stress: [
      "能够在多任务并行场景下保持稳定执行与优先级判断。",
      "面对临时需求或问题反馈时，能够快速响应并稳住节奏。",
    ],
    internship: [
      "具备实习、校园项目、竞赛或课程实践经历会更有优势。",
      `若缺少直接经验，建议通过 ${roleName} 相关项目补足证明材料。`,
    ],
  }

  return templates[kind]
}

function normalizeRequirementItems(
  items: string[],
  kind: "learning" | "communication" | "stress" | "internship",
  roleName: string,
  skills: string[],
): string[] {
  const cleaned = dedupeList(items).filter((item) => item.length >= 6 && hasChinese(item) && !looksEnglishHeavy(item))
  if (cleaned.length > 0) {
    return cleaned.slice(0, 3)
  }

  return buildRequirementFallback(kind, roleName, skills)
}

function normalizeCertificate(value: string): string {
  const cleaned = cleanText(value)
  const normalized = cleaned.toLowerCase()
  const mapping: Record<string, string> = {
    "project evidence": "项目成果证明",
    "tool proficiency proof": "工具熟练度证明",
    "delivery case": "交付案例证明",
    "communication proof": "沟通协作证明",
    "service case": "服务案例证明",
  }

  return mapping[normalized] || normalizeTagLabel(cleaned)
}

function normalizeTransitionReason(sourceRole: string, targetRole: string, reason: string, bridgeSkills: string[]): string {
  const cleaned = cleanText(reason)
  if (!cleaned || looksEnglishHeavy(cleaned)) {
    const skills = bridgeSkills.slice(0, 3).join("、") || "已有通用能力"
    return `${sourceRole} 与 ${targetRole} 在 ${skills} 等方面具备可迁移基础，通过补足少量岗位专项能力后，可以形成较自然的转岗路径。`
  }

  return cleaned
}

function normalizeTransitionActions(targetRole: string, actions: string[], bridgeSkills: string[]): string[] {
  const cleaned = dedupeList(actions).filter((item) => item.length >= 6 && hasChinese(item) && !looksEnglishHeavy(item))
  if (cleaned.length > 0) {
    return cleaned.slice(0, 3)
  }

  const topSkills = bridgeSkills.slice(0, 2).join("、") || "通用能力"
  return [
    `把已有经历改写成更贴近 ${targetRole} 的项目表达，突出 ${topSkills}。`,
    `补足 ${targetRole} 所需的专项技能与业务理解，形成岗位化案例。`,
    "准备 1-2 段能体现问题、行动与结果的面试故事，增强转岗说服力。",
  ]
}

function normalizeReportOverview(overview: string, targetRole: string): string {
  const cleaned = cleanText(overview)
  if (cleaned && hasChinese(cleaned) && !looksEnglishHeavy(cleaned)) {
    return cleaned
  }

  return `系统已围绕目标岗位“${targetRole}”完成简历解析、岗位匹配和职业规划分析。当前报告会重点呈现你的能力画像、岗位契合点、差距项以及下一阶段的提升建议。`
}

function normalizePathPlan(pathPlan: string, targetRole: string): string {
  const cleaned = cleanText(pathPlan)
  if (cleaned && hasChinese(cleaned) && !looksEnglishHeavy(cleaned)) {
    return cleaned
  }

  return `建议围绕 ${targetRole} 制定分阶段成长路径：先补足关键技能与项目案例，再逐步增强岗位表达、投递策略与面试说服力。`
}

function mapBackendResponse(
  response: BackendResumeMatchResponse,
  payload: AnalysisRequestPayload,
): CareerAnalysisResponse {
  const { structured_resume: resume, hard_conditions: hard, soft_conditions: soft, matches } = response
  const targetRole =
    hard.target_roles[0] || resume.job_intention.target_roles[0] || payload.targetRole || "综合方向"
  const targetCity = hard.target_cities[0] || resume.job_intention.target_city[0] || "未指定"
  const highestDegree = formatDegreeLabel(resume.derived.highest_degree_label)
  const yearsValue = resume.derived.total_years_experience || 0
  const years = `${yearsValue} 年`
  const skills = [...resume.derived.core_skills, ...soft.tool_skills].filter(Boolean).map(formatSkill)
  const uniqueSkills = dedupeList(skills).slice(0, 10)
  const strengths =
    resume.profile.strengths.length > 0
      ? dedupeList(resume.profile.strengths.map(normalizeTagLabel))
      : resume.derived.role_tags.length > 0
        ? dedupeList(resume.derived.role_tags.map(normalizeTagLabel))
        : ["已完成结构化简历解析", "可继续增强岗位与项目表达"]
  const certificates = dedupeList([
    ...resume.skills.certificates,
    ...response.job_portraits.flatMap((portrait) => portrait.certificates),
  ])
    .map(normalizeCertificate)
    .slice(0, 8)
  const projects = mapProjects(response)
  const jobs: JobRecommendation[] = matches.map((match) => ({
    id: match.job_id,
    title: cleanText(match.title),
    company: cleanText(match.company_name),
    matchScore: Math.round(match.total_score),
    salary: `综合得分 ${Math.round(match.total_score)}`,
    location: cleanText(match.city),
    tags: [
      ...match.breakdown.skill_overlap.map(formatSkill),
      ...(match.breakdown.city_pass ? ["城市匹配"] : []),
      ...(match.breakdown.degree_pass ? ["学历匹配"] : []),
    ].slice(0, 4),
    reason: buildJobReason(match),
  }))

  const topJob = jobs[0]
  const profileName = cleanText(resume.basics.name) || "候选人"
  const currentCity = cleanText(resume.basics.current_city) || "未填写"
  const highlights = [
    `目标岗位：${targetRole}`,
    `最高匹配岗位：${topJob ? `${topJob.title} - ${topJob.company}` : "暂无"}`,
    `识别工作经验：${years}`,
  ]

  return {
    profile: {
      name: profileName,
      headline: `${targetRole} 就业能力画像`,
      summary: normalizeProfileSummary(
        resume.profile.summary,
        profileName,
        highestDegree,
        yearsValue,
        targetRole,
        currentCity,
        uniqueSkills,
      ),
      cards: [
        { label: "当前城市", value: currentCity },
        { label: "学历层次", value: highestDegree },
        { label: "工作年限", value: years },
        { label: "完整度", value: `${Math.round(response.career_report.completeness_score)} 分` },
        { label: "竞争力", value: `${Math.round(response.career_report.competitiveness_score)} 分` },
        { label: "就绪度", value: `${Math.round(response.career_report.readiness_score)} 分` },
      ],
      skills: uniqueSkills.length > 0 ? uniqueSkills : ["暂未识别到技能关键词"],
      strengths,
      certificates,
      suggestedDirection: targetRole,
    },
    projects,
    capabilityScores: response.capability_scores.map((item) => {
      const dimension = formatDimensionLabel(item.dimension)
      return {
        dimension,
        score: item.score,
        weight: item.weight,
        summary: formatCapabilitySummary(dimension, item.summary),
        matchedItems: dedupeList(item.matched_items.map(normalizeCapabilityItem)),
        gapItems: dedupeList(item.gap_items.map(normalizeCapabilityItem)),
      }
    }),
    jobs,
    jobPortraits: response.job_portraits.map((item, index) => {
      const roleName = cleanText(item.role_name) || `岗位画像 ${index + 1}`
      const professionalSkills = dedupeList(item.professional_skills.map(formatSkill)).slice(0, 8)

      return {
        jobId: cleanText(item.job_id),
        roleName,
        roleFamily: formatRoleFamily(item.role_family),
        summary: normalizePortraitSummary(item.summary, roleName, item.role_family, professionalSkills),
        professionalSkills,
        certificates: dedupeList(item.certificates.map(normalizeCertificate)),
        innovationPoints: dedupeList(item.innovation_points.map(cleanText)),
        learningRequirements: normalizeRequirementItems(item.learning_requirements, "learning", roleName, professionalSkills),
        stressRequirements: normalizeRequirementItems(item.stress_requirements, "stress", roleName, professionalSkills),
        communicationRequirements: normalizeRequirementItems(
          item.communication_requirements,
          "communication",
          roleName,
          professionalSkills,
        ),
        internshipRequirements: normalizeRequirementItems(item.internship_requirements, "internship", roleName, professionalSkills),
        representativeCompanies: dedupeList(item.representative_companies.map(cleanText)),
      }
    }),
    roadmap: mapVerticalPathsToRoadmap(response.vertical_paths),
    growth: mapActionPlanToGrowth(response.career_report.action_plan, targetRole),
    transitionPaths: response.transition_paths.map((item) => {
      const sourceRole = cleanText(item.source_role)
      const targetRoleName = cleanText(item.target_role)
      const bridgeSkills = dedupeList(item.bridge_skills.map(formatSkill)).slice(0, 6)
      return {
        sourceRole,
        targetRole: targetRoleName,
        reason: normalizeTransitionReason(sourceRole, targetRoleName, item.reason, bridgeSkills),
        bridgeSkills,
        actionItems: normalizeTransitionActions(targetRoleName, item.action_items, bridgeSkills),
      }
    }),
    knowledge: {
      documents: response.job_portraits.slice(0, 4).map((portrait, index) => ({
        title: cleanText(portrait.role_name),
        relevance: Math.max(70, 96 - index * 7),
        category: formatRoleFamily(portrait.role_family),
      })),
      trends: [
        { title: "目标城市", value: targetCity },
        { title: "最高学历", value: highestDegree },
        { title: "返回岗位数量", value: `${matches.length}` },
        ...response.capability_scores.slice(0, 2).map(mapCapabilityTrend),
      ],
      skills: mapKnowledgeSkills(response),
      certifications: certificates,
    },
    report: {
      completionRate: Math.round(response.career_report.completeness_score),
      reportTitle: "职业规划与岗位匹配报告",
      updatedAt: "刚刚更新",
      highlights,
      overview: normalizeReportOverview(response.career_report.overview, targetRole),
      pathPlan: normalizePathPlan(response.career_report.path_plan, targetRole),
      editTips: dedupeList(response.career_report.edit_tips.map(cleanText)),
      llmEnabled: response.career_report.llm_enabled,
      exportReady: response.career_report.export_ready,
      actionPlan: response.career_report.action_plan.map((item) => ({
        phase: cleanText(item.phase),
        timeline: cleanText(item.timeline),
        goals: dedupeList(item.goals.map(cleanText)),
        actions: dedupeList(item.actions.map(cleanText)),
        metrics: dedupeList(item.metrics.map(cleanText)),
      })),
    },
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

function buildResumeFormData(
  file: File,
  payload: AnalysisRequestPayload,
  options?: { includeLimit?: boolean },
): FormData {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("target_role", payload.targetRole)
  formData.append("notes", payload.notes)

  if (options?.includeLimit) {
    formData.append("limit", "8")
  }

  return formData
}

export async function analyzeResume(
  file: File,
  payload: AnalysisRequestPayload,
): Promise<CareerAnalysisResponse> {
  const parseResponse = await fetch(`${API_BASE_URL}/api/v1/resume/parse`, {
    method: "POST",
    body: buildResumeFormData(file, payload),
  })
  await parseJson<unknown>(parseResponse)

  const matchResponse = await fetch(`${API_BASE_URL}/api/v1/match/resume-to-jobs`, {
    method: "POST",
    body: buildResumeFormData(file, payload, { includeLimit: true }),
  })

  const data = await parseJson<BackendResumeMatchResponse>(matchResponse)
  return mapBackendResponse(data, payload)
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: "GET",
    })

    return response.ok
  } catch {
    return false
  }
}
