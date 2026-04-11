from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.job import JobImportItem, JobImportResponse, JobRecord
from app.services.job_service import JobService
from app.services.job_spreadsheet_service import JobSpreadsheetService

router = APIRouter()
job_service = JobService()
job_spreadsheet_service = JobSpreadsheetService()


@router.post("/jobs/import", response_model=JobImportResponse)
async def import_jobs(items: list[JobImportItem]) -> JobImportResponse:
    return job_service.import_jobs(items)


@router.post("/jobs/import-excel", response_model=JobImportResponse)
async def import_jobs_from_excel(
    file: UploadFile = File(...),
) -> JobImportResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename.",
        )
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .xlsx files are supported for Excel import.",
        )

    try:
        file_bytes = await file.read()
        items = job_spreadsheet_service.parse_excel(file_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid job rows were parsed from the Excel file.",
        )

    return job_service.import_jobs(items)


@router.get("/jobs", response_model=list[JobRecord])
async def list_jobs(limit: int = 50) -> list[JobRecord]:
    return job_service.list_jobs(limit=limit)
