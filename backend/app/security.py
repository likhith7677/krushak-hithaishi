import os, hashlib, hmac, secrets
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-only-change-me')
ALGORITHM = 'HS256'
COOKIE_SECURE = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'
# Production is fail-closed: never expose sessions with the development secret
# or over an insecure cookie setting.
if os.getenv('KH_PUBLIC_DEPLOYMENT', '').lower() == 'true':
    if len(SECRET_KEY) < 32 or SECRET_KEY == 'dev-only-change-me':
        raise RuntimeError('Public deployment requires a strong SECRET_KEY (32+ characters).')
    if not COOKIE_SECURE:
        raise RuntimeError('Public deployment requires COOKIE_SECURE=true (HTTPS).')

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    value = hashlib.scrypt(password.encode('utf-8'),salt=salt,n=2**14,r=8,p=1)
    return f'scrypt${salt.hex()}${value.hex()}'

def verify_password(password: str, saved: str) -> bool:
    try:
        scheme, salt, hashed = saved.split('$')
        if scheme != 'scrypt': return False
        candidate = hashlib.scrypt(password.encode('utf-8'),salt=bytes.fromhex(salt),n=2**14,r=8,p=1)
        return hmac.compare_digest(candidate,bytes.fromhex(hashed))
    except (ValueError, TypeError):
        return False

def token_for(user: User) -> str:
    return jwt.encode({'sub':str(user.id),'exp':datetime.now(timezone.utc)+timedelta(hours=24)},SECRET_KEY,algorithm=ALGORITHM)

def current_user(request: Request, db: Session=Depends(get_db)) -> User:
    token=request.cookies.get('kh_session')
    if not token:
        raise HTTPException(status_code=401,detail='Please log in')
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM]); user_id=int(payload['sub'])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(status_code=401,detail='Session expired')
    user=db.get(User,user_id)
    if not user: raise HTTPException(status_code=401,detail='User not found')
    return user

def owner_user(user: User=Depends(current_user)) -> User:
    if user.role not in ('owner','admin'): raise HTTPException(status_code=403,detail='Shop owner account required')
    return user

def admin_user(user: User=Depends(current_user)) -> User:
    if user.role != 'admin': raise HTTPException(status_code=403,detail='Admin only')
    return user
