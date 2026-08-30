-- migrations/010_secure_schema.sql
--
-- Fresh schema for the encrypted Cashbook application.
-- Run once in a NEW Supabase project (SQL Editor → run all).
-- Does NOT depend on or reference any previous migration file.
--
-- Private financial data (entries, books, categories) is AES-256-GCM encrypted
-- on the client before any INSERT or UPDATE. The encrypted_data column contains
-- only ciphertext. No plaintext financial information is stored in this schema.
-- RLS enforces per-user data isolation as a second, independent security layer.

-- ── Extensions ────────────────────────────────────────────────────────────────

-- gen_random_uuid() is available in Supabase without pgcrypto.
-- If your project requires it explicitly: create extension if not exists pgcrypto;

-- ── user_profiles ─────────────────────────────────────────────────────────────
-- Non-sensitive account metadata. display_name is acceptable plaintext (it is
-- visible in the UI header and not a private financial field).

create table public.user_profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  display_name    text        not null default '',
  profile_image   text,
  whatsapp_phone  text        unique,   -- reserved for future WhatsApp integration
  created_at      timestamptz not null  default timezone('utc', now()),
  updated_at      timestamptz not null  default timezone('utc', now())
);

-- ── user_key_material ─────────────────────────────────────────────────────────
-- Stores wrapped (never raw) encryption key material per user.
--
-- passphrase_wrapped_key : data key wrapped with PBKDF2(passphrase, passphrase_salt)
-- recovery_wrapped_key   : data key wrapped with PBKDF2(recoverySecret, recovery_key_salt)
-- The recovery secret itself is NEVER stored here or anywhere server-side.

create table public.user_key_material (
  id                      uuid        primary key references auth.users(id) on delete cascade,
  passphrase_salt         text        not null,   -- base64, random per user
  passphrase_wrapped_key  text        not null,   -- base64, AES-KW wrapped data key
  recovery_key_salt       text        not null,   -- base64, separate random salt
  recovery_wrapped_key    text        not null,   -- base64, AES-KW wrapped with recovery key
  key_version             int         not null default 1,
  created_at              timestamptz not null  default timezone('utc', now()),
  updated_at              timestamptz not null  default timezone('utc', now())
);

-- ── books ─────────────────────────────────────────────────────────────────────
-- Only ownership metadata (user_id) and timestamps are plaintext.
-- name, description, currency are encrypted inside encrypted_data.

create table public.books (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  encrypted_data      text        not null,   -- JSON EncryptedPayload: { name, description, currency }
  encryption_version  int         not null default 1,
  created_at          timestamptz not null  default timezone('utc', now()),
  updated_at          timestamptz not null  default timezone('utc', now())
);

-- ── categories ────────────────────────────────────────────────────────────────
-- Only the book relationship is plaintext (needed for cascade delete and RLS).
-- name, color are encrypted inside encrypted_data.

create table public.categories (
  id                  uuid        primary key default gen_random_uuid(),
  book_id             uuid        not null references public.books(id) on delete cascade,
  encrypted_data      text        not null,   -- JSON EncryptedPayload: { name, color }
  encryption_version  int         not null default 1,
  created_at          timestamptz not null  default timezone('utc', now())
);

-- ── entries ───────────────────────────────────────────────────────────────────
-- Only the book relationship is plaintext.
-- All private fields (amount, type, description, people, payment_mode, date,
-- occurred_at, category_id, notes) are encrypted inside encrypted_data.

create table public.entries (
  id                  uuid        primary key default gen_random_uuid(),
  book_id             uuid        not null references public.books(id) on delete cascade,
  encrypted_data      text        not null,   -- JSON EncryptedPayload: all private entry fields
  encryption_version  int         not null default 1,
  created_at          timestamptz not null  default timezone('utc', now()),
  updated_at          timestamptz not null  default timezone('utc', now())
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index idx_books_user_id       on public.books(user_id);
create index idx_books_created       on public.books(user_id, created_at desc);
create index idx_categories_book_id  on public.categories(book_id);
create index idx_entries_book_id     on public.entries(book_id);
create index idx_entries_created     on public.entries(book_id, created_at desc);
create index idx_profiles_whatsapp   on public.user_profiles(whatsapp_phone)
  where whatsapp_phone is not null;

-- ── updated_at trigger function ───────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create trigger set_user_key_material_updated_at
  before update on public.user_key_material
  for each row execute function public.set_updated_at();

create trigger set_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

create trigger set_entries_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

-- ── Auto-create user_profiles on auth signup ──────────────────────────────────

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.user_profiles      enable row level security;
alter table public.user_key_material  enable row level security;
alter table public.books              enable row level security;
alter table public.categories         enable row level security;
alter table public.entries            enable row level security;

-- user_profiles
create policy "Users can view their own profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- user_key_material (full CRUD — user controls their own key material)
create policy "Users can view their own key material"
  on public.user_key_material for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert their own key material"
  on public.user_key_material for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own key material"
  on public.user_key_material for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can delete their own key material"
  on public.user_key_material for delete to authenticated
  using ((select auth.uid()) = id);

-- books
create policy "Users can view their own books"
  on public.books for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own books"
  on public.books for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own books"
  on public.books for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own books"
  on public.books for delete to authenticated
  using ((select auth.uid()) = user_id);

-- categories (access via books join)
create policy "Users can view categories in their books"
  on public.categories for select to authenticated
  using (exists (
    select 1 from public.books
    where books.id = categories.book_id
      and books.user_id = (select auth.uid())
  ));

create policy "Users can create categories in their books"
  on public.categories for insert to authenticated
  with check (exists (
    select 1 from public.books
    where books.id = categories.book_id
      and books.user_id = (select auth.uid())
  ));

create policy "Users can update categories in their books"
  on public.categories for update to authenticated
  using (exists (
    select 1 from public.books
    where books.id = categories.book_id
      and books.user_id = (select auth.uid())
  ));

create policy "Users can delete categories in their books"
  on public.categories for delete to authenticated
  using (exists (
    select 1 from public.books
    where books.id = categories.book_id
      and books.user_id = (select auth.uid())
  ));

-- entries (access via books join)
create policy "Users can view entries in their books"
  on public.entries for select to authenticated
  using (exists (
    select 1 from public.books
    where books.id = entries.book_id
      and books.user_id = (select auth.uid())
  ));

create policy "Users can create entries in their books"
  on public.entries for insert to authenticated
  with check (exists (
    select 1 from public.books
    where books.id = entries.book_id
      and books.user_id = (select auth.uid())
  ));

create policy "Users can update entries in their books"
  on public.entries for update to authenticated
  using (exists (
    select 1 from public.books
    where books.id = entries.book_id
      and books.user_id = (select auth.uid())
  ));

create policy "Users can delete entries in their books"
  on public.entries for delete to authenticated
  using (exists (
    select 1 from public.books
    where books.id = entries.book_id
      and books.user_id = (select auth.uid())
  ));
