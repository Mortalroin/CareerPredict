from __future__ import annotations

import json
import re
from collections import OrderedDict
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.schemas.resume import (
    ResumeHardConditions,
    ResumeParseResponse,
    ResumeProfile,
    ResumeBasics,
    ResumeDerived,
    ResumeEducation,
    ResumeJobIntention,
    ResumeLanguage,
    ResumeProject,
    ResumeProfileSection,
    ResumeSkills,
    ResumeSoftConditions,
    ResumeVectorizationPayload,
    ResumeWorkExperience,
    StructuredResume,
)
from app.services.file_extractors import FileExtractorService
from app.services.llm_service import LLMService


DEGREE_LEVELS = {
    "high_school": 1,
    "vocational": 2,
    "college": 3,
    "bachelor": 4,
    "master": 5,
    "phd": 6,
}


class ResumeParserService:
    def __init__(self) -> None:
        self.file_extractor = FileExtractorService()
        self.llm_service = LLMService()

    async def parse_resume(
        self,
        upload: UploadFile,
        target_role: str = "",
        city: str = "",
        notes: str = "",
        resume_id: str = "",
    ) -> ResumeParseResponse:
        await self._validate_file(upload)

        extracted_text = self._normalize_text(await self.file_extractor.extract_text(upload))
        profile = self._build_profile(
            text=extracted_text,
            target_role=target_role,
            city=city,
            notes=notes,
        )
        profile = self._enrich_profile_with_llm(extracted_text, profile)
        embedding_text = self._build_embedding_text(profile)
        hard_conditions = self._build_hard_conditions(profile)
        soft_conditions = self._build_soft_conditions(profile, embedding_text)
        structured_resume = self._build_structured_resume(
            resume_id=resume_id,
            filename=upload.filename or "unknown",
            content_type=upload.content_type or "application/octet-stream",
            extracted_text=extracted_text,
            profile=profile,
            hard_conditions=hard_conditions,
            soft_conditions=soft_conditions,
            embedding_text=embedding_text,
        )
        vectorization_payload = self._build_vectorization_payload(
            structured_resume=structured_resume,
            hard_conditions=hard_conditions,
            soft_conditions=soft_conditions,
            embedding_text=embedding_text,
        )

        return ResumeParseResponse(
            filename=upload.filename or "unknown",
            content_type=upload.content_type or "application/octet-stream",
            text_length=len(extracted_text),
            extracted_text=extracted_text,
            profile=profile,
            structured_resume=structured_resume,
            hard_conditions=hard_conditions,
            soft_conditions=soft_conditions,
            vectorization_payload=vectorization_payload,
            embedding_text=embedding_text,
        )

    async def _validate_file(self, upload: UploadFile) -> None:
        contents = await upload.read()
        await upload.seek(0)

        max_bytes = settings.max_file_size_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise ValueError(f"File exceeds the {settings.max_file_size_mb} MB size limit.")

    def _build_profile(
        self,
        text: str,
        target_role: str,
        city: str,
        notes: str,
    ) -> ResumeProfile:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        candidate_name = self._extract_candidate_name(lines)
        email = self._extract_email(text)
        phone = self._extract_phone(text)
        education_level, education_level_raw = self._extract_education_level(text)
        graduation_school = self._extract_graduation_school(text)
        years_experience = self._extract_years_experience(text)
        target_roles = self._extract_target_roles(text, target_role)
        resolved_target_role = target_role or (target_roles[0] if target_roles else "")
        current_city = self._extract_current_city(text)
        resolved_target_city = city or self._extract_target_city(text) or current_city
        languages = self._extract_languages(text)
        skills = self._extract_skills(text)
        work_experience = self._extract_work_experience(lines)
        project_experience = self._extract_projects(lines)
        summary = self._build_summary(
            candidate_name=candidate_name,
            education_level=education_level,
            years_experience=years_experience,
            skills=skills,
            target_role=resolved_target_role,
            target_city=resolved_target_city,
        )

        return ResumeProfile(
            candidate_name=candidate_name,
            email=email,
            phone=phone,
            education_level=education_level,
            education_level_raw=education_level_raw,
            education_level_score=DEGREE_LEVELS.get(education_level, 0),
            graduation_school=graduation_school,
            target_role=resolved_target_role,
            target_roles=target_roles,
            target_city=resolved_target_city,
            current_city=current_city,
            years_experience=years_experience,
            languages=languages,
            skills=skills,
            project_experience=project_experience,
            work_experience=work_experience,
            certificates=[],
            strengths=[],
            summary=summary,
            notes=notes,
        )

    def _build_hard_conditions(self, profile: ResumeProfile) -> ResumeHardConditions:
        target_cities = [profile.target_city] if profile.target_city else []
        return ResumeHardConditions(
            highest_degree_label=profile.education_level,
            highest_degree_level=profile.education_level_score,
            total_years_experience=profile.years_experience,
            target_roles=profile.target_roles or ([profile.target_role] if profile.target_role else []),
            target_cities=target_cities,
            languages=profile.languages,
            current_city=profile.current_city,
        )

    def _enrich_profile_with_llm(self, text: str, profile: ResumeProfile) -> ResumeProfile:
        if not self.llm_service.enabled:
            return profile

        payload = {
            "candidate_name": profile.candidate_name,
            "education_level": profile.education_level,
            "graduation_school": profile.graduation_school,
            "target_role": profile.target_role,
            "target_roles": profile.target_roles,
            "target_city": profile.target_city,
            "current_city": profile.current_city,
            "years_experience": profile.years_experience,
            "languages": profile.languages,
            "skills": profile.skills,
            "work_experience": profile.work_experience[:8],
            "project_experience": [
                {
                    "name": item.name,
                    "description": item.description,
                    "keywords": item.keywords,
                }
                for item in profile.project_experience[:5]
            ],
            "notes": profile.notes,
        }
        user_prompt = "\n".join(
            [
                "Return JSON only.",
                "Allowed keys: target_roles, target_city, current_city, years_experience, skills, certificates, strengths, summary.",
                "Keep every value faithful to the resume and concise.",
                "Current parsed profile:",
                json.dumps(payload, ensure_ascii=False),
                "Raw resume text:",
                text[:6000],
            ]
        )
        result = self.llm_service.generate_text(
            system_prompt=(
                "You are an expert Chinese resume parser for career planning. "
                "Improve structured parsing without inventing facts."
            ),
            user_prompt=user_prompt,
            temperature=0.1,
            max_output_tokens=900,
        )
        if not result:
            return profile

        enriched = self._parse_llm_json(result.content)
        if not enriched:
            return profile

        target_roles = list(
            OrderedDict.fromkeys(
                profile.target_roles + self._ensure_string_list(enriched.get("target_roles"))
            )
        )
        merged_skills = list(
            OrderedDict.fromkeys(
                profile.skills + self._ensure_string_list(enriched.get("skills"))
            )
        )[:30]

        return profile.model_copy(
            update={
                "target_roles": target_roles,
                "target_role": profile.target_role or (target_roles[0] if target_roles else ""),
                "target_city": str(enriched.get("target_city") or profile.target_city or "").strip(),
                "current_city": str(enriched.get("current_city") or profile.current_city or "").strip(),
                "years_experience": self._safe_float(enriched.get("years_experience"), profile.years_experience),
                "skills": merged_skills,
                "certificates": self._ensure_string_list(enriched.get("certificates"))[:10],
                "strengths": self._ensure_string_list(enriched.get("strengths"))[:10],
                "summary": str(enriched.get("summary") or profile.summary or "").strip() or profile.summary,
            }
        )

    def _build_soft_conditions(
        self,
        profile: ResumeProfile,
        embedding_text: str,
    ) -> ResumeSoftConditions:
        project_keywords = list(
            OrderedDict.fromkeys(
                keyword
                for project in profile.project_experience
                for keyword in project.keywords
            )
        )
        work_keywords = self._extract_keywords_from_lines(profile.work_experience)
        tool_skills = [skill for skill in profile.skills if skill in self._tool_skill_set()]
        core_skills = [skill for skill in profile.skills if skill not in self._tool_skill_set()]
        domain_tags = self._build_domain_tags(profile)

        return ResumeSoftConditions(
            core_skills=core_skills,
            tool_skills=tool_skills,
            domain_tags=domain_tags,
            work_keywords=work_keywords,
            project_keywords=project_keywords,
            summary=profile.summary,
            embedding_text=embedding_text,
        )

    def _build_structured_resume(
        self,
        resume_id: str,
        filename: str,
        content_type: str,
        extracted_text: str,
        profile: ResumeProfile,
        hard_conditions: ResumeHardConditions,
        soft_conditions: ResumeSoftConditions,
        embedding_text: str,
    ) -> StructuredResume:
        education = [
            ResumeEducation(
                school=profile.graduation_school,
                degree_name_raw=profile.education_level_raw,
                degree_label=profile.education_level,
                degree_level=profile.education_level_score,
            )
        ] if any([profile.graduation_school, profile.education_level, profile.education_level_raw]) else []

        projects = [
            ResumeProject(
                name=item.name,
                description=item.description,
                keywords=item.keywords,
            )
            for item in profile.project_experience
        ]

        work_experience = []
        for item in profile.work_experience:
            work_experience.append(
                ResumeWorkExperience(
                    responsibilities=[item],
                    keywords=self._extract_keywords_from_lines([item]),
                )
            )

        return StructuredResume(
            resume_id=resume_id or f"resume_{uuid4().hex[:12]}",
            source_filename=filename,
            content_type=content_type,
            raw_text=extracted_text,
            basics=ResumeBasics(
                name=profile.candidate_name,
                phone=profile.phone,
                email=profile.email,
                current_city=profile.current_city,
                hukou_city=profile.current_city,
            ),
            job_intention=ResumeJobIntention(
                target_roles=hard_conditions.target_roles,
                target_city=hard_conditions.target_cities,
            ),
            education=education,
            work_experience=work_experience,
            projects=projects,
            skills=ResumeSkills(
                domain_skills=soft_conditions.core_skills,
                technical_skills=[],
                tools=soft_conditions.tool_skills,
                office_tools=[],
                certificates=profile.certificates,
                languages=[ResumeLanguage(name=item, level="") for item in hard_conditions.languages],
            ),
            profile=ResumeProfileSection(
                summary=profile.summary,
                self_evaluation=profile.notes,
                strengths=profile.strengths,
                interests=[],
            ),
            derived=ResumeDerived(
                highest_degree_label=hard_conditions.highest_degree_label,
                highest_degree_level=hard_conditions.highest_degree_level,
                total_years_experience=hard_conditions.total_years_experience,
                latest_position=hard_conditions.target_roles[0] if hard_conditions.target_roles else "",
                latest_company="",
                core_skills=soft_conditions.core_skills,
                role_tags=soft_conditions.domain_tags,
                industry_tags=[],
                city_tags=hard_conditions.target_cities,
                qualification_tags=self._build_qualification_tags(hard_conditions),
                embedding_text=embedding_text,
            ),
        )

    @staticmethod
    def _build_qualification_tags(hard_conditions: ResumeHardConditions) -> list[str]:
        tags: list[str] = []
        if hard_conditions.highest_degree_level >= DEGREE_LEVELS["bachelor"]:
            tags.append("bachelor_or_above")
        if hard_conditions.highest_degree_level >= DEGREE_LEVELS["master"]:
            tags.append("master_or_above")
        if hard_conditions.total_years_experience >= 3:
            tags.append("3_plus_years_experience")
        if hard_conditions.total_years_experience >= 5:
            tags.append("5_plus_years_experience")
        tags.extend(f"language_{item}" for item in hard_conditions.languages)
        return tags

    @staticmethod
    def _build_vectorization_payload(
        structured_resume: StructuredResume,
        hard_conditions: ResumeHardConditions,
        soft_conditions: ResumeSoftConditions,
        embedding_text: str,
    ) -> ResumeVectorizationPayload:
        return ResumeVectorizationPayload(
            hard_filter_fields=hard_conditions,
            soft_match_fields=soft_conditions,
            embedding_text=embedding_text,
            metadata={
                "resume_id": structured_resume.resume_id,
                "name": structured_resume.basics.name,
                "highest_degree_level": hard_conditions.highest_degree_level,
                "highest_degree_label": hard_conditions.highest_degree_label,
                "total_years_experience": hard_conditions.total_years_experience,
                "current_city": hard_conditions.current_city,
                "target_roles": hard_conditions.target_roles,
                "target_cities": hard_conditions.target_cities,
                "domain_tags": soft_conditions.domain_tags,
            },
        )

    @staticmethod
    def _normalize_text(text: str) -> str:
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        normalized = re.sub(r"[ \t]{2,}", " ", normalized)
        normalized = re.sub(r"(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])", "", normalized)
        normalized = re.sub(r"(?<=\d)\s*([./-])\s*(?=\d)", r"\1", normalized)
        normalized = re.sub(r"(?<=\d)\s+(?=\d)", "", normalized)
        return normalized.strip()

    def _extract_candidate_name(self, lines: list[str]) -> str:
        if not lines:
            return ""

        label_patterns = {
            "\u59d3\u540d": re.compile(r"^\u59d3\u540d[:\uff1a]?\s*(.+)?$"),
            "name": re.compile(r"^name[:\uff1a]?\s*(.+)?$", re.IGNORECASE),
        }

        for index, line in enumerate(lines[:8]):
            for _, pattern in label_patterns.items():
                match = pattern.match(line)
                if match:
                    inline_value = (match.group(1) or "").strip()
                    if inline_value:
                        return inline_value
                    if index + 1 < len(lines):
                        next_line = lines[index + 1].strip()
                        if next_line and len(next_line) <= 20:
                            return next_line

        first_line = lines[0]
        if len(first_line) <= 40 and not re.search(r"@|\d{5,}", first_line):
            return first_line
        return ""

    @staticmethod
    def _extract_email(text: str) -> str:
        match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
        return match.group(0) if match else ""

    @staticmethod
    def _extract_phone(text: str) -> str:
        patterns = [
            r"(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)",
            r"(?<!\d)\d{3}[- ]?\d{3}[- ]?\d{4}(?!\d)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        return ""

    @staticmethod
    def _extract_labeled_values(
        text: str,
        labels: list[str],
        stop_labels: list[str] | None = None,
    ) -> list[str]:
        label_pattern = "|".join(re.escape(label) for label in labels)
        stop_pattern = "|".join(re.escape(label) for label in (stop_labels or labels))
        values: list[str] = []

        inline_pattern = re.compile(
            rf"(?:{label_pattern})\s*(?:[:\uff1a\-]\s*|\s+)([^\n\r,，;；|]+)",
            re.IGNORECASE,
        )
        for match in inline_pattern.finditer(text):
            value = match.group(1).strip()
            if stop_pattern:
                value = re.split(
                    rf"\s*(?:{stop_pattern})\s*[:\uff1a\-]?",
                    value,
                    maxsplit=1,
                    flags=re.IGNORECASE,
                )[0]
            value = value.strip(" \t:-\uff1a")
            if value:
                values.append(value)

        lines = [line.strip() for line in text.splitlines() if line.strip()]
        line_pattern = re.compile(rf"^(?:{label_pattern})\s*[:\uff1a\-]?\s*$", re.IGNORECASE)
        for index, line in enumerate(lines[:-1]):
            if line_pattern.match(line):
                value = lines[index + 1].strip(" \t:-\uff1a")
                if value:
                    values.append(value)

        return list(OrderedDict.fromkeys(values))

    @staticmethod
    def _match_degree_keyword(text: str) -> tuple[str, str]:
        candidates = [
            ("phd", ["ph.d", "phd", "doctor", "doctorate", "\u535a\u58eb\u7814\u7a76\u751f", "\u535a\u58eb"]),
            (
                "master",
                [
                    "master",
                    "graduate",
                    "mba",
                    "emba",
                    "\u7855\u58eb\u7814\u7a76\u751f",
                    "\u7814\u7a76\u751f",
                    "\u7855\u58eb",
                ],
            ),
            (
                "bachelor",
                [
                    "bachelor",
                    "undergraduate",
                    "\u5927\u5b66\u672c\u79d1",
                    "\u7edf\u62db\u672c\u79d1",
                    "\u4e13\u5347\u672c",
                    "\u672c\u79d1",
                    "\u5b66\u58eb",
                ],
            ),
            ("college", ["college", "associate", "\u5927\u5b66\u4e13\u79d1", "\u5927\u4e13", "\u4e13\u79d1", "\u9ad8\u804c"]),
            ("vocational", ["vocational", "\u4e2d\u4e13", "\u4e2d\u6280", "\u804c\u9ad8", "\u6280\u6821"]),
            ("high_school", ["high school", "\u9ad8\u4e2d"]),
        ]
        lower_text = text.lower()
        for label, keywords in candidates:
            for keyword in keywords:
                if keyword in lower_text:
                    return label, keyword
        return "", ""

    @staticmethod
    def _extract_education_level(text: str) -> tuple[str, str]:
        labels = [
            "\u5b66\u5386\u5c42\u6b21",
            "\u6700\u9ad8\u5b66\u5386",
            "\u5b66\u5386",
            "\u6559\u80b2\u7a0b\u5ea6",
            "\u6559\u80b2\u6c34\u5e73",
            "\u5b66\u4f4d",
            "education level",
            "education",
            "degree",
        ]
        stop_labels = labels + [
            "\u5de5\u4f5c\u5e74\u9650",
            "\u5de5\u4f5c\u7ecf\u9a8c",
            "\u5f53\u524d\u57ce\u5e02",
            "\u73b0\u5c45\u57ce\u5e02",
            "\u6240\u5728\u57ce\u5e02",
        ]
        for value in ResumeParserService._extract_labeled_values(text, labels, stop_labels):
            label, keyword = ResumeParserService._match_degree_keyword(value)
            if label:
                return label, keyword

        return ResumeParserService._match_degree_keyword(text)

    @staticmethod
    def _extract_graduation_school(text: str) -> str:
        patterns = [
            r"([A-Za-z][A-Za-z .,&-]{2,60}(?:University|College|Institute|School))",
            r"([\u4e00-\u9fff]{2,20}(?:\u5927\u5b66|\u5b66\u9662))",
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        return ""

    @staticmethod
    def _extract_years_experience(text: str) -> float:
        labels = [
            "\u5de5\u4f5c\u5e74\u9650",
            "\u5de5\u4f5c\u5e74\u8d44",
            "\u7ecf\u9a8c\u5e74\u9650",
            "\u76f8\u5173\u7ecf\u9a8c",
            "\u5de5\u4f5c\u7ecf\u9a8c",
            "\u5de5\u4f5c\u7ecf\u5386",
            "\u4ece\u4e1a\u5e74\u9650",
            "\u5de5\u4f5c\u65f6\u957f",
            "years experience",
            "years of experience",
            "experience",
        ]
        stop_labels = labels + [
            "\u5b66\u5386\u5c42\u6b21",
            "\u6700\u9ad8\u5b66\u5386",
            "\u5f53\u524d\u57ce\u5e02",
            "\u73b0\u5c45\u57ce\u5e02",
            "\u6240\u5728\u57ce\u5e02",
        ]
        values: list[float] = []
        for value in ResumeParserService._extract_labeled_values(text, labels, stop_labels):
            parsed = ResumeParserService._parse_years_value(value)
            if parsed is not None:
                values.append(parsed)

        patterns = [
            r"(?:\u5de5\u4f5c\u5e74\u9650|\u5de5\u4f5c\u5e74\u8d44|\u7ecf\u9a8c\u5e74\u9650|\u4ece\u4e1a\u5e74\u9650|\u5de5\u4f5c\u7ecf\u9a8c|\u76f8\u5173\u7ecf\u9a8c|experience)\s*[:\uff1a\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:\u5e74|years|year)?",
            r"(\d+(?:\.\d+)?)\+?\s*(?:years|year)\s+of\s+experience",
            r"experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:years|year)",
            r"(\d+(?:\.\d+)?)\s*\u5e74(?:\u7684)?(?:[\u4e2d-\u9fff]{0,12})\u7ecf\u9a8c",
        ]
        lower_text = text.lower()
        for pattern in patterns:
            for match in re.findall(pattern, lower_text):
                try:
                    values.append(float(match))
                except ValueError:
                    continue

        chinese_years_pattern = r"([一二两三四五六七八九十]{1,3})\s*\u5e74(?:\u4ee5\u4e0a|\u5de6\u53f3|\u7684)?(?:[\u4e2d-\u9fff]{0,12})?(?:\u7ecf\u9a8c|\u7ecf\u5386|\u5e74\u9650)?"
        for match in re.findall(chinese_years_pattern, text):
            parsed = ResumeParserService._chinese_number_to_float(match)
            if parsed is not None:
                values.append(parsed)

        range_pattern = r"(20\d{2})\s*[-/~\u2013\u2014\u81f3]\s*(20\d{2}|present|now|\u81f3\u4eca)"
        matches = re.findall(range_pattern, lower_text)
        if matches:
            years = 0
            for start, end in matches:
                end_year = 2026 if end in {"present", "now", "\u81f3\u4eca"} else int(end)
                years += max(end_year - int(start), 0)
            if years > 0:
                values.append(float(years))

        return max(values) if values else 0.0

    @staticmethod
    def _parse_years_value(value: str) -> float | None:
        normalized = value.strip().lower()
        if not normalized:
            return None

        if re.search(r"\u534a\u5e74", normalized):
            return 0.5

        if re.search(r"\u5e94\u5c4a|\u5728\u6821|\u65e0\u7ecf\u9a8c|\u6682\u65e0|\u4e0d\u9650", normalized):
            return 0.0

        numbers = [float(item) for item in re.findall(r"\d+(?:\.\d+)?", normalized)]
        if numbers:
            return max(numbers)

        chinese_numbers = re.findall(r"[一二两三四五六七八九十]{1,3}", value)
        parsed_numbers = [
            parsed
            for item in chinese_numbers
            if (parsed := ResumeParserService._chinese_number_to_float(item)) is not None
        ]
        if parsed_numbers:
            return max(parsed_numbers)

        return None

    @staticmethod
    def _chinese_number_to_float(value: str) -> float | None:
        digits = {
            "\u96f6": 0,
            "\u4e00": 1,
            "\u4e8c": 2,
            "\u4e24": 2,
            "\u4e09": 3,
            "\u56db": 4,
            "\u4e94": 5,
            "\u516d": 6,
            "\u4e03": 7,
            "\u516b": 8,
            "\u4e5d": 9,
        }
        value = value.strip()
        if not value:
            return None

        if "\u5341" not in value:
            total = 0
            for char in value:
                if char not in digits:
                    return None
                total = total * 10 + digits[char]
            return float(total)

        left, _, right = value.partition("\u5341")
        tens = digits.get(left, 1) if left else 1
        ones = digits.get(right, 0) if right else 0
        return float(tens * 10 + ones)

    def _extract_target_roles(self, text: str, target_role: str) -> list[str]:
        roles: list[str] = []
        if target_role:
            roles.extend(self._split_role_candidates(target_role))

        section_pattern = re.compile(
            r"^\s*(?:\u610f\u5411\u804c\u4f4d|\u76ee\u6807\u5c97\u4f4d|\u6c42\u804c\u610f\u5411|target role)[:\uff1a]?\s*(.*)",
            re.IGNORECASE,
        )
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for index, line in enumerate(lines):
            match = section_pattern.match(line)
            if not match:
                continue
            value = match.group(1).strip()
            if not value and index + 1 < len(lines):
                value = lines[index + 1].strip()
            roles.extend(self._split_role_candidates(value))
            if len(roles) >= 8:
                break

        return list(OrderedDict.fromkeys([role for role in roles if role]))

    @staticmethod
    def _split_role_candidates(text: str) -> list[str]:
        normalized = (
            text.replace("\n", "/")
            .replace("|", "/")
            .replace(",", "/")
            .replace("\uff0c", "/")
            .replace("\u3001", "/")
            .replace(";", "/")
            .replace("\uff1b", "/")
        )
        parts = re.split(r"[\\/]", normalized)
        return [part.strip() for part in parts if part.strip()]

    @staticmethod
    def _extract_current_city(text: str) -> str:
        labels = [
            "\u5f53\u524d\u57ce\u5e02",
            "\u6240\u5728\u57ce\u5e02",
            "\u5c45\u4f4f\u57ce\u5e02",
            "\u73b0\u5c45\u57ce\u5e02",
            "\u73b0\u5c45\u5730",
            "\u73b0\u5c45",
            "\u6240\u5728\u5730",
            "\u5c45\u4f4f\u5730",
            "\u5e38\u4f4f\u5730",
            "\u6237\u7c4d",
            "\u6237\u53e3\u6240\u5728\u5730",
            "current city",
            "current location",
        ]
        stop_labels = labels + [
            "\u5b66\u5386\u5c42\u6b21",
            "\u6700\u9ad8\u5b66\u5386",
            "\u5de5\u4f5c\u5e74\u9650",
            "\u5de5\u4f5c\u7ecf\u9a8c",
            "\u76ee\u6807\u57ce\u5e02",
            "\u610f\u5411\u57ce\u5e02",
            "\u671f\u671b\u57ce\u5e02",
            "\u5de5\u4f5c\u5730\u70b9",
        ]
        for value in ResumeParserService._extract_labeled_values(text, labels, stop_labels):
            city = ResumeParserService._clean_city_value(value)
            if city:
                return city

        patterns = [
            r"(?:\u6237\u7c4d|户籍)[:\uff1a]?\s*([\u4e00-\u9fff]{2,12})",
            r"(?:\u73b0\u5c45\u5730|\u73b0\u5c45\u57ce\u5e02|\u73b0\u5c45|所在地)[:\uff1a]?\s*([\u4e00-\u9fff]{2,12})",
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        return ""

    @staticmethod
    def _extract_target_city(text: str) -> str:
        patterns = [
            r"(?:\u610f\u5411\u57ce\u5e02|\u671f\u671b\u57ce\u5e02|工作地点|target city)[:\uff1a]?\s*([\u4e00-\u9fff]{2,12})",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return ""

    @staticmethod
    def _clean_city_value(value: str) -> str:
        stop_words = [
            "\u5e74\u9f84",
            "\u6027\u522b",
            "\u5a5a\u59fb\u72b6\u51b5",
            "\u6c11\u65cf",
            "\u5b66\u5386\u5c42\u6b21",
            "\u6700\u9ad8\u5b66\u5386",
            "\u5de5\u4f5c\u5e74\u9650",
            "\u5de5\u4f5c\u7ecf\u9a8c",
            "\u76ee\u6807\u57ce\u5e02",
            "\u610f\u5411\u57ce\u5e02",
            "\u671f\u671b\u57ce\u5e02",
        ]
        blocked = {
            "\u5f53\u524d\u57ce\u5e02",
            "\u6240\u5728\u57ce\u5e02",
            "\u5b66\u5386\u5c42\u6b21",
            "\u5de5\u4f5c\u5e74\u9650",
            "\u5de5\u4f5c\u7ecf\u9a8c",
        }
        cleaned = re.split(r"[,，;；|/]", value.strip(), maxsplit=1)[0]
        cleaned = re.split("|".join(re.escape(word) for word in stop_words), cleaned, maxsplit=1)[0]
        cleaned = cleaned.strip(" \t:-\uff1a")

        match = re.search(r"[\u4e00-\u9fff]{2,12}", cleaned)
        if match:
            city = match.group(0)
            return "" if city in blocked else city

        match = re.search(r"[A-Za-z][A-Za-z .'-]{1,40}", cleaned)
        if match:
            return match.group(0).strip()

        return ""

    @staticmethod
    def _extract_languages(text: str) -> list[str]:
        language_map = OrderedDict(
            [
                ("mandarin", ["\u666e\u901a\u8bdd", "mandarin"]),
                ("cantonese", ["\u7ca4\u8bed", "cantonese"]),
                ("english", ["\u82f1\u8bed", "english"]),
                ("japanese", ["\u65e5\u8bed", "japanese"]),
                ("korean", ["\u97e9\u8bed", "korean"]),
            ]
        )
        lower_text = text.lower()
        found = [
            label
            for label, keywords in language_map.items()
            if any(keyword in lower_text for keyword in keywords)
        ]
        return found

    @staticmethod
    def _extract_skills(text: str) -> list[str]:
        skill_keywords = [
            "python",
            "java",
            "c++",
            "javascript",
            "typescript",
            "react",
            "next.js",
            "vue",
            "fastapi",
            "flask",
            "django",
            "mysql",
            "postgresql",
            "sqlite",
            "redis",
            "docker",
            "kubernetes",
            "git",
            "linux",
            "pandas",
            "numpy",
            "scikit-learn",
            "pytorch",
            "xgboost",
            "lightgbm",
            "spark",
            "hive",
            "tableau",
            "power bi",
            "finebi",
            "figma",
            "llm",
            "ai",
            "machine learning",
            "deep learning",
            "rag",
            "langchain",
            "chromadb",
            "sql",
            "word",
            "excel",
            "photoshop",
            "cad",
            "\u5ba2\u6237\u670d\u52a1",
            "\u8ba2\u5355\u8ddf\u5355",
            "\u62a5\u5173",
            "\u51fa\u8d27\u5b89\u6392",
            "\u56de\u6b3e",
            "\u6295\u8bc9\u5904\u7406",
            "\u5916\u8d38",
            "\u6570\u636e\u5206\u6790",
            "\u5546\u4e1a\u5206\u6790",
            "\u7ecf\u8425\u5206\u6790",
            "\u589e\u957f\u5206\u6790",
            "\u7528\u6237\u589e\u957f",
            "\u6307\u6807\u4f53\u7cfb",
            "\u6f0f\u6597\u5206\u6790",
            "\u7559\u5b58\u5206\u6790",
            "\u7528\u6237\u5206\u7fa4",
            "\u7528\u6237\u753b\u50cf",
            "\u63a8\u8350\u7cfb\u7edf",
            "\u673a\u5668\u5b66\u4e60",
            "\u6df1\u5ea6\u5b66\u4e60",
            "\u6570\u636e\u6316\u6398",
            "\u81ea\u7136\u8bed\u8a00\u5904\u7406",
            "\u4ea7\u54c1\u89c4\u5212",
            "\u9700\u6c42\u5206\u6790",
            "\u9879\u76ee\u7ba1\u7406",
            "a/b\u6d4b\u8bd5",
            "ab\u6d4b\u8bd5",
            "cohort",
            "ltv",
            "roi",
            "cac",
        ]
        lower_text = text.lower()
        found = [skill for skill in skill_keywords if skill in lower_text]
        unique = list(OrderedDict.fromkeys(found))
        return unique[:40]

    @staticmethod
    def _extract_work_experience(lines: list[str]) -> list[str]:
        experience_lines: list[str] = []
        experience_pattern = re.compile(
            r"(20\d{2}).{0,12}(20\d{2}|present|now|\u81f3\u4eca)|"
            r"(?:\u62c5\u4efb\u804c\u4f4d|岗位类别|工作描述)[:\uff1a]?",
            re.IGNORECASE,
        )

        for line in lines:
            if experience_pattern.search(line):
                experience_lines.append(line)

        return experience_lines[:12]

    def _extract_projects(self, lines: list[str]) -> list[ResumeProject]:
        projects: list[ResumeProject] = []
        project_keywords = (
            "project",
            "system",
            "platform",
            "website",
            "app",
            "product",
            "\u9879\u76ee",
        )

        for index, line in enumerate(lines):
            lower_line = line.lower()
            if any(keyword in lower_line for keyword in project_keywords):
                description = lines[index + 1] if index + 1 < len(lines) else ""
                keywords = self._extract_keywords_from_lines([line, description])
                projects.append(
                    ResumeProject(
                        name=line[:120],
                        description=description[:240],
                        keywords=keywords[:8],
                    )
                )

        return projects[:5]

    @staticmethod
    def _build_summary(
        candidate_name: str,
        education_level: str,
        years_experience: float,
        skills: list[str],
        target_role: str,
        target_city: str,
    ) -> str:
        skill_summary = ", ".join(skills[:8])
        return (
            f"{candidate_name or 'Candidate'} with {years_experience:g} years of experience. "
            f"Education level: {education_level or 'unknown'}. "
            f"Target role: {target_role or 'not specified'}. "
            f"Target city: {target_city or 'not specified'}. "
            f"Key skills: {skill_summary or 'not identified'}."
        )

    @staticmethod
    def _parse_llm_json(content: str) -> dict | None:
        raw = content.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?", "", raw).strip()
            raw = re.sub(r"```$", "", raw).strip()
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None

    @staticmethod
    def _ensure_string_list(value) -> list[str]:
        if not isinstance(value, list):
            return []
        items: list[str] = []
        for entry in value:
            if isinstance(entry, str):
                text = entry.strip()
                if text:
                    items.append(text)
        return items

    @staticmethod
    def _safe_float(value, fallback: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return fallback

    @staticmethod
    def _build_embedding_text(profile: ResumeProfile) -> str:
        project_names = ", ".join(project.name for project in profile.project_experience[:3])
        work_items = ", ".join(profile.work_experience[:3])
        skill_summary = ", ".join(profile.skills)
        role_summary = ", ".join(profile.target_roles or ([profile.target_role] if profile.target_role else []))
        language_summary = ", ".join(profile.languages)

        return " | ".join(
            [
                f"candidate={profile.candidate_name or 'unknown'}",
                f"education={profile.education_level or 'unknown'}",
                f"years_experience={profile.years_experience:g}",
                f"target_roles={role_summary or 'unknown'}",
                f"target_city={profile.target_city or 'unknown'}",
                f"current_city={profile.current_city or 'unknown'}",
                f"languages={language_summary or 'unknown'}",
                f"skills={skill_summary or 'unknown'}",
                f"projects={project_names or 'unknown'}",
                f"work_experience={work_items or 'unknown'}",
                f"summary={profile.summary or 'unknown'}",
            ]
        )

    @staticmethod
    def _tool_skill_set() -> set[str]:
        return {"word", "excel", "photoshop", "cad"}

    def _build_domain_tags(self, profile: ResumeProfile) -> list[str]:
        tags: list[str] = []
        text_blob = " ".join(profile.skills + profile.work_experience + [profile.target_role] + profile.target_roles).lower()

        rules = OrderedDict(
            [
                ("customer_service", ["\u5ba2\u6237\u670d\u52a1", "customer service"]),
                ("sales_support", ["\u8ddf\u5355", "\u56de\u6b3e", "sales"]),
                ("foreign_trade", ["\u5916\u8d38"]),
                ("operations", ["\u51fa\u8d27", "\u62a5\u5173"]),
                ("backend", ["python", "fastapi", "django", "flask", "sql"]),
                ("frontend", ["react", "vue", "javascript", "typescript"]),
                ("ai_application", ["rag", "langchain", "chromadb", "machine learning"]),
            ]
        )

        for tag, keywords in rules.items():
            if any(keyword in text_blob for keyword in keywords):
                tags.append(tag)

        return tags

    @staticmethod
    def _extract_keywords_from_lines(lines: list[str]) -> list[str]:
        keyword_pattern = re.compile(r"[A-Za-z][A-Za-z0-9.+#-]{1,30}|[\u4e00-\u9fff]{2,8}")
        blocked = {
            "姓名",
            "工作",
            "经历",
            "教育",
            "项目",
            "描述",
            "公司",
            "职位",
            "岗位",
            "summary",
        }
        tokens: list[str] = []
        for line in lines:
            for token in keyword_pattern.findall(line):
                if token not in blocked:
                    tokens.append(token.lower())
        return list(OrderedDict.fromkeys(tokens))[:20]
