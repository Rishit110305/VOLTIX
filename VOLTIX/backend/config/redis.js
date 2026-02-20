import Redis from "ioredis";
import { EventEmitter } from "events";

const REDIS_URL = process.env.REDIS_URL;

let redis;
let isConnected = false;
let hasLoggedError = false;

if (!REDIS_URL) {
  // ─── No Redis URL configured — run in mock mode ───
  console.log("⚠️  REDIS_URL not set — running without Redis (mock mode)");

  // Lightweight mock that satisfies the same API surface used in the codebase
  const mock = new EventEmitter();
  const noop = () => Promise.resolve(null);
  const noopOk = () => Promise.resolve("OK");

  // Common Redis commands used throughout the app
  ["get", "del", "hget", "hgetall", "hdel", "lrange", "llen", "lpush",
    "rpush", "lpop", "rpop", "smembers", "sismember", "scard",
    "srem", "sadd", "keys", "ttl", "exists", "type", "dbsize",
    "info", "ping", "quit", "disconnect"].forEach((cmd) => {
      mock[cmd] = noop;
    });
  ["set", "hset", "setex", "expire", "pexpire", "mset", "hmset"].forEach((cmd) => {
    mock[cmd] = noopOk;
  });
  // Blocking pops — return null after a short delay so callers don't spin
  mock.brpop = (..._args) => new Promise((r) => setTimeout(() => r(null), 1000));
  mock.blpop = (..._args) => new Promise((r) => setTimeout(() => r(null), 1000));
  mock.incr = () => Promise.resolve(1);
  mock.decr = () => Promise.resolve(0);
  mock.publish = noop;
  mock.subscribe = noop;
  mock.unsubscribe = noop;
  mock.duplicate = () => {
    const dup = new EventEmitter();
    Object.assign(dup, mock);
    dup.duplicate = mock.duplicate;
    return dup;
  };
  mock.status = "close";

  redis = mock;
  isConnected = false; // stays false so safeRedisOperation always uses fallback
} else {
  // ─── Real Redis connection (e.g. Upstash) ───
  const redisConfig = {
    tls: {},
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    retryStrategy(times) {
      const maxRetries = 10;
      if (times > maxRetries) {
        console.error("❌ Redis max retries reached. Stopping reconnection attempts.");
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      console.log(`⏳ Redis retry attempt ${times}/${maxRetries} in ${delay}ms`);
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = ["READONLY", "ECONNRESET"];
      return targetErrors.some((e) => err.message.includes(e));
    },
  };

  redis = new Redis(REDIS_URL, redisConfig);

  redis.on("connect", () => {
    console.log("✅ Redis connected (Upstash)");
    isConnected = true;
    hasLoggedError = false;
  });

  redis.on("ready", () => {
    console.log("🚀 Redis ready");
    isConnected = true;
    hasLoggedError = false;
  });

  redis.on("error", (err) => {
    isConnected = false;
    if (!hasLoggedError) {
      console.error("❌ Redis error:", err.message);
      hasLoggedError = true;
    }
  });

  redis.on("close", () => {
    isConnected = false;
    if (!hasLoggedError) {
      console.log("⚠️ Redis connection closed");
    }
  });

  redis.on("end", () => {
    isConnected = false;
    if (!hasLoggedError) {
      console.log("⚠️ Redis connection ended");
    }
  });
}

// Helper function to check if Redis is available
export const isRedisAvailable = () => isConnected;

// Graceful wrapper for Redis operations
export const safeRedisOperation = async (operation, fallback = null) => {
  if (!isConnected) {
    return fallback;
  }
  try {
    return await operation();
  } catch (error) {
    console.error("❌ Redis operation failed:", error.message);
    return fallback;
  }
};

// Create a duplicate with proper error handling
export const createRedisDuplicate = () => {
  const duplicate = redis.duplicate();

  let duplicateHasLoggedError = false;

  duplicate.on("error", (err) => {
    if (!duplicateHasLoggedError) {
      console.error("❌ Redis duplicate error:", err.message);
      duplicateHasLoggedError = true;
    }
  });

  duplicate.on("connect", () => {
    duplicateHasLoggedError = false;
  });

  return duplicate;
};

export default redis;
