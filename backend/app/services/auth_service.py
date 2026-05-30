import os
import bcrypt
from datetime import datetime, timedelta

from fastapi import HTTPException
from jose import JWTError, jwt

from app.database.supabase import supabase


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(data: dict) -> str:
    secret_key = os.getenv("SECRET_KEY")

    if not secret_key:
        raise HTTPException(
            status_code=500,
            detail="SECRET_KEY is missing in environment variables",
        )

    algorithm = os.getenv("ALGORITHM", "HS256")
    expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, secret_key, algorithm=algorithm)


def get_user_by_email(email: str) -> dict | None:
    try:
        response = (
            supabase.table("users")
            .select("*")
            .eq("email", email)
            .execute()
        )

        data = response.data or []

        return data[0] if data else None

    except Exception as exc:
        print("GET USER ERROR:", exc)
        return None


def create_user(
    full_name: str,
    email: str,
    hashed_password: str,
) -> dict:
    try:
        response = (
            supabase.table("users")
            .insert(
                {
                    "full_name": full_name,
                    "email": email,
                    "hashed_password": hashed_password,
                }
            )
            .execute()
        )

        data = response.data or []

        if not data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user",
            )

        return data[0]

    except HTTPException:
        raise

    except Exception as exc:
        print("CREATE USER ERROR:", exc)

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


def get_user_by_id(user_id: str) -> dict | None:
    try:
        response = (
            supabase.table("users")
            .select("*")
            .eq("id", user_id)
            .execute()
        )

        data = response.data or []

        return data[0] if data else None

    except Exception as exc:
        print("GET USER BY ID ERROR:", exc)
        return None


def decode_token(token: str) -> dict:
    secret_key = os.getenv("SECRET_KEY")

    if not secret_key:
        raise HTTPException(
            status_code=500,
            detail="SECRET_KEY is missing",
        )

    algorithm = os.getenv("ALGORITHM", "HS256")

    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[algorithm],
        )

        return payload

    except JWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
        ) from exc


def update_last_login(user_id: str) -> None:
    try:
        supabase.table("users").update(
            {
                "last_login": datetime.utcnow().isoformat(),
            }
        ).eq("id", user_id).execute()

    except Exception as exc:
        print("UPDATE LOGIN ERROR:", exc)