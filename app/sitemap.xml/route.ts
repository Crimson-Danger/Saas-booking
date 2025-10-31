import { prisma } from "@/lib/prisma";

export async function GET() {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const tenants = await prisma.tenant.findMany({ select: { slug: true } });
  const urls = ["", "/auth/login", "/auth/register", "/dashboard", "/services", "/customers", "/calendar", "/settings"]
    .map((p) => `<url><loc>${base}${p}</loc></url>`)
    .join("");
  const publicUrls = tenants.map((t) => `<url><loc>${base}/book/${t.slug}</loc></url>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
    ${publicUrls}
  </urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}

