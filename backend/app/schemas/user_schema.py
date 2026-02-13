from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class PasswordChangeRequest(BaseModel):
    target_user: str
    new_password: str