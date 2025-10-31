import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { tenant: string } }
) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: params.tenant } });
  if (!tenant) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, durationMinutes: true, priceCents: true },
  });
  return NextResponse.json({ services, tenant: { name: tenant.name, slug: tenant.slug, brandName: tenant.brandName, primaryColor: tenant.primaryColor, brandLogoUrl: tenant.brandLogoUrl } });
}
