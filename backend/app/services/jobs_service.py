"""
Job Search Service - Cvly
Recherche d'offres d'emploi via l'API JSearch (Indeed + LinkedIn)
avec calcul de score de matching par rapport au CV de l'utilisateur.
"""
import html
import os
import re
from typing import List

import requests
from dotenv import load_dotenv
from fastapi import HTTPException


load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean_job_description(text: str) -> str:
    """
    Nettoie une description d'offre d'emploi en supprimant :
    - Les balises HTML (<a>, <p>, <ul>, <li>, <br>, <div>, etc.)
    - Les fragments d'attributs JSX/HTML qui ont fui (className, href, target, etc.)
    - Les entités HTML (&amp;, &nbsp;, &#39;...)
    - Les espaces et sauts de ligne multiples

    Empêche l'affichage de code parasite dans le frontend.
    """
    if not text:
        return ""

    # 1. Supprime les balises HTML complètes (<tag ...> et </tag>)
    text = re.sub(r'<[^>]+>', ' ', text)

    # 2. Supprime les fragments d'attributs HTML/JSX qui pourraient rester
    #    (className="...", href=..., target="...", aria-label="...", rel="...")
    text = re.sub(r'\b\w+="[^"]*"', ' ', text)
    text = re.sub(r"\b\w+='[^']*'", ' ', text)
    text = re.sub(r'\bhref=\S+', ' ', text)

    # 3. Décode les entités HTML (&amp; → &, &#39; → ', &nbsp; → espace)
    text = html.unescape(text)

    # 4. Normalise les espaces multiples et sauts de ligne
    text = re.sub(r'\s+', ' ', text).strip()

    return text


# ---------------------------------------------------------------------------
# Calcul du score de matching CV / offre
# ---------------------------------------------------------------------------

def calculate_match_score(job_description: str, cv_text: str) -> dict:
    """
    Calcule un score de compatibilité entre une offre d'emploi et un CV
    en se basant sur le matching de mots-clés techniques courants.
    """
    if not cv_text or not job_description:
        return {"score": 0, "matched": [], "missing": []}

    common_keywords = [
        "react", "next.js", "nextjs", "node.js", "nodejs", "express",
        "javascript", "typescript", "html", "css", "tailwind",
        "python", "java", "php", "c++", "c#",
        "mysql", "postgresql", "mongodb", "firebase", "supabase",
        "git", "github", "docker", "kubernetes", "aws", "azure",
        "rest api", "graphql", "agile", "scrum",
        "flutter", "react native", "android", "ios",
        "junior", "senior", "stage", "internship",
        "bachelor", "master", "remote",
        "jest", "testing", "ci/cd",
    ]

    cv_lower = cv_text.lower()
    job_lower = job_description.lower()

    job_keywords = [kw for kw in common_keywords if kw in job_lower]

    if not job_keywords:
        return {"score": 50, "matched": [], "missing": []}

    matched = [kw for kw in job_keywords if kw in cv_lower]
    missing = [kw for kw in job_keywords if kw not in cv_lower]

    score = int((len(matched) / len(job_keywords)) * 100) if job_keywords else 0

    return {
        "score": score,
        "matched": matched[:8],
        "missing": missing[:5]
    }


# ---------------------------------------------------------------------------
# Recherche d'offres via JSearch API
# ---------------------------------------------------------------------------

