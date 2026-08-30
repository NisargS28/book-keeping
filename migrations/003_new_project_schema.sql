-- Cashbook schema for a new Supabase project.
-- Run this file once in Supabase Dashboard > SQL Editor.

-- User profile automatically created whenever a new Auth user signs up.
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  profile_image text,
  bio text,
  whatsapp_phone text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  currency text not null default 'INR',
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  color text not null default '#8b5cf6',
  created_at timestamptz not null default timezone('utc', now()),
  unique (book_id, name)
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  description text not null check (char_length(trim(description)) > 0),
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  payment_mode text,
  date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_books_user_id on public.books(user_id);
create index idx_categories_book_id on public.categories(book_id);
create index idx_entries_book_date on public.entries(book_id, date desc, created_at desc);
create index idx_user_profiles_whatsapp_phone on public.user_profiles(whatsapp_phone)
  where whatsapp_phone is not null;

-- Keep updated_at values consistent for records changed through SQL or the API.
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

create trigger set_books_updated_at
before update on public.books
for each row execute function public.set_updated_at();

create trigger set_entries_updated_at
before update on public.entries
for each row execute function public.set_updated_at();

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

alter table public.user_profiles enable row level security;
alter table public.books enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;

create policy "Users can view their own profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

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
