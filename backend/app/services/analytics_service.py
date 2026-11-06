from typing import Dict, Any, List
from app.database.repositories.session_repository import session_repo
from app.database.repositories.analytics_repository import analytics_repo
from app.ml.feature_engineering import extract_session_features
from app.ml.recommendation_model import analyze_weak_topics_and_recommendations
from app.schemas.analytics import TopicMasterySchema, AnalyticsSummaryResponse


class AnalyticsService:
    async def get_session_analytics(self, session_id: str) -> Dict[str, Any]:
        session = await session_repo.get_session(session_id)
        attempts = await session_repo.get_attempts_by_session(session_id)
        features = extract_session_features(attempts)

        scores = [a.get("score", 0) for a in attempts]
        avg_score = round(sum(scores) / max(1, len(scores)), 1)
        accuracy = round(sum(1 for s in scores if s >= 75) / max(1, len(scores)) * 100, 1)

        return {
            "session_id": session_id,
            "total_questions": session.get("total_questions", 0) if session else len(attempts),
            "completed_questions": len(attempts),
            "average_score": avg_score,
            "accuracy": accuracy,
            "total_xp": session.get("total_xp", 0) if session else sum(a.get("xp_earned", 0) for a in attempts),
            "features": features,
            "attempts": attempts
        }

    async def get_user_analytics_summary(self, user_or_anon_id: str) -> AnalyticsSummaryResponse:
        attempts = await session_repo.get_all_attempts_by_user(user_or_anon_id)
        mastery_list = await analytics_repo.get_user_mastery(user_or_anon_id)
        features = extract_session_features(attempts)

        weak_topics, recommendations = analyze_weak_topics_and_recommendations(attempts, mastery_list)

        topic_breakdown = []
        if mastery_list:
            for m in mastery_list:
                est = m.get("mastery_estimate", 0.5)
                status = "Mastered" if est >= 0.85 else ("Developing" if est >= 0.60 else "Weak")
                topic_breakdown.append(TopicMasterySchema(
                    topic=m.get("topic", "General"),
                    mastery_estimate=est,
                    accuracy=m.get("accuracy", 0.5),
                    attempts_count=m.get("attempts", 1),
                    bkt_p_known=est,
                    status=status
                ))
        else:
            # Default starter breakdown
            defaults = [
                ("FastAPI & Async IO", 0.82, 0.85, 8, "Developing"),
                ("Redis Caching & Invalidation", 0.74, 0.78, 6, "Developing"),
                ("MongoDB & Data Modeling", 0.91, 0.92, 10, "Mastered"),
                ("Bayesian Knowledge Tracing", 0.52, 0.55, 4, "Weak"),
            ]
            for t, est, acc, att, st in defaults:
                topic_breakdown.append(TopicMasterySchema(
                    topic=t,
                    mastery_estimate=est,
                    accuracy=acc,
                    attempts_count=att,
                    bkt_p_known=est,
                    status=st
                ))

        # Recent trend points
        recent_trend = []
        for i, att in enumerate(attempts[-10:]):
            recent_trend.append({
                "attempt_index": i + 1,
                "score": att.get("score", 70),
                "topic": att.get("topic", "General"),
                "response_time_sec": round(att.get("response_time_ms", 30000) / 1000.0, 1)
            })

        return AnalyticsSummaryResponse(
            session_id=None,
            user_or_anon_id=user_or_anon_id,
            total_attempts=features["attempt_count"],
            overall_accuracy=features["accuracy_ratio"] * 100.0,
            average_response_time_ms=features["mean_response_time_ms"],
            topic_breakdown=topic_breakdown,
            recent_trend=recent_trend,
            weak_topics=weak_topics,
            recommendations=recommendations
        )


analytics_service = AnalyticsService()
