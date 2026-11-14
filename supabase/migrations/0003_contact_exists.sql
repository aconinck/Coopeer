-- Sign-up asks "is this email/phone already registered?" before the person is signed in, so anon needs a way
-- to check. `profiles` is readable by authenticated users only, so this security-definer function answers just
-- yes/no (it never returns any row data).

create or replace function public.contact_exists(p_contact text, p_kind text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when p_kind = 'email' then exists (select 1 from auth.users where lower(email) = lower(p_contact))
    else exists (select 1 from auth.users where ltrim(phone, '+') = ltrim(p_contact, '+'))
  end;
$$;

revoke all on function public.contact_exists(text, text) from public;
grant execute on function public.contact_exists(text, text) to anon, authenticated;
