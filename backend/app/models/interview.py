from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class GenerateQuestionsRequest(BaseModel):
    cv_id: str
    analysis_id: Optional[str] = None


class Question(BaseModel):
    index: int
    text: str
    category: Literal["technical", "behavioral", "situational"]
    mode: Literal["written", "voice"]
    difficulty: Literal["easy", "medium", "hard"]
    hint: Optional[str] = None


class InterviewSessionResponse(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    cv_id: str
    questions: List[Question]
    status: str = "in_progress"
    avg_score: float = 0
    answered_count: int = 0
    total_questions: int = 10


class EvaluateAnswerRequest(BaseModel):
    session_id: str
    question_index: int
    question_text: str
    question_category: str
    answer_mode: Literal["written", "voice"]
    written_answer: Optional[str] = None
    audio_transcript: Optional[str] = None


class AnswerEvaluationResponse(BaseModel):
    id: Optional[str] = None
    session_id: str
    question_index: int
    technical_score: int = Field(..., ge=0, le=100)
    skills_score: int = Field(..., ge=0, le=100)
    confidence_score: int = Field(..., ge=0, le=100)
    overall_score: float
    pace_analysis: Optional[str] = None
    tone_analysis: Optional[str] = None
    stress_level: Optional[str] = None
    strengths: List[str] = []
    improvements: List[str] = []