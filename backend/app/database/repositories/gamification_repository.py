from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.database.mongodb import db_manager

# Level scaling formula: Level N requires N * 250 XP
def calculate_level_and_rank(xp: int) -> tuple[int, str, int, float]:
    """Returns (level, rank, next_level_xp, progress_percentage)"""
    level = max(1, int(xp // 250) + 1)
    if level <= 5:
        rank = "Beginner"
    elif level <= 10:
        rank = "Intermediate"
    elif level <= 20:
        rank = "Advanced"
    else:
        rank = "Master"
    
    current_level_floor = (level - 1) * 250
    next_level_ceil = level * 250
    progress = min(100.0, max(0.0, ((xp - current_level_floor) / 250.0) * 100))
    return level, rank, next_level_ceil, round(progress, 1)


INITIAL_BADGES_DEF = [
    {"id": "first_step", "name": "First Step", "condition": "Complete first practice session", "icon": "Rocket"},
    {"id": "quick_learner", "name": "Quick Learner", "condition": "Answer 10 questions correctly", "icon": "Zap"},
    {"id": "perfectionist", "name": "Perfectionist", "condition": "100% session accuracy", "icon": "Target"},
    {"id": "streak_master", "name": "Streak Master", "condition": "Practice 7 consecutive days", "icon": "Flame"},
    {"id": "comeback_hero", "name": "Comeback Hero", "condition": "Improve prior score by 20%", "icon": "ShieldCheck"},
    {"id": "topic_master", "name": "Topic Master", "condition": "Reach 90% topic mastery", "icon": "Crown"},
    {"id": "boss_slayer", "name": "Boss Slayer", "condition": "Complete Expert challenge", "icon": "Trophy"},
    {"id": "knowledge_explorer", "name": "Knowledge Explorer", "condition": "Practice 10 topics", "icon": "Compass"},
]

DEFAULT_DAILY_QUESTS = [
    {"quest_id": "quest_5_correct", "title": "Precision Practice", "description": "Answer 5 questions with Good or Excellent rating", "reward_xp": 100, "target": 5},
    {"quest_id": "quest_revise_gaps", "title": "Targeted Revision", "description": "Revise 3 missing concepts identified by AI", "reward_xp": 75, "target": 3},
    {"quest_id": "quest_complete_mock", "title": "Full Session Finish", "description": "Complete a 10-question evaluation session", "reward_xp": 100, "target": 1},
    {"quest_id": "quest_weak_topic", "title": "Weak Topic Conqueror", "description": "Improve score in your lowest scoring topic by +15%", "reward_xp": 80, "target": 1},
]


class GamificationRepository:
    def __init__(self):
        self.gamification_col_name = "gamification"
        self.quests_col_name = "daily_quests"
        self.leaderboard_col_name = "leaderboard_entries"

    @property
    def gamification_col(self):
        return db_manager.get_collection(self.gamification_col_name)

    @property
    def quests_col(self):
        return db_manager.get_collection(self.quests_col_name)

    @property
    def leaderboard_col(self):
        return db_manager.get_collection(self.leaderboard_col_name)

    async def get_or_create_profile(self, anonymous_id: str) -> Dict[str, Any]:
        profile = await self.gamification_col.find_one({"anonymous_id": anonymous_id})
        if not profile:
            now = datetime.now(timezone.utc).isoformat()
            profile = {
                "_id": f"gam_{anonymous_id}",
                "anonymous_id": anonymous_id,
                "xp": 100,
                "streak": 3,
                "badges": [b["id"] for b in INITIAL_BADGES_DEF[:2]],  # first step & quick learner unlocked initially
                "completed_quests": [],
                "updated_at": now
            }
            await self.gamification_col.insert_one(profile)

        level, rank, next_xp, progress = calculate_level_and_rank(profile.get("xp", 100))
        profile["level"] = level
        profile["rank"] = rank
        profile["next_level_xp"] = next_xp
        profile["level_progress_percent"] = progress
        return profile

    async def add_xp(self, anonymous_id: str, xp_delta: int) -> Dict[str, Any]:
        profile = await self.get_or_create_profile(anonymous_id)
        new_xp = max(0, profile.get("xp", 0) + xp_delta)
        now = datetime.now(timezone.utc).isoformat()
        await self.gamification_col.update_one(
            {"anonymous_id": anonymous_id},
            {"$set": {"xp": new_xp, "updated_at": now}}
        )
        return await self.get_or_create_profile(anonymous_id)

    async def unlock_badge(self, anonymous_id: str, badge_id: str):
        now = datetime.now(timezone.utc).isoformat()
        await self.gamification_col.update_one(
            {"anonymous_id": anonymous_id},
            {
                "$addToSet": {"badges": badge_id},
                "$set": {"updated_at": now}
            }
        )

    async def get_daily_quests(self, anonymous_id: str) -> List[Dict[str, Any]]:
        profile = await self.get_or_create_profile(anonymous_id)
        completed = set(profile.get("completed_quests", []))
        quests = []
        for q in DEFAULT_DAILY_QUESTS:
            is_claimed = q["quest_id"] in completed
            quests.append({
                "quest_id": q["quest_id"],
                "title": q["title"],
                "description": q["description"],
                "reward_xp": q["reward_xp"],
                "progress": q["target"] if is_claimed else min(q["target"], 2),
                "target": q["target"],
                "is_completed": True,
                "is_claimed": is_claimed
            })
        return quests

    async def claim_quest_reward(self, anonymous_id: str, quest_id: str) -> tuple[bool, int, str]:
        profile = await self.get_or_create_profile(anonymous_id)
        completed = profile.get("completed_quests", [])
        if quest_id in completed:
            return False, 0, "Quest reward already claimed."

        matching_quest = next((q for q in DEFAULT_DAILY_QUESTS if q["quest_id"] == quest_id), None)
        reward_xp = matching_quest["reward_xp"] if matching_quest else 50

        now = datetime.now(timezone.utc).isoformat()
        await self.gamification_col.update_one(
            {"anonymous_id": anonymous_id},
            {
                "$addToSet": {"completed_quests": quest_id},
                "$inc": {"xp": reward_xp},
                "$set": {"updated_at": now}
            }
        )
        return True, reward_xp, f"Successfully claimed {reward_xp} XP!"

    async def get_daily_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        cursor = await self.leaderboard_col.find({}, limit=limit)
        items = await cursor.to_list(limit)
        if not items:
            # Seed standard mock leaderboard
            default_leaders = [
                {"rank": 1, "anonymous_alias": "Alex_V", "points": 3420, "badge_count": 7, "level": 14},
                {"rank": 2, "anonymous_alias": "DevNinja_42", "points": 2980, "badge_count": 6, "level": 12},
                {"rank": 3, "anonymous_alias": "Candidate_K", "points": 2650, "badge_count": 5, "level": 11},
                {"rank": 4, "anonymous_alias": "CodeCrafter", "points": 2210, "badge_count": 4, "level": 9},
                {"rank": 5, "anonymous_alias": "CloudArchitect", "points": 1940, "badge_count": 4, "level": 8},
                {"rank": 6, "anonymous_alias": "AsyncCoder", "points": 1680, "badge_count": 3, "level": 7},
            ]
            return default_leaders
        return items


gamification_repo = GamificationRepository()
