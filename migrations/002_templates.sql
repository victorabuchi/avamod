-- Template library: finished flats the owner uploads once. Designs adapt a template to a photo.
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  garment_type text not null,
  description text not null default '',
  -- { front: {width,height,fillD,outlineD,bbox:{x,y,w,h}}, back?: {...} }
  views jsonb not null,
  measurements jsonb not null default '[]',
  construction jsonb not null default '[]',
  trims jsonb not null default '[]',
  fabric text not null default '',
  -- source files kept in storage (AI, PSD, DXF...), owner-only downloads: [{name,bytes}]
  files jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table designs
  add column template_id uuid references templates(id) on delete set null,
  add column params jsonb not null default '{}',
  add column version integer not null default 1,
  add column updated_at timestamptz not null default now();

alter table designs drop constraint designs_mode_check;
alter table designs add constraint designs_mode_check check (mode in ('ai', 'trace', 'template'));
