import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Dumbbell, 
  Play, 
  ExternalLink, 
  AlertTriangle, 
  Moon, 
  Activity, 
  Sparkles, 
  Clock, 
  Trophy, 
  CheckCircle2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Flame,
  Zap,
  ArrowDown,
  Layers,
  RotateCcw,
  Pause,
  Info,
  Calendar,
  Save,
  FileText,
  HelpCircle,
  FolderPlus,
  Target,
  TrendingUp,
  BarChart3,
  Edit3,
  SlidersHorizontal,
  Check,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Minus,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';
import { localDay } from '@/lib/metrics';
import { 
  AdvancedSetRow, 
  type AdvancedSetRowData 
} from '@/components/AdvancedSetRow';
import { HevySetRow } from '@/components/HevySetRow';
import { 
  WorkoutProgressionChart, 
  type ExerciseProgressionPoint 
} from '@/components/WorkoutProgressionChart';
import { PRConfetti } from '@/components/PRConfetti';
import { 
  calculateWeeklyMuscleVolume, 
  type MuscleGroup, 
  type BiomechanicalCategory,
  type SetVolumeData,
  MUSCLE_VOLUME_LANDMARKS 
} from '@/lib/volumeTracker';
import { checkMrvDeload, type FatigueLogItem } from '@/lib/checkMrvDeload';

export const Route = createFileRoute('/treinos')({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: typeof search?.mode === 'string' ? search.mode : undefined,
    admin: typeof search?.admin === 'string' ? search.admin : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Treinos & Hipertrofia Avançada' },
      { name: 'description', content: 'Divisão semanal (Segunda a Domingo), sobrecarga progressiva, cluster sets e controle de volume MEV/MRV.' },
    ],
  }),
  component: TreinosRouteComponent,
});

function TreinosRouteComponent() {
  const search = Route.useSearch() as { mode?: string; admin?: string };
  const isAdm = search?.mode === 'admin' || search?.admin === 'true';
  return <TreinosPage defaultMode={isAdm ? 'MONTAR' : undefined} forceAdmin={isAdm} />;
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[]; // Sinergistas residuais (0.5 série indireta)
  category: BiomechanicalCategory;
  equipment: string;
  targetWeightKg?: number; // Carga programada/meta
  targetReps?: number;     // Repetições programadas/meta
  targetRestSeconds?: number; // Tempo de descanso específico prescrito deste exercício
  video_url?: string;
  description?: string;
  sets: AdvancedSetRowData[];
}

export interface WorkoutTemplateItem {
  id: string;
  title: string;
  category: BiomechanicalCategory;
  description: string;
  exercises: {
    exerciseId: string;
    targetWeightKg?: number;
    targetReps?: number;
    targetRestSeconds?: number;
    secondaryMuscles?: MuscleGroup[];
    sets: AdvancedSetRowData[];
  }[];
}

export interface WorkoutSplit {
  id: string;
  name: string;
  description: string;
  workouts: WorkoutTemplateItem[];
}

export interface WeeklyScheduleDay {
  dayOfWeek: string; // 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
  shortDay: string;  // 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'
  workoutTitle: string; // Ex: 'Pull A', 'Push A', 'Descanso'
  workoutId?: string;
}

export interface CustomMuscleItem {
  id: string;
  name: string;
  mev: number;
  mavMin: number;
  mavMax: number;
  mrv: number;
  ceiling: number;
}

export interface MuscleVolumeBreakdown {
  direct: number;
  residual: number;
  total: number;
}

export const DEFAULT_CUSTOM_MUSCLES: CustomMuscleItem[] = [
  { id: 'mus-peito', name: 'Peito', mev: 8, mavMin: 12, mavMax: 18, mrv: 22, ceiling: 16 },
  { id: 'mus-costas', name: 'Costas', mev: 10, mavMin: 14, mavMax: 22, mrv: 26, ceiling: 18 },
  { id: 'mus-quadriceps', name: 'Quadríceps', mev: 8, mavMin: 12, mavMax: 18, mrv: 20, ceiling: 16 },
  { id: 'mus-isquiotibiais', name: 'Isquiotibiais', mev: 6, mavMin: 10, mavMax: 16, mrv: 20, ceiling: 14 },
  { id: 'mus-gluteos', name: 'Glúteos', mev: 4, mavMin: 8, mavMax: 12, mrv: 16, ceiling: 12 },
  { id: 'mus-panturrilhas', name: 'Panturrilhas', mev: 8, mavMin: 12, mavMax: 16, mrv: 20, ceiling: 14 },
  { id: 'mus-ombros-ant', name: 'Ombros Anteriores', mev: 0, mavMin: 6, mavMax: 10, mrv: 12, ceiling: 8 },
  { id: 'mus-ombros-lat', name: 'Ombros Laterais', mev: 8, mavMin: 14, mavMax: 22, mrv: 26, ceiling: 18 },
  { id: 'mus-ombros-post', name: 'Ombros Posteriores', mev: 6, mavMin: 12, mavMax: 18, mrv: 22, ceiling: 14 },
  { id: 'mus-biceps', name: 'Bíceps', mev: 6, mavMin: 10, mavMax: 16, mrv: 20, ceiling: 14 },
  { id: 'mus-triceps', name: 'Tríceps', mev: 6, mavMin: 10, mavMax: 16, mrv: 20, ceiling: 14 },
  { id: 'mus-trapezio', name: 'Trapézio', mev: 4, mavMin: 8, mavMax: 14, mrv: 18, ceiling: 12 },
  { id: 'mus-antebracos', name: 'Antebraços', mev: 4, mavMin: 8, mavMax: 14, mrv: 18, ceiling: 12 },
  { id: 'mus-abdomen', name: 'Abdômen', mev: 4, mavMin: 8, mavMax: 16, mrv: 20, ceiling: 14 },
];

const DAYS_OF_WEEK: { full: string; short: string; dayIndex: number }[] = [
  { full: 'Segunda-feira', short: 'SEG', dayIndex: 1 },
  { full: 'Terça-feira', short: 'TER', dayIndex: 2 },
  { full: 'Quarta-feira', short: 'QUA', dayIndex: 3 },
  { full: 'Quinta-feira', short: 'QUI', dayIndex: 4 },
  { full: 'Sexta-feira', short: 'SEX', dayIndex: 5 },
  { full: 'Sábado', short: 'SÁB', dayIndex: 6 },
  { full: 'Domingo', short: 'DOM', dayIndex: 0 },
];

