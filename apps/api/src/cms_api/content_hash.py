import hashlib
import json


def candidate_source_hash(title: str, body_markdown: str) -> str:
    """Hash the exact submitted text using compact UTF-8 JSON array encoding."""
    payload = json.dumps([title, body_markdown], ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
