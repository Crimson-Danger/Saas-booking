import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const [countMonth, countNoShow, countCompleted] = await withTenant(ctx.tenantId, async (tx) => {
    const [a, b, c] = await Promise.all([
      tx.appointment.count({ where: { start: { gte: from }, end: { lte: to } } }),
      tx.appointment.count({ where: { status: "NO_SHOW", start: { gte: from }, end: { lte: to } } }),
      tx.appointment.count({ where: { status: "COMPLETED", start: { gte: from }, end: { lte: to } } }),
    ]);
    return [a, b, c] as const;
  });
  const attendanceRate = countMonth ? Math.round(((countCompleted) / countMonth) * 100) : 0;
  return NextResponse.json({ appointmentsThisMonth: countMonth, attendanceRate });
}

