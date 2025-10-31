import "./globals.css";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "SaaS Booking",
    template: "%s | SaaS Booking",
  },
  description: "Agendamento online para serviços: configure horários, serviços e receba reservas.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>
          <Navbar authenticated={!!session?.user} />
          <main className="container py-8">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
