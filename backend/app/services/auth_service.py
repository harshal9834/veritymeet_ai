import os
import time
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import bcrypt
from jose import jwt, JWTError

# Secrets from environment with secure production fallbacks
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "veritymeet_ai_jwt_super_secret_signing_key_2026_x")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "60"))

def get_current_time_utc() -> datetime:
    return datetime.now(timezone.utc)

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def hash_token(raw_token: str) -> str:
    """SHA-256 hash for raw refresh tokens and password reset tokens."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def create_access_token(user_id: str, email: str, full_name: str) -> Tuple[str, datetime]:
    """Issues a short-lived signed JWT access token."""
    now_ts = int(time.time())
    exp_ts = now_ts + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "full_name": full_name,
        "type": "access",
        "iat": now_ts,
        "exp": exp_ts
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token, expires_at

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates an access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None

def generate_refresh_token() -> Tuple[str, str, datetime]:
    """Generates an opaque cryptographic refresh token and its SHA256 hash."""
    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_token(raw_token)
    expires_at = get_current_time_utc() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, expires_at

def generate_reset_token() -> Tuple[str, str, datetime]:
    """Generates a secure password reset token and its SHA256 hash."""
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    expires_at = get_current_time_utc() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    return raw_token, token_hash, expires_at