def search_jobs_jsearch(
    query: str,
    location: str = "",
    contract_type: str = None,
    salary_min: int = None,
    page: int = 1,
    country: str = "ma"
) -> dict:
    """Recherche d'offres d'emploi via l'API JSearch (Indeed + LinkedIn)."""
    if not RAPIDAPI_KEY:
        print("RAPIDAPI_KEY missing, using mock data")
        return get_mock_jobs(query, location)

    try:
        search_query = query or "developer"
        if location:
            search_query = f"{search_query} in {location}"

        headers = {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        }

        params = {
            "query": search_query,
            "page": str(page),
            "num_pages": "1",
            "country": country.lower(),
            "date_posted": "all",
        }

        if contract_type:
            if contract_type.lower() in ["internship", "stage"]:
                params["employment_types"] = "INTERN"
            elif contract_type.lower() == "full-time":
                params["employment_types"] = "FULLTIME"
            elif contract_type.lower() == "part-time":
                params["employment_types"] = "PARTTIME"

        print(f"Calling JSearch with query: {search_query}")
        response = requests.get(JSEARCH_URL, headers=headers, params=params, timeout=15)

        if response.status_code != 200:
            print(f"JSearch API error: {response.status_code} - {response.text[:200]}")
            return get_mock_jobs(query, location)

        data = response.json()
        return data

    except Exception as exc:
        print(f"JSearch search error: {exc}")
        return get_mock_jobs(query, location)


# ---------------------------------------------------------------------------
# Formatage de la réponse avec scores de matching
# ---------------------------------------------------------------------------

def format_jobs_response(raw_data: dict, cv_text: str = "") -> List[dict]:
    """Formate la réponse JSearch avec scores de matching et descriptions nettoyées."""
    jobs = []
    results = raw_data.get("data", raw_data.get("results", []))

    for item in results:
        # ⭐ NETTOYAGE de la description AVANT toute utilisation
        raw_desc = item.get("job_description", item.get("description", ""))
        job_desc = clean_job_description(raw_desc)

        # Calcul du score de matching sur la description nettoyée
        match = calculate_match_score(job_desc, cv_text)

        salary_min = item.get("job_min_salary") or item.get("salary_min")
        salary_max = item.get("job_max_salary") or item.get("salary_max")

        if salary_min:
            salary_min = float(salary_min)
        if salary_max:
            salary_max = float(salary_max)

        location = (
            item.get("job_city", "")
            or item.get("job_country", "")
            or item.get("location", {}).get("display_name", "")
            if isinstance(item.get("location"), dict)
            else item.get("location", "")
        )

        if item.get("job_is_remote"):
            location = "Remote"
        elif item.get("job_city") and item.get("job_country"):
            location = f"{item['job_city']}, {item['job_country']}"

        company_name = (
            item.get("employer_name", "")
            or (item.get("company", {}).get("display_name", "")
                if isinstance(item.get("company"), dict)
                else str(item.get("company", "Unknown")))
        )

        # Nettoyage défensif aussi pour le titre et le nom de l'entreprise
        # (au cas où JSearch renverrait du HTML là aussi)
        clean_title = clean_job_description(item.get("job_title", item.get("title", "")))
        clean_company = clean_job_description(company_name)

        jobs.append({
            "id": str(item.get("job_id", item.get("id", ""))),
            "title": clean_title,
            "company": clean_company or "Unknown",
            "location": location or "Not specified",
            "description": (job_desc[:500] + "...") if len(job_desc) > 500 else job_desc,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "contract_type": item.get("job_employment_type", item.get("contract_type", "")),
            "external_url": item.get("job_apply_link", item.get("redirect_url", "")),
            "posted_date": item.get("job_posted_at_datetime_utc", item.get("created", "")),
            "match_score": match["score"],
            "matched_keywords": match["matched"],
            "missing_keywords": match["missing"],
        })

    return jobs


# ---------------------------------------------------------------------------
# Données de remplacement (mock) en cas d'indisponibilité de l'API
# ---------------------------------------------------------------------------

