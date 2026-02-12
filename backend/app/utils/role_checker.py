from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.utils.dependencies import get_current_user

def require_role(required_role: str):
    def role_dependency(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_dependency
