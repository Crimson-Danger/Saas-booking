import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";
import { ServiceCreateSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/security";

export async function GET() {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const services = await withTenant(ctx.tenantId, (tx) =>
    tx.service.findMany({ orderBy: { name: "asc" } })
  );
  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!requireSameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  const parse = ServiceCreateSchema.safeParse(await req.json());
  if (!parse.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { name, durationMinutes, priceCents } = parse.data;
  const service = await withTenant(ctx.tenantId, (tx) =>
    tx.service.create({ data: { tenantId: ctx.tenantId!, name, durationMinutes, priceCents } })
  );
  return NextResponse.json({ service }, { status: 201 });
}
