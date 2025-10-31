export function requireSameOrigin(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const reqOrigin = new URL(req.url).origin;
    return origin === reqOrigin;
  } catch {
    return false;
  }
}

