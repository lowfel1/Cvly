import os

from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from .env file.
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url:
    raise ValueError("Missing required environment variable: SUPABASE_URL")

if not supabase_key:
    raise ValueError("Missing required environment variable: SUPABASE_KEY")

supabase = create_client(supabase_url, supabase_key)
