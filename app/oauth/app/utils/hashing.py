from argon2.exceptions import VerifyMismatchError
from argon2 import PasswordHasher

ph = PasswordHasher(parallelism=2,
                    hash_len=32,
                    salt_len=16,
                    memory_cost=32*1024,
                    time_cost=2
)

def hash_password(password:str)->str:
    return ph.hash(password)

def verify_password(plain_password:str, hashed_password:str):
    try:
        return ph.verify(hashed_password,plain_password)
    except VerifyMismatchError:
        return False

# from passlib.context import CryptContext

# pwd_context = CryptContext(schemes="bcrypt",deprecated="auto")

# def hash_password(password:str)->str:
#     return pwd_context.hash(password)

# def verify_password(plain_password:str,hashed_password:str)->bool:
#     return pwd_context.verify(plain_password,hashed_password)