from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import OAuth2PasswordBearer

from app.models.cv import CvResponse
from app.services.auth_service import decode_token
from app.services.cv_service import (
    MAX_FILE_SIZE_BYTES,
    delete_cv,
    get_cvs_by_user,
    parse_pdf_text,
    save_cv_to_db,
    upload_cv_to_supabase,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    payload = decode_token(token)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    return user_id


@router.post("/upload", response_model=CvResponse)
async def upload_cv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
) -> CvResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    is_pdf = (
        file.content_type == "application/pdf"
        or file.filename.lower().endswith(".pdf")
    )

    if not is_pdf:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size must not exceed 5MB")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    parsed_text = parse_pdf_text(file_bytes)
    file_url = upload_cv_to_supabase(file_bytes, file.filename, user_id)

    cv_record = save_cv_to_db(
        user_id=user_id,
        filename=file.filename,
        file_url=file_url,
        parsed_text=parsed_text,
        file_size=len(file_bytes),
    )

    return CvResponse(**cv_record)


@router.get("", response_model=List[CvResponse])
def list_cvs(user_id: str = Depends(get_current_user_id)) -> List[CvResponse]:
    cvs = get_cvs_by_user(user_id)
    return [CvResponse(**cv) for cv in cvs]


@router.delete("/{cv_id}")
def remove_cv(
    cv_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    deleted = delete_cv(cv_id, user_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="CV not found")

    return {"message": "CV deleted successfully"}
