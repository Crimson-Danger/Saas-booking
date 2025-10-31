"use client";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, endOfWeek, format, parseISO, startOfWeek } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CalendarPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [view, setView] = useState<"day" | "week">("day");
  const from = `${date}T00:00:00Z`;
  const to = `${date}T23:59:59Z`;
  const { data } = useSWR(`/api/appointments?from=${from}&to=${to}`, fetcher);
  const weekRange = useMemo(() => {
    const d = parseISO(`${date}T00:00:00Z`);
    const start = startOfWeek(d, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    return days;
  }, [date]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendário</h1>
      <Card>
        <CardHeader>
          <CardTitle>Selecionar dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <input className="border rounded px-2 py-1 h-9" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="ml-4 inline-flex items-center gap-2 text-sm">
              <button className={`px-2 py-1 rounded border ${view === "day" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setView("day")}>Dia</button>
              <button className={`px-2 py-1 rounded border ${view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setView("week")}>Semana</button>
            </div>
          </div>
        </CardContent>
      </Card>
      {view === "day" ? (
        <Card>
          <CardHeader>
            <CardTitle>Compromissos</CardTitle>
          </CardHeader>
          <CardContent>
            {data === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-6 w-72" />
              </div>
            ) : !data?.appointments?.length ? (
              <p className="text-sm text-muted-foreground">Sem compromissos neste dia.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Horário</TH>
                      <TH>Cliente</TH>
                      <TH>Serviço</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.appointments.map((a: any) => (
                      <TR key={a.id}>
                        <TD>
                          {new Date(a.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {" "}-{" "}
                          {new Date(a.end).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </TD>
                        <TD className="font-medium">{a.customer.name}</TD>
                        <TD>{a.service.name}</TD>
                        <TD>{a.status}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
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
                  {/* Header row */}
                  <div />
                  {weekRange.map((d) => (
                    <div key={d.toISOString()} className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-1 text-center text-sm font-medium border-b">
                      {format(d, "EEE dd")}
                    </div>
                  ))}
                  {/* Time labels and slots */}
                  {Array.from({ length: 24 }).map((_, h) => (
                    <>
                      <div key={`t-${h}`} className="col-start-1 row-span-1 border-b pr-2 text-right text-xs text-muted-foreground leading-[40px]">
                        {String(h).padStart(2, "0")}:00
                      </div>
                      {weekRange.map((d, idx) => (
                        <div key={`cell-${h}-${idx}`} className="border-b border-l" />
                      ))}
                    </>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Dica: em breve arraste para criar/editar compromissos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
