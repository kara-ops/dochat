import string
import secrets, uuid
from user_agents import parse
import hashlib

def gen_code():
    alphabet = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(alphabet) for _ in range(6))
    return code
def gen_url_token():
    return secrets.token_urlsafe(32)

def get_uuid():
    return uuid.uuid4()

def user_agent_parse(user_agent:str):
    ua = parse(user_agent)
    device = ""
    device_type = ""
    if ua.is_mobile:
        device = ua.device.family
        device_type = "mobile"
    elif ua.is_tablet:
        device = ua.device.family
        device_type = "tablet"
    else:
        device = f"{ua.browser.family} on {ua.os.family}"
        device_type = "desktop"
        
    return {
        "browser":f"{ua.browser.family},{ua.browser.version_string}",
        "os":f"{ua.os.family},{ua.os.version_string}",
        "device": device,
        "device_type":device_type
    }

def sha_hash(r_token:str):
    return hashlib.sha256(r_token.encode()).hexdigest()


