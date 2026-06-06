-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles (extends auth.users) ─────────────────────────────────────────────
create table if not exists profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  first_name     text,
  last_name      text,
  business_name  text not null default '',
  business_type  text,
  city           text,
  province       text,
  plan           text default 'starter',
  currency       text default 'CAD',
  logo_url       text,
  cover_photo_url text,
  booking_handle text unique,
  active_theme   text default 'Light',
  created_at     timestamptz default now()
);

-- ── Clients ────────────────────────────────────────────────────────────────────
create table if not exists clients (
  id                   uuid primary key default uuid_generate_v4(),
  profile_id           uuid references profiles(id) on delete cascade not null,
  first_name           text not null,
  last_name            text not null,
  email                text,
  phone                text,
  avatar_url           text,
  date_of_birth        date,
  tags                 text[] default '{}',
  churn_risk           text default 'Low' check (churn_risk in ('Low', 'Medium', 'High')),
  lifetime_value       numeric(10,2) default 0,
  visit_count          int default 0,
  rebook_interval_days int,
  last_visit_at        timestamptz,
  created_at           timestamptz default now()
);

-- ── Services ───────────────────────────────────────────────────────────────────
create table if not exists services (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid references profiles(id) on delete cascade not null,
  name          text not null,
  price         numeric(10,2) not null,
  duration_mins int not null,
  category      text,
  deposit_pct   numeric(5,2) default 0,
  active        boolean default true,
  booking_count int default 0,
  created_at    timestamptz default now()
);

-- ── Staff ──────────────────────────────────────────────────────────────────────
create table if not exists staff (
  id         uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  first_name text not null,
  last_name  text not null,
  email      text,
  phone      text,
  avatar_url text,
  colour     text default '#4361ee',
  role       text default 'Stylist' check (role in ('Owner', 'Manager', 'Stylist', 'Receptionist')),
  is_active  boolean default true,
  created_at timestamptz default now()
);

-- ── Staff ↔ Services (junction) ────────────────────────────────────────────────
create table if not exists staff_services (
  staff_id   uuid references staff(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- ── Bookings ───────────────────────────────────────────────────────────────────
create table if not exists bookings (
  id         uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  client_id  uuid references clients(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  staff_id   uuid references staff(id) on delete set null,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  status     text default 'Pending' check (status in ('Pending','Confirmed','InProgress','Completed','Cancelled','NoShow')),
  price      numeric(10,2),
  notes      text,
  created_at timestamptz default now()
);

-- ── Payments ───────────────────────────────────────────────────────────────────
create table if not exists payments (
  id         uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  booking_id uuid references bookings(id) on delete set null,
  client_id  uuid references clients(id) on delete set null,
  amount     numeric(10,2) not null,
  method     text,
  status     text default 'Completed',
  reference  text,
  created_at timestamptz default now()
);

-- ── Client Notes ───────────────────────────────────────────────────────────────
create table if not exists client_notes (
  id         uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  client_id  uuid references clients(id) on delete cascade not null,
  content    text not null,
  is_pinned  boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- ── Messages ───────────────────────────────────────────────────────────────────
create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  client_id  uuid references clients(id) on delete cascade,
  body       text not null,
  channel    text not null check (channel in ('SMS','Email','Push','WhatsApp','Instagram','Facebook')),
  subject    text,
  status     text default 'Sent',
  created_at timestamptz default now()
);

-- ── AutoPilot flow config ──────────────────────────────────────────────────────
create table if not exists autopilot_flows (
  id         uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  flow_id    text not null,
  is_enabled boolean default true,
  created_at timestamptz default now(),
  unique (profile_id, flow_id)
);

-- ── AutoPilot event history ────────────────────────────────────────────────────
create table if not exists autopilot_events (
  id               uuid primary key default uuid_generate_v4(),
  profile_id       uuid references profiles(id) on delete cascade not null,
  flow_id          text not null,
  client_id        uuid references clients(id) on delete set null,
  description      text,
  was_successful   boolean default true,
  revenue_recovered numeric(10,2),
  created_at       timestamptz default now()
);

-- ── Business settings (one row per profile) ────────────────────────────────────
create table if not exists business_settings (
  id                       uuid primary key default uuid_generate_v4(),
  profile_id               uuid references profiles(id) on delete cascade not null unique,
  min_advance_notice_hours int default 2,
  max_advance_days         int default 60,
  allow_public_booking     boolean default true,
  require_deposit          boolean default false,
  booking_confirmations    boolean default true,
  booking_reminders        boolean default true,
  payment_receipts         boolean default true,
  autopilot_alerts         boolean default true,
  created_at               timestamptz default now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────────
alter table profiles          enable row level security;
alter table clients           enable row level security;
alter table services          enable row level security;
alter table staff             enable row level security;
alter table staff_services    enable row level security;
alter table bookings          enable row level security;
alter table payments          enable row level security;
alter table client_notes      enable row level security;
alter table messages          enable row level security;
alter table autopilot_flows   enable row level security;
alter table autopilot_events  enable row level security;
alter table business_settings enable row level security;

-- Profiles
create policy "own profile select" on profiles for select using (auth.uid() = id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id);

-- All other tables: full access scoped to the logged-in user's profile_id
create policy "own clients"           on clients           for all using (profile_id = auth.uid());
create policy "own services"          on services          for all using (profile_id = auth.uid());
create policy "own staff"             on staff             for all using (profile_id = auth.uid());
create policy "own bookings"          on bookings          for all using (profile_id = auth.uid());
create policy "own payments"          on payments          for all using (profile_id = auth.uid());
create policy "own client_notes"      on client_notes      for all using (profile_id = auth.uid());
create policy "own messages"          on messages          for all using (profile_id = auth.uid());
create policy "own autopilot_flows"   on autopilot_flows   for all using (profile_id = auth.uid());
create policy "own autopilot_events"  on autopilot_events  for all using (profile_id = auth.uid());
create policy "own business_settings" on business_settings for all using (profile_id = auth.uid());
create policy "own staff_services"    on staff_services    for all
  using (exists (select 1 from staff where staff.id = staff_services.staff_id and staff.profile_id = auth.uid()));

-- ── Auto-create profile on signup ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, business_name, business_type, city, province, plan)
  values (
    new.id,
    new.raw_user_meta_data ->> 'firstName',
    new.raw_user_meta_data ->> 'lastName',
    coalesce(new.raw_user_meta_data ->> 'businessName', ''),
    new.raw_user_meta_data ->> 'businessType',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'province',
    coalesce(new.raw_user_meta_data ->> 'plan', 'starter')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
