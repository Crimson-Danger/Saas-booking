import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json();
  const customer = await withTenant(ctx.tenantId, (tx) => tx.customer.update({ where: { id: params.id }, data: body }));
  return NextResponse.json({ customer });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await withTenant(ctx.tenantId, (tx) => tx.customer.delete({ where: { id: params.id } }));
  return NextResponse.json({ ok: true });
}

