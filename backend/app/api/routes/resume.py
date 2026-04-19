from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.schemas.resume import ResumeParseResponse
from app.services.resume_parser import ResumeParserService
from app.services.resume_store_service import ResumeStoreService

router = APIRouter()
resume_parser_service = ResumeParserService()
resume_store_service = ResumeStoreService()


@router.post(
    "/resume/parse",
    response_model=ResumeParseResponse,
    status_code=status.HTTP_200_OK,
)
async def parse_resume(
    file: UploadFile = File(...),
    target_role: str = Form(default=""),
    city: str = Form(default=""),
    notes: str = Form(default=""),
    resume_id: str = Form(default=""),
) -> ResumeParseResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename.",
        )

    try:
        result = await resume_parser_service.parse_resume(
            upload=file,
            target_role=target_role,
            city=city,
            notes=notes,
            resume_id=resume_id,
        )
        resume_store_service.save_resume(result)
        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
