from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class JobSearchRequest(BaseModel):
    query: str = ""
    location: str = ""
    contract_type: Optional[str] = None
    salary_min: Optional[int] = None
    page: int = 1


class Job(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    contract_type: Optional[str] = None
    external_url: str
    posted_date: Optional[str] = None
    match_score: int = 0
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []


class JobSearchResponse(BaseModel):
    jobs: List[Job]
    total: int
    page: int


class SaveJobRequest(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    description: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    contract_type: Optional[str] = None
    external_url: str
    match_score: int = 0
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    posted_date: Optional[str] = None