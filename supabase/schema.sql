-- ==============================================================================
-- NIFLHEIM — Lifestyle OS: Esquema de Banco de Dados Completo (Supabase / PostgreSQL)
-- Integração Unificada: Nutrição, Musculação, Fadiga Sistêmica, Rotina & Notion Workspace
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: PROFILES (Extensão de auth.users / Perfil Metabólico Mifflin-St Jeor)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  age integer CHECK (age BETWEEN 13 AND 100),
  sex text CHECK (sex IN ('male', 'female')),
  height numeric CHECK (height BETWEEN 100 AND 250),
  weight numeric CHECK (weight BETWEEN 25 AND 350),
  body_fat numeric CHECK (body_fat BETWEEN 1 AND 70),
  goal text DEFAULT 'maintenance' CHECK (goal IN ('cutting', 'bulking', 'maintenance')),
  activity numeric DEFAULT 1.55 CHECK (activity IN (1.2, 1.375, 1.55, 1.725, 1.9)),
  calorie_target numeric,
  protein_target numeric,
  carb_target numeric,
  fat_target numeric,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own profile"
  ON public.profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.create_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lifestyle_signup ON auth.users;
CREATE TRIGGER lifestyle_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile();

-- 3. TABELA: FOODS (Biblioteca de Alimentos Validados e de Usuários)
CREATE TABLE IF NOT EXISTS public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  portion text NOT NULL DEFAULT '100 g',
  kcal numeric NOT NULL CHECK (kcal >= 0),
  protein numeric NOT NULL CHECK (protein >= 0),
  carbs numeric NOT NULL CHECK (carbs >= 0),
  fat numeric NOT NULL CHECK (fat >= 0),
  fiber numeric NOT NULL DEFAULT 0 CHECK (fiber >= 0),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read global foods or their own foods"
  ON public.foods FOR SELECT
  TO anon, authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can create their custom foods"
  ON public.foods FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND verified = false);

-- 4. TABELA: DAILY_NUTRITION (Diário Alimentar por Refeição)
CREATE TABLE IF NOT EXISTS public.daily_nutrition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  meal text NOT NULL CHECK (meal IN ('Café da Manhã', 'Almoço', 'Jantar', 'Pré-Treino', 'Pós-Treino')),
  food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)
);

ALTER TABLE public.daily_nutrition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily nutrition"
  ON public.daily_nutrition FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. TABELA: CARDIO_LOGS (Farm de Passos e Queima Calórica)
CREATE TABLE IF NOT EXISTS public.cardio_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their cardio logs"
  ON public.cardio_logs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. TABELA: EXERCISES (Biblioteca de Exercícios com YouTube Tutorial)
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle text NOT NULL,
  equipment text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view global exercises or their own"
  ON public.exercises FOR SELECT
  TO anon, authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can manage their custom exercises"
  ON public.exercises FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. TABELA: WORKOUTS (Sessões de Treino com PSE e Duração)
CREATE TABLE IF NOT EXISTS public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their workouts"
  ON public.workouts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. TABELA: WORKOUT_SETS (Séries com Carga, Reps, RIR e Tipos de Série)
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workout_id, user_id) REFERENCES public.workouts(id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their workout sets"
  ON public.workout_sets FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 9. TABELA: FATIGUE_LOGS (Check-in Noturno de Fadiga / Sono / DOMS / SNC)
CREATE TABLE IF NOT EXISTS public.fatigue_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

ALTER TABLE public.fatigue_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their fatigue logs"
  ON public.fatigue_logs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 10. TABELA: HABITS & HABIT_COMPLETIONS (Rotinas e Hábitos)
CREATE TABLE IF NOT EXISTS public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id)
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their habits"
  ON public.habits FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL,
  day date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (habit_id, user_id) REFERENCES public.habits(id, user_id) ON DELETE CASCADE,
  UNIQUE (user_id, habit_id, day)
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their habit completions"
  ON public.habit_completions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 11. TABELA: NOTES_PAGES & NOTES_BLOCKS (Workspace Notion-Like de Blocos Dinâmicos)
