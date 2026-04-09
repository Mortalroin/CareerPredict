from __future__ import annotations

import re
from collections import Counter, OrderedDict

from app.schemas.job import StructuredJob
from app.schemas.match import (
    ActionPlanPhase,
    CapabilityDimensionScore,
    CareerReport,
    JobMatchItem,
    JobPortrait,
    MatchBreakdown,
    PathNode,
    TransitionPath,
    VerticalPath,
)
from app.schemas.resume import ResumeParseResponse
from app.services.llm_service import LLMService


class CareerReportService:
    def __init__(self) -> None:
        self.llm_service = LLMService()

    def build_report_bundle(
        self,
        *,
        resume_data: ResumeParseResponse,
        matches: list[JobMatchItem],
        all_job_rows: list[dict],
    ) -> dict[str, object]:
        jobs = [StructuredJob.model_validate_json(row["structured_json"]) for row in all_job_rows]
        capability_scores = self._build_capability_scores(resume_data=resume_data, matches=matches)
        job_portraits = self._build_job_portraits(matches=matches, jobs=jobs)
        vertical_paths = self._build_vertical_paths(matches=matches)
        transition_paths = self._build_transition_paths(
            resume_data=resume_data,
            matches=matches,
            jobs=jobs,
        )
        career_report = self._build_career_report(
            resume_data=resume_data,
            matches=matches,
            capability_scores=capability_scores,
            vertical_paths=vertical_paths,
            transition_paths=transition_paths,
        )
        return {
            "capability_scores": capability_scores,
            "job_portraits": job_portraits,
            "vertical_paths": vertical_paths,
            "transition_paths": transition_paths,
            "career_report": career_report,
        }

    def _build_capability_scores(
        self,
        *,
        resume_data: ResumeParseResponse,
        matches: list[JobMatchItem],
    ) -> list[CapabilityDimensionScore]:
        top_matches = matches[:5]
        avg_match = self._average(item.total_score for item in top_matches)
        matched_skill_counter = Counter(
            skill
            for item in top_matches
            for skill in item.breakdown.skill_overlap
        )
        missing_skill_counter = Counter(
            skill
            for item in top_matches
            for skill in item.breakdown.missing_required_skills
        )

        basic_score = 0.0
        if top_matches:
            basic_score = self._average(
                (
                    (20 if item.breakdown.degree_pass else 0)
                    + (20 if item.breakdown.experience_pass else 0)
                    + (10 if item.breakdown.city_pass else 0)
                    + (10 if item.breakdown.language_pass else 0)
                )
                for item in top_matches
            ) * 2

        core_skills = resume_data.soft_conditions.core_skills
        tool_skills = resume_data.soft_conditions.tool_skills
        projects = resume_data.structured_resume.projects
        work_items = resume_data.structured_resume.work_experience

        skill_score = min(
            100.0,
            35
            + len(core_skills) * 6
            + len(tool_skills) * 2
            + len(matched_skill_counter) * 4
            - len(missing_skill_counter) * 3,
        )
        quality_traits = (
            len(resume_data.hard_conditions.languages)
            + len(resume_data.soft_conditions.domain_tags)
            + (1 if resume_data.profile.notes else 0)
        )
        literacy_score = min(100.0, 42 + quality_traits * 9 + len(work_items) * 4)
        potential_score = min(
            100.0,
            30
            + len(projects) * 9
            + len(resume_data.structured_resume.skills.certificates) * 6
            + len(resume_data.structured_resume.skills.domain_skills) * 4
            + max(resume_data.hard_conditions.total_years_experience, 0.0) * 3,
        )

        return [
            CapabilityDimensionScore(
                dimension="basic_requirements",
                score=round(max(15.0, basic_score), 1),
                weight=0.25,
                summary="主要评估候选人与岗位在学历、经验、城市和语言门槛上的满足程度。",
                matched_items=self._build_basic_matches(top_matches),
                gap_items=self._build_basic_gaps(top_matches),
            ),
            CapabilityDimensionScore(
                dimension="professional_skills",
                score=round(max(20.0, skill_score), 1),
                weight=0.35,
                summary="主要对比简历中提取的技能、工具与岗位显性要求之间的契合程度。",
                matched_items=list(matched_skill_counter.keys())[:8] or core_skills[:6],
                gap_items=list(missing_skill_counter.keys())[:8],
            ),
            CapabilityDimensionScore(
                dimension="professional_literacy",
                score=round(max(20.0, literacy_score), 1),
                weight=0.20,
                summary="结合语言表达、协作信号与经历内容，评估沟通、协作和抗压等职业素养。",
                matched_items=(resume_data.soft_conditions.domain_tags + resume_data.hard_conditions.languages)[:8],
                gap_items=self._infer_literacy_gaps(resume_data),
            ),
            CapabilityDimensionScore(
                dimension="growth_potential",
                score=round(max(20.0, potential_score), 1),
                weight=0.20,
                summary="结合项目经历、技能广度和可迁移性，评估候选人的后续成长空间。",
                matched_items=[project.name for project in projects[:4]] or resume_data.soft_conditions.project_keywords[:4],
                gap_items=self._infer_potential_gaps(resume_data, avg_match),
            ),
        ]

    def _build_job_portraits(self, *, matches: list[JobMatchItem], jobs: list[StructuredJob]) -> list[JobPortrait]:
        job_lookup = {job.job_id: job for job in jobs}
        portraits: list[JobPortrait] = []

        for match in matches[:10]:
            job = job_lookup.get(match.job_id)
            if job is None:
                continue

            family = self._role_family(job.basic_info.title)
            skills = list(
                OrderedDict.fromkeys(
                    job.requirements.required_skills
                    + job.requirements.required_tools
                    + job.tags.skill_tags
                )
            )[:8]
            if not skills:
                skills = self._portrait_skill_fallback(job, family)

            certificates = self._infer_certificates(job, family) or self._certificate_fallback(family)
            learning_requirements = self._infer_learning_requirements(job, family, skills) or self._requirement_fallback(
                "learning",
                family,
                skills,
            )
            stress_requirements = self._infer_stress_requirements(job, family) or self._requirement_fallback(
                "stress",
                family,
                skills,
            )
            communication_requirements = self._infer_communication_requirements(
                job,
                family,
            ) or self._requirement_fallback("communication", family, skills)
            internship_requirements = self._infer_internship_requirements(job, family) or self._requirement_fallback(
                "internship",
                family,
                skills,
            )

            portraits.append(
                JobPortrait(
                    job_id=job.job_id,
                    role_name=job.basic_info.title,
                    role_family=family,
                    summary=self._portrait_summary(job, family, skills),
                    professional_skills=skills,
                    certificates=certificates,
                    innovation_points=self._infer_innovation_points(job, family, skills),
                    learning_requirements=learning_requirements,
                    stress_requirements=stress_requirements,
                    communication_requirements=communication_requirements,
                    internship_requirements=internship_requirements,
                    representative_companies=[job.basic_info.company_name],
                )
            )

        return portraits

    def _build_vertical_paths(self, *, matches: list[JobMatchItem]) -> list[VerticalPath]:
        paths: list[VerticalPath] = []
        for match in matches[:5]:
            base_title = self._clean_title(match.title)
            nodes = [
                PathNode(
                    title=title,
                    stage=stage,
                    description=description,
                    skills=self._path_skills(base_title, stage),
                )
                for stage, title, description in self._build_progression_titles(base_title)
            ]
            paths.append(
                VerticalPath(
                    role_family=self._role_family(match.title),
                    description=f"{base_title} 通常会经历从入门执行、独立负责、资深进阶到带队统筹的成长路径。",
                    nodes=nodes,
                )
            )
        return paths

    def _build_transition_paths(
        self,
        *,
        resume_data: ResumeParseResponse,
        matches: list[JobMatchItem],
        jobs: list[StructuredJob],
    ) -> list[TransitionPath]:
        role_catalog = self._build_transition_role_catalog(matches=matches, jobs=jobs)
        if not role_catalog:
            return []

        relevant_families = {
            self._role_family(match.title)
            for match in matches[:8]
            if self._role_family(match.title) != "general"
        }

        source_titles: list[str] = []
        for match in matches:
            title = self._clean_title(match.title)
            if title in role_catalog and title not in source_titles:
                source_titles.append(title)
            if len(source_titles) >= 5:
                break

        if len(source_titles) < 5:
            ranked_catalog = sorted(
                role_catalog.values(),
                key=lambda item: (
                    item["family"] in relevant_families,
                    item["score"],
                    len(item["skills"]),
                ),
                reverse=True,
            )
            for item in ranked_catalog:
                title = str(item["title"])
                if title not in source_titles:
                    source_titles.append(title)
                if len(source_titles) >= 5:
                    break

        transitions: list[TransitionPath] = []
        match_titles = {self._clean_title(match.title) for match in matches[:10]}

        for source_title in source_titles[:5]:
            source_entry = role_catalog.get(source_title)
            if source_entry is None:
                continue

            targets = self._select_transition_targets(
                source_entry=source_entry,
                role_catalog=role_catalog,
                relevant_families=relevant_families,
                match_titles=match_titles,
            )

            for target_entry in targets[:3]:
                bridge_skills = self._bridge_skills_for_roles(
                    source_entry=source_entry,
                    target_entry=target_entry,
                )
                transitions.append(
                    TransitionPath(
                        source_role=source_title,
                        target_role=str(target_entry["title"]),
                        reason=self._build_transition_reason(
                            source_title,
                            str(target_entry["title"]),
                            str(target_entry["family"]),
                            bridge_skills,
                        ),
                        bridge_skills=bridge_skills,
                        action_items=self._build_transition_actions(
                            source_title,
                            str(target_entry["title"]),
                            str(target_entry["family"]),
                            bridge_skills,
                        ),
                    )
                )

        return transitions

    def _build_career_report(
        self,
        *,
        resume_data: ResumeParseResponse,
        matches: list[JobMatchItem],
        capability_scores: list[CapabilityDimensionScore],
        vertical_paths: list[VerticalPath],
        transition_paths: list[TransitionPath],
    ) -> CareerReport:
        completeness_score = self._compute_completeness_score(resume_data)
        competitiveness_score = self._compute_competitiveness_score(matches, capability_scores)
        readiness_score = round(
            completeness_score * 0.25
            + competitiveness_score * 0.35
            + self._weighted_dimension_score(capability_scores) * 0.40,
            1,
        )
        target_role = resume_data.hard_conditions.target_roles[0] if resume_data.hard_conditions.target_roles else "目标岗位待定"
        target_city = resume_data.hard_conditions.target_cities[0] if resume_data.hard_conditions.target_cities else "城市可灵活调整"
        overview = self._fallback_overview(
            target_role=target_role,
            readiness_score=readiness_score,
            capability_scores=capability_scores,
        )
        llm_overview = self._try_llm_overview(
            resume_data=resume_data,
            capability_scores=capability_scores,
            matches=matches,
            transition_paths=transition_paths,
        )
        if llm_overview:
            overview = llm_overview

        return CareerReport(
            target_role=target_role,
            target_city=target_city,
            completeness_score=round(completeness_score, 1),
            competitiveness_score=round(competitiveness_score, 1),
            readiness_score=readiness_score,
            llm_enabled=self.llm_service.enabled,
            overview=overview,
            exploration=self._build_exploration_text(matches, capability_scores),
            path_plan=self._build_path_plan(vertical_paths, transition_paths),
            edit_tips=[
                "给项目经历补充量化结果，提升完整度与竞争力。",
                "把技能与项目改写成目标岗位更熟悉的表达方式。",
                "每两周复盘一次投递反馈，并据此调整目标岗位池。",
            ],
            action_plan=self._build_action_plan(capability_scores, transition_paths),
            export_ready=True,
        )

    @staticmethod
    def _resolve_source_role(resume_data: ResumeParseResponse) -> str:
        derived_role = resume_data.structured_resume.derived.latest_position
        if derived_role:
            return derived_role
        if resume_data.hard_conditions.target_roles:
            return resume_data.hard_conditions.target_roles[0]
        return "当前岗位"

    @staticmethod
    def _clean_title(title: str) -> str:
        value = title.strip()
        value = re.sub(r"^(junior|senior|lead|principal|chief)\s+", "", value, flags=re.IGNORECASE)
        value = re.sub(r"(经理|主管|总监|负责人|leader|lead)$", "", value, flags=re.IGNORECASE)
        return value or title.strip()

    @staticmethod
    def _role_family(title: str) -> str:
        lower = title.lower()
        if any(keyword in lower for keyword in ["java", "python", "backend", "frontend", "developer", "c/c++"]):
            return "engineering"
        if any(keyword in title for keyword in ["开发", "前端", "后端", "程序", "软件工程师"]):
            return "engineering"
        if any(keyword in lower for keyword in ["test", "qa", "quality"]):
            return "testing"
        if any(keyword in title for keyword in ["测试", "质检", "质量管理"]):
            return "testing"
        if any(keyword in lower for keyword in ["product"]) or "产品" in title:
            return "product"
        if any(keyword in lower for keyword in ["operate", "operation", "growth", "community"]):
            return "operations"
        if any(keyword in title for keyword in ["运营", "增长", "社区运营", "游戏运营"]):
            return "operations"
        if any(keyword in lower for keyword in ["support", "service"]) or any(keyword in title for keyword in ["客服", "售后", "客户服务"]):
            return "customer_service"
        if any(keyword in lower for keyword in ["data", "analysis", "algorithm", "ai"]) or any(keyword in title for keyword in ["数据", "算法", "人工智能", "AI"]):
            return "data_ai"
        if any(keyword in lower for keyword in ["implementation", "delivery", "solution"]) or any(keyword in title for keyword in ["实施", "交付", "技术支持"]):
            return "implementation"
        if any(keyword in lower for keyword in ["sale", "sales", "business", "bid"]) or any(keyword in title for keyword in ["销售", "商务", "招投标", "广告销售"]):
            return "sales"
        if any(keyword in lower for keyword in ["assistant"]) or any(keyword in title for keyword in ["助理", "总助", "秘书", "专员"]):
            return "assistant"
        return "general"

    @staticmethod
    def _transition_family_map() -> dict[str, list[str]]:
        return {
            "product": ["operations", "implementation", "data_ai", "sales", "assistant"],
            "operations": ["product", "sales", "customer_service", "implementation", "assistant"],
            "implementation": ["customer_service", "operations", "sales", "engineering", "product"],
            "customer_service": ["implementation", "sales", "operations", "assistant"],
            "sales": ["customer_service", "operations", "implementation", "assistant", "product"],
            "engineering": ["testing", "implementation", "data_ai", "product"],
            "testing": ["engineering", "implementation", "data_ai", "product"],
            "data_ai": ["product", "engineering", "operations", "testing"],
            "assistant": ["operations", "sales", "customer_service", "implementation", "product"],
            "general": ["operations", "assistant", "sales", "customer_service"],
        }

    def _build_transition_role_catalog(
        self,
        *,
        matches: list[JobMatchItem],
        jobs: list[StructuredJob],
    ) -> OrderedDict[str, dict[str, object]]:
        match_score_map = {
            self._clean_title(match.title): match.total_score
            for match in matches
        }
        catalog: OrderedDict[str, dict[str, object]] = OrderedDict()

        for job in jobs:
            title = self._clean_title(job.basic_info.title)
            family = self._role_family(title)
            skills = list(
                OrderedDict.fromkeys(
                    skill
                    for skill in (
                        job.requirements.required_skills
                        + job.requirements.required_tools
                        + job.tags.skill_tags
                    )
                    if skill
                )
            )[:8]

            existing = catalog.get(title)
            score = float(match_score_map.get(title, 0.0))
            if existing is None:
                catalog[title] = {
                    "title": title,
                    "family": family,
                    "skills": skills,
                    "score": score,
                }
                continue

            existing["skills"] = list(OrderedDict.fromkeys(list(existing["skills"]) + skills))[:8]
            existing["score"] = max(float(existing["score"]), score)

        return catalog

    def _select_transition_targets(
        self,
        *,
        source_entry: dict[str, object],
        role_catalog: OrderedDict[str, dict[str, object]],
        relevant_families: set[str],
        match_titles: set[str],
    ) -> list[dict[str, object]]:
        source_title = str(source_entry["title"])
        source_family = str(source_entry["family"])
        source_skills = set(source_entry["skills"])
        family_targets = self._transition_family_map().get(source_family, ["general"])

        candidates: list[tuple[float, dict[str, object]]] = []
        for target_entry in role_catalog.values():
            target_title = str(target_entry["title"])
            target_family = str(target_entry["family"])
            if target_title == source_title or target_family == source_family:
                continue

            shared_skills = source_skills & set(target_entry["skills"])
            score = 0.0
            if target_family in family_targets:
                score += 40
            if target_family in relevant_families:
                score += 12
            if target_title in match_titles:
                score += 10
            score += len(shared_skills) * 8
            score += float(target_entry["score"]) * 0.15
            if target_family == "general":
                score -= 8
            if score <= 0:
                continue
            candidates.append((score, target_entry))

        candidates.sort(
            key=lambda item: (
                item[0],
                len(item[1]["skills"]),
                str(item[1]["title"]),
            ),
            reverse=True,
        )

        selected: list[dict[str, object]] = []
        seen_titles: set[str] = set()
        for _, entry in candidates:
            title = str(entry["title"])
            if title in seen_titles:
                continue
            selected.append(entry)
            seen_titles.add(title)
            if len(selected) >= 3:
                break

        return selected

    @staticmethod
    def _bridge_skills_for_roles(
        *,
        source_entry: dict[str, object],
        target_entry: dict[str, object],
    ) -> list[str]:
        source_skills = list(source_entry["skills"])
        target_skills = list(target_entry["skills"])
        shared = [skill for skill in source_skills if skill in target_skills]
        if shared:
            return list(OrderedDict.fromkeys(shared))[:6]

        fallback = list(OrderedDict.fromkeys(source_skills[:3] + target_skills[:3]))
        return fallback[:6]

    @staticmethod
    def _build_progression_titles(base_title: str) -> list[tuple[str, str, str]]:
        return [
            ("entry", f"初阶{base_title}", "建立基础执行能力，熟悉岗位标准流程与协作方式。"),
            ("core", base_title, "能够独立负责常规任务，并按要求稳定输出结果。"),
            ("senior", f"资深{base_title}", "可以处理更复杂的业务场景，并推动质量或效率优化。"),
            ("lead", f"{base_title}负责人", "开始承担团队协同、资源统筹与跨部门推进职责。"),
        ]

    @staticmethod
    def _path_skills(base_title: str, stage: str) -> list[str]:
        stage_map = {
            "entry": ["流程理解", "工具使用", "执行规范"],
            "core": ["独立负责", "分析能力", "沟通协作"],
            "senior": ["方案设计", "优化意识", "跨团队推进"],
            "lead": ["规划能力", "辅导能力", "协同统筹"],
        }
        return [base_title, *stage_map.get(stage, [])][:4]

    @staticmethod
    def _portrait_summary(job: StructuredJob, family: str, skills: list[str]) -> str:
        top_skills = "、".join(skills[:3]) if skills else "岗位核心能力"
        summary_map = {
            "engineering": f"{job.basic_info.title}更看重代码实现、问题定位与工程交付能力，通常需要候选人围绕{top_skills}形成可证明的项目经验。",
            "testing": f"{job.basic_info.title}更看重测试思维、问题发现与质量闭环能力，通常需要候选人围绕{top_skills}稳定开展验证工作。",
            "product": f"{job.basic_info.title}更看重需求拆解、业务理解与协同推进能力，通常需要候选人围绕{top_skills}完成方案设计与落地。",
            "operations": f"{job.basic_info.title}更看重数据意识、执行稳定性与增长优化思维，通常需要候选人围绕{top_skills}推动结果改进。",
            "customer_service": f"{job.basic_info.title}更看重沟通响应、问题跟进与服务闭环能力，通常需要候选人围绕{top_skills}提升用户体验。",
            "data_ai": f"{job.basic_info.title}更看重数据分析、模型理解与问题抽象能力，通常需要候选人围绕{top_skills}输出有业务价值的结果。",
            "implementation": f"{job.basic_info.title}更看重客户沟通、实施交付与问题处理能力，通常需要候选人围绕{top_skills}稳定完成现场或远程支持。",
            "sales": f"{job.basic_info.title}更看重客户拓展、商务沟通与结果转化能力，通常需要候选人围绕{top_skills}推动业务成交。",
            "assistant": f"{job.basic_info.title}更看重组织协调、信息整理与执行跟进能力，通常需要候选人围绕{top_skills}支撑业务运转。",
        }
        return summary_map.get(
            family,
            f"{job.basic_info.title}通常要求候选人具备{top_skills}等核心能力，并能在真实业务场景中稳定完成工作闭环。",
        )

    @staticmethod
    def _infer_certificates(job: StructuredJob, family: str) -> list[str]:
        title = job.basic_info.title
        mapping = {
            "engineering": ["工程项目作品集", "Git / 云平台能力证明"],
            "testing": ["ISTQB（可选）", "测试项目案例"],
            "product": ["PMP（可选）", "PRD / 路线图作品"],
            "operations": ["数据分析课程证明", "运营项目案例"],
            "customer_service": ["服务案例证明", "办公工具熟练证明"],
            "data_ai": ["算法 / 数据项目作品", "模型应用实践证明"],
            "implementation": ["实施项目案例", "办公与演示工具熟练证明"],
            "sales": ["销售项目战报", "商务投标案例"],
            "assistant": ["办公工具熟练证明", "组织协调案例"],
        }
        if "招投标" in title:
            return ["招投标项目案例", "Office / 标书编制熟练证明"]
        return mapping.get(family, ["项目案例证明", "工具熟练度证明"])

    @staticmethod
    def _infer_innovation_points(job: StructuredJob, family: str, skills: list[str]) -> list[str]:
        first_skill = skills[0] if skills else "岗位核心能力"
        family_map = {
            "engineering": [
                "把重复开发任务沉淀为可复用模块或脚手架。",
                f"围绕 {first_skill} 优化性能、稳定性或交付效率。",
            ],
            "testing": [
                "把高频测试场景沉淀为标准用例或检查清单。",
                f"围绕 {first_skill} 提升问题发现率与回归效率。",
            ],
            "product": [
                "把复杂业务问题拆解成可执行的产品方案。",
                f"围绕 {first_skill} 优化流程、体验或转化结果。",
            ],
            "operations": [
                "把运营动作沉淀为可复用的活动或分析模板。",
                f"围绕 {first_skill} 持续优化效率与业务结果。",
            ],
            "customer_service": [
                "把高频问题沉淀为标准话术与处理流程。",
                f"围绕 {first_skill} 提升响应效率与服务满意度。",
            ],
            "data_ai": [
                "把分析或建模流程沉淀为可复用方法。",
                f"围绕 {first_skill} 输出更贴近业务场景的结论。",
            ],
            "implementation": [
                "把实施经验沉淀为交付 SOP 或问题排查手册。",
                f"围绕 {first_skill} 提升实施稳定性与客户体验。",
            ],
            "sales": [
                "把客户需求归纳成更高效的转化话术或方案模板。",
                f"围绕 {first_skill} 提升沟通效率与成交概率。",
            ],
            "assistant": [
                "把高频协同事项沉淀为表单、模板与流程规范。",
                f"围绕 {first_skill} 提升支持效率与信息准确度。",
            ],
        }
        return family_map.get(
            family,
            [
                "把重复任务沉淀为可复用模板或工作流。",
                f"围绕 {first_skill} 提升效率或结果质量。",
            ],
        )

    @staticmethod
    def _infer_learning_requirements(job: StructuredJob, family: str, skills: list[str]) -> list[str]:
        top_skills = "、".join(skills[:2]) if skills else "岗位核心技能"
        family_map = {
            "engineering": [
                f"持续学习 {top_skills} 相关技术栈、工程规范与问题定位方法。",
                "结合真实项目补足代码实现、调试与部署闭环。",
            ],
            "testing": [
                f"持续学习 {top_skills} 相关测试方法、用例设计与质量标准。",
                "结合真实场景补足功能测试、缺陷分析与回归验证经验。",
            ],
            "product": [
                f"持续学习 {top_skills} 相关产品方法、业务分析与方案表达方式。",
                "结合目标岗位高频任务，形成每周调研、复盘与案例积累机制。",
            ],
            "operations": [
                f"持续学习 {top_skills} 相关运营方法、数据指标与增长策略。",
                "把活动复盘、数据分析与优化动作连接成稳定闭环。",
            ],
            "customer_service": [
                f"持续学习 {top_skills} 相关服务规范、客户沟通与问题处理方法。",
                "结合高频咨询场景提升响应效率、跟进能力与服务体验。",
            ],
            "data_ai": [
                f"持续学习 {top_skills} 相关分析工具、建模思路与业务解释方法。",
                "补足从问题定义到结果呈现的完整分析闭环。",
            ],
            "implementation": [
                f"持续学习 {top_skills} 相关实施流程、客户支持与问题排查方法。",
                "结合交付场景补足演示、培训和实施过程中的应变能力。",
            ],
            "sales": [
                f"持续学习 {top_skills} 相关客户洞察、商务表达与转化策略。",
                "围绕目标客户场景练习需求识别、方案表达与结果跟进。",
            ],
            "assistant": [
                f"持续学习 {top_skills} 相关办公工具、信息整理与协同支持方法。",
                "把高频协作任务拆解为清晰流程，提升支持效率与准确度。",
            ],
        }
        return family_map.get(
            family,
            [
                f"持续学习 {top_skills} 相关工具、方法与业务场景。",
                f"结合 {job.basic_info.title} 的典型任务，形成每周学习与复盘计划。",
            ],
        )

    @staticmethod
    def _infer_stress_requirements(job: StructuredJob, family: str) -> list[str]:
        description = job.responsibilities.description
        if any(keyword in description for keyword in ["加班", "抗压", "出差", "交付", "倒班"]):
            return [
                "需要在多任务或高强度节奏下保持稳定执行。",
                "面对明确交付节点时，仍需维持结果质量与反馈节奏。",
            ]

        family_map = {
            "engineering": ["需要在排期与质量之间做清晰取舍。", "面对技术问题时保持稳定排查与修复节奏。"],
            "testing": ["需要在回归高峰期保持细致验证与优先级判断。", "面对缺陷堆积时仍能保证测试闭环。"],
            "product": ["需要在需求变化和资源限制之间保持清晰判断。", "面对跨团队协同压力时仍能推进项目落地。"],
            "operations": ["需要在指标波动和节奏变化下保持执行稳定。", "面对活动或增长目标压力时能及时复盘与调整。"],
            "customer_service": ["需要在高频咨询场景下保持服务质量与耐心。", "面对突发问题或投诉时能快速稳住节奏。"],
            "data_ai": ["需要在复杂问题分析中保持耐心与结构化思考。", "面对结果不确定性时能持续迭代验证。"],
            "implementation": ["需要在客户现场与交付节点下保持稳定响应。", "面对多方沟通压力时仍能推动问题闭环。"],
            "sales": ["需要在业绩目标和客户跟进中保持连续性。", "面对转化不确定性时仍能保持推进节奏。"],
            "assistant": ["需要在多事项并行时保持清晰优先级。", "面对临时任务插入时仍能保证信息准确与响应效率。"],
        }
        return family_map.get(
            family,
            ["能够在多任务并行场景下保持稳定执行与优先级判断。", "面对临时需求或问题反馈时，能够快速响应并稳住节奏。"],
        )

    @staticmethod
    def _infer_communication_requirements(job: StructuredJob, family: str) -> list[str]:
        family_map = {
            "engineering": ["能把开发进度、风险与技术问题清晰同步给协作方。", "能把复杂问题拆解为行动项并推动闭环。"],
            "testing": ["能把问题现象、复现步骤与影响范围表达清楚。", "能与研发、产品协同推动缺陷修复闭环。"],
            "product": ["能在业务、设计、研发之间形成清晰共识。", "能把复杂需求翻译为可执行方案并持续同步。"],
            "operations": ["能围绕活动进度、数据结果与优化动作做及时同步。", "能与多个角色保持节奏一致，推进运营目标完成。"],
            "customer_service": ["能以清晰、耐心的方式回应客户问题。", "能及时跟进并反馈处理进度，形成服务闭环。"],
            "data_ai": ["能把分析过程与结论转化为业务可理解的表达。", "能与业务方协同确认问题边界与结果价值。"],
            "implementation": ["能和客户、内部团队同步实施进度与风险。", "能把问题拆解为处理步骤并推动解决。"],
            "sales": ["能围绕客户需求进行清晰表达与方案沟通。", "能在推进过程中同步重点信息并维护关系。"],
            "assistant": ["能高效对接多方需求并保持信息准确。", "能把零散任务整理成清晰执行清单并及时反馈。"],
        }
        return family_map.get(
            family,
            ["能够清晰同步进度、问题与风险，保持跨团队协作顺畅。", "遇到复杂问题时，能够拆解步骤并推动闭环。"],
        )

    @staticmethod
    def _infer_internship_requirements(job: StructuredJob, family: str) -> list[str]:
        if job.requirements.min_years_experience <= 1:
            family_map = {
                "engineering": ["实习、课程项目或开源作品都能作为初步证明材料。", "建议补充能体现编码、调试或部署能力的实践案例。"],
                "testing": ["测试实习、课程验证项目或竞赛经历都可以作为证明。", "建议补充用例设计、缺陷跟踪或回归验证案例。"],
                "product": ["实习、校园项目或课程设计都可以作为产品能力证明。", "建议补充需求分析、原型设计或项目推进案例。"],
                "operations": ["活动运营、校园组织或数据分析类实践都能形成加分项。", "建议补充能体现结果提升或复盘能力的案例。"],
                "customer_service": ["服务类实习、校园工作或项目协作经历都可作为初步证明。", "建议补充能体现沟通响应和问题闭环的具体案例。"],
                "implementation": ["实施、技术支持或客户服务类实习经历都较有帮助。", "建议补充演示、培训、排查或交付相关案例。"],
                "sales": ["销售、商务、客户拓展或活动转化类实践都可作为证明。", "建议补充需求识别、沟通推进或结果转化案例。"],
                "assistant": ["助理、行政支持、项目协作等经历都能形成基础证明。", "建议补充信息整理、会议协同和流程跟进案例。"],
            }
            return family_map.get(
                family,
                ["具备实习、校园项目、竞赛或课程实践经历会更有优势。", f"若缺少直接经验，建议通过 {job.basic_info.title} 相关项目补足证明材料。"],
            )

        return [
            "更建议具备真实实习、项目或业务场景相关经验。",
            "尽量展示与目标岗位相近的工作内容、问题处理和结果证明。",
        ]

    def _try_llm_overview(
        self,
        *,
        resume_data: ResumeParseResponse,
        capability_scores: list[CapabilityDimensionScore],
        matches: list[JobMatchItem],
        transition_paths: list[TransitionPath],
    ) -> str | None:
        top_match = matches[0] if matches else None
        prompt = "\n".join(
            [
                f"Target roles: {resume_data.hard_conditions.target_roles[:1]}",
                f"Core skills: {resume_data.soft_conditions.core_skills[:8]}",
                f"Tool skills: {resume_data.soft_conditions.tool_skills[:6]}",
                f"Capability scores: {[(item.dimension, item.score) for item in capability_scores]}",
                f"Top matched job: {top_match.title if top_match else 'N/A'}",
                f"Transition options: {[(item.source_role, item.target_role) for item in transition_paths[:3]]}",
                "Please output a concise Chinese overview, 120-180 characters, practical and explainable.",
            ]
        )
        result = self.llm_service.generate_text(
            system_prompt=(
                "You are a career planning expert. Turn structured evidence into a practical, "
                "explainable, concise Chinese career report summary."
            ),
            user_prompt=prompt,
            temperature=0.3,
            max_output_tokens=280,
        )
        return result.content if result else None

    @staticmethod
    def _build_exploration_text(matches: list[JobMatchItem], capability_scores: list[CapabilityDimensionScore]) -> str:
        top_titles = "、".join(item.title for item in matches[:3]) or "暂未形成明显高匹配岗位"
        strongest = max(capability_scores, key=lambda item: item.score, default=None)
        weakest = min(capability_scores, key=lambda item: item.score, default=None)
        return (
            f"当前高匹配岗位主要集中在 {top_titles}。"
            f" 你的最强维度是 {strongest.dimension if strongest else '暂无'}，"
            f" 当前最需要补足的维度是 {weakest.dimension if weakest else '暂无'}。"
        )

    @staticmethod
    def _build_path_plan(vertical_paths: list[VerticalPath], transition_paths: list[TransitionPath]) -> str:
        vertical = vertical_paths[0].description if vertical_paths else "当前尚未构建出清晰的纵向成长路径。"
        if len(transition_paths) >= 2:
            transition = f"建议同步关注 {transition_paths[0].target_role} 和 {transition_paths[1].target_role} 两条转岗路径。"
        elif transition_paths:
            transition = f"建议重点关注 {transition_paths[0].target_role} 这一条转岗路径。"
        else:
            transition = "当前尚未形成明确的转岗路径建议。"
        return f"{vertical} {transition}"

    @staticmethod
    def _build_action_plan(
        capability_scores: list[CapabilityDimensionScore],
        transition_paths: list[TransitionPath],
    ) -> list[ActionPlanPhase]:
        weakest = min(capability_scores, key=lambda item: item.score, default=None)
        bridge_targets = [item.target_role for item in transition_paths[:2]]
        return [
            ActionPlanPhase(
                phase="short_term",
                timeline="1-4 周",
                goals=[
                    "优先补足最高频缺口能力。",
                    "把简历经历改写为更面向岗位的成果表达。",
                ],
                actions=[
                    f"围绕 {weakest.dimension if weakest else '当前差距'} 制定每周学习计划。",
                    "将至少 1 个项目或实习经历改写成包含目标、动作、结果的 STAR 结构。",
                    "重写标题、技能块与项目描述，使其更贴近目标岗位语境。",
                ],
                metrics=[
                    "完成 2-3 个重点学习主题。",
                    "在简历中新增 3 条量化结果描述。",
                    "完成 1 轮简历自查与修改。",
                ],
            ),
            ActionPlanPhase(
                phase="mid_term",
                timeline="1-3 个月",
                goals=[
                    "建立更强的岗位竞争力。",
                    "验证主路径与一条备选转岗路径。",
                ],
                actions=[
                    f"围绕 {', '.join(bridge_targets) or '目标岗位'} 准备作品集或案例材料。",
                    "整理 1-2 组能体现问题、行动与结果的面试故事。",
                    "每两周复盘一次投递反馈，并微调目标岗位池。",
                ],
                metrics=[
                    "完成 1-2 个相关项目实践。",
                    "形成 1 次路径复盘记录。",
                    "建立稳定的投递-复盘-调整循环。",
                ],
            ),
        ]

    @staticmethod
    def _portrait_skill_fallback(job: StructuredJob, family: str) -> list[str]:
        skill_map = {
            "product": ["需求分析", "平台规划", "业务抽象", "跨团队协同"],
            "implementation": ["客户沟通", "交付支持", "问题排查", "培训演示"],
            "testing": ["用例设计", "缺陷跟踪", "质量验证", "回归测试"],
            "operations": ["数据分析", "内容运营", "结果复盘", "活动执行"],
            "sales": ["客户沟通", "方案表达", "需求识别", "转化推进"],
            "customer_service": ["服务响应", "问题跟进", "用户沟通", "满意度提升"],
            "assistant": ["流程跟进", "资料整理", "会议协同", "事务执行"],
            "engineering": ["编码实现", "系统调试", "问题定位", "工程交付"],
            "data_ai": ["数据分析", "模型理解", "结果洞察", "业务抽象"],
            "general": ["沟通协作", "执行落地", "问题处理", "结果闭环"],
        }
        return skill_map.get(family, skill_map["general"])[:6]

    @staticmethod
    def _certificate_fallback(family: str) -> list[str]:
        certificate_map = {
            "product": ["项目成果证明", "方案材料"],
            "implementation": ["交付案例证明", "工具熟练证明"],
            "testing": ["测试案例证明", "质量闭环材料"],
            "operations": ["数据复盘材料", "运营项目证明"],
            "sales": ["客户案例证明", "转化结果材料"],
            "customer_service": ["服务案例证明", "沟通处理记录"],
            "assistant": ["流程协同材料", "事务处理证明"],
            "engineering": ["项目成果证明", "工程实现材料"],
            "data_ai": ["数据项目材料", "分析报告证明"],
            "general": ["项目证明材料", "工具熟练证明"],
        }
        return certificate_map.get(family, certificate_map["general"])

    @staticmethod
    def _requirement_fallback(kind: str, family: str, skills: list[str]) -> list[str]:
        top_skills = "、".join(skills[:2]) if skills else "岗位核心技能"
        fallback_map = {
            "learning": {
                "product": [
                    "持续学习平台型产品的方法论、系统设计思维和业务抽象能力。",
                    f"围绕 {top_skills} 补足需求分析、方案设计与迭代复盘能力。",
                ],
                "implementation": [
                    "持续学习实施流程、交付方法和常见问题排查思路。",
                    f"围绕 {top_skills} 补足演示、培训与远程支持能力。",
                ],
                "testing": [
                    "持续学习测试方法、用例设计和质量标准。",
                    f"围绕 {top_skills} 补足功能验证、缺陷分析与回归测试经验。",
                ],
                "general": [
                    "持续学习目标岗位常用工具、方法和业务场景知识。",
                    f"围绕 {top_skills} 制定阶段性学习与复盘计划。",
                ],
            },
            "communication": {
                "product": [
                    "能够在研发、运营、业务之间清晰同步目标、范围与推进节奏。",
                    "能够把复杂需求拆成阶段任务，并推动多方形成一致决策。",
                ],
                "implementation": [
                    "能够与客户、内部团队同步实施进度、风险与处理结果。",
                    "能把复杂问题拆解成清晰步骤并推动闭环解决。",
                ],
                "testing": [
                    "能够把问题现象、复现步骤与影响范围表达清楚。",
                    "能与研发、产品协同推动缺陷修复与质量闭环。",
                ],
                "general": [
                    "能够清晰表达任务进度、问题与解决方案。",
                    "能够在跨团队协作中保持顺畅配合和有效反馈。",
                ],
            },
            "stress": {
                "product": [
                    "能在多需求并行、优先级频繁变化时保持判断稳定。",
                    "面对跨部门反馈和版本压力时，能够稳住节奏并推动闭环。",
                ],
                "implementation": [
                    "能够在现场支持、交付节点和多任务并行时保持稳定执行。",
                    "面对临时需求、客户反馈和问题升级时能快速响应。",
                ],
                "testing": [
                    "需要在回归高峰期保持细致验证与优先级判断。",
                    "面对缺陷堆积和时间压力时能保证测试闭环。",
                ],
                "general": [
                    "能在多任务并行与节奏变化中保持稳定执行。",
                    "面对临时需求和反馈调整时能够快速适应。",
                ],
            },
            "internship": {
                "product": [
                    "产品实习、平台项目、校园项目或竞赛经历都可以作为有效证明。",
                    "建议补充能体现业务抽象、方案设计与落地结果的项目案例。",
                ],
                "implementation": [
                    "实施、技术支持、客户服务类实习经历都可以作为证明。",
                    "建议补充培训、演示、排查或交付相关案例。",
                ],
                "testing": [
                    "测试实习、课程验证项目或竞赛经历都可以作为证明。",
                    "建议补充用例设计、缺陷跟踪或回归验证案例。",
                ],
                "general": [
                    "实习、校园项目、竞赛或课程实践都可以形成加分证明。",
                    "建议补充能体现岗位相关能力的项目案例与量化结果。",
                ],
            },
        }

        family_items = fallback_map.get(kind, {})
        return family_items.get(family, family_items.get("general", []))

    @staticmethod
    def _compute_completeness_score(resume_data: ResumeParseResponse) -> float:
        fields = [
            bool(resume_data.structured_resume.basics.name),
            bool(resume_data.structured_resume.basics.current_city),
            bool(resume_data.hard_conditions.target_roles),
            bool(resume_data.soft_conditions.core_skills),
            bool(resume_data.soft_conditions.tool_skills),
            bool(resume_data.structured_resume.education),
            bool(resume_data.structured_resume.work_experience),
            bool(resume_data.structured_resume.projects),
            bool(resume_data.structured_resume.profile.summary),
            bool(resume_data.hard_conditions.languages),
        ]
        return 100.0 * sum(fields) / len(fields)

    @staticmethod
    def _compute_competitiveness_score(
        matches: list[JobMatchItem],
        capability_scores: list[CapabilityDimensionScore],
    ) -> float:
        match_score = CareerReportService._average(item.total_score for item in matches[:5])
        dimension_score = CareerReportService._weighted_dimension_score(capability_scores)
        return min(100.0, match_score * 0.55 + dimension_score * 0.45)

    @staticmethod
    def _weighted_dimension_score(capability_scores: list[CapabilityDimensionScore]) -> float:
        return sum(item.score * item.weight for item in capability_scores)

    @staticmethod
    def _fallback_overview(
        *,
        target_role: str,
        readiness_score: float,
        capability_scores: list[CapabilityDimensionScore],
    ) -> str:
        strongest = max(capability_scores, key=lambda item: item.score, default=None)
        weakest = min(capability_scores, key=lambda item: item.score, default=None)
        return (
            f"当前候选人针对 {target_role} 的整体就绪度约为 {readiness_score:.1f} 分。"
            f" 优势主要集中在 {strongest.dimension if strongest else '暂无明显优势维度'}，"
            f" 当前更需要补足的是 {weakest.dimension if weakest else '暂无明显短板'}，"
            "下一步建议围绕缺失技能与项目证据继续增强。"
        )

    @staticmethod
    def _build_basic_matches(matches: list[JobMatchItem]) -> list[str]:
        items: list[str] = []
        if any(item.breakdown.degree_pass for item in matches):
            items.append("degree gate passed")
        if any(item.breakdown.experience_pass for item in matches):
            items.append("experience gate passed")
        if any(item.breakdown.city_pass for item in matches):
            items.append("city alignment exists")
        if any(item.breakdown.language_pass for item in matches):
            items.append("language gate passed")
        return items[:6]

    @staticmethod
    def _build_basic_gaps(matches: list[JobMatchItem]) -> list[str]:
        gaps: list[str] = []
        if matches and not any(item.breakdown.city_pass for item in matches):
            gaps.append("target city differs from many openings")
        if matches and not any(item.breakdown.experience_pass for item in matches):
            gaps.append("experience is below many job thresholds")
        if matches and not any(item.breakdown.language_pass for item in matches):
            gaps.append("language requirements may need attention")
        return gaps[:6]

    @staticmethod
    def _infer_literacy_gaps(resume_data: ResumeParseResponse) -> list[str]:
        gaps: list[str] = []
        if not resume_data.profile.notes:
            gaps.append("soft-skill evidence is weak in the resume")
        if len(resume_data.hard_conditions.languages) < 2:
            gaps.append("cross-context communication evidence is limited")
        return gaps[:6]

    @staticmethod
    def _infer_potential_gaps(resume_data: ResumeParseResponse, avg_match: float) -> list[str]:
        gaps: list[str] = []
        if not resume_data.structured_resume.projects:
            gaps.append("project evidence is missing")
        if avg_match < 65:
            gaps.append("transferability to target roles is still weak")
        return gaps[:6]

    @staticmethod
    def _build_transition_reason(source_role: str, target_role: str, target_family: str, bridge_skills: list[str]) -> str:
        top_skills = "、".join(bridge_skills[:3]) if bridge_skills else "现有通用能力"
        family_map = {
            "engineering": f"{source_role} 与 {target_role} 在 {top_skills} 等方面存在可迁移基础，若补足工程实现与项目证据，转岗路径较清晰。",
            "testing": f"{source_role} 与 {target_role} 在 {top_skills} 等方面具备共通基础，若加强测试验证与问题闭环能力，更容易完成过渡。",
            "product": f"{source_role} 与 {target_role} 在 {top_skills} 等方面有较强共性，若继续增强需求拆解和方案表达，转岗会更自然。",
            "operations": f"{source_role} 与 {target_role} 在 {top_skills} 等方面具备迁移基础，若补足数据意识与结果复盘能力，可形成稳定转岗路径。",
            "customer_service": f"{source_role} 与 {target_role} 在 {top_skills} 等方面具有服务型岗位共性，若加强响应效率与问题跟进，会更适配目标岗位。",
            "implementation": f"{source_role} 与 {target_role} 在 {top_skills} 等方面具备实施交付共性，若补足客户沟通与场景支持经验，转岗可行性较高。",
            "sales": f"{source_role} 与 {target_role} 在 {top_skills} 等方面能够形成业务转化基础，若继续增强客户拓展和方案表达，会更有说服力。",
            "assistant": f"{source_role} 与 {target_role} 在 {top_skills} 等方面具备支持型岗位共性，若继续强化组织协调与执行跟进能力，转岗会更顺畅。",
        }
        return family_map.get(
            target_family,
            f"{source_role} 与 {target_role} 在 {top_skills} 等方面具备可迁移基础，通过补足少量岗位专项能力后，可以形成较自然的转岗路径。",
        )

    @staticmethod
    def _build_transition_actions(
        source_role: str,
        target_role: str,
        target_family: str,
        bridge_skills: list[str],
    ) -> list[str]:
        top_skills = "、".join(bridge_skills[:2]) if bridge_skills else "核心能力"
        family_map = {
            "engineering": [
                f"把 {source_role} 中可迁移的项目经历改写成更贴近 {target_role} 的工程成果表达，突出 {top_skills}。",
                "补足代码实现、调试、部署或性能优化等目标岗位更看重的专项能力。",
                "准备 1-2 个能体现问题定位、实现过程与结果的技术面试案例。",
            ],
            "testing": [
                f"把 {source_role} 中的相关经历改写成测试验证、问题发现与闭环处理案例，突出 {top_skills}。",
                "补足用例设计、缺陷管理、回归验证等更贴近测试岗位的能力证明。",
                "准备 1-2 个能体现问题发现、定位与推进修复的面试故事。",
            ],
            "product": [
                f"把 {source_role} 中的经历改写成需求拆解、方案设计与推进落地案例，突出 {top_skills}。",
                "补足目标岗位所需的业务分析、方案表达与跨团队协作证明材料。",
                "准备 1-2 个能体现问题、决策、推进与结果的产品案例。",
            ],
            "operations": [
                f"把 {source_role} 中的实践改写成指标优化、流程提升或活动复盘案例，突出 {top_skills}。",
                "补足运营岗位更关注的数据分析、执行节奏与结果闭环能力。",
                "准备 1-2 个能体现目标拆解、动作执行与结果提升的案例。",
            ],
            "customer_service": [
                f"把 {source_role} 中的经历改写成客户响应、问题跟进和服务闭环案例，突出 {top_skills}。",
                "补足客服岗位更关注的话术沟通、投诉处理和满意度提升材料。",
                "准备 1-2 个能体现沟通耐心、问题解决与用户反馈的案例。",
            ],
            "implementation": [
                f"把 {source_role} 中的经历改写成客户培训、问题排查或交付支持案例，突出 {top_skills}。",
                "补足实施岗位更看重的场景支持、演示讲解与交付闭环能力。",
                "准备 1-2 个能体现客户沟通、实施推进与问题解决的案例。",
            ],
            "sales": [
                f"把 {source_role} 中的经历改写成客户需求识别、方案沟通和结果转化案例，突出 {top_skills}。",
                "补足销售岗位更关注的客户拓展、商务跟进与结果驱动能力。",
                "准备 1-2 个能体现需求洞察、推进成交与客户维护的案例。",
            ],
            "assistant": [
                f"把 {source_role} 中的经历改写成组织协调、资料整理和任务跟进案例，突出 {top_skills}。",
                "补足助理岗位更关注的支持效率、信息准确与执行细致度证明材料。",
                "准备 1-2 个能体现多任务协同、会议支持与事项闭环的案例。",
            ],
        }
        return family_map.get(
            target_family,
            [
                f"把已有经历改写成更贴近 {target_role} 的项目表达，突出 {top_skills}。",
                f"补足 {target_role} 所需的专项技能与业务理解，形成岗位化案例。",
                "准备 1-2 段能体现问题、行动与结果的面试故事，增强转岗说服力。",
            ],
        )

    @staticmethod
    def _average(values) -> float:
        values = list(values)
        if not values:
            return 0.0
        return sum(values) / len(values)
