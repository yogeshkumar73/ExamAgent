import json
import re
from typing import Dict, Any, Optional
from app.core.logging import logger


def clean_markdown_json_delimiters(text: str) -> str:
    """Strips ```json ... ``` markdown delimiters from AI responses."""
    text = text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        return match.group(1).strip()
    return text


def parse_and_validate_json(raw_text: str) -> Optional[Dict[str, Any]]:
    """Safely parses JSON output from LLM, attempting structural repairs if needed."""
    cleaned = clean_markdown_json_delimiters(raw_text)
    try:
        return json.loads(cleaned)
    except Exception as e:
        logger.warning(f"Direct JSON parse failed: {e}. Attempting recovery...")
        # Try extracting innermost or outermost {...}
        match = re.search(r'\{[\s\S]*\}', cleaned)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return None
