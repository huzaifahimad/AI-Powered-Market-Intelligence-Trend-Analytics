"""Authentication routes: signup and login."""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from app.core.database import get_database
from app.core.auth import hash_password, verify_password, create_access_token
from app.core.logging import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    """Register a new user account."""
    db = get_database()
    users = db["users"]

    existing = await users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc),
    }
    await users.insert_one(user_doc)
    logger.info(f"New user registered: {payload.email}")

    token = create_access_token(data={"sub": payload.email})
    return AuthResponse(
        access_token=token,
        user={"name": payload.name, "email": payload.email},
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    """Authenticate and return a JWT token."""
    db = get_database()
    user = await db["users"].find_one({"email": payload.email})

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    logger.info(f"User login: {payload.email}")
    token = create_access_token(data={"sub": payload.email})
    return AuthResponse(
        access_token=token,
        user={"name": user["name"], "email": user["email"]},
    )
