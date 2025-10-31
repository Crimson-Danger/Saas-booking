import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "Bookings <noreply@example.com>";

export async function sendAppointmentConfirmation(params: {
  to: string;
  tenantName: string;
  serviceName: string;
  when: string; // human readable
}) {
  if (!resendKey) return { id: "dev-noop" };
  const resend = new Resend(resendKey);
  const { to, tenantName, serviceName, when } = params;
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Confirmação de agendamento - ${tenantName}`,
    html: `
      <div>
        <h2>Seu agendamento está confirmado</h2>
        <p>Prestador: <b>${tenantName}</b></p>
        <p>Serviço: <b>${serviceName}</b></p>
        <p>Data e hora: <b>${when}</b></p>
        <p>Obrigado por agendar conosco!</p>
      </div>
    `,
  });
  if (error) throw error;
  return data;
}

