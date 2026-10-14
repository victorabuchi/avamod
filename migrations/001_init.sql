create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  password_hash text not null,
  plan text not null default 'free',
  credits integer not null default 3,
  created_at timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));

-- One row per generated design. Files themselves live in storage (see lib/storage.ts).
create table designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  garment_type text not null,
  summary text not null default '',
  color text not null,
  mode text not null check (mode in ('ai', 'trace')),
  notes jsonb not null default '[]',
  spec jsonb not null,
  files jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index designs_user_created on designs (user_id, created_at desc);

-- Every credit spent or granted, so balances can be audited.
create table credit_ledger (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  design_id uuid references designs(id) on delete set null,
  created_at timestamptz not null default now()
);
create index credit_ledger_user on credit_ledger (user_id, created_at desc);
