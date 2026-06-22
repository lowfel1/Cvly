"""
Interview Service - Cvly
Génération de questions d'entretien et évaluation des réponses (écrites + vocales)
via Claude AI.
"""
import json
import os
import re
import traceback

from dotenv import load_dotenv
from fastapi import HTTPException
import anthropic

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_json_response(result_text: str, expect_array: bool = False) -> str:
    """
    Nettoie la réponse de Claude pour en extraire du JSON valide.
    Supprime les éventuels backticks markdown et extrait le bloc JSON.
    """
    result_text = result_text.strip()
    result_text = re.sub(r'^```(?:json)?\s*', '', result_text)
    result_text = re.sub(r'\s*```$', '', result_text)
    result_text = result_text.strip()

    pattern = r'\[.*\]' if expect_array else r'\{.*\}'
    json_match = re.search(pattern, result_text, re.DOTALL)
    if json_match:
        result_text = json_match.group(0)

    return result_text


def _compute_overall_score(technical: int, skills: int, confidence: int) -> int:
    """
    Calcule le score global sur 100 (moyenne arithmétique des 3 scores).
    Retourne un entier (compatible avec la colonne int2 de Supabase).
    """
    return round((technical + skills + confidence) / 3)


# ---------------------------------------------------------------------------
# Génération des questions
# ---------------------------------------------------------------------------

def generate_interview_questions(cv_text: str, job_offer: str) -> list:
    """
    Génère 10 questions d'entretien personnalisées (5 écrites + 5 vocales)
    à partir du CV du candidat et de l'offre d'emploi visée.
    """
    try:
        prompt = f"""You are an expert interview coach.

CANDIDATE CV:
{cv_text}

JOB OFFER:
{job_offer}

Generate EXACTLY 10 personalized interview questions in French based on this CV and job offer.

REQUIREMENTS:
- 5 questions must be WRITTEN type (technical questions to type)
- 5 questions must be VOICE type (behavioral/situational to record orally)
- Mix categories: technical, behavioral, situational
- Mix difficulty: easy, medium, hard
- Questions must be SPECIFIC to the candidate's CV and the job offer
- Questions in French

Return ONLY valid JSON, no markdown, no backticks:
[
  {{
    "index": 0,
    "text": "Question text in French",
    "category": "technical|behavioral|situational",
    "mode": "written|voice",
    "difficulty": "easy|medium|hard",
    "hint": "Optional helpful tip in French"
  }},
  ...
]

Make sure:
- 5 questions have mode "written" (mostly technical)
- 5 questions have mode "voice" (mostly behavioral/situational)
- All questions reference specific things from CV or job offer
- Hints suggest STAR method when appropriate"""

        print("Generating interview questions with Claude AI...")
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )

        result_text = _clean_json_response(response.content[0].text, expect_array=True)
        questions = json.loads(result_text)

        # Validation du nombre de questions et de leur répartition par mode
        written_count = sum(1 for q in questions if q.get("mode") == "written")
        voice_count = sum(1 for q in questions if q.get("mode") == "voice")
        print(f"Generated {len(questions)} questions "
              f"({written_count} written, {voice_count} voice)")

        return questions

    except Exception as exc:
        print(f"INTERVIEW QUESTIONS ERROR: {type(exc).__name__}: {exc}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview questions: {str(exc)}"
        ) from exc


# ---------------------------------------------------------------------------
# Évaluation des réponses écrites
# ---------------------------------------------------------------------------

def evaluate_written_answer(
    question_text: str,
    question_category: str,
    written_answer: str,
    cv_text: str,
    job_offer: str,
) -> dict:
    """
    Évalue une réponse écrite à une question d'entretien.
    Retourne 3 scores sur 100 + overall_score sur 100 + forces/améliorations.
    Les champs vocaux sont initialisés à None.
    """
    try:
        prompt = f"""You are an expert interview coach evaluating a candidate's answer.

QUESTION ({question_category}):
{question_text}

CANDIDATE ANSWER:
{written_answer}

CONTEXT - CANDIDATE CV:
{cv_text[:1500]}

CONTEXT - JOB OFFER:
{job_offer[:1000]}

Evaluate the answer in 3 dimensions and provide detailed feedback in French.

Return ONLY valid JSON, no markdown:
{{
  "technical_score": <0-100>,
  "skills_score": <0-100>,
  "confidence_score": <0-100>,
  "strengths": ["point fort 1 en français", "point fort 2"],
  "improvements": ["amélioration 1 en français", "amélioration 2"]
}}

Scoring guide:
- technical_score: accuracy and depth of technical knowledge
- skills_score: relevance to job requirements and CV
- confidence_score: clarity, structure, specificity (since no voice, base on writing quality)"""

        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )

        result_text = _clean_json_response(response.content[0].text, expect_array=False)
        result = json.loads(result_text)

        # Calcul du score global sur 100 (moyenne des 3 scores)
        result["overall_score"] = _compute_overall_score(
            result["technical_score"],
            result["skills_score"],
            result["confidence_score"],
        )

        # Champs vocaux non applicables pour une réponse écrite
        result["pace_analysis"] = None
        result["tone_analysis"] = None
        result["stress_level"] = None

        return result

    except Exception as exc:
        print(f"EVALUATE WRITTEN ERROR: {type(exc).__name__}: {exc}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate written answer: {str(exc)}"
        ) from exc


# ---------------------------------------------------------------------------
# Évaluation des réponses vocales
# ---------------------------------------------------------------------------

def evaluate_voice_answer(
    question_text: str,
    question_category: str,
    transcript: str,
    cv_text: str,
    job_offer: str,
) -> dict:
    """
    Évalue une réponse vocale (à partir de sa transcription).
    Retourne 3 scores sur 100 + overall_score sur 100
    + analyse vocale (pace, tone, stress) + forces/améliorations.
    """
    try:
        prompt = f"""You are an expert interview coach evaluating a candidate's VOICE answer (transcribed from audio).

QUESTION ({question_category}):
{question_text}

TRANSCRIBED ANSWER:
{transcript}

CONTEXT - CANDIDATE CV:
{cv_text[:1500]}

CONTEXT - JOB OFFER:
{job_offer[:1000]}

Evaluate the answer in 3 dimensions AND analyze voice characteristics from the transcript pattern.

Return ONLY valid JSON, no markdown:
{{
  "technical_score": <0-100>,
  "skills_score": <0-100>,
  "confidence_score": <0-100>,
  "pace_analysis": "Steady|Fast|Slow",
  "tone_analysis": "Confident|Hesitant|Nervous",
  "stress_level": "Low|Medium|High",
  "strengths": ["point fort 1 en français", "point fort 2"],
  "improvements": ["amélioration 1 en français", "amélioration 2"]
}}

Analysis guide:
- technical_score: accuracy of content
- skills_score: how well skills are demonstrated
- confidence_score: based on hesitations, filler words, structure
- pace_analysis: based on transcript length and structure
- tone_analysis: based on word choice and certainty markers
- stress_level: detect uncertainty words like "euh", "je pense que", repetitions"""

        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )

        result_text = _clean_json_response(response.content[0].text, expect_array=False)
        result = json.loads(result_text)

        # Calcul du score global sur 100 (moyenne des 3 scores)
        result["overall_score"] = _compute_overall_score(
            result["technical_score"],
            result["skills_score"],
            result["confidence_score"],
        )

        return result

    except Exception as exc:
        print(f"EVALUATE VOICE ERROR: {type(exc).__name__}: {exc}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate voice answer: {str(exc)}"
        ) from exc