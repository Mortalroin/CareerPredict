from __future__ import annotations

import unittest

from app.services.resume_parser import ResumeParserService


class ResumeParserExtractionTests(unittest.TestCase):
    def test_extracts_resume_fact_labels_on_separate_lines(self) -> None:
        service = ResumeParserService()
        text = "\n".join(
            [
                "\u59d3\u540d\uff1a\u5f20\u4e09",
                "\u5f53\u524d\u57ce\u5e02\uff1a\u6df1\u5733",
                "\u5b66\u5386\u5c42\u6b21\uff1a\u5927\u5b66\u672c\u79d1",
                "\u5de5\u4f5c\u5e74\u9650\uff1a3\u5e74",
            ]
        )

        profile = service._build_profile(text, target_role="", city="", notes="")

        self.assertEqual(profile.current_city, "\u6df1\u5733")
        self.assertEqual(profile.education_level, "bachelor")
        self.assertEqual(profile.education_level_raw, "\u5927\u5b66\u672c\u79d1")
        self.assertEqual(profile.years_experience, 3.0)

    def test_extracts_resume_fact_labels_on_same_line(self) -> None:
        text = (
            "\u5f53\u524d\u57ce\u5e02\uff1a\u5e7f\u5dde "
            "\u5b66\u5386\u5c42\u6b21\uff1a\u7855\u58eb\u7814\u7a76\u751f "
            "\u5de5\u4f5c\u5e74\u9650\uff1a\u4e94\u5e74"
        )

        self.assertEqual(ResumeParserService._extract_current_city(text), "\u5e7f\u5dde")
        self.assertEqual(
            ResumeParserService._extract_education_level(text),
            ("master", "\u7855\u58eb\u7814\u7a76\u751f"),
        )
        self.assertEqual(ResumeParserService._extract_years_experience(text), 5.0)

    def test_extracts_bare_numeric_years_after_label(self) -> None:
        text = "\n".join(
            [
                "\u6240\u5728\u57ce\u5e02\uff1a\u4e0a\u6d77",
                "\u5b66\u5386\u5c42\u6b21\uff1a\u4e13\u5347\u672c",
                "\u5de5\u4f5c\u5e74\u9650\uff1a3",
            ]
        )

        self.assertEqual(ResumeParserService._extract_current_city(text), "\u4e0a\u6d77")
        self.assertEqual(ResumeParserService._extract_education_level(text), ("bachelor", "\u4e13\u5347\u672c"))
        self.assertEqual(ResumeParserService._extract_years_experience(text), 3.0)

    def test_city_value_stops_before_next_inline_profile_label(self) -> None:
        text = "\u6027\u522b\uff1a\u5973\u5a5a\u59fb\u72b6\u51b5\uff1a\u672a\u5a5a\u6c11\u65cf\uff1a\u6c49\u65cf\u6237\u7c4d\uff1a\u6e56\u5357\u957f\u6c99\u5e74\u9f84\uff1a27"

        self.assertEqual(ResumeParserService._extract_current_city(text), "\u6e56\u5357\u957f\u6c99")


if __name__ == "__main__":
    unittest.main()
