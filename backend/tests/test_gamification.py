import pytest
from app.services.gamification_service import gamification_service
from app.database.repositories.gamification_repository import calculate_level_and_rank


def test_level_and_rank_calculation():
    # 0 - 249 XP: Level 1 Beginner
    lvl, rank, next_xp, prog = calculate_level_and_rank(100)
    assert lvl == 1
    assert rank == "Beginner"
    assert next_xp == 250

    # 1500 XP: Level 7 Intermediate
    lvl7, rank7, next_xp7, _ = calculate_level_and_rank(1550)
    assert lvl7 == 7
    assert rank7 == "Intermediate"

    # 3000 XP: Level 13 Advanced
    lvl13, rank13, _, _ = calculate_level_and_rank(3000)
    assert lvl13 == 13
    assert rank13 == "Advanced"

    # 6000 XP: Level 25 Master
    lvl25, rank25, _, _ = calculate_level_and_rank(6000)
    assert lvl25 >= 21
    assert rank25 == "Master"


@pytest.mark.asyncio
async def test_idempotent_quest_reward_claiming():
    anon_id = "test_player_404"
    profile = await gamification_service.get_profile(anon_id)
    initial_xp = profile.xp

    # Claim quest first time: should succeed
    res1 = await gamification_service.claim_quest(anon_id, "quest_5_correct")
    assert res1.success is True
    assert res1.reward_xp > 0
    assert res1.new_total_xp == initial_xp + res1.reward_xp

    # Claim second time: idempotent rejection, no double reward
    res2 = await gamification_service.claim_quest(anon_id, "quest_5_correct")
    assert res2.success is False
    assert res2.reward_xp == 0
    assert res2.new_total_xp == res1.new_total_xp
