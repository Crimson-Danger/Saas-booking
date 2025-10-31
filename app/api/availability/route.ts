import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";
import { AvailabilityCreateSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const parsed = AvailabilityCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { dayOfWeek, startTime, endTime } = parsed.data;
  const item = await withTenant(ctx.tenantId, (tx) => tx.availability.create({ data: { tenantId: ctx.tenantId!, dayOfWeek, startTime, endTime } }));
  return NextResponse.json({ availability: item }, { status: 201 });
}

export async function GET() {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const items = await withTenant(ctx.tenantId, (tx) => tx.availability.findMany({ orderBy: { dayOfWeek: "asc" } }));
  return NextResponse.json({ availability: items });
}
