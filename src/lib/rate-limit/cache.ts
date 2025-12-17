// -------------------------
// ✅ Rate Limit & Cache Store
// -------------------------

// In-memory store for development (fallback when Redis not configured)
const memoryStore = new Map<string, { data: any; expires: number }>();
const memoryQuota = new Map<string, { count: number; resetAt: number }>();
const memoryCooldown = new Map<string, number>();

// Cleanup expired entries every 5 minutes (Node.js only)
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  // Development: cleanup on access
  // Production: rely on Redis TTL or periodic cleanup
}

// -------------------------
// ✅ Redis Client (Upstash if configured)
// -------------------------
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;

  // Try to use Upstash Redis if configured
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      // Dynamic import to avoid errors if @upstash/redis not installed
      const { Redis } = await import("@upstash/redis");
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return redisClient;
    } catch {
      // Fallback to memory if import fails
    }
  }

  return null;
}

// -------------------------
// ✅ Cache Helpers
// -------------------------
export async function getCachedResult(key: string): Promise<any | null> {
  const redis = await getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(`cache:${key}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch {
      return null;
    }
  }

  // Memory fallback
  const cached = memoryStore.get(key);
  if (cached) {
    if (cached.expires > Date.now()) {
      return cached.data;
    } else {
      // Expired, remove it
      memoryStore.delete(key);
    }
  }
  return null;
}

export async function setCachedResult(
  key: string,
  data: any,
  ttlSeconds: number
): Promise<void> {
  const redis = await getRedisClient();

  if (redis) {
    try {
      await redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(data));
      return;
    } catch {
      // Fallback to memory
    }
  }

  // Memory fallback
  memoryStore.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

export function getCacheKey(payload: any): string {
  // Create a stable hash from the payload
  const str = JSON.stringify(payload, Object.keys(payload).sort());
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `gen:${Math.abs(hash).toString(36)}`;
}

// -------------------------
// ✅ Daily Quota Helpers
// -------------------------
const ANONYMOUS_QUOTA = 5;
const LOGGED_IN_QUOTA = 10;

export async function checkDailyQuota(
  userIdOrIp: string,
  isLoggedIn: boolean,
  userEmail?: string | null
): Promise<{ allowed: boolean; remaining: number; resetAt: number; isBypassed?: boolean }> {
  // ✅ A안: 개발 환경에서는 항상 허용
  if (process.env.NODE_ENV === "development") {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: Date.now() + 24 * 60 * 60 * 1000,
      isBypassed: true,
    };
  }

  // ✅ B안: 테스트 계정 allowlist 확인 (운영 환경에서도)
  if (userEmail) {
    const testEmails = process.env.TEST_USER_EMAILS?.split(",").map((e) => e.trim()) || [];
    if (testEmails.includes(userEmail)) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: Date.now() + 24 * 60 * 60 * 1000,
        isBypassed: true,
      };
    }
  }

  const quota = isLoggedIn ? LOGGED_IN_QUOTA : ANONYMOUS_QUOTA;
  const key = `quota:${userIdOrIp}`;
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

  const redis = await getRedisClient();

  if (redis) {
    try {
      const current = await redis.get(key);
      if (current) {
        const parsed = JSON.parse(current as string);
        if (parsed.resetAt > now) {
          // Still today
          const remaining = Math.max(0, quota - parsed.count);
          return {
            allowed: remaining > 0,
            remaining,
            resetAt: parsed.resetAt,
          };
        }
      }
      // New day or first request
      await redis.setex(
        key,
        Math.ceil((tomorrowStart - now) / 1000),
        JSON.stringify({ count: 0, resetAt: tomorrowStart })
      );
      return {
        allowed: true,
        remaining: quota,
        resetAt: tomorrowStart,
      };
    } catch {
      // Fallback to memory
    }
  }

  // Memory fallback
  const stored = memoryQuota.get(key);
  if (stored && stored.resetAt > now) {
    const remaining = Math.max(0, quota - stored.count);
    return {
      allowed: remaining > 0,
      remaining,
      resetAt: stored.resetAt,
    };
  }

  // New day or first request
  memoryQuota.set(key, { count: 0, resetAt: tomorrowStart });
  return {
    allowed: true,
    remaining: quota,
    resetAt: tomorrowStart,
  };
}

export async function incrementDailyQuota(
  userIdOrIp: string
): Promise<void> {
  const key = `quota:${userIdOrIp}`;
  const redis = await getRedisClient();

  if (redis) {
    try {
      const current = await redis.get(key);
      if (current) {
        const parsed = JSON.parse(current as string);
        await redis.setex(
          key,
          Math.ceil((parsed.resetAt - Date.now()) / 1000),
          JSON.stringify({ ...parsed, count: parsed.count + 1 })
        );
        return;
      }
    } catch {
      // Fallback to memory
    }
  }

  // Memory fallback
  const stored = memoryQuota.get(key);
  if (stored) {
    memoryQuota.set(key, { ...stored, count: stored.count + 1 });
  }
}

// -------------------------
// ✅ Cooldown Helpers
// -------------------------
const COOLDOWN_SECONDS = 10;

export async function checkCooldown(
  userIdOrIp: string
): Promise<{ allowed: boolean; waitSeconds: number }> {
  const key = `cooldown:${userIdOrIp}`;
  const now = Date.now();
  const cooldownMs = COOLDOWN_SECONDS * 1000;

  const redis = await getRedisClient();

  if (redis) {
    try {
      const lastRequest = await redis.get(key);
      if (lastRequest) {
        const lastTime = Number(lastRequest);
        const elapsed = now - lastTime;
        if (elapsed < cooldownMs) {
          return {
            allowed: false,
            waitSeconds: Math.ceil((cooldownMs - elapsed) / 1000),
          };
        }
      }
      await redis.setex(key, COOLDOWN_SECONDS, now.toString());
      return { allowed: true, waitSeconds: 0 };
    } catch {
      // Fallback to memory
    }
  }

  // Memory fallback
  const lastTime = memoryCooldown.get(key);
  if (lastTime && now - lastTime < cooldownMs) {
    return {
      allowed: false,
      waitSeconds: Math.ceil((cooldownMs - (now - lastTime)) / 1000),
    };
  }

  memoryCooldown.set(key, now);
  return { allowed: true, waitSeconds: 0 };
}

// -------------------------
// ✅ User/IP Identification
// -------------------------
export function getUserIdOrIp(req: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Extract IP from headers
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

  return `ip:${ip}`;
}

