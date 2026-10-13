import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  ArrowUp, 
  Clock, 
  Check, 
  Plus, 
  Trash2, 
  Play, 
  RotateCcw, 
  Pause,
  Flame,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SetType = 'Aquecimento' | 'Preparatória' | 'Trabalho' | 'Falha' | 'Drop-set';

export interface WorkoutSetData {
  id: string;
  setNumber: number;
  type: SetType;
  previousWeight?: number;
  previousReps?: number;
  weight: number;
  reps: number;
  rir: number; // 0 to 5 (Reps in Reserve)
  completed: boolean;
}

interface WorkoutLoggerProps {
  exerciseName: string;
  initialSets?: WorkoutSetData[];
  defaultRestTimeSeconds?: number;
  onSaveSets?: (sets: WorkoutSetData[]) => void;
}

export function WorkoutLogger({
  exerciseName,
  initialSets = [
    { id: '1', setNumber: 1, type: 'Aquecimento', previousWeight: 50, previousReps: 12, weight: 50, reps: 12, rir: 4, completed: false },
    { id: '2', setNumber: 2, type: 'Trabalho', previousWeight: 70, previousReps: 10, weight: 70, reps: 10, rir: 2, completed: false },
    { id: '3', setNumber: 3, type: 'Trabalho', previousWeight: 70, previousReps: 8, weight: 70, reps: 8, rir: 1, completed: false },
  ],
  defaultRestTimeSeconds = 90,
  onSaveSets,
}: WorkoutLoggerProps) {
  const [sets, setSets] = useState<WorkoutSetData[]>(initialSets);
  
  // Timer Inteligente Flutuante de Descanso
  const [restTime, setRestTime] = useState<number>(0);
  const [targetRest, setTargetRest] = useState<number>(defaultRestTimeSeconds);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            // Timer zerou: vibrar e emitir alerta sonoro
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
              // Audio context not allowed or unsupported
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

  const startRestTimer = (seconds = defaultRestTimeSeconds) => {
    setRestTime(seconds);
    setTargetRest(seconds);
    setTimerActive(true);
  };

  const handleToggleComplete = (id: string) => {
    setSets((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextState = !s.completed;
          if (nextState) {
            // Ao dar "check" na série, dispara timer inteligente flutuante
            startRestTimer(targetRest);
          }
          return { ...s, completed: nextState };
        }
        return s;
      })
    );
  };

  const handleUpdate = (id: string, field: keyof WorkoutSetData, value: any) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleAddSet = () => {
    const last = sets[sets.length - 1];
    const newSet: WorkoutSetData = {
      id: crypto.randomUUID(),
      setNumber: sets.length + 1,
      type: 'Trabalho',
      previousWeight: last?.weight ?? 60,
      previousReps: last?.reps ?? 10,
      weight: last?.weight ?? 60,
      reps: last?.reps ?? 10,
      rir: 2,
      completed: false,
    };
    setSets([...sets, newSet]);
  };

  const handleRemoveSet = (id: string) => {
    setSets(sets.filter((s) => s.id !== id).map((s, idx) => ({ ...s, setNumber: idx + 1 })));
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative rounded-xl border border-border bg-card p-4 md:p-6 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Em Andamento
          </span>
          <h3 className="text-xl font-extrabold text-foreground">{exerciseName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => startRestTimer(60)}
            className="text-xs"
          >
            60s Descanso
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startRestTimer(90)}
            className="text-xs"
          >
            90s Descanso
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startRestTimer(120)}
            className="text-xs"
          >
            120s Descanso
          </Button>
        </div>
      </div>

      {/* Tabela de Séries */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 text-[11px] font-semibold text-muted-foreground">
              <th className="py-2.5 pl-2 pr-3">SÉRIE</th>
              <th className="px-3 py-2.5">TIPO</th>
              <th className="px-3 py-2.5">ANTERIOR</th>
              <th className="px-3 py-2.5">CARGA (KG)</th>
              <th className="px-3 py-2.5">REPS</th>
              <th className="px-3 py-2.5">RIR</th>
              <th className="py-2.5 pl-3 pr-2 text-center">CHECK</th>
              <th className="py-2.5 pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sets.map((set) => {
              const isWeightPR =
                set.previousWeight !== undefined && set.weight > set.previousWeight;
              const isRepsPR =
                set.previousReps !== undefined &&
                set.weight >= (set.previousWeight ?? 0) &&
                set.reps > set.previousReps;
              const hasProgress = isWeightPR || isRepsPR;

              return (
                <tr
                  key={set.id}
                  className={`transition-colors ${
                    set.completed ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Número da Série */}
                  <td className="py-3 pl-2 pr-3 font-mono font-bold text-muted-foreground">
                    #{set.setNumber}
                  </td>

                  {/* Dropdown Tipo de Série */}
                  <td className="px-3 py-3">
                    <select
                      value={set.type}
                      onChange={(e) =>
                        handleUpdate(set.id, 'type', e.target.value as SetType)
                      }
                      className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary"
                    >
                      <option value="Aquecimento">Aquecimento</option>
                      <option value="Preparatória">Preparatória</option>
                      <option value="Trabalho">Trabalho</option>
                      <option value="Falha">Falha</option>
                      <option value="Drop-set">Drop-set</option>
                    </select>
                  </td>

                  {/* Histórico do Treino Anterior */}
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground/80">
                    {set.previousWeight ? `${set.previousWeight}kg × ${set.previousReps}` : '—'}
                  </td>

                  {/* Carga Atual com Badge de Progressão */}
                  <td className="px-3 py-3">
                    <div className="relative flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.weight}
                        onChange={(e) =>
                          handleUpdate(set.id, 'weight', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 rounded border border-border bg-background px-2 py-1 font-mono text-xs font-semibold text-foreground text-center focus:border-primary"
                      />
                      {hasProgress && (
                        <span
                          title="Progressão de Carga!"
                          className="flex items-center gap-0.5 rounded bg-primary/20 px-1 py-0.5 text-[10px] font-extrabold text-primary animate-pulse"
                        >
                          <Trophy size={11} className="text-primary" />
                          <ArrowUp size={10} />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Repetições */}
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="1"
                      value={set.reps}
                      onChange={(e) =>
                        handleUpdate(set.id, 'reps', parseInt(e.target.value) || 0)
                      }
                      className="w-14 rounded border border-border bg-background px-2 py-1 font-mono text-xs font-semibold text-foreground text-center focus:border-primary"
                    />
                  </td>

                  {/* RIR (Reps in Reserve 0 a 5) */}
                  <td className="px-3 py-3">
                    <select
                      value={set.rir}
                      onChange={(e) =>
                        handleUpdate(set.id, 'rir', parseInt(e.target.value))
                      }
                      className="rounded border border-border bg-background px-2 py-1 font-mono text-xs text-foreground focus:border-primary"
                    >
                      <option value={0}>0 (Falha)</option>
                      <option value={1}>1 (Quase)</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5+</option>
                    </select>
                  </td>

                  {/* Checkbox de Conclusão */}
                  <td className="py-3 pl-3 pr-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(set.id)}
                      className={`inline-flex size-7 items-center justify-center rounded border transition-all ${
                        set.completed
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/60'
                      }`}
                    >
                      <Check size={14} strokeWidth={set.completed ? 3 : 2} />
                    </button>
                  </td>

                  {/* Excluir Série */}
                  <td className="py-3 pr-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(set.id)}
                      className="text-muted-foreground/60 transition-colors hover:text-destructive"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Botão Adicionar Série */}
      <div className="mt-4 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSet}
          className="flex items-center gap-1.5 text-xs border-dashed"
        >
          <Plus size={14} /> Adicionar Série
        </Button>

        {onSaveSets && (
          <Button
            type="button"
            size="sm"
            onClick={() => onSaveSets(sets)}
            className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            Salvar Exercício
          </Button>
        )}
      </div>

      {/* TIMER INTELIGENTE FLUTUANTE */}
      {restTime > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-primary/40 bg-card/95 px-5 py-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Clock size={20} className={timerActive ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Descanso Ativo
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
    </div>
  );
}

export default WorkoutLogger;
