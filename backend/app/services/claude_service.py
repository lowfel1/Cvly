"""
Claude (Anthropic) integration for Cvly ATS analysis.

================================================================================
HOW TO SET UP THE CLAUDE API IN THIS PROJECT
================================================================================

1. Create an Anthropic account
   - Go to https://console.anthropic.com/
   - Sign up or log in.

2. Add billing (required for API calls)
   - Anthropic does NOT sell prepaid "token packs" like a game currency.
   - You add a payment method under Settings → Billing.
   - You are charged for **usage**: input tokens + output tokens per request.
   - See current pricing: https://www.anthropic.com/pricing
   - Set a monthly spend limit in the console if you want cost control.

3. Create an API key
   - Console → API Keys → Create Key.
   - Copy the key once (starts with `sk-ant-api03-...`).
   - Never commit it to git.

4. Configure backend/.env
   ```
   CLAUDE_API_KEY=sk-ant-api03-xxxxxxxx
   CLAUDE_MODEL=claude-sonnet-4-20250514
   ```
   Optional: `CLAUDE_MAX_TOKENS=4096` (default below).

5. Install dependencies (already in requirements.txt)
   ```
   pip install anthropic
   ```

6. Run the API and call ATS analyze
   - `uvicorn main:app --reload`
   - Frontend: POST /ats/analyze with JWT + { cv_id, job_description }
   - Or test in Swagger: http://localhost:8000/docs

================================================================================
TOKEN USAGE (for cost estimation)
================================================================================
- Each analyze call sends: system prompt + CV text + job description.
- Claude returns a JSON analysis (roughly 500–1500 output tokens).
- Typical ATS run: ~2k–8k input tokens depending on CV length.
- Monitor usage: https://console.anthropic.com/settings/usage
"""

import json
import os
import re
from datetime import datetime, timezone
from typing import Any

import anthropic
from fastapi import HTTPException

# Default model — override with CLAUDE_MODEL in .env.
DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-6"
DEFAULT_MAX_TOKENS = 4096


def _claude_error_message(exc: Exception) -> str:
    """Extract a user-facing message from an Anthropic SDK error."""
    body = getattr(exc, "body", None)

    if isinstance(body, dict):
        error_obj = body.get("error") or {}
        message = error_obj.get("message")

        if message:
            return str(message)

    text = str(exc).strip()

    if text:
        return text

    return "Claude API request failed. Check console.anthropic.com for status."

ATS_SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) resume analyst.
Compare the candidate CV against the job description and return ONLY valid JSON (no markdown, no commentary).

Scoring rules:
- All scores are integers from 0 to 100.
- overall_score = holistic ATS fit for this specific job.
- predicted_score = realistic score after applying your improvement suggestions (must be >= overall_score, max 100).
- keywords_found = important job keywords present in the CV.
- keywords_missing = important job keywords absent or weak in the CV.
- improvements = 3 to 6 actionable, specific suggestions (strings).

