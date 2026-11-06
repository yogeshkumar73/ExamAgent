from fastapi import APIRouter, UploadFile, File, Form, Depends
from typing import Optional
from app.services.content_service import content_service
from app.services.topic_service import topic_service
from app.core.security import get_current_user_optional
from app.schemas.content import (
    AnalyzeContentRequest,
    ContentResponse,
    TopicListResponse
)

router = APIRouter(prefix="/content", tags=["Content Input & Analyzer"])


@router.post("/analyze", response_model=ContentResponse)
async def analyze_content(
    payload: AnalyzeContentRequest,
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Accepts text material, extracts topics, generates content hashes, and chunks material.
    """
    result = await content_service.process_and_save_content(
        text=payload.text,
        title=payload.title or "Submitted Document",
        user_id=current_user.get("id")
    )
    return ContentResponse(**result)


@router.post("/upload", response_model=ContentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Uploads PDF, DOCX, or text files (up to 10MB) with MIME validation and safe extraction.
    """
    content_bytes = await file.read()
    extracted_text = await content_service.extract_text_from_file(file.filename, content_bytes)
    doc_title = title if title else file.filename
    result = await content_service.process_and_save_content(
        text=extracted_text,
        title=doc_title,
        user_id=current_user.get("id")
    )
    return ContentResponse(**result)


@router.get("/{content_id}/topics", response_model=TopicListResponse)
async def get_detected_topics(content_id: str):
    """
    Returns the concepts and topic relationships identified from the uploaded material.
    """
    topics = await topic_service.get_topics_for_content(content_id)
    return TopicListResponse(content_id=content_id, topics=topics)
