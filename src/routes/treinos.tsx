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
  FileText
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
      { name: 'description', content: 'Montagem de sessões diárias baseadas na ciência, séries avançadas (Myo-Reps, Drop-Sets, Clusters, Supersets) e controle de MEV/MRV.' },
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

// Templates Biomecânicos Científicos PPL / Upper / Lower
const WORKOUT_TEMPLATES = [
  {
    id: 'push-a',
    title: 'Push A — Hipertrofia & Força',
    category: 'Push' as BiomechanicalCategory,
    description: 'Peito, Deltóide Anterior/Medial e Tríceps com Myo-Reps e Drop-Sets',
    exercises: [
      {
        exerciseId: 'ex-1', // Supino Reto
        sets: [
          { id: 's1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 12, rir: 4, previousWeight: 40, previousReps: 12, completed: false },
          { id: 's2', setNumber: 2, baseType: 'FEEDER', technique: 'NONE', weight: 70, reps: 3, rir: 3, previousWeight: 70, previousReps: 3, completed: false },
          { id: 's3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 85, reps: 8, rir: 2, previousWeight: 82.5, previousReps: 8, completed: false },
          { id: 's4', setNumber: 4, baseType: 'BACKOFF', technique: 'NONE', weight: 75, reps: 10, rir: 1, previousWeight: 75, previousReps: 10, completed: false },
        ] as AdvancedSetRowData[],
      },
      {
        exerciseId: 'ex-2', // Supino Inclinado
        sets: [
          { id: 's5', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 28, reps: 10, rir: 2, previousWeight: 26, previousReps: 10, completed: false },
          { id: 's6', setNumber: 2, baseType: 'WORKING', technique: 'DROP_SET', weight: 30, reps: 8, rir: 0, previousWeight: 28, previousReps: 8, completed: false, dropSets: [{ id: 'ds1', weight: 22, reps: 6, completed: false }] },
        ] as AdvancedSetRowData[],
      },
      {
        exerciseId: 'ex-5', // Elevação Lateral
        isSupersetWithNext: true,
        sets: [
          { id: 's7', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', weight: 12, reps: 15, rir: 0, previousWeight: 12, previousReps: 14, completed: false, myoMicroSets: [{ id: 'm1', reps: 4, completed: false }, { id: 'm2', reps: 4, completed: false }, { id: 'm3', reps: 3, completed: false }] },
        ] as AdvancedSetRowData[],
      },
      {
        exerciseId: 'ex-6', // Tríceps Polia (Superset com Elevação)
        sets: [
          { id: 's8', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 35, reps: 12, rir: 1, previousWeight: 35, previousReps: 10, completed: false },
          { id: 's9', setNumber: 2, baseType: 'WORKING', technique: 'CLUSTER_SET', weight: 40, reps: 6, rir: 0, previousWeight: 37.5, previousReps: 6, completed: false },
        ] as AdvancedSetRowData[],
      },
    ],
  },
  {
    id: 'pull-a',
    title: 'Pull A — Densidade Dorsal & Bíceps',
    category: 'Pull' as BiomechanicalCategory,
    description: 'Costas, Deltóide Posterior e Bíceps com alta intensidade mecânica',
    exercises: [
      {
        exerciseId: 'ex-9', // Remada Curvada
        sets: [
          { id: 'p1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 40, reps: 10, rir: 4, previousWeight: 40, previousReps: 10, completed: false },
          { id: 'p2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', weight: 75, reps: 8, rir: 2, previousWeight: 72.5, previousReps: 8, completed: false },
          { id: 'p3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 80, reps: 6, rir: 1, previousWeight: 77.5, previousReps: 6, completed: false },
        ] as AdvancedSetRowData[],
      },
      {
        exerciseId: 'ex-8', // Puxada Frontal
        sets: [
          { id: 'p4', setNumber: 1, baseType: 'WORKING', technique: 'NONE', weight: 60, reps: 10, rir: 2, previousWeight: 60, previousReps: 9, completed: false },
          { id: 'p5', setNumber: 2, baseType: 'WORKING', technique: 'DROP_SET', weight: 65, reps: 8, rir: 0, previousWeight: 62.5, previousReps: 8, completed: false, dropSets: [{ id: 'ds2', weight: 45, reps: 6, completed: false }] },
        ] as AdvancedSetRowData[],
      },
      {
        exerciseId: 'ex-12', // Rosca Direta Barra W
        sets: [
          { id: 'p6', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', weight: 15, reps: 14, rir: 0, previousWeight: 14, previousReps: 12, completed: false, myoMicroSets: [{ id: 'mb1', reps: 4, completed: false }, { id: 'mb2', reps: 3, completed: false }] },
        ] as AdvancedSetRowData[],
      },
    ],
  },
  {
    id: 'legs-a',
    title: 'Legs A — Quadríceps & Isquiotibiais',
    category: 'Legs' as BiomechanicalCategory,
    description: 'Agachamento, Leg Press e técnicas avançadas para hipertrofia de membros inferiores',
    exercises: [
      {
        exerciseId: 'ex-14', // Agachamento Livre
        sets: [
          { id: 'l1', setNumber: 1, baseType: 'WARMUP', technique: 'NONE', weight: 50, reps: 10, rir: 4, previousWeight: 50, previousReps: 10, completed: false },
          { id: 'l2', setNumber: 2, baseType: 'WORKING', technique: 'NONE', weight: 95, reps: 8, rir: 2, previousWeight: 90, previousReps: 8, completed: false },
          { id: 'l3', setNumber: 3, baseType: 'WORKING', technique: 'NONE', weight: 100, reps: 6, rir: 1, previousWeight: 95, previousReps: 6, completed: false },
        ] as AdvancedSetRowData[],
      },
      {
        exerciseId: 'ex-16', // Cadeira Extensora
        sets: [
          { id: 'l4', setNumber: 1, baseType: 'WORKING', technique: 'MYO_REPS', weight: 50, reps: 15, rir: 0, previousWeight: 45, previousReps: 15, completed: false, myoMicroSets: [{ id: 'lm1', reps: 5, completed: false }, { id: 'lm2', reps: 4, completed: false }] },
        ] as AdvancedSetRowData[],
      },
      {
        exerciseId: 'ex-17', // Mesa Flexora
        sets: [
          { id: 'l5', setNumber: 1, baseType: 'WORKING', technique: 'DROP_SET', weight: 45, reps: 10, rir: 0, previousWeight: 42.5, previousReps: 10, completed: false, dropSets: [{ id: 'ld1', weight: 30, reps: 8, completed: false }] },
        ] as AdvancedSetRowData[],
      },
    ],
  },
];

function TreinosPage() {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();

  // Sessão de Treino Diária
  const [sessionTitle, setSessionTitle] = useState('Push A — Hipertrofia & Força');
  const [sessionCategory, setSessionCategory] = useState<BiomechanicalCategory>('Push');
  const [exercises, setExercises] = useState<ExerciseItem[]>(() => {
    // Inicializa com o template Push A
    const tpl = WORKOUT_TEMPLATES[0];
    return tpl.exercises.map((item) => {
      const lib = EXERCISE_LIBRARY.find((e) => e.id === item.exerciseId)!;
      return {
        ...lib,
        isSupersetWithNext: item.isSupersetWithNext ?? false,
        sets: item.sets,
      };
    });
  });

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
  // Converte as séries atuais para SetVolumeData e calcula o MEV / MAV / MRV
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

  // Tonelagem Total da Sessão (Carga x Reps de séries concluídas)
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

  const handleAddSet = (exerciseId: string) => {
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

  // Carregar Template Pré-configurado
  const handleLoadTemplate = (tplId: string) => {
    const tpl = WORKOUT_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setSessionTitle(tpl.title);
    setSessionCategory(tpl.category);
    const loaded = tpl.exercises.map((item) => {
      const lib = EXERCISE_LIBRARY.find((e) => e.id === item.exerciseId)!;
      return {
        ...lib,
        isSupersetWithNext: item.isSupersetWithNext ?? false,
        sets: item.sets.map((s) => ({ ...s, completed: false })),
      };
    });
    setExercises(loaded);
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
      // Marca as séries como completas ou reinicia
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
            Arquitetura Hipertrófica & Divisão Científica
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl text-foreground">
            Sessão de Treino Diária<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monte exercícios, cargas, séries e técnicas avançadas (Myo-Reps, Drop-Sets, Clusters e Supersets) com controle de MEV/MRV.
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

      {/* Seletor de Templates Biomecânicos Rápidos */}
      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers size={14} className="text-primary" /> Carregar Divisão Biomecânica Rápida (PPL):
          </span>
          <div className="text-[11px] text-muted-foreground">
            Total Tonelagem Levantada: <strong className="font-mono text-primary">{totalSessionTonnage.toLocaleString()} kg</strong>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {WORKOUT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleLoadTemplate(tpl.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                sessionTitle === tpl.title
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/60 bg-background/50 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">{tpl.title}</span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-extrabold text-primary uppercase">
                  {tpl.category}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                {tpl.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Edição do Nome do Treino e Status da Sessão */}
      <div className="panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Nome da Sessão de Hoje
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
            <span className="text-[10px] uppercase text-muted-foreground block">Séries Concluídas</span>
            <span className="font-bold text-primary text-sm">{completedSetsCount} / {totalSetsCount}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase text-muted-foreground block">Tonelagem</span>
            <span className="font-bold text-primary text-sm">{totalSessionTonnage} kg</span>
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

      {/* LISTA DE EXERCÍCIOS DA SESSÃO DIÁRIA */}
      <div className="space-y-6">
        {exercises.map((ex, exIndex) => {
          const isNextSuperset = ex.isSupersetWithNext;
          const isPartOfSuperset = (exIndex > 0 && exercises[exIndex - 1]?.isSupersetWithNext) || isNextSuperset;

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

                {/* Tabela de Séries com AdvancedSetRow */}
                <div className="space-y-2.5">
                  {ex.sets.map((set) => (
                    <AdvancedSetRow
                      key={set.id}
                      data={set}
                      onUpdate={(updated) => handleUpdateSet(ex.id, updated)}
                      onDelete={() => handleDeleteSet(ex.id, set.id)}
                      onTriggerRestTimer={(seconds) =>
                        triggerFloatingTimer(seconds, `${ex.name} - Série #${set.setNumber}`)
                      }
                    />
                  ))}
                </div>

                {/* Botão Adicionar Série ao Exercício */}
                <div className="mt-3.5 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSet(ex.id)}
                    className="text-xs border-dashed flex items-center gap-1.5"
                  >
                    <Plus size={13} /> + Adicionar Série
                  </Button>

                  <span className="text-[11px] text-muted-foreground font-mono">
                    {ex.sets.filter((s) => s.completed).length}/{ex.sets.length} concluídas
                  </span>
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
              Escolha um dos templates pré-carregados acima (Push, Pull, Legs) ou adicione exercícios personalizados para montar seu treino.
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

      {/* VOLUME TRACKER LANDMARKS (MEV, MAV, MRV) */}
      <div className="panel p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <SectionHeading title="Controle Científico de Volume (MEV, MAV, MRV)" />
            <p className="text-xs text-muted-foreground mt-1">
              Myo-reps e Drop-sets são ponderados matematicamente para proteger sua recuperação semanal contra Junk Volume.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Base: Mike Israetel & Brad Schoenfeld
          </span>
        </div>

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
