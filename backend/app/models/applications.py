from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel


class ApplicationCreateRequest(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    external_url: Optional[str] = None
    contract_type: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    status: Literal["applied", "review", "interview", "offer", "rejected"] = "applied"
    notes: Optional[str] = None
    next_step: Optional[str] = None


class ApplicationUpdateRequest(BaseModel):
    status: Optional[Literal["applied", "review", "interview", "offer", "rejected"]] = None
    notes: Optional[str] = None
    next_step: Optional[str] = None
    interview_date: Optional[datetime] = None
    position: Optional[int] = None