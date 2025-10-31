"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();
  const isPublic = pathname.startsWith("/book");
  if (isPublic) return null;
  return (
    <div className="border-b bg-background">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">SaaS Booking</Link>
          {authenticated && (
            <nav className="hidden md:flex gap-4 text-sm">
              <Link className={navClass(pathname, "/dashboard")} href="/dashboard">Dashboard</Link>
              <Link className={navClass(pathname, "/calendar")} href="/calendar">Calendário</Link>
              <Link className={navClass(pathname, "/services")} href="/services">Serviços</Link>
              <Link className={navClass(pathname, "/customers")} href="/customers">Clientes</Link>
              <Link className={navClass(pathname, "/settings")} href="/settings">Configurações</Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {authenticated ? (
            <Button onClick={() => signOut({ callbackUrl: "/" })}>Sair</Button>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login"><Button>Entrar</Button></Link>
              <Link href="/auth/register"><Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Criar conta</Button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function navClass(pathname: string, href: string) {
  const active = pathname.startsWith(href);
  return active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground";
}
