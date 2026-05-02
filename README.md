# Controle financeiro pessoal

Aplicação web full-stack em Next.js App Router para cadastro manual de transações, upload de extratos CSV/OFX/XLSX, categorização automática, aprendizado por correção manual e dashboard com gráficos.

## Stack

- Next.js + TypeScript
- Tailwind CSS + componentes no estilo shadcn/ui
- API Routes do Next.js
- Supabase Auth + PostgreSQL
- Prisma ORM
- Recharts

## Configuração

1. Copie `.env.example` para `.env.local`.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` e `DIRECT_URL`.
3. Crie o banco com Prisma ou execute `supabase/schema.sql` no SQL editor do Supabase.
4. Rode:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Principais arquivos

- `prisma/schema.prisma`: schema PostgreSQL para Prisma.
- `supabase/schema.sql`: schema SQL com RLS para Supabase.
- `app/api/transactions/route.ts`: CRUD, filtros, busca, ordenação e paginação.
- `app/api/upload/route.ts`: importação de extratos.
- `lib/parsers`: parsers CSV, XLSX e OFX.
- `lib/categories.ts`: categorias padrão, regras por palavra-chave e aprendizado.
- `components/dashboard/finance-dashboard.tsx`: dashboard principal.
