-- App-level admin flag. Run after 0001_init.sql.
-- After running this, do your first phone login in the app, then run:
--   update public.profiles set is_admin = true where id = auth.uid()::text;
-- (run that query while logged in via Supabase SQL Editor, or replace auth.uid() with your profile id)

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Helper: any function/policy can call this to gate admin-only features.
create or replace function public.is_app_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()::text),
    false
  )
$$;
