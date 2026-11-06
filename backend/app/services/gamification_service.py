from typing import Dict, Any, List
from app.database.repositories.gamification_repository import (
    gamification_repo,
    INITIAL_BADGES_DEF
)
from app.schemas.gamification import (
    GamificationProfileResponse,
    BadgeSchema,
    DailyQuestSchema,
    ClaimQuestResponse,
    LeaderboardResponse,
    LeaderboardEntrySchema
)


class GamificationService:
    async def get_profile(self, anonymous_id: str) -> GamificationProfileResponse:
        data = await gamification_repo.get_or_create_profile(anonymous_id)
        unlocked_badge_ids = set(data.get("badges", []))

        badge_schemas = []
        for b in INITIAL_BADGES_DEF:
            is_unlocked = b["id"] in unlocked_badge_ids
            badge_schemas.append(BadgeSchema(
                id=b["id"],
                name=b["name"],
                condition=b["condition"],
                icon=b["icon"],
                is_unlocked=is_unlocked,
                unlocked_at=data.get("updated_at") if is_unlocked else None
            ))

        return GamificationProfileResponse(
            anonymous_id=data["anonymous_id"],
            xp=data["xp"],
            level=data["level"],
            rank=data["rank"],
            streak_days=data.get("streak", 3),
            badges=badge_schemas,
            completed_quests=data.get("completed_quests", []),
            next_level_xp=data["next_level_xp"],
            level_progress_percent=data["level_progress_percent"]
        )

    async def get_quests(self, anonymous_id: str) -> List[DailyQuestSchema]:
        quests = await gamification_repo.get_daily_quests(anonymous_id)
        return [DailyQuestSchema(**q) for q in quests]

    async def claim_quest(self, anonymous_id: str, quest_id: str) -> ClaimQuestResponse:
        success, reward, msg = await gamification_repo.claim_quest_reward(anonymous_id, quest_id)
        profile = await self.get_profile(anonymous_id)
        return ClaimQuestResponse(
            success=success,
            quest_id=quest_id,
            reward_xp=reward,
            new_total_xp=profile.xp,
            new_level=profile.level,
            message=msg
        )

    async def get_leaderboard(self) -> LeaderboardResponse:
        items = await gamification_repo.get_daily_leaderboard()
        schemas = [LeaderboardEntrySchema(**item) for item in items]
        return LeaderboardResponse(
            period="daily",
            count=len(schemas),
            data=schemas
        )


gamification_service = GamificationService()