Required JSON schema:
{
  "overall_score": <int>,
  "predicted_score": <int>,
  "scores": {
    "keywords_match": <int>,
    "format_structure": <int>,
    "skills_match": <int>,
    "experience_match": <int>,
    "education_match": <int>,
    "overall_score": <int>
  },
  "keywords_found": ["..."],
  "keywords_missing": ["..."],
  "improvements": ["..."]
}"""


def _get_claude_client() -> anthropic.Anthropic:
    api_key = os.getenv("CLAUDE_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Claude API is not configured. Set CLAUDE_API_KEY in backend/.env. "
                "Get a key at https://console.anthropic.com/settings/keys"
            ),
        )

    return anthropic.Anthropic(api_key=api_key)


def _extract_json_from_response(text: str) -> dict[str, Any]:
    """Parse JSON from Claude output, including ```json fenced blocks."""
    cleaned = text.strip()

    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)

    if fence_match:
        cleaned = fence_match.group(1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="Claude returned invalid JSON. Try again or shorten the job description.",
        ) from exc


def _clamp_score(value: Any, default: int = 0) -> int:
    try:
        score = int(round(float(value)))
    except (TypeError, ValueError):
        return default

    return max(0, min(100, score))


def _normalize_analysis_payload(raw: dict[str, Any]) -> dict[str, Any]:
    """Validate and normalize Claude JSON into the shape expected by the frontend."""
    scores_raw = raw.get("scores") or {}

    overall = _clamp_score(raw.get("overall_score"), 0)
    predicted = _clamp_score(raw.get("predicted_score"), overall)

    if predicted < overall:
        predicted = min(100, overall + max(8, (100 - overall) // 2))

    scores = {
        "keywords_match": _clamp_score(scores_raw.get("keywords_match"), overall),
        "format_structure": _clamp_score(scores_raw.get("format_structure"), overall),
        "skills_match": _clamp_score(scores_raw.get("skills_match"), overall),
        "experience_match": _clamp_score(scores_raw.get("experience_match"), overall),
        "education_match": _clamp_score(scores_raw.get("education_match"), overall),
        "overall_score": _clamp_score(scores_raw.get("overall_score"), overall),
    }

    keywords_found = raw.get("keywords_found") or []
    keywords_missing = raw.get("keywords_missing") or []
    improvements = raw.get("improvements") or []

    if not isinstance(keywords_found, list):
        keywords_found = []
    if not isinstance(keywords_missing, list):
        keywords_missing = []
    if not isinstance(improvements, list):
        improvements = []

    keywords_found = [str(k).strip() for k in keywords_found if str(k).strip()][:30]
    keywords_missing = [str(k).strip() for k in keywords_missing if str(k).strip()][:30]

    normalized_improvements: list[str] = []

    for item in improvements[:8]:
        if isinstance(item, str) and item.strip():
            normalized_improvements.append(item.strip())
        elif isinstance(item, dict):
            text = (
                item.get("title")
                or item.get("description")
                or item.get("text")
                or ""
            )
            if str(text).strip():
                normalized_improvements.append(str(text).strip())

    return {
        "overall_score": overall,
        "predicted_score": predicted,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "scores": scores,
        "keywords_found": keywords_found,
        "keywords_missing": keywords_missing,
        "improvements": normalized_improvements,
    }


def analyze_cv_with_claude(cv_text: str, job_description: str) -> dict[str, Any]:
    """
    Call Claude to perform ATS analysis.

    Args:
        cv_text: Plain text extracted from the uploaded PDF.
        job_description: Job posting pasted by the user.

    Returns:
        Normalized analysis dict (matches frontend localStorage `cvly_analysis`).
    """
    if not cv_text or not cv_text.strip():
        raise HTTPException(
            status_code=400,
            detail="CV has no extractable text. Upload a text-based PDF.",
        )

    if not job_description or not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")

    # Truncate very long inputs to control token cost.
    max_cv_chars = 12_000
    max_job_chars = 5_000
    cv_excerpt = cv_text.strip()[:max_cv_chars]
    job_excerpt = job_description.strip()[:max_job_chars]

    model = os.getenv("CLAUDE_MODEL", DEFAULT_CLAUDE_MODEL)
    max_tokens = int(os.getenv("CLAUDE_MAX_TOKENS", str(DEFAULT_MAX_TOKENS)))

    user_message = f"""Analyze this CV against the job description.

=== JOB DESCRIPTION ===
{job_excerpt}

=== CV TEXT ===
{cv_excerpt}

Return only the JSON object described in the system prompt."""

    client = _get_claude_client()

    try:
        message = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=ATS_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.AuthenticationError as exc:
        raise HTTPException(
            status_code=503,
            detail="Invalid CLAUDE_API_KEY. Check your key at console.anthropic.com",
        ) from exc
    except anthropic.RateLimitError as exc:
        raise HTTPException(
            status_code=429,
            detail=_claude_error_message(exc),
        ) from exc
    except anthropic.BadRequestError as exc:
        print("CLAUDE API ERROR:", exc)
        message = _claude_error_message(exc)
        status = 402 if "credit balance" in message.lower() else 400

        raise HTTPException(status_code=status, detail=message) from exc
    except anthropic.APIError as exc:
        print("CLAUDE API ERROR:", exc)
        raise HTTPException(
            status_code=502,
            detail=_claude_error_message(exc),
        ) from exc

    text_blocks = [
        block.text
        for block in message.content
        if hasattr(block, "text") and block.text
    ]

    if not text_blocks:
        raise HTTPException(status_code=502, detail="Claude returned an empty response.")

    raw_json = _extract_json_from_response("\n".join(text_blocks))
    return _normalize_analysis_payload(raw_json)
