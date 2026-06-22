from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime

from app.models.applications import (
    ApplicationCreateRequest,
    ApplicationUpdateRequest,
)
from app.services.auth_service import decode_token
from app.database.supabase import supabase

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/")
def create_application(
    request: ApplicationCreateRequest,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Create a new job application."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        result = supabase.table("applications").insert({
            "user_id": user_id,
            "job_title": request.job_title,
            "company": request.company,
            "location": request.location,
            "external_url": request.external_url,
            "contract_type": request.contract_type,
            "salary_min": int(request.salary_min) if request.salary_min else None,
            "salary_max": int(request.salary_max) if request.salary_max else None,
            "status": request.status,
            "notes": request.notes,
            "next_step": request.next_step,
        }).execute()

        return result.data[0] if result.data else {"message": "created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def get_applications(token: str = Depends(oauth2_scheme)) -> list:
    """Get all applications for user."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = supabase.table("applications").select("*").eq(
        "user_id", user_id
    ).order("position", desc=False).order("created_at", desc=True).execute()

    return result.data or []


@router.patch("/{application_id}")
def update_application(
    application_id: str,
    request: ApplicationUpdateRequest,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Update application status, notes, or position."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    update_data = {"updated_at": datetime.utcnow().isoformat()}

    if request.status is not None:
        update_data["status"] = request.status
        if request.status == "interview" and not request.interview_date:
            update_data["response_date"] = datetime.utcnow().isoformat()

    if request.notes is not None:
        update_data["notes"] = request.notes

    if request.next_step is not None:
        update_data["next_step"] = request.next_step

    if request.position is not None:
        update_data["position"] = request.position

    if request.interview_date is not None:
        update_data["interview_date"] = request.interview_date.isoformat()

    try:
        result = supabase.table("applications").update(update_data).eq(
            "id", application_id
        ).eq("user_id", user_id).execute()

        return result.data[0] if result.data else {"message": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{application_id}")
def delete_application(
    application_id: str,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Delete an application."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.table("applications").delete().eq(
        "id", application_id
    ).eq("user_id", user_id).execute()

    return {"message": "deleted"}


@router.get("/stats")
def get_stats(token: str = Depends(oauth2_scheme)) -> dict:
    """Get applications statistics."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = supabase.table("applications").select("status").eq(
        "user_id", user_id
    ).execute()

    apps = result.data or []
    total = len(apps)

    stats = {
        "total": total,
        "applied": sum(1 for a in apps if a["status"] == "applied"),
        "review": sum(1 for a in apps if a["status"] == "review"),
        "interview": sum(1 for a in apps if a["status"] == "interview"),
        "offer": sum(1 for a in apps if a["status"] == "offer"),
        "rejected": sum(1 for a in apps if a["status"] == "rejected"),
    }

    if total > 0:
        stats["response_rate"] = round(
            ((stats["review"] + stats["interview"] + stats["offer"]) / total) * 100
        )
    else:
        stats["response_rate"] = 0

    return stats