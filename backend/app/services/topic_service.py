from typing import List, Dict, Any, Optional
from app.database.repositories.content_repository import content_repo
from app.core.exceptions import ResourceNotFoundException


class TopicService:
    async def get_topics_for_content(self, content_id: str) -> List[str]:
        content = await content_repo.get_by_id(content_id)
        if not content:
            raise ResourceNotFoundException("Content", content_id)
        return content.get("topics", [])

    def get_related_prerequisites(self, topic: str) -> List[str]:
        skill_tree_map = {
            "Bayesian Knowledge Tracing": ["Probability & Statistics", "Python & NumPy"],
            "Redis Caching & Invalidation": ["Data Structures", "FastAPI & Async IO"],
            "MongoDB & Data Modeling": ["Database Indexing", "JSON / BSON Data Structures"],
            "System Design & Architecture": ["Object Oriented Programming", "REST API Design & Security"],
            "Machine Learning & Analytics": ["Python Basics", "Linear Algebra"],
        }
        return skill_tree_map.get(topic, ["Software Engineering Fundamentals"])


topic_service = TopicService()
