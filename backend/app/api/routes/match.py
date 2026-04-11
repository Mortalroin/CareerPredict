from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.schemas.match import ResumeMatchResponse
from app.services.match_service import MatchService
from app.services.resume_parser import ResumeParserService
from app.services.resume_store_service import ResumeStoreService

router = APIRouter()
resume_parser_service = ResumeParserService()
match_service = MatchService()
resume_store_service = ResumeStoreService()


@router.post("/match/resume-to-jobs", response_model=ResumeMatchResponse)
async def match_resume_to_jobs(
    file: UploadFile = File(...),
    target_role: str = Form(default=""),
    city: str = Form(default=""),
    notes: str = Form(default=""),
    limit: int = Form(default=10),
) -> ResumeMatchResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename.",
        )

    try:
        resume_data = await resume_parser_service.parse_resume(
            upload=file,
            target_role=target_role,
            city=city,
            notes=notes,
        )
        resume_store_service.save_resume(resume_data)
        return match_service.match_resume(resume_data=resume_data, limit=limit)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
