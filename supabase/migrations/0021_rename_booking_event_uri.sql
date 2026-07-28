-- Se reemplaza Calendly por Cal.com (el plan gratuito de Calendly no incluye
-- webhooks) — la columna se renombra a un nombre neutral ya que deja de ser
-- específica de Calendly.
alter table public.activity_cards
  rename column calendly_event_uri to booking_event_uri;
