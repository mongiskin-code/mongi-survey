-- ─────────────────────────────────────────
-- MONGI SKIN — Migración: agregar frecuencia
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- Si la tabla ya existe (ya corriste supabase_schema.sql),
-- solo ejecuta este archivo.
-- Si todavía no has creado la tabla, usa supabase_schema.sql
-- que ya incluye esta columna.
-- ─────────────────────────────────────────

alter table public.survey_responses
  add column if not exists frecuencia text;

-- Valores posibles: 'semanal' | 'mensual' | 'bimestral' | 'ocasional' | 'noSe'
