from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzeContentRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=50000)
    title: Optional[str] = "Untitled Document"


class ContentChunkSchema(BaseModel):
    chunk_id: str
    text: str
    topic: str
    hash: str


class ContentResponse(BaseModel):
    content_id: str
    title: str
    content_hash: str
    topics: List[str]
    chunk_count: int
    char_count: int
    created_at: str


class TopicListResponse(BaseModel):
    content_id: str
    topics: List[str]
