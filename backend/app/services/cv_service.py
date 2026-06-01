import os
import re
from io import BytesIO

import pdfplumber
from fastapi import HTTPException

from app.database.supabase import supabase

CV_BUCKET = "cvs"
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


def _sanitize_filename(filename: str) -> str:
    # Prevent path traversal and keep only safe characters in the stored name.
    base_name = os.path.basename(filename)
    safe_name = re.sub(r"[^\w.\-]", "_", base_name)
    return safe_name or "cv.pdf"


def _storage_path(user_id: str, filename: str) -> str:
    return f"{user_id}/{_sanitize_filename(filename)}"


def upload_cv_to_supabase(file_bytes: bytes, filename: str, user_id: str) -> str:
    """Upload a PDF to Supabase Storage and return its public URL."""
    path = _storage_path(user_id, filename)

    try:
        supabase.storage.from_(CV_BUCKET).upload(
            path,
            file_bytes,
            file_options={
                "content-type": "application/pdf",
                "upsert": "true",
            },
        )
    except Exception as exc:
        print("UPLOAD CV TO SUPABASE ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to upload CV to storage",
        ) from exc

    public_url = supabase.storage.from_(CV_BUCKET).get_public_url(path)
    return public_url


def parse_pdf_text(file_bytes: bytes) -> str:
    """Extract text from a PDF using pdfplumber."""
    text_parts: list[str] = []

    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as exc:
        print("PARSE PDF ERROR:", exc)
        raise HTTPException(
            status_code=400,
            detail="Failed to parse PDF file",
        ) from exc

    return "\n".join(text_parts).strip()


def save_cv_to_db(
    user_id: str,
    filename: str,
    file_url: str,
    parsed_text: str,
    file_size: int,
) -> dict:
    """Insert a CV record into the cvs table."""
    safe_filename = _sanitize_filename(filename)

    try:
        response = (
            supabase.table("cvs")
            .insert(
                {
                    "user_id": user_id,
                    "filename": safe_filename,
                    "file_url": file_url,
                    "parsed_text": parsed_text,
                    "file_size": file_size,
                }
            )
            .execute()
        )

        data = response.data or []

        if not data:
            raise HTTPException(status_code=500, detail="Failed to save CV record")

        return data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print("SAVE CV TO DB ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to save CV to database",
        ) from exc


def get_cvs_by_user(user_id: str) -> list:
    """Return all CVs for a user, newest first."""
    try:
        response = (
            supabase.table("cvs")
            .select("*")
            .eq("user_id", user_id)
            .order("uploaded_at", desc=True)
            .execute()
        )

        return response.data or []

    except Exception as exc:
        print("GET CVS BY USER ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch CVs",
        ) from exc


def _delete_cv_from_storage(user_id: str, filename: str) -> None:
    path = _storage_path(user_id, filename)

    try:
        supabase.storage.from_(CV_BUCKET).remove([path])
    except Exception as exc:
        print("DELETE CV FROM STORAGE ERROR:", exc)
        # Storage deletion failure should not block DB cleanup attempts.


def delete_cv(cv_id: str, user_id: str) -> bool:
    """Delete a CV record and its file from Supabase Storage."""
    try:
        response = (
            supabase.table("cvs")
            .select("*")
            .eq("id", cv_id)
            .eq("user_id", user_id)
            .execute()
        )

        data = response.data or []

        if not data:
            return False

        cv_record = data[0]
        _delete_cv_from_storage(user_id, cv_record["filename"])

        supabase.table("cvs").delete().eq("id", cv_id).eq("user_id", user_id).execute()

        return True

    except Exception as exc:
        print("DELETE CV ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete CV",
        ) from exc
