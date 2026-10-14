import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
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
  EyeOff
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
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Treinos & Hipertrofia Avançada' },
      { name: 'description', content: 'Divisão semanal (Segunda a Domingo), sobrecarga progressiva, cluster sets e controle de volume MEV/MRV.' },
    ],
  }),
  component: TreinosPage,
});

export interface ExerciseItem {
  id: string;
  name: string;
  muscle: MuscleGroup;
  category: BiomechanicalCategory;
  equipment: string;
  targetWeightKg?: number; // Carga programada/meta
  targetReps?: number;     // Repetições programadas/meta
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

const DAYS_OF_WEEK: { full: string; short: string; dayIndex: number }[] = [
  { full: 'Segunda-feira', short: 'SEG', dayIndex: 1 },
  { full: 'Terça-feira', short: 'TER', dayIndex: 2 },
  { full: 'Quarta-feira', short: 'QUA', dayIndex: 3 },
  { full: 'Quinta-feira', short: 'QUI', dayIndex: 4 },
  { full: 'Sexta-feira', short: 'SEX', dayIndex: 5 },
  { full: 'Sábado', short: 'SÁB', dayIndex: 6 },
  { full: 'Domingo', short: 'DOM', dayIndex: 0 },
];

const EXERCISE_LIBRARY: Omit<ExerciseItem, 'sets'>[] = [
  // PUSH
  { id: 'ex-1', name: 'Supino Reto com Barra', muscle: 'Peito', category: 'Push', equipment: 'Barra', targetWeightKg: 80, targetReps: 8, video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', description: 'Escápulas retraídas, arco torácico neutro, desça até o esterno.' },
  { id: 'ex-2', name: 'Supino Inclinado com Halteres', muscle: 'Peito', category: 'Push', equipment: 'Halteres', targetWeightKg: 28, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', description: 'Banco a 30-45 graus, controle a fase excêntrica de 2-3s.' },
  { id: 'ex-3', name: 'Crucifixo Inclinado na Polia', muscle: 'Peito', category: 'Push', equipment: 'Polia', targetWeightKg: 15, targetReps: 12, video_url: 'https://www.youtube.com/watch?v=taI4XduLpTw', description: 'Tensão constante em todo o arco de adução dos braços.' },
  { id: 'ex-4', name: 'Desenvolvimento com Halteres', muscle: 'Ombros Anteriores', category: 'Push', equipment: 'Halteres', targetWeightKg: 22, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=qEwKCR5JCog', description: 'Cotovelos a 45º no plano escapular, empurre até extensão quase total.' },
  { id: 'ex-5', name: 'Elevação Lateral com Halteres', muscle: 'Ombros Laterais', category: 'Push', equipment: 'Halteres', targetWeightKg: 12, targetReps: 15, video_url: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', description: 'Braços ligeiramente abduzidos à frente, cotovelos lideram o movimento.' },
  { id: 'ex-6', name: 'Tríceps na Polia com Barra', muscle: 'Tríceps', category: 'Push', equipment: 'Polia', targetWeightKg: 35, targetReps: 12, video_url: 'https://www.youtube.com/watch?v=2-LAMcpzODU', description: 'Cotovelos alinhados e travados ao lado do tronco.' },
  { id: 'ex-7', name: 'Tríceps Testa com Barra W', muscle: 'Tríceps', category: 'Push', equipment: 'Barra', targetWeightKg: 30, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=d_KZxkH_4aE', description: 'Foco na cabeça longa do tríceps com extensão controlada.' },

  // PULL
  { id: 'ex-8', name: 'Puxada Frontal na Polia', muscle: 'Costas', category: 'Pull', equipment: 'Polia', targetWeightKg: 65, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', description: 'Depressão das escápulas antes de puxar os cotovelos para baixo.' },
  { id: 'ex-9', name: 'Remada Curvada com Barra', muscle: 'Costas', category: 'Pull', equipment: 'Barra', targetWeightKg: 75, targetReps: 8, video_url: 'https://www.youtube.com/watch?v=vT2GjY_Umpw', description: 'Coluna neutra, cotovelos rentes ao tronco puxando em direção ao quadril.' },
  { id: 'ex-10', name: 'Remada Unilateral com Halter', muscle: 'Costas', category: 'Pull', equipment: 'Halteres', targetWeightKg: 32, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=pYcpY20QaE8', description: 'Grande alongamento dorsal na descida e contração no topo.' },
  { id: 'ex-11', name: 'Crucifixo Invertido no Peck Deck', muscle: 'Ombros Posteriores', category: 'Pull', equipment: 'Máquina', targetWeightKg: 40, targetReps: 12, video_url: 'https://www.youtube.com/watch?v=H530fW3kWKg', description: 'Isolamento da porção posterior do deltoide.' },
  { id: 'ex-12', name: 'Rosca Direta com Barra W', muscle: 'Bíceps', category: 'Pull', equipment: 'Barra', targetWeightKg: 16, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', description: 'Supinação mantida, contração de pico no topo sem elevar os cotovelos.' },
  { id: 'ex-13', name: 'Rosca Inclinada com Halteres', muscle: 'Bíceps', category: 'Pull', equipment: 'Halteres', targetWeightKg: 14, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=soxrZlIl35U', description: 'Alongamento máximo da cabeça longa do bíceps.' },

  // LEGS
  { id: 'ex-14', name: 'Agachamento Livre com Barra', muscle: 'Quadríceps', category: 'Legs', equipment: 'Barra', targetWeightKg: 100, targetReps: 8, video_url: 'https://www.youtube.com/watch?v=ultWZbUMPL8', description: 'Pés na largura dos ombros, profundidade abaixo da paralela.' },
  { id: 'ex-15', name: 'Leg Press 45º', muscle: 'Quadríceps', category: 'Legs', equipment: 'Máquina', targetWeightKg: 200, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', description: 'Costas bem apoiadas, amplitude máxima sem retroversão pélvica.' },
  { id: 'ex-16', name: 'Cadeira Extensora', muscle: 'Quadríceps', category: 'Legs', equipment: 'Máquina', targetWeightKg: 55, targetReps: 12, video_url: 'https://www.youtube.com/watch?v=YyvSfVADMvc', description: 'Excelente para técnicas de alta intensidade como Myo-Reps e Drops.' },
  { id: 'ex-17', name: 'Mesa Flexora', muscle: 'Isquiotibiais', category: 'Legs', equipment: 'Máquina', targetWeightKg: 45, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', description: 'Quadril colado no banco, controle a fase excêntrica.' },
  { id: 'ex-18', name: 'Stiff com Barra', muscle: 'Isquiotibiais', category: 'Legs', equipment: 'Barra', targetWeightKg: 80, targetReps: 8, video_url: 'https://www.youtube.com/watch?v=1uDiW5--rAE', description: 'Hinge de quadril, joelhos levemente destravados, coluna reta.' },
  { id: 'ex-19', name: 'Elevação Pélvica com Barra', muscle: 'Glúteos', category: 'Legs', equipment: 'Barra', targetWeightKg: 110, targetReps: 10, video_url: 'https://www.youtube.com/watch?v=SEdqd1n0cvg', description: 'Pausa de 1 segundo de contração máxima no topo.' },
  { id: 'ex-20', name: 'Gêmeos Sentado', muscle: 'Panturrilhas', category: 'Legs', equipment: 'Máquina', targetWeightKg: 45, targetReps: 15, video_url: 'https://www.youtube.com/watch?v=JbyjNymZOt0', description: 'Foco no músculo sóleo, pausa de 2 segundos no ponto de máximo alongamento.' },
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

function TreinosPage() {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();
  const todayDayIndex = new Date().getDay(); // 0 = Domingo, 1 = Segunda...

  // Modo de visualização: 'FAZER' (Visão do Usuário / Estilo Hevy) vs 'MONTAR' (Painel do Administrador)
  const [workoutMode, setWorkoutMode] = useState<'FAZER' | 'MONTAR'>('FAZER');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY) === 'true';
    }
    return false;
  });
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [adminUserInput, setAdminUserInput] = useState('coach@niflheim.fit');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);
  const [programMuscleGroups, setProgramMuscleGroups] = useState('Peitoral, Ombro e Tríceps');

  // Questionário Pop-up Pós-Treino (Recovery & MRV)
  const [recoveryPse, setRecoveryPse] = useState<'LEVE' | 'MODERADO' | 'FALHA'>('MODERADO');
  const [recoverySleep, setRecoverySleep] = useState<'RUIM' | 'REGULAR' | 'REPARADOR'>('REGULAR');
  const [recoveryJointPain, setRecoveryJointPain] = useState<'SIM' | 'NAO'>('NAO');

  const [expandedTipsId, setExpandedTipsId] = useState<string | null>(null);
  const [isVolumeTrackerExpanded, setIsVolumeTrackerExpanded] = useState(false);

  // Rotinas e Divisões
  const [splits, setSplits] = useState<WorkoutSplit[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SPLITS_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_SPLITS;
  });

  const [activeSplitId, setActiveSplitId] = useState<string>('split-ppl');
  const activeSplit = useMemo(() => {
    return splits.find((s) => s.id === activeSplitId) ?? splits[0] ?? DEFAULT_SPLITS[0];
  }, [splits, activeSplitId]);

  // Agenda Semanal (Segunda a Domingo)
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleDay[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SCHEDULE_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return [
      { dayOfWeek: 'Segunda-feira', shortDay: 'SEG', workoutTitle: 'Pull A — Densidade Dorsal & Bíceps', workoutId: 'ppl-pull' },
      { dayOfWeek: 'Terça-feira', shortDay: 'TER', workoutTitle: 'Push A — Hipertrofia & Força', workoutId: 'ppl-push' },
      { dayOfWeek: 'Quarta-feira', shortDay: 'QUA', workoutTitle: 'Legs A — Quadríceps & Isquiotibiais', workoutId: 'ppl-legs' },
      { dayOfWeek: 'Quinta-feira', shortDay: 'QUI', workoutTitle: 'Descanso / Recuperação Ativa' },
      { dayOfWeek: 'Sexta-feira', shortDay: 'SEX', workoutTitle: 'Push A — Hipertrofia & Força', workoutId: 'ppl-push' },
      { dayOfWeek: 'Sábado', shortDay: 'SÁB', workoutTitle: 'Pull A — Densidade Dorsal & Bíceps', workoutId: 'ppl-pull' },
      { dayOfWeek: 'Domingo', shortDay: 'DOM', workoutTitle: 'Descanso / Recuperação' },
    ];
  });

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
            return parsed.exercises;
          }
        }
      } catch (e) {}
    }
    const tpl = DEFAULT_SPLITS[0].workouts[0];
    return tpl.exercises.map((item) => {
      const lib = EXERCISE_LIBRARY.find((e) => e.id === item.exerciseId)!;
      return {
        ...lib,
        targetWeightKg: item.targetWeightKg ?? lib.targetWeightKg,
        targetReps: item.targetReps ?? lib.targetReps,
        sets: item.sets,
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
  const [customTargetWeight, setCustomTargetWeight] = useState<number>(40);
  const [customTargetReps, setCustomTargetReps] = useState<number>(10);

  // Agenda Semanal - Modais e Notificações
  const [isWeeklyScheduleModalOpen, setIsWeeklyScheduleModalOpen] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null);
  const [editingDayModalIndex, setEditingDayModalIndex] = useState<number | null>(null);
  const [customDayWorkoutText, setCustomDayWorkoutText] = useState('');

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
  const [lastRestTriggerSource, setLastRestTriggerSource] = useState<string>('Série Concluída');

  // Modal Pós-Treino
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [pse, setPse] = useState(8);
  const [duration, setDuration] = useState(55);

  // Modal Check-in Noturno
  const [isNightCheckinOpen, setIsNightCheckinOpen] = useState(false);
  const [sleepScore, setSleepScore] = useState(4);
  const [domsScore, setDomsScore] = useState(3);
  const [fatigueScore, setFatigueScore] = useState(3);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 400]);
            }
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.3);
            } catch (e) {}
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, restTime]);

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
    setRestTime(seconds);
    setTimerActive(true);
    setLastRestTriggerSource(source);
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

  const handleAddWorkingSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const newSet: AdvancedSetRowData = {
          id: crypto.randomUUID(),
          setNumber: ex.sets.length + 1,
          baseType: 'WORKING',
          technique: 'NONE',
          targetWeight: ex.targetWeightKg ?? last?.weight ?? 40,
          targetReps: ex.targetReps ?? last?.reps ?? 10,
          weight: last?.weight ?? ex.targetWeightKg ?? 40,
          reps: last?.reps ?? ex.targetReps ?? 10,
          rir: 2,
          previousWeight: last?.weight ?? 40,
          previousReps: last?.reps ?? 10,
          completed: false,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
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

  // Carregar Treino Selecionado
  const handleLoadWorkout = (workout: WorkoutTemplateItem) => {
    setSessionTitle(workout.title);
    setSessionCategory(workout.category);
    const loaded = workout.exercises.map((item) => {
      const lib = EXERCISE_LIBRARY.find((e) => e.id === item.exerciseId) ?? {
        id: item.exerciseId,
        name: 'Exercício Personalizado',
        muscle: 'Peito' as MuscleGroup,
        category: workout.category,
        equipment: 'Livre',
        targetWeightKg: item.targetWeightKg ?? 40,
        targetReps: item.targetReps ?? 10,
        description: '',
      };
      return {
        ...lib,
        targetWeightKg: item.targetWeightKg ?? lib.targetWeightKg,
        targetReps: item.targetReps ?? lib.targetReps,
        sets: item.sets.map((s) => ({ ...s, completed: false })),
      };
    });
    setExercises(loaded);
  };

  // Alterar associação da semana com busca em todos os splits e sincronização imediata
  const handleUpdateScheduleDay = (dayIndex: number, workoutTitle: string) => {
    let matchedWorkout: WorkoutTemplateItem | undefined;
    for (const s of splits) {
      const found = s.workouts.find((w) => w.title === workoutTitle);
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
        workoutId: matchedWorkout?.id,
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

  // Adicionar da Biblioteca com Carga Meta
  const handleAddFromLibrary = (libEx: Omit<ExerciseItem, 'sets'>) => {
    const newEx: ExerciseItem = {
      ...libEx,
      id: crypto.randomUUID(),
      targetWeightKg: customTargetWeight || libEx.targetWeightKg || 40,
      targetReps: customTargetReps || libEx.targetReps || 10,
      sets: [
        {
          id: crypto.randomUUID(),
          setNumber: 1,
          baseType: 'WARMUP',
          technique: 'NONE',
          weight: Math.round((customTargetWeight || 40) * 0.5),
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
  };

  // Adicionar Personalizado Livre
  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    const newEx: ExerciseItem = {
      id: crypto.randomUUID(),
      name: customExerciseName.trim(),
      muscle: customExerciseMuscle,
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
    setIsAddExerciseModalOpen(false);
  };

  // Salvar Treino na Rotina
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
    alert(`Treino "${sessionTitle}" salvo com sucesso na rotina!`);
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
    await save({
      table: 'fatigue_logs',
      record: {
        id: crypto.randomUUID(),
        day: today,
        details: {
          sleep: sleepScoreMap[recoverySleep],
          doms: jointScoreMap[recoveryJointPain],
          fatigue: pseScoreMap[recoveryPse],
          note: `Sessão: ${sessionTitle} | Sono: ${recoverySleep} | Articulações: ${recoveryJointPain}`,
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
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5 sm:pb-3">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-sm sm:text-base font-black text-foreground truncate tracking-tight">
                        {exIndex + 1}. {ex.name}
                      </span>
                      {allSetsDone && (
                        <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-0.5 shrink-0">
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

                  {/* Rodapé do Exercício: Adicionar Série Rápida */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <button
                      type="button"
                      onClick={() => handleAddWorkingSet(ex.id)}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 py-1 px-2.5 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <Plus size={13} /> + Adicionar Série
                    </button>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {completedCount} de {ex.sets.length} concluídas
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
          {/* Banner Exclusivo do Administrador */}
          <div className="rounded-2xl border-2 border-primary/60 bg-gradient-to-r from-primary/15 via-card to-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-md shrink-0">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  Área do Treinador / Prescrição
                </span>
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  Painel de Montagem de Treinos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure as rotinas, adicione exercícios, defina metas de carga e organize a semana de Seg a Dom.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWorkoutMode('FAZER')}
                className="text-xs font-bold border-primary/50 text-primary hover:bg-primary/10 rounded-xl"
              >
                <Eye size={13} className="mr-1" /> Ver como Aluno
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleLockAdmin}
                className="text-xs font-bold text-muted-foreground hover:text-destructive rounded-xl"
              >
                <Lock size={13} className="mr-1" /> Bloquear
              </Button>
            </div>
          </div>

          {/* 1. GESTOR DE ROTINAS (PPL, ABC, ETC.) */}
          <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 mr-2">
                  <Layers size={14} className="text-primary" /> Rotinas:
                </span>
                {splits.map((s) => (
                  <div key={s.id} className="relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveSplitId(s.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        activeSplit.id === s.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {s.name}
                    </button>
                    {splits.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSplit(s.id);
                        }}
                        title={`Excluir rotina ${s.name}`}
                        className="ml-1 p-1 rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreateSplitModalOpen(true)}
                  className="text-xs border-dashed rounded-xl"
                >
                  <FolderPlus size={13} className="text-primary" /> + Nova Rotina
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveCurrentWorkoutToSplit}
                  className="text-xs text-primary font-bold hover:bg-primary/10 rounded-xl"
                >
                  <Save size={13} /> Salvar Treino na Rotina
                </Button>
              </div>
            </div>
          </div>

          {/* 2. AGENDA SEMANAL DE SEGUNDA A DOMINGO (PAINEL COMPLETO DO ADMIN) */}
          <div className="rounded-2xl border border-border bg-card/70 p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                    Divisão Semanal Prescrita (Segunda a Domingo)
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                    Escolha qual treino o aluno fará em cada dia da semana.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsWeeklyScheduleModalOpen(true)}
                  className="text-xs font-black gap-1.5 border-primary/50 text-primary hover:bg-primary/15 shadow-sm rounded-xl"
                >
                  <SlidersHorizontal size={13} /> Configurar Detalhado
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleApplySplitToWeek}
                  className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl"
                  title={`Distribuir treinos da rotina ${activeSplit.name} de Seg a Dom`}
                >
                  <Zap size={13} className="text-primary" /> Distribuir "{activeSplit.name}"
                </Button>
              </div>
            </div>

            {/* 7 Dias da Semana em Grade para Edição do Admin */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {weeklySchedule.map((day, idx) => {
                const isLoaded = sessionTitle === day.workoutTitle;
                const isKnownOption = splits.some((s) => s.workouts.some((w) => w.title === day.workoutTitle)) ||
                  ['Descanso / Recuperação', 'Descanso / Recuperação Ativa', 'Cardio & Mobilidade', 'Treino Livre / Aeróbico'].includes(day.workoutTitle);

                return (
                  <div
                    key={day.dayOfWeek}
                    className={`rounded-2xl border p-2.5 sm:p-3 transition-all flex flex-col justify-between min-w-0 overflow-hidden ${
                      isLoaded ? 'border-primary/60 bg-card/95 ring-1 ring-primary/40' : 'border-border/60 bg-background/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-black uppercase text-muted-foreground">
                          {day.shortDay}
                        </span>
                        {isLoaded && (
                          <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[8px] font-black uppercase">
                            EDITANDO
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-xs mt-1 truncate text-foreground" title={day.workoutTitle}>
                        {day.workoutTitle}
                      </h4>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-border/40 space-y-1.5 min-w-0">
                      <select
                        value={day.workoutTitle}
                        onChange={(e) => handleUpdateScheduleDay(idx, e.target.value)}
                        className="w-full min-w-0 max-w-full rounded-xl border border-border/80 bg-card px-2 py-1 text-[10px] font-black text-foreground focus:border-primary truncate cursor-pointer shadow-inner"
                      >
                        {!isKnownOption && (
                          <option value={day.workoutTitle}>
                            ★ {day.workoutTitle}
                          </option>
                        )}
                        {splits.map((s) => (
                          <optgroup key={s.id} label={`Rotina: ${s.name}`}>
                            {s.workouts.map((w) => (
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

                      <button
                        type="button"
                        onClick={() => {
                          setEditingDayModalIndex(idx);
                          setCustomDayWorkoutText(day.workoutTitle);
                        }}
                        className="flex items-center justify-center gap-1 w-full rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/20 hover:text-primary py-1 text-[9px] font-bold text-muted-foreground transition-colors"
                      >
                        <Edit3 size={10} /> Personalizar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. CABEÇALHO DO PROGRAMA (COACH STUDIO) */}
          <div className="panel p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-primary mb-1">
                  Nome do Treino (ex: Push A - Hipertrofia Focada)
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground focus:border-primary"
                  placeholder="Ex: Push A - Hipertrofia Focada"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#00E5FF] mb-1">
                  Grupamentos Principais (ex: Peitoral, Ombro e Tríceps)
                </label>
                <input
                  type="text"
                  value={programMuscleGroups}
                  onChange={(e) => setProgramMuscleGroups(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground focus:border-[#00E5FF]"
                  placeholder="Ex: Peitoral, Ombro e Tríceps"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                size="sm"
                onClick={() => setIsAddExerciseModalOpen(true)}
                className="bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs flex items-center gap-1.5 cursor-pointer rounded-xl"
              >
                <Plus size={14} /> + Adicionar Exercício
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveCurrentWorkoutToSplit}
                className="text-xs text-primary font-bold border-primary/40 hover:bg-primary/10 rounded-xl"
              >
                <Save size={13} className="mr-1" /> Salvar Treino
              </Button>
            </div>
          </div>

          {/* 4. TEMPOS DE DESCANSO AUTOMÁTICOS DA SESSÃO */}
          <div className="rounded-2xl border border-primary/30 bg-card/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Clock size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-foreground">
                  Descansos Automáticos Prescritos
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Tempo que dispara automaticamente ao aluno concluir a série.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground">Aquecimento:</span>
                <input
                  type="number"
                  min="10"
                  max="300"
                  step="5"
                  value={restWarmupSeconds}
                  onChange={(e) => setRestWarmupSeconds(Math.max(10, parseInt(e.target.value) || 60))}
                  className="w-14 rounded-xl border border-border bg-background px-1 py-1 text-center font-mono text-xs font-black"
                />
                <span className="text-[10px] text-muted-foreground">s</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-primary">Trabalho:</span>
                <input
                  type="number"
                  min="30"
                  max="600"
                  step="10"
                  value={restWorkingSeconds}
                  onChange={(e) => setRestWorkingSeconds(Math.max(30, parseInt(e.target.value) || 120))}
                  className="w-14 rounded-xl border border-primary bg-background px-1 py-1 text-center font-mono text-xs font-black text-primary"
                />
                <span className="text-[10px] text-muted-foreground">s</span>
              </div>
            </div>
          </div>

          {/* 5. LISTA DE EXERCÍCIOS PARA EDIÇÃO AVANÇADA DO ADMINISTRADOR */}
          <div className="space-y-6">
            {exercises.map((ex, exIndex) => {
              const preparatorySets = ex.sets.filter((s) => s.baseType === 'WARMUP' || s.baseType === 'FEEDER' || s.baseType === 'PAP');
              const workingSets = ex.sets.filter((s) => s.baseType === 'WORKING' || s.baseType === 'BACKOFF');

              return (
                <div key={ex.id} className="panel p-4 md:p-6 transition-all space-y-4">
                  {/* Header do Exercício */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-black text-foreground">
                          #{exIndex + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            disabled={exIndex === 0}
                            onClick={() => handleMoveExercise(exIndex, 'up')}
                            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            disabled={exIndex === exercises.length - 1}
                            onClick={() => handleMoveExercise(exIndex, 'down')}
                            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-foreground truncate max-w-[170px] xs:max-w-[240px] sm:max-w-none">
                            {ex.name}
                          </h3>
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary shrink-0">
                            {ex.muscle}
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
                            className="w-full min-w-0 rounded-xl border border-border/80 bg-background px-2 py-1 text-xs text-foreground font-mono focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="size-7 text-muted-foreground hover:text-destructive rounded-xl"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Configuração de Carga Meta e Reps Meta */}
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Target size={13} /> Metas Prescritas:
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

                  {/* Séries Preparatórias e de Trabalho */}
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
                            className="text-[10px] h-6 px-2 text-muted-foreground border border-dashed rounded-lg"
                          >
                            + Aquecimento
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddPreparatorySet(ex.id, 'FEEDER')}
                            className="text-[10px] h-6 px-2 text-amber-500 border border-dashed border-amber-500/40 rounded-lg"
                          >
                            + Feeder
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddPreparatorySet(ex.id, 'PAP')}
                            className="text-[10px] h-6 px-2 text-cyan-400 border border-dashed border-cyan-500/40 rounded-lg"
                          >
                            + PAP
                          </Button>
                        </div>
                      </div>

                      {preparatorySets.map((set) => (
                        <AdvancedSetRow
                          key={set.id}
                          data={set}
                          mode="PLAN"
                          restWarmupSeconds={restWarmupSeconds}
                          restWorkingSeconds={restWorkingSeconds}
                          onUpdate={(updated) => handleUpdateSet(ex.id, updated)}
                          onDelete={() => handleDeleteSet(ex.id, set.id)}
                          onTriggerRestTimer={(seconds) => triggerFloatingTimer(seconds, `${ex.name} - Preparação`)}
                        />
                      ))}
                    </div>

                    {/* Séries de Trabalho */}
                    <div className="rounded-2xl border border-primary/30 bg-card/60 p-3 sm:p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-primary flex items-center gap-1.5">
                          <Flame size={14} className="text-primary" /> Séries de Trabalho Efetivas
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddWorkingSet(ex.id)}
                          className="text-xs border-dashed text-primary border-primary/40 rounded-lg"
                        >
                          <Plus size={12} className="mr-1" /> + Série
                        </Button>
                      </div>

                      {workingSets.map((set, wIdx) => (
                        <AdvancedSetRow
                          key={set.id}
                          data={{
                            ...set,
                            targetWeight: set.targetWeight ?? ex.targetWeightKg,
                            targetReps: set.targetReps ?? ex.targetReps,
                          }}
                          mode="PLAN"
                          workingIndex={wIdx + 1}
                          restWarmupSeconds={restWarmupSeconds}
                          restWorkingSeconds={restWorkingSeconds}
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
            })}
          </div>

          {/* ========================================================================= */}
          {/* MÉTRICAS DO MICROCICLO (CALCULADORA DE MRV NO COACH STUDIO)              */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-[#232733] bg-[#161920] p-4 sm:p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#00E5FF]" />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">
                  Métricas do Microciclo (Calculadora de MRV Semanal)
                </h3>
              </div>
              <span className="text-[10px] text-[#8F9BBA]">
                Limites: MEV (Mínimo) a MRV (Máximo Recuperável)
              </span>
            </div>

            <p className="text-xs text-[#8F9BBA]">
              Somatório dinâmico das Working Sets alocadas por músculo para alertar se o volume prescrito está dentro do intervalo seguro para o aluno.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {activeMusclesInSession.map((item) => {
                const isSafe = item.effectiveWorkingSets <= item.landmarks.mrv;
                const isBelowMev = item.effectiveWorkingSets < item.landmarks.mev;
                return (
                  <div key={item.muscle} className="rounded-xl border border-[#232733] bg-[#0F1115] p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.muscle}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                        !isSafe 
                          ? 'bg-destructive/20 text-destructive' 
                          : isBelowMev 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                      }`}>
                        {item.statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8F9BBA]">
                      <span>Alocadas: <strong className="text-white">{item.effectiveWorkingSets}</strong> séries</span>
                      <span>Zona: {item.landmarks.mev} - {item.landmarks.mrv}</span>
                    </div>

                    <div className="h-1.5 w-full bg-[#161920] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          !isSafe ? 'bg-destructive' : 'bg-[#00E5FF]'
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
          </div>

          {/* AÇÃO FINAL DO COACH: PUBLICAR / ATUALIZAR TREINO NA CONTA DO ALUNO */}
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
                className="text-xs border-[#232733] text-[#8F9BBA] hover:text-white rounded-xl"
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

            {/* Criar / Colar Exercício Rápido */}
            <div className="rounded-xl border border-border/80 bg-background/60 p-3 space-y-2">
              <span className="text-[11px] font-bold uppercase text-primary block">
                + Criar Exercício Rápido Personalizado
              </span>
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
                  {(Object.keys(MUSCLE_VOLUME_LANDMARKS) as MuscleGroup[]).map((m) => (
                    <option key={m} value={m}>{m}</option>
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{libEx.name}</span>
                        <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] font-bold text-primary">
                          {libEx.muscle}
                        </span>
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
                1. Percepção Geral de Esforço (PSE)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'LEVE', label: 'Leve (1-3)' },
                  { value: 'MODERADO', label: 'Moderado / Desafiador (4-7)' },
                  { value: 'FALHA', label: 'Até a Falha Total (8-10)' },
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

            {/* Pergunta 2: Sono */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                2. Como foi seu sono na última noite?
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

            {/* Pergunta 3: Dores articulares */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                3. Sentiu dores articulares ou fadiga atípica?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: 'SIM', label: 'Sim, desconforto acentuado' },
                  { value: 'NAO', label: 'Não, articulações e musculatura ok' },
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
                Nenhum XP adicional concedido nesta etapa. O XP foi creditado diretamente nas Working Sets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECK-IN NOTURNO */}
      {isNightCheckinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="panel max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Moon size={18} className="text-primary" /> Check-in Noturno de Fadiga
              </h3>
              <button
                onClick={() => setIsNightCheckinOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Qualidade do Sono Passado:</span>
                <span className="text-primary font-bold">{sleepScore} ★</span>
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
                <span>Dores Musculares Tardias (DOMS):</span>
                <span className="text-primary font-bold">{domsScore} ★</span>
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
                <span>Cansaço do Sistema Nervoso Central (SNC):</span>
                <span className="text-primary font-bold">{fatigueScore} ★</span>
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

            <Button
              onClick={async () => {
                const success = await save({
                  table: 'fatigue_logs',
                  record: {
                    id: crypto.randomUUID(),
                    day: today,
                    details: { sleep: sleepScore, doms: domsScore, fatigue: fatigueScore },
                  },
                });
                if (success) {
                  reward(25);
                  setIsNightCheckinOpen(false);
                }
              }}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-sm"
            >
              Registrar Check-in & Salvar
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
                const isToday = DAYS_OF_WEEK[idx].dayIndex === todayDayIndex;
                const isKnown = splits.some(s => s.workouts.some(w => w.title === day.workoutTitle)) ||
                  ['Descanso / Recuperação', 'Descanso / Recuperação Ativa', 'Cardio & Mobilidade', 'Treino Livre / Aeróbico'].includes(day.workoutTitle);

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
                        {splits.map((s) => (
                          <optgroup key={s.id} label={`Rotina: ${s.name}`}>
                            {s.workouts.map((w) => (
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
                {activeSplit.workouts.map((w) => (
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
