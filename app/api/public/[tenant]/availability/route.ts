import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSlots } from "@/lib/availability";

export async function GET(
  req: Request,
  { params }: { params: { tenant: string } }
) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  if (!serviceId || !dateStr) {
    return NextResponse.json({ error: "Parâmetros ausentes" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: params.tenant } });
  if (!tenant) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });

  // Simples: usa fronteiras do dia em UTC e DOW calculado por UTC
  const from = new Date(`${dateStr}T00:00:00Z`);
  const to = new Date(`${dateStr}T23:59:59Z`);
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = ((d.getUTCDay() + 6) % 7) + 1; // 1..7 Mon..Sun

  const [service, dayAvailability, timeOff, busy] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, tenantId: tenant.id, active: true } }),
    prisma.availability.findMany({ where: { tenantId: tenant.id, dayOfWeek: dow }, select: { startTime: true, endTime: true } }),
    prisma.timeOff.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { start: { lte: to }, end: { gte: from } },
        ],
      },
      select: { start: true, end: true },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["SCHEDULED", "COMPLETED"] },
        start: { gte: from },
        end: { lte: to },
      },
      select: { start: true, end: true },
    }),
  ]);

  if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  const slots = computeSlots({
    date: from,
    durationMinutes: service.durationMinutes,
    dayAvailability,
    timeOff,
    busy,
  }).map((d) => d.toISOString());

  return NextResponse.json({ slots });
}
