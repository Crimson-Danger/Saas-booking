"use client";
import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ServicesPage() {
  const { data, mutate } = useSWR("/api/services", fetcher);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState<number | "">("");
  const { show } = useToast();

  async function addService() {
    const body: any = { name, durationMinutes: duration };
    if (price !== "") body.priceCents = Math.round(Number(price) * 100);
    const res = await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setName(""); setPrice(""); setDuration(30); mutate(); show({ title: "Serviço adicionado", variant: "success" }); }
    else { const j = await res.json().catch(() => ({})); show({ title: "Falha", description: j.error || "Erro ao adicionar", variant: "error" }); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Serviços</h1>
      <Card>
        <CardHeader>
          <CardTitle>Novo serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-5 items-end">
            <div className="md:col-span-2">
              <label className="text-sm">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Duração (min)</label>
              <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value || "0", 10))} />
            </div>
            <div>
              <label className="text-sm">Preço (R$)</label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value as any)} />
            </div>
            <Button onClick={addService}>Adicionar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de serviços</CardTitle>
        </CardHeader>
        <CardContent>
          {data === undefined ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-72" />
              <Skeleton className="h-6 w-64" />
            </div>
          ) : !data?.services?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Nome</TH>
                    <TH>Duração</TH>
                    <TH>Preço</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.services.map((s: any) => (
                    <TR key={s.id}>
                      <TD className="font-medium">{s.name}</TD>
                      <TD>{s.durationMinutes} min</TD>
                      <TD>{s.priceCents ? (s.priceCents/100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
