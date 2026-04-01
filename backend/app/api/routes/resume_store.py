from fastapi import APIRouter

from app.services.resume_store_service import ResumeStoreService

router = APIRouter()
resume_store_service = ResumeStoreService()


@router.get("/resumes")
async def list_resumes(limit: int = 50) -> list[dict]:
    return resume_store_service.list_resumes(limit=limit)
