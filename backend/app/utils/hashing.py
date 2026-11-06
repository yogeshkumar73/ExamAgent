import hashlib
import re


def normalize_text(text: str) -> str:
    """Normalizes whitespace and casing for consistent deduplication and hashing."""
    if not text:
        return ""
    # Strip leading/trailing, collapse duplicate whitespace, lower-case
    text = re.sub(r'\s+', ' ', text.strip().lower())
    return text


def compute_content_hash(text: str) -> str:
    """Computes a SHA-256 digest of normalized content."""
    normalized = normalize_text(text)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()[:16]


def compute_cache_key(prefix: str, *parts: str) -> str:
    """Generates standardized redis cache keys."""
    cleaned_parts = [re.sub(r'[^a-zA-Z0-9_\-]', '', str(p)) for p in parts if p is not None]
    return f"{prefix}:{':'.join(cleaned_parts)}"
