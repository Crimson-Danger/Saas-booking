import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmation } from "@/lib/email";
import { AppointmentCreatePublicSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: { tenant: string } }) {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: params.tenant } });
    if (!tenant) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });

    const parsed = AppointmentCreatePublicSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const { serviceId, dateTimeISO, name, email, phone } = parsed.data;

    const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId: tenant.id } });
    if (!service) return NextResponse.json({ error: "Serviço inválido" }, { status: 400 });

    const start = new Date(dateTimeISO);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // Upsert customer by email within tenant
    const customer = await prisma.customer.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      create: { tenantId: tenant.id, name, email, phone },
      update: { name, phone },
    });

    // Check overlap and timeoff
    const conflict = await prisma.appointment.findFirst({
      where: {
        tenantId: tenant.id,
        status: { in: ["SCHEDULED", "COMPLETED"] },
        OR: [
          { start: { lt: end }, end: { gt: start } },
        ],
      },
    });
    if (conflict) return NextResponse.json({ error: "Horário indisponível" }, { status: 409 });

    const timeoff = await prisma.timeOff.findFirst({
      where: {
        tenantId: tenant.id,
        start: { lt: end },
        end: { gt: start },
      },
    });
    if (timeoff) return NextResponse.json({ error: "Horário bloqueado" }, { status: 409 });

    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        serviceId: service.id,
        start,
        end,
        status: "SCHEDULED",
      },
      include: { customer: true, service: true },
    });

    // Send email confirmation (best-effort)
    try {
      const when = start.toLocaleString("pt-BR", { timeZone: tenant.timezone || "UTC" });
      await sendAppointmentConfirmation({
        to: appointment.customer.email,
        tenantName: tenant.name,
        serviceName: appointment.service.name,
        when,
      });
    } catch (e) {
      // Ignore email errors in MVP
      console.error("Email send failed", e);
    }

    return NextResponse.json({ ok: true, appointmentId: appointment.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
