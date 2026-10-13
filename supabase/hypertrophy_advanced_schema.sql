-- ==============================================================================
-- NIFLHEIM — Módulo de Musculação Avançada & Periodização Científica
-- Arquitetura de Banco de Dados: Routines, PPL Splits, Supersets & Advanced Sets
-- ==============================================================================

-- 1. TIPOS ENUMERADOS (Taxonomia Científica de Musculação)
DO $$ BEGIN
  CREATE TYPE biomechanical_split AS ENUM ('Push', 'Pull', 'Legs', 'Upper', 'Lower', 'FullBody', 'Custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE base_set_type AS ENUM ('WARMUP', 'FEEDER', 'WORKING', 'BACKOFF');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE intensity_technique AS ENUM ('NONE', 'MYO_REPS', 'CLUSTER_SET', 'REST_PAUSE', 'DROP_SET', 'SUPERSET');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABELA: ROUTINES (Templates e Programas de Treino do Usuário)
CREATE TABLE IF NOT EXISTS public.routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL, -- Ex: "PPL Hipertrofia 5x", "Upper/Lower Força"
  description text DEFAULT '',
  split_type biomechanical_split NOT NULL DEFAULT 'Push',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their routines"
  ON public.routines FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. TABELA: ROUTINE_DAY_BLOCKS (Blocos/Dias da Semana da Rotina)
CREATE TABLE IF NOT EXISTS public.routine_day_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Segunda ... 7=Domingo
  name text NOT NULL, -- Ex: "Push A - Foco Peitoral", "Pull - Foco Dorsais"
  order_index integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_day_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their routine blocks"
  ON public.routine_day_blocks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. TABELA: ROUTINE_EXERCISES (Associação Exercício x Bloco com Drag & Drop e Supersets)
CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_block_id uuid NOT NULL REFERENCES public.routine_day_blocks(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 1,
  superset_group_id uuid, -- Exercícios com o mesmo superset_group_id formam uma Super/Giant Set
  target_working_sets integer NOT NULL DEFAULT 3,
  target_rir_min integer NOT NULL DEFAULT 1,
  target_rir_max integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage routine exercises"
  ON public.routine_exercises FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. TABELA: WORKOUT_SESSIONS (Sessão de Treino em Andamento / Concluída)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  routine_day_block_id uuid REFERENCES public.routine_day_blocks(id) ON DELETE SET NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  name text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer,
  pse integer CHECK (pse BETWEEN 1 AND 10), -- Percepção Subjetiva de Esforço
  total_tonnage_kg numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their workout sessions"
  ON public.workout_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6. TABELA: ADVANCED_WORKOUT_SETS (Séries com BaseSetType, Técnicas e Aninhamentos)
CREATE TABLE IF NOT EXISTS public.advanced_workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  base_type base_set_type NOT NULL DEFAULT 'WORKING',
  intensity_technique intensity_technique NOT NULL DEFAULT 'NONE',
  superset_group_id uuid, -- Id do grupo caso faça parte de uma superset
  weight numeric NOT NULL CHECK (weight >= 0),
  reps integer NOT NULL CHECK (reps > 0),
  rir integer NOT NULL CHECK (rir BETWEEN 0 AND 5),
  tonnage numeric GENERATED ALWAYS AS (weight * reps) STORED,
  completed boolean NOT NULL DEFAULT false,
  -- Sub-estruturas para Drop Sets e Myo-reps aninhados:
  -- Exemplo: [{"weight": 60, "reps": 6}, {"weight": 45, "reps": 5}]
  sub_sets jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advanced_workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage advanced workout sets"
  ON public.advanced_workout_sets FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 7. ÍNDICES DE ALTA PERFORMANCE PARA CALCULAR MEV/MAV/MRV SEMANAL
CREATE INDEX IF NOT EXISTS idx_adv_sets_user_created ON public.advanced_workout_sets (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_adv_sets_exercise ON public.advanced_workout_sets (exercise_id);
CREATE INDEX IF NOT EXISTS idx_adv_sets_session ON public.advanced_workout_sets (session_id);
