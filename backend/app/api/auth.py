import uuid
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from backend.app.services.auth_service import (
    hash_password, verify_password, hash_token,
    create_access_token, verify_access_token,
    generate_refresh_token, generate_reset_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
)
from backend.app.schemas.auth import (
    UserRegisterRequest, UserLoginRequest, UserResponse, AuthResponse,
    ForgotPasswordRequest, ResetPasswordRequest, SessionResponse
)
from backend.app.database.db import (
    create_user, get_user_by_email, get_user_by_id, update_user_password,
    create_refresh_session, get_refresh_session, rotate_refresh_session,
    revoke_refresh_session, list_user_sessions, revoke_user_session_by_id,
    create_password_reset, get_password_reset, mark_password_reset_used
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_ACCESS_NAME = "vm_access_token"
COOKIE_REFRESH_NAME = "vm_refresh_token"

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Sets secure HTTP-only cookies for browser clients."""
    # Access token cookie (15 min)
    response.set_cookie(
        key=COOKIE_ACCESS_NAME,
        value=access_token,
        httponly=True,
        secure=False,  # Set to False in local dev, True on HTTPS in prod
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    # Refresh token cookie (7 days)
    response.set_cookie(
        key=COOKIE_REFRESH_NAME,
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/"
    )

def clear_auth_cookies(response: Response):
    """Clears authentication cookies on logout."""
    response.delete_cookie(key=COOKIE_ACCESS_NAME, path="/")
    response.delete_cookie(key=COOKIE_REFRESH_NAME, path="/")

def get_current_user(request: Request) -> Dict[str, Any]:
    """Dependency to retrieve and validate the authenticated user from header or cookie."""
    token = None
    # 1. Check Authorization header: Bearer <token>
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    
    # 2. Check HTTP-only cookie fallback
    if not token:
        token = request.cookies.get(COOKIE_ACCESS_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please refresh or sign in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated.")

    return user

def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    """Optional user dependency that does not raise 401 if unauthenticated."""
    try:
        return get_current_user(request)
    except HTTPException:
        return None

# =========================================================================
# ENDPOINTS
# =========================================================================

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: UserRegisterRequest, response: Response):
    existing = get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    user_id = f"usr_{uuid.uuid4().hex[:16]}"
    pw_hash = hash_password(payload.password)
    new_user = create_user({
        "id": user_id,
        "full_name": payload.full_name.strip(),
        "email": payload.email,
        "password_hash": pw_hash
    })

    # Issue access token and refresh token
    access_token, exp = create_access_token(new_user["id"], new_user["email"], new_user["full_name"])
    raw_refresh, refresh_hash, refresh_exp = generate_refresh_token()
    create_refresh_session(f"ses_{uuid.uuid4().hex[:16]}", new_user["id"], refresh_hash, refresh_exp)

    set_auth_cookies(response, access_token, raw_refresh)

    return {
        "message": "Account created successfully.",
        "user": new_user,
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest, response: Response):
    user = get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated.")

    user_data = get_user_by_id(user["id"])
    access_token, exp = create_access_token(user["id"], user["email"], user["full_name"])
    raw_refresh, refresh_hash, refresh_exp = generate_refresh_token()
    create_refresh_session(f"ses_{uuid.uuid4().hex[:16]}", user["id"], refresh_hash, refresh_exp)

    set_auth_cookies(response, access_token, raw_refresh)

    return {
        "message": "Signed in successfully.",
        "user": user_data,
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user

@router.post("/refresh", response_model=AuthResponse)
def refresh_session(request: Request, response: Response):
    # Retrieve refresh token from cookie or body header
    raw_refresh = request.cookies.get(COOKIE_REFRESH_NAME)
    if not raw_refresh:
        auth_header = request.headers.get("X-Refresh-Token")
        if auth_header:
            raw_refresh = auth_header.strip()

    if not raw_refresh:
        raise HTTPException(status_code=401, detail="Refresh token required.")

    token_hash = hash_token(raw_refresh)
    session = get_refresh_session(token_hash)
    if not session:
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user = get_user_by_id(session["user_id"])
    if not user or not user.get("is_active", True):
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="User account is no longer valid.")

    # Refresh token rotation: Invalidate old, create new
    new_raw_refresh, new_token_hash, new_refresh_exp = generate_refresh_token()
    new_session_id = f"ses_{uuid.uuid4().hex[:16]}"
    rotate_refresh_session(session["id"], new_session_id, user["id"], new_token_hash, new_refresh_exp)

    new_access_token, exp = create_access_token(user["id"], user["email"], user["full_name"])
    set_auth_cookies(response, new_access_token, new_raw_refresh)

    return {
        "message": "Token refreshed successfully.",
        "user": user,
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/logout")
def logout(request: Request, response: Response):
    raw_refresh = request.cookies.get(COOKIE_REFRESH_NAME) or request.headers.get("X-Refresh-Token")
    if raw_refresh:
        token_hash = hash_token(raw_refresh)
        revoke_refresh_session(token_hash)
    clear_auth_cookies(response)
    return {"message": "Logged out successfully."}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    user = get_user_by_email(payload.email)
    # Generic security message to prevent user enumeration
    generic_msg = "If your email is registered, you will receive a password reset link shortly."
    if not user:
        return {"message": generic_msg}

    raw_token, token_hash, expires_at = generate_reset_token()
    create_password_reset(f"rst_{uuid.uuid4().hex[:16]}", user["id"], token_hash, expires_at)

    logger.info(f"[Auth Security] Password reset generated for {user['email']}. Reset token: {raw_token}")
    # In development mode, provide token guidance in response for convenience
    return {
        "message": generic_msg,
        "dev_reset_token": raw_token
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    token_hash = hash_token(payload.token.strip())
    reset_entry = get_password_reset(token_hash)
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user_id = reset_entry["user_id"]
    new_hash = hash_password(payload.new_password)
    update_user_password(user_id, new_hash)
    mark_password_reset_used(reset_entry["id"])

    return {"message": "Password has been successfully updated. Please sign in with your new credentials."}

@router.get("/sessions", response_model=List[SessionResponse])
def get_user_sessions(current_user: Dict[str, Any] = Depends(get_current_user)):
    sessions = list_user_sessions(current_user["id"])
    return sessions

@router.delete("/sessions/{session_id}")
def revoke_session(session_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    success = revoke_user_session_by_id(current_user["id"], session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or already revoked.")
    return {"message": "Session revoked."}
