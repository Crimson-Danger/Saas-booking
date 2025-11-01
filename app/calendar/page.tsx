"use client";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_META: Record<string, { label: string; badgeClass: string; accentClass: string }> = {
  SCHEDULED: { label: "Agendado", badgeClass: "bg-sky-100 text-sky-800", accentClass: "bg-sky-400" },
  COMPLETED: { label: "Concluido", badgeClass: "bg-emerald-100 text-emerald-800", accentClass: "bg-emerald-500" },
  NO_SHOW: { label: "Nao compareceu", badgeClass: "bg-amber-100 text-amber-800", accentClass: "bg-amber-500" },
  CANCELLED: { label: "Cancelado", badgeClass: "bg-rose-100 text-rose-800", accentClass: "bg-rose-500" },
};

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Agendado" },
  { value: "COMPLETED", label: "Concluido" },
  { value: "NO_SHOW", label: "Nao compareceu" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function CalendarPage() {
  const { show } = useToast();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [view, setView] = useState<"day" | "week">("day");
  const from = `${date}T00:00:00Z`;
  const to = `${date}T23:59:59Z`;
  const { data, mutate } = useSWR(`/api/appointments?from=${from}&to=${to}`, fetcher);
  const { data: servicesData } = useSWR("/api/services", fetcher);
  const services = servicesData?.services ?? [];
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    serviceId: "",
    date: "",
    time: "",
    status: "SCHEDULED",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const weekRange = useMemo(() => {
    const d = parseISO(`${date}T00:00:00Z`);
    const start = startOfWeek(d, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [date]);

  const appointments = useMemo(() => data?.appointments ?? [], [data?.appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt: any) => {
      if (serviceFilter !== "all" && appt.serviceId !== serviceFilter) return false;
      if (statusFilter !== "all" && appt.status !== statusFilter) return false;
      if (search) {
        const text = `${appt.customer.name} ${appt.customer.email ?? ""}`.toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [appointments, serviceFilter, statusFilter, search]);

  const summary = useMemo(() => {
    const base = { total: appointments.length } as Record<string, number>;
    for (const key of Object.keys(STATUS_META)) base[key] = 0;
    appointments.forEach((appt: any) => {
      base[appt.status] = (base[appt.status] ?? 0) + 1;
    });
    return base;
  }, [appointments]);

  function startEditing(appt: any) {
    const startDate = new Date(appt.start);
    const dateStr = format(startDate, "yyyy-MM-dd");
    const timeStr = format(startDate, "HH:mm");
    setEditing({ ...appt, originalDate: dateStr });
    setForm({
      serviceId: appt.serviceId,
      date: dateStr,
      time: timeStr,
      status: appt.status,
      notes: appt.notes ?? "",
    });
  }

  function resetEditing() {
    setEditing(null);
    setForm({
      serviceId: "",
      date: "",
      time: "",
      status: "SCHEDULED",
      notes: "",
    });
  }

  async function changeStatus(apptId: string, status: string, successMessage: string) {
    const key = `${apptId}-${status}`;
    setStatusBusy(key);
    const res = await fetch(`/api/appointments/${apptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStatusBusy(null);
    if (res.ok) {
      show({ title: successMessage, variant: "success" });
      await mutate();
    } else {
      const j = await res.json().catch(() => ({}));
      show({ title: "Falha ao atualizar", description: j.error || "Nao foi possivel atualizar o agendamento", variant: "error" });
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    if (!form.serviceId || !form.date || !form.time) {
      show({ title: "Campos obrigatorios", description: "Servico, data e horario sao obrigatorios", variant: "error" });
      return;
    }
    const start = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(start.getTime())) {
      show({ title: "Horario invalido", variant: "error" });
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/appointments/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: form.serviceId,
        start: start.toISOString(),
        status: form.status,
        notes: form.notes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      show({ title: "Agendamento atualizado", variant: "success" });
      const targetDate = form.date;
      resetEditing();
      setDate(targetDate);
      await mutate();
    } else {
      const j = await res.json().catch(() => ({}));
      show({ title: "Falha ao salvar", description: j.error || "Nao foi possivel atualizar o agendamento", variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendario</h1>
      <Card>
        <CardHeader>
          <CardTitle>Selecionar dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input className="w-44" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="inline-flex items-center gap-2 text-sm">
              <Button
                type="button"
                className={`h-8 px-3 ${view === "day" ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                onClick={() => setView("day")}
              >
                Dia
              </Button>
              <Button
                type="button"
                className={`h-8 px-3 ${view === "week" ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                onClick={() => setView("week")}
              >
                Semana
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid gap-1">
              <span className="text-xs uppercase text-muted-foreground">Filtrar por servico</span>
              <select
                className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <option value="all">Todos os servicos</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <span className="text-xs uppercase text-muted-foreground">Status</span>
              <select
                className="h-9 w-48 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <span className="text-xs uppercase text-muted-foreground">Buscar cliente</span>
              <Input
                className="w-64"
                placeholder="Nome ou email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Total do dia: <strong className="text-foreground">{summary.total}</strong></span>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <span key={key} className="inline-flex items-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-full ${meta.accentClass}`} />
                {meta.label}: <strong className="text-foreground">{summary[key] ?? 0}</strong>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
      {view === "day" ? (
        <Card>
          <CardHeader>
            <CardTitle>Compromissos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-6 w-72" />
              </div>
            ) : !filteredAppointments.length ? (
              <p className="text-sm text-muted-foreground">Sem compromissos neste dia.</p>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((a: any) => {
                  const meta = STATUS_META[a.status] ?? STATUS_META.SCHEDULED;
                  const startDate = new Date(a.start);
                  const endDate = new Date(a.end);
                  const dayLabel = startDate
                    .toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
                    .replace(/^./, (c) => c.toUpperCase());
                  return (
                    <div
                      key={a.id}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm"
                    >
                      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-4">
                          <div className={`mt-1 h-full w-1 rounded-full ${meta.accentClass}`} aria-hidden />
                          <div className="space-y-2">
                            <div>
                              <div className="text-sm text-muted-foreground">Horario</div>
                              <div className="text-lg font-semibold">
                                {format(startDate, "HH:mm")} — {format(endDate, "HH:mm")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {dayLabel}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Cliente</div>
                              <div className="font-medium">{a.customer.name}</div>
                              <div className="text-xs text-muted-foreground">{a.customer.email}</div>
                              {a.customer.phone ? (
                                <div className="text-xs text-muted-foreground">{a.customer.phone}</div>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <Badge className={meta.badgeClass}>{meta.label}</Badge>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                {a.service.name} • {a.service.durationMinutes} min
                              </span>
                            </div>
                            {a.notes ? (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Observacao:</span> {a.notes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:text-right">
                          <Button type="button" className="h-8 px-3 text-xs md:ml-auto" onClick={() => startEditing(a)}>
                            Editar
                          </Button>
                          <div className="flex flex-wrap gap-2 md:justify-end">
                            <Button
                              type="button"
                              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-600/90"
                              disabled={statusBusy === `${a.id}-COMPLETED` || a.status === "COMPLETED"}
                              onClick={() => changeStatus(a.id, "COMPLETED", "Comparecimento confirmado")}
                            >
                              Confirmar
                            </Button>
                            <Button
                              type="button"
                              className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-500/90 text-slate-900"
                              disabled={statusBusy === `${a.id}-NO_SHOW` || a.status === "NO_SHOW"}
                              onClick={() => changeStatus(a.id, "NO_SHOW", "Marcado como nao compareceu")}
                            >
                              Nao veio
                            </Button>
                            <Button
                              type="button"
                              className="h-8 px-3 text-xs bg-rose-500 hover:bg-rose-500/90"
                              disabled={statusBusy === `${a.id}-CANCELLED` || a.status === "CANCELLED"}
                              onClick={() => changeStatus(a.id, "CANCELLED", "Agendamento cancelado")}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {editing && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Editar agendamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
                    <div className="md:col-span-2 grid gap-2">
                      <label className="text-sm font-medium">Servico</label>
                      <select
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={form.serviceId}
                        onChange={(e) => setForm((prev) => ({ ...prev, serviceId: e.target.value }))}
                      >
                        <option value="">Selecione um servico</option>
                        {services.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.durationMinutes} min)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Data</label>
                      <Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Horario</label>
                      <Input type="time" value={form.time} onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Status</label>
                      <select
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={form.status}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 grid gap-2">
                      <label className="text-sm font-medium">Observacoes</label>
                      <textarea
                        className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={form.notes}
                        onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Anote detalhes adicionais (opcional)"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-3 justify-end">
                      <Button
                        type="button"
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        onClick={resetEditing}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid" style={{ gridTemplateColumns: "80px repeat(7, 1fr)", gridTemplateRows: "repeat(25, 40px)" }}>
                  <div />
                  {weekRange.map((d) => (
                    <div key={d.toISOString()} className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-1 text-center text-sm font-medium border-b">
                      {format(d, "EEE dd")}
                    </div>
                  ))}
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={`row-${h}`} className="contents">
                      <div className="col-start-1 row-span-1 border-b pr-2 text-right text-xs text-muted-foreground leading-[40px]">
                        {String(h).padStart(2, "0")}:00
                      </div>
                      {weekRange.map((d, idx) => (
                        <div key={`cell-${h}-${idx}`} className="border-b border-l" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Dica: em breve voce podera arrastar para criar ou editar compromissos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
