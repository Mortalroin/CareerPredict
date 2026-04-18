from __future__ import annotations

import sqlite3
import unittest
from io import BytesIO
from unittest.mock import patch

from fastapi import UploadFile

from app.api.routes.resume_store import save_resume_optimization
from app.schemas.resume import ResumeOptimizationPayload
from app.services.resume_parser import ResumeParserService
from app.services.resume_store_service import ResumeStoreService


class ResumeOptimizationPersistenceTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.row_factory = sqlite3.Row
        self.connection.execute(
            """
            CREATE TABLE resumes (
                resume_id TEXT PRIMARY KEY,
                source_filename TEXT NOT NULL,
                content_type TEXT,
                text_length INTEGER DEFAULT 0,
                extracted_text TEXT NOT NULL,
                structured_json TEXT NOT NULL,
                hard_json TEXT NOT NULL,
                soft_json TEXT NOT NULL,
                vector_payload_json TEXT NOT NULL,
                embedding_text TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        self.connection.execute(
            """
            CREATE TABLE resume_optimizations (
                resume_id TEXT PRIMARY KEY,
                target_role TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                optimization_json TEXT NOT NULL DEFAULT '{}',
                merged_notes TEXT NOT NULL DEFAULT '',
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        self.connection.commit()
        self.connection_patcher = patch(
            "app.services.resume_store_service.get_connection",
            side_effect=self._get_connection,
        )
        self.connection_patcher.start()

    def tearDown(self) -> None:
        self.connection_patcher.stop()
        self.connection.close()

    def _get_connection(self) -> sqlite3.Connection:
        return self.connection

    async def test_parse_resume_reuses_provided_resume_id(self) -> None:
        upload = UploadFile(
            filename="resume.txt",
            file=BytesIO("张三\n产品经理\nPython Excel".encode("utf-8")),
            headers={"content-type": "text/plain"},
        )

        result = await ResumeParserService().parse_resume(
            upload=upload,
            target_role="产品经理",
            notes="补充说明",
            resume_id="resume_fixed_123",
        )

        self.assertEqual(result.structured_resume.resume_id, "resume_fixed_123")
        self.assertEqual(result.profile.notes, "补充说明")

    async def test_save_resume_optimization_persists_and_updates_database(self) -> None:
        upload = UploadFile(
            filename="resume.txt",
            file=BytesIO("李四\n运营专员\nExcel 用户运营 活动复盘".encode("utf-8")),
            headers={"content-type": "text/plain"},
        )

        parser_service = ResumeParserService()
        store_service = ResumeStoreService()
        parsed = await parser_service.parse_resume(
            upload=upload,
            target_role="运营专员",
            notes="第一版说明",
            resume_id="resume_opt_001",
        )
        store_service.save_resume(parsed)

        first_payload = ResumeOptimizationPayload(
            target_role="运营专员",
            notes="第一版说明",
            optimization_drafts={
                "projectContext": "负责校园活动运营项目",
                "quantifiedResult": "活动报名率提升 20%",
            },
            merged_notes="第一版说明\n\n继续优化补充信息：\n项目背景：负责校园活动运营项目",
        )
        second_payload = ResumeOptimizationPayload(
            target_role="高级运营专员",
            notes="第二版说明",
            optimization_drafts={
                "projectContext": "负责大型活动运营项目",
                "quantifiedResult": "活动报名率提升 35%",
            },
            merged_notes="第二版说明\n\n继续优化补充信息：\n项目背景：负责大型活动运营项目",
        )

        await save_resume_optimization(parsed.structured_resume.resume_id, first_payload)
        await save_resume_optimization(parsed.structured_resume.resume_id, second_payload)

        row = self.connection.execute(
            """
            SELECT target_role, notes, optimization_json, merged_notes
            FROM resume_optimizations
            WHERE resume_id = ?
            """,
            (parsed.structured_resume.resume_id,),
        ).fetchone()
        count_row = self.connection.execute(
            "SELECT COUNT(*) AS total FROM resume_optimizations WHERE resume_id = ?",
            (parsed.structured_resume.resume_id,),
        ).fetchone()

        self.assertIsNotNone(row)
        self.assertEqual(row["target_role"], "高级运营专员")
        self.assertEqual(row["notes"], "第二版说明")
        self.assertIn("大型活动运营项目", row["optimization_json"])
        self.assertIn("第二版说明", row["merged_notes"])
        self.assertEqual(count_row["total"], 1)


if __name__ == "__main__":
    unittest.main()