def get_mock_jobs(query: str = "", location: str = "") -> dict:
    """Données de remplacement quand l'API JSearch est indisponible."""
    mock_jobs = [
        {
            "job_id": "mock_1",
            "job_title": "Développeur Web Full Stack Junior - Stage",
            "employer_name": "DevMaroc Agency",
            "job_city": "Casablanca",
            "job_country": "MA",
            "job_description": "We are looking for a motivated junior developer to join our team and work on modern web applications using React, Node.js and PostgreSQL. JavaScript, HTML, CSS, MySQL, REST API, Git required.",
            "job_min_salary": 4000,
            "job_max_salary": 6000,
            "job_employment_type": "INTERN",
            "job_apply_link": "https://example.com/job1",
            "job_posted_at_datetime_utc": "2026-06-05T10:00:00Z",
            "job_is_remote": False,
        },
        {
            "job_id": "mock_2",
            "job_title": "Frontend Developer Junior - Remote",
            "employer_name": "TechSoft Solutions",
            "job_city": "Remote",
            "job_country": "MA",
            "job_description": "Join our remote team building SaaS products. Looking for someone passionate about JavaScript, React, TypeScript, HTML, CSS and modern frontend development. Git and REST API knowledge required.",
            "job_min_salary": 8000,
            "job_max_salary": 12000,
            "job_employment_type": "FULLTIME",
            "job_apply_link": "https://example.com/job2",
            "job_posted_at_datetime_utc": "2026-06-02T10:00:00Z",
            "job_is_remote": True,
        },
        {
            "job_id": "mock_3",
            "job_title": "Stagiaire Développement Mobile Flutter",
            "employer_name": "Atlas Mobile",
            "job_city": "Agadir",
            "job_country": "MA",
            "job_description": "Stage en développement avec Flutter et Firebase pour notre application mobile e-commerce. Intégration d'APIs REST, gestion d'état, et collaboration en équipe. Idéal pour étudiant Bachelor en informatique.",
            "job_min_salary": 3000,
            "job_max_salary": 5000,
            "job_employment_type": "INTERN",
            "job_apply_link": "https://example.com/job3",
            "job_posted_at_datetime_utc": "2026-06-06T10:00:00Z",
            "job_is_remote": False,
        },
        {
            "job_id": "mock_4",
            "job_title": "Backend Developer Node.js",
            "employer_name": "CloudTech Maroc",
            "job_city": "Rabat",
            "job_country": "MA",
            "job_description": "Développeur backend pour notre plateforme SaaS. Stack: Node.js, Express, MongoDB, REST API. Vous travaillerez en équipe Agile avec Git et participerez à l'architecture des microservices.",
            "job_min_salary": 10000,
            "job_max_salary": 15000,
            "job_employment_type": "FULLTIME",
            "job_apply_link": "https://example.com/job4",
            "job_posted_at_datetime_utc": "2026-06-04T10:00:00Z",
            "job_is_remote": False,
        },
        {
            "job_id": "mock_5",
            "job_title": "Junior PHP MySQL Developer - Stage",
            "employer_name": "WebStudio Agadir",
            "job_city": "Agadir",
            "job_country": "MA",
            "job_description": "Stage de fin d'études pour développeur PHP. Vous travaillerez sur des projets clients avec PHP, MySQL, JavaScript et HTML/CSS. Bonne maitrise de Git requise.",
            "job_min_salary": 2500,
            "job_max_salary": 4000,
            "job_employment_type": "INTERN",
            "job_apply_link": "https://example.com/job5",
            "job_posted_at_datetime_utc": "2026-06-07T10:00:00Z",
            "job_is_remote": False,
        },
        {
            "job_id": "mock_6",
            "job_title": "Full Stack Developer React Next.js",
            "employer_name": "Digital Maroc",
            "job_city": "Casablanca",
            "job_country": "MA",
            "job_description": "Développeur Full Stack avec expérience React, Next.js, TypeScript, MySQL, REST API. Travail en équipe Agile, Git, code reviews.",
            "job_min_salary": 12000,
            "job_max_salary": 18000,
            "job_employment_type": "FULLTIME",
            "job_apply_link": "https://example.com/job6",
            "job_posted_at_datetime_utc": "2026-06-03T10:00:00Z",
            "job_is_remote": False,
        },
    ]

    return {
        "data": mock_jobs,
        "count": len(mock_jobs),
    }