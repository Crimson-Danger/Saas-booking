import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-3">
        <h1 className="text-3xl font-semibold">Agendamento Online para seu negócio</h1>
        <p className="text-muted-foreground">Crie sua página de agendamento, defina horários e receba clientes.</p>
        <div className="flex justify-center gap-3">
          <Link href="/auth/register"><Button>Criar conta grátis</Button></Link>
          <Link href="/auth/login"><Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Entrar</Button></Link>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Configuração simples</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cadastre serviços, disponibilidade e link público em minutos.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agenda centralizada</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Veja seus compromissos do dia/semana e métricas de presença.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Página pública</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Link único: `/book/[tenant]` para seus clientes agendarem.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
