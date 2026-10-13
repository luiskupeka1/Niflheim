import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';
import { localDay } from '@/lib/metrics';
import { WorkoutLogger, type WorkoutSetData } from '@/components/WorkoutLogger';
import { checkMrvDeload, type FatigueLogItem } from '@/lib/checkMrvDeload';

export const Route = createFileRoute('/treinos')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Treinos & Fadiga Sistêmica' },
      { name: 'description', content: 'Musculação de alta intensidade, timer inteligente e monitoramento de fadiga MRV.' },
    ],
  }),
  component: TreinosPage,
});

const EXERCISE_LIBRARY = [
  { id: '1', name: 'Supino Reto com Barra', muscle: 'Peito', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', description: 'Escápulas retraídas, desça até a linha dos mamilos.' },
  { id: '2', name: 'Supino Inclinado com Halteres', muscle: 'Peito', equipment: 'Halteres', video_url: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', description: 'Banco a 30-45 graus, controle a fase excêntrica.' },
  { id: '3', name: 'Puxada Frontal na Polia', muscle: 'Costas', equipment: 'Polia', video_url: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', description: 'Puxe em direção ao peito sem balançar o tronco.' },
  { id: '4', name: 'Remada Curvada com Barra', muscle: 'Costas', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=vT2GjY_Umpw', description: 'Coluna neutra, cotovelos rentes ao tronco.' },
  { id: '5', name: 'Agachamento Livre', muscle: 'Quadríceps', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=ultWZbUMPL8', description: 'Pés na largura dos ombros, desça com joelhos alinhados.' },
  { id: '6', name: 'Leg Press 45º', muscle: 'Quadríceps', equipment: 'Máquina', video_url: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', description: 'Costas bem apoiadas, flexione joelhos em 90 graus.' },
  { id: '7', name: 'Rosca Direta com Barra W', muscle: 'Bíceps', equipment: 'Barra', video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', description: 'Cotovelos fixos ao lado do corpo.' },
  { id: '8', name: 'Tríceps na Polia com Barra', muscle: 'Tríceps', equipment: 'Polia', video_url: 'https://www.youtube.com/watch?v=2-LAMcpzODU', description: 'Estenda os cotovelos sem movimentar os ombros.' },
  { id: '9', name: 'Elevação Lateral com Halteres', muscle: 'Ombros', equipment: 'Halteres', video_url: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', description: 'Eleve com controle até a linha dos ombros.' },
];

const MUSCLE_GROUPS = ['Todos', 'Peito', 'Costas', 'Quadríceps', 'Bíceps', 'Tríceps', 'Ombros'];

function TreinosPage() {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();

  // Filtro de exercícios
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');

  // Modo treino ativo
  const [activeExercise, setActiveExercise] = useState<typeof EXERCISE_LIBRARY[0] | null>(null);

  // Modal Pós-Treino (PSE & Duração)
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [pse, setPse] = useState(8);
  const [duration, setDuration] = useState(65);

  // Modal Check-in Noturno (Fadiga)
  const [isNightCheckinOpen, setIsNightCheckinOpen] = useState(false);
  const [sleepScore, setSleepScore] = useState(4);
  const [domsScore, setDomsScore] = useState(3);
  const [fatigueScore, setFatigueScore] = useState(3);

  // Avaliação do Algoritmo MRV com os logs de fadiga
  const fatigueLogs: FatigueLogItem[] = data.fatigue.map((f) => ({
    day: f.day ?? today,
    sleep: f.details['sleep'],
    doms: f.details['doms'] ?? 1,
    fatigue: f.details['fatigue'],
  }));
  const mrvStatus = checkMrvDeload(fatigueLogs);

  const filteredExercises = EXERCISE_LIBRARY.filter(
    (e) => selectedMuscle === 'Todos' || e.muscle === selectedMuscle
  );

  const handleFinishWorkout = async () => {
    const success = await save({
      table: 'workouts',
      record: {
        id: crypto.randomUUID(),
        day: today,
        details: {
          name: activeExercise?.name ?? 'Treino de Força',
          completed: true,
          pse,
          duration,
        },
      },
    });
    if (success) {
      reward(100);
      setIsFinishingWorkout(false);
      setActiveExercise(null);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Musculação & Periodização
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            Treino, Carga & Fadiga<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe a progressão de carga série a série e proteja seu sistema nervoso central com o MRV.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsNightCheckinOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <Moon size={14} className="text-primary" /> Check-in Noturno
          </Button>
          {!activeExercise && (
            <Button
              onClick={() => setActiveExercise(EXERCISE_LIBRARY[0])}
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs"
            >
              <Play size={14} /> Iniciar Treino Rápido
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de MRV / Deload se DOMS 5 por 3 dias seguidos */}
      {mrvStatus.requiresDeload && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-foreground flex items-start gap-4">
          <AlertTriangle size={24} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-destructive">
              Alerta de Sobrecarga e Fadiga Máxima (MRV Excedido)
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {mrvStatus.alertMessage}
            </p>
          </div>
        </div>
      )}

      {/* Modo Treino em Andamento (WorkoutLogger) */}
      {activeExercise && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <Activity size={14} /> Sessão Ativa
            </span>
            <Button
              size="sm"
              onClick={() => setIsFinishingWorkout(true)}
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs"
            >
              Finalizar Treino & Salvar PSE
            </Button>
          </div>

          <WorkoutLogger
            exerciseName={activeExercise.name}
            defaultRestTimeSeconds={90}
            onSaveSets={(sets) => {
              reward(50);
              setIsFinishingWorkout(true);
            }}
          />
        </div>
      )}

      {/* Biblioteca de Exercícios */}
      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <SectionHeading title="Biblioteca de Exercícios & Tutoriais" />
          <div className="flex flex-wrap items-center gap-1.5">
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMuscle(m)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                  selectedMuscle === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="rounded-xl border border-border bg-card/60 p-4 hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span className="font-semibold text-primary">{ex.muscle}</span>
                  <span>{ex.equipment}</span>
                </div>
                <h3 className="font-bold text-sm text-foreground">{ex.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {ex.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                {ex.video_url && (
                  <a
                    href={ex.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    Tutorial YouTube <ExternalLink size={12} />
                  </a>
                )}
                <Button
                  size="sm"
                  onClick={() => setActiveExercise(ex)}
                  className="text-xs h-7 bg-secondary hover:bg-primary hover:text-primary-foreground"
                >
                  Executar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Pós-Treino (Questionário Imediato: PSE 1-10 + Duração) */}
      {isFinishingWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="panel max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Trophy size={18} className="text-primary" /> Questionário Pós-Treino
              </h3>
              <button
                onClick={() => setIsFinishingWorkout(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
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
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1 (Muito Leve)</span>
                <span>5 (Moderado)</span>
                <span>10 (Esforço Máximo)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Duração Total:</span>
                <span className="font-mono text-primary font-bold">{duration} min</span>
              </div>
              <input
                type="number"
                min="10"
                max="300"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="text-xs font-mono font-bold"
              />
            </div>

            <Button
              onClick={handleFinishWorkout}
              className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
            >
              Concluir & Ganhar +100 XP
            </Button>
          </div>
        </div>
      )}

      {/* Modal Check-in Noturno (Fadiga, Sono, DOMS, SNC) */}
      {isNightCheckinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="panel max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Moon size={18} className="text-primary" /> Check-in Noturno de Fadiga
              </h3>
              <button
                onClick={() => setIsNightCheckinOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
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
                className="w-full"
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
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                (Nível 5 por 3 dias seguidos aciona recomendação de Deload de 20%)
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
                className="w-full"
              />
            </div>

            <Button
              onClick={handleSaveNightCheckin}
              className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
            >
              Registrar Check-in & Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
