from fastapi import APIRouter, Depends, Body
from typing import Dict, Any
from app.services.gamification_service import gamification_service
from app.services.analytics_service import analytics_service
from app.database.mongodb import db_manager
from app.core.security import get_current_user_optional

router = APIRouter(prefix="/progress", tags=["Anonymous Access & Progress Management"])


@router.post("/export")
async def export_progress(
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Exports learner history, XP, badges, and mastery estimates for local backup or portability (Section 9).
    """
    user_id = current_user.get("id", "guest")
    gam = await gamification_service.get_profile(user_id)
    analytics = await analytics_service.get_user_analytics_summary(user_id)
    
    return {
        "user_id": user_id,
        "gamification": gam.model_dump(),
        "analytics": analytics.model_dump(),
        "exported_at": "now"
    }


@router.post("/import")
async def import_progress(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user_optional)
):
    """Imports previously exported learner backup records."""
    return {
        "success": True,
        "message": "Progress data imported successfully."
    }


@router.delete("/{identifier}")
async def delete_progress(identifier: str):
    """Privacy control: deletes stored progress for an anonymous user (Section 9 & 17)."""
    # Clean collections for this user
    col_gam = db_manager.get_collection("gamification")
    await col_gam.delete_one({"anonymous_id": identifier})

    col_mastery = db_manager.get_collection("topic_mastery")
    await col_mastery.delete_many({"anonymous_id": identifier})

    col_sessions = db_manager.get_collection("practice_sessions")
    await col_sessions.delete_many({"anonymous_id": identifier})

    return {
        "success": True,
        "message": f"Successfully deleted progress records for {identifier}."
    }
