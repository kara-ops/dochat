-- KEYS[1] = bucker name/key
-- ARGV[1] = capacity of that bucket
-- ARGV[2] = whats the refill rate per second
-- ARGV[3] = current time


local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET',key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])

if tokens == nil then
    
    tokens = capacity
    last_refill = now
end

local elapsed = now - last_refill
local refill_ammount = elapsed * refill_rate
tokens = math.min(capacity, tokens + refill_ammount)

local allowed = 0
if tokens >= 1 then 
    tokens = tokens - 1
    allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) * 2)

return allowed

