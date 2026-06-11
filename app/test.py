from app.security.jwt_handler import create_refresh_token,decode_token
from app.core.config import settings
create = create_refresh_token({"sub":"1",
                               "type":"refresh"})
decode = decode_token(create)
print(settings.ALGORITHM)
print(decode)