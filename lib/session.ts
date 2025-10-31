import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function requireTenant() {
  const session = await requireSession();
  if (!session) return null;
  const tenantId = (session.user as any).tenantId as string | undefined;
  return { session, tenantId };
}

