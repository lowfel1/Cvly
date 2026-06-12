from dotenv import load_dotenv

# Load environment variables at startup.
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ats import router as ats_router
from app.api.routes.auth import router as auth_router
from app.api.routes.cvs import router as cvs_router
from app.api.routes.optimizer import router as optimizer_router
from app.api.routes.cover_letter import router as cover_letter_router
from app.api.routes.interview import router as interview_router
from app.api.routes.jobs import router as jobs_router




app = FastAPI(
    title="Cvly API",
    description="AI-powered job application automation API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(cvs_router, prefix="/cvs", tags=["CVs"])
app.include_router(ats_router, prefix="/ats", tags=["ATS"])
app.include_router(optimizer_router, prefix="/optimizer", tags=["CV Optimizer"])
app.include_router(cover_letter_router,prefix="/cover-letter",tags=["Cover Letter"])
app.include_router(interview_router,prefix="/interview",tags=["Interview Prep"])
app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])



@app.get("/")
def root() -> dict:
    return {
        "message": "Cvly API is running",
        "version": "1.0.0",
        "docs": "/docs",
    }