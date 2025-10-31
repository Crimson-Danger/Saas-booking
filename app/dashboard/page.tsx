"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data } = useSWR("/api/dashboard/metrics", fetcher);
  const { data: tenantData } = useSWR("/api/tenant", fetcher);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const { show } = useToast();
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Stat title="Agendamentos (mês)" value={data?.appointmentsThisMonth ?? "-"} />
        <Stat title="Comparecimento" value={(data?.attendanceRate ?? 0) + "%"} />
        <Stat title="Clientes" value={<ClientsCount />} />
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

function ClientsCount() {
  const { data } = useSWR("/api/customers", fetcher);
  return <>{data?.customers?.length ?? "-"}</>;
}

function PublicLink({ origin, slug }: { origin: string; slug?: string }) {
  const url = slug ? `${origin}/book/${slug}` : "";
  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    show({ title: "Copiado", description: "Link público copiado", variant: "success" });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Link público</CardTitle>
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
