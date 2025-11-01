"use client";
import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MetricsResponse = {
  appointmentsThisMonth: number;
  attendanceRate: number;
  completedThisMonth: number;
  noShowsThisMonth: number;
  appointmentsToday: number;
  customersTotal: number;
  revenueThisMonth: number;
  upcomingAppointments: {
    id: string;
    start: string;
    end: string;
    service: string;
    durationMinutes: number | null;
    customer: { name: string; email: string | null; phone: string | null };
  }[];
  recentNoShows: {
    id: string;
    start: string;
    service: string;
    customer: { name: string; email: string | null; phone: string | null };
  }[];
  topServices: {
    serviceId: string | null;
    count: number;
    service: { id: string; name: string; durationMinutes: number | null } | null;
  }[];
};

export default function DashboardPage() {
  const { data } = useSWR<MetricsResponse>("/api/dashboard/metrics", fetcher);
  const { data: tenantData } = useSWR("/api/tenant", fetcher);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const summaryCards = useMemo(() => {
    if (!data) return null;
    const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    return [
      { title: "Agendamentos (mes)", value: data.appointmentsThisMonth },
      { title: "Comparecimento", value: `${data.attendanceRate}%` },
      { title: "Agendamentos hoje", value: data.appointmentsToday },
      { title: "Clientes ativos", value: data.customersTotal },
      { title: "Receita no mes", value: currency.format((data.revenueThisMonth ?? 0) / 100) },
    ];
  }, [data]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Painel</h1>
          <p className="text-sm text-muted-foreground">Resumo rapido do desempenho do seu negocio.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {summaryCards
            ? summaryCards.map((card) => (
                <Stat key={card.title} title={card.title} value={card.value} />
              ))
            : Array.from({ length: 4 }).map((_, i) => <Stat key={i} title=" " value={null} />)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <UpcomingList upcoming={data?.upcomingAppointments} />
        <div className="space-y-6">
          <TopServices services={data?.topServices} />
          <RecentNoShows items={data?.recentNoShows} />
        </div>
      </div>

      <div className="animate-in fade-in-50 slide-in-from-bottom-2">
        <PublicLink origin={origin} slug={tenantData?.tenant?.slug} />
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value ?? <Skeleton className="h-6 w-16" />}</div>
      </CardContent>
    </Card>
  );
}

function UpcomingList({ upcoming }: { upcoming?: MetricsResponse["upcomingAppointments"] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Proximos agendamentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!upcoming ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-4/6" />
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
        ) : (
          upcoming.map((appt) => {
            const start = new Date(appt.start);
            const end = new Date(appt.end);
            return (
              <div key={appt.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}{" "}
                    {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Badge className="bg-primary/10 text-primary">{appt.service}</Badge>
                </div>
                <div className="mt-2 text-sm">
                  <div className="font-medium">{appt.customer?.name ?? "Cliente"}</div>
                  <div className="text-xs text-muted-foreground">
                    {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {appt.durationMinutes ? ` • ${appt.durationMinutes} min` : ""}
                  </div>
                  {(appt.customer?.email || appt.customer?.phone) && (
                    <div className="mt-1 text-xs text-muted-foreground space-y-1">
                      {appt.customer.email && <div>{appt.customer.email}</div>}
                      {appt.customer.phone && <div>{appt.customer.phone}</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function TopServices({ services }: { services?: MetricsResponse["topServices"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicos em destaque</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!services ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dado para este periodo.</p>
        ) : (
          services.map((item) => (
            <div key={item.service?.id ?? item.serviceId} className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{item.service?.name ?? "Servico"}</div>
                {item.service?.durationMinutes ? (
                  <div className="text-xs text-muted-foreground">{item.service.durationMinutes} min</div>
                ) : null}
              </div>
              <Badge className="bg-muted text-muted-foreground">x{item.count}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentNoShows({ items }: { items?: MetricsResponse["recentNoShows"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ultimos nao comparecimentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!items ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro neste mes.</p>
        ) : (
          items.map((item) => {
            const start = new Date(item.start);
            return (
              <div key={item.id} className="space-y-1 text-sm border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.customer?.name ?? "Cliente"}</span>
                  <span className="text-xs text-muted-foreground">
                    {start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{item.service}</div>
                {(item.customer?.email || item.customer?.phone) && (
                  <div className="text-xs text-muted-foreground">
                    {[item.customer.email, item.customer.phone].filter(Boolean).join(" - ")}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function PublicLink({ origin, slug }: { origin: string; slug?: string }) {
  const { show } = useToast();
  const url = slug ? `${origin}/book/${slug}` : "";
  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    show({ title: "Copiado", description: "Link publico copiado", variant: "success" });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Link publico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-muted-foreground">Compartilhe com seus clientes</div>
        <div className="mb-2 text-sm">Slug: <span className="font-mono font-medium">{slug ?? "-"}</span></div>
        <div className="flex gap-2">
          <Input readOnly value={url} placeholder="Carregando..." />
          <Button onClick={copy} disabled={!url}>Copiar</Button>
        </div>
      </CardContent>
    </Card>
  );
}


