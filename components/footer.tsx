"use client";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/book")) return null;
  return (
    <footer className="border-t mt-8">
      <div className="container flex h-14 items-center justify-between text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} SaaS Booking</div>
        <div>Feito com Next.js + Prisma</div>
      </div>
    </footer>
  );
}

