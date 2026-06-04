import os
import re
import uuid
from io import BytesIO

import pdfplumber
from fastapi import HTTPException

from app.database.supabase import supabase

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
_resolved_bucket: str | None = None


def _sanitize_filename(filename: str) -> str:
    # Prevent path traversal and keep only safe characters in the stored name.
    base_name = os.path.basename(filename)
    safe_name = re.sub(r"[^\w.\-]", "_", base_name).strip("._")

    if not safe_name or safe_name == "pdf":
        safe_name = "cv.pdf"

    if not safe_name.lower().endswith(".pdf"):
        safe_name = f"{safe_name}.pdf"

    return safe_name


def _resolve_cv_bucket() -> str:
    """
    Resolve the Supabase Storage bucket for CV files.

    Bucket names are case-sensitive in the Storage API. If your dashboard bucket
    is named "Cvs", set CV_STORAGE_BUCKET=Cvs in backend/.env.
    """
    global _resolved_bucket

    if _resolved_bucket:
        return _resolved_bucket

    configured = os.getenv("CV_STORAGE_BUCKET", "").strip()

    if configured:
        _resolved_bucket = configured
        return _resolved_bucket

    try:
        buckets = supabase.storage.list_buckets()

        for bucket in buckets:
            name = bucket.name if hasattr(bucket, "name") else str(bucket)

            if name.lower() == "cvs":
                _resolved_bucket = name
                return _resolved_bucket
    except Exception as exc:
        print("LIST STORAGE BUCKETS ERROR:", exc)

    _resolved_bucket = "cvs"
    return _resolved_bucket


def _storage_path(user_id: str, filename: str) -> str:
    unique = uuid.uuid4().hex[:8]
    safe_name = _sanitize_filename(filename)
    return f"{user_id}/{unique}_{safe_name}"


def _storage_failure_message(exc: Exception) -> str:
    message = str(exc)

    if "Bucket not found" in message:
        bucket = _resolve_cv_bucket()
        return (
            f"Storage bucket '{bucket}' was not found. "
            "Create a bucket named 'cvs' in Supabase → Storage, or set "
            "CV_STORAGE_BUCKET to your bucket name (e.g. Cvs) in backend/.env."
        )

    if "row-level security" in message.lower() or "403" in message:
        return (
            "Storage upload denied. Use the Supabase service_role key as "
            "SUPABASE_KEY in backend/.env (not the anon key)."
        )

    return f"Storage upload failed: {message}"


def upload_cv_to_supabase(file_bytes: bytes, filename: str, user_id: str) -> str:
    """
    Upload a PDF to Supabase Storage and return its public URL.

    Raises HTTPException only when CV_REQUIRE_STORAGE=true (default: false).
    Otherwise returns an empty string so ATS analysis can still run on parsed text.
    """
    bucket = _resolve_cv_bucket()
    path = _storage_path(user_id, filename)
    require_storage = os.getenv("CV_REQUIRE_STORAGE", "false").lower() == "true"

    try:
        supabase.storage.from_(bucket).upload(
            path,
            file_bytes,
            file_options={
                "content-type": "application/pdf",
                "upsert": "true",
                "x-upsert": "true",
            },
        )
    except Exception as exc:
        print("UPLOAD CV TO SUPABASE ERROR:", exc)
        detail = _storage_failure_message(exc)

        if require_storage:
            raise HTTPException(status_code=500, detail=detail) from exc

        print("CV upload continuing without storage URL:", detail)
        return ""

    return supabase.storage.from_(bucket).get_public_url(path)


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


def get_cv_by_id(cv_id: str, user_id: str) -> dict | None:
    """Return a single CV if it belongs to the user, else None."""
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
            return None

        return data[0]

    except Exception as exc:
        print("GET CV BY ID ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch CV",
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


def _delete_cv_from_storage(file_url: str | None) -> None:
    if not file_url:
        return

    bucket = _resolve_cv_bucket()
    marker = f"/object/public/{bucket}/"

    if marker not in file_url:
        return

    path = file_url.split(marker, 1)[1]

    try:
        supabase.storage.from_(bucket).remove([path])
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
        _delete_cv_from_storage(cv_record.get("file_url"))

        supabase.table("cvs").delete().eq("id", cv_id).eq("user_id", user_id).execute()

        return True

    except Exception as exc:
        print("DELETE CV ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete CV",
        ) from exc
