import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { RegisterSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const parse = RegisterSchema.safeParse(await req.json());
    if (!parse.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    const { name, email, password, company } = parse.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);

    const slug = company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const tenantSlug = await ensureUniqueSlug(slug);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email, passwordHash: hash } });
      const tenant = await tx.tenant.create({ data: { name: company, slug: tenantSlug } });
      await tx.membership.create({ data: { userId: user.id, tenantId: tenant.id, role: "OWNER" } });
      return { user, tenant };
    });

    return NextResponse.json({ ok: true, tenant: result.tenant, user: result.user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base || "tenant";
  let i = 0;
  while (true) {
    const s = i === 0 ? slug : `${slug}-${i}`;
    const exists = await prisma.tenant.findUnique({ where: { slug: s } });
    if (!exists) return s;
    i++;
  }
}
