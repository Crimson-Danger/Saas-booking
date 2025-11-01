import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { withTenant } from "@/lib/tenant";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const ctx = await requireTenant();
  if (!ctx?.tenantId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const {
    appointmentsThisMonth,
    completedThisMonth,
    noShowsThisMonth,
    appointmentsToday,
    customersTotal,
    revenueThisMonth,
    upcomingAppointments,
    recentNoShows,
    topServices,
  } = await withTenant(ctx.tenantId, async (tx) => {
    const [
      appointmentsThisMonth,
      completedThisMonth,
      noShowsThisMonth,
      appointmentsToday,
      customersTotal,
      completedAppointments,
      upcomingAppointments,
      recentNoShows,
      topServicesRaw,
    ] = await Promise.all([
      tx.appointment.count({ where: { start: { gte: monthStart, lte: monthEnd } } }),
      tx.appointment.count({ where: { status: "COMPLETED", start: { gte: monthStart, lte: monthEnd } } }),
      tx.appointment.count({ where: { status: "NO_SHOW", start: { gte: monthStart, lte: monthEnd } } }),
      tx.appointment.count({ where: { start: { gte: todayStart, lte: todayEnd } } }),
      tx.customer.count(),
      tx.appointment.findMany({
        where: { status: "COMPLETED", start: { gte: monthStart, lte: monthEnd } },
        select: { service: { select: { priceCents: true } } },
      }),
      tx.appointment.findMany({
        where: { status: "SCHEDULED", start: { gte: now } },
        orderBy: { start: "asc" },
        take: 5,
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          service: { select: { name: true, durationMinutes: true } },
        },
      }),
      tx.appointment.findMany({
        where: { status: "NO_SHOW", start: { gte: monthStart, lte: monthEnd } },
        orderBy: { start: "desc" },
        take: 5,
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          service: { select: { name: true } },
        },
      }),
      tx.appointment.groupBy({
        by: ["serviceId"],
        where: { start: { gte: monthStart, lte: monthEnd } },
        _count: { serviceId: true },
        orderBy: { _count: { serviceId: "desc" } },
        take: 5,
      }),
    ]);

    const serviceIds = topServicesRaw.map((s) => s.serviceId).filter(Boolean);
    const servicesDetails = serviceIds.length
      ? await tx.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true, durationMinutes: true },
        })
      : [];
    const serviceMap = new Map(servicesDetails.map((s) => [s.id, s]));

    return {
      appointmentsThisMonth,
      completedThisMonth,
      noShowsThisMonth,
      appointmentsToday,
      customersTotal,
      revenueThisMonth: completedAppointments.reduce(
        (sum, appt) => sum + (appt.service?.priceCents ?? 0),
        0
      ),
      upcomingAppointments: upcomingAppointments.map((appt) => ({
        id: appt.id,
        start: appt.start,
        end: appt.end,
        service: appt.service?.name ?? "Servico",
        durationMinutes: appt.service?.durationMinutes ?? null,
        customer: appt.customer,
      })),
      recentNoShows: recentNoShows.map((appt) => ({
        id: appt.id,
        start: appt.start,
        service: appt.service?.name ?? "Servico",
        customer: appt.customer,
      })),
      topServices: topServicesRaw
        .map((s) => ({
          serviceId: s.serviceId,
          count: s._count.serviceId,
          service: serviceMap.get(s.serviceId ?? "") ?? null,
        }))
        .filter((s) => s.service !== null),
    };
  });

  const attendanceRate = appointmentsThisMonth
    ? Math.round((completedThisMonth / appointmentsThisMonth) * 100)
    : 0;

  return NextResponse.json({
    appointmentsThisMonth,
    attendanceRate,
    completedThisMonth,
    noShowsThisMonth,
    appointmentsToday,
    customersTotal,
    revenueThisMonth,
    upcomingAppointments,
    recentNoShows,
    topServices,
  });
}
