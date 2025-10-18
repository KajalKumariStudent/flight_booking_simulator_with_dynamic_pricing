# utils.py
import random
import string
from sqlalchemy.exc import IntegrityError
# Generate a unique PNR code(milestone 3)
def generate_pnr(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=length))
