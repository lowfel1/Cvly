from typing import List, Optional

from pydantic import BaseModel, Field


class AtsAnalyzeRequest(BaseModel):
    cv_id: str
    job_description: str = Field(..., min_length=10, max_length=5000)


class AtsScoreBreakdown(BaseModel):
    keywords_match: int = Field(..., ge=0, le=100)
    format_structure: int = Field(..., ge=0, le=100)
    skills_match: int = Field(..., ge=0, le=100)
    experience_match: int = Field(..., ge=0, le=100)
    education_match: int = Field(..., ge=0, le=100)
    overall_score: int = Field(..., ge=0, le=100)


class AtsAnalyzeResponse(BaseModel):
    id: Optional[str] = None           
    analysis_id: Optional[str] = None  
    overall_score: int = Field(..., ge=0, le=100)
    predicted_score: int = Field(..., ge=0, le=100)
    analyzed_at: str
    scores: AtsScoreBreakdown
    keywords_found: List[str]
    keywords_missing: List[str]
    improvements: List[str]
    cv_id: str