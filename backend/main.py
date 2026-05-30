from dotenv import load_dotenv

# Load environment variables at startup.
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router

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


@app.get("/")
def root() -> dict:
    return {
        "message": "Cvly API is running",
        "version": "1.0.0",
        "docs": "/docs",
    }