import os
import re
import requests  
from typing import List
from dotenv import load_dotenv
from fastapi import HTTPException 


load_dotenv()

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"


def calculate_match_score(
    job_description: str,
    cv_text: str
) -> dict:
    """Calculate match score between job and CV based on keywords."""
    if not cv_text or not job_description:
        return {
            "score": 0,
            "matched": [],
            "missing": []
        }

    # Common tech keywords to check
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


def search_jobs_adzuna(
    query: str,
    location: str = "",
    contract_type: str = None,
    salary_min: int = None,
    page: int = 1,
    country: str = "gb"
) -> dict:
    """Search jobs using Adzuna API."""
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        # Fallback to mock data if API keys not configured
        return get_mock_jobs(query, location)

    try:
        url = f"{ADZUNA_BASE_URL}/{country}/search/{page}"
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_APP_KEY,
            "results_per_page": 12,
            "what": query or "developer",
            "where": location,
            "content-type": "application/json",
        }

        if contract_type:
            if contract_type.lower() in ["internship", "stage"]:
                params["what_phrase"] = "internship"
            elif contract_type.lower() == "full-time":
                params["full_time"] = 1
            elif contract_type.lower() == "part-time":
                params["part_time"] = 1

        if salary_min:
            params["salary_min"] = salary_min

        response = requests.get(url, params=params, timeout=10)

        if response.status_code != 200:
            print(f"Adzuna API error: {response.status_code}")
            return get_mock_jobs(query, location)

        data = response.json()
        return data

    except Exception as exc:
        print(f"Adzuna search error: {exc}")
        return get_mock_jobs(query, location)


def get_mock_jobs(query: str = "", location: str = "") -> dict:
    """Mock data fallback when Adzuna is unavailable."""
    mock_jobs = [
        {
            "id": "mock_1",
            "title": "Développeur Web Full Stack Junior - Stage",
            "company": {"display_name": "DevMaroc Agency"},
            "location": {"display_name": "Casablanca, Maroc"},
            "description": "We are looking for a motivated junior developer to join our team and work on modern web applications using React, Node.js and PostgreSQL. You will participate in Agile sprints and contribute to client projects.",
            "salary_min": 4000,
            "salary_max": 6000,
            "contract_type": "permanent",
            "redirect_url": "https://example.com/job1",
            "created": "2026-06-05",
        },
        {
            "id": "mock_2",
            "title": "Frontend Developer Junior",
            "company": {"display_name": "TechSoft Solutions"},
            "location": {"display_name": "Remote"},
            "description": "Join our remote team building SaaS products. Looking for someone passionate about clean code, JavaScript, HTML, CSS and modern frontend development with React or Vue.js.",
            "salary_min": 8000,
            "salary_max": 12000,
            "contract_type": "full_time",
            "redirect_url": "https://example.com/job2",
            "created": "2026-06-02",
        },
        {
            "id": "mock_3",
            "title": "Stagiaire en Développement Web Mobile",
            "company": {"display_name": "Atlas Mobile"},
            "location": {"display_name": "Agadir, Maroc"},
            "description": "Stage en développement avec Flutter et Firebase pour notre application mobile e-commerce. Intégration d'APIs REST, gestion d'état, et collaboration en équipe. Idéal pour étudiant en informatique.",
            "salary_min": 3000,
            "salary_max": 5000,
            "contract_type": "internship",
            "redirect_url": "https://example.com/job3",
            "created": "2026-06-06",
        },
        {
            "id": "mock_4",
            "title": "Backend Developer - Node.js",
            "company": {"display_name": "CloudTech Maroc"},
            "location": {"display_name": "Rabat, Maroc"},
            "description": "Développeur backend pour notre plateforme SaaS. Stack technique: Node.js, Express.js, MongoDB, REST API. Vous travaillerez en équipe Agile avec Git et participerez à l'architecture des microservices.",
            "salary_min": 10000,
            "salary_max": 15000,
            "contract_type": "full_time",
            "redirect_url": "https://example.com/job4",
            "created": "2026-06-04",
        },
        {
            "id": "mock_5",
            "title": "Junior PHP Developer - Stage",
            "company": {"display_name": "WebStudio Agadir"},
            "location": {"display_name": "Agadir, Maroc"},
            "description": "Stage de fin d'études pour développeur PHP. Vous travaillerez sur des projets clients avec PHP, MySQL, JavaScript et HTML/CSS. Bonne maitrise de Git requise.",
            "salary_min": 2500,
            "salary_max": 4000,
            "contract_type": "internship",
            "redirect_url": "https://example.com/job5",
            "created": "2026-06-07",
        },
        {
            "id": "mock_6",
            "title": "Senior Full Stack Engineer",
            "company": {"display_name": "Digital Innovations"},
            "location": {"display_name": "Rabat, Maroc"},
            "description": "Senior developer for our enterprise platform. Lead a team of 5 engineers, architect scalable solutions using microservices, Kubernetes, AWS, Docker. 5+ years experience required.",
            "salary_min": 20000,
            "salary_max": 30000,
            "contract_type": "full_time",
            "redirect_url": "https://example.com/job6",
            "created": "2026-06-01",
        },
    ]

    # Filter by query if provided
    if query:
        query_lower = query.lower()
        mock_jobs = [
            j for j in mock_jobs
            if query_lower in j["title"].lower() or query_lower in j["description"].lower()
        ]

    # Filter by location if provided
    if location:
        loc_lower = location.lower()
        mock_jobs = [
            j for j in mock_jobs
            if loc_lower in j["location"]["display_name"].lower()
        ]

    return {
        "results": mock_jobs,
        "count": len(mock_jobs),
    }


def format_jobs_response(raw_data: dict, cv_text: str = "") -> List[dict]:
    """Format raw Adzuna response with match scores."""
    jobs = []
    results = raw_data.get("results", [])

    for item in results:
        job_desc = item.get("description", "")
        match = calculate_match_score(job_desc, cv_text)

        company = item.get("company", {})
        company_name = company.get("display_name", "Unknown") if isinstance(company, dict) else str(company)

        location = item.get("location", {})
        location_name = location.get("display_name", "") if isinstance(location, dict) else str(location)

        jobs.append({
            "id": str(item.get("id", "")),
            "title": item.get("title", ""),
            "company": company_name,
            "location": location_name,
            "description": job_desc,
            "salary_min": item.get("salary_min"),
            "salary_max": item.get("salary_max"),
            "contract_type": item.get("contract_type", ""),
            "external_url": item.get("redirect_url", ""),
            "posted_date": item.get("created", ""),
            "match_score": match["score"],
            "matched_keywords": match["matched"],
            "missing_keywords": match["missing"],
        })

    return jobs