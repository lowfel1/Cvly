from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the app
app = FastAPI(title="CVLY API")

# Allow the frontend to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic route for testing
@app.get("/")
def home():
    return {"message": "CVLY API is running"}