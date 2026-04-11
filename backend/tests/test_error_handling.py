from __future__ import annotations

import unittest
from io import BytesIO

from fastapi import HTTPException, UploadFile

from app.api.routes.jobs import import_jobs_from_excel
from app.api.routes.match import match_resume_to_jobs
from app.api.routes.resume import parse_resume
from app.services.file_extractors import FileExtractorService
from app.services.job_spreadsheet_service import JobSpreadsheetService


class RouteErrorHandlingTests(unittest.IsolatedAsyncioTestCase):
    async def test_parse_resume_returns_http_400_for_unsupported_file(self) -> None:
        upload = UploadFile(
            filename="resume.csv",
            file=BytesIO(b"name,email\nalice,alice@example.com"),
            headers={"content-type": "text/csv"},
        )

        with self.assertRaises(HTTPException) as context:
            await parse_resume(upload)

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(
            context.exception.detail,
            "Unsupported file type. Please upload PDF, DOCX, or TXT.",
        )

    async def test_match_resume_returns_http_400_for_unsupported_file(self) -> None:
        upload = UploadFile(
            filename="resume.csv",
            file=BytesIO(b"name,email\nalice,alice@example.com"),
            headers={"content-type": "text/csv"},
        )

        with self.assertRaises(HTTPException) as context:
            await match_resume_to_jobs(upload)

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(
            context.exception.detail,
            "Unsupported file type. Please upload PDF, DOCX, or TXT.",
        )

    async def test_import_jobs_from_excel_returns_http_400_for_invalid_workbook(self) -> None:
        upload = UploadFile(
            filename="jobs.xlsx",
            file=BytesIO(b"not an xlsx workbook"),
            headers={"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
        )

        with self.assertRaises(HTTPException) as context:
            await import_jobs_from_excel(upload)

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(
            context.exception.detail,
            "Invalid Excel file. Please upload a valid .xlsx workbook.",
        )


class FileParsingServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_file_extractor_rejects_invalid_docx_bytes(self) -> None:
        upload = UploadFile(
            filename="resume.docx",
            file=BytesIO(b"not a docx archive"),
            headers={"content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
        )

        with self.assertRaisesRegex(ValueError, "Invalid DOCX file."):
            await FileExtractorService().extract_text(upload)

    def test_job_spreadsheet_service_rejects_invalid_workbook_bytes(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "Invalid Excel file. Please upload a valid .xlsx workbook.",
        ):
            JobSpreadsheetService().parse_excel(b"not an xlsx workbook")


if __name__ == "__main__":
    unittest.main()
