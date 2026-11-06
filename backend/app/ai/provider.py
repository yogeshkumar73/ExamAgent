import os
import httpx
from typing import Optional, Dict, Any
from app.config import settings
from app.core.logging import logger

try:
    import google.generativeai as genai
    HAS_GENAI_LIB = True
except ImportError:
    HAS_GENAI_LIB = False


class AIProviderClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        if self.api_key and HAS_GENAI_LIB:
            try:
                genai.configure(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to configure google-generativeai: {e}")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key != "MY_GEMINI_API_KEY" and len(self.api_key) > 5)

    async def generate_text(self, system_instruction: str, prompt: str) -> Optional[str]:
        if not self.is_configured:
            return None

        # 1. Try google-generativeai SDK if available
        if HAS_GENAI_LIB:
            try:
                model = genai.GenerativeModel(
                    model_name=settings.AI_MODEL,
                    system_instruction=system_instruction
                )
                response = await model.generate_content_async(
                    prompt,
                    generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"google-generativeai SDK call failed: {e}. Falling back to direct HTTP REST endpoint...")

        # 2. Direct HTTP REST fallback to Google Gemini v1beta
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={self.api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json"
                }
            }
            async with httpx.AsyncClient(timeout=float(settings.AI_TIMEOUT_SECONDS)) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    logger.error(f"Gemini HTTP API error: status {res.status_code} - {res.text}")
        except Exception as err:
            logger.error(f"Gemini HTTP REST call failed: {err}")

        return None


ai_provider = AIProviderClient()
