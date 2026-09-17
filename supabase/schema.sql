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
  self_reported_care_grade text not null default 'UNKNOWN'
    check (self_reported_care_grade in ('1','2','3','4','5','COGNITIVE','UNKNOWN')),
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
  eligibility_status text not null default 'PENDING'
    check (eligibility_status in ('PENDING','VERIFIED','ELIGIBLE','INELIGIBLE','NEEDS_REVIEW')),
  verified_beneficiary_name text,
  verified_care_grade text,
  verified_copay_rate numeric(5,2)
    check (verified_copay_rate is null or (verified_copay_rate >= 0 and verified_copay_rate <= 100)),
  verified_valid_from date,
  verified_valid_to date,
  verified_eligible_items jsonb not null default '[]'::jsonb,
  eligibility_message text not null default '',
  eligibility_checked_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.consultations add column if not exists validity_start_date date;
alter table public.consultations add column if not exists self_reported_care_grade text not null default 'UNKNOWN';
alter table public.consultations add column if not exists eligibility_status text not null default 'PENDING';
alter table public.consultations add column if not exists verified_beneficiary_name text;
alter table public.consultations add column if not exists verified_care_grade text;
alter table public.consultations add column if not exists verified_copay_rate numeric(5,2);
alter table public.consultations add column if not exists verified_valid_from date;
alter table public.consultations add column if not exists verified_valid_to date;
alter table public.consultations add column if not exists verified_eligible_items jsonb not null default '[]'::jsonb;
alter table public.consultations add column if not exists eligibility_message text not null default '';
alter table public.consultations add column if not exists eligibility_checked_at timestamptz;
alter table public.consultations alter column certificate_path drop not null;
alter table public.consultations alter column certificate_name drop not null;
alter table public.consultations alter column certificate_type drop not null;

alter table public.consultations drop constraint if exists consultations_self_reported_care_grade_check;
alter table public.consultations add constraint consultations_self_reported_care_grade_check
  check (self_reported_care_grade in ('1','2','3','4','5','COGNITIVE','UNKNOWN'));

alter table public.consultations drop constraint if exists consultations_eligibility_status_check;
alter table public.consultations add constraint consultations_eligibility_status_check
  check (eligibility_status in ('PENDING','VERIFIED','ELIGIBLE','INELIGIBLE','NEEDS_REVIEW'));

alter table public.consultations drop constraint if exists consultations_verified_copay_rate_check;
alter table public.consultations add constraint consultations_verified_copay_rate_check
  check (verified_copay_rate is null or (verified_copay_rate >= 0 and verified_copay_rate <= 100));

create index if not exists consultations_submitted_at_idx
  on public.consultations (submitted_at desc);

create index if not exists consultations_status_idx
  on public.consultations (status, submitted_at desc);

create index if not exists consultations_eligibility_status_idx
  on public.consultations (eligibility_status, submitted_at desc);

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
