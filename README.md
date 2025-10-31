# SaaS Booking (Next.js + Prisma + NextAuth)

Sistema de Agendamento Online SaaS para profissionais (salões, clínicas, aulas particulares). Inclui multi-tenant com RLS no Postgres, autenticação por e-mail/senha, API pública para reservas e painel com dashboard/calendário/CRUD.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind + componentes shadcn/ui (base)
- Prisma + PostgreSQL (Neon/Railway)
- NextAuth (credentials)
- Resend (e-mails de confirmação)
- Deploy Vercel

## Rodando localmente
1. Copie `.env.example` para `.env` e ajuste variáveis.
2. Instale dependências: `npm install`
3. Gere client do Prisma: `npm run prisma:generate`
4. Crie o banco e rode migrações: `npm run prisma:migrate`
5. (Opcional, recomendado) Aplique RLS no Postgres executando `prisma/rls/enable_rls.sql` no seu banco (via console do provedor):
   - Isso habilita políticas que isolam dados por `tenantId` quando a sessão define `app.tenant_id`.
6. Inicie: `npm run dev`

## Multi-tenant + RLS
- Cada tabela de negócio possui `tenantId`.
- RLS no banco: políticas comparam `tenantId` com `current_setting('app.tenant_id', true)`.
- Em código, `withTenant(tenantId, fn)` define `SET LOCAL app.tenant_id = '<tenantId>'` e executa queries dentro de transação.
- Rotas privadas obtêm `tenantId` da sessão; rotas públicas resolvem via `slug` do tenant.

## Autenticação
- NextAuth (credentials). Registro em `/api/auth/register` cria `User`, `Tenant` e `Membership (OWNER)`.
- Login em `/auth/login`.

## Rotas
- Públicas:
  - `GET /api/public/[tenant]/services`
  - `GET /api/public/[tenant]/availability?serviceId=..&date=YYYY-MM-DD`
  - `POST /api/public/[tenant]/appointments`
- Privadas:
  - `GET/POST /api/services` e `GET/PATCH/DELETE /api/services/[id]`
  - `GET/POST /api/customers` e `PATCH/DELETE /api/customers/[id]`
  - `GET/POST /api/appointments` e `PATCH/DELETE /api/appointments/[id]`
  - `GET /api/dashboard/metrics`
  - `POST /api/availability` (criar faixas de disponibilidade)

## Páginas
- Pública: `/book/[tenant]`
  - Seleção de serviço → data/horário → dados do cliente → confirmação (e-mail via Resend).
- Painel: `/dashboard`, `/calendar`, `/services`, `/customers`, `/settings`.

## Deploy (Vercel)
- Crie projeto Vercel apontando para este repositório.
- Configure variáveis de ambiente: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.
- Rode migrações via `pnpm dlx prisma migrate deploy` (ou console Prisma Data Platform) e aplique `prisma/rls/enable_rls.sql` no banco.

### Preview automático (GitHub Actions)
- Adicione Secrets no repositório (Settings → Secrets and variables → Actions):
  - `VERCEL_TOKEN` (Token da conta em Vercel → Account Settings → Tokens)
  - `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` (em Project Settings → General, ou rode `npx vercel link` localmente e leia `.vercel/project.json`)
- Workflow: `.github/workflows/vercel-preview.yml`
  - `pull_request` para main → cria Preview no Vercel e comenta no PR
  - `push` na main → deploy de produção (`--prod`)

## Observações
- MVP prioriza fluxo principal. Sugeridos próximos passos:
  - Edição/remoção de disponibilidade, visualização de agenda semanal, configurações de marca/fuso via endpoint dedicado.
  - Webhooks e lembretes de e-mail/SMS.
  - Melhorias de segurança (rate-limit, CSRF em ações sensíveis) e logs.

## Melhorias recentes
- UI refinada (Cards/Tabelas), tema claro/escuro com toggle.
- Branding do tenant: `brandName`, `primaryColor`, `brandLogoUrl` com upload/URL em Configurações.
- Booking público exibe marca e logo e usa fuso do tenant para disponibilidade.
- Disponibilidade: listagem e remoção em Configurações.
- Validação com Zod em endpoints (auth/register, services, customers, booking, availability).
- Proteções: checagem de mesma origem em POST/PATCH/DELETE privados.
- Sitemap e robots.txt.
