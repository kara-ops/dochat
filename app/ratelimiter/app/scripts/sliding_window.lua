-- KEYS[1] = rate limit key
-- ARGV[1] = current time stamps
-- ARGV[2] = window size in seconds
-- ARGV[3] = limit  


local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local uuid = tonumber(ARGV[4])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

local count = redis.call('ZCARD', key)

if count < limit then 
    redis.call('ZADD', key, now, uuid)
    redis.call('EXPIRE', key, window)
    return 1
else
    return 0
end
