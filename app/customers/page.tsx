"use client";
import useSWR from "swr";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CustomersPage() {
  const { data, mutate } = useSWR("/api/customers", fetcher);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { show } = useToast();

  async function addCustomer() {
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone }) });
    if (res.ok) { setName(""); setEmail(""); setPhone(""); mutate(); show({ title: "Cliente adicionado", variant: "success" }); }
    else { const j = await res.json().catch(() => ({})); show({ title: "Falha", description: j.error || "Erro ao adicionar", variant: "error" }); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <Card>
        <CardHeader>
          <CardTitle>Novo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-5 items-end">
            <div>
              <label className="text-sm">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">E-mail</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Telefone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button onClick={addCustomer}>Adicionar</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lista de clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {data === undefined ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-72" />
              <Skeleton className="h-6 w-64" />
            </div>
          ) : !data?.customers?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Nome</TH>
                    <TH>E-mail</TH>
                    <TH>Telefone</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.customers.map((c: any) => (
                    <TR key={c.id}>
                      <TD className="font-medium">{c.name}</TD>
                      <TD>{c.email}</TD>
                      <TD>{c.phone || "-"}</TD>
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
