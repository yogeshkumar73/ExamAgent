from typing import Literal

DIFFICULTY_LADDER = ["easy", "medium", "hard", "expert"]


def adapt_next_difficulty(current_difficulty: str, last_score: float) -> str:
    """
    Adaptive difficulty stepping engine.
    """
    curr = current_difficulty.lower()
    if curr not in DIFFICULTY_LADDER:
        curr = "medium"

    idx = DIFFICULTY_LADDER.index(curr)

    if last_score >= 85 and idx < len(DIFFICULTY_LADDER) - 1:
        return DIFFICULTY_LADDER[idx + 1]
    elif last_score < 50 and idx > 0:
        return DIFFICULTY_LADDER[idx - 1]
    
    return curr
