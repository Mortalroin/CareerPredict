from __future__ import annotations

from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

from xml.etree import ElementTree

from fastapi import UploadFile


class FileExtractorService:
    async def extract_text(self, upload: UploadFile) -> str:
        suffix = Path(upload.filename or "").suffix.lower()
        file_bytes = await upload.read()
        await upload.seek(0)

        if not file_bytes:
            raise ValueError("Uploaded file is empty.")

        if suffix == ".txt":
            return self._extract_txt(file_bytes)
        if suffix == ".docx":
            return self._extract_docx(file_bytes)
        if suffix == ".pdf":
            return self._extract_pdf(file_bytes)

        raise ValueError("Unsupported file type. Please upload PDF, DOCX, or TXT.")

    @staticmethod
    def _extract_txt(file_bytes: bytes) -> str:
        for encoding in ("utf-8", "utf-8-sig", "gbk", "latin-1"):
            try:
                return file_bytes.decode(encoding)
            except UnicodeDecodeError:
                continue
        raise ValueError("Could not decode TXT file.")

    @staticmethod
    def _extract_docx(file_bytes: bytes) -> str:
        with ZipFile(BytesIO(file_bytes)) as archive:
            try:
                document_xml = archive.read("word/document.xml")
            except KeyError as exc:
                raise ValueError("DOCX file is missing word/document.xml.") from exc

        root = ElementTree.fromstring(document_xml)
        namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        text_nodes = root.findall(".//w:t", namespaces)
        text_parts = [node.text.strip() for node in text_nodes if node.text and node.text.strip()]
        return "\n".join(text_parts)

    @staticmethod
    def _extract_pdf(file_bytes: bytes) -> str:
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise ValueError("PDF parsing requires pypdf. Please install backend requirements.") from exc

        reader = PdfReader(BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n".join(page.strip() for page in pages if page.strip())
        if not text:
            raise ValueError("No readable text was extracted from the PDF.")
        return text
