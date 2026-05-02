create type "TransactionType" as enum ('income', 'expense');

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  icon text not null
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14, 2) not null,
  type "TransactionType" not null,
  category_id uuid not null references categories(id),
  description text not null,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on transactions(user_id, date);
create index if not exists transactions_user_description_idx on transactions(user_id, description);

create table if not exists learning_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  category_id uuid not null references categories(id),
  unique (user_id, keyword)
);

create index if not exists learning_rules_user_idx on learning_rules(user_id);

alter table categories enable row level security;
alter table transactions enable row level security;
alter table learning_rules enable row level security;

create policy "categories are readable by authenticated users"
  on categories for select
  to authenticated
  using (true);

create policy "users manage own transactions"
  on transactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own learning rules"
  on learning_rules for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into categories (name, color, icon) values
  ('Alimentação', '#16a34a', 'utensils'),
  ('Transporte', '#0284c7', 'car'),
  ('Moradia', '#7c3aed', 'home'),
  ('Lazer', '#db2777', 'party-popper'),
  ('Assinaturas', '#f59e0b', 'badge-check'),
  ('Saúde', '#dc2626', 'heart-pulse'),
  ('Educação', '#2563eb', 'graduation-cap'),
  ('Outros', '#64748b', 'circle-dot'),
  ('Receita', '#059669', 'wallet')
on conflict (name) do update set
  color = excluded.color,
  icon = excluded.icon;
