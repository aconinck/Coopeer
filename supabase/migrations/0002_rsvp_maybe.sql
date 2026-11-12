-- Adds "maybe" as an RSVP status.
alter table public.rsvps drop constraint if exists rsvps_status_check;
alter table public.rsvps add constraint rsvps_status_check check (status in ('going', 'maybe', 'declined', 'invited'));