CREATE TABLE IF NOT EXISTS public.notes_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, user_id),
  FOREIGN KEY (parent_id, user_id) REFERENCES public.notes_pages(id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.notes_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their notes pages"
  ON public.notes_pages FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.notes_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_id uuid NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (page_id, user_id) REFERENCES public.notes_pages(id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.notes_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their notes blocks"
  ON public.notes_blocks FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 12. TABELA: XP_EVENTS & MOTOR DE GAMIFICAÇÃO (Level Up, Streaks e Recompensas)
CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  source text NOT NULL,
  points integer NOT NULL CHECK (points > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source)
);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their XP events"
  ON public.xp_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger de Gamificação: concede XP automaticamente por Hábitos e Treinos
CREATE OR REPLACE FUNCTION public.reward_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p integer;
  s text;
BEGIN
  IF TG_TABLE_NAME = 'habit_completions' THEN
    p := 20;
    s := 'habit:' || NEW.habit_id || ':' || NEW.day;
  ELSIF TG_TABLE_NAME = 'workouts' AND NEW.details->>'completed' = 'true' THEN
    p := 100;
    s := 'workout:' || NEW.id;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.xp_events (user_id, day, source, points)
  VALUES (NEW.user_id, NEW.day, s, p)
  ON CONFLICT (user_id, source) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS habit_reward ON public.habit_completions;
CREATE TRIGGER habit_reward
  AFTER INSERT ON public.habit_completions
  FOR EACH ROW EXECUTE FUNCTION public.reward_activity();

DROP TRIGGER IF EXISTS workout_reward ON public.workouts;
CREATE TRIGGER workout_reward
  AFTER INSERT OR UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.reward_activity();

-- 13. SEED INICIAL: ALIMENTOS E EXERCÍCIOS BÁSICOS
INSERT INTO public.foods (name, kcal, protein, carbs, fat, fiber, verified) VALUES
  ('Arroz integral cozido', 124, 2.6, 25.8, 1, 2.7, true),
  ('Peito de frango grelhado', 159, 32, 0, 2.5, 0, true),
  ('Banana prata', 89, 1.1, 23, 0.3, 2.6, true),
  ('Aveia em flocos', 394, 13.9, 66.6, 8.5, 9.1, true),
  ('Ovo inteiro cozido', 146, 13.3, 0.6, 9.5, 0, true),
  ('Iogurte natural desnatado', 41, 4.5, 5.0, 0.2, 0, true),
  ('Feijão carioca cozido', 76, 4.8, 13.6, 0.5, 8.5, true),
  ('Batata-doce cozida', 77, 0.6, 18.4, 0.1, 2.2, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (name, muscle, equipment, description, video_url) VALUES
  ('Supino Reto com Barra', 'Peito', 'Barra', 'Mantenha as escápulas retraídas e desça a barra até a linha dos mamilos.', 'https://www.youtube.com/watch?v=rT7DgCr-3pg'),
  ('Supino Inclinado com Halteres', 'Peito', 'Halteres', 'Banco a 30-45 graus, controle a fase excêntrica até a linha dos ombros.', 'https://www.youtube.com/watch?v=8iPEnn-ltC8'),
  ('Puxada Frontal na Polia', 'Costas', 'Polia', 'Puxe a barra em direção ao peitoral superior sem usar impulso com o tronco.', 'https://www.youtube.com/watch?v=CAwf7n6Luuc'),
  ('Remada Curvada com Barra', 'Costas', 'Barra', 'Tronco inclinado a 45 graus, coluna neutra, puxe a barra em direção ao umbigo.', 'https://www.youtube.com/watch?v=vT2GjY_Umpw'),
  ('Agachamento Livre', 'Quadríceps', 'Barra', 'Pés na largura dos ombros, desça mantendo os joelhos alinhados com a ponta dos pés.', 'https://www.youtube.com/watch?v=ultWZbUMPL8'),
  ('Leg Press 45º', 'Quadríceps', 'Máquina', 'Apoie toda a extensão das costas no encosto e flexione os joelhos a pelo menos 90 graus.', 'https://www.youtube.com/watch?v=IZxyjW7MPJQ'),
  ('Rosca Direta com Barra W', 'Bíceps', 'Barra', 'Mantenha os cotovelos fixos ao lado do tronco durante toda a execução.', 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo'),
  ('Tríceps na Polia com Barra Reta', 'Tríceps', 'Polia', 'Cotovelos junto ao corpo, estenda totalmente os braços contraindo o tríceps.', 'https://www.youtube.com/watch?v=2-LAMcpzODU'),
  ('Elevação Lateral com Halteres', 'Ombros', 'Halteres', 'Eleve os halteres até a linha dos ombros mantendo leve flexão nos cotovelos.', 'https://www.youtube.com/watch?v=3VcKaXpzqRo')
ON CONFLICT DO NOTHING;
