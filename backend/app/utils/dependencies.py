from fastapi import Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models.user import User
from app.utils.jwt_handler import decode_access_token, create_access_token

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        token = credentials.credentials
        user, payload = decode_access_token(token, db, return_payload=True)

        request.state.user = user
        
        exp = payload.get("exp")
        if exp:
            expire_time = datetime.utcfromtimestamp(exp)
            remaining_seconds = (expire_time - datetime.utcnow()).total_seconds()

            if remaining_seconds < 600:
                new_token = create_access_token({
                    "sub": user.username,
                    "tv": user.token_version
                })

                response.headers["X-Refreshed-Token"] = new_token

        return user

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user