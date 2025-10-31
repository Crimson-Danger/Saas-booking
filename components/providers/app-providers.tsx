"use client";
import { SWRConfig } from "swr";
import { ToastProvider } from "@/components/ui/toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: true, dedupingInterval: 1000 }}>
      <ToastProvider>{children}</ToastProvider>
    </SWRConfig>
  );
}

