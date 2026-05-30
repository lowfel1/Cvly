from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from app.models.user import LoginRequest, TokenResponse, UserCreate, UserResponse
from app.services.auth_service import (
    create_access_token,
    create_user,
    decode_token,
    get_user_by_email,
    get_user_by_id,
    hash_password,
    update_last_login,
    verify_password,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate) -> TokenResponse:
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user_data.password)
    user = create_user(user_data.full_name, user_data.email, hashed_password)

    access_token = create_access_token(
        {
            "sub": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
        }
    )
    return TokenResponse(access_token=access_token)


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest) -> TokenResponse:
    user = get_user_by_email(login_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    update_last_login(user["id"])

    access_token = create_access_token(
        {
            "sub": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
        }
    )
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_me(token: str = Depends(oauth2_scheme)) -> UserResponse:
    payload = decode_token(token)
    user_id = payload.get("sub")
    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        avatar_url=user.get("avatar_url"),
        plan=user["plan"],
        is_active=user["is_active"],
        created_at=user["created_at"],
        last_login=user.get("last_login"),
    )
