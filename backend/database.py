import os
import json
import hashlib
import binascii

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db.json")

def init_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump({"users": []}, f, indent=2)

def get_db():
    init_db()
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def hash_password(password: str) -> str:
    salt = binascii.hexlify(os.urandom(16)).decode('utf-8')
    dk = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt.encode('utf-8'), 1000, 64)
    return f"{salt}:{binascii.hexlify(dk).decode('utf-8')}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, original_hash = stored_hash.split(":")
        dk = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt.encode('utf-8'), 1000, 64)
        return binascii.hexlify(dk).decode('utf-8') == original_hash
    except Exception:
        return False