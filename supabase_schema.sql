-- ─────────────────────────────────────────
-- MONGI SKIN — Supabase: survey_responses
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────

create table public.survey_responses (
  id            bigint        generated always as identity primary key,

  -- Single-select
  age           text,                    -- '14-17' | '18-24' | '25-34' | '35+'
  ciudad        text,                    -- 'bogota' | 'medellin' | 'cali' | 'costa' | 'otra'
  tipo_piel     text,                    -- 'grasa' | 'mixta' | 'seca' | 'sensible' | 'noSe'
  satisfaccion  smallint,                -- 1–5
  kb_nivel      text,                    -- 'nada' | 'poco' | 'medio' | 'experta'
  budget        text,                    -- 'bajo' | 'medio' | 'alto' | 'premium'

  -- Multi-select (arrays de texto)
  prob_piel     text[],                  -- ['acne','manchas','poros', ...]
  productos     text[],                  -- ['jabonFarm','kbeauty', ...]
  barreras      text[],                  -- ['precio','conseguir', ...]

  -- Respuesta libre
  wish          text,

  -- Metadata
  submitted_at  timestamptz   not null default now()
);

-- ── ÍNDICES útiles para análisis ──
create index on public.survey_responses (ciudad);
create index on public.survey_responses (tipo_piel);
create index on public.survey_responses (budget);
create index on public.survey_responses (submitted_at desc);

-- ── RLS: solo insertar desde el frontend (sin leer desde el cliente) ──
alter table public.survey_responses enable row level security;

-- Permite al anon key insertar filas (el frontend lo necesita)
create policy "anon can insert"
  on public.survey_responses
  for insert
  to anon
  with check (true);

-- Solo el rol autenticado (tú, desde el dashboard) puede leer
create policy "auth can read"
  on public.survey_responses
  for select
  to authenticated
  using (true);
