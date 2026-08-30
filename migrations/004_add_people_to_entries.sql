-- Run this migration in Supabase SQL Editor for existing databases.
alter table public.entries
  add column if not exists people text;
