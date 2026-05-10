#!/usr/bin/env python3
"""
One-shot script to create or promote an admin user.

Usage (from apps/api/):
    python create_admin.py admin@omniskill.app YourPassword123!

The script reads DATABASE_URL from the environment (or uses the SQLite default).
Run this locally after `pip install -r requirements.txt` or as a one-off
command on Render: Settings → Shell → python create_admin.py <email> <password>
"""
import os
import sys

# Allow running from any directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select  # noqa: E402

from app.db import engine, init_db  # noqa: E402
from app.models import User, UserRole  # noqa: E402
from app.security import hash_password  # noqa: E402


def create_admin(email: str, password: str) -> None:
    if len(password) < 8:
        print("ERROR: Password must be at least 8 characters.")
        sys.exit(1)

    init_db()

    with Session(engine) as session:
        existing = session.exec(select(User).where(User.email == email.lower())).first()
        if existing:
            if existing.role == UserRole.admin:
                print(f"✓ Already admin: {email}")
                return
            existing.role = UserRole.admin
            existing.password_hash = hash_password(password)
            session.add(existing)
            session.commit()
            print(f"✓ Promoted to admin: {email}")
        else:
            user = User(
                email=email.lower(),
                password_hash=hash_password(password),
                role=UserRole.admin,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"✓ Admin created: {email}  (id={user.id})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    create_admin(sys.argv[1], sys.argv[2])
