from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from app.models.interview import (
    GenerateQuestionsRequest,
    EvaluateAnswerRequest,
)
from app.services.auth_service import decode_token
from app.services.interview_service import (
    generate_interview_questions,
    evaluate_written_answer,
    evaluate_voice_answer,
)
from app.database.supabase import supabase

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/generate")
def generate_session(
    request: GenerateQuestionsRequest,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Generate a new interview session with 10 personalized questions."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get CV
        cv_res = supabase.table("cvs").select("*").eq(
            "id", request.cv_id
        ).eq("user_id", user_id).execute()
        cv_data = cv_res.data or []
        if not cv_data:
            raise HTTPException(status_code=404, detail="CV not found")
        cv = cv_data[0]

        # Get latest analysis to get job offer
        job_offer = ""
        if request.analysis_id:
            analysis_res = supabase.table("ats_analyses").select("*").eq(
                "id", request.analysis_id
            ).execute()
        else:
            analysis_res = supabase.table("ats_analyses").select("*").eq(
                "cv_id", request.cv_id
            ).eq("user_id", user_id).order(
                "created_at", desc=True
            ).limit(1).execute()

        analysis_data = analysis_res.data or []
        analysis_id = None
        if analysis_data:
            job_offer = analysis_data[0].get("job_offer", "")
            analysis_id = analysis_data[0].get("id")

        # Generate questions with Claude AI
        questions = generate_interview_questions(
            cv_text=cv.get("parsed_text", ""),
            job_offer=job_offer,
        )

        # Save session
        save_res = supabase.table("interview_sessions").insert({
            "user_id": user_id,
            "cv_id": request.cv_id,
            "analysis_id": analysis_id,
            "job_offer": job_offer,
            "questions": questions,
            "total_questions": len(questions),
            "status": "in_progress",
        }).execute()

        saved = save_res.data or []
        if saved:
            return saved[0]
        return {"questions": questions}

    except HTTPException:
        raise
    except Exception as e:
        print(f"INTERVIEW GENERATE ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate")
def evaluate_answer(
    request: EvaluateAnswerRequest,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Evaluate a single answer (written or voice)."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get session
        session_res = supabase.table("interview_sessions").select("*").eq(
            "id", request.session_id
        ).eq("user_id", user_id).execute()
        session_data = session_res.data or []
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        session = session_data[0]

        # Get CV
        cv_res = supabase.table("cvs").select("*").eq(
            "id", session["cv_id"]
        ).execute()
        cv_data = cv_res.data or []
        cv_text = cv_data[0].get("parsed_text", "") if cv_data else ""

        # Evaluate
        if request.answer_mode == "written":
            if not request.written_answer or len(request.written_answer.strip()) < 10:
                raise HTTPException(
                    status_code=400,
                    detail="Written answer too short"
                )
            evaluation = evaluate_written_answer(
                question_text=request.question_text,
                question_category=request.question_category,
                written_answer=request.written_answer,
                cv_text=cv_text,
                job_offer=session.get("job_offer", ""),
            )
        else:
            if not request.audio_transcript or len(request.audio_transcript.strip()) < 10:
                raise HTTPException(
                    status_code=400,
                    detail="Audio transcript too short"
                )
            evaluation = evaluate_voice_answer(
                question_text=request.question_text,
                question_category=request.question_category,
                transcript=request.audio_transcript,
                cv_text=cv_text,
                job_offer=session.get("job_offer", ""),
            )

        # Save answer
        save_res = supabase.table("interview_answers").insert({
            "session_id": request.session_id,
            "user_id": user_id,
            "question_index": request.question_index,
            "question_text": request.question_text,
            "question_category": request.question_category,
            "answer_mode": request.answer_mode,
            "written_answer": request.written_answer,
            "audio_transcript": request.audio_transcript,
            "technical_score": evaluation["technical_score"],
            "skills_score": evaluation["skills_score"],
            "confidence_score": evaluation["confidence_score"],
            "overall_score": evaluation["overall_score"],
            "pace_analysis": evaluation.get("pace_analysis"),
            "tone_analysis": evaluation.get("tone_analysis"),
            "stress_level": evaluation.get("stress_level"),
            "strengths": evaluation["strengths"],
            "improvements": evaluation["improvements"],
        }).execute()

        saved = save_res.data or []
        return saved[0] if saved else evaluation

    except HTTPException:
        raise
    except Exception as e:
        print(f"EVALUATE ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
def get_sessions(token: str = Depends(oauth2_scheme)) -> list:
    """Get all interview sessions for user."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    res = supabase.table("interview_sessions").select("*").eq(
        "user_id", user_id
    ).order("created_at", desc=True).execute()
    return res.data or []


@router.get("/sessions/{session_id}")
def get_session(
    session_id: str,
    token: str = Depends(oauth2_scheme),
) -> dict:
    """Get a specific session with all answers."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    session_res = supabase.table("interview_sessions").select("*").eq(
        "id", session_id
    ).eq("user_id", user_id).execute()
    session_data = session_res.data or []
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    answers_res = supabase.table("interview_answers").select("*").eq(
        "session_id", session_id
    ).order("question_index").execute()

    return {
        "session": session_data[0],
        "answers": answers_res.data or [],
    }