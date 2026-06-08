"""
ATS analysis API routes.

Endpoints:
  POST /ats/analyze        — Run Claude ATS analysis on an uploaded CV.
  GET  /ats/analyses/{cv_id} — Get all analyses for a specific CV.

Integration flow (Cvly):
  1. Frontend uploads PDF → POST /cvs/upload → receives cv id.
  2. Frontend calls POST /ats/analyze with { cv_id, job_description }.
  3. Backend loads parsed_text from Supabase, calls claude_service.
  4. Frontend stores response in localStorage as `cvly_analysis` and redirects to /results.

Auth: Bearer JWT (same as /cvs routes).

Billing reminder:
  Each analyze call consumes Anthropic API credits (tokens).
  Configure CLAUDE_API_KEY and billing at https://console.anthropic.com/
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from app.database.supabase import supabase
from app.models.ats import AtsAnalyzeRequest, AtsAnalyzeResponse
from app.services.auth_service import decode_token
from app.services.claude_service import analyze_cv_with_claude
from app.services.cv_service import get_cv_by_id

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    payload = decode_token(token)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    return user_id


@router.post("/analyze", response_model=AtsAnalyzeResponse)
def analyze_cv(
    body: AtsAnalyzeRequest,
    user_id: str = Depends(get_current_user_id),
) -> AtsAnalyzeResponse:
    """
    Analyze a CV against a job description using Claude AI.

    Requires:
      - Valid JWT
      - CV owned by the authenticated user
      - CLAUDE_API_KEY set in environment
    """
    cv_record = get_cv_by_id(body.cv_id, user_id)

    if not cv_record:
        raise HTTPException(status_code=404, detail="CV not found")

    parsed_text = cv_record.get("parsed_text") or ""

    analysis = analyze_cv_with_claude(
        cv_text=parsed_text,
        job_description=body.job_description,
    )

    # Save analysis to database
    try:
        save_response = supabase.table("ats_analyses").insert({
            "cv_id": body.cv_id,
            "user_id": user_id,
            "job_offer": body.job_description,
            "overall_score": analysis.get("overall_score", 0),
            "keywords_score": analysis.get("scores", {}).get("keywords_match", 0),
            "format_score": analysis.get("scores", {}).get("format_structure", 0),
            "skills_score": analysis.get("scores", {}).get("skills_match", 0),
            "experience_score": analysis.get("scores", {}).get("experience_match", 0),
            "education_score": analysis.get("scores", {}).get("education_match", 0),
            "keywords_found": analysis.get("keywords_found", []),
            "keywords_missing": analysis.get("keywords_missing", []),
            "improvements": analysis.get("improvements", []),
        }).execute()

        saved = save_response.data or []
        if saved:
            analysis["id"] = saved[0]["id"]
            analysis["analysis_id"] = saved[0]["id"]

    except Exception as e:
        print(f"Failed to save analysis to DB: {e}")

    return AtsAnalyzeResponse(
        cv_id=body.cv_id,
        **analysis,
    )


@router.get("/analyses/{cv_id}")
def get_analyses(
    cv_id: str,
    user_id: str = Depends(get_current_user_id),
) -> list:
    """Get all ATS analyses for a specific CV."""
    try:
        response = (
            supabase.table("ats_analyses")
            .select("*")
            .eq("cv_id", cv_id)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception:
        return []