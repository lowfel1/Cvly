from typing import Optional

from pydantic import BaseModel


class CvResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    file_url: Optional[str] = None
    parsed_text: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: str
