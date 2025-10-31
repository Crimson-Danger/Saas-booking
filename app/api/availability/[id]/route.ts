import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await withTenant(ctx.tenantId, (tx) => tx.availability.delete({ where: { id: params.id } }));
  return NextResponse.json({ ok: true });
}

