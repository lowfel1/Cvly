"""
ATS analysis API routes.

Endpoints:
  POST /ats/analyze  — Run Claude ATS analysis on an uploaded CV.

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

    return AtsAnalyzeResponse(
        cv_id=body.cv_id,
        **analysis,
    )