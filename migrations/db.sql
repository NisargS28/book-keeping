-- Create user_profiles table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text,
  profile_image text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create books table
create table public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  currency text default 'INR',
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create categories table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  book_id uuid not null references public.books(id) on delete cascade,
  name text not null,
  color text default '#8b5cf6',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create entries table
create table public.entries (
  id uuid default gen_random_uuid() primary key,
  book_id uuid not null references public.books(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  description text not null,
  amount numeric not null,
  type text not null, -- 'income' or 'expense'
  payment_mode text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.books enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;

-- RLS Policies for Books
create policy "Users can view their own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on public.books for delete
  using (auth.uid() = user_id);

-- RLS Policies for Categories
create policy "Users can view categories in their books"
  on public.categories for select
  using (
    exists (
      select 1 from public.books
      where books.id = categories.book_id
      and books.user_id = auth.uid()
    )
  );

create policy "Users can insert categories in their books"
  on public.categories for insert
  with check (
    exists (
      select 1 from public.books
      where books.id = categories.book_id
      and books.user_id = auth.uid()
    )
  );

create policy "Users can update categories in their books"
  on public.categories for update
  using (
    exists (
      select 1 from public.books
      where books.id = categories.book_id
      and books.user_id = auth.uid()
    )
  );

create policy "Users can delete categories in their books"
  on public.categories for delete
  using (
    exists (
      select 1 from public.books
      where books.id = categories.book_id
      and books.user_id = auth.uid()
    )
  );

-- RLS Policies for Entries
create policy "Users can view entries in their books"
  on public.entries for select
  using (
    exists (
      select 1 from public.books
      where books.id = entries.book_id
      and books.user_id = auth.uid()
    )
  );

create policy "Users can insert entries in their books"
  on public.entries for insert
  with check (
    exists (
      select 1 from public.books
      where books.id = entries.book_id
      and books.user_id = auth.uid()
    )
  );

create policy "Users can update entries in their books"
  on public.entries for update
  using (
    exists (
      select 1 from public.books
      where books.id = entries.book_id
      and books.user_id = auth.uid()
    )
  );

create policy "Users can delete entries in their books"
  on public.entries for delete
  using (
    exists (
      select 1 from public.books
      where books.id = entries.book_id
      and books.user_id = auth.uid()
    )
  );

ALTER TABLE public.books
ADD COLUMN description TEXT;