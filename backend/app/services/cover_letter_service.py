import os
import re
from dotenv import load_dotenv
from fastapi import HTTPException
import anthropic

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))


def generate_cover_letter(
    cv_text: str,
    job_offer: str,
    user_name: str,
    user_email: str,
    user_phone: str = "",
    tone: str = "professional",
    length: str = "medium",
) -> str:
    """Generate a cover letter using Claude AI."""

    length_map = {
        "short": "200 words maximum",
        "medium": "between 300 and 400 words",
        "long": "between 450 and 550 words",
    }

    tone_map = {
        "professional": "formal and professional",
        "friendly": "warm and approachable while remaining professional",
        "creative": "original and creative while remaining respectful",
    }

    word_count = length_map.get(length, "between 300 and 400 words")
    tone_desc = tone_map.get(tone, "formal and professional")

    prompt = f"""You are an expert at writing professional cover letters in French.

CANDIDATE CV:
{cv_text}

JOB OFFER:
{job_offer}

CANDIDATE INFORMATION:
Name: {user_name}
Email: {user_email}
Phone: {user_phone}

INSTRUCTIONS:
Write a cover letter in english  with these requirements:
1. Tone: {tone_desc}
2. Length: {word_count}
3. Structure:
   - City and date (use "Agadir, le [current date]")
   - Company name and subject line
   - Opening "Madame, Monsieur,"
   - Paragraph 1: Introduction and why you apply
   - Paragraph 2: Your relevant skills and concrete projects from the CV
   - Paragraph 3: Motivation for this company and availability
   - Closing formula
   - Signature with full name
4. Make it PERSONAL — cite specific projects from the CV
5. Add keywords from the job offer naturally
6. Do NOT invent fake experience

CRITICAL: Return ONLY the letter text, no markdown, no backticks, no explanation.

Write the letter now:"""

    try:
        print("Calling Claude AI for cover letter...")
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        letter_text = response.content[0].text.strip()

        # Remove markdown blocks if present
        letter_text = re.sub(r'^```\s*', '', letter_text)
        letter_text = re.sub(r'\s*```$', '', letter_text)
        letter_text = letter_text.strip()

        print(f"Cover letter generated ({len(letter_text)} chars)")
        return letter_text

    except Exception as exc:
        print(f"COVER LETTER ERROR: {type(exc).__name__}: {exc}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Cover letter generation failed: {str(exc)}"
        ) from exc