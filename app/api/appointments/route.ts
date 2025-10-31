import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";
import { requireSameOrigin } from "@/lib/security";

export async function GET(req: Request) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where: any = {};
  if (from) where.start = { gte: new Date(from) };
  if (to) where.end = { lte: new Date(to) };
  const appointments = await withTenant(ctx.tenantId, (tx) =>
    tx.appointment.findMany({ where, include: { customer: true, service: true }, orderBy: { start: "asc" } })
  );
  return NextResponse.json({ appointments });
}

export async function POST(req: Request) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!requireSameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  const body = await req.json();
  const { customerId, serviceId, start, end, notes } = body as {
    customerId: string; serviceId: string; start: string; end?: string; notes?: string;
  };
  const svc = await withTenant(ctx.tenantId, (tx) => tx.service.findUnique({ where: { id: serviceId } }));
  if (!svc) return NextResponse.json({ error: "Serviço inválido" }, { status: 400 });
  const s = new Date(start);
  const e = new Date(end || s.getTime() + svc.durationMinutes * 60000);
  const appt = await withTenant(ctx.tenantId, (tx) => tx.appointment.create({ data: { tenantId: ctx.tenantId!, customerId, serviceId, start: s, end: e, notes } }));
  return NextResponse.json({ appointment: appt }, { status: 201 });
}
