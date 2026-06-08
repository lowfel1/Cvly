from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional

from app.services.auth_service import decode_token
from app.services.cover_letter_service import generate_cover_letter
from app.database.supabase import supabase

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class GenerateRequest(BaseModel):
    cv_id: str
    analysis_id: Optional[str] = None
    tone: str = "professional"
    length: str = "medium"


@router.post("/generate")
def generate(
    request: GenerateRequest,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Generate a cover letter using Claude AI."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get CV
        cv_res = supabase.table("cvs").select("*").eq(
            "id", request.cv_id
        ).eq("user_id", user_id).execute()

        cv_data = cv_res.data or []
        if not cv_data:
            raise HTTPException(status_code=404, detail="CV not found")

        cv = cv_data[0]

        # Get job offer from analysis
        job_offer = ""
        if request.analysis_id:
            analysis_res = supabase.table("ats_analyses").select("*").eq(
                "id", request.analysis_id
            ).execute()
            analysis_data = analysis_res.data or []
            if analysis_data:
                job_offer = analysis_data[0].get("job_offer", "")
        else:
            # Get latest analysis for this CV
            analysis_res = supabase.table("ats_analyses").select("*").eq(
                "cv_id", request.cv_id
            ).eq("user_id", user_id).order(
                "created_at", desc=True
            ).limit(1).execute()
            analysis_data = analysis_res.data or []
            if analysis_data:
                job_offer = analysis_data[0].get("job_offer", "")

        # Get user info
        user_res = supabase.table("users").select("*").eq(
            "id", user_id
        ).execute()
        user_data = user_res.data or []
        user = user_data[0] if user_data else {}

        # Generate with Claude AI
        content = generate_cover_letter(
            cv_text=cv.get("parsed_text", ""),
            job_offer=job_offer,
            user_name=user.get("full_name", "") or user.get("name", ""),
            user_email=user.get("email", ""),
            user_phone="",
            tone=request.tone,
            length=request.length,
        )

        # Save to database
        save_res = supabase.table("cover_letters").insert({
            "user_id": user_id,
            "cv_id": request.cv_id,
            "analysis_id": request.analysis_id,
            "content": content,
            "tone": request.tone,
            "length": request.length,
        }).execute()

        saved = save_res.data or []
        if saved:
            return saved[0]
        return {"content": content, "tone": request.tone, "length": request.length}

    except HTTPException:
        raise
    except Exception as e:
        print(f"COVER LETTER ROUTE ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate cover letter: {str(e)}"
        )


@router.get("/")
def get_cover_letters(
    token: str = Depends(oauth2_scheme),
) -> list:
    """Get all cover letters for the authenticated user."""
    payload = decode_token(token)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    res = supabase.table("cover_letters").select("*").eq(
        "user_id", user_id
    ).order("created_at", desc=True).execute()

    return res.data or []


@router.delete("/{letter_id}")
def delete_cover_letter(
    letter_id: str,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Delete a cover letter."""
    payload = decode_token(token)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.table("cover_letters").delete().eq(
        "id", letter_id
    ).eq("user_id", user_id).execute()

    return {"message": "Cover letter deleted successfully"}