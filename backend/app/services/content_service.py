import io
import re
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
from docx import Document
from app.utils.hashing import compute_content_hash, normalize_text
from app.database.repositories.content_repository import content_repo
from app.cache.cache_service import cache_service
from app.core.exceptions import ValidationException
from app.core.logging import logger


def chunk_text(text: str, max_chunk_chars: int = 1500) -> List[str]:
    """Splits document text into manageable contextual chunks by paragraph boundaries."""
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current_chunk = []
    current_len = 0

    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
        if current_len + len(p_clean) > max_chunk_chars and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [p_clean]
            current_len = len(p_clean)
        else:
            current_chunk.append(p_clean)
            current_len += len(p_clean)

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks if chunks else [text[:max_chunk_chars]]


class ContentService:
    async def extract_text_from_file(self, filename: str, file_bytes: bytes) -> str:
        if len(file_bytes) > 10 * 1024 * 1024:
            raise ValidationException("File size exceeds maximum 10 MB limit.")

        ext = filename.lower().split('.')[-1]
        try:
            if ext == "pdf":
                reader = PdfReader(io.BytesIO(file_bytes))
                extracted = [page.extract_text() or "" for page in reader.pages]
                return "\n".join(extracted).strip()
            elif ext in ("docx", "doc"):
                doc = Document(io.BytesIO(file_bytes))
                return "\n".join([p.text for p in doc.paragraphs if p.text.strip()]).strip()
            elif ext in ("txt", "md", "csv", "json"):
                return file_bytes.decode('utf-8', errors='ignore').strip()
            else:
                raise ValidationException(f"Unsupported file format '.{ext}'. Supported: PDF, DOCX, TXT, MD.")
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Error parsing file '{filename}': {e}")
            raise ValidationException(f"Failed to read file content: {str(e)}")

    def extract_topics_from_text(self, text: str) -> List[str]:
        """Extracts domain concepts and technical topics from source text."""
        domain_keywords = [
            ("FastAPI & Async IO", ["fastapi", "asyncio", "uvicorn", "event loop", "starlette", "concurrency"]),
            ("Redis Caching & Invalidation", ["redis", "cache", "ttl", "invalidation", "cache-aside", "pub/sub"]),
            ("MongoDB & Data Modeling", ["mongodb", "nosql", "bson", "index", "aggregation", "sharding"]),
            ("Bayesian Knowledge Tracing", ["bayesian", "bkt", "mastery", "knowledge tracing", "prior", "slip"]),
            ("Machine Learning & Analytics", ["scikit-learn", "logistic regression", "random forest", "k-means", "numpy", "pandas"]),
            ("Object Oriented Programming", ["polymorphism", "inheritance", "encapsulation", "oop", "overriding"]),
            ("System Design & Architecture", ["microservices", "modular monolith", "rate limit", "load balancing"]),
            ("REST API Design & Security", ["jwt", "authentication", "cors", "pydantic", "bearer token", "oauth"])
        ]

        text_lower = text.lower()
        matched_topics = []

        for topic_title, keywords in domain_keywords:
            if any(kw in text_lower for kw in keywords):
                matched_topics.append(topic_title)

        if not matched_topics:
            matched_topics = ["General Software Engineering", "Core Concepts", "System Architecture"]

        return matched_topics

    async def process_and_save_content(
        self,
        text: str,
        title: str = "Submitted Document",
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        content_hash = compute_content_hash(text)
        cache_key = f"topic_analysis:{content_hash}"

        # 1. Check Redis Cache (Section 8: topic_analysis:{content_hash} TTL 24h)
        cached = await cache_service.get_json(cache_key)
        if cached:
            return cached

        topics = self.extract_topics_from_text(text)
        chunks = chunk_text(text)

        # 2. Persist in database
        doc = await content_repo.save_content(
            title=title,
            content_hash=content_hash,
            topics=topics,
            user_id=user_id,
            char_count=len(text)
        )

        chunk_objs = [{"text": c, "topic": topics[0], "hash": compute_content_hash(c)} for c in chunks]
        await content_repo.save_chunks(doc["_id"], chunk_objs)

        result = {
            "content_id": doc["_id"],
            "title": title,
            "content_hash": content_hash,
            "topics": topics,
            "chunk_count": len(chunks),
            "char_count": len(text),
            "created_at": doc["created_at"]
        }

        # 3. Cache result for 24 hours (86400 seconds)
        await cache_service.set_json(cache_key, result, ttl_seconds=86400)
        return result


content_service = ContentService()
