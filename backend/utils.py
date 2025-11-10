# utils.py
import random
import string
import time
from passlib.context import CryptContext


# -------------------------
# PNR generation
# -------------------------

def generate_pnr(length: int = 8) -> str:
    """
    Generate a unique PNR code consisting of uppercase letters and digits.
    """
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=length))

def generate_unique_pnr(length: int = 8) -> str:
    """
    Generate a unique PNR quickly without querying the database.
    Combines random characters + timestamp to minimize collision risk.
    """
    timestamp_part = int(time.time() * 1000)  # milliseconds since epoch
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    return f"{random_part}{timestamp_part}"[:12]  # truncate to max 12 chars
# -------------------------
# Password hashing utils
# -------------------------

# Using bcrypt (72-byte limit)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Alternatively, for longer passwords, you can use argon2:
# pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Hash a plain text password for storage in the database.
    Truncate password to 72 characters (bcrypt byte-safe).
    """
    truncated_password = password[:72]  # <-- keep it as a string
    return pwd_context.hash(truncated_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify that a plain text password matches the hashed password.
    """
    truncated_password = plain_password[:72]  # <-- keep it as a string
    return pwd_context.verify(truncated_password, hashed_password)