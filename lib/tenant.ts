import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

export type TenantScoped<T> = (tx: PrismaClient) => Promise<T>;

// Wrap queries inside a transaction and set the session tenant id
export async function withTenant<T>(tenantId: string, fn: TenantScoped<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
    return fn(tx as unknown as PrismaClient);
  });
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function ensureMembership(userId: string, tenantId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  });
  return membership;
}

