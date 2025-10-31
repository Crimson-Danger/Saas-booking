"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data: tenantData } = useSWR("/api/tenant", fetcher);
  const { data: settingsData, mutate: mutateSettings } = useSWR("/api/tenant/settings", fetcher);
  const { data: storageCfg } = useSWR("/api/storage/config", fetcher);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const [timezone, setTimezone] = useState("");
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>("");
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const { show } = useToast();

  useEffect(() => {
    if (settingsData?.tenant) {
      setBrandName(settingsData.tenant.brandName || "");
      setTimezone(settingsData.tenant.timezone || "");
      setPrimaryColor(settingsData.tenant.primaryColor || "");
      setBrandLogoUrl(settingsData.tenant.brandLogoUrl || "");
    }
  }, [settingsData]);

  async function addAvailability() {
    const res = await fetch("/api/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayOfWeek: day, startTime, endTime }) });
    if (!res.ok) show({ title: "Falha", description: "Não foi possível adicionar", variant: "error" }); else show({ title: "Disponibilidade adicionada", variant: "success" });
  }

  async function saveBrand() {
    const res = await fetch("/api/tenant/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandName, timezone, primaryColor, brandLogoUrl }),
    });
    if (!res.ok) return show({ title: "Falha ao salvar", variant: "error" });
    await mutateSettings();
    show({ title: "Salvo", variant: "success" });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Prefer Cloudinary unsigned upload if configured; fallback to dataURL
    if (storageCfg?.cloudinary) {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", storageCfg.cloudinary.uploadPreset);
      const url = `https://api.cloudinary.com/v1_1/${storageCfg.cloudinary.cloudName}/upload`;
      const res = await fetch(url, { method: "POST", body: form });
      const out = await res.json();
      if (out?.secure_url) {
        setBrandLogoUrl(out.secure_url as string);
        show({ title: "Logo enviado", variant: "success" });
        return;
      }
      show({ title: "Falha no upload", variant: "error" });
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setBrandLogoUrl(dataUrl);
        show({ title: "Logo carregado", variant: "success" });
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <Card>
        <CardHeader>
          <CardTitle>Link público</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-sm text-muted-foreground">Compartilhe com seus clientes</div>
          <div className="mb-2 text-sm">Slug: <span className="font-mono font-medium">{tenantData?.tenant?.slug ?? "-"}</span></div>
          <div className="flex gap-2">
            <Input readOnly value={tenantData?.tenant?.slug ? `${origin}/book/${tenantData.tenant.slug}` : ""} placeholder="Carregando..." />
            <Button onClick={async () => { if (tenantData?.tenant?.slug) { await navigator.clipboard.writeText(`${origin}/book/${tenantData.tenant.slug}`); show({ title: "Copiado", description: "Link público copiado", variant: "success" }); } }} disabled={!tenantData?.tenant?.slug}>Copiar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marca e aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm">Marca (exibição)</label>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Minha Marca" />
            </div>
            <div>
              <label className="text-sm">Fuso horário</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/Sao_Paulo" />
            </div>
            <div>
              <label className="text-sm">Cor primária (hex)</label>
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#000000" />
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm">Logotipo</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={onFile} />
                <span className="text-xs text-muted-foreground">ou</span>
                <Input placeholder="URL da imagem" value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} />
              </div>
            </div>
            <div>
              {brandLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandLogoUrl} alt="Logo preview" className="h-10 w-10 rounded-md object-cover border" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={saveBrand}>Salvar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disponibilidade semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4 items-end">
            <div>
              <label className="text-sm">Dia</label>
              <select className="border rounded h-9 px-2 w-full" value={day} onChange={(e) => setDay(parseInt(e.target.value, 10))}>
                <option value={1}>Segunda</option>
                <option value={2}>Terça</option>
                <option value={3}>Quarta</option>
                <option value={4}>Quinta</option>
                <option value={5}>Sexta</option>
                <option value={6}>Sábado</option>
                <option value={7}>Domingo</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Início</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Fim</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <Button onClick={addAvailability}>Adicionar</Button>
          </div>
          <AvailabilityList />
        </CardContent>
      </Card>
    </div>
  );
}

function AvailabilityList() {
  const { data, mutate } = useSWR("/api/availability", (u) => fetch(u).then((r) => r.json()));
  const { show } = useToast();
  async function remove(id: string) {
    if (!confirm("Remover faixa?")) return;
    const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(); show({ title: "Removido", variant: "success" }); } else { show({ title: "Falha ao remover", variant: "error" }); }
  }
  return (
    <div className="mt-4">
      {!data?.availability?.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma faixa cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 px-2">Dia</th>
                <th className="py-2 px-2">Início</th>
                <th className="py-2 px-2">Fim</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.availability.map((a: any) => (
                <tr key={a.id}>
                  <td className="py-2 px-2">{dayName(a.dayOfWeek)}</td>
                  <td className="py-2 px-2">{a.startTime}</td>
                  <td className="py-2 px-2">{a.endTime}</td>
                  <td className="py-2 px-2 text-right">
                    <button className="text-red-600 text-sm" onClick={() => remove(a.id)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function dayName(d: number) {
  return ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][d] || d;
}
