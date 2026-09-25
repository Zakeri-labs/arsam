// Best-effort fixed-window rate limiter kept in process memory. On serverless
// hosting each instance has its own window, so this slows abuse down rather
// than enforcing a hard global cap — it is a first line of defence only.

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim();
}

/** Counts one hit for `key`; returns false once more than `limit` hits land inside `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function tooManyRequests() {
  return Response.json(
    { error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفا چند دقیقه بعد دوباره تلاش کنید.' },
    { status: 429 }
  );
}
