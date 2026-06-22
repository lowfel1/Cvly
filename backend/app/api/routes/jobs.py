from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from app.models.jobs import (
    JobSearchRequest,
    JobSearchResponse,
    SaveJobRequest,
)
from app.services.auth_service import decode_token
from app.services.jobs_service import (
    search_jobs_jsearch,
    format_jobs_response,
)
from app.database.supabase import supabase

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/search", response_model=JobSearchResponse)
def search_jobs(
    request: JobSearchRequest,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Search jobs with optional CV-based match scoring."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get user's latest CV for match scoring
        cv_text = ""
        cv_res = supabase.table("cvs").select("parsed_text").eq(
            "user_id", user_id
        ).order("uploaded_at", desc=True).limit(1).execute()

        cv_data = cv_res.data or []
        if cv_data:
            cv_text = cv_data[0].get("parsed_text", "")

        # Search via Adzuna API
        raw_data = search_jobs_jsearch(
            query=request.query,
            location=request.location,
            contract_type=request.contract_type,
            salary_min=request.salary_min,
            page=request.page,
        )

        # Format with match scores
        jobs = format_jobs_response(raw_data, cv_text)

        # Sort by match score (best first)
        jobs.sort(key=lambda j: j["match_score"], reverse=True)

        return {
            "jobs": jobs,
            "total": raw_data.get("count", len(jobs)),
            "page": request.page,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"JOBS SEARCH ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
def save_job(
    request: SaveJobRequest,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Save a job to user favorites."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        save_res = supabase.table("saved_jobs").insert({
            "user_id": user_id,
            "job_id": request.job_id,
            "title": request.title,
            "company": request.company,
            "location": request.location,
            "description": request.description,
            "salary_min": request.salary_min,
            "salary_max": request.salary_max,
            "contract_type": request.contract_type,
            "external_url": request.external_url,
            "match_score": request.match_score,
            "matched_keywords": request.matched_keywords,
            "missing_keywords": request.missing_keywords,
            "posted_date": request.posted_date,
        }).execute()

        saved = save_res.data or []
        return saved[0] if saved else {"message": "saved"}

    except Exception as e:
        # If duplicate, that's fine
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return {"message": "already saved"}
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved")
def get_saved_jobs(token: str = Depends(oauth2_scheme)) -> list:
    """Get all saved jobs for user."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    res = supabase.table("saved_jobs").select("*").eq(
        "user_id", user_id
    ).order("created_at", desc=True).execute()

    return res.data or []


@router.delete("/saved/{job_id}")
def unsave_job(
    job_id: str,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Remove a job from favorites."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.table("saved_jobs").delete().eq(
        "user_id", user_id
    ).eq("job_id", job_id).execute()

    return {"message": "removed"}