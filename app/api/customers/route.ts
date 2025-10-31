import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";
import { CustomerCreateSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/security";

export async function GET() {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const customers = await withTenant(ctx.tenantId, (tx) => tx.customer.findMany({ orderBy: { name: "asc" } }));
  return NextResponse.json({ customers });
}

export async function POST(req: Request) {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!requireSameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  const parse = CustomerCreateSchema.safeParse(await req.json());
  if (!parse.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { name, email, phone } = parse.data;
  const customer = await withTenant(ctx.tenantId, (tx) => tx.customer.create({ data: { tenantId: ctx.tenantId!, name, email, phone } }));
  return NextResponse.json({ customer }, { status: 201 });
}
