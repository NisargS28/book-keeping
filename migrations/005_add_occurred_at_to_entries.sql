-- Run this migration in Supabase SQL Editor for existing databases.

-- 1. Add occurred_at column to entries table
alter table public.entries
  add column if not exists occurred_at timestamptz default timezone('utc', now());

-- 2. Backfill existing rows by combining recorded date with creation time
update public.entries
set occurred_at = case
  when created_at is not null then
    (date::text || ' ' || to_char(created_at, 'HH24:MI:SS.USOF'))::timestamptz
  else
    (date::text || ' 00:00:00+00')::timestamptz
end
where occurred_at is null;

-- 3. Set not null constraint once backfilled
alter table public.entries
  alter column occurred_at set not null;

-- 4. Create index for ledger ordering by book and occurred_at
create index if not exists idx_entries_book_occurred_at
  on public.entries(book_id, occurred_at desc, created_at desc);
