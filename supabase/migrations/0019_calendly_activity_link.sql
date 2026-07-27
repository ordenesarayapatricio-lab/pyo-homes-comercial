-- Vincula una tarjeta de activity_cards a la reserva de Calendly que la creó, para
-- poder encontrarla de nuevo cuando llegue el evento de cancelación (invitee.canceled).
alter table public.activity_cards
  add column if not exists calendly_event_uri text unique;
