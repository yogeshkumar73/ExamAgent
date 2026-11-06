from typing import List, Dict, Any
from app.schemas.analytics import WeakTopicItem, RecommendationItem


def analyze_weak_topics_and_recommendations(
    attempts: List[Dict[str, Any]],
    user_mastery_list: List[Dict[str, Any]]
) -> tuple[List[WeakTopicItem], List[RecommendationItem]]:
    """
    Identifies topics with lowest mastery and outputs targeted revision recommendations.
    """
    weak_topics: List[WeakTopicItem] = []
    recommendations: List[RecommendationItem] = []

    # Map mastery items
    topic_stats: Dict[str, Dict[str, Any]] = {}
    for m in user_mastery_list:
        t = m.get("topic", "General")
        topic_stats[t] = {
            "attempts": m.get("attempts", 1),
            "mastery": m.get("mastery_estimate", 0.5),
            "accuracy": m.get("accuracy", 0.5),
            "missing": []
        }

    # Aggregate missing concepts from attempts
    for att in attempts:
        t = att.get("topic", "General")
        if t not in topic_stats:
            topic_stats[t] = {"attempts": 0, "mastery": 0.5, "accuracy": 0.5, "missing": []}
        topic_stats[t]["attempts"] += 1
        for mc in att.get("missing_concepts", []):
            if mc not in topic_stats[t]["missing"]:
                topic_stats[t]["missing"].append(mc)

    # Classify weak topics (< 65% accuracy or < 0.60 mastery)
    for t_name, data in topic_stats.items():
        if data["accuracy"] < 0.70 or data["mastery"] < 0.65:
            weak_topics.append(WeakTopicItem(
                topic=t_name,
                accuracy=round(data["accuracy"], 2),
                attempts=data["attempts"],
                mastery_estimate=round(data["mastery"], 2),
                primary_missing_concepts=data["missing"][:3] if data["missing"] else ["Core Architectural Constraints"],
                suggested_revision_interval_hours=24 if data["accuracy"] < 0.5 else 48
            ))

    # Generate actionable recommendation items
    if weak_topics:
        for wt in weak_topics[:3]:
            recommendations.append(RecommendationItem(
                title=f"Reinforce {wt.topic} Foundations",
                topic=wt.topic,
                recommended_difficulty="medium" if wt.accuracy >= 0.5 else "easy",
                reason=f"Current accuracy is {int(wt.accuracy * 100)}% with gaps in {', '.join(wt.primary_missing_concepts[:2])}.",
                target_concepts=wt.primary_missing_concepts,
                action_type="concept_revision"
            ))
    else:
        recommendations.append(RecommendationItem(
            title="Advanced System Design & Distributed Systems",
            topic="Distributed Consensus & Sharding",
            recommended_difficulty="hard",
            reason="Strong foundation demonstrated across current modules. Ready for senior technical scenarios.",
            target_concepts=["Raft Consensus", "Two-Phase Commit", "Consistent Hashing"],
            action_type="mock_challenge"
        ))

    return weak_topics, recommendations
