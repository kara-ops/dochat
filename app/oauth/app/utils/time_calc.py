from datetime import timedelta,timezone,datetime

def c_plus_d(days:int):
    time = datetime.now(timezone.utc) + timedelta(days=days)
    return time

def current_time():
    return datetime.now(timezone.utc)