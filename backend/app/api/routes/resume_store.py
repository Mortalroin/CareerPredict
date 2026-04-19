from fastapi import APIRouter, HTTPException, status

from app.schemas.resume import ResumeOptimizationPayload, ResumeOptimizationRecord
from app.services.resume_store_service import ResumeStoreService

router = APIRouter()
resume_store_service = ResumeStoreService()


@router.get("/resumes")
async def list_resumes(limit: int = 50) -> list[dict]:
    return resume_store_service.list_resumes(limit=limit)


@router.post(
    "/resumes/{resume_id}/optimization",
    response_model=ResumeOptimizationRecord,
    status_code=status.HTTP_200_OK,
)
async def save_resume_optimization(
    resume_id: str,
    payload: ResumeOptimizationPayload,
) -> ResumeOptimizationRecord:
    if not resume_store_service.resume_exists(resume_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found. Please analyze a real resume before saving optimization data.",
        )

    record = resume_store_service.save_resume_optimization(resume_id, payload)
    return ResumeOptimizationRecord.model_validate(record)
