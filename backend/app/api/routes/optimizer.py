from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional

from app.services.auth_service import decode_token
from app.services.optimizer_service import optimize_cv
from app.database.supabase import supabase

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class OptimizeRequest(BaseModel):
    cv_id: str
    analysis_id: Optional[str] = None  # ← OPTIONNEL maintenant


@router.post("/optimize")
def optimize(
    request: OptimizeRequest,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Optimize CV using Claude AI based on ATS analysis."""
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

        # Get analysis — use analysis_id if provided, else get latest
        if request.analysis_id:
            analysis_res = supabase.table("ats_analyses").select("*").eq(
                "id", request.analysis_id
            ).eq("user_id", user_id).execute()
        else:
            # Get latest analysis for this CV
            analysis_res = supabase.table("ats_analyses").select("*").eq(
                "cv_id", request.cv_id
            ).eq("user_id", user_id).order(
                "created_at", desc=True
            ).limit(1).execute()

        analysis_data = analysis_res.data or []
        if not analysis_data:
            raise HTTPException(
                status_code=404,
                detail="No analysis found for this CV. Please analyze first."
            )

        analysis = analysis_data[0]

        # Optimize with Claude AI
        print(f"Starting CV optimization for cv_id={request.cv_id}")
        result = optimize_cv(
            cv_text=cv.get("parsed_text", ""),
            job_offer=analysis.get("job_offer", ""),
            analysis=analysis
        )
        print(f"Claude AI returned: {result.keys()}")

        # Save to database
        save_res = supabase.table("cv_optimizations").insert({
            "cv_id": request.cv_id,
            "analysis_id": analysis["id"],
            "user_id": user_id,
            "original_text": cv.get("parsed_text", ""),
            "optimized_text": result.get("optimized_text", ""),
            "changes": result.get("changes", []),
            "predicted_score": result.get("predicted_score", 0),
        }).execute()

        saved = save_res.data or []
        if saved:
            return saved[0]
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"OPTIMIZER ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(e)}"
        )


@router.get("/optimizations/{cv_id}")
def get_optimizations(
    cv_id: str,
    token: str = Depends(oauth2_scheme),
) -> list:
    """Get all optimizations for a CV."""
    payload = decode_token(token)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    res = supabase.table("cv_optimizations").select("*").eq(
        "cv_id", cv_id
    ).eq("user_id", user_id).order(
        "created_at", desc=True
    ).execute()

    return res.data or []