from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.content import router as content_router
from app.api.v1.questions import router as questions_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.gamification import router as gamification_router
from app.api.v1.leaderboard import router as leaderboard_router
from app.api.v1.progress import router as progress_router
from app.api.v1.interviewer import router as interviewer_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(content_router)
api_v1_router.include_router(questions_router)
api_v1_router.include_router(sessions_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(gamification_router)
api_v1_router.include_router(leaderboard_router)
api_v1_router.include_router(progress_router)
api_v1_router.include_router(interviewer_router)