const EXERCISE_LIBRARY: (Omit<ExerciseItem, 'sets'> & { secondaryMuscles?: MuscleGroup[] })[] = [
  // PUSH
  { id: 'ex-1', name: 'Supino Reto com Barra', muscle: 'Peito', secondaryMuscles: ['Tríceps', 'Ombros Anteriores'], category: 'Push', equipment: 'Barra', targetWeightKg: 80, targetReps: 8, video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', description: 'Escápulas retraídas, arco torácico neutro, desça até o esterno.' },
  { id: 'ex-2', name: 'Supino Inclinado com Halteres', muscle: 'Peito', secondaryMuscles: ['Tríceps', 'Ombros Anteriores'], category: 'Push', equipment: 'Halteres', targetWeightKg: 28, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', description: 'Banco a 30-45 graus, controle a fase excêntrica de 2-3s.' },
  { id: 'ex-3', name: 'Crucifixo Inclinado na Polia', muscle: 'Peito', secondaryMuscles: [], category: 'Push', equipment: 'Polia', targetWeightKg: 15, targetReps: 12, video_url: 'https://www.youtube.com/watch?v=taI4XduLpTw', description: 'Tensão constante em todo o arco de adução dos braços.' },
  { id: 'ex-4', name: 'Desenvolvimento com Halteres', muscle: 'Ombros Anteriores', secondaryMuscles: ['Tríceps', 'Ombros Laterais'], category: 'Push', equipment: 'Halteres', targetWeightKg: 22, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=qEwKCR5JCog', description: 'Cotovelos a 45º no plano escapular, empurre até extensão quase total.' },
  { id: 'ex-5', name: 'Elevação Lateral com Halteres', muscle: 'Ombros Laterais', secondaryMuscles: [], category: 'Push', equipment: 'Halteres', targetWeightKg: 12, targetReps: 15, video_url: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', description: 'Braços ligeiramente abduzidos à frente, cotovelos lideram o movimento.' },
  { id: 'ex-6', name: 'Tríceps na Polia com Barra', muscle: 'Tríceps', secondaryMuscles: [], category: 'Push', equipment: 'Polia', targetWeightKg: 35, targetReps: 12, video_url: 'https://www.youtube.com/watch?v=2-LAMcpzODU', description: 'Cotovelos alinhados e travados ao lado do tronco.' },
  { id: 'ex-7', name: 'Tríceps Testa com Barra W', muscle: 'Tríceps', secondaryMuscles: [], category: 'Push', equipment: 'Barra', targetWeightKg: 30, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=d_KZxkH_4aE', description: 'Foco na cabeça longa do tríceps com extensão controlada.' },

  // PULL
  { id: 'ex-8', name: 'Puxada Frontal na Polia', muscle: 'Costas', secondaryMuscles: ['Bíceps', 'Ombros Posteriores'], category: 'Pull', equipment: 'Polia', targetWeightKg: 65, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', description: 'Depressão das escápulas antes de puxar os cotovelos para baixo.' },
  { id: 'ex-9', name: 'Remada Curvada com Barra', muscle: 'Costas', secondaryMuscles: ['Bíceps', 'Ombros Posteriores'], category: 'Pull', equipment: 'Barra', targetWeightKg: 75, targetReps: 8, video_url: 'https://www.youtube.com/watch?v=vT2GjY_Umpw', description: 'Coluna neutra, cotovelos rentes ao tronco puxando em direção ao quadril.' },
  { id: 'ex-10', name: 'Remada Unilateral com Halter', muscle: 'Costas', secondaryMuscles: ['Bíceps'], category: 'Pull', equipment: 'Halteres', targetWeightKg: 32, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=pYcpY20QaE8', description: 'Grande alongamento dorsal na descida e contração no topo.' },
  { id: 'ex-11', name: 'Crucifixo Invertido no Peck Deck', muscle: 'Ombros Posteriores', secondaryMuscles: [], category: 'Pull', equipment: 'Máquina', targetWeightKg: 40, targetReps: 12, video_url: 'https://www.youtube.com/watch?v=H530fW3kWKg', description: 'Isolamento da porção posterior do deltoide.' },
  { id: 'ex-12', name: 'Rosca Direta com Barra W', muscle: 'Bíceps', secondaryMuscles: [], category: 'Pull', equipment: 'Barra', targetWeightKg: 16, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', description: 'Supinação mantida, contração de pico no topo sem elevar os cotovelos.' },
  { id: 'ex-13', name: 'Rosca Inclinada com Halteres', muscle: 'Bíceps', secondaryMuscles: [], category: 'Pull', equipment: 'Halteres', targetWeightKg: 14, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=soxrZlIl35U', description: 'Alongamento máximo da cabeça longa do bíceps.' },

  // LEGS
  { id: 'ex-14', name: 'Agachamento Livre com Barra', muscle: 'Quadríceps', secondaryMuscles: ['Glúteos'], category: 'Legs', equipment: 'Barra', targetWeightKg: 100, targetReps: 8, video_url: 'https://www.youtube.com/watch?v=ultWZbUMPL8', description: 'Pés na largura dos ombros, profundidade abaixo da paralela.' },
  { id: 'ex-15', name: 'Leg Press 45º', muscle: 'Quadríceps', secondaryMuscles: ['Glúteos'], category: 'Legs', equipment: 'Máquina', targetWeightKg: 200, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', description: 'Costas bem apoiadas, amplitude máxima sem retroversão pélvica.' },
  { id: 'ex-16', name: 'Cadeira Extensora', muscle: 'Quadríceps', secondaryMuscles: [], category: 'Legs', equipment: 'Máquina', targetWeightKg: 55, targetReps: 12, video_url: 'https://www.youtube.com/watch?v=YyvSfVADMvc', description: 'Excelente para técnicas de alta intensidade como Myo-Reps e Drops.' },
  { id: 'ex-17', name: 'Mesa Flexora', muscle: 'Isquiotibiais', secondaryMuscles: [], category: 'Legs', equipment: 'Máquina', targetWeightKg: 45, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', description: 'Quadril colado no banco, controle a fase excêntrica.' },
  { id: 'ex-18', name: 'Stiff com Barra', muscle: 'Isquiotibiais', secondaryMuscles: ['Glúteos'], category: 'Legs', equipment: 'Barra', targetWeightKg: 80, targetReps: 8, video_url: 'https://www.youtube.com/watch?v=1uDiW5--rAE', description: 'Hinge de quadril, joelhos levemente destravados, coluna reta.' },
  { id: 'ex-19', name: 'Elevação Pélvica com Barra', muscle: 'Glúteos', secondaryMuscles: ['Isquiotibiais'], category: 'Legs', equipment: 'Barra', targetWeightKg: 110, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=SEdqd1n0cvg', description: 'Pausa de 1 segundo de contração máxima no topo.' },
  { id: 'ex-20', name: 'Gêmeos Sentado', muscle: 'Panturrilhas', secondaryMuscles: [], category: 'Legs', equipment: 'Máquina', targetWeightKg: 45, targetReps: 15, video_url: 'https://www.youtube.com/watch?v=JbyjNymZOt0', description: 'Foco no músculo sóleo, pausa de 2 segundos no ponto de máximo alongamento.' },
];

const DEFAULT_SPLITS: WorkoutSplit[] = [
  {
    id: 'split-ppl',
    name: 'PPL (Push / Pull / Legs)',
    description: 'Divisão biomecânica por padrão de movimento',
    workouts: [
      {
        id: 'ppl-push',
        title: 'Push A — Hipertrofia & Força',
        category: 'Push',
        description: 'Peito, Deltóide Anterior/Medial e Tríceps com Myo-Reps e Drop-Sets',
        exercises: [
          {
            exerciseId: 'ex-1',
            targetWeightKg: 85,
            targetReps: 8,
            sets: [
              { id: 's1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 12, rir: 4, completed: false },
              { id: 's2', setNumber: 2, baseType: 'FEEDER', technique: 'NONE', weight: 70, reps: 3, rir: 3, completed: false },
              { id: 's3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', targetWeight: 85, targetReps: 8, weight: 85, reps: 8, rir: 2, previousWeight: 82.5, previousReps: 8, completed: false },
              { id: 's4', setNumber: 4, baseType: 'BACKOFF', technique: 'NONE', targetWeight: 75, targetReps: 10, weight: 75, reps: 10, rir: 1, completed: false },
            ],
          },
          {
            exerciseId: 'ex-2',
            targetWeightKg: 30,
            targetReps: 8,
            sets: [
              { id: 's5', setNumber: 1, baseType: 'WORKING', technique: 'NONE', targetWeight: 30, targetReps: 10, weight: 30, reps: 10, rir: 2, completed: false },
              { id: 's6', setNumber: 2, baseType: 'WORKING', technique: 'DROP_SET', targetWeight: 30, targetReps: 8, weight: 30, reps: 8, rir: 0, completed: false, dropSets: [{ id: 'ds1', weight: 22, reps: 6, completed: false }] },
            ],
          },
          {
            exerciseId: 'ex-5',
            targetWeightKg: 12,
            targetReps: 15,
            sets: [
              { id: 's7', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', targetWeight: 12, targetReps: 15, weight: 12, reps: 15, rir: 0, completed: false, myoMicroSets: [{ id: 'm1', reps: 4, completed: false }, { id: 'm2', reps: 4, completed: false }] },
            ],
          },
          {
            exerciseId: 'ex-6',
            targetWeightKg: 40,
            targetReps: 6,
            sets: [
              { id: 's8', setNumber: 1, baseType: 'WORKING', technique: 'CLUSTER_SET', targetWeight: 40, targetReps: 6, weight: 40, reps: 6, rir: 0, completed: false, clusterBlocks: [{ id: 'cb1', reps: 2, completed: false }, { id: 'cb2', reps: 2, completed: false }, { id: 'cb3', reps: 2, completed: false }] },
            ],
          },
        ],
      },
      {
        id: 'ppl-pull',
        title: 'Pull A — Densidade Dorsal & Bíceps',
        category: 'Pull',
        description: 'Costas, Deltóide Posterior e Bíceps',
        exercises: [
          {
            exerciseId: 'ex-9',
            targetWeightKg: 80,
            targetReps: 6,
            sets: [
              { id: 'p1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 10, rir: 4, completed: false },
              { id: 'p2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', targetWeight: 80, targetReps: 6, weight: 80, reps: 6, rir: 1, completed: false },
            ],
          },
          {
            exerciseId: 'ex-8',
            targetWeightKg: 65,
            targetReps: 8,
            sets: [
              { id: 'p3', setNumber: 1, baseType: 'WORKING', technique: 'DROP_SET', targetWeight: 65, targetReps: 8, weight: 65, reps: 8, rir: 0, completed: false, dropSets: [{ id: 'ds2', weight: 45, reps: 6, completed: false }] },
            ],
          },
          {
            exerciseId: 'ex-12',
            targetWeightKg: 15,
            targetReps: 12,
            sets: [
              { id: 'p4', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', targetWeight: 15, targetReps: 12, weight: 15, reps: 12, rir: 0, completed: false, myoMicroSets: [{ id: 'mb1', reps: 4, completed: false }] },
            ],
          },
        ],
      },
      {
        id: 'ppl-legs',
        title: 'Legs A — Quadríceps & Isquiotibiais',
        category: 'Legs',
        description: 'Agachamento pesado, extensora e flexora',
        exercises: [
          {
            exerciseId: 'ex-14',
            targetWeightKg: 100,
            targetReps: 6,
            sets: [
              { id: 'l1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 50, reps: 10, rir: 4, completed: false },
              { id: 'l2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', targetWeight: 100, targetReps: 6, weight: 100, reps: 6, rir: 1, completed: false },
            ],
          },
          {
            exerciseId: 'ex-16',
            targetWeightKg: 50,
            targetReps: 15,
            sets: [
              { id: 'l3', setNumber: 1, baseType: 'WORKING', technique: 'CLUSTER_SET', targetWeight: 50, targetReps: 15, weight: 50, reps: 15, rir: 0, completed: false, clusterBlocks: [{ id: 'clb1', reps: 3, completed: false }, { id: 'clb2', reps: 3, completed: false }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'split-abc',
    name: 'ABC Tradicional',
    description: 'Divisão clássica por sinergia muscular',
    workouts: [
      {
        id: 'abc-a',
        title: 'Treino A — Peito & Tríceps',
        category: 'Push',
        description: 'Peitoral completo e tríceps',
        exercises: [
          {
            exerciseId: 'ex-1',
            targetWeightKg: 80,
            targetReps: 8,
            sets: [
              { id: 'a1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 12, rir: 4, completed: false },
              { id: 'a2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', targetWeight: 80, targetReps: 8, weight: 80, reps: 8, rir: 2, completed: false },
            ],
          },
        ],
      },
      {
        id: 'abc-b',
        title: 'Treino B — Costas & Bíceps',
        category: 'Pull',
        description: 'Dorsal e bíceps',
        exercises: [
          {
            exerciseId: 'ex-9',
            targetWeightKg: 75,
            targetReps: 8,
            sets: [
              { id: 'b1', setNumber: 1, baseType: 'WORKING', technique: 'NONE', targetWeight: 75, targetReps: 8, weight: 75, reps: 8, rir: 2, completed: false },
            ],
          },
        ],
      },
      {
        id: 'abc-c',
        title: 'Treino C — Pernas & Ombros',
        category: 'Legs',
        description: 'Membros inferiores e deltoides',
        exercises: [
          {
            exerciseId: 'ex-14',
            targetWeightKg: 90,
            targetReps: 8,
            sets: [
              { id: 'c1', setNumber: 1, baseType: 'WORKING', technique: 'NONE', targetWeight: 90, targetReps: 8, weight: 90, reps: 8, rir: 2, completed: false },
            ],
          },
        ],
      },
    ],
  },
];

const LOCAL_STORAGE_SPLITS_KEY = 'niflheim_workout_splits_v3';
const LOCAL_STORAGE_SCHEDULE_KEY = 'niflheim_weekly_schedule_v3';
const LOCAL_STORAGE_ACTIVE_SESSION_KEY = 'niflheim_active_workout_session_v4';
const LOCAL_STORAGE_ADMIN_KEY = 'niflheim_admin_unlocked_v1';
const LOCAL_STORAGE_ADMIN_TOKEN_KEY = 'niflheim_adm_jwt_token';

export function TreinosPage({ defaultMode, forceAdmin }: { defaultMode?: 'FAZER' | 'MONTAR'; forceAdmin?: boolean } = {}) {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();
  const todayDayIndex = new Date().getDay(); // 0 = Domingo, 1 = Segunda...

  // Modo de visualização: 'FAZER' (Visão do Usuário / Estilo Hevy) vs 'MONTAR' (Painel do Administrador)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (forceAdmin || defaultMode === 'MONTAR') return true;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isUrlAdmin = searchParams.get('mode') === 'admin' || searchParams.get('admin') === 'true' || window.location.hash.includes('admin');
      if (isUrlAdmin) return true;
      return localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY) === 'true';
    }
    return false;
  });

  const [workoutMode, setWorkoutMode] = useState<'FAZER' | 'MONTAR'>(() => {
    if (defaultMode) return defaultMode;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isUrlAdmin = searchParams.get('mode') === 'admin' || searchParams.get('admin') === 'true' || window.location.hash.includes('admin');
      if (isUrlAdmin) return 'MONTAR';
    }
    return 'FAZER';
  });

  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [adminUserInput, setAdminUserInput] = useState('coach@niflheim.fit');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);
  const [programMuscleGroups, setProgramMuscleGroups] = useState('Peitoral, Ombro e Tríceps');

  // Questionário Pop-up Pós-Treino (Recovery, Progressão e Treinamento Científico)
  const [recoveryPse, setRecoveryPse] = useState<'LEVE' | 'MODERADO' | 'FALHA'>('MODERADO');
  const [recoverySleep, setRecoverySleep] = useState<'RUIM' | 'REGULAR' | 'REPARADOR'>('REGULAR');
  const [recoveryJointPain, setRecoveryJointPain] = useState<'NAO' | 'LEVE' | 'SIM'>('NAO');
  const [recoveryProgression, setRecoveryProgression] = useState<'PROGRESSION_UP' | 'PROGRESSION_SAME' | 'PROGRESSION_DOWN'>('PROGRESSION_SAME');
  const [recoveryPump, setRecoveryPump] = useState<'OTIMO' | 'MODERADO' | 'FRACO'>('OTIMO');

  const [expandedTipsId, setExpandedTipsId] = useState<string | null>(null);
  const [isVolumeTrackerExpanded, setIsVolumeTrackerExpanded] = useState(false);

  // Rotinas e Divisões
  const [splits, setSplits] = useState<WorkoutSplit[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SPLITS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((s) => ({
              ...s,
              workouts: Array.isArray(s?.workouts) ? s.workouts : [],
            }));
          }
        }
      } catch (e) {}
    }
    return DEFAULT_SPLITS;
  });

  const [activeSplitId, setActiveSplitId] = useState<string>('split-ppl');
  const activeSplit = useMemo(() => {
    const found = splits.find((s) => s.id === activeSplitId);
    if (found && Array.isArray(found.workouts) && found.workouts.length > 0) return found;
    if (splits[0] && Array.isArray(splits[0].workouts)) return splits[0];
    return DEFAULT_SPLITS[0];
  }, [splits, activeSplitId]);

  // Agenda Semanal (Segunda a Domingo)
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleDay[]>(() => {
    const defaultSchedule: WeeklyScheduleDay[] = [
      { dayOfWeek: 'Segunda-feira', shortDay: 'SEG', workoutTitle: 'Pull A — Densidade Dorsal & Bíceps', workoutId: 'ppl-pull' },
      { dayOfWeek: 'Terça-feira', shortDay: 'TER', workoutTitle: 'Push A — Hipertrofia & Força', workoutId: 'ppl-push' },
      { dayOfWeek: 'Quarta-feira', shortDay: 'QUA', workoutTitle: 'Legs A — Quadríceps & Isquiotibiais', workoutId: 'ppl-legs' },
      { dayOfWeek: 'Quinta-feira', shortDay: 'QUI', workoutTitle: 'Descanso / Recuperação Ativa' },
      { dayOfWeek: 'Sexta-feira', shortDay: 'SEX', workoutTitle: 'Push A — Hipertrofia & Força', workoutId: 'ppl-push' },
      { dayOfWeek: 'Sábado', shortDay: 'SÁB', workoutTitle: 'Pull A — Densidade Dorsal & Bíceps', workoutId: 'ppl-pull' },
      { dayOfWeek: 'Domingo', shortDay: 'DOM', workoutTitle: 'Descanso / Recuperação' },
    ];

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SCHEDULE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length === 7) {
            return parsed.map((d, i) => ({
              dayOfWeek: d?.dayOfWeek || defaultSchedule[i].dayOfWeek,
              shortDay: d?.shortDay || defaultSchedule[i].shortDay,
              workoutTitle: d?.workoutTitle || 'Descanso / Recuperação',
              workoutId: d?.workoutId,
            }));
          }
        }
      } catch (e) {}
    }
    return defaultSchedule;
  });

  // Efeito para detectar alternância ou link direto para o modo admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isUrlAdmin = searchParams.get('mode') === 'admin' || searchParams.get('admin') === 'true' || window.location.hash.includes('admin');
      if (isUrlAdmin) {
        setIsAdminUnlocked(true);
        setWorkoutMode('MONTAR');
      }
    }
  }, []);

  // Salvar agenda no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_SCHEDULE_KEY, JSON.stringify(weeklySchedule));
        localStorage.setItem(LOCAL_STORAGE_SPLITS_KEY, JSON.stringify(splits));
      } catch (e) {}
    }
  }, [weeklySchedule, splits]);

  // Sessão Ativa com Persistência Segura (Não perde séries feitas nem altera status ao recarregar)
  const [sessionTitle, setSessionTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.sessionTitle) return parsed.sessionTitle;
        }
      } catch (e) {}
    }
    return 'Push A — Hipertrofia & Força';
  });

  const [sessionCategory, setSessionCategory] = useState<BiomechanicalCategory>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.sessionCategory) return parsed.sessionCategory;
        }
      } catch (e) {}
    }
    return 'Push';
  });

  const [exercises, setExercises] = useState<ExerciseItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed?.exercises) && parsed.exercises.length > 0) {
            return parsed.exercises.map((item: any) => ({
              ...item,
              secondaryMuscles: Array.isArray(item?.secondaryMuscles) ? item.secondaryMuscles : [],
              sets: Array.isArray(item?.sets) ? item.sets : [],
            }));
          }
        }
      } catch (e) {}
    }
    const tpl = DEFAULT_SPLITS[0].workouts[0];
    return tpl.exercises.map((item) => {
      const lib = EXERCISE_LIBRARY.find((e) => e.id === item.exerciseId) || {
        id: item.exerciseId,
        name: 'Exercício',
        muscle: 'Peito' as MuscleGroup,
        category: 'Push' as BiomechanicalCategory,
        equipment: 'Barra',
        sets: [],
      };
      return {
        ...lib,
        targetWeightKg: item.targetWeightKg ?? lib.targetWeightKg,
        targetReps: item.targetReps ?? lib.targetReps,
        secondaryMuscles: item.secondaryMuscles ?? lib.secondaryMuscles ?? [],
        sets: Array.isArray(item.sets) ? item.sets : [],
      };
    });
  });

  // Sincronizar sessão ativa no localStorage para garantir que nada seja desmarcado involuntariamente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY, JSON.stringify({
          sessionTitle,
          sessionCategory,
          exercises,
        }));
      } catch (e) {}
    }
  }, [sessionTitle, sessionCategory, exercises]);

  // Exercício com gráfico aberto
  const [selectedExerciseForChart, setSelectedExerciseForChart] = useState<string | null>(null);

  // Modais
  const [isCreateSplitModalOpen, setIsCreateSplitModalOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState('');
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [exerciseFilterCategory, setExerciseFilterCategory] = useState<string>('Todos');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState<MuscleGroup>('Peito');
  const [customExerciseSecondaryMuscles, setCustomExerciseSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [customTargetWeight, setCustomTargetWeight] = useState<number>(40);
  const [customTargetReps, setCustomTargetReps] = useState<number>(10);

  // Modal para criar/adicionar novo treino no Coach Studio
  const [isNewWorkoutModalOpen, setIsNewWorkoutModalOpen] = useState(false);
  const [newWorkoutTitleInput, setNewWorkoutTitleInput] = useState('');
  const [newWorkoutCategoryInput, setNewWorkoutCategoryInput] = useState<BiomechanicalCategory>('Push');

  // Agenda Semanal - Modais e Notificações
  const [isWeeklyScheduleModalOpen, setIsWeeklyScheduleModalOpen] = useState(false);
  const [isMrvModalOpen, setIsMrvModalOpen] = useState(false);
  const [selectedCoachDayIndex, setSelectedCoachDayIndex] = useState<number>(() => {
    const dow = new Date().getDay();
    return dow === 0 ? 6 : dow - 1; // 0 = Seg, 6 = Dom
  });
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null);
  // Sub-abas do Painel do Coach: LIMITES (Configuração de Tetos e Recomendações) vs ROTINA (Montador Diário)
  const [coachSubTab, setCoachSubTab] = useState<'LIMITES' | 'ROTINA'>('ROTINA');

  const [muscleGroupsList, setMuscleGroupsList] = useState<CustomMuscleItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('NIFLHEIM_CUSTOM_MUSCLE_GROUPS');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item, idx) => ({
              id: item?.id || `mus-${idx}-${item?.name || 'm'}`,
              name: item?.name || DEFAULT_CUSTOM_MUSCLES[idx]?.name || 'Músculo',
              mev: typeof item?.mev === 'number' ? item.mev : (DEFAULT_CUSTOM_MUSCLES[idx]?.mev ?? 6),
              mavMin: typeof item?.mavMin === 'number' ? item.mavMin : (DEFAULT_CUSTOM_MUSCLES[idx]?.mavMin ?? 10),
              mavMax: typeof item?.mavMax === 'number' ? item.mavMax : (DEFAULT_CUSTOM_MUSCLES[idx]?.mavMax ?? 16),
              mrv: typeof item?.mrv === 'number' ? item.mrv : (DEFAULT_CUSTOM_MUSCLES[idx]?.mrv ?? 20),
              ceiling: typeof item?.ceiling === 'number' ? item.ceiling : (DEFAULT_CUSTOM_MUSCLES[idx]?.ceiling ?? 14),
            }));
          }
        }
      } catch (e) {}
    }
    return DEFAULT_CUSTOM_MUSCLES;
  });

  const saveMuscleGroupsList = (newList: CustomMuscleItem[]) => {
    setMuscleGroupsList(newList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('NIFLHEIM_CUSTOM_MUSCLE_GROUPS', JSON.stringify(newList));
    }
  };

  const muscleCeilings = useMemo(() => {
    const map: Record<string, number> = {};
    (muscleGroupsList || []).forEach((m) => {
      if (m?.name) {
        map[m.name] = typeof m.ceiling === 'number' ? m.ceiling : 14;
      }
    });
    return map;
  }, [muscleGroupsList]);

  // Modais e Estados de CRUD de Grupos Musculares
  const [isAddMuscleModalOpen, setIsAddMuscleModalOpen] = useState(false);
  const [editingMuscleItem, setEditingMuscleItem] = useState<CustomMuscleItem | null>(null);
  const [newMuscleForm, setNewMuscleForm] = useState<{
    name: string;
    mev: number;
    mavMin: number;
    mavMax: number;
    mrv: number;
    ceiling: number;
  }>({
    name: '',
    mev: 6,
    mavMin: 10,
    mavMax: 16,
    mrv: 20,
    ceiling: 14,
  });

  const handleAddMuscleGroup = () => {
    const cleanName = newMuscleForm.name.trim();
    if (!cleanName) {
      alert('Informe o nome do grupamento muscular.');
      return;
    }
    const exists = muscleGroupsList.some((m) => m.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      alert(`O grupamento muscular "${cleanName}" já existe.`);
      return;
    }

    const newMuscle: CustomMuscleItem = {
      id: `mus-${crypto.randomUUID()}`,
      name: cleanName,
      mev: Math.max(0, newMuscleForm.mev),
      mavMin: Math.max(1, newMuscleForm.mavMin),
      mavMax: Math.max(newMuscleForm.mavMin, newMuscleForm.mavMax),
      mrv: Math.max(newMuscleForm.mavMax, newMuscleForm.mrv),
      ceiling: Math.max(1, newMuscleForm.ceiling),
    };

    const updated = [...muscleGroupsList, newMuscle];
    saveMuscleGroupsList(updated);
    setIsAddMuscleModalOpen(false);
    setNewMuscleForm({ name: '', mev: 6, mavMin: 10, mavMax: 16, mrv: 20, ceiling: 14 });
    showScheduleToast(`🎯 Novo grupamento "${cleanName}" adicionado com sucesso!`);
  };

  const handleSaveEditMuscle = () => {
    if (!editingMuscleItem || !editingMuscleItem.name.trim()) return;
    const cleanName = editingMuscleItem.name.trim();
    const updated = muscleGroupsList.map((m) => (m.id === editingMuscleItem.id ? { ...editingMuscleItem, name: cleanName } : m));
    saveMuscleGroupsList(updated);
    setEditingMuscleItem(null);
    showScheduleToast(`✓ Grupamento "${cleanName}" atualizado com sucesso!`);
  };

  const handleDeleteMuscleGroup = (muscleId: string) => {
    const target = muscleGroupsList.find((m) => m.id === muscleId);
    if (!target) return;
    if (muscleGroupsList.length <= 1) {
      alert('Você deve manter pelo menos um grupamento muscular no sistema.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir o grupamento muscular "${target.name}"? Todos os limites dele serão removidos.`)) {
      return;
    }
    const updated = muscleGroupsList.filter((m) => m.id !== muscleId);
    saveMuscleGroupsList(updated);
    showScheduleToast(`🗑️ Grupamento "${target.name}" removido.`);
  };

  const handleUpdateMuscleCeiling = (muscleName: string, ceiling: number) => {
    const val = Math.max(1, ceiling);
    const updated = muscleGroupsList.map((m) => (m.name === muscleName ? { ...m, ceiling: val } : m));
    saveMuscleGroupsList(updated);
    showScheduleToast(`🎯 Teto de ${muscleName} ajustado para ${val} séries semanais`);
  };

  const [nutritionScore, setNutritionScore] = useState(4);
  const [editingDayModalIndex, setEditingDayModalIndex] = useState<number | null>(null);
  const [customDayWorkoutText, setCustomDayWorkoutText] = useState('');

  // Atualização em lote do tempo de descanso por exercício
  const handleUpdateExerciseRest = (exerciseId: string, restSecs: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          targetRestSeconds: restSecs,
          sets: ex.sets.map((s) => ({ ...s, restSeconds: restSecs })),
        };
      })
    );
    showScheduleToast(`⏱️ Descanso do exercício definido para ${restSecs}s`);
  };

  const showScheduleToast = (msg: string) => {
    setScheduleFeedback(msg);
    setTimeout(() => {
      setScheduleFeedback((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Autenticação e Alternância do Modo Administrador (Coach Studio)
  const handleRequestAdminMode = () => {
    if (isAdminUnlocked) {
      setWorkoutMode('MONTAR');
    } else {
      setAdminAuthError(false);
      setAdminPasswordInput('');
      setIsAdminPinModalOpen(true);
    }
  };

  const handleVerifyAdminLogin = () => {
    const userTrim = adminUserInput.trim();
    const passTrim = adminPasswordInput.trim();
    // Aceita admin/1234/coach ou qualquer senha com mais de 2 caracteres
    if (userTrim && (passTrim === '1234' || passTrim.toLowerCase() === 'admin' || passTrim === '0000' || passTrim.length >= 3)) {
      setIsAdminUnlocked(true);
      if (typeof window !== 'undefined') {
        const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ user: userTrim, role: 'COACH', exp: Date.now() + 86400000 }))}.signature_token`;
        localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, 'true');
        localStorage.setItem(LOCAL_STORAGE_ADMIN_TOKEN_KEY, mockJwt);
      }
      setIsAdminPinModalOpen(false);
      setWorkoutMode('MONTAR');
      showScheduleToast('👑 Painel do Treinador (Coach ADM) autenticado com sucesso!');
    } else {
      setAdminAuthError(true);
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_ADMIN_KEY);
      localStorage.removeItem(LOCAL_STORAGE_ADMIN_TOKEN_KEY);
    }
    setWorkoutMode('FAZER');
    showScheduleToast('🔒 Painel Administrativo bloqueado.');
  };

  // Vídeo retrátil
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  // Floating Rest Timer
  const [restTime, setRestTime] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [restTargetTime, setRestTargetTime] = useState<number | null>(null);
  const [lastRestTriggerSource, setLastRestTriggerSource] = useState<string>('Série Concluída');
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Registro do Service Worker para suporte a Notificações em Segundo Plano / PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Toca chime sonoro nítido de conclusão de descanso (3 sinos harmônicos: D5 -> A5 -> D6)
  const playRestChimeSound = () => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const notes = [
        { freq: 587.33, delay: 0, duration: 0.35 },    // D5
        { freq: 880.00, delay: 0.12, duration: 0.45 },  // A5
        { freq: 1174.66, delay: 0.26, duration: 0.65 }, // D6
      ];

      notes.forEach(({ freq, delay, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = ctx.currentTime + delay;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.4, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('Erro ao tocar som do cronômetro:', e);
    }
  };

  // Disparo ao finalizar o descanso (Som + Notificação do Sistema + Vibração + Alerta na Aba)
  const handleTimerComplete = (sourceTitle?: string) => {
    setTimerActive(false);
    setRestTargetTime(null);
    setRestTime(0);

    // 1. Som nítido do cronômetro
    playRestChimeSound();

    // 2. Vibração tátil no celular
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 500]);
    }

    // 3. Notificação do Sistema (funciona mesmo com o app minimizado ou em segundo plano)
    const notificationTitle = '⏱️ Descanso Concluído!';
    const notificationBody = `${sourceTitle || lastRestTriggerSource || 'Seu descanso acabou'}. Hora de iniciar a próxima série!`;

    if (typeof window !== 'undefined') {
      document.title = '🔔 TEMPO ESGOTADO! • Niflheim';
      setTimeout(() => {
        document.title = 'Niflheim — Treino & Hipertrofia';
      }, 7000);

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(notificationTitle, {
                body: notificationBody,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                vibrate: [250, 100, 250, 100, 500],
                tag: 'niflheim-rest-timer',
                renotify: true,
              });
            }).catch(() => {
              new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/favicon.svg',
              });
            });
          } else {
            new Notification(notificationTitle, {
              body: notificationBody,
              icon: '/favicon.svg',
            });
          }
        } catch (e) {
          console.warn('Falha ao enviar notificação:', e);
        }
      }
    }

    showScheduleToast(`⏱️ Descanso finalizado: ${sourceTitle || lastRestTriggerSource || 'Próxima série!'}`);
  };

  // Timer effect baseado em Timestamp Real (não congela ou atrasa ao sair do app ou bloquear a tela)
  useEffect(() => {
    if (!timerActive || !restTargetTime) return;

    const checkTime = () => {
      const now = Date.now();
      const diffMs = restTargetTime - now;
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));
      setRestTime(remaining);

      if (typeof document !== 'undefined') {
        if (remaining > 0) {
          document.title = `(${formatTimer(remaining)}) Descanso • Niflheim`;
        }
      }

      if (remaining <= 0) {
        handleTimerComplete();
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkTime();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [timerActive, restTargetTime, lastRestTriggerSource]);

  // Modal Pós-Treino
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [pse, setPse] = useState(8);
  const [duration, setDuration] = useState(55);

  // Modal Check-in Noturno
  const [isNightCheckinOpen, setIsNightCheckinOpen] = useState(false);
  const [sleepScore, setSleepScore] = useState(4);
  const [domsScore, setDomsScore] = useState(3);
  const [fatigueScore, setFatigueScore] = useState(3);

  // Tempos de descanso configuráveis por tipo de série
  const [restWarmupSeconds, setRestWarmupSeconds] = useState<number>(60);
  const [restWorkingSeconds, setRestWorkingSeconds] = useState<number>(120);

  // Efeito / Celebração de PR Batido
  const [prCelebration, setPrCelebration] = useState<{
    show: boolean;
    exerciseName: string;
    weight: number;
    reps: number;
    tonnage: number;
  } | null>(null);

  const triggerFloatingTimer = (seconds = 90, source = 'Série Concluída') => {
    const target = Date.now() + seconds * 1000;
    setRestTargetTime(target);
    setRestTime(seconds);
    setTimerActive(true);
    setLastRestTriggerSource(source);

    // Solicita permissão para notificações no gesto de clique do usuário
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    // Inicializa AudioContext no gesto do usuário para garantir que o som toque no celular
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {}
  };

  const handleTriggerPRCelebration = (
    exerciseName: string,
    info: { weight: number; reps: number; tonnage: number }
  ) => {
    // 1. Efeito sonoro triunfante em acorde sintetizado (Web Audio API)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.6);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.6);
      });
    } catch (e) {}

    // 2. Vibração háptica no celular
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 150, 50, 250]);
    }

    // 3. Ativar partículas amarelas e banner
    setPrCelebration({
      show: true,
      exerciseName,
      weight: info.weight,
      reps: info.reps,
      tonnage: info.tonnage,
    });

    reward(50);
  };

  // Avaliação MRV
  const fatigueLogs: FatigueLogItem[] = data.fatigue.map((f) => ({
    day: f.day ?? today,
    sleep: f.details['sleep'],
    doms: f.details['doms'] ?? 1,
    fatigue: f.details['fatigue'],
  }));
  const mrvStatus = checkMrvDeload(fatigueLogs);

  // Volume Tracker
  const sessionVolumeData: SetVolumeData[] = useMemo(() => {
    const list: SetVolumeData[] = [];
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        list.push({
          id: s.id,
          muscle: ex.muscle,
          baseType: s.baseType,
          intensityTechnique: s.technique,
          weight: s.weight,
          reps: s.reps,
          rir: s.rir,
          completed: s.completed,
          timestamp: new Date().toISOString(),
        });
      });
    });
    return list;
  }, [exercises]);

  const weeklyVolumeAssessments = useMemo(() => {
    return calculateWeeklyMuscleVolume(sessionVolumeData);
  }, [sessionVolumeData]);

  const activeMusclesInSession = useMemo(() => {
    const unique = new Set(exercises.map((e) => e.muscle));
    return weeklyVolumeAssessments.filter((a) => unique.has(a.muscle) || a.rawSetCount > 0);
  }, [exercises, weeklyVolumeAssessments]);

  // Músculo primário do treino atual para a métrica de MRV
  const primaryMuscle = useMemo<MuscleGroup>(() => {
    if (!exercises.length) return 'Peito';
    const counts: Record<string, number> = {};
    exercises.forEach((ex) => {
      const workingCount = ex.sets.filter((s) => s.baseType === 'WORKING' || s.baseType === 'BACKOFF').length;
      counts[ex.muscle] = (counts[ex.muscle] || 0) + (workingCount || 1);
    });
    let best: MuscleGroup = exercises[0].muscle;
    let max = -1;
    for (const m in counts) {
      if (counts[m] > max) {
        max = counts[m];
        best = m as MuscleGroup;
      }
    }
    return best;
  }, [exercises]);

  const primaryMuscleAssessment = useMemo(() => {
    const found = weeklyVolumeAssessments.find((a) => a.muscle === primaryMuscle);
    if (found) return found;
    const workingSets = exercises.reduce((acc, ex) => {
      if (ex.muscle === primaryMuscle) {
        return acc + ex.sets.filter((s) => s.baseType === 'WORKING' || s.baseType === 'BACKOFF').length;
      }
      return acc;
    }, 0);
    const landmarks = MUSCLE_VOLUME_LANDMARKS[primaryMuscle] || { mev: 10, mavMin: 12, mavMax: 18, mrv: 20 };
    return {
      muscle: primaryMuscle,
      effectiveWorkingSets: workingSets || 12,
      rawSetCount: workingSets || 12,
      landmarks: { ...landmarks, mrv: landmarks.mrv || 16 },
      status: 'MAV' as const,
      statusLabel: 'Zona Ideal',
      recommendation: 'Volume ótimo para hipertrofia máxima.',
    };
  }, [weeklyVolumeAssessments, primaryMuscle, exercises]);

  // Barra de texto minimalista [ ████████░░ ]
  const mrvBarString = useMemo(() => {
    const current = primaryMuscleAssessment.effectiveWorkingSets;
    const max = primaryMuscleAssessment.landmarks.mrv || 16;
    const totalBlocks = 10;
    const filledBlocks = Math.min(totalBlocks, Math.max(0, Math.round((current / max) * totalBlocks)));
    const emptyBlocks = totalBlocks - filledBlocks;
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  }, [primaryMuscleAssessment]);

  // Tonelagem Total
  const totalSessionTonnage = useMemo(() => {
    let sum = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          sum += s.weight * s.reps;
          s.dropSets?.forEach((ds) => { if (ds.completed) sum += ds.weight * ds.reps; });
          s.myoMicroSets?.forEach((ms) => { if (ms.completed) sum += s.weight * ms.reps; });
          s.clusterBlocks?.forEach((cb) => { if (cb.completed) sum += s.weight * cb.reps; });
          s.restPauseSubSets?.forEach((rp) => { if (rp.completed) sum += s.weight * rp.reps; });
        }
      });
    });
    return Math.round(sum);
  }, [exercises]);

  const completedSetsCount = useMemo(() => {
    let count = 0;
    exercises.forEach((ex) => {
      count += ex.sets.filter((s) => s.completed).length;
    });
    return count;
  }, [exercises]);

  const totalSetsCount = useMemo(() => {
    return exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }, [exercises]);

  // Handlers para Séries
  const handleUpdateSet = (exerciseId: string, updatedSet: AdvancedSetRowData) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === updatedSet.id ? updatedSet : s)),
        };
      })
    );
  };

  const handleDeleteSplit = (splitId: string) => {
    if (splits.length <= 1) {
      alert('Você deve manter pelo menos uma rotina cadastrada.');
      return;
    }
    const toDelete = splits.find((s) => s.id === splitId);
    if (!window.confirm(`Tem certeza que deseja excluir a rotina "${toDelete?.name}"?`)) {
      return;
    }
    const remaining = splits.filter((s) => s.id !== splitId);
    setSplits(remaining);
    if (activeSplitId === splitId) {
      setActiveSplitId(remaining[0].id);
    }
  };

  // Contabilidade semanal de Working Sets alocadas por grupo muscular (Diretas 1.0x + Residuais 0.5x)
  const weeklyAllocatedSetsPerMuscle = useMemo(() => {
    const map: Record<string, MuscleVolumeBreakdown> = {};

    // Inicializa todos os grupamentos cadastrados
    muscleGroupsList.forEach((m) => {
      map[m.name] = { direct: 0, residual: 0, total: 0 };
    });

    const tallyExerciseSets = (
      primaryMuscle: string,
      secondaryMuscles: string[] | undefined,
      workingCount: number
    ) => {
      if (!workingCount || workingCount <= 0) return;

      // 1. Músculo Primário (1.0x por série de trabalho)
      if (!map[primaryMuscle]) {
        map[primaryMuscle] = { direct: 0, residual: 0, total: 0 };
      }
      map[primaryMuscle].direct += workingCount;
      map[primaryMuscle].total += workingCount * 1.0;

      // 2. Músculos Secundários / Sinergistas (0.5x série residual)
      if (secondaryMuscles && Array.isArray(secondaryMuscles)) {
        secondaryMuscles.forEach((sec) => {
          if (!map[sec]) {
            map[sec] = { direct: 0, residual: 0, total: 0 };
          }
          map[sec].residual += workingCount;
          map[sec].total += workingCount * 0.5;
        });
      }
    };

    (weeklySchedule || []).forEach((day, dayIdx) => {
      if (!day) return;
      // Se o dia for o atualmente aberto na edição no modo MONTAR, usa os exercícios em memória
      if (dayIdx === selectedCoachDayIndex && workoutMode === 'MONTAR') {
        (exercises || []).forEach((ex) => {
          if (!ex) return;
          const exSets = Array.isArray(ex.sets) ? ex.sets : [];
          const workingCount = exSets.filter((s) => s?.baseType === 'WORKING' || s?.baseType === 'BACKOFF').length;
          tallyExerciseSets(ex.muscle || 'Peito', ex.secondaryMuscles, workingCount);
        });
        return;
      }

      // Caso contrário, busca na rotina ativa cadastrada
      let matchWorkout: WorkoutTemplateItem | undefined;
      for (const split of (splits || [])) {
        if (!split || !Array.isArray(split.workouts)) continue;
        const found = split.workouts.find((w) => (day.workoutId && w?.id === day.workoutId) || (w?.title && day.workoutTitle && w.title.toLowerCase() === day.workoutTitle.toLowerCase()));
        if (found) {
          matchWorkout = found;
          break;
        }
      }

      if (matchWorkout && Array.isArray(matchWorkout.exercises)) {
        matchWorkout.exercises.forEach((item) => {
          if (!item) return;
          const lib = EXERCISE_LIBRARY.find((e) => e.id === item.exerciseId);
          const muscle = lib?.muscle || 'Peito';
          const secondaries = item.secondaryMuscles || lib?.secondaryMuscles || [];
          const itemSets = Array.isArray(item.sets) ? item.sets : [];
          const workingCount = itemSets.filter((s) => s?.baseType === 'WORKING' || s?.baseType === 'BACKOFF').length;
          tallyExerciseSets(muscle, secondaries, workingCount);
        });
      }
    });

    return map;
  }, [weeklySchedule, selectedCoachDayIndex, exercises, splits, workoutMode, muscleGroupsList]);

  // Motor de Inteligência de Volume & Recuperação baseado em Dados dos Questionários
  const volumeRecommendationData = useMemo(() => {
    const lastFatigue = fatigueLogs[fatigueLogs.length - 1];
    const avgSleep = lastFatigue?.sleep ?? (recoverySleep === 'REPARADOR' ? 5 : recoverySleep === 'REGULAR' ? 3 : 1);
    const avgDoms = lastFatigue?.doms ?? (recoveryJointPain === 'SIM' ? 5 : recoveryJointPain === 'LEVE' ? 3 : 1);
    const hasArticularPain = recoveryJointPain === 'SIM';
    const isProgressionDown = recoveryProgression === 'PROGRESSION_DOWN';
    const isProgressionUp = recoveryProgression === 'PROGRESSION_UP';

    const muscleTips: Record<string, {
      status: 'OTIMO' | 'ESTAVEL' | 'ALERTA_DELOAD';
      action: 'AUMENTAR' | 'MANTER' | 'DIMINUIR';
      badgeText: string;
      reason: string;
      suggestedDelta: number;
    }> = {};

    muscleGroupsList.forEach((m) => {
      const breakdown = weeklyAllocatedSetsPerMuscle[m.name] || { direct: 0, residual: 0, total: 0 };
      const allocated = breakdown.total;
      const ceiling = m.ceiling;

      if (hasArticularPain || isProgressionDown || avgDoms >= 4 || avgSleep <= 2) {
        muscleTips[m.name] = {
          status: 'ALERTA_DELOAD',
          action: 'DIMINUIR',
          badgeText: '📉 Reduzir 2 Séries (Deload)',
          reason: isProgressionDown 
            ? 'Queda de repetições detectada + fadiga acumulada. Reduza o volume para permitir supercompensação tecidual.'
            : 'Sinais de dor articular ou sono insuficiente (<6h). Baixe o teto para evitar overreaching não-funcional.',
          suggestedDelta: -2,
        };
      } else if (isProgressionUp && avgSleep >= 4 && avgDoms <= 3 && !hasArticularPain && allocated < ceiling) {
        muscleTips[m.name] = {
          status: 'OTIMO',
          action: 'AUMENTAR',
          badgeText: '🚀 Seguro Progredir +1 Série',
          reason: 'Cargas/repetições superadas e sono reparador (>7h). O atleta possui alta prontidão adaptativa no MAV.',
          suggestedDelta: +1,
        };
      } else {
        muscleTips[m.name] = {
          status: 'ESTAVEL',
          action: 'MANTER',
          badgeText: '⚖️ Manter Volume Atual',
          reason: 'Balanço ótimo de fadiga vs estímulo. Mantenha o teto e priorize sobrecarga progressiva em reps.',
          suggestedDelta: 0,
        };
      }
    });

    return {
      muscleTips,
      avgSleep,
      avgDoms,
      isProgressionUp,
      isProgressionDown,
      hasArticularPain,
    };
  }, [fatigueLogs, recoverySleep, recoveryJointPain, recoveryProgression, weeklyAllocatedSetsPerMuscle, muscleGroupsList]);

  // Adição de Working Set com Controle Estrito de Teto Máximo e Volume Residual
  const handleAddWorkingSet = (exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return;

    const breakdown = weeklyAllocatedSetsPerMuscle[ex.muscle] || { direct: 0, residual: 0, total: 0 };
    const currentAllocated = breakdown.total;
    const ceiling = muscleCeilings[ex.muscle] ?? 14;

    if (currentAllocated + 1 > ceiling) {
      showScheduleToast(
        `⛔ Teto de ${ex.muscle} atingido (${currentAllocated}/${ceiling} séries efetivas! Diretas: ${breakdown.direct} | Residuais: ${breakdown.residual} x0.5). Aumente o limite na aba "Limites de Volume".`
      );
      return;
    }

    setExercises((prev) =>
      prev.map((item) => {
        if (item.id !== exerciseId) return item;
        const last = item.sets[item.sets.length - 1];
        const newSet: AdvancedSetRowData = {
          id: crypto.randomUUID(),
          setNumber: item.sets.length + 1,
          baseType: 'WORKING',
          technique: 'NONE',
          targetWeight: item.targetWeightKg ?? last?.weight ?? 40,
          targetReps: item.targetReps ?? last?.reps ?? 10,
          weight: last?.weight ?? item.targetWeightKg ?? 40,
          reps: last?.reps ?? item.targetReps ?? 10,
          rir: 2,
          previousWeight: last?.weight ?? 40,
          previousReps: last?.reps ?? 10,
          completed: false,
          restSeconds: item.targetRestSeconds || restWorkingSeconds,
        };
        return {
          ...item,
          sets: [...item.sets, newSet],
        };
      })
    );
  };

  const handleAddPreparatorySet = (exerciseId: string, type: 'WARMUP' | 'FEEDER' | 'PAP') => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const baseWeight = ex.targetWeightKg ?? ex.sets[0]?.weight ?? 40;
        let setWeight = Math.round(baseWeight * 0.5 * 2) / 2;
        let setReps = 12;
        let setRir = 4;
        if (type === 'FEEDER') {
          setWeight = Math.round(baseWeight * 0.8 * 2) / 2;
          setReps = 3;
          setRir = 4;
        } else if (type === 'PAP') {
          // PAP: ~90-95% da carga, 1 a 2 reps quase máximas para recrutar unidades motoras sem gerar fadiga
          setWeight = Math.round(baseWeight * 0.95 * 2) / 2;
          setReps = 1;
          setRir = 3;
        }
        const newSet: AdvancedSetRowData = {
          id: crypto.randomUUID(),
          setNumber: 0,
          baseType: type,
          technique: 'NONE',
          weight: setWeight,
          reps: setReps,
          rir: setRir,
          completed: false,
        };
        return {
          ...ex,
          sets: [newSet, ...ex.sets],
        };
      })
    );
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const filtered = ex.sets.filter((s) => s.id !== setId);
        return {
          ...ex,
          sets: filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 })),
        };
      })
    );
  };

  // Reordenação de Exercício
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    setExercises((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSetExerciseIndex = (currentIndex: number, newIndex: number) => {
    if (newIndex < 0 || newIndex >= exercises.length || newIndex === currentIndex) return;
    setExercises((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(currentIndex, 1);
      copy.splice(newIndex, 0, item);
      return copy;
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  };

  // Atualizar Meta do Exercício (Carga e Repetições)
  const handleUpdateExerciseTarget = (exerciseId: string, targetWeightKg: number, targetReps: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          targetWeightKg,
          targetReps,
        };
      })
    );
  };

  // Carregar Treino Selecionado com suporte a Músculos Primários e Sinergistas Residuais
  const handleLoadWorkout = (workout: WorkoutTemplateItem) => {
    setSessionTitle(workout.title);
    setSessionCategory(workout.category);
    const loaded = workout.exercises.map((item) => {
      const lib = EXERCISE_LIBRARY.find((e) => e.id === item.exerciseId) ?? {
        id: item.exerciseId,
        name: 'Exercício Personalizado',
        muscle: 'Peito' as MuscleGroup,
        secondaryMuscles: [] as MuscleGroup[],
        category: workout.category,
        equipment: 'Livre',
        targetWeightKg: item.targetWeightKg ?? 40,
        targetReps: item.targetReps ?? 10,
        description: '',
      };
      return {
        ...lib,
        secondaryMuscles: item.secondaryMuscles || lib.secondaryMuscles || [],
        targetWeightKg: item.targetWeightKg ?? lib.targetWeightKg,
        targetReps: item.targetReps ?? lib.targetReps,
        sets: item.sets.map((s) => ({ ...s, completed: false })),
      };
    });
    setExercises(loaded);
  };

  // Alterar associação da semana com busca em todos os splits e sincronização imediata
  const handleUpdateScheduleDay = (dayIndex: number, workoutTitle: string, workoutId?: string) => {
    let matchedWorkout: WorkoutTemplateItem | undefined;
    for (const s of splits) {
      const found = s.workouts.find((w) => (workoutId && w.id === workoutId) || w.title === workoutTitle);
      if (found) {
        matchedWorkout = found;
        break;
      }
    }

    setWeeklySchedule((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        workoutTitle,
        workoutId: matchedWorkout?.id || workoutId,
      };
      return updated;
    });

    const dayName = DAYS_OF_WEEK[dayIndex]?.full ?? `Dia ${dayIndex + 1}`;
    showScheduleToast(`✓ ${dayName} definido para: ${workoutTitle}`);

    // Se o dia alterado for o dia de HOJE ou o dia atualmente carregado na tela, carrega na sessão
    const isToday = DAYS_OF_WEEK[dayIndex]?.dayIndex === todayDayIndex;
    const isCurrentSession = sessionTitle === weeklySchedule[dayIndex]?.workoutTitle;
    if (isToday || isCurrentSession) {
      if (matchedWorkout) {
        handleLoadWorkout(matchedWorkout);
      } else {
        setSessionTitle(workoutTitle);
      }
    }
  };

  // Preencher toda a semana com base na rotina ativa (distribuição inteligente)
  const handleApplySplitToWeek = () => {
    if (!activeSplit.workouts.length) return;
    const wList = activeSplit.workouts;
    const newSchedule: WeeklyScheduleDay[] = DAYS_OF_WEEK.map((d, idx) => {
      if (wList.length === 3) {
        // PPL ou ABC de 3 treinos: Seg=W0, Ter=W1, Qua=W2, Qui=Descanso, Sex=W0, Sáb=W1, Dom=Descanso
        const map3 = [wList[0], wList[1], wList[2], null, wList[0], wList[1], null];
        const item = map3[idx];
        return {
          dayOfWeek: d.full,
          shortDay: d.short,
          workoutTitle: item ? item.title : 'Descanso / Recuperação',
          workoutId: item?.id,
        };
      } else if (wList.length === 4) {
        // 4 treinos: Seg=W0, Ter=W1, Qua=Descanso, Qui=W2, Sex=W3, Sáb=Descanso, Dom=Descanso
        const map4 = [wList[0], wList[1], null, wList[2], wList[3], null, null];
        const item = map4[idx];
        return {
          dayOfWeek: d.full,
          shortDay: d.short,
          workoutTitle: item ? item.title : 'Descanso / Recuperação',
          workoutId: item?.id,
        };
      } else {
        const item = wList[idx % wList.length];
        return {
          dayOfWeek: d.full,
          shortDay: d.short,
          workoutTitle: item ? item.title : 'Descanso / Recuperação',
          workoutId: item?.id,
        };
      }
    });

    setWeeklySchedule(newSchedule);
    showScheduleToast(`✓ Rotina "${activeSplit.name}" distribuída com sucesso nos 7 dias!`);
  };

  // Carregar treino a partir do dia da semana clicado (pesquisa em todas as rotinas)
  const handleSelectDay = (day: WeeklyScheduleDay) => {
    if (day.workoutTitle === sessionTitle) {
      showScheduleToast(`Sessão "${sessionTitle}" já está ativa!`);
      return;
    }

    let match: WorkoutTemplateItem | undefined;
    for (const s of splits) {
      const found = s.workouts.find((w) => (day.workoutId && w.id === day.workoutId) || w.title === day.workoutTitle);
      if (found) {
        match = found;
        break;
      }
    }

    if (match) {
      handleLoadWorkout(match);
      showScheduleToast(`Treino "${match.title}" carregado para a sessão!`);
    } else {
      setSessionTitle(day.workoutTitle);
      showScheduleToast(`Dia "${day.dayOfWeek}" selecionado (${day.workoutTitle})`);
    }
  };

  // CRUD DE TREINOS DO COACH STUDIO
  const handleCreateNewWorkoutForDay = (title: string, category: BiomechanicalCategory) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      alert('Informe o título do treino.');
      return;
    }

    const newWorkout: WorkoutTemplateItem = {
      id: `wkt-${crypto.randomUUID()}`,
      title: cleanTitle,
      category,
      description: `Treino personalizado criado em ${weeklySchedule[selectedCoachDayIndex]?.shortDay}`,
      exercises: [],
    };

    setSplits((prev) =>
      prev.map((s) => (s.id === activeSplit.id ? { ...s, workouts: [...s.workouts, newWorkout] } : s))
    );

    handleLoadWorkout(newWorkout);
    handleUpdateScheduleDay(selectedCoachDayIndex, cleanTitle, newWorkout.id);
    setIsNewWorkoutModalOpen(false);
    setNewWorkoutTitleInput('');
    showScheduleToast(`⚡ Novo treino "${cleanTitle}" criado e atribuído ao dia!`);
  };

  const handleDuplicateCurrentWorkout = () => {
    const duplicatedTitle = `${sessionTitle} (Cópia)`;
    const newWorkout: WorkoutTemplateItem = {
      id: `wkt-${crypto.randomUUID()}`,
      title: duplicatedTitle,
      category: sessionCategory,
      description: `Cópia do treino ${sessionTitle}`,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.id,
        targetWeightKg: ex.targetWeightKg,
        targetReps: ex.targetReps,
        targetRestSeconds: ex.targetRestSeconds,
        secondaryMuscles: ex.secondaryMuscles,
        sets: ex.sets.map((s) => ({ ...s, id: crypto.randomUUID(), completed: false })),
      })),
    };

    setSplits((prev) =>
      prev.map((s) => (s.id === activeSplit.id ? { ...s, workouts: [...s.workouts, newWorkout] } : s))
    );

    handleLoadWorkout(newWorkout);
    handleUpdateScheduleDay(selectedCoachDayIndex, duplicatedTitle, newWorkout.id);
    showScheduleToast(`📋 Treino duplicado como "${duplicatedTitle}"!`);
  };

  const handleDeleteCurrentWorkout = () => {
    if (activeSplit.workouts.length <= 1) {
      alert('Você deve manter pelo menos um treino na rotina.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o treino "${sessionTitle}" da rotina?`)) {
      return;
    }

    const remainingWorkouts = activeSplit.workouts.filter((w) => w.title !== sessionTitle);
    setSplits((prev) =>
      prev.map((s) => (s.id === activeSplit.id ? { ...s, workouts: remainingWorkouts } : s))
    );

    // Redefine o dia atual para Descanso
    handleUpdateScheduleDay(selectedCoachDayIndex, 'Descanso / Recuperação');
    setExercises([]);
    setSessionTitle('Descanso / Recuperação');
    showScheduleToast(`🗑️ Treino removido da rotina!`);
  };

  // Adicionar da Biblioteca com Carga Meta e Sinergistas Residuais
  const handleAddFromLibrary = (libEx: (typeof EXERCISE_LIBRARY)[0]) => {
    const newEx: ExerciseItem = {
      ...libEx,
      id: crypto.randomUUID(),
      secondaryMuscles: libEx.secondaryMuscles || [],
      targetWeightKg: customTargetWeight || libEx.targetWeightKg || 40,
      targetReps: customTargetReps || libEx.targetReps || 10,
      sets: [
        {
          id: crypto.randomUUID(),
          setNumber: 1,
          baseType: 'WARMUP',
          technique: 'NONE',
          weight: Math.round(((customTargetWeight || libEx.targetWeightKg || 40) * 0.5) * 2) / 2,
          reps: 12,
          rir: 4,
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          setNumber: 2,
          baseType: 'WORKING',
          technique: 'NONE',
          targetWeight: customTargetWeight || libEx.targetWeightKg || 40,
          targetReps: customTargetReps || libEx.targetReps || 10,
          weight: customTargetWeight || libEx.targetWeightKg || 40,
          reps: customTargetReps || libEx.targetReps || 10,
          rir: 2,
          completed: false,
        },
      ],
    };
    setExercises((prev) => [...prev, newEx]);
    setIsAddExerciseModalOpen(false);
    showScheduleToast(`✓ "${libEx.name}" incluído no treino!`);
  };

  // Adicionar Personalizado Livre com Músculo Primário e Sinergistas Residuais
  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    const cleanName = customExerciseName.trim();
    const newEx: ExerciseItem = {
      id: crypto.randomUUID(),
      name: cleanName,
      muscle: customExerciseMuscle,
      secondaryMuscles: customExerciseSecondaryMuscles,
      category: sessionCategory,
      equipment: 'Livre',
      targetWeightKg: customTargetWeight,
      targetReps: customTargetReps,
      sets: [
        {
          id: crypto.randomUUID(),
          setNumber: 1,
          baseType: 'WORKING',
          technique: 'NONE',
          targetWeight: customTargetWeight,
          targetReps: customTargetReps,
          weight: customTargetWeight,
          reps: customTargetReps,
          rir: 2,
          completed: false,
        },
      ],
    };
    setExercises((prev) => [...prev, newEx]);
    setCustomExerciseName('');
    setCustomExerciseSecondaryMuscles([]);
    setIsAddExerciseModalOpen(false);
    showScheduleToast(`✓ Exercício "${cleanName}" criado com sucesso!`);
  };

  // Salvar Treino na Rotina com Músculos Primários e Sinergistas
  const handleSaveCurrentWorkoutToSplit = () => {
    const updatedWorkout: WorkoutTemplateItem = {
      id: crypto.randomUUID(),
      title: sessionTitle,
      category: sessionCategory,
      description: `${exercises.length} exercícios com sobrecarga progressiva e metas`,
      exercises: exercises.map((e) => ({
        exerciseId: e.id,
        targetWeightKg: e.targetWeightKg,
        targetReps: e.targetReps,
        secondaryMuscles: e.secondaryMuscles,
        sets: e.sets,
      })),
    };

    setSplits((prev) =>
      prev.map((s) => {
        if (s.id !== activeSplit.id) return s;
        const existingIdx = s.workouts.findIndex((w) => w.title === sessionTitle);
        const newWorkouts = [...s.workouts];
        if (existingIdx >= 0) newWorkouts[existingIdx] = updatedWorkout;
        else newWorkouts.push(updatedWorkout);
        return { ...s, workouts: newWorkouts };
      })
    );
    reward(30);
    showScheduleToast(`💾 Treino "${sessionTitle}" salvo com sucesso na rotina!`);
  };

  // Finalizar e salvar sessão completa com questionário de recuperação (Parte 3)
  const handleFinishWorkout = async () => {
    const pseScoreMap = { LEVE: 3, MODERADO: 6, FALHA: 9 };
    const sleepScoreMap = { RUIM: 1, REGULAR: 3, REPARADOR: 5 };
    const jointScoreMap = { SIM: 4, NAO: 1 };

    // 1. Salvar treino no banco
    const success = await save({
      table: 'workouts',
      record: {
        id: crypto.randomUUID(),
        day: today,
        details: {
          name: sessionTitle,
          category: sessionCategory,
          muscleGroups: programMuscleGroups,
          completed: true,
          pse: pseScoreMap[recoveryPse],
          recoveryPse,
          recoverySleep,
          recoveryJointPain,
          recoveryProgression,
          recoveryPump,
          duration,
          tonnageKg: totalSessionTonnage,
          totalSets: completedSetsCount,
          exercisesCount: exercises.length,
          exercises: exercises.map((e) => ({
            name: e.name,
            muscle: e.muscle,
            targetWeightKg: e.targetWeightKg,
            setsCount: e.sets.filter((s) => s.completed).length,
          })),
        },
      },
    });

    // 2. Salvar log de recuperação/fadiga para o algoritmo de MRV
    const jointScore = recoveryJointPain === 'SIM' ? 5 : recoveryJointPain === 'LEVE' ? 3 : 1;
    await save({
      table: 'fatigue_logs',
      record: {
        id: crypto.randomUUID(),
        day: today,
        details: {
          sleep: sleepScoreMap[recoverySleep],
          doms: jointScore,
          fatigue: pseScoreMap[recoveryPse],
          progression: recoveryProgression,
          pump: recoveryPump,
          note: `Sessão: ${sessionTitle} | Sono: ${recoverySleep} | Articulações: ${recoveryJointPain} | Desempenho: ${recoveryProgression}`,
        },
      },
    });

    if (success) {
      // Nenhum XP é concedido aqui, conforme regra (concedido apenas nas Working Sets de sobrecarga)
      setIsFinishingWorkout(false);
      showScheduleToast('🚀 Sessão finalizada com sucesso! Dados computados para o cálculo de MRV.');
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // Gera dados históricos de demonstração para o gráfico de sobrecarga progressiva
  const getProgressionDataForExercise = (exerciseName: string, currentWeight: number, targetWeight: number): ExerciseProgressionPoint[] => {
    const base = currentWeight || targetWeight || 40;
    return [
      { date: 'Treino #1', sessionName: 'Treino #1', weightKg: Math.round(base * 0.88), targetWeightKg: targetWeight, reps: 10, tonnageKg: Math.round(base * 0.88 * 30) },
      { date: 'Treino #2', sessionName: 'Treino #2', weightKg: Math.round(base * 0.92), targetWeightKg: targetWeight, reps: 10, tonnageKg: Math.round(base * 0.92 * 30) },
      { date: 'Treino #3', sessionName: 'Treino #3', weightKg: Math.round(base * 0.96), targetWeightKg: targetWeight, reps: 9, tonnageKg: Math.round(base * 0.96 * 27) },
      { date: 'Treino #4', sessionName: 'Treino #4', weightKg: Math.round(base * 1.0), targetWeightKg: targetWeight, reps: 10, tonnageKg: Math.round(base * 1.0 * 30) },
      { date: 'Hoje', sessionName: 'Sessão Atual', weightKg: base, targetWeightKg: targetWeight, reps: 10, tonnageKg: Math.round(base * 30) },
    ];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. BARRA SUPERIOR DE CONTROLE E MODO: FAZER TREINO VS MONTAR TREINO (ADMIN) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card/70 border border-border/70 rounded-2xl p-3 sm:p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-background/90 p-1 rounded-xl border border-border/80 shadow-inner">
            <button
              type="button"
              onClick={() => setWorkoutMode('FAZER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                workoutMode === 'FAZER'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Dumbbell size={13} /> Fazer Treino
            </button>
            <button
              type="button"
              onClick={handleRequestAdminMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                workoutMode === 'MONTAR'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAdminUnlocked ? <SlidersHorizontal size={13} /> : <Lock size={13} className="text-amber-400" />}
              <span>Montar Treino</span>
              {!isAdminUnlocked && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-mono">ADM</span>}
            </button>
          </div>

          {isAdminUnlocked && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-xl">
              <ShieldCheck size={13} />
              <span>Admin</span>
              <button
                type="button"
                onClick={handleLockAdmin}
                title="Bloquear painel de administrador"
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNightCheckinOpen(true)}
            className="text-xs h-8 px-2.5 border-border/80 rounded-xl flex-1 sm:flex-initial"
          >
            <Moon size={13} className="text-primary mr-1" /> Noturno
          </Button>

          <Button
            size="sm"
            onClick={() => setIsFinishingWorkout(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs h-8 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
          >
            <CheckCircle2 size={14} /> 🏁 Concluir ({completedSetsCount}/{totalSetsCount})
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* =================== MODO 1: FAZER TREINO (ESTILO HEVY) =================== */}
      {/* ========================================================================= */}
      {workoutMode === 'FAZER' && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          {/* BARRA HORIZONTAL COMPACTA DOS 7 DIAS DA SEMANA (ESTILO HEVY) */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-1.5 sm:p-2.5 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weeklySchedule.map((day, idx) => {
                const isToday = DAYS_OF_WEEK[idx].dayIndex === todayDayIndex;
                const isLoaded = sessionTitle === day.workoutTitle;
                const isRest = day.workoutTitle.toLowerCase().includes('descanso');

                return (
                  <button
                    key={day.dayOfWeek}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`rounded-xl p-1 sm:p-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-w-0 overflow-hidden ${
                      isToday
                        ? 'border border-primary bg-primary/20 ring-1 ring-primary'
                        : isLoaded
                        ? 'border border-primary/50 bg-card shadow-xs'
                        : isRest
                        ? 'bg-background/30 text-muted-foreground hover:bg-background/60'
                        : 'bg-background/50 text-foreground hover:border-border hover:bg-background/90'
                    }`}
                  >
                    <div className="flex items-center gap-0.5">
                      <span className="font-mono text-[8px] xs:text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground">
                        {day.shortDay}
                      </span>
                      {isToday && (
                        <span className="size-1 sm:size-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <span 
                      className={`text-[8px] xs:text-[9px] sm:text-[11px] font-extrabold truncate w-full mt-0.5 block ${
                        isLoaded ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      title={day.workoutTitle}
                    >
                      {isRest ? 'Off' : day.workoutTitle.split('—')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mockup Visual da Tela do Treino (Dark Minimalist) */}
          {/* Visual da Tela do Treino (Modern Minimalist & Rounded) */}
          {/* ⚡ CABEÇALHO DO PROGRAMA & BARRA DE MRV */}
          <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-primary text-base sm:text-lg font-black">⚡</span>
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  {sessionTitle.split('—')[0].trim()} {programMuscleGroups ? `• ${programMuscleGroups}` : ''}
                </h2>
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/60">
                {completedSetsCount}/{totalSetsCount} séries
              </span>
            </div>

            <div className="pt-2.5 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  Recovery / MRV Semanal ({primaryMuscle})
                </span>
                <span className="text-[10px] bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-black uppercase">
                  {primaryMuscleAssessment.statusLabel || 'Zona Ideal'}
                </span>
              </div>

              {/* Barra de Progresso Arredondada com Glow e Efeito Minimalista */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>{primaryMuscleAssessment.effectiveWorkingSets} de {primaryMuscleAssessment.landmarks.mrv} Working Sets</span>
                  <span className="text-primary font-bold">{Math.min(100, Math.round((primaryMuscleAssessment.effectiveWorkingSets / (primaryMuscleAssessment.landmarks.mrv || 16)) * 100))}%</span>
                </div>
                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300 rounded-full shadow-xs shadow-primary/30"
                    style={{
                      width: `${Math.min(100, Math.round((primaryMuscleAssessment.effectiveWorkingSets / (primaryMuscleAssessment.landmarks.mrv || 16)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE EXERCÍCIOS ESTILO MODERN MINIMALIST */}
          <div className="space-y-4">
            {exercises.map((ex, exIndex) => {
              const allSetsDone = ex.sets.length > 0 && ex.sets.every((s) => s.completed);
              const completedCount = ex.sets.filter((s) => s.completed).length;
              const embedUrl = getYouTubeEmbedUrl(ex.video_url);

              return (
                <div 
                  key={ex.id}
                  className={`rounded-2xl border transition-all p-4 sm:p-5 space-y-3.5 backdrop-blur-md ${
                    allSetsDone 
                      ? 'border-emerald-500/40 bg-card/80 shadow-md shadow-emerald-500/5' 
                      : 'border-border/70 bg-card/60 shadow-xs'
                  }`}
                >
                  {/* Linha Superior do Exercício */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5 sm:pb-3">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-foreground tracking-tight break-words">
                        {exIndex + 1}. {ex.name}
                      </span>
                      {allSetsDone && (
                        <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-0.5 shrink-0">
                          <Check size={10} strokeWidth={3} /> Feito
                        </span>
                      )}
                    </div>

                    {/* Ações Minimalistas: Play de Vídeo Redondinho, Dicas e Progresso */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botão Play do Vídeo Retrátil */}
                      <button
                        type="button"
                        onClick={() => setExpandedVideoId(expandedVideoId === ex.id ? null : ex.id)}
                        className={`size-7 sm:size-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          expandedVideoId === ex.id
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                            : 'bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 hover:scale-105'
                        }`}
                        title="Ver vídeo de execução (YouTube)"
                      >
                        <Play size={12} className={expandedVideoId === ex.id ? 'fill-current' : 'fill-primary'} />
                      </button>

                      {/* Dicas */}
                      <button
                        type="button"
                        onClick={() => setExpandedTipsId(expandedTipsId === ex.id ? null : ex.id)}
                        className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer ${
                          expandedTipsId === ex.id
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        title="Dicas de execução biomecânica"
                      >
                        <Info size={11} className="inline mr-0.5 sm:mr-1" />
                        <span>Dicas</span>
                      </button>

                      {/* Gráfico Progresso */}
                      <button
                        type="button"
                        onClick={() => setSelectedExerciseForChart(selectedExerciseForChart === ex.name ? null : ex.name)}
                        className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedExerciseForChart === ex.name
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        title="Histórico de Sobrecarga"
                      >
                        <TrendingUp size={11} className="inline mr-0.5 sm:mr-1" />
                        <span className="hidden xs:inline">Evolução</span>
                        <span className="xs:hidden">PR</span>
                      </button>
                    </div>
                  </div>

                  {/* Vídeo do YouTube Embutido Elegante */}
                  {expandedVideoId === ex.id && (
                    <div className="rounded-xl overflow-hidden border border-border/80 bg-background/90 p-2 space-y-2 animate-in fade-in duration-200">
                      {embedUrl ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
                          <iframe
                            src={`${embedUrl}?autoplay=1&mute=1`}
                            title={`Execução ${ex.name}`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="p-3 text-xs text-muted-foreground flex items-center justify-between">
                          <span>Link de demonstração do exercício:</span>
                          <a
                            href={ex.video_url || 'https://youtu.be/rT7DgCr-3pg'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                          >
                            <span>Abrir no YouTube</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dicas de Execução */}
                  {expandedTipsId === ex.id && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed animate-in fade-in duration-150">
                      <span className="font-bold text-foreground block mb-0.5 flex items-center gap-1">
                        <Sparkles size={12} className="text-primary" /> Orientação Biomecânica
                      </span>
                      {ex.description || 'Controle a fase excêntrica de 2 a 3 segundos, amplitude segura e estabilidade articular.'}
                    </div>
                  )}

                  {/* Gráfico de Sobrecarga Histórica */}
                  {selectedExerciseForChart === ex.name && (
                    <WorkoutProgressionChart
                      exerciseName={ex.name}
                      dataPoints={getProgressionDataForExercise(
                        ex.name,
                        ex.sets[0]?.weight ?? ex.targetWeightKg ?? 40,
                        ex.targetWeightKg ?? 40
                      )}
                    />
                  )}

                  {/* SÉRIES EMPILHADAS COM SEPARADOR SUTIL */}
                  <div className="divide-y divide-border/30">
                    {ex.sets.map((set, sIdx) => {
                      const isPrep = set.baseType === 'WARMUP' || set.baseType === 'FEEDER' || set.baseType === 'PAP';
                      const workingIdx = isPrep ? undefined : ex.sets.slice(0, sIdx + 1).filter((s) => s.baseType === 'WORKING' || s.baseType === 'BACKOFF').length;

                      return (
                        <div key={set.id} className="pt-1.5 pb-1.5 first:pt-0 last:pb-0">
                          <HevySetRow
                            data={set}
                            workingIndex={workingIdx}
                            exerciseName={ex.name}
                            targetWeight={ex.targetWeightKg}
                            targetReps={ex.targetReps}
                            targetRepsText={set.targetRepsText}
                            restSeconds={set.restSeconds ?? (isPrep ? restWarmupSeconds : restWorkingSeconds)}
                            intraRestSeconds={set.intraRestSeconds}
                            onUpdate={(updated) => handleUpdateSet(ex.id, updated)}
                            onDelete={() => handleDeleteSet(ex.id, set.id)}
                            onTriggerRestTimer={(sec, src) => triggerFloatingTimer(sec, src || `${ex.name} • Série #${sIdx + 1}`)}
                            onTriggerXP={(pts) => reward(pts)}
                            onCelebratePR={(info) => handleTriggerPRCelebration(ex.name, info)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Rodapé do Exercício: Prescrição do Treinador (Aluno não adiciona séries) */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                      <Flame size={12} className="text-primary" />
                      Prescrição Coach Studio
                    </span>
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">
                      {completedCount} de {ex.sets.length} séries concluídas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ⏱️ CRONÔMETRO DE DESCANSO DOCKED (ARREDONDADO & COM BLUR) */}
          {restTime > 0 && (
            <div className="rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-md p-3.5 flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <Clock size={18} className={`text-primary ${timerActive ? 'animate-spin' : ''}`} />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block truncate max-w-[200px]">
                    {lastRestTriggerSource || 'Descanso Ativo'}
                  </span>
                  <span className="font-mono text-base font-black text-primary tracking-wider">
                    {formatTimer(restTime)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRestTime((prev) => Math.max(0, prev - 10))}
                  className="rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-foreground px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Reduzir 10 segundos"
                >
                  -10s
                </button>
                <button
                  type="button"
                  onClick={() => setTimerActive(!timerActive)}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-3.5 py-1.5 text-xs font-black transition-all active:scale-95 shadow-sm shadow-primary/25 cursor-pointer"
                >
                  {timerActive ? 'Pausar' : 'Retomar'}
                </button>
                <button
                  type="button"
                  onClick={() => setRestTime((prev) => prev + 10)}
                  className="rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-foreground px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  title="Adicionar 10 segundos"
                >
                  +10s
                </button>
                <button
                  type="button"
                  onClick={() => { setRestTime(0); setTimerActive(false); }}
                  className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="Fechar cronômetro"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* BOTÃO GRANDE DE CONCLUSÃO DO TREINO (ARREDONDADO COM GRADIENTE E GLOW) */}
          <button
            type="button"
            onClick={() => setIsFinishingWorkout(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-sm sm:text-base py-4 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 uppercase tracking-wide transition-all active:scale-[0.99] cursor-pointer"
          >
            <CheckCircle2 size={20} strokeWidth={2.5} />
            <span>Concluir Treino</span>
          </button>

          {/* VOLUME CIENTÍFICO (MEV / MAV / MRV) ESCONDIDO EM ACORDEÃO PARA NÃO POLUIR */}
          <div className="rounded-2xl border border-border/80 bg-card/50 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsVolumeTrackerExpanded(!isVolumeTrackerExpanded)}
              className="w-full flex items-center justify-between p-4 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <BarChart3 size={15} className="text-primary" />
                Balanço Científico de Volume (MEV / MAV / MRV)
              </span>
              <span className="text-[10px] text-primary">
                {isVolumeTrackerExpanded ? 'Recolher ▲' : 'Ver Detalhes ▼'}
              </span>
            </button>

            {isVolumeTrackerExpanded && (
              <div className="p-4 pt-0 border-t border-border/40 space-y-3 animate-in fade-in duration-150">
                <p className="text-xs text-muted-foreground">
                  Monitoramento de estímulo hipertrófico conforme Dr. Mike Israetel & Brad Schoenfeld.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeMusclesInSession.map((assessment) => {
                    const { muscle, effectiveWorkingSets, landmarks, status, statusLabel } = assessment;
                    const progressPct = Math.min(100, Math.round((effectiveWorkingSets / landmarks.mrv) * 100));

                    return (
                      <div key={muscle} className="rounded-xl border border-border/80 bg-background/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">{muscle}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                            status === 'JUNK_VOLUME'
                              ? 'bg-destructive/20 text-destructive'
                              : status === 'MRV_NEAR'
                              ? 'bg-amber-500/20 text-amber-500'
                              : status === 'MAV'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                            <span>Efetivo: <strong className="text-foreground">{effectiveWorkingSets}</strong> séries</span>
                            <span>MRV: {landmarks.mrv}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                status === 'JUNK_VOLUME' ? 'bg-destructive' : status === 'MRV_NEAR' ? 'bg-amber-500' : 'bg-primary'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ============ MODO 2: MONTAR TREINO (PAINEL DO ADMINISTRADOR) ============= */}
      {/* ========================================================================= */}
      {workoutMode === 'MONTAR' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Banner Exclusivo do Treinador / ADM */}
          <div className="rounded-2xl border-2 border-primary/60 bg-gradient-to-r from-primary/15 via-card to-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-md shrink-0">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  Área do Treinador / Prescrição Científica
                </span>
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  Coach Studio — Limites & Montagem Diária
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ambiente dividido em: 1. Configuração de Limites e Tetos de Volume → 2. Montagem Diária com Bloqueio de Teto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMrvModalOpen(true)}
                className="text-xs font-bold border-[#00E5FF]/50 text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-xl cursor-pointer"
              >
                <BarChart3 size={13} className="mr-1" /> Janela MRV
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setWorkoutMode('FAZER')}
                className="text-xs font-bold border-primary/50 text-primary hover:bg-primary/10 rounded-xl cursor-pointer"
              >
                <Eye size={13} className="mr-1" /> Ver como Aluno
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleLockAdmin}
                className="text-xs font-bold text-muted-foreground hover:text-destructive rounded-xl cursor-pointer"
              >
                <Lock size={13} className="mr-1" /> Bloquear
              </Button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SELETOR HORIZONTAL DE SUB-ABAS DO COACH STUDIO                            */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card border border-border/80 shadow-inner">
            <button
              type="button"
              onClick={() => setCoachSubTab('LIMITES')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                coachSubTab === 'LIMITES'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Target size={14} />
              <span>1. Configurar Limites & Recomendações de Volume</span>
            </button>
            <button
              type="button"
              onClick={() => setCoachSubTab('ROTINA')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                coachSubTab === 'ROTINA'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Calendar size={14} />
              <span>2. Montador Diário da Rotina (Tela por Dia)</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* PARTE 1: CONFIGURAR LIMITES DE VOLUME & ANÁLISE DE RECUPERAÇÃO           */}
          {/* ========================================================================= */}
          {coachSubTab === 'LIMITES' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Diagnóstico Baseado nos Dados dos Questionários */}
              <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-[#00E5FF]" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                        Diagnóstico de Prontidão & Recomendações Baseadas em Dados
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                        Calculado automaticamente com base nos questionários pós-treino e check-in noturno do atleta.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsNightCheckinOpen(true)}
                    className="text-[11px] font-bold border-primary/50 text-primary hover:bg-primary/10 rounded-xl h-7 cursor-pointer"
                  >
                    <Moon size={11} className="mr-1" /> Simular Check-in Noturno
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="rounded-xl border border-border/70 bg-background/50 p-2.5 space-y-1">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Qualidade do Sono</span>
                    <div className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                      <Moon size={13} className="text-primary" />
                      <span>{volumeRecommendationData.avgSleep >= 4 ? 'Reparador (>7h)' : volumeRecommendationData.avgSleep >= 3 ? 'Regular (6-7h)' : 'Ruim (<6h)'}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/50 p-2.5 space-y-1">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Desempenho de Cargas</span>
                    <div className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                      <TrendingUp size={13} className={volumeRecommendationData.isProgressionUp ? 'text-primary' : volumeRecommendationData.isProgressionDown ? 'text-destructive' : 'text-amber-400'} />
                      <span>{volumeRecommendationData.isProgressionUp ? 'Superando Metas' : volumeRecommendationData.isProgressionDown ? 'Queda de Rendimento' : 'Cargas Mantidas'}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/50 p-2.5 space-y-1">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Articulações & DOMS</span>
                    <div className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                      <AlertCircle size={13} className={volumeRecommendationData.hasArticularPain ? 'text-destructive' : 'text-[#00E5FF]'} />
                      <span>{volumeRecommendationData.hasArticularPain ? 'Dor Articular / Alerta' : 'Articulações 100%'}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/50 p-2.5 space-y-1">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Diretriz Científica</span>
                    <div className="text-xs sm:text-sm font-black text-primary">
                      {volumeRecommendationData.hasArticularPain || volumeRecommendationData.isProgressionDown
                        ? '📉 Redução / Deload'
                        : volumeRecommendationData.isProgressionUp
                        ? '🚀 Progressão de Volume'
                        : '⚖️ Manutenção de Volume'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela Horizontal de Configuração de Tetos por Grupo Muscular com CRUD */}
              <div className="rounded-2xl border border-border bg-card/70 p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                      Grupamentos Musculares & Tetos Semanais (Volume Direto + Residual)
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                      Controle científico baseado em Brad Schoenfeld & Mike Israetel: Séries Diretas (1.0x) + Séries Residuais/Sinergistas (0.5x).
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setIsAddMuscleModalOpen(true)}
                    className="bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary/90 cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
                  >
                    <Plus size={13} className="mr-1" /> + Adicionar Grupamento Muscular
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {muscleGroupsList.map((m) => {
                    const breakdown = weeklyAllocatedSetsPerMuscle[m.name] || { direct: 0, residual: 0, total: 0 };
                    const allocated = breakdown.total;
                    const ceiling = m.ceiling;
                    const tip = volumeRecommendationData.muscleTips[m.name] || {
                      status: 'ESTAVEL',
                      action: 'MANTER',
                      badgeText: '⚖️ Manter Volume Atual',
                      reason: 'Volume balanceado.',
                      suggestedDelta: 0,
                    };
                    const isExceeded = allocated >= ceiling;
                    const progressPct = Math.min(100, Math.round((allocated / ceiling) * 100));

                    return (
                      <div
                        key={m.id}
                        className={`rounded-2xl border p-3.5 space-y-3 transition-all ${
                          isExceeded
                            ? 'border-destructive/60 bg-destructive/10'
                            : 'border-border/70 bg-background/60 hover:border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-foreground">{m.name}</h4>
                              <button
                                type="button"
                                onClick={() => setEditingMuscleItem(m)}
                                title={`Editar marcos e limites de ${m.name}`}
                                className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMuscleGroup(m.id)}
                                title={`Excluir grupamento ${m.name}`}
                                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {/* Detalhamento Científico: Diretas + Residuais */}
                            <div className="text-[10px] text-muted-foreground font-mono space-y-0.5 mt-1">
                              <div>
                                Volume Efetivo: <strong className={isExceeded ? 'text-destructive font-black' : 'text-primary font-bold'}>{allocated}</strong> / {ceiling} séries
                              </div>
                              <div className="text-[9px] text-muted-foreground/80 flex items-center gap-1.5 flex-wrap">
                                <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded">🎯 {breakdown.direct} diretas (1.0x)</span>
                                <span className="bg-[#00E5FF]/10 text-[#00E5FF] px-1.5 py-0.2 rounded">⚡ {breakdown.residual} residuais (0.5x = +{breakdown.residual * 0.5}s)</span>
                              </div>
                            </div>
                          </div>

                          {/* Seletor Interativo de Teto */}
                          <div className="flex items-center gap-1 bg-card px-2 py-1 rounded-xl border border-border/80 shrink-0">
                            <span className="text-[9px] font-black text-muted-foreground uppercase">TETO:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateMuscleCeiling(m.name, ceiling - 1)}
                              className="size-5 rounded flex items-center justify-center bg-muted/60 hover:bg-muted text-foreground text-xs font-black cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-black w-6 text-center text-foreground">
                              {ceiling}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateMuscleCeiling(m.name, ceiling + 1)}
                              className="size-5 rounded flex items-center justify-center bg-muted/60 hover:bg-muted text-foreground text-xs font-black cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Barra de Progresso do Volume Alocado vs Teto */}
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isExceeded ? 'bg-destructive' : progressPct > 80 ? 'bg-amber-400' : 'bg-[#00E5FF]'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                            <span>MEV: {m.mev}s</span>
                            <span>Restam: <strong className={isExceeded ? 'text-destructive' : 'text-foreground'}>{Math.max(0, ceiling - allocated)} livres</strong></span>
                            <span>MRV: {m.mrv}s</span>
                          </div>
                        </div>

                        {/* Recomendação Científica Baseada em Dados */}
                        <div className="rounded-xl border border-border/50 bg-card/80 p-2.5 flex items-start justify-between gap-2 text-xs">
                          <div className="space-y-1 flex-1">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              tip.action === 'DIMINUIR'
                                ? 'bg-destructive/20 text-destructive border border-destructive/30'
                                : tip.action === 'AUMENTAR'
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {tip.badgeText}
                            </span>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {tip.reason}
                            </p>
                          </div>

                          {tip.suggestedDelta !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateMuscleCeiling(m.name, ceiling + tip.suggestedDelta)}
                              className="shrink-0 rounded-lg px-2 py-1 bg-primary/15 hover:bg-primary/25 text-primary text-[10px] font-black transition-all cursor-pointer"
                            >
                              Aplicar {tip.suggestedDelta > 0 ? '+1' : '-2'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PARTE 2: MONTADOR DIÁRIO DA ROTINA (UMA TELA POR DIA - ZERO POLUIÇÃO)     */}
          {/* ========================================================================= */}
          {coachSubTab === 'ROTINA' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Barra Horizontal de Navegação por Dia da Semana (Passo Único) */}
              <div className="rounded-2xl border border-border bg-card/80 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" /> Selecione o Dia para Prescrever:
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Exibindo apenas a tela do dia selecionado
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {weeklySchedule.map((day, idx) => {
                    const isSelected = selectedCoachDayIndex === idx;
                    const isToday = DAYS_OF_WEEK[idx]?.dayIndex === todayDayIndex;
                    const dayWorkoutTitle = day?.workoutTitle || 'Descanso / Recuperação';
                    const isRest = dayWorkoutTitle.toLowerCase().includes('descanso');

                    return (
                      <button
                        key={day?.dayOfWeek || idx}
                        type="button"
                        onClick={() => {
                          setSelectedCoachDayIndex(idx);
                          handleSelectDay(day);
                        }}
                        className={`rounded-xl p-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-w-0 ${
                          isSelected
                            ? 'border-2 border-primary bg-primary/20 ring-1 ring-primary shadow-sm'
                            : isToday
                            ? 'border border-primary/50 bg-card/90'
                            : isRest
                            ? 'border border-border/40 bg-background/30 hover:bg-background/60'
                            : 'border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40'
                        }`}
                      >
                        <span className={`font-mono text-xs font-black uppercase ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          {day?.shortDay || DAYS_OF_WEEK[idx]?.short || 'DIA'}
                        </span>
                        <span className="text-[9px] truncate max-w-full font-bold text-foreground mt-0.5" title={dayWorkoutTitle}>
                          {isRest ? 'Descanso' : dayWorkoutTitle.split('—')[0].trim()}
                        </span>
                        {isSelected && (
                          <span className="size-1 rounded-full bg-primary mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TELA EXCLUSIVA DO DIA SELECIONADO */}
              <div className="rounded-2xl border border-border bg-card/70 p-4 sm:p-5 space-y-4 shadow-sm">
                {/* Header Horizontal do Dia & Gerenciamento do Treino */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-primary/20 text-primary px-2.5 py-0.5 text-[10px] font-black uppercase">
                        {weeklySchedule[selectedCoachDayIndex]?.dayOfWeek || 'Dia do Treino'}
                      </span>
                      <input
                        type="text"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="Nome do Treino (ex: Push A - Hipertrofia)"
                        className="text-base sm:text-lg font-black text-foreground bg-transparent border-b border-dashed border-border/60 hover:border-primary focus:border-primary focus:outline-none transition-colors px-1 py-0.5 max-w-full"
                        title="Clique para editar o nome do treino diretamente"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Grupamentos: <strong className="text-foreground">{programMuscleGroups}</strong> • Rotina: <strong className="text-primary">{activeSplit?.name || 'Rotina Principal'}</strong>
                    </p>
                  </div>

                  {/* Ações de CRUD do Treino & Exercício */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => setIsNewWorkoutModalOpen(true)}
                      className="bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 font-black text-xs rounded-xl cursor-pointer"
                      title="Criar novo treino na rotina para este dia"
                    >
                      <Plus size={13} className="mr-1" /> + Novo Treino
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDuplicateCurrentWorkout}
                      className="text-xs text-foreground font-bold border-border hover:bg-muted rounded-xl cursor-pointer"
                      title="Duplicar treino atual"
                    >
                      <Layers size={13} className="mr-1" /> Duplicar
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDeleteCurrentWorkout}
                      className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                      title="Excluir treino atual da rotina"
                    >
                      <Trash2 size={13} className="mr-1" /> Excluir
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setIsAddExerciseModalOpen(true)}
                      className="bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs rounded-xl cursor-pointer shadow-sm"
                    >
                      <Plus size={13} className="mr-1" /> + Exercício
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveCurrentWorkoutToSplit}
                      className="text-xs text-primary font-black border-primary/50 hover:bg-primary/10 rounded-xl cursor-pointer"
                    >
                      <Save size={13} className="mr-1" /> Salvar Treino
                    </Button>
                  </div>
                </div>

                {/* Seletor Rápido de Treino para este Dia */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Atribuir à {weeklySchedule[selectedCoachDayIndex]?.shortDay || 'Dia'}:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {(activeSplit?.workouts || []).map((w) => {
                      const isCurrent = weeklySchedule[selectedCoachDayIndex]?.workoutTitle === w.title;
                      const wTitle = w?.title || 'Treino';
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            handleUpdateScheduleDay(selectedCoachDayIndex, w.title, w.id);
                            handleLoadWorkout(w);
                          }}
                          className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all shrink-0 cursor-pointer ${
                            isCurrent
                              ? 'bg-[#00E5FF] text-black shadow-sm ring-1 ring-[#00E5FF]'
                              : 'bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground border border-border/60'
                          }`}
                        >
                          ⚡ {wTitle.split('—')[0].trim()}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleUpdateScheduleDay(selectedCoachDayIndex, 'Descanso / Recuperação')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        weeklySchedule[selectedCoachDayIndex]?.workoutTitle.toLowerCase().includes('descanso')
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-background/40 text-muted-foreground hover:bg-background/60 border border-border/40'
                      }`}
                    >
                      💤 Descanso
                    </button>
                  </div>
                </div>

                {/* Resumo Dinâmico dos Músculos deste Treino vs Teto Semanal (Volume Direto + Residual) */}
                <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Target size={12} className="text-primary" /> Balanço de Séries no Microciclo (Volume Efetivo Direto + Residual vs Teto):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Set([
                        ...exercises.map((e) => e.muscle),
                        ...exercises.flatMap((e) => e.secondaryMuscles || []),
                      ])
                    ).map((muscle) => {
                      const breakdown = weeklyAllocatedSetsPerMuscle[muscle] || { direct: 0, residual: 0, total: 0 };
                      const ceiling = muscleCeilings[muscle] ?? 14;
                      const isAtLimit = breakdown.total >= ceiling;
                      const remaining = Math.max(0, ceiling - breakdown.total);

                      return (
                        <div
                          key={muscle}
                          className={`rounded-xl px-3 py-1.5 border text-xs font-mono font-bold flex items-center gap-2 ${
                            isAtLimit
                              ? 'border-destructive/60 bg-destructive/15 text-destructive'
                              : 'border-primary/40 bg-card text-foreground'
                          }`}
                        >
                          <div>
                            <span className="text-muted-foreground">{muscle}: </span>
                            <strong className={isAtLimit ? 'text-destructive font-black' : 'text-primary font-black'}>
                              {breakdown.total}/{ceiling}s
                            </strong>
                            <span className="text-[9px] text-muted-foreground block font-normal">
                              {breakdown.direct}d + {breakdown.residual}r (0.5x)
                            </span>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black shrink-0 ${
                            isAtLimit ? 'bg-destructive text-white' : 'bg-primary/20 text-primary'
                          }`}>
                            {isAtLimit ? 'Teto Atingido' : `Livre: ${remaining}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de Exercícios do Treino */}
                <div className="space-y-4 pt-1">
                  {exercises.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
                      <Dumbbell size={32} className="mx-auto text-muted-foreground opacity-50" />
                      <p className="text-sm font-bold text-muted-foreground">
                        Nenhum exercício cadastrado para o treino deste dia.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsAddExerciseModalOpen(true)}
                        className="bg-primary text-primary-foreground font-black text-xs rounded-xl cursor-pointer"
                      >
                        <Plus size={13} className="mr-1" /> + Adicionar Exercício
                      </Button>
                    </div>
                  ) : (
                    exercises.map((ex, exIndex) => {
                      const preparatorySets = ex.sets.filter((s) => s.baseType === 'WARMUP' || s.baseType === 'FEEDER' || s.baseType === 'PAP');
                      const workingSets = ex.sets.filter((s) => s.baseType === 'WORKING' || s.baseType === 'BACKOFF');
                      const currentRest = ex.targetRestSeconds || restWorkingSeconds;
                      const muscleBreakdown = weeklyAllocatedSetsPerMuscle[ex.muscle] || { direct: 0, residual: 0, total: 0 };
                      const muscleCeiling = muscleCeilings[ex.muscle] ?? 14;
                      const muscleAllocated = muscleBreakdown.total;
                      const isAtCeiling = muscleAllocated >= muscleCeiling;

                      return (
                        <div key={ex.id} className="rounded-2xl border border-border/80 bg-background/50 p-4 sm:p-5 transition-all space-y-4">
                          {/* Header do Exercício */}
                          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-black text-foreground">
                                  #{exIndex + 1}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    disabled={exIndex === 0}
                                    onClick={() => handleMoveExercise(exIndex, 'up')}
                                    className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                  >
                                    <ChevronUp size={13} />
                                  </button>
                                  <button
                                    disabled={exIndex === exercises.length - 1}
                                    onClick={() => handleMoveExercise(exIndex, 'down')}
                                    className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                  >
                                    <ChevronDown size={13} />
                                  </button>
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm sm:text-base font-black text-foreground">
                                    {ex.name}
                                  </h3>
                                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary shrink-0" title="Músculo Primário (1.0x por série)">
                                    🎯 {ex.muscle}
                                  </span>

                                  {/* Sinergistas Residuais */}
                                  {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                                    <span className="rounded-full bg-[#00E5FF]/15 px-2 py-0.5 text-[9px] font-bold text-[#00E5FF] shrink-0" title="Sinergistas que recebem 0.5 série residual">
                                      ⚡ Residuais: {ex.secondaryMuscles.join(', ')} (+0.5x)
                                    </span>
                                  )}

                                  {/* Badge de Teto do Músculo */}
                                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase shrink-0 ${
                                    isAtCeiling
                                      ? 'bg-destructive/20 text-destructive border border-destructive/40'
                                      : 'bg-secondary text-muted-foreground'
                                  }`}>
                                    {isAtCeiling ? `⚠️ Teto de ${ex.muscle} Atingido (${muscleBreakdown.total}/${muscleCeiling}s)` : `${ex.muscle}: ${muscleBreakdown.total}/${muscleCeiling}s`}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 mt-2 w-full">
                                  <span className="text-[10px] font-bold text-primary flex items-center gap-1 shrink-0">
                                    <Play size={10} /> YouTube:
                                  </span>
                                  <input
                                    type="text"
                                    value={ex.video_url || ''}
                                    onChange={(e) => {
                                      const newUrl = e.target.value;
                                      setExercises((prev) => prev.map((item) => item.id === ex.id ? { ...item, video_url: newUrl } : item));
                                    }}
                                    placeholder="https://youtu.be/..."
                                    className="w-full min-w-0 rounded-xl border border-border/80 bg-card px-2 py-1 text-xs text-foreground font-mono focus:border-primary"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveExercise(ex.id)}
                                className="size-7 text-muted-foreground hover:text-destructive rounded-xl cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>

                          {/* TEMPO DE DESCANSO ESPECÍFICO DESTE EXERCÍCIO */}
                          <div className="rounded-xl border border-primary/30 bg-card/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                                <Clock size={14} />
                              </div>
                              <div>
                                <span className="text-xs font-black text-foreground">
                                  Tempo de Descanso deste Exercício:
                                </span>
                                <span className="text-[10px] text-muted-foreground block">
                                  Disparado automaticamente ao concluir cada série deste exercício
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {[45, 60, 90, 120, 180].map((presetSecs) => {
                                const isCurrent = currentRest === presetSecs;
                                return (
                                  <button
                                    key={presetSecs}
                                    type="button"
                                    onClick={() => handleUpdateExerciseRest(ex.id, presetSecs)}
                                    className={`rounded-xl px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${
                                      isCurrent
                                        ? 'bg-[#FFD600] text-black shadow-sm ring-1 ring-[#FFD600]'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                  >
                                    {presetSecs}s
                                  </button>
                                );
                              })}

                              <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-xl border border-border/80 ml-1">
                                <input
                                  type="number"
                                  min="10"
                                  max="600"
                                  step="5"
                                  value={currentRest}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 60;
                                    handleUpdateExerciseRest(ex.id, val);
                                  }}
                                  className="!w-12 !h-6 !p-0 !bg-transparent text-center font-bold text-xs text-foreground focus:outline-none"
                                />
                                <span className="text-[10px] text-muted-foreground font-mono">s</span>
                              </div>
                            </div>
                          </div>

                          {/* Metas Prescritas */}
                          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-muted-foreground flex items-center gap-1">
                              <Target size={13} className="text-primary" /> Metas Prescritas:
                            </span>
                            <div className="flex items-center gap-2 font-mono self-start sm:self-auto">
                              <div className="flex items-center gap-1 bg-background px-2 py-1 rounded-xl border border-border/80">
                                <span className="text-[9px] font-black text-muted-foreground uppercase">CARGA:</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={ex.targetWeightKg ?? 40}
                                  onChange={(e) => handleUpdateExerciseTarget(ex.id, parseFloat(e.target.value) || 0, ex.targetReps ?? 10)}
                                  className="!w-12 !h-6 !p-0 !bg-transparent text-center font-bold text-foreground focus:outline-none"
                                />
                                <span className="text-[10px] text-muted-foreground">kg</span>
                              </div>
                              <div className="flex items-center gap-1 bg-background px-2 py-1 rounded-xl border border-border/80">
                                <span className="text-[9px] font-black text-muted-foreground uppercase">REPS:</span>
                                <input
                                  type="number"
                                  value={ex.targetReps ?? 10}
                                  onChange={(e) => handleUpdateExerciseTarget(ex.id, ex.targetWeightKg ?? 40, parseInt(e.target.value) || 0)}
                                  className="!w-10 !h-6 !p-0 !bg-transparent text-center font-bold text-foreground focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Séries com Bloqueio Rígido de Teto */}
                          <div className="space-y-4">
                            {/* Séries Preparatórias */}
                            <div className="rounded-2xl border border-border/40 bg-muted/10 p-3 sm:p-4 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                                  <Clock size={13} className="text-amber-500" /> Séries Preparatórias
                                </span>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddPreparatorySet(ex.id, 'WARMUP')}
                                    className="text-[10px] h-6 px-2 text-muted-foreground border border-dashed rounded-lg cursor-pointer"
                                  >
                                    + Aquecimento
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddPreparatorySet(ex.id, 'FEEDER')}
                                    className="text-[10px] h-6 px-2 text-amber-500 border border-dashed border-amber-500/40 rounded-lg cursor-pointer"
                                  >
                                    + Feeder
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddPreparatorySet(ex.id, 'PAP')}
                                    className="text-[10px] h-6 px-2 text-cyan-400 border border-dashed border-cyan-500/40 rounded-lg cursor-pointer"
                                  >
                                    + PAP
                                  </Button>
                                </div>
                              </div>

                              {preparatorySets.map((set) => (
                                <AdvancedSetRow
                                  key={set.id}
                                  data={{
                                    ...set,
                                    restSeconds: set.restSeconds ?? currentRest,
                                  }}
                                  mode="PLAN"
                                  restWarmupSeconds={restWarmupSeconds}
                                  restWorkingSeconds={currentRest}
                                  onUpdate={(updated) => handleUpdateSet(ex.id, updated)}
                                  onDelete={() => handleDeleteSet(ex.id, set.id)}
                                  onTriggerRestTimer={(seconds) => triggerFloatingTimer(seconds, `${ex.name} - Preparação`)}
                                />
                              ))}
                            </div>

                            {/* Séries de Trabalho Efetivas com Controle de Teto */}
                            <div className={`rounded-2xl border p-3 sm:p-4 space-y-2.5 ${
                              isAtCeiling ? 'border-destructive/40 bg-destructive/5' : 'border-primary/30 bg-card/60'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black uppercase text-primary flex items-center gap-1.5">
                                    <Flame size={14} className="text-primary" /> Séries de Trabalho
                                  </span>
                                  {isAtCeiling ? (
                                    <span className="text-[10px] font-black text-destructive uppercase">
                                      ⚠️ Teto atingido ({muscleAllocated}/{muscleCeiling}s)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      ({muscleAllocated}/{muscleCeiling}s semanais)
                                    </span>
                                  )}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isAtCeiling}
                                  onClick={() => handleAddWorkingSet(ex.id)}
                                  className={`text-xs border-dashed rounded-lg cursor-pointer ${
                                    isAtCeiling
                                      ? 'border-destructive/40 text-destructive opacity-50 cursor-not-allowed'
                                      : 'text-primary border-primary/40'
                                  }`}
                                  title={isAtCeiling ? `Teto de ${ex.muscle} atingido. Aumente na aba Limites.` : 'Adicionar Working Set'}
                                >
                                  <Plus size={12} className="mr-1" />
                                  {isAtCeiling ? 'Teto Atingido' : '+ Série'}
                                </Button>
                              </div>

                              {workingSets.map((set, wIdx) => (
                                <AdvancedSetRow
                                  key={set.id}
                                  data={{
                                    ...set,
                                    restSeconds: set.restSeconds ?? currentRest,
                                    targetWeight: set.targetWeight ?? ex.targetWeightKg,
                                    targetReps: set.targetReps ?? ex.targetReps,
                                  }}
                                  mode="PLAN"
                                  workingIndex={wIdx + 1}
                                  restWarmupSeconds={restWarmupSeconds}
                                  restWorkingSeconds={currentRest}
                                  onUpdate={(updated) => handleUpdateSet(ex.id, updated)}
                                  onDelete={() => handleDeleteSet(ex.id, set.id)}
                                  onTriggerRestTimer={(seconds) => triggerFloatingTimer(seconds, `${ex.name} - Série #${wIdx + 1}`)}
                                  onCelebratePR={(info) => handleTriggerPRCelebration(ex.name, info)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Botão Final de Publicação */}
              <div className="rounded-2xl border border-[#232733] bg-[#161920] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div>
                  <h3 className="text-base font-black text-white">
                    Pronto para enviar ao atleta?
                  </h3>
                  <p className="text-xs text-[#8F9BBA]">
                    Publica imediatamente a ficha configurada para o ambiente de execução minimalista do aluno.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setWorkoutMode('FAZER')}
                    className="text-xs border-[#232733] text-[#8F9BBA] hover:text-white rounded-xl cursor-pointer"
                  >
                    👁️ Ver como Aluno
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveCurrentWorkoutToSplit();
                      setWorkoutMode('FAZER');
                      showScheduleToast('🚀 Treino publicado e atualizado na conta do aluno!');
                    }}
                    className="flex-1 sm:flex-initial rounded-xl bg-[#FFD600] text-[#0F1115] hover:bg-[#FFD600]/90 font-black text-xs px-5 py-3 shadow-lg shadow-[#FFD600]/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Publicar / Atualizar Treino na Conta do Aluno</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TIMER FLUTUANTE GLOBAL (CENTRALIZADO NO MOBILE / FIXO NO DESKTOP) */}
      {restTime > 0 && (
        <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-50 flex flex-col gap-2.5 rounded-2xl border-2 border-primary/60 bg-card/95 p-3.5 sm:p-4 shadow-2xl backdrop-blur-lg ring-1 ring-primary/40">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Clock size={22} className={timerActive ? 'animate-spin' : ''} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground truncate">
                {lastRestTriggerSource}
              </div>
              <div className="font-mono text-2xl font-black text-primary flex items-center gap-2">
                {formatTimer(restTime)}
                <input
                  type="number"
                  min="0"
                  max="900"
                  step="5"
                  value={restTime === 0 ? '' : restTime}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setRestTime(Math.max(0, parseInt(e.target.value) || 0))}
                  title="Editar segundos de descanso"
                  className="w-14 rounded border border-primary/40 bg-background/90 px-1 py-0.5 text-center font-mono text-xs font-bold text-foreground focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground font-sans">s</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-foreground hover:bg-primary/20"
                onClick={() => setTimerActive(!timerActive)}
              >
                {timerActive ? <Pause size={16} /> : <Play size={16} className="text-primary" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setRestTime(0);
                  setTimerActive(false);
                }}
              >
                <RotateCcw size={15} />
              </Button>
            </div>
          </div>

          {/* Controles Dinâmicos de Ajuste de Tempo */}
          <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-border/50 text-[10px]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRestTime((prev) => Math.max(5, prev - 30))}
                className="rounded bg-muted/80 px-2 py-1 font-mono font-bold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                -30s
              </button>
              <button
                type="button"
                onClick={() => setRestTime((prev) => prev + 30)}
                className="rounded bg-muted/80 px-2 py-1 font-mono font-bold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                +30s
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[45, 60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => { setRestTime(sec); setTimerActive(true); }}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold cursor-pointer transition-all ${
                    restTime === sec 
                      ? 'bg-primary text-primary-foreground font-black shadow-sm' 
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR EXERCÍCIO DA BIBLIOTECA OU PERSONALIZADO (COM DEFINIÇÃO DE CARGA META) */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="panel max-w-2xl w-full p-6 max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Dumbbell size={18} className="text-primary" /> Adicionar Exercício & Estabelecer Meta de Carga
              </h3>
              <button
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Configurar Carga Meta Programada */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-primary flex items-center gap-1">
                  <Target size={14} /> Estabelecer Carga de Trabalho Alvo (Gamificação):
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Defina quanto você planeja levantar hoje para acompanhar no gráfico de sobrecarga progressiva.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <span className="text-[9px] text-muted-foreground block">Carga Alvo (KG):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={customTargetWeight}
                    onChange={(e) => setCustomTargetWeight(parseFloat(e.target.value) || 0)}
                    className="w-18 rounded border border-border bg-background px-2 py-1 text-center font-mono text-xs font-black"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground block">Reps Alvo:</span>
                  <input
                    type="number"
                    value={customTargetReps}
                    onChange={(e) => setCustomTargetReps(parseInt(e.target.value) || 0)}
                    className="w-14 rounded border border-border bg-background px-2 py-1 text-center font-mono text-xs font-black"
                  />
                </div>
              </div>
            </div>

            {/* Criar / Colar Exercício Rápido com Músculo Primário e Sinergistas Residuais */}
            <div className="rounded-xl border border-border/80 bg-background/60 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-primary block">
                  + Criar Exercício Rápido Personalizado
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">
                  Primário = 1.0x série | Sinergistas = 0.5x residual
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome do exercício (ex: Tríceps Francês)"
                  value={customExerciseName}
                  onChange={(e) => setCustomExerciseName(e.target.value)}
                  className="flex-1 min-w-[180px] rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:border-primary"
                />
                <select
                  value={customExerciseMuscle}
                  onChange={(e) => setCustomExerciseMuscle(e.target.value as MuscleGroup)}
                  className="rounded border border-border bg-background px-2 py-1.5 text-xs font-semibold"
                >
                  {muscleGroupsList.map((m) => (
                    <option key={m.id} value={m.name}>🎯 Primário: {m.name}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAddCustomExercise}
                  disabled={!customExerciseName.trim()}
                  className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs"
                >
                  Adicionar
                </Button>
              </div>

              {/* Músculos Sinergistas / Residuais (0.5 série cada) */}
              <div className="space-y-1.5 pt-1 border-t border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground block">
                  Selecione os Sinergistas Residuais (receberão 0.5 série no cálculo de volume semanal):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {muscleGroupsList
                    .filter((m) => m.name !== customExerciseMuscle)
                    .map((m) => {
                      const isSelected = customExerciseSecondaryMuscles.includes(m.name as MuscleGroup);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setCustomExerciseSecondaryMuscles((prev) =>
                              isSelected
                                ? prev.filter((item) => item !== m.name)
                                : [...prev, m.name as MuscleGroup]
                            );
                          }}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#00E5FF] text-black shadow-sm ring-1 ring-[#00E5FF]'
                              : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {m.name} (0.5x)
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Filtros da Biblioteca */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-muted-foreground mr-1">Filtro:</span>
              {['Todos', 'Push', 'Pull', 'Legs'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setExerciseFilterCategory(cat)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                    exerciseFilterCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Lista de Exercícios */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {EXERCISE_LIBRARY
                .filter((ex) => exerciseFilterCategory === 'Todos' || ex.category === exerciseFilterCategory)
                .map((libEx) => (
                  <div
                    key={libEx.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 p-3 hover:border-primary/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-foreground">{libEx.name}</span>
                        <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] font-bold text-primary">
                          🎯 {libEx.muscle}
                        </span>
                        {libEx.secondaryMuscles && libEx.secondaryMuscles.length > 0 && (
                          <span className="rounded bg-[#00E5FF]/15 px-1 py-0.5 text-[9px] font-bold text-[#00E5FF]">
                            ⚡ Residuais: {libEx.secondaryMuscles.join(', ')}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {libEx.equipment}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {libEx.description}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAddFromLibrary(libEx)}
                      className="text-xs h-7 bg-secondary hover:bg-primary hover:text-primary-foreground shrink-0 ml-2"
                    >
                      + Incluir
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR NOVO TREINO NO DIA (COACH STUDIO) */}
      {isNewWorkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="panel max-w-md w-full p-6 space-y-4 border border-primary/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                <Plus size={18} className="text-primary" /> Novo Treino na Rotina
              </h3>
              <button
                type="button"
                onClick={() => setIsNewWorkoutModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Nome do Treino (ex: Push B - Hipertrofia Clavicular):
              </label>
              <input
                type="text"
                value={newWorkoutTitleInput}
                onChange={(e) => setNewWorkoutTitleInput(e.target.value)}
                placeholder="Ex: Push B - Peito e Tríceps"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Categoria Biomecânica:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Push', 'Pull', 'Legs'] as BiomechanicalCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewWorkoutCategoryInput(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      newWorkoutCategoryInput === cat
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleCreateNewWorkoutForDay(newWorkoutTitleInput, newWorkoutCategoryInput)}
              disabled={!newWorkoutTitleInput.trim()}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Criar Treino & Iniciar Montagem
            </Button>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR NOVO GRUPAMENTO MUSCULAR (CRUD DE VOLUME) */}
      {isAddMuscleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="panel max-w-md w-full p-6 space-y-4 border border-primary/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                <Target size={18} className="text-primary" /> Adicionar Grupamento Muscular
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMuscleModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Nome do Grupamento Muscular:
                </label>
                <input
                  type="text"
                  value={newMuscleForm.name}
                  onChange={(e) => setNewMuscleForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Lombar, Adutores, Abdômen..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                    MEV (Mínimo Efetivo):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={newMuscleForm.mev}
                    onChange={(e) => setNewMuscleForm((prev) => ({ ...prev, mev: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono font-bold text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                    MRV (Teto Biológico):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newMuscleForm.mrv}
                    onChange={(e) => setNewMuscleForm((prev) => ({ ...prev, mrv: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                    MAV Mín (Zona Ideal):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={newMuscleForm.mavMin}
                    onChange={(e) => setNewMuscleForm((prev) => ({ ...prev, mavMin: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono font-bold text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                    MAV Máx (Zona Ideal):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={newMuscleForm.mavMax}
                    onChange={(e) => setNewMuscleForm((prev) => ({ ...prev, mavMax: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono font-bold text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Teto Semanal Máximo (Bloqueia o Montador):
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={newMuscleForm.ceiling}
                  onChange={(e) => setNewMuscleForm((prev) => ({ ...prev, ceiling: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-primary/60 bg-background px-3 py-2 font-mono font-black text-sm text-primary"
                />
              </div>
            </div>

            <Button
              onClick={handleAddMuscleGroup}
              disabled={!newMuscleForm.name.trim()}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Cadastrar Grupamento & Limites
            </Button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR GRUPAMENTO MUSCULAR EXISTENTE */}
      {editingMuscleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="panel max-w-md w-full p-6 space-y-4 border border-primary/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                <Edit3 size={18} className="text-primary" /> Editar {editingMuscleItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMuscleItem(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Nome do Músculo:
                </label>
                <input
                  type="text"
                  value={editingMuscleItem.name}
                  onChange={(e) => setEditingMuscleItem((prev) => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                    MEV:
                  </label>
                  <input
                    type="number"
                    value={editingMuscleItem.mev}
                    onChange={(e) => setEditingMuscleItem((prev) => prev ? { ...prev, mev: parseInt(e.target.value) || 0 } : null)}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono font-bold text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                    MRV:
                  </label>
                  <input
                    type="number"
                    value={editingMuscleItem.mrv}
                    onChange={(e) => setEditingMuscleItem((prev) => prev ? { ...prev, mrv: parseInt(e.target.value) || 0 } : null)}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                    MAV Mín:
                  </label>
                  <input
                    type="number"
                    value={editingMuscleItem.mavMin}
                    onChange={(e) => setEditingMuscleItem((prev) => prev ? { ...prev, mavMin: parseInt(e.target.value) || 0 } : null)}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono font-bold text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                    MAV Máx:
                  </label>
                  <input
                    type="number"
                    value={editingMuscleItem.mavMax}
                    onChange={(e) => setEditingMuscleItem((prev) => prev ? { ...prev, mavMax: parseInt(e.target.value) || 0 } : null)}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 font-mono font-bold text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Teto Semanal Máximo (Séries):
                </label>
                <input
                  type="number"
                  value={editingMuscleItem.ceiling}
                  onChange={(e) => setEditingMuscleItem((prev) => prev ? { ...prev, ceiling: parseInt(e.target.value) || 0 } : null)}
                  className="w-full rounded-xl border border-primary/60 bg-background px-3 py-2 font-mono font-black text-sm text-primary"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveEditMuscle}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Salvar Alterações do Músculo
            </Button>
          </div>
        </div>
      )}

      {/* MODAL CRIAR NOVA DIVISÃO */}
      {isCreateSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="panel max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <FolderPlus size={18} className="text-primary" /> Criar Nova Rotina de Treino
              </h3>
              <button
                onClick={() => setIsCreateSplitModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Nome da Rotina (Ex: ABCD Hipertrofia do Luis):
              </label>
              <input
                type="text"
                value={newSplitName}
                onChange={(e) => setNewSplitName(e.target.value)}
                placeholder="Ex: ABCD Hipertrofia"
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <Button
              onClick={() => {
                if (!newSplitName.trim()) return;
                const newSplit: WorkoutSplit = {
                  id: `split-${crypto.randomUUID()}`,
                  name: newSplitName.trim(),
                  description: 'Rotina personalizada',
                  workouts: [
                    {
                      id: crypto.randomUUID(),
                      title: `${newSplitName.trim()} — Treino A`,
                      category: 'Push',
                      description: 'Treino A da divisão',
                      exercises: [
                        {
                          exerciseId: 'ex-1',
                          targetWeightKg: 80,
                          targetReps: 8,
                          sets: [
                            { id: crypto.randomUUID(), setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 12, rir: 4, completed: false },
                            { id: crypto.randomUUID(), setNumber: 2, baseType: 'WORKING', technique: 'NONE', targetWeight: 80, targetReps: 8, weight: 80, reps: 8, rir: 2, completed: false },
                          ],
                        },
                      ],
                    },
                  ],
                };
                setSplits((prev) => [...prev, newSplit]);
                setActiveSplitId(newSplit.id);
                handleLoadWorkout(newSplit.workouts[0]);
                setNewSplitName('');
                setIsCreateSplitModalOpen(false);
              }}
              disabled={!newSplitName.trim()}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs"
            >
              Criar Rotina & Montar
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📋 PARTE 3: QUESTIONÁRIO POP-UP PÓS-TREINO (RECOVERY)                    */}
      {/* ========================================================================= */}
      {isFinishingWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full rounded-2xl border border-[#232733] bg-[#0F1115] p-5 sm:p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-[#232733] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wide text-white uppercase">
                    Avaliação de Recuperação e Performance
                  </h3>
                  <p className="text-[11px] text-[#8F9BBA]">
                    Alimenta os algoritmos de autorregulação e ajuste do MRV.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFinishingWorkout(false)}
                className="text-[#8F9BBA] hover:text-white text-sm font-black p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Resumo da Sessão */}
            <div className="rounded-xl border border-[#232733] bg-[#161920] p-3 space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#8F9BBA]">Sessão:</span>
                <span className="font-bold text-white">{sessionTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8F9BBA]">Séries Concluídas:</span>
                <span className="text-[#00E5FF] font-bold">{completedSetsCount} de {totalSetsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8F9BBA]">Tonelagem Total:</span>
                <span className="text-[#FFD600] font-bold">{totalSessionTonnage.toLocaleString()} kg</span>
              </div>
            </div>

            {/* Pergunta 1: PSE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                1. Percepção de Esforço (PSE / RPE)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'LEVE', label: 'Leve (RIR 3-5)' },
                  { value: 'MODERADO', label: 'Hipertrófico (RIR 1-2)' },
                  { value: 'FALHA', label: 'Falha Total (RIR 0)' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRecoveryPse(item.value as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      recoveryPse === item.value
                        ? 'border-[#FFD600] bg-[#FFD600]/10 text-white ring-1 ring-[#FFD600]'
                        : 'border-[#232733] bg-[#161920] text-[#8F9BBA] hover:text-white'
                    }`}
                  >
                    <span className={`size-3 rounded-full border flex items-center justify-center shrink-0 ${recoveryPse === item.value ? 'border-[#FFD600] bg-[#FFD600]' : 'border-[#8F9BBA]'}`}>
                      {recoveryPse === item.value && <span className="size-1 rounded-full bg-[#0F1115]" />}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pergunta 2: Progressão Real de Cargas/Reps */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                2. Desempenho Real (Carga & Repetições)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'PROGRESSION_UP', label: '🚀 Superou Benchmark' },
                  { value: 'PROGRESSION_SAME', label: '⚖️ Cargas Mantidas' },
                  { value: 'PROGRESSION_DOWN', label: '📉 Queda de Rendimento' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRecoveryProgression(item.value as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      recoveryProgression === item.value
                        ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white ring-1 ring-[#00E5FF]'
                        : 'border-[#232733] bg-[#161920] text-[#8F9BBA] hover:text-white'
                    }`}
                  >
                    <span className={`size-3 rounded-full border flex items-center justify-center shrink-0 ${recoveryProgression === item.value ? 'border-[#00E5FF] bg-[#00E5FF]' : 'border-[#8F9BBA]'}`}>
                      {recoveryProgression === item.value && <span className="size-1 rounded-full bg-[#0F1115]" />}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pergunta 3: Pump & Conexão Neuromuscular */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                3. Pump Muscular & Tensão Sentida
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'OTIMO', label: '⚡ Pump Máximo' },
                  { value: 'MODERADO', label: 'Normal / Bom' },
                  { value: 'FRACO', label: 'Fraco / Desconectado' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRecoveryPump(item.value as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      recoveryPump === item.value
                        ? 'border-[#FFD600] bg-[#FFD600]/10 text-white ring-1 ring-[#FFD600]'
                        : 'border-[#232733] bg-[#161920] text-[#8F9BBA] hover:text-white'
                    }`}
                  >
                    <span className={`size-3 rounded-full border flex items-center justify-center shrink-0 ${recoveryPump === item.value ? 'border-[#FFD600] bg-[#FFD600]' : 'border-[#8F9BBA]'}`}>
                      {recoveryPump === item.value && <span className="size-1 rounded-full bg-[#0F1115]" />}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pergunta 4: Sono da noite anterior */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                4. Sono pré-treino na última noite
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'RUIM', label: 'Ruim (<6h)' },
                  { value: 'REGULAR', label: 'Regular (6-7h)' },
                  { value: 'REPARADOR', label: 'Reparador (>7h)' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRecoverySleep(item.value as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      recoverySleep === item.value
                        ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white ring-1 ring-[#00E5FF]'
                        : 'border-[#232733] bg-[#161920] text-[#8F9BBA] hover:text-white'
                    }`}
                  >
                    <span className={`size-3 rounded-full border flex items-center justify-center shrink-0 ${recoverySleep === item.value ? 'border-[#00E5FF] bg-[#00E5FF]' : 'border-[#8F9BBA]'}`}>
                      {recoverySleep === item.value && <span className="size-1 rounded-full bg-[#0F1115]" />}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pergunta 5: Dores articulares */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                5. Sentiu dores articulares ou tendíneas?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'NAO', label: '100% Saudável' },
                  { value: 'LEVE', label: 'Leve Incômodo' },
                  { value: 'SIM', label: '⚠️ Dor que Limitou' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRecoveryJointPain(item.value as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      recoveryJointPain === item.value
                        ? 'border-[#FFD600] bg-[#FFD600]/10 text-white ring-1 ring-[#FFD600]'
                        : 'border-[#232733] bg-[#161920] text-[#8F9BBA] hover:text-white'
                    }`}
                  >
                    <span className={`size-3 rounded-full border flex items-center justify-center shrink-0 ${recoveryJointPain === item.value ? 'border-[#FFD600] bg-[#FFD600]' : 'border-[#8F9BBA]'}`}>
                      {recoveryJointPain === item.value && <span className="size-1 rounded-full bg-[#0F1115]" />}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duração em minutos */}
            <div className="flex items-center justify-between text-xs font-mono text-[#8F9BBA] pt-1">
              <span>Duração do treino:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="10"
                  max="240"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-14 rounded-lg border border-[#232733] bg-[#161920] px-2 py-1 text-center font-bold text-white focus:border-[#FFD600]"
                />
                <span>min</span>
              </div>
            </div>

            {/* Ação Final: ENVIAR E FINALIZAR SESSÃO */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinishWorkout}
                className="w-full rounded-xl bg-[#FFD600] text-[#0F1115] hover:bg-[#FFD600]/90 font-black text-sm py-3.5 shadow-xl shadow-[#FFD600]/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>[ ENVIAR E FINALIZAR SESSÃO ]</span>
              </button>
              <p className="text-[10px] text-center text-[#8F9BBA] mt-2">
                Dados salvos para o motor de autorregulação e ajuste do teto de volume (MEV/MRV).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECK-IN NOTURNO DE TREINAMENTO & PRONTIDÃO */}
      {isNightCheckinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="panel max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <Moon size={18} className="text-primary" /> Check-in Noturno de Treinamento & Prontidão
              </h3>
              <button
                onClick={() => setIsNightCheckinOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Esses dados alimentam as recomendações de volume do Coach Studio (aumento ou redução de séries).
            </p>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>1. Qualidade do Sono Passado:</span>
                <span className="text-primary font-bold">{sleepScore} ★ ({sleepScore >= 4 ? 'Reparador' : sleepScore >= 3 ? 'Regular' : 'Ruim'})</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={sleepScore}
                onChange={(e) => setSleepScore(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>2. Dores Musculares Tardias (DOMS):</span>
                <span className="text-primary font-bold">{domsScore} ★ ({domsScore <= 2 ? 'Recuperado' : domsScore === 3 ? 'Dor Saudável' : 'Dor Extrema'})</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={domsScore}
                onChange={(e) => setDomsScore(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>3. Cansaço do Sistema Nervoso Central (SNC):</span>
                <span className="text-primary font-bold">{fatigueScore} ★ ({fatigueScore <= 2 ? 'Alta Prontidão' : fatigueScore === 3 ? 'Moderado' : 'Fadiga Neural'})</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={fatigueScore}
                onChange={(e) => setFatigueScore(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>4. Aporte Nutricional & Proteico do Dia:</span>
                <span className="text-primary font-bold">{nutritionScore} ★ ({nutritionScore >= 4 ? 'Bateu 100%' : nutritionScore >= 3 ? 'Médio' : 'Faltou Proteína'})</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={nutritionScore}
                onChange={(e) => setNutritionScore(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <Button
              onClick={async () => {
                const success = await save({
                  table: 'fatigue_logs',
                  record: {
                    id: crypto.randomUUID(),
                    day: today,
                    details: { 
                      sleep: sleepScore, 
                      doms: domsScore, 
                      fatigue: fatigueScore,
                      nutrition: nutritionScore,
                      note: `Check-in Noturno: Sono ${sleepScore}★ | DOMS ${domsScore}★ | SNC ${fatigueScore}★ | Dieta ${nutritionScore}★`,
                    },
                  },
                });
                if (success) {
                  reward(25);
                  setIsNightCheckinOpen(false);
                  showScheduleToast('🌙 Check-in noturno registrado! Algoritmo de recuperação calibrado.');
                }
              }}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs sm:text-sm py-2.5 rounded-xl cursor-pointer"
            >
              Registrar Check-in & Calibrar Volume
            </Button>
          </div>
        </div>
      )}

      {/* 7. ANIMAÇÃO DE PARTÍCULAS DOURADAS & BANNER DE NOVO PR */}
      <PRConfetti
        active={!!prCelebration?.show}
        onFinish={() => setPrCelebration(null)}
      />

      {prCelebration?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="panel max-w-sm w-full p-6 text-center space-y-4 border-2 border-primary shadow-2xl bg-gradient-to-b from-card to-background">
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary animate-bounce">
              <Trophy size={36} />
            </div>

            <div>
              <span className="rounded bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
                Recorde Pessoal Batido
              </span>
              <h3 className="text-2xl font-black text-foreground mt-2">
                🏆 NOVO PR!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Você superou sua marca histórica em <strong>{prCelebration.exerciseName}</strong>!
              </p>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 space-y-1">
              <div className="text-lg font-black font-mono text-primary">
                {prCelebration.weight}kg × {prCelebration.reps} reps
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                Tonelagem da série: <strong className="text-foreground">{prCelebration.tonnage} kg</strong>
              </div>
            </div>

            <div className="text-xs font-bold text-primary flex items-center justify-center gap-1">
              <Sparkles size={14} /> +50 XP Ganho de Sobrecarga!
            </div>

            <Button
              onClick={() => setPrCelebration(null)}
              className="w-full bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90"
            >
              Continuar o Treino 💪
            </Button>
          </div>
        </div>
      )}

      {/* 8. MODAL DE CONFIGURAÇÃO COMPLETA DA AGENDA SEMANAL */}
      {isWeeklyScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="panel max-w-2xl w-full p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-primary/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    Configurar Agenda Semanal
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Defina qual treino você fará em cada dia da semana (Segunda a Domingo).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWeeklyScheduleModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground text-sm font-black"
              >
                ✕
              </button>
            </div>

            {/* Ação rápida de preenchimento automático */}
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs">
                <span className="font-black text-foreground">Distribuição Automática:</span>
                <span className="text-muted-foreground ml-1.5">
                  Preencher os dias usando a rotina ativa <strong>{activeSplit.name}</strong>
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  handleApplySplitToWeek();
                }}
                className="text-xs font-black border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-1.5"
              >
                <Zap size={14} /> Aplicar "{activeSplit.name}" na Semana
              </Button>
            </div>

            {/* Lista dos 7 Dias da Semana */}
            <div className="space-y-3">
              {weeklySchedule.map((day, idx) => {
                const isToday = DAYS_OF_WEEK[idx]?.dayIndex === todayDayIndex;
                const isKnown = (splits || []).some(s => (s?.workouts || []).some(w => w?.title === day?.workoutTitle)) ||
                  ['Descanso / Recuperação', 'Descanso / Recuperação Ativa', 'Cardio & Mobilidade', 'Treino Livre / Aeróbico'].includes(day?.workoutTitle || '');

                return (
                  <div
                    key={day.dayOfWeek}
                    className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isToday
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border/70 bg-card/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <span className="font-mono text-xs font-black uppercase text-primary">
                        {day.shortDay}
                      </span>
                      <span className="font-black text-xs text-foreground">
                        {day.dayOfWeek}
                      </span>
                      {isToday && (
                        <span className="rounded bg-primary text-primary-foreground px-1.5 py-0.2 text-[8px] font-black uppercase">
                          HOJE
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={day.workoutTitle}
                        onChange={(e) => handleUpdateScheduleDay(idx, e.target.value)}
                        className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-2 text-xs font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        {!isKnown && (
                          <option value={day.workoutTitle}>
                            ★ {day.workoutTitle}
                          </option>
                        )}
                        {(splits || []).map((s) => (
                          <optgroup key={s.id} label={`Rotina: ${s.name}`}>
                            {(s?.workouts || []).map((w) => (
                              <option key={w.id} value={w.title}>
                                {w.title}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <optgroup label="Descanso & Outros">
                          <option value="Descanso / Recuperação">Descanso / Recuperação</option>
                          <option value="Descanso / Recuperação Ativa">Descanso / Recuperação Ativa</option>
                          <option value="Cardio & Mobilidade">Cardio & Mobilidade</option>
                          <option value="Treino Livre / Aeróbico">Treino Livre / Aeróbico</option>
                        </optgroup>
                      </select>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          handleSelectDay(day);
                          setIsWeeklyScheduleModalOpen(false);
                        }}
                        className="text-xs font-bold text-muted-foreground hover:text-primary whitespace-nowrap"
                        title="Carregar exercícios deste dia para a tela principal"
                      >
                        Carregar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                As alterações são salvas automaticamente no seu navegador.
              </span>
              <Button
                onClick={() => {
                  showScheduleToast('✓ Agenda semanal salva com sucesso!');
                  setIsWeeklyScheduleModalOpen(false);
                }}
                className="bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 px-5"
              >
                ✓ Concluir Edição
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL RÁPIDO PARA EDITAR UM DIA ESPECÍFICO */}
      {editingDayModalIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="panel max-w-md w-full p-5 space-y-4 border border-primary/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                <Edit3 size={16} className="text-primary" />
                Configurar {DAYS_OF_WEEK[editingDayModalIndex]?.full}
              </h3>
              <button
                type="button"
                onClick={() => setEditingDayModalIndex(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-black"
              >
                ✕
              </button>
            </div>

            {/* Sugestões Rápidas de 1 Toque */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Escolha Rápida (1 Toque):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(activeSplit?.workouts || []).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      handleUpdateScheduleDay(editingDayModalIndex, w.title);
                      setEditingDayModalIndex(null);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border transition-all ${
                      weeklySchedule[editingDayModalIndex]?.workoutTitle === w.title
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border/70 bg-card hover:border-primary/50 text-foreground'
                    }`}
                  >
                    {w.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateScheduleDay(editingDayModalIndex, 'Descanso / Recuperação');
                    setEditingDayModalIndex(null);
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border transition-all ${
                    weeklySchedule[editingDayModalIndex]?.workoutTitle === 'Descanso / Recuperação'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/70 bg-card hover:border-primary/50 text-foreground'
                  }`}
                >
                  Descanso
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateScheduleDay(editingDayModalIndex, 'Cardio & Mobilidade');
                    setEditingDayModalIndex(null);
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border transition-all ${
                    weeklySchedule[editingDayModalIndex]?.workoutTitle === 'Cardio & Mobilidade'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/70 bg-card hover:border-primary/50 text-foreground'
                  }`}
                >
                  Cardio
                </button>
              </div>
            </div>

            {/* Ou Escrever Nome Personalizado Livre */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Ou digite um nome personalizado:
              </span>
              <input
                type="text"
                placeholder="Ex: Treino de Braços, Futebol, Natação..."
                value={customDayWorkoutText}
                onChange={(e) => setCustomDayWorkoutText(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDayModalIndex(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (customDayWorkoutText.trim()) {
                    handleUpdateScheduleDay(editingDayModalIndex, customDayWorkoutText.trim());
                  }
                  setEditingDayModalIndex(null);
                }}
                className="bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90"
              >
                Salvar Dia
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 JANELA EXTRA MODAL: CALCULADORA CIENTÍFICA DE MRV / VOLUME SEMANAL     */}
      {/* ========================================================================= */}
      {isMrvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border-2 border-[#00E5FF]/40 bg-[#12151c] max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232733] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#00E5FF]/15 text-[#00E5FF]">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Calculadora de Volume Semanal (MEV / MAV / MRV)
                  </h3>
                  <p className="text-xs text-[#8F9BBA]">
                    Monitoramento dinâmico das Working Sets semanais por grupamento muscular.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMrvModalOpen(false)}
                className="size-8 rounded-xl bg-[#1b202c] hover:bg-[#232733] text-[#8F9BBA] hover:text-white flex items-center justify-center font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-[#232733] bg-[#0c0e13] p-3 text-xs text-[#8F9BBA] space-y-1">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="size-2 rounded-full bg-[#00E5FF]" />
                Legenda de Referência Científica:
              </div>
              <p>• <strong>MEV:</strong> Volume Mínimo Efetivo (estímulo limiar para hipertrofia).</p>
              <p>• <strong>MAV:</strong> Volume Adaptativo Ótimo (faixa ideal de crescimento acelerado).</p>
              <p>• <strong>MRV:</strong> Volume Máximo Recuperável (teto biológico; acima gera fadiga extrema).</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {activeMusclesInSession.map((item) => {
                const isSafe = item.effectiveWorkingSets <= item.landmarks.mrv;
                const isBelowMev = item.effectiveWorkingSets < item.landmarks.mev;
                return (
                  <div key={item.muscle} className="rounded-xl border border-[#232733] bg-[#0F1115] p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{item.muscle}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        !isSafe 
                          ? 'bg-destructive/20 text-destructive border border-destructive/40' 
                          : isBelowMev 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30'
                      }`}>
                        {item.statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8F9BBA]">
                      <span>Alocadas: <strong className="text-white font-bold">{item.effectiveWorkingSets}</strong> séries</span>
                      <span>Zona Segura: {item.landmarks.mev} - {item.landmarks.mrv}</span>
                    </div>

                    <div className="h-2 w-full bg-[#1b202c] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          !isSafe ? 'bg-destructive' : isBelowMev ? 'bg-amber-400' : 'bg-[#00E5FF]'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((item.effectiveWorkingSets / item.landmarks.mrv) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#232733]">
              <Button
                onClick={() => setIsMrvModalOpen(false)}
                className="bg-[#00E5FF] text-black font-black text-xs hover:bg-[#00E5FF]/90 px-5 rounded-xl cursor-pointer"
              >
                Concluir Análise
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💻 PARTE 1.1: TELA DE LOGIN ADM (COACH / BACKOFFICE)                     */}
      {/* ========================================================================= */}
      {isAdminPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="max-w-sm w-full rounded-2xl border border-[#232733] bg-[#0F1115] p-5 sm:p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-[#232733] pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#FFD600]/20 text-[#FFD600] flex items-center justify-center">
                  <Lock size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">
                    Painel Administrativo
                  </h3>
                  <span className="text-[10px] text-[#8F9BBA]">Coach / ADM Backoffice</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPinModalOpen(false)}
                className="text-[#8F9BBA] hover:text-white text-xs font-black p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8F9BBA] leading-relaxed">
              Área restrita por autenticação JWT para montagem de fichas, configuração de técnicas avançadas e prescrição de treino.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyAdminLogin();
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-[#8F9BBA] block mb-1">
                  E-mail ou Usuário:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={adminUserInput}
                  onChange={(e) => {
                    setAdminUserInput(e.target.value);
                    if (adminAuthError) setAdminAuthError(false);
                  }}
                  placeholder="coach@niflheim.fit ou admin"
                  className="w-full rounded-xl border border-[#232733] bg-[#161920] px-3 py-2 text-xs font-bold text-white focus:border-[#FFD600] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8F9BBA] block mb-1">
                  Senha de Acesso:
                </label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (adminAuthError) setAdminAuthError(false);
                  }}
                  placeholder="Senha (padrão: 1234 ou admin)"
                  className={`w-full rounded-xl border bg-[#161920] px-3 py-2 text-xs font-mono font-bold text-white focus:border-[#FFD600] focus:outline-none ${
                    adminAuthError ? 'border-destructive ring-1 ring-destructive' : 'border-[#232733]'
                  }`}
                />
                {adminAuthError && (
                  <span className="text-[10px] font-bold text-destructive block mt-1">
                    Credenciais inválidas. Tente admin / 1234.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminPinModalOpen(false)}
                  className="flex-1 rounded-xl border border-[#232733] bg-[#161920] text-xs font-bold text-[#8F9BBA] hover:text-white py-2.5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#FFD600] text-[#0F1115] hover:bg-[#FFD600]/90 text-xs font-black py-2.5 shadow-lg shadow-[#FFD600]/20 transition-all active:scale-95"
                >
                  Entrar no Painel Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
