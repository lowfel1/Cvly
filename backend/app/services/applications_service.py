from datetime import datetime
from typing import Optional
from fastapi import HTTPException

from app.database.supabase import supabase
from app.models.applications import (
    ApplicationCreateRequest,
    ApplicationUpdateRequest,
)


def create_application_for_user(
    user_id: str,
    request: ApplicationCreateRequest,
) -> dict:
    """Create a new application in the database."""
    try:
        salary_min = int(request.salary_min) if request.salary_min else None
        salary_max = int(request.salary_max) if request.salary_max else None

        result = supabase.table("applications").insert({
            "user_id": user_id,
            "job_title": request.job_title,
            "company": request.company,
            "location": request.location,
            "external_url": request.external_url,
            "contract_type": request.contract_type,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "status": request.status,
            "notes": request.notes,
            "next_step": request.next_step,
        }).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create application")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


def get_applications_for_user(user_id: str) -> list:
    """Fetch all applications for a user, sorted by position and date."""
    try:
        result = (
            supabase.table("applications")
            .select("*")
            .eq("user_id", user_id)
            .order("position", desc=False)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


def update_application_for_user(
    user_id: str,
    application_id: str,
    request: ApplicationUpdateRequest,
) -> dict:
    """Update an application's status, notes, position or interview date."""
    update_data = {"updated_at": datetime.utcnow().isoformat()}

    if request.status is not None:
        update_data["status"] = request.status
        # Auto-fill response_date when moving to interview
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
        result = (
            supabase.table("applications")
            .update(update_data)
            .eq("id", application_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Application not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


def delete_application_for_user(user_id: str, application_id: str) -> dict:
    """Delete an application by id and user."""
    try:
        supabase.table("applications").delete().eq(
            "id", application_id
        ).eq("user_id", user_id).execute()
        return {"message": "deleted", "id": application_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


def compute_stats_for_user(user_id: str) -> dict:
    """Compute application statistics."""
    try:
        result = (
            supabase.table("applications")
            .select("status")
            .eq("user_id", user_id)
            .execute()
        )

        apps = result.data or []
        total = len(apps)

        applied = sum(1 for a in apps if a["status"] == "applied")
        review = sum(1 for a in apps if a["status"] == "review")
        interview = sum(1 for a in apps if a["status"] == "interview")
        offer = sum(1 for a in apps if a["status"] == "offer")
        rejected = sum(1 for a in apps if a["status"] == "rejected")

        if total > 0:
            response_rate = round(((review + interview + offer) / total) * 100)
            interview_rate = round(((interview + offer) / total) * 100)
        else:
            response_rate = 0
            interview_rate = 0

        return {
            "total": total,
            "applied": applied,
            "review": review,
            "interview": interview,
            "offer": offer,
            "rejected": rejected,
            "response_rate": response_rate,
            "interview_rate": interview_rate,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")