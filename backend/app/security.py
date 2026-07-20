import argparse
import getpass
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, Request, status
from pwdlib import PasswordHash

from .config import Settings, get_settings


password_hash = PasswordHash.recommended()
COOKIE_NAME = "kitstroit_admin"


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    try:
        return password_hash.verify(password, stored_hash)
    except (ValueError, TypeError):
        return False


def create_token(settings: Settings) -> str:
    now = datetime.now(UTC)
    return jwt.encode(
        {"sub": "admin", "iat": now, "exp": now + timedelta(minutes=settings.jwt_ttl_minutes)},
        settings.jwt_secret,
        algorithm="HS256",
    )


def require_admin(request: Request, settings: Settings = Depends(get_settings)) -> None:
    token = request.cookies.get(COOKIE_NAME)
    if not token or len(settings.jwt_secret) < 32:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated") from exc
    if payload.get("sub") != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["hash-password"])
    args = parser.parse_args()
    if args.command == "hash-password":
        print(password_hash.hash(getpass.getpass("Admin password: ")))


if __name__ == "__main__":
    main()

