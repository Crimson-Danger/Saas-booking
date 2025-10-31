import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json();
  const appointment = await withTenant(ctx.tenantId, (tx) => tx.appointment.update({ where: { id: params.id }, data: body }));
  return NextResponse.json({ appointment });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await withTenant(ctx.tenantId, (tx) => tx.appointment.update({ where: { id: params.id }, data: { status: "CANCELLED" } }));
  return NextResponse.json({ ok: true });
}

