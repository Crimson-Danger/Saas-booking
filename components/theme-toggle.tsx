"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const d = saved ? saved === "dark" : false;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);

  if (!mounted) return null;

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <Button type="button" onClick={toggle} className="h-8 px-3 text-xs">
      {dark ? "🌙 Escuro" : "☀️ Claro"}
    </Button>
  );
}

