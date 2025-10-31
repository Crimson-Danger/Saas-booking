import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";

export async function GET() {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const tenant = await withTenant(ctx.tenantId, (tx) =>
    tx.tenant.findUnique({
      where: { id: ctx.tenantId! },
      select: { id: true, name: true, slug: true, timezone: true, brandName: true, primaryColor: true, brandLogoUrl: true },
    })
  );
  return NextResponse.json({ tenant });
}

export async function PATCH(req: Request) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { brandName, primaryColor, timezone, brandLogoUrl } = (await req.json()) as {
    brandName?: string | null;
    primaryColor?: string | null;
    timezone?: string | null;
    brandLogoUrl?: string | null;
  };
  const tenant = await withTenant(ctx.tenantId, (tx) =>
    tx.tenant.update({
      where: { id: ctx.tenantId! },
      data: { brandName: brandName ?? undefined, primaryColor: primaryColor ?? undefined, timezone: timezone ?? undefined, brandLogoUrl: brandLogoUrl ?? undefined },
      select: { id: true },
    })
  );
  return NextResponse.json({ ok: true, id: tenant.id });
}

