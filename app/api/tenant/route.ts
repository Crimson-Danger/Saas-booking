import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";

export async function GET() {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const tenant = await withTenant(ctx.tenantId, (tx) =>
    tx.tenant.findUnique({ where: { id: ctx.tenantId! }, select: { id: true, name: true, slug: true } })
  );
  if (!tenant) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
  return NextResponse.json({ tenant });
}

