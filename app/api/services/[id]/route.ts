import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const service = await withTenant(ctx.tenantId, (tx) => tx.service.findUnique({ where: { id: params.id } }));
  if (!service) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ service });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json();
  const service = await withTenant(ctx.tenantId, (tx) => tx.service.update({ where: { id: params.id }, data: body }));
  return NextResponse.json({ service });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await withTenant(ctx.tenantId, (tx) => tx.service.delete({ where: { id: params.id } }));
  return NextResponse.json({ ok: true });
}

