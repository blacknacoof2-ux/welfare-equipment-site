-- Atom Care welfare-equipment consultation intake storage.
-- Run this once in the Supabase SQL editor for the project used by the site.

create extension if not exists pgcrypto;

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  submitted_at timestamptz not null default now(),
  applicant_name text not null,
  beneficiary_name text not null,
  birth_date date not null,
  care_number text not null,
  validity_start_date date,
  phone text not null,
  address text not null,
  address_detail text not null default '',
  relation text not null default '',
  needs text not null default '',
  items jsonb not null default '[]'::jsonb,
  certificate_path text,
  certificate_name text,
  certificate_type text,
  status text not null default 'NEW' check (status in ('NEW', 'REVIEWING', 'CONTACTED', 'COMPLETED', 'HOLD')),
  staff_note text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.consultations add column if not exists validity_start_date date;
alter table public.consultations alter column certificate_path drop not null;
alter table public.consultations alter column certificate_name drop not null;
alter table public.consultations alter column certificate_type drop not null;

create index if not exists consultations_submitted_at_idx
  on public.consultations (submitted_at desc);

create index if not exists consultations_status_idx
  on public.consultations (status, submitted_at desc);

alter table public.consultations enable row level security;

-- No browser/client policy is intentionally created.
-- All access goes through authenticated Next.js server routes using the service-role key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'consultation-certificates',
  'consultation-certificates',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
