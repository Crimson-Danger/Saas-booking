"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

type Service = { id: string; name: string; durationMinutes: number; priceCents: number | null };
type TenantInfo = { name: string; slug: string; brandName?: string | null; primaryColor?: string | null; brandLogoUrl?: string | null };

export default function BookPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [services, setServices] = useState<Service[]>([]);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    fetch(`/api/public/${tenant}/services`)
      .then((r) => r.json())
      .then((j) => { setServices(j.services || []); setTenantInfo(j.tenant || null); });
  }, [tenant]);

  useEffect(() => {
    if (!selectedService || !date) return;
    setSlots([]);
    fetch(`/api/public/${tenant}/availability?serviceId=${selectedService}&date=${date}`)
      .then((r) => r.json())
      .then((j) => setSlots(j.slots || []));
  }, [selectedService, date, tenant]);

  const svc = useMemo(() => services.find((s) => s.id === selectedService), [selectedService, services]);

  useEffect(() => {
    // navega automaticamente entre etapas conforme seleções são feitas
    if (step === 1 && selectedService) setStep(2);
  }, [selectedService, step]);

  async function confirm() {
    if (!selectedService || !slot || !name || !email) return show({ title: "Preencha os dados", variant: "error" });
    setLoading(true);
    const res = await fetch(`/api/public/${tenant}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: selectedService, dateTimeISO: slot, name, email, phone }),
    });
    setLoading(false);
    if (res.ok) {
      setScheduledAt(slot);
      setStep(4);
    } else {
      const j = await res.json().catch(() => ({}));
      show({ title: "Falha ao agendar", description: j.error || "Erro ao agendar", variant: "error" });
    }
  }

  if (step === 4 && scheduledAt) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <BrandHeader tenant={tenantInfo} />
        <Card className="animate-in fade-in-50 slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle>Agendamento confirmado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <p className="mb-2">Enviamos um e-mail de confirmação para você.</p>
                <div className="text-sm text-muted-foreground">
                  Data e hora: {new Date(scheduledAt).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BrandHeader tenant={tenantInfo} />
      <Stepper step={step} />

      {step === 1 && (
        <Card className="animate-in fade-in-50 slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle>1) Escolha o serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
              <option value="">Selecione</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.priceCents ? `- ${(s.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : ""}
                </option>
              ))}
            </Select>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!selectedService}>Avançar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="animate-in fade-in-50 slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle>2) Data e horário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Horário</Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {date && slots.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum horário disponível</p>
                )}
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={`rounded-md border px-3 py-2 text-sm ${slot === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={() => setStep(3)} disabled={!slot}>Avançar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="animate-in fade-in-50 slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle>3) Seus dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {svc && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div><span className="font-medium">Serviço:</span> {svc.name}</div>
                <div className="text-muted-foreground">
                  {svc.durationMinutes} min {svc.priceCents ? `• ${(svc.priceCents/100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : ""}
                </div>
                {slot && (
                  <div className="mt-1">
                    <span className="font-medium">Quando:</span> {new Date(slot).toLocaleString("pt-BR")}
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <Label>Seu nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex justify-between">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={confirm} disabled={loading || !name || !email}>{loading ? (<><Spinner /> <span className="ml-2">Agendando...</span></>) : "Confirmar agendamento"}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BrandHeader({ tenant }: { tenant: TenantInfo | null }) {
  const brand = tenant?.brandName || tenant?.name;
  if (!brand) return null;
  const style = tenant?.primaryColor ? { color: tenant.primaryColor } as React.CSSProperties : undefined;
  return (
    <div className="mb-2 flex items-center gap-3">
      {tenant?.brandLogoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tenant.brandLogoUrl} alt={brand} className="h-10 w-10 rounded-md object-cover border" />
      )}
      <div>
        <h1 className="text-2xl font-semibold" style={style}>{brand}</h1>
        <p className="text-sm text-muted-foreground">Agendamento online</p>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const items = [
    { id: 1, label: "Serviço" },
    { id: 2, label: "Horário" },
    { id: 3, label: "Dados" },
  ] as const;
  return (
    <div className="flex items-center gap-2">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2">
          <Badge className={step === it.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}>
            {it.id}
          </Badge>
          <span className="text-sm">{it.label}</span>
          {it.id < 3 && <div className="mx-1 h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  );
}
