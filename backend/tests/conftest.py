"""All API tests use one fresh, isolated SQLite database per pytest session."""
import os, tempfile, uuid
from pathlib import Path
os.environ['DATABASE_URL']='sqlite:///'+str(Path(tempfile.gettempdir()) / f'kh-pytest-{uuid.uuid4().hex}.db')
os.environ['SECRET_KEY']='test-secret-only-at-least-32-characters-long'
os.environ['ADMIN_EMAIL']='moderator@example.org'
os.environ['ADMIN_PHONE']='+919999999998'
os.environ['ADMIN_PASSWORD']='very-strong-admin-password'
