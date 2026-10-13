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
  Link as LinkIcon,
  RotateCcw,
  Pause,
  Info,
  Calendar,
  Save,
  FileText,
  HelpCircle,
  FolderPlus,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';
import { localDay } from '@/lib/metrics';
import { 
  AdvancedSetRow, 
  type AdvancedSetRowData 
} from '@/components/AdvancedSetRow';
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
      { name: 'description', content: 'Montagem de sessões diárias baseadas na ciência, divisões ABC/PPL personalizáveis, séries preparatórias e de trabalho separadas, e controle de MEV/MRV.' },
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
  video_url?: string;
  description?: string;
  isSupersetWithNext?: boolean;
  sets: AdvancedSetRowData[];
}

export interface WorkoutTemplateItem {
  id: string;
  title: string;
  category: BiomechanicalCategory;
  description: string;
  exercises: {
    exerciseId: string;
    isSupersetWithNext?: boolean;
    sets: AdvancedSetRowData[];
  }[];
}

export interface WorkoutSplit {
  id: string;
  name: string; // Ex: "PPL (Push/Pull/Legs)", "ABC Tradicional", "Upper/Lower"
  description: string;
  workouts: WorkoutTemplateItem[];
}

const EXERCISE_LIBRARY: Omit<ExerciseItem, 'sets'>[] = [
  // PUSH (Peito, Ombros Ant/Lat, Tríceps)
  { id: 'ex-1', name: 'Supino Reto com Barra', muscle: 'Peito', category: 'Push', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', description: 'Escápulas retraídas, arco torácico neutro, desça até o esterno.' },
  { id: 'ex-2', name: 'Supino Inclinado com Halteres', muscle: 'Peito', category: 'Push', equipment: 'Halteres', video_url: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', description: 'Banco a 30-45 graus, controle a fase excêntrica de 2-3s.' },
  { id: 'ex-3', name: 'Crucifixo Inclinado na Polia', muscle: 'Peito', category: 'Push', equipment: 'Polia', video_url: 'https://www.youtube.com/watch?v=taI4XduLpTw', description: 'Tensão constante em todo o arco de adução dos braços.' },
  { id: 'ex-4', name: 'Desenvolvimento com Halteres', muscle: 'Ombros Anteriores', category: 'Push', equipment: 'Halteres', video_url: 'https://www.youtube.com/watch?v=qEwKCR5JCog', description: 'Cotovelos a 45º no plano escapular, empurre até extensão quase total.' },
  { id: 'ex-5', name: 'Elevação Lateral com Halteres', muscle: 'Ombros Laterais', category: 'Push', equipment: 'Halteres', video_url: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', description: 'Braços ligeiramente abduzidos à frente, cotovelos lideram o movimento.' },
  { id: 'ex-6', name: 'Tríceps na Polia com Barra', muscle: 'Tríceps', category: 'Push', equipment: 'Polia', video_url: 'https://www.youtube.com/watch?v=2-LAMcpzODU', description: 'Cotovelos alinhados e travados ao lado do tronco.' },
  { id: 'ex-7', name: 'Tríceps Testa com Barra W', muscle: 'Tríceps', category: 'Push', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=d_KZxkH_4aE', description: 'Foco na cabeça longa do tríceps com extensão controlada.' },

  // PULL (Costas, Ombros Post, Bíceps)
  { id: 'ex-8', name: 'Puxada Frontal na Polia', muscle: 'Costas', category: 'Pull', equipment: 'Polia', video_url: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', description: 'Depressão das escápulas antes de puxar os cotovelos para baixo.' },
  { id: 'ex-9', name: 'Remada Curvada com Barra', muscle: 'Costas', category: 'Pull', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=vT2GjY_Umpw', description: 'Coluna neutra, cotovelos rentes ao tronco puxando em direção ao quadril.' },
  { id: 'ex-10', name: 'Remada Unilateral com Halter', muscle: 'Costas', category: 'Pull', equipment: 'Halteres', video_url: 'https://www.youtube.com/watch?v=pYcpY20QaE8', description: 'Grande alongamento dorsal na descida e contração no topo.' },
  { id: 'ex-11', name: 'Crucifixo Invertido no Peck Deck', muscle: 'Ombros Posteriores', category: 'Pull', equipment: 'Máquina', video_url: 'https://www.youtube.com/watch?v=H530fW3kWKg', description: 'Isolamento da porção posterior do deltoide.' },
  { id: 'ex-12', name: 'Rosca Direta com Barra W', muscle: 'Bíceps', category: 'Pull', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', description: 'Supinação mantida, contração de pico no topo sem elevar os cotovelos.' },
  { id: 'ex-13', name: 'Rosca Inclinada com Halteres', muscle: 'Bíceps', category: 'Pull', equipment: 'Halteres', video_url: 'https://www.youtube.com/watch?v=soxrZlIl35U', description: 'Alongamento máximo da cabeça longa do bíceps.' },

  // LEGS (Quadríceps, Isquiotibiais, Glúteos, Panturrilhas)
  { id: 'ex-14', name: 'Agachamento Livre com Barra', muscle: 'Quadríceps', category: 'Legs', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=ultWZbUMPL8', description: 'Pés na largura dos ombros, profundidade abaixo da paralela.' },
  { id: 'ex-15', name: 'Leg Press 45º', muscle: 'Quadríceps', category: 'Legs', equipment: 'Máquina', video_url: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', description: 'Costas bem apoiadas, amplitude máxima sem retroversão pélvica.' },
  { id: 'ex-16', name: 'Cadeira Extensora', muscle: 'Quadríceps', category: 'Legs', equipment: 'Máquina', video_url: 'https://www.youtube.com/watch?v=YyvSfVADMvc', description: 'Excelente para técnicas de alta intensidade como Myo-Reps e Drops.' },
  { id: 'ex-17', name: 'Mesa Flexora', muscle: 'Isquiotibiais', category: 'Legs', equipment: 'Máquina', video_url: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', description: 'Quadril colado no banco, controle a fase excêntrica.' },
  { id: 'ex-18', name: 'Stiff com Barra', muscle: 'Isquiotibiais', category: 'Legs', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=1uDiW5--rAE', description: 'Hinge de quadril, joelhos levemente destravados, coluna reta.' },
  { id: 'ex-19', name: 'Elevação Pélvica com Barra', muscle: 'Glúteos', category: 'Legs', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=SEdqd1n0cvg', description: 'Pausa de 1 segundo de contração máxima no topo.' },
  { id: 'ex-20', name: 'Gêmeos Sentado', muscle: 'Panturrilhas', category: 'Legs', equipment: 'Máquina', video_url: 'https://www.youtube.com/watch?v=JbyjNymZOt0', description: 'Foco no músculo sóleo, pausa de 2 segundos no ponto de máximo alongamento.' },
];

// Divisões Científicas Pré-configuradas (PPL, ABC, Upper/Lower)
const DEFAULT_SPLITS: WorkoutSplit[] = [
  {
    id: 'split-ppl',
    name: 'PPL (Push / Pull / Legs)',
    description: 'Divisão biomecânica por padrão de movimento (Empurrar, Puxar, Pernas)',
    workouts: [
      {
        id: 'ppl-push',
        title: 'Push A — Hipertrofia & Força',
        category: 'Push',
        description: 'Peito, Deltóide Anterior/Medial e Tríceps com Myo-Reps e Drop-Sets',
        exercises: [
          {
            exerciseId: 'ex-1', // Supino Reto
            sets: [
              { id: 's1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 12, rir: 4, previousWeight: 40, previousReps: 12, completed: false },
              { id: 's2', setNumber: 2, baseType: 'FEEDER', technique: 'NONE', weight: 70, reps: 3, rir: 3, previousWeight: 70, previousReps: 3, completed: false },
              { id: 's3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 85, reps: 8, rir: 2, previousWeight: 82.5, previousReps: 8, completed: false },
              { id: 's4', setNumber: 4, baseType: 'BACKOFF', technique: 'NONE', weight: 75, reps: 10, rir: 1, previousWeight: 75, previousReps: 10, completed: false },
            ],
          },
          {
            exerciseId: 'ex-2', // Supino Inclinado
            sets: [
              { id: 's5', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 28, reps: 10, rir: 2, previousWeight: 26, previousReps: 10, completed: false },
              { id: 's6', setNumber: 2, baseType: 'WORKING', technique: 'DROP_SET', weight: 30, reps: 8, rir: 0, previousWeight: 28, previousReps: 8, completed: false, dropSets: [{ id: 'ds1', weight: 22, reps: 6, completed: false }] },
            ],
          },
          {
            exerciseId: 'ex-5', // Elevação Lateral
            isSupersetWithNext: true,
            sets: [
              { id: 's7', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', weight: 12, reps: 15, rir: 0, previousWeight: 12, previousReps: 14, completed: false, myoMicroSets: [{ id: 'm1', reps: 4, completed: false }, { id: 'm2', reps: 4, completed: false }, { id: 'm3', reps: 3, completed: false }] },
            ],
          },
          {
            exerciseId: 'ex-6', // Tríceps Polia
            sets: [
              { id: 's8', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 35, reps: 12, rir: 1, previousWeight: 35, previousReps: 10, completed: false },
              { id: 's9', setNumber: 2, baseType: 'WORKING', technique: 'CLUSTER_SET', weight: 40, reps: 6, rir: 0, previousWeight: 37.5, previousReps: 6, completed: false },
            ],
          },
        ],
      },
      {
        id: 'ppl-pull',
        title: 'Pull A — Densidade Dorsal & Bíceps',
        category: 'Pull',
        description: 'Costas, Deltóide Posterior e Bíceps com alta intensidade mecânica',
        exercises: [
          {
            exerciseId: 'ex-9', // Remada Curvada
            sets: [
              { id: 'p1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 10, rir: 4, previousWeight: 40, previousReps: 10, completed: false },
              { id: 'p2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', weight: 75, reps: 8, rir: 2, previousWeight: 72.5, previousReps: 8, completed: false },
              { id: 'p3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 80, reps: 6, rir: 1, previousWeight: 77.5, previousReps: 6, completed: false },
            ],
          },
          {
            exerciseId: 'ex-8', // Puxada Frontal
            sets: [
              { id: 'p4', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 60, reps: 10, rir: 2, previousWeight: 60, previousReps: 9, completed: false },
              { id: 'p5', setNumber: 2, baseType: 'WORKING', technique: 'DROP_SET', weight: 65, reps: 8, rir: 0, previousWeight: 62.5, previousReps: 8, completed: false, dropSets: [{ id: 'ds2', weight: 45, reps: 6, completed: false }] },
            ],
          },
          {
            exerciseId: 'ex-12', // Rosca Direta Barra W
            sets: [
              { id: 'p6', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', weight: 15, reps: 14, rir: 0, previousWeight: 14, previousReps: 12, completed: false, myoMicroSets: [{ id: 'mb1', reps: 4, completed: false }, { id: 'mb2', reps: 3, completed: false }] },
            ],
          },
        ],
      },
      {
        id: 'ppl-legs',
        title: 'Legs A — Quadríceps & Isquiotibiais',
        category: 'Legs',
        description: 'Agachamento, Leg Press e técnicas avançadas para membros inferiores',
        exercises: [
          {
            exerciseId: 'ex-14', // Agachamento Livre
            sets: [
              { id: 'l1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 50, reps: 10, rir: 4, previousWeight: 50, previousReps: 10, completed: false },
              { id: 'l2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', weight: 95, reps: 8, rir: 2, previousWeight: 90, previousReps: 8, completed: false },
              { id: 'l3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 100, reps: 6, rir: 1, previousWeight: 95, previousReps: 6, completed: false },
            ],
          },
          {
            exerciseId: 'ex-16', // Cadeira Extensora
            sets: [
              { id: 'l4', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', weight: 50, reps: 15, rir: 0, previousWeight: 45, previousReps: 15, completed: false, myoMicroSets: [{ id: 'lm1', reps: 5, completed: false }, { id: 'lm2', reps: 4, completed: false }] },
            ],
          },
          {
            exerciseId: 'ex-17', // Mesa Flexora
            sets: [
              { id: 'l5', setNumber: 1, baseType: 'WORKING', technique: 'DROP_SET', weight: 45, reps: 10, rir: 0, previousWeight: 42.5, previousReps: 10, completed: false, dropSets: [{ id: 'ld1', weight: 30, reps: 8, completed: false }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'split-abc',
    name: 'ABC Tradicional',
    description: 'Divisão clássica por grupamentos musculares sinérgicos',
    workouts: [
      {
        id: 'abc-a',
        title: 'Treino A — Peito & Tríceps',
        category: 'Push',
        description: 'Foco em força no peitoral e sobrecarga mecânica de tríceps',
        exercises: [
          {
            exerciseId: 'ex-1',
            sets: [
              { id: 'a1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 12, rir: 4, completed: false },
              { id: 'a2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', weight: 80, reps: 8, rir: 2, completed: false },
              { id: 'a3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 80, reps: 8, rir: 1, completed: false },
            ],
          },
          {
            exerciseId: 'ex-6',
            sets: [
              { id: 'a4', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 35, reps: 10, rir: 2, completed: false },
              { id: 'a5', setNumber: 2, baseType: 'WORKING', technique: 'MYO_REPS', weight: 35, reps: 12, rir: 0, completed: false, myoMicroSets: [{ id: 'am1', reps: 4, completed: false }, { id: 'am2', reps: 3, completed: false }] },
            ],
          },
        ],
      },
      {
        id: 'abc-b',
        title: 'Treino B — Costas & Bíceps',
        category: 'Pull',
        description: 'Desenvolvimento de largura e espessura dorsal com isolamento de bíceps',
        exercises: [
          {
            exerciseId: 'ex-8',
            sets: [
              { id: 'b1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 12, rir: 4, completed: false },
              { id: 'b2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', weight: 65, reps: 10, rir: 2, completed: false },
              { id: 'b3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 65, reps: 8, rir: 1, completed: false },
            ],
          },
          {
            exerciseId: 'ex-12',
            sets: [
              { id: 'b4', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 16, reps: 10, rir: 1, completed: false },
              { id: 'b5', setNumber: 2, baseType: 'WORKING', technique: 'DROP_SET', weight: 16, reps: 8, rir: 0, completed: false, dropSets: [{ id: 'bd1', weight: 10, reps: 6, completed: false }] },
            ],
          },
        ],
      },
      {
        id: 'abc-c',
        title: 'Treino C — Pernas & Ombros',
        category: 'Legs',
        description: 'Membros inferiores completos e deltoides com ênfase medial/posterior',
        exercises: [
          {
            exerciseId: 'ex-14',
            sets: [
              { id: 'c1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 50, reps: 10, rir: 4, completed: false },
              { id: 'c2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', weight: 90, reps: 8, rir: 2, completed: false },
            ],
          },
          {
            exerciseId: 'ex-5',
            sets: [
              { id: 'c3', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', weight: 12, reps: 15, rir: 0, completed: false, myoMicroSets: [{ id: 'cm1', reps: 4, completed: false }, { id: 'cm2', reps: 4, completed: false }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'split-upper-lower',
    name: 'Upper / Lower (Superiores / Inferiores)',
    description: 'Divisão de alta frequência (4 dias na semana)',
    workouts: [
      {
        id: 'ul-upper-1',
        title: 'Upper A — Força Superior',
        category: 'Upper',
        description: 'Trabalho pesado de empurrar e puxar na mesma sessão',
        exercises: [
          {
            exerciseId: 'ex-1',
            sets: [{ id: 'u1', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 85, reps: 6, rir: 2, completed: false }],
          },
          {
            exerciseId: 'ex-9',
            sets: [{ id: 'u2', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 80, reps: 6, rir: 2, completed: false }],
          },
        ],
      },
      {
        id: 'ul-lower-1',
        title: 'Lower A — Força Inferior',
        category: 'Lower',
        description: 'Agachamento pesado, stiff e panturrilha',
        exercises: [
          {
            exerciseId: 'ex-14',
            sets: [{ id: 'l10', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 100, reps: 6, rir: 2, completed: false }],
          },
          {
            exerciseId: 'ex-18',
            sets: [{ id: 'l11', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 80, reps: 8, rir: 2, completed: false }],
          },
        ],
      },
    ],
  },
];

const LOCAL_STORAGE_SPLITS_KEY = 'niflheim_workout_splits_v2';

function TreinosPage() {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();

  // Sistema de Rotinas & Divisões Carregadas (com localStorage)
  const [splits, setSplits] = useState<WorkoutSplit[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SPLITS_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        // fallback to default
      }
    }
    return DEFAULT_SPLITS;
  });

  const [activeSplitId, setActiveSplitId] = useState<string>('split-ppl');
  const activeSplit = useMemo(() => {
    return splits.find((s) => s.id === activeSplitId) ?? splits[0] ?? DEFAULT_SPLITS[0];
  }, [splits, activeSplitId]);

  // Persistir splits quando alterados
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_SPLITS_KEY, JSON.stringify(splits));
      } catch (e) {
        // storage quota
      }
    }
  }, [splits]);

  // Sessão de Treino Diária Ativa
  const [sessionTitle, setSessionTitle] = useState('Push A — Hipertrofia & Força');
  const [sessionCategory, setSessionCategory] = useState<BiomechanicalCategory>('Push');
  const [exercises, setExercises] = useState<ExerciseItem[]>(() => {
    const tpl = DEFAULT_SPLITS[0].workouts[0];
    return tpl.exercises.map((item) => {
      const lib = EXERCISE_LIBRARY.find((e) => e.id === item.exerciseId)!;
      return {
        ...lib,
        isSupersetWithNext: item.isSupersetWithNext ?? false,
        sets: item.sets,
      };
    });
  });

  // Modal para Criar Nova Divisão (ex: ABC, ABCD, Custom)
  const [isCreateSplitModalOpen, setIsCreateSplitModalOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState('');
  const [newSplitDescription, setNewSplitDescription] = useState('');

  // Modal para Adicionar Novo Treino à Divisão Ativa
  const [isAddWorkoutToSplitModalOpen, setIsAddWorkoutToSplitModalOpen] = useState(false);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('');
  const [newWorkoutCategory, setNewWorkoutCategory] = useState<BiomechanicalCategory>('Push');

  // Modal para Adicionar Exercício da Biblioteca
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [exerciseFilterCategory, setExerciseFilterCategory] = useState<string>('Todos');

  // Adicionar exercício rápido manual
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState<MuscleGroup>('Peito');

  // Vídeo em exibição retrátil
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  // Floating Rest Timer Global
  const [restTime, setRestTime] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [lastRestTriggerSource, setLastRestTriggerSource] = useState<string>('Série Concluída');

  // Explicação Científica Expandida de Volume
  const [isVolumeGuideExpanded, setIsVolumeGuideExpanded] = useState(false);

  // Modal Pós-Treino (Questionário Imediato: PSE 1-10 + Duração)
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [pse, setPse] = useState(8);
  const [duration, setDuration] = useState(55);

  // Modal Check-in Noturno (Fadiga)
  const [isNightCheckinOpen, setIsNightCheckinOpen] = useState(false);
  const [sleepScore, setSleepScore] = useState(4);
  const [domsScore, setDomsScore] = useState(3);
  const [fatigueScore, setFatigueScore] = useState(3);

  // Timer flutuante effect
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
            } catch (e) {
              // audio context unsupported or blocked
            }
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

  const triggerFloatingTimer = (seconds = 90, source = 'Série Concluída') => {
    setRestTime(seconds);
    setTimerActive(true);
    setLastRestTriggerSource(source);
  };

  // Avaliação do Algoritmo MRV com os logs de fadiga
  const fatigueLogs: FatigueLogItem[] = data.fatigue.map((f) => ({
    day: f.day ?? today,
    sleep: f.details['sleep'],
    doms: f.details['doms'] ?? 1,
    fatigue: f.details['fatigue'],
  }));
  const mrvStatus = checkMrvDeload(fatigueLogs);

  // Volume Tracker Científico em Tempo Real
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

  // Grupos musculares que têm séries na sessão ativa
  const activeMusclesInSession = useMemo(() => {
    const unique = new Set(exercises.map((e) => e.muscle));
    return weeklyVolumeAssessments.filter((a) => unique.has(a.muscle) || a.rawSetCount > 0);
  }, [exercises, weeklyVolumeAssessments]);

  // Alerta de Junk Volume (MRV Excedido)
  const junkVolumeMuscles = useMemo(() => {
    return weeklyVolumeAssessments.filter((a) => a.status === 'JUNK_VOLUME');
  }, [weeklyVolumeAssessments]);

  // Tonelagem Total da Sessão
  const totalSessionTonnage = useMemo(() => {
    let sum = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          sum += s.weight * s.reps;
          s.dropSets?.forEach((ds) => {
            if (ds.completed) sum += ds.weight * ds.reps;
          });
          s.myoMicroSets?.forEach((ms) => {
            if (ms.completed) sum += s.weight * ms.reps;
          });
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

  // Handlers para Manipulação de Séries
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

  // Adicionar Série de Trabalho Efetiva
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
          weight: last?.weight ?? 40,
          reps: last?.reps ?? 10,
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

  // Adicionar Série Preparatória (Aquecimento ou Feeder de Reconhecimento)
  const handleAddPreparatorySet = (exerciseId: string, type: 'WARMUP' | 'FEEDER' = 'FEEDER') => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const first = ex.sets[0];
        const baseWeight = first?.weight ?? 40;
        const newSet: AdvancedSetRowData = {
          id: crypto.randomUUID(),
          setNumber: 0,
          baseType: type,
          technique: 'NONE',
          weight: type === 'WARMUP' ? Math.round(baseWeight * 0.5) : Math.round(baseWeight * 0.8),
          reps: type === 'WARMUP' ? 12 : 3,
          rir: 4,
          completed: false,
        };
        // Insere as séries preparatórias no início da lista
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

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  };

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

  const handleToggleSuperset = (index: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = {
          ...copy[index],
          isSupersetWithNext: !copy[index].isSupersetWithNext,
        };
      }
      return copy;
    });
  };

  // Carregar Treino Selecionado da Divisão
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
        description: '',
      };
      return {
        ...lib,
        isSupersetWithNext: item.isSupersetWithNext ?? false,
        sets: item.sets.map((s) => ({ ...s, completed: false })),
      };
    });
    setExercises(loaded);
  };

  // Salvar a Sessão Atual dentro da Divisão Ativa
  const handleSaveCurrentWorkoutToSplit = () => {
    const updatedWorkout: WorkoutTemplateItem = {
      id: crypto.randomUUID(),
      title: sessionTitle,
      category: sessionCategory,
      description: `${exercises.length} exercícios configurados com séries científicas`,
      exercises: exercises.map((e) => ({
        exerciseId: e.id,
        isSupersetWithNext: e.isSupersetWithNext,
        sets: e.sets,
      })),
    };

    setSplits((prev) =>
      prev.map((s) => {
        if (s.id !== activeSplit.id) return s;
        // Se já existe um treino com o mesmo título, atualiza; senão adiciona
        const existingIdx = s.workouts.findIndex((w) => w.title === sessionTitle);
        const newWorkouts = [...s.workouts];
        if (existingIdx >= 0) {
          newWorkouts[existingIdx] = updatedWorkout;
        } else {
          newWorkouts.push(updatedWorkout);
        }
        return { ...s, workouts: newWorkouts };
      })
    );
    reward(30);
    alert(`Treino "${sessionTitle}" salvo com sucesso na divisão "${activeSplit.name}"!`);
  };

  // Excluir um Treino da Divisão Ativa
  const handleDeleteWorkoutFromSplit = (workoutId: string) => {
    if (activeSplit.workouts.length <= 1) {
      alert('A divisão deve conter pelo menos um treino.');
      return;
    }
    if (!confirm('Deseja realmente remover este treino da rotina?')) return;

    setSplits((prev) =>
      prev.map((s) => {
        if (s.id !== activeSplit.id) return s;
        return {
          ...s,
          workouts: s.workouts.filter((w) => w.id !== workoutId),
        };
      })
    );
  };

  // Criar Nova Divisão Personalizada (ABC, ABCD, etc.)
  const handleCreateSplit = () => {
    if (!newSplitName.trim()) return;
    const newSplit: WorkoutSplit = {
      id: `split-${crypto.randomUUID()}`,
      name: newSplitName.trim(),
      description: newSplitDescription.trim() || 'Divisão personalizada de treinos',
      workouts: [
        {
          id: crypto.randomUUID(),
          title: `${newSplitName.trim()} — Treino A`,
          category: 'Push',
          description: 'Primeiro treino da sua divisão',
          exercises: [
            {
              exerciseId: 'ex-1',
              sets: [
                { id: crypto.randomUUID(), setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 30, reps: 12, rir: 4, completed: false },
                { id: crypto.randomUUID(), setNumber: 2, baseType: 'WORKING', technique: 'NONE', weight: 60, reps: 10, rir: 2, completed: false },
                { id: crypto.randomUUID(), setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 60, reps: 8, rir: 1, completed: false },
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
    setNewSplitDescription('');
    setIsCreateSplitModalOpen(false);
  };

  // Excluir Divisão Inteira
  const handleDeleteSplit = (splitId: string) => {
    if (splits.length <= 1) {
      alert('Você não pode excluir a única divisão existente.');
      return;
    }
    if (!confirm('Deseja realmente excluir esta divisão inteira?')) return;
    const remaining = splits.filter((s) => s.id !== splitId);
    setSplits(remaining);
    setActiveSplitId(remaining[0].id);
    handleLoadWorkout(remaining[0].workouts[0]);
  };

  // Adicionar exercício selecionado da biblioteca
  const handleAddFromLibrary = (libEx: Omit<ExerciseItem, 'sets'>) => {
    const newEx: ExerciseItem = {
      ...libEx,
      id: crypto.randomUUID(),
      sets: [
        {
          id: crypto.randomUUID(),
          setNumber: 1,
          baseType: 'WARMUP',
          technique: 'NONE',
          weight: 20,
          reps: 12,
          rir: 4,
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          setNumber: 2,
          baseType: 'WORKING',
          technique: 'NONE',
          weight: 40,
          reps: 10,
          rir: 2,
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          setNumber: 3,
          baseType: 'WORKING',
          technique: 'NONE',
          weight: 40,
          reps: 8,
          rir: 1,
          completed: false,
        },
      ],
    };
    setExercises((prev) => [...prev, newEx]);
    setIsAddExerciseModalOpen(false);
  };

  // Adicionar exercício personalizado livre
  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    const newEx: ExerciseItem = {
      id: crypto.randomUUID(),
      name: customExerciseName.trim(),
      muscle: customExerciseMuscle,
      category: sessionCategory,
      equipment: 'Livre',
      description: 'Exercício personalizado adicionado à sessão.',
      sets: [
        {
          id: crypto.randomUUID(),
          setNumber: 1,
          baseType: 'WORKING',
          technique: 'NONE',
          weight: 30,
          reps: 10,
          rir: 2,
          completed: false,
        },
      ],
    };
    setExercises((prev) => [...prev, newEx]);
    setCustomExerciseName('');
    setIsAddExerciseModalOpen(false);
  };

  // Finalizar e salvar sessão completa
  const handleFinishWorkout = async () => {
    const success = await save({
      table: 'workouts',
      record: {
        id: crypto.randomUUID(),
        day: today,
        details: {
          name: sessionTitle,
          category: sessionCategory,
          completed: true,
          pse,
          duration,
          tonnageKg: totalSessionTonnage,
          totalSets: completedSetsCount,
          exercisesCount: exercises.length,
          exercises: exercises.map((e) => ({
            name: e.name,
            muscle: e.muscle,
            setsCount: e.sets.filter((s) => s.completed).length,
          })),
        },
      },
    });

    if (success) {
      reward(150);
      setIsFinishingWorkout(false);
    }
  };

  const handleSaveNightCheckin = async () => {
    const success = await save({
      table: 'fatigue_logs',
      record: {
        id: crypto.randomUUID(),
        day: today,
        details: {
          sleep: sleepScore,
          doms: domsScore,
          fatigue: fatigueScore,
        },
      },
    });
    if (success) {
      reward(25);
      setIsNightCheckinOpen(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Principal */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Arquitetura Hipertrófica & Divisões Científicas
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl text-foreground">
            Sessão de Treino Diária<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie e alterne entre divisões (ABC, PPL, Upper/Lower), organize séries preparatórias e de trabalho com precisão e controle de MEV/MRV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsNightCheckinOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <Moon size={14} className="text-primary" /> Check-in Noturno
          </Button>

          <Button
            onClick={() => setIsFinishingWorkout(true)}
            className="bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs shadow-lg flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} /> Finalizar Sessão ({completedSetsCount}/{totalSetsCount})
          </Button>
        </div>
      </div>

      {/* Alerta de MRV / Deload (DOMS 5 por 3 dias seguidos) */}
      {mrvStatus.requiresDeload && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-foreground flex items-start gap-4 animate-pulse">
          <AlertTriangle size={24} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-destructive">
              Alerta Fisiológico de Deload Automático (MRV Excedido)
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {mrvStatus.alertMessage}
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Junk Volume em Tempo Real */}
      {junkVolumeMuscles.length > 0 && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-foreground flex items-start gap-3">
          <Flame size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs text-amber-500 uppercase tracking-wide">
              Risco de Junk Volume Detectado!
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Os músculos <strong>{junkVolumeMuscles.map((m) => m.muscle).join(', ')}</strong> ultrapassaram o Limite Máximo Recuperável (MRV). Séries extras neste momento geram fadiga excessiva sem ganho hipertrófico proporcional.
            </p>
          </div>
        </div>
      )}

      {/* GESTOR DE ROTINAS & DIVISÕES (PPL, ABC, UPPER/LOWER, ETC.) */}
      <div className="rounded-2xl border border-border bg-card/70 p-5 space-y-4 shadow-sm">
        {/* Barra de Abas das Divisões */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mr-2">
              <Layers size={15} className="text-primary" /> Divisões & Rotinas:
            </span>
            {splits.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSplitId(s.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeSplit.id === s.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted text-xs'
                  }`}
                >
                  {s.name}
                </button>
                {splits.length > 1 && (
                  <button
                    onClick={() => handleDeleteSplit(s.id)}
                    title="Excluir divisão"
                    className="p-1 text-muted-foreground/60 hover:text-destructive rounded text-xs"
                  >
                    ✕
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
              className="text-xs flex items-center gap-1.5 border-dashed"
            >
              <FolderPlus size={13} className="text-primary" /> + Nova Divisão (ABC, ABCD...)
            </Button>
          </div>
        </div>

        {/* Treinos da Divisão Ativa */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-bold text-muted-foreground">
              Treinos programados em <strong>{activeSplit.name}</strong>:
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveCurrentWorkoutToSplit}
                className="text-[11px] h-7 text-primary hover:bg-primary/10 font-bold flex items-center gap-1"
                title="Salvar alterações do treino atual nesta rotina"
              >
                <Save size={12} /> Salvar Treino na Rotina
              </Button>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {activeSplit.workouts.map((w) => {
              const isCurrent = sessionTitle === w.title;
              return (
                <div
                  key={w.id}
                  className={`relative rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40'
                      : 'border-border/60 bg-background/60 hover:border-primary/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-foreground line-clamp-1">
                        {w.title}
                      </span>
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-black text-primary uppercase shrink-0">
                        {w.category}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {w.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {w.exercises.length} exercícios
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleLoadWorkout(w)}
                        className={`text-[11px] h-6 px-2.5 font-bold ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground pointer-events-none'
                            : 'bg-secondary hover:bg-primary hover:text-primary-foreground'
                        }`}
                      >
                        {isCurrent ? 'Em Andamento' : 'Carregar Treino'}
                      </Button>
                      <button
                        onClick={() => handleDeleteWorkoutFromSplit(w.id)}
                        className="p-1 text-muted-foreground/60 hover:text-destructive rounded"
                        title="Remover treino desta rotina"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BARRA DE EDIÇÃO DO NOME DO TREINO E STATUS DA SESSÃO */}
      <div className="panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Nome do Treino de Hoje (Editável)
          </label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-base font-extrabold text-foreground focus:border-primary"
            placeholder="Ex: Push Day - Peito e Tríceps"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-center">
            <span className="text-[10px] uppercase text-muted-foreground block">Exercícios</span>
            <span className="font-bold text-foreground text-sm">{exercises.length}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase text-muted-foreground block">Séries Feitas</span>
            <span className="font-bold text-primary text-sm">{completedSetsCount} / {totalSetsCount}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase text-muted-foreground block">Tonelagem</span>
            <span className="font-bold text-primary text-sm">{totalSessionTonnage.toLocaleString()} kg</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddExerciseModalOpen(true)}
            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> Adicionar Exercício
          </Button>
        </div>
      </div>

      {/* GUIA RÁPIDO DE ESCALA RIR */}
      <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 flex items-start gap-3">
        <Info size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Como funciona a Escala RIR (Reps in Reserve):</strong>{' '}
          RIR mede o esforço real por série, indicando quantas repetições você guardou antes de falhar.{' '}
          <span className="text-primary font-bold">RIR 0</span> = foi até o limite absoluto (0 reps restantes);{' '}
          <span className="text-foreground font-semibold">RIR 1</span> = parou 1 rep antes da falha;{' '}
          <span className="text-foreground font-semibold">RIR 2</span> = parou 2 reps antes da falha (faixa recomendada para hipertrofia sem desgaste neural excessivo).
        </div>
      </div>

      {/* LISTA DE EXERCÍCIOS DA SESSÃO DIÁRIA */}
      <div className="space-y-6">
        {exercises.map((ex, exIndex) => {
          const isNextSuperset = ex.isSupersetWithNext;
          const isPartOfSuperset = (exIndex > 0 && exercises[exIndex - 1]?.isSupersetWithNext) || isNextSuperset;

          // SEPARAÇÃO VISUAL: SÉRIES PREPARATÓRIAS vs SÉRIES DE TRABALHO
          const preparatorySets = ex.sets.filter(
            (s) => s.baseType === 'WARMUP' || s.baseType === 'FEEDER'
          );
          const workingSets = ex.sets.filter(
            (s) => s.baseType === 'WORKING' || s.baseType === 'BACKOFF'
          );

          return (
            <div key={ex.id} className="relative">
              {/* Chave visual indicativa de Superset { */}
              {isNextSuperset && (
                <div 
                  title="Superset agrupado! Realize os exercícios conjugados antes do descanso principal."
                  className="absolute -right-3 top-10 bottom-0 z-10 hidden sm:flex items-center justify-center pointer-events-none"
                >
                  <div className="border-r-2 border-y-2 border-primary/80 rounded-r-xl w-4 h-full flex items-center justify-end pr-1 text-[10px] font-black text-primary">
                    {'{'}
                  </div>
                </div>
              )}

              <div className={`panel p-4 md:p-6 transition-all ${
                isPartOfSuperset ? 'border-primary/40 bg-card/90 shadow-md' : ''
              }`}>
                {/* Header do Exercício */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-md bg-secondary font-mono text-xs font-bold text-muted-foreground">
                      #{exIndex + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-foreground">{ex.name}</h3>
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          {ex.muscle}
                        </span>
                        {isPartOfSuperset && (
                          <span className="rounded bg-primary text-primary-foreground px-1.5 py-0.5 text-[9px] font-black uppercase flex items-center gap-1">
                            <LinkIcon size={10} /> Superset
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ex.equipment} • {ex.category}
                      </p>
                    </div>
                  </div>

                  {/* Ações de Reordenação e Superset */}
                  <div className="flex items-center gap-1.5">
                    {/* Botão de Tutorial Retrátil */}
                    {ex.video_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedVideoId(expandedVideoId === ex.id ? null : ex.id)
                        }
                        className="text-xs text-primary flex items-center gap-1 h-7 px-2"
                      >
                        <Play size={12} /> {expandedVideoId === ex.id ? 'Fechar Vídeo' : 'Ver Execução'}
                      </Button>
                    )}

                    {/* Toggle Superset */}
                    {exIndex < exercises.length - 1 && (
                      <Button
                        variant={isNextSuperset ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleSuperset(exIndex)}
                        className={`text-xs h-7 px-2 flex items-center gap-1 ${
                          isNextSuperset ? 'bg-primary text-primary-foreground font-bold' : ''
                        }`}
                        title="Agrupar com o próximo exercício em Superset"
                      >
                        <LinkIcon size={12} /> {isNextSuperset ? 'Superset Ativo' : 'Ligar Superset'}
                      </Button>
                    )}

                    {/* Reordenar Subir */}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={exIndex === 0}
                      onClick={() => handleMoveExercise(exIndex, 'up')}
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronUp size={14} />
                    </Button>

                    {/* Reordenar Descer */}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={exIndex === exercises.length - 1}
                      onClick={() => handleMoveExercise(exIndex, 'down')}
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown size={14} />
                    </Button>

                    {/* Remover Exercício */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="size-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Tutorial / Vídeo Embutido Retrátil */}
                {expandedVideoId === ex.id && (
                  <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <Play size={14} /> Guia de Execução Biomecânica
                      </span>
                      {ex.video_url && (
                        <a
                          href={ex.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1"
                        >
                          Abrir no YouTube <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ex.description ?? 'Mantenha o controle da fase excêntrica de 2 a 3 segundos para estímulo mecânico ideal.'}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* SEÇÃO 1: SÉRIES PREPARATÓRIAS (AQUECIMENTO / RECONHECIMENTO DE CARGA) */}
                  <div className="rounded-xl border border-border/40 bg-muted/10 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-500" />
                        Séries Preparatórias (Aquecimento & Feeder de Reconhecimento)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Peso 0 no MEV/MAV (não conta como série válida de hipertrofia)
                      </span>
                    </div>

                    {preparatorySets.length > 0 ? (
                      <div className="space-y-2">
                        {preparatorySets.map((set) => (
                          <AdvancedSetRow
                            key={set.id}
                            data={set}
                            onUpdate={(updated) => handleUpdateSet(ex.id, updated)}
                            onDelete={() => handleDeleteSet(ex.id, set.id)}
                            onTriggerRestTimer={(seconds) =>
                              triggerFloatingTimer(seconds, `${ex.name} - Preparação`)
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Nenhuma série de aquecimento configurada para este exercício.
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddPreparatorySet(ex.id, 'WARMUP')}
                        className="text-[10px] h-6 px-2 text-muted-foreground hover:text-foreground border border-dashed border-border/60"
                      >
                        + Aquecimento (W)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddPreparatorySet(ex.id, 'FEEDER')}
                        className="text-[10px] h-6 px-2 text-amber-500 hover:text-amber-400 border border-dashed border-amber-500/40"
                      >
                        + Feeder / Reconhecimento (F)
                      </Button>
                    </div>
                  </div>

                  {/* SEÇÃO 2: SÉRIES EFETIVAS DE TRABALHO (#1, #2, #3...) */}
                  <div className="rounded-xl border border-primary/30 bg-card/60 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-primary flex items-center gap-1.5">
                        <Flame size={14} className="text-primary" />
                        Séries de Trabalho Efetivas (#1, #2, #3...)
                      </span>
                      <span className="text-[10px] font-bold text-primary font-mono">
                        Alimenta MEV/MAV, PR e Hipertrofia
                      </span>
                    </div>

                    {workingSets.length > 0 ? (
                      <div className="space-y-2">
                        {workingSets.map((set, wIdx) => (
                          <AdvancedSetRow
                            key={set.id}
                            data={set}
                            workingIndex={wIdx + 1}
                            onUpdate={(updated) => handleUpdateSet(ex.id, updated)}
                            onDelete={() => handleDeleteSet(ex.id, set.id)}
                            onTriggerRestTimer={(seconds) =>
                              triggerFloatingTimer(seconds, `${ex.name} - Série #${wIdx + 1}`)
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Nenhuma série de trabalho adicionada. Adicione uma série abaixo para pontuar hipertrofia.
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddWorkingSet(ex.id)}
                        className="text-xs border-dashed flex items-center gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
                      >
                        <Plus size={13} /> + Adicionar Série de Trabalho (#{workingSets.length + 1})
                      </Button>

                      <span className="text-[11px] text-muted-foreground font-mono">
                        {workingSets.filter((s) => s.completed).length}/{workingSets.length} séries de trabalho feitas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {exercises.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
            <Dumbbell size={36} className="mx-auto text-muted-foreground/60" />
            <h3 className="text-base font-bold text-foreground">Sua sessão diária está vazia</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Escolha um dos treinos na lista acima (PPL, ABC) ou adicione exercícios personalizados para montar seu treino.
            </p>
            <Button
              onClick={() => setIsAddExerciseModalOpen(true)}
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs"
            >
              Adicionar Primeiro Exercício
            </Button>
          </div>
        )}
      </div>

      {/* CONTROLE CIENTÍFICO DE VOLUME (MEV, MAV, MRV) COM DESCRIÇÃO COMPLETA */}
      <div className="panel p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <SectionHeading title="Controle Científico de Volume (MEV, MAV, MRV)" />
            <p className="text-xs text-muted-foreground mt-1">
              Monitore se o seu treino atinge o estímulo mínimo ou se está ultrapassando o limite biológico de recuperação.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVolumeGuideExpanded(!isVolumeGuideExpanded)}
            className="text-xs flex items-center gap-1.5"
          >
            <HelpCircle size={14} className="text-primary" />
            {isVolumeGuideExpanded ? 'Ocultar Explicação Científica' : 'Como Ler Este Painel? (Explicação)'}
          </Button>
        </div>

        {/* DESCRIÇÃO DIDÁTICA E CIENTÍFICA (EXPANSÍVEL) */}
        {isVolumeGuideExpanded && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
            <h4 className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
              <Sparkles size={16} className="text-primary" />
              Guia Prático dos Marcos de Volume (Dr. Mike Israetel & Brad Schoenfeld)
            </h4>

            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <div className="rounded-lg border border-border bg-background/70 p-3 space-y-1">
                <span className="font-bold text-foreground block text-[11px] uppercase">
                  🟢 MEV (Volume Mínimo Efetivo)
                </span>
                <p className="text-[11px]">
                  A menor quantidade de séries semanais que você precisa para sinalizar crescimento muscular. Abaixo do MEV, o músculo apenas se mantém.
                </p>
              </div>

              <div className="rounded-lg border border-primary/40 bg-background/70 p-3 space-y-1">
                <span className="font-bold text-primary block text-[11px] uppercase">
                  🟡 MAV (Volume Máximo Adaptativo)
                </span>
                <p className="text-[11px]">
                  A <strong>"Zona de Ouro"</strong>. O intervalo de séries onde seu corpo atinge a taxa máxima de hipertrofia com plena capacidade de recuperação.
                </p>
              </div>

              <div className="rounded-lg border border-destructive/40 bg-background/70 p-3 space-y-1">
                <span className="font-bold text-destructive block text-[11px] uppercase">
                  🔴 MRV (Volume Máximo Recuperável)
                </span>
                <p className="text-[11px]">
                  O teto biológico de recuperação. Passar do MRV gera <strong>Junk Volume (Volume Lixo)</strong>: fadiga extrema no sistema nervoso sem ganho de massa.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-[11px] mt-2">
              <strong className="text-foreground">⚖️ Ponderação Matemática de Séries:</strong>{' '}
              Série de Trabalho = 1.0 série • Myo-Reps = 1.75 séries • Drop-Set = 1.5 séries • Aquecimento / Feeder = 0 séries (para não inflar a conta).
            </div>
          </div>
        )}

        {/* CARDS DOS GRUPOS MUSCULARES */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeMusclesInSession.map((assessment) => {
            const { muscle, effectiveWorkingSets, landmarks, status, statusLabel } = assessment;
            const progressPct = Math.min(100, Math.round((effectiveWorkingSets / landmarks.mrv) * 100));

            return (
              <div 
                key={muscle} 
                className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{muscle}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
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

                {/* Barra de Progresso MEV -> MAV -> MRV */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Efetivo: <strong className="text-foreground">{effectiveWorkingSets}</strong> séries</span>
                    <span>MRV: {landmarks.mrv}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        status === 'JUNK_VOLUME'
                          ? 'bg-destructive'
                          : status === 'MRV_NEAR'
                          ? 'bg-amber-500'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground pt-0.5">
                    <span>MEV ({landmarks.mev})</span>
                    <span>MAV ({landmarks.mavMin}-{landmarks.mavMax})</span>
                    <span>MRV ({landmarks.mrv})</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {assessment.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* TIMER FLUTUANTE GLOBAL */}
      {restTime > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-primary/50 bg-card/95 px-5 py-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Clock size={20} className={timerActive ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {lastRestTriggerSource}
            </div>
            <div className="font-mono text-2xl font-black text-primary">
              {formatTimer(restTime)}
            </div>
          </div>
          <div className="flex items-center gap-1 pl-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-foreground"
              onClick={() => setTimerActive(!timerActive)}
            >
              {timerActive ? <Pause size={15} /> : <Play size={15} />}
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
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL CRIAR NOVA DIVISÃO (ABC, ABCD, ETC.) */}
      {isCreateSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="panel max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <FolderPlus size={18} className="text-primary" /> Criar Nova Divisão de Treinos
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
                Nome da Divisão (Ex: ABCD Hipertrofia, ABC Clássico):
              </label>
              <input
                type="text"
                value={newSplitName}
                onChange={(e) => setNewSplitName(e.target.value)}
                placeholder="Ex: ABC Hipertrofia do Luis"
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Descrição ou Foco:
              </label>
              <input
                type="text"
                value={newSplitDescription}
                onChange={(e) => setNewSplitDescription(e.target.value)}
                placeholder="Ex: Treinos de 45-60 min com foco em braços e costas"
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs"
              />
            </div>

            <Button
              onClick={handleCreateSplit}
              disabled={!newSplitName.trim()}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs"
            >
              Criar Divisão & Começar a Montar
            </Button>
          </div>
        </div>
      )}

      {/* MODAL PARA ADICIONAR EXERCÍCIO DA BIBLIOTECA OU PERSONALIZADO */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="panel max-w-2xl w-full p-6 max-h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Dumbbell size={18} className="text-primary" /> Adicionar Exercício à Sessão
              </h3>
              <button
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Criar / Colar Exercício Rápido */}
            <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase text-primary block">
                + Criar / Colar Exercício Rápido
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

            {/* Lista Rolável de Exercícios da Biblioteca */}
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

      {/* MODAL PÓS-TREINO: QUESTIONÁRIO PSE + DURAÇÃO */}
      {isFinishingWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="panel max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Trophy size={18} className="text-primary" /> Questionário Pós-Treino
              </h3>
              <button
                onClick={() => setIsFinishingWorkout(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessão:</span>
                <span className="font-bold text-foreground">{sessionTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Séries Concluídas:</span>
                <span className="font-mono text-primary font-bold">{completedSetsCount} séries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tonelagem Total:</span>
                <span className="font-mono text-primary font-bold">{totalSessionTonnage.toLocaleString()} kg</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Percepção Subjetiva de Esforço (PSE):</span>
                <span className="font-mono text-primary font-bold text-base">{pse} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={pse}
                onChange={(e) => setPse(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1 (Muito Leve)</span>
                <span>5 (Moderado)</span>
                <span>10 (Esforço Máximo)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Duração Total da Sessão:</span>
                <span className="font-mono text-primary font-bold">{duration} min</span>
              </div>
              <input
                type="number"
                min="10"
                max="300"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>

            <Button
              onClick={handleFinishWorkout}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-sm shadow-lg"
            >
              Salvar Treino & Ganhar +150 XP
            </Button>
          </div>
        </div>
      )}

      {/* MODAL CHECK-IN NOTURNO (FADIGA, DOMS, SNC) */}
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
              <p className="text-[10px] text-muted-foreground mt-1">
                (DOMS nível 5 por 3 dias seguidos recomenda Deload automático de 20%)
              </p>
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
              onClick={handleSaveNightCheckin}
              className="w-full bg-primary text-primary-foreground font-black hover:bg-primary/90 text-sm"
            >
              Registrar Check-in & Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
