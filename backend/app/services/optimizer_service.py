import json
import os
import re
from dotenv import load_dotenv
from fastapi import HTTPException
import anthropic

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))


def optimize_cv(cv_text: str, job_offer: str, analysis: dict) -> dict:
    """Optimize CV text using Claude AI based on ATS analysis."""
    try:
        keywords_missing = analysis.get("keywords_missing", [])
        improvements = analysis.get("improvements", [])

        # Convert improvements list — handle both strings and dicts
        improvements_text = []
        for imp in improvements:
            if isinstance(imp, dict):
                improvements_text.append(imp.get("title", "") or imp.get("description", ""))
            else:
                improvements_text.append(str(imp))

        prompt = f"""You are an expert CV optimizer. Rewrite this CV to maximize its ATS score.

ORIGINAL CV:
{cv_text}

JOB OFFER:
{job_offer}

MISSING KEYWORDS TO ADD:
{', '.join(keywords_missing)}

IMPROVEMENT SUGGESTIONS:
{chr(10).join(f'- {imp}' for imp in improvements_text)}

INSTRUCTIONS:
1. Rewrite the CV keeping ALL original information true
2. Add the missing keywords naturally in relevant sections
3. Use STAR format for experience descriptions
4. Improve professional vocabulary
5. Keep the same language as the original CV
6. Do NOT invent fake experience or skills
7. Make descriptions more specific and impactful

CRITICAL: Return ONLY valid JSON, no markdown, no backticks, no explanation.
Use this exact format:
{{
  "optimized_text": "full optimized CV text here",
  "changes": [
    {{
      "section": "section name",
      "type": "added",
      "description": "what was changed"
    }}
  ],
  "predicted_score": 75
}}"""

        print("Calling Claude AI for optimization...")
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )

        result_text = response.content[0].text.strip()
        print(f"Claude response received ({len(result_text)} chars)")

        # Remove markdown code blocks if present
        result_text = re.sub(r'^```(?:json)?\s*', '', result_text)
        result_text = re.sub(r'\s*```$', '', result_text)
        result_text = result_text.strip()

        # Try to extract JSON if there's extra text
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            result_text = json_match.group(0)

        try:
            result = json.loads(result_text)
        except json.JSONDecodeError as je:
            print(f"JSON parse error: {je}")
            print(f"First 500 chars of response: {result_text[:500]}")
            raise

        # Validate the result has required fields
        if "optimized_text" not in result:
            result["optimized_text"] = cv_text

        if "changes" not in result:
            result["changes"] = []

        if "predicted_score" not in result:
            result["predicted_score"] = 75

        print(f"Optimization successful, predicted_score={result['predicted_score']}")
        return result

    except json.JSONDecodeError as exc:
        print(f"JSON DECODE ERROR: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to parse AI optimization response"
        ) from exc
    except Exception as exc:
        print(f"OPTIMIZE_CV ERROR: {type(exc).__name__}: {exc}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"CV optimization failed: {str(exc)}"
        ) from exc