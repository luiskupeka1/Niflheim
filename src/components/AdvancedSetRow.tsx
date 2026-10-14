import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Check, 
  Flame, 
  Clock, 
  ArrowDown, 
  Sparkles, 
  Plus, 
  Trash2, 
  MoreVertical,
  Layers,
  Zap,
  Info,
  Target,
  CornerDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  type BaseSetType, 
  type IntensityTechnique 
} from '@/lib/volumeTracker';

export interface DropSubSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface MyoMicroSet {
  id: string;
  reps: number;
  completed: boolean;
}

export interface ClusterBlock {
  id: string;
  reps: number;
  completed: boolean;
}

export interface RestPauseSubSet {
  id: string;
  reps: number;
  completed: boolean;
}

export interface AdvancedSetRowData {
  id: string;
  setNumber: number;
  baseType: BaseSetType;
  technique: IntensityTechnique;
  targetWeight?: number; // Carga programada/meta
  targetReps?: number;   // Repetições programadas/meta
  targetRepsText?: string; // ex: "8-12", "(4+3+2 reps)"
  restSeconds?: number;  // Descanso pós-série em segundos (ex: 60s, 90s, 120s, 180s)
  intraRestSeconds?: number; // Pausa intra-bloco para Cluster/Rest-Pause/Muscle Rounds (ex: 15s)
  weight: number;        // Carga realmente levantada
  reps: number;          // Repetições realmente levantadas
  rir: number;           // 0 a 5 (reps guardadas antes de falhar)
  previousWeight?: number;
  previousReps?: number;
  previousRir?: number;
  completed: boolean;
  xpAwarded?: number;
  xpReason?: string;
  dropSets?: DropSubSet[];
  myoMicroSets?: MyoMicroSet[];
  clusterBlocks?: ClusterBlock[];
  restPauseSubSets?: RestPauseSubSet[];
  muscleRoundBlocks?: ClusterBlock[];
}

interface AdvancedSetRowProps {
  data: AdvancedSetRowData;
  workingIndex?: number; // Índice real entre as séries de trabalho (ex: #1, #2...)
  mode?: 'EXECUTE' | 'PLAN'; // 'PLAN' = Pré-definir Séries / 'EXECUTE' = Treinar Agora
  restWarmupSeconds?: number;
  restWorkingSeconds?: number;
  onUpdate: (updated: AdvancedSetRowData) => void;
  onDelete: () => void;
  onTriggerRestTimer: (seconds: number) => void;
  onCelebratePR?: (info: { weight: number; reps: number; tonnage: number }) => void;
}

export function AdvancedSetRow({
  data,
  workingIndex,
  mode = 'EXECUTE',
  restWarmupSeconds = 60,
  restWorkingSeconds = 120,
  onUpdate,
  onDelete,
  onTriggerRestTimer,
  onCelebratePR,
}: AdvancedSetRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  // Micro-temporizador para Myo-reps, Cluster sets e Rest-Pause (10 a 20 segundos)
  const [microTimer, setMicroTimer] = useState<number>(0);
  const [microTimerActive, setMicroTimerActive] = useState<boolean>(false);

  const isPreparatory = data.baseType === 'WARMUP' || data.baseType === 'FEEDER' || data.baseType === 'PAP';

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (microTimerActive && microTimer > 0) {
      timer = setInterval(() => {
        setMicroTimer((t) => {
          if (t <= 1) {
            setMicroTimerActive(false);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([150, 50, 150]);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [microTimerActive, microTimer]);

  const startMicroRest = (seconds = 15) => {
    setMicroTimer(seconds);
    setMicroTimerActive(true);
  };

  // Cálculo da Tonelagem Total (Carga x Repetições)
  const currentTonnage = data.weight * data.reps;
  const previousTonnage = (data.previousWeight ?? 0) * (data.previousReps ?? 0);

  // Verificação de Meta de Carga Batida
  const isTargetAchieved = 
    data.targetWeight !== undefined && 
    data.weight >= data.targetWeight && 
    (data.targetReps === undefined || data.reps >= data.targetReps);

  // PR só faz sentido em séries de trabalho efetivas
  const isPrTonnage = 
    !isPreparatory &&
    ((previousTonnage > 0 && currentTonnage > previousTonnage) ||
     ((data.previousWeight ?? 0) > 0 && data.weight > (data.previousWeight ?? 0)) ||
     isTargetAchieved);

  const handleToggleComplete = () => {
    const nextCompleted = !data.completed;
    onUpdate({ ...data, completed: nextCompleted });

    if (nextCompleted) {
      if (data.technique === 'MYO_REPS' || data.technique === 'CLUSTER_SET' || data.technique === 'REST_PAUSE') {
        startMicroRest(15);
      }
      
      // Sempre dispara o cronômetro oficial de descanso da sessão!
      if (isPreparatory) {
        onTriggerRestTimer(restWarmupSeconds);
      } else {
        onTriggerRestTimer(restWorkingSeconds);
      }

      // Se for série de trabalho e bateu PR, dispara celebração com partículas douradas!
      if (!isPreparatory && isPrTonnage) {
        onCelebratePR?.({
          weight: data.weight,
          reps: data.reps,
          tonnage: currentTonnage,
        });
      }
    }
  };

  // Manipulação de Tipos e Técnicas
  const handleSelectSetMode = (mode: string) => {
    if (mode === 'WARMUP' || mode === 'FEEDER' || mode === 'PAP') {
      onUpdate({ ...data, baseType: mode as BaseSetType, technique: 'NONE' });
      return;
    }

    if (mode === 'BACKOFF') {
      const discountedWeight = data.weight > 0 ? Math.round(data.weight * 0.88 * 2) / 2 : data.weight;
      onUpdate({ 
        ...data, 
        baseType: 'BACKOFF', 
        technique: 'NONE', 
        weight: discountedWeight 
      });
      return;
    }

    if (mode === 'CLUSTER_SET') {
      onUpdate({
        ...data,
        baseType: 'WORKING',
        technique: 'CLUSTER_SET',
        intraRestSeconds: data.intraRestSeconds ?? 15,
        restSeconds: data.restSeconds ?? 180,
        clusterBlocks: data.clusterBlocks && data.clusterBlocks.length > 0 ? data.clusterBlocks : [
          { id: crypto.randomUUID(), reps: 2, completed: false },
          { id: crypto.randomUUID(), reps: 2, completed: false },
          { id: crypto.randomUUID(), reps: 2, completed: false },
        ],
      });
      return;
    }

    if (mode === 'MYO_REPS') {
      onUpdate({
        ...data,
        baseType: 'WORKING',
        technique: 'MYO_REPS',
        intraRestSeconds: data.intraRestSeconds ?? 15,
        restSeconds: data.restSeconds ?? 150,
        myoMicroSets: data.myoMicroSets && data.myoMicroSets.length > 0 ? data.myoMicroSets : [
          { id: crypto.randomUUID(), reps: 4, completed: false },
          { id: crypto.randomUUID(), reps: 4, completed: false },
          { id: crypto.randomUUID(), reps: 3, completed: false },
        ],
      });
      return;
    }

    if (mode === 'DROP_SET') {
      onUpdate({
        ...data,
        baseType: 'WORKING',
        technique: 'DROP_SET',
        intraRestSeconds: 0,
        restSeconds: data.restSeconds ?? 120,
        dropSets: data.dropSets && data.dropSets.length > 0 ? data.dropSets : [
          { id: crypto.randomUUID(), weight: Math.round((data.weight > 0 ? data.weight : 40) * 0.75 * 2) / 2, reps: 8, completed: false },
        ],
      });
      return;
    }

    if (mode === 'REST_PAUSE') {
      onUpdate({
        ...data,
        baseType: 'WORKING',
        technique: 'REST_PAUSE',
        intraRestSeconds: data.intraRestSeconds ?? 15,
        restSeconds: data.restSeconds ?? 180,
        restPauseSubSets: data.restPauseSubSets && data.restPauseSubSets.length > 0 ? data.restPauseSubSets : [
          { id: crypto.randomUUID(), reps: 3, completed: false },
          { id: crypto.randomUUID(), reps: 2, completed: false },
        ],
      });
      return;
    }

    if (mode === 'MUSCLE_ROUNDS') {
      onUpdate({
        ...data,
        baseType: 'WORKING',
        technique: 'MUSCLE_ROUNDS',
        intraRestSeconds: data.intraRestSeconds ?? 15,
        restSeconds: data.restSeconds ?? 180,
        muscleRoundBlocks: data.muscleRoundBlocks && data.muscleRoundBlocks.length > 0 ? data.muscleRoundBlocks : [
          { id: crypto.randomUUID(), reps: 2, completed: false },
          { id: crypto.randomUUID(), reps: 2, completed: false },
          { id: crypto.randomUUID(), reps: 2, completed: false },
          { id: crypto.randomUUID(), reps: 2, completed: false },
          { id: crypto.randomUUID(), reps: 2, completed: false },
          { id: crypto.randomUUID(), reps: 2, completed: false },
        ],
      });
      return;
    }

    // Normal
    onUpdate({ ...data, baseType: 'WORKING', technique: 'NONE' });
  };

  // Render do Badge BaseSetType com nomenclaturas claras em inglês
  const renderBaseBadge = () => {
    switch (data.baseType) {
      case 'WARMUP':
        return (
          <span 
            title="Warm-up: Aquecimento Articular / Ativação (Não conta no MEV/MAV)"
            className="flex h-7 px-2 items-center justify-center rounded-lg bg-muted/80 border border-muted-foreground/30 font-mono text-[10px] font-black text-muted-foreground shrink-0"
          >
            Warm-up
          </span>
        );
      case 'FEEDER':
        return (
          <span 
            title="Feeder: Preparatória / Calibração Neural de Carga"
            className="flex h-7 px-2 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 font-mono text-[10px] font-black text-amber-400 shrink-0"
          >
            Feeder
          </span>
        );
      case 'PAP':
        return (
          <span 
            title="PAP (Potenciação Pós-Ativação): Ativação neural pré-working set"
            className="flex h-7 px-2 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/50 font-mono text-[10px] font-black text-purple-400 shrink-0"
          >
            PAP
          </span>
        );
      case 'BACKOFF':
        return (
          <span 
            title="Back-off Set: Série de redução de carga e alto volume"
            className="flex h-7 px-2 items-center justify-center rounded-lg bg-chart-2/20 border border-chart-2/40 font-mono text-[10px] font-black text-chart-2 shrink-0"
          >
            Back-off
          </span>
        );
      case 'WORKING':
      default:
        return (
          <span 
            title={`Série de Trabalho (Work Set #${workingIndex ?? data.setNumber})`}
            className="flex h-7 px-2 items-center justify-center rounded-lg bg-primary font-mono text-[10px] font-black text-primary-foreground shadow-sm shrink-0"
          >
            Work #{workingIndex ?? data.setNumber}
          </span>
        );
    }
  };

  // Valor atual do seletor
  const currentSelectValue = () => {
    if (data.baseType === 'WARMUP') return 'WARMUP';
    if (data.baseType === 'FEEDER') return 'FEEDER';
    if (data.baseType === 'PAP') return 'PAP';
    if (data.baseType === 'BACKOFF') return 'BACKOFF';
    if (data.technique === 'CLUSTER_SET') return 'CLUSTER_SET';
    if (data.technique === 'MYO_REPS') return 'MYO_REPS';
    if (data.technique === 'DROP_SET') return 'DROP_SET';
    if (data.technique === 'REST_PAUSE') return 'REST_PAUSE';
    if (data.technique === 'MUSCLE_ROUNDS') return 'MUSCLE_ROUNDS';
    return 'WORKING_NORMAL';
  };

  if (mode === 'PLAN') {
    return (
      <div className="rounded-xl border border-border/60 bg-card/50 p-2.5 sm:p-3 space-y-2.5 transition-all shadow-xs">
        {/* Linha 1: Badge + Seletor de Tipo/Técnica + Lixeira */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {renderBaseBadge()}
            {isPreparatory ? (
              <select
                value={data.baseType}
                onChange={(e) => handleSelectSetMode(e.target.value)}
                className="rounded-xl border border-border/70 bg-background/90 px-2 py-1 text-[11px] font-bold text-muted-foreground focus:border-primary truncate w-full max-w-[190px]"
              >
                <option value="WARMUP">Aquecimento (W)</option>
                <option value="FEEDER">Feeder / Calibração (F)</option>
                <option value="PAP">PAP (Potenciação)</option>
              </select>
            ) : (
              <select
                value={currentSelectValue()}
                onChange={(e) => handleSelectSetMode(e.target.value)}
                className="rounded-xl border border-primary/40 bg-background px-2 py-1 text-[11px] font-black text-foreground focus:border-primary truncate w-full max-w-[190px]"
              >
                <option value="WORKING_NORMAL">Série Normal</option>
                <option value="BACKOFF">Back-off Set (B)</option>
                <option value="REST_PAUSE">Rest-Pause (Pausa 15s)</option>
                <option value="MYO_REPS">Myo-Reps (Ativação)</option>
                <option value="CLUSTER_SET">Cluster Set (Blocos)</option>
                <option value="MUSCLE_ROUNDS">Muscle Rounds (6×2 / 15s)</option>
                <option value="DROP_SET">Drop Set (Redução)</option>
              </select>
            )}
          </div>

          <button
            type="button"
            onClick={onDelete}
            title="Remover série"
            className="p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Linha 2: Metas (Carga, Reps, Descanso) compactas e touch friendly no mobile */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase">Carga:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={data.targetWeight ?? data.weight ?? 0}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdate({ ...data, targetWeight: val, weight: val });
              }}
              className="!w-14 !h-7 !p-0 !bg-background border border-border/80 rounded-lg text-center font-mono text-xs font-bold text-foreground focus:border-primary"
            />
            <span className="text-[10px] text-muted-foreground">kg</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase">Reps:</span>
            <input
              type="number"
              min="1"
              value={data.targetReps ?? data.reps ?? 10}
              placeholder="10"
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                onUpdate({ ...data, targetReps: val, reps: val });
              }}
              className="!w-12 !h-7 !p-0 !bg-background border border-border/80 rounded-lg text-center font-mono text-xs font-bold text-foreground focus:border-primary"
            />
            <span className="text-[10px] text-muted-foreground">reps</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase">Descanso:</span>
            <input
              type="number"
              min="10"
              max="600"
              step="5"
              value={data.restSeconds ?? (isPreparatory ? restWarmupSeconds : restWorkingSeconds)}
              placeholder="60"
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 60;
                onUpdate({ ...data, restSeconds: val });
              }}
              className="!w-14 !h-7 !p-0 !bg-background border border-border/80 rounded-lg text-center font-mono text-xs font-bold text-foreground focus:border-primary"
            />
            <span className="text-[10px] text-muted-foreground">s</span>
          </div>
        </div>

        {/* Linha 3: Configuração de Sub-blocos para Técnicas Avançadas no Modo PLAN */}
        {!isPreparatory && data.technique !== 'NONE' && (
          <div className="pt-2 border-t border-primary/20 space-y-2">
            {/* Header com Ajuste do Descanso Intra-Bloco Diferenciado */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
              <span className="font-bold text-primary flex items-center gap-1">
                <Layers size={12} />
                {data.technique === 'CLUSTER_SET' && 'Configuração de Cluster Set (Mini-Blocos)'}
                {data.technique === 'REST_PAUSE' && 'Configuração de Rest-Pause (Pausa Curta)'}
                {data.technique === 'MYO_REPS' && 'Configuração de Myo-Reps (Ativação + Micro)'}
                {data.technique === 'MUSCLE_ROUNDS' && 'Configuração de Muscle Rounds (6 Rounds)'}
                {data.technique === 'DROP_SET' && 'Configuração de Drop-Set (Redução de Carga)'}
              </span>

              {data.technique !== 'DROP_SET' && (
                <div className="flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded-lg border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground">Pausa Intra:</span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    step="5"
                    value={data.intraRestSeconds ?? 15}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 15;
                      onUpdate({ ...data, intraRestSeconds: val });
                    }}
                    className="!w-9 !h-5 !p-0 text-center font-mono text-[11px] font-bold text-primary border-0 bg-transparent focus:ring-0"
                  />
                  <span className="text-[10px] text-muted-foreground">s</span>
                </div>
              )}
            </div>

            {/* 1. CLUSTER SET */}
            {data.technique === 'CLUSTER_SET' && (
              <div className="flex flex-wrap items-center gap-1.5">
                {(data.clusterBlocks && data.clusterBlocks.length > 0 ? data.clusterBlocks : [
                  { id: crypto.randomUUID(), reps: 2, completed: false },
                  { id: crypto.randomUUID(), reps: 2, completed: false },
                  { id: crypto.randomUUID(), reps: 2, completed: false },
                ]).map((block, idx, arr) => (
                  <div key={block.id} className="flex items-center gap-1 bg-background/80 border border-border/80 rounded-lg px-2 py-1 text-xs">
                    <span className="text-[10px] font-mono text-primary font-bold">#{idx + 1}:</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={block.reps}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const updated = arr.map((b) => b.id === block.id ? { ...b, reps: val } : b);
                        onUpdate({ ...data, clusterBlocks: updated });
                      }}
                      className="!w-8 !h-5 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                    />
                    <span className="text-[9px] text-muted-foreground">reps</span>
                    {arr.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = arr.filter((b) => b.id !== block.id);
                          onUpdate({ ...data, clusterBlocks: updated });
                        }}
                        className="text-muted-foreground hover:text-destructive p-0.5 ml-0.5"
                        title="Remover bloco"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const current = data.clusterBlocks && data.clusterBlocks.length > 0 ? data.clusterBlocks : [];
                    const newBlock: ClusterBlock = { id: crypto.randomUUID(), reps: 2, completed: false };
                    onUpdate({ ...data, clusterBlocks: [...current, newBlock] });
                  }}
                  className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-lg border border-dashed border-primary/40 hover:bg-primary/10 transition-colors"
                >
                  + Bloco
                </button>
              </div>
            )}

            {/* 2. REST-PAUSE */}
            {data.technique === 'REST_PAUSE' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 bg-background/80 border border-chart-3/40 rounded-lg px-2 py-1 text-xs text-chart-3 font-bold">
                  <span className="text-[10px] uppercase font-mono">Ativação:</span>
                  <span className="font-mono">{data.targetReps ?? data.reps ?? 8} reps</span>
                </div>
                {(data.restPauseSubSets && data.restPauseSubSets.length > 0 ? data.restPauseSubSets : [
                  { id: crypto.randomUUID(), reps: 3, completed: false },
                  { id: crypto.randomUUID(), reps: 2, completed: false },
                ]).map((rp, idx, arr) => (
                  <div key={rp.id} className="flex items-center gap-1 bg-background/80 border border-border/80 rounded-lg px-2 py-1 text-xs">
                    <span className="text-[10px] font-mono text-muted-foreground">Pausa #{idx + 1}:</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={rp.reps}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const updated = arr.map((r) => r.id === rp.id ? { ...r, reps: val } : r);
                        onUpdate({ ...data, restPauseSubSets: updated });
                      }}
                      className="!w-8 !h-5 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                    />
                    <span className="text-[9px] text-muted-foreground">reps</span>
                    {arr.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = arr.filter((r) => r.id !== rp.id);
                          onUpdate({ ...data, restPauseSubSets: updated });
                        }}
                        className="text-muted-foreground hover:text-destructive p-0.5 ml-0.5"
                        title="Remover pausa"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const current = data.restPauseSubSets && data.restPauseSubSets.length > 0 ? data.restPauseSubSets : [];
                    const newRp: RestPauseSubSet = { id: crypto.randomUUID(), reps: 2, completed: false };
                    onUpdate({ ...data, restPauseSubSets: [...current, newRp] });
                  }}
                  className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-lg border border-dashed border-primary/40 hover:bg-primary/10 transition-colors"
                >
                  + Mini-Série
                </button>
              </div>
            )}

            {/* 3. MYO-REPS */}
            {data.technique === 'MYO_REPS' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 bg-background/80 border border-primary/40 rounded-lg px-2 py-1 text-xs text-primary font-bold">
                  <span className="text-[10px] uppercase font-mono">Ativação:</span>
                  <span className="font-mono">{data.targetReps ?? data.reps ?? 12} reps</span>
                </div>
                {(data.myoMicroSets && data.myoMicroSets.length > 0 ? data.myoMicroSets : [
                  { id: crypto.randomUUID(), reps: 4, completed: false },
                  { id: crypto.randomUUID(), reps: 4, completed: false },
                  { id: crypto.randomUUID(), reps: 3, completed: false },
                ]).map((micro, idx, arr) => (
                  <div key={micro.id} className="flex items-center gap-1 bg-background/80 border border-border/80 rounded-lg px-2 py-1 text-xs">
                    <span className="text-[10px] font-mono text-muted-foreground">Micro #{idx + 1}:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={micro.reps}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const updated = arr.map((m) => m.id === micro.id ? { ...m, reps: val } : m);
                        onUpdate({ ...data, myoMicroSets: updated });
                      }}
                      className="!w-8 !h-5 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                    />
                    <span className="text-[9px] text-muted-foreground">reps</span>
                    {arr.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = arr.filter((m) => m.id !== micro.id);
                          onUpdate({ ...data, myoMicroSets: updated });
                        }}
                        className="text-muted-foreground hover:text-destructive p-0.5 ml-0.5"
                        title="Remover micro-série"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const current = data.myoMicroSets && data.myoMicroSets.length > 0 ? data.myoMicroSets : [];
                    const newMicro: MyoMicroSet = { id: crypto.randomUUID(), reps: 3, completed: false };
                    onUpdate({ ...data, myoMicroSets: [...current, newMicro] });
                  }}
                  className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-lg border border-dashed border-primary/40 hover:bg-primary/10 transition-colors"
                >
                  + Micro
                </button>
              </div>
            )}

            {/* 4. MUSCLE ROUNDS */}
            {data.technique === 'MUSCLE_ROUNDS' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground block">
                  6 Rounds de reps curtas com 15s de pausa intra:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(data.muscleRoundBlocks && data.muscleRoundBlocks.length > 0 ? data.muscleRoundBlocks : [
                    { id: crypto.randomUUID(), reps: 2, completed: false },
                    { id: crypto.randomUUID(), reps: 2, completed: false },
                    { id: crypto.randomUUID(), reps: 2, completed: false },
                    { id: crypto.randomUUID(), reps: 2, completed: false },
                    { id: crypto.randomUUID(), reps: 2, completed: false },
                    { id: crypto.randomUUID(), reps: 2, completed: false },
                  ]).map((round, idx, arr) => (
                    <div key={round.id} className="flex items-center gap-1 bg-background/80 border border-border/80 rounded-lg px-2 py-1 text-xs">
                      <span className="text-[10px] font-mono text-primary font-bold">R{idx + 1}:</span>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={round.reps}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          const updated = arr.map((r) => r.id === round.id ? { ...r, reps: val } : r);
                          onUpdate({ ...data, muscleRoundBlocks: updated });
                        }}
                        className="!w-7 !h-5 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                      />
                      <span className="text-[9px] text-muted-foreground">reps</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. DROP-SET */}
            {data.technique === 'DROP_SET' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground block">
                  Redução imediata de peso (sem descanso entre drops):
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {(data.dropSets && data.dropSets.length > 0 ? data.dropSets : [
                    { id: crypto.randomUUID(), weight: Math.round((data.targetWeight || data.weight || 40) * 0.75 * 2) / 2, reps: 8, completed: false },
                  ]).map((drop, idx, arr) => (
                    <div key={drop.id} className="flex items-center gap-1.5 bg-background/80 border border-border/80 rounded-lg px-2 py-1 text-xs">
                      <span className="text-[10px] font-mono text-destructive font-bold">Drop #{idx + 1}:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={drop.weight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = arr.map((d) => d.id === drop.id ? { ...d, weight: val } : d);
                          onUpdate({ ...data, dropSets: updated });
                        }}
                        className="!w-12 !h-5 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                      />
                      <span className="text-[9px] text-muted-foreground">kg ×</span>
                      <input
                        type="number"
                        min="1"
                        value={drop.reps}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          const updated = arr.map((d) => d.id === drop.id ? { ...d, reps: val } : d);
                          onUpdate({ ...data, dropSets: updated });
                        }}
                        className="!w-8 !h-5 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                      />
                      <span className="text-[9px] text-muted-foreground">reps</span>
                      {arr.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = arr.filter((d) => d.id !== drop.id);
                            onUpdate({ ...data, dropSets: updated });
                          }}
                          className="text-muted-foreground hover:text-destructive p-0.5 ml-0.5"
                          title="Remover drop"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const current = data.dropSets && data.dropSets.length > 0 ? data.dropSets : [];
                      const lastWeight = current[current.length - 1]?.weight ?? (data.targetWeight || data.weight || 40);
                      const newDrop: DropSubSet = {
                        id: crypto.randomUUID(),
                        weight: Math.round(lastWeight * 0.75 * 2) / 2,
                        reps: 6,
                        completed: false,
                      };
                      onUpdate({ ...data, dropSets: [...current, newDrop] });
                    }}
                    className="text-[11px] font-bold text-destructive px-2.5 py-1 rounded-lg border border-dashed border-destructive/40 hover:bg-destructive/10 transition-colors"
                  >
                    + Adicionar Drop
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`rounded-2xl border transition-all p-3 space-y-3 ${
        isPreparatory
          ? data.completed
            ? 'border-border/60 bg-muted/20 opacity-80'
            : 'border-border/40 bg-card/40'
          : data.completed 
            ? 'border-primary/50 bg-primary/5' 
            : 'border-border/70 bg-card/70 hover:border-border'
      }`}
    >
      {/* Linha Principal da Série: Mobile 2 Linhas / Desktop Linha Única */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        {/* Linha 1 (Mobile) / Esquerda (Desktop): Badge + Seletor de Tipo + Ações Secundárias no Mobile */}
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {renderBaseBadge()}

            {/* SELETOR: SE PREPARATÓRIA, APENAS OPÇÕES PREPARATÓRIAS. SE TRABALHO, APENAS TÉCNICAS DE TRABALHO! */}
            {isPreparatory ? (
              <select
                value={data.baseType}
                onChange={(e) => handleSelectSetMode(e.target.value)}
                className="rounded-xl border border-border/60 bg-background/90 px-2 py-1 text-[11px] font-bold text-muted-foreground focus:border-primary max-w-[170px] sm:max-w-none truncate"
              >
                <option value="WARMUP">Aquecimento (W)</option>
                <option value="FEEDER">Feeder / Calibração (F)</option>
                <option value="PAP">PAP (Potenciação Pós-Ativação)</option>
              </select>
            ) : (
              <select
                value={currentSelectValue()}
                onChange={(e) => handleSelectSetMode(e.target.value)}
                className="rounded-xl border border-primary/40 bg-background px-2 py-1 text-[11px] font-black text-foreground focus:border-primary max-w-[170px] sm:max-w-none truncate"
              >
                <option value="WORKING_NORMAL">Série Normal</option>
                <option value="BACKOFF">Back-off Set (B)</option>
                <option value="CLUSTER_SET">Cluster Set (Blocos)</option>
                <option value="MYO_REPS">Myo-Reps (Ativação)</option>
                <option value="REST_PAUSE">Rest-Pause (Pausa 15s)</option>
                <option value="MUSCLE_ROUNDS">Muscle Rounds (6×2 / 15s)</option>
                <option value="DROP_SET">Drop Set (Redução)</option>
              </select>
            )}

            {data.technique !== 'NONE' && (
              <span className="hidden xs:inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-black text-primary uppercase">
                {data.technique.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Controles de descanso rápido e lixeira no cabeçalho da linha no mobile */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              type="button"
              onClick={() => onTriggerRestTimer(isPreparatory ? restWarmupSeconds : restWorkingSeconds)}
              title={`Iniciar descanso de ${isPreparatory ? restWarmupSeconds : restWorkingSeconds}s`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-border/80 bg-background text-[11px] font-mono font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <Clock size={11} className="text-primary" />
              <span>{isPreparatory ? restWarmupSeconds : restWorkingSeconds}s</span>
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Remover série"
              className="p-1 text-muted-foreground/60 hover:text-destructive transition-colors rounded-lg"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Linha 2 (Mobile) / Direita (Desktop): Inputs de Carga, Reps, RIR + Botão Concluir */}
        <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-2 sm:border-t-0 sm:pt-0 sm:justify-end sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Input Carga */}
            <div className="relative text-center">
              <input
                type="number"
                step="0.5"
                min="0"
                value={data.weight === 0 ? '' : data.weight}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = val === '' ? 0 : parseFloat(val) || 0;
                  onUpdate({ ...data, weight: num, targetWeight: num });
                }}
                className="w-14 sm:w-16 rounded-xl border border-border bg-background px-1 sm:px-2 py-1 text-center font-mono text-xs font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[9px] text-muted-foreground block font-bold">kg</span>
            </div>

            {/* Input Repetições */}
            <div className="relative text-center">
              <input
                type="number"
                min="0"
                value={data.reps === 0 ? '' : data.reps}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = val === '' ? 0 : parseInt(val) || 0;
                  onUpdate({ ...data, reps: num, targetReps: num });
                }}
                className="w-12 sm:w-14 rounded-xl border border-border bg-background px-1 sm:px-2 py-1 text-center font-mono text-xs font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[9px] text-muted-foreground block font-bold">reps</span>
            </div>

            {/* Input RIR */}
            <div className="relative text-center flex flex-col items-center">
              <div className="flex items-center gap-1">
                <select
                  value={typeof data.rir === 'number' && data.rir <= 5 ? data.rir : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      onUpdate({ ...data, rir: 6 });
                    } else {
                      onUpdate({ ...data, rir: parseInt(e.target.value) });
                    }
                  }}
                  className="rounded-xl border border-border bg-background px-1.5 py-1 font-mono text-[11px] font-bold text-foreground focus:border-primary"
                  title="RIR (Reps in Reserve)"
                >
                  <option value={0}>0 (Falha)</option>
                  <option value={1}>1 rep</option>
                  <option value={2}>2 reps</option>
                  <option value={3}>3 reps</option>
                  <option value={4}>4 reps</option>
                  <option value={5}>5 reps</option>
                  <option value="custom">5+</option>
                </select>

                {(typeof data.rir !== 'number' || data.rir >= 5) && (
                  <input
                    type="text"
                    value={data.rir === 5 ? '5+' : data.rir}
                    placeholder="6+"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseInt(val);
                      onUpdate({ ...data, rir: isNaN(num) ? val : num });
                    }}
                    className="w-10 sm:w-12 rounded-xl border border-primary/50 bg-background px-1 py-1 text-center font-mono text-[11px] font-bold text-primary focus:border-primary"
                  />
                )}
              </div>
              <span className="text-[9px] text-muted-foreground block mt-0.5 font-bold">
                RIR
              </span>
            </div>
          </div>

          {/* Gamificação PR e Ações Desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isPrTonnage && (
              <div 
                title={`Novo recorde pessoal de tonelagem!`}
                className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-primary animate-bounce shrink-0"
              >
                <Trophy size={11} />
                <span className="hidden xs:inline">NOVO</span> PR
              </div>
            )}

            {/* Descanso rápido visível apenas no desktop aqui */}
            <button
              type="button"
              onClick={() => onTriggerRestTimer(isPreparatory ? restWarmupSeconds : restWorkingSeconds)}
              title={`Iniciar descanso de ${isPreparatory ? restWarmupSeconds : restWorkingSeconds}s`}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/80 bg-background/80 text-[11px] font-mono font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all cursor-pointer"
            >
              <Clock size={12} className="text-primary" />
              <span>{isPreparatory ? restWarmupSeconds : restWorkingSeconds}s</span>
            </button>

            {/* BOTÃO CONCLUIR SÉRIE TOUCH FRIENDLY */}
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`inline-flex items-center justify-center gap-1 px-3 sm:px-3.5 py-1.5 h-8 sm:h-8 rounded-xl border text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                data.completed
                  ? isPreparatory
                    ? 'border-muted-foreground bg-muted text-foreground'
                    : 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm'
                  : 'border-primary/60 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md'
              }`}
            >
              <Check size={14} strokeWidth={data.completed ? 3 : 2} />
              <span>{data.completed ? 'Feita' : 'Concluir'}</span>
            </button>

            {/* Lixeira no desktop */}
            <button
              type="button"
              onClick={onDelete}
              title="Remover série"
              className="hidden sm:inline-flex p-1.5 text-muted-foreground/60 hover:text-destructive rounded-xl transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* SUB-LINHAS DINÂMICAS: 1. CLUSTER SET (BLOCOS INTRA-SÉRIE COM MICRO-DESCANSO) */}
      {data.technique === 'CLUSTER_SET' && data.clusterBlocks && (
        <div className="ml-2 sm:ml-8 rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-primary">
            <span>Cluster Set com {data.weight}kg (Quebra em mini-blocos com 15s de descanso intra-série):</span>
            {microTimer > 0 && (
              <span className="font-mono text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <Clock size={11} /> Micro-descanso: {microTimer}s
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data.clusterBlocks.map((block, bIdx) => (
              <div 
                key={block.id}
                className="flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1 shadow-sm"
              >
                <span className="text-[10px] text-primary font-mono font-bold">Bloco #{bIdx + 1}:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={block.reps}
                  onChange={(e) => {
                    const newReps = parseInt(e.target.value) || 0;
                    const updated = data.clusterBlocks?.map((b) =>
                      b.id === block.id ? { ...b, reps: newReps } : b
                    );
                    onUpdate({ ...data, clusterBlocks: updated });
                  }}
                  className="w-8 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                />
                <span className="text-[9px] text-muted-foreground">reps</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !block.completed;
                    const updated = data.clusterBlocks?.map((b) =>
                      b.id === block.id ? { ...b, completed: nextState } : b
                    );
                    onUpdate({ ...data, clusterBlocks: updated });
                    if (nextState) startMicroRest(15);
                  }}
                  className={`size-5 rounded border flex items-center justify-center transition-all ${
                    block.completed 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border text-muted-foreground hover:border-primary'
                  }`}
                >
                  <Check size={11} strokeWidth={3} />
                </button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newBlock: ClusterBlock = { id: crypto.randomUUID(), reps: 2, completed: false };
                onUpdate({ ...data, clusterBlocks: [...(data.clusterBlocks || []), newBlock] });
              }}
              className="text-[10px] h-6 border-dashed"
            >
              + Mini-Bloco
            </Button>
          </div>
        </div>
      )}

      {/* SUB-LINHAS DINÂMICAS: 2. MYO-REPS (ATIVAÇÃO + MICRO-SÉRIES) */}
      {data.technique === 'MYO_REPS' && data.myoMicroSets && (
        <div className="ml-2 sm:ml-8 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-primary">
            <span>Série de Ativação ({data.reps} reps) + Micro-séries (15s descanso):</span>
            {microTimer > 0 && (
              <span className="font-mono text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <Clock size={11} /> Micro-descanso: {microTimer}s
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data.myoMicroSets.map((micro, idx) => (
              <div 
                key={micro.id}
                className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1"
              >
                <span className="text-[10px] text-muted-foreground font-mono">Micro #{idx + 1}:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={micro.reps}
                  onChange={(e) => {
                    const newReps = parseInt(e.target.value) || 0;
                    const updatedMicros = data.myoMicroSets?.map((m) =>
                      m.id === micro.id ? { ...m, reps: newReps } : m
                    );
                    onUpdate({ ...data, myoMicroSets: updatedMicros });
                  }}
                  className="w-8 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !micro.completed;
                    const updatedMicros = data.myoMicroSets?.map((m) =>
                      m.id === micro.id ? { ...m, completed: nextState } : m
                    );
                    onUpdate({ ...data, myoMicroSets: updatedMicros });
                    if (nextState) startMicroRest(15);
                  }}
                  className={`size-5 rounded border flex items-center justify-center ${
                    micro.completed 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <Check size={11} />
                </button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newMicro: MyoMicroSet = { id: crypto.randomUUID(), reps: 3, completed: false };
                onUpdate({ ...data, myoMicroSets: [...(data.myoMicroSets || []), newMicro] });
              }}
              className="text-[10px] h-6 border-dashed"
            >
              + Micro
            </Button>
          </div>
        </div>
      )}

      {/* SUB-LINHAS DINÂMICAS: 3. DROP-SET (REDUÇÃO IMEDIATA SEM DESCANSO) */}
      {data.technique === 'DROP_SET' && data.dropSets && (
        <div className="ml-2 sm:ml-8 rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-destructive">
            <span className="flex items-center gap-1">
              <ArrowDown size={13} /> Drops Acoplados (Redução imediata de -25% sem descanso):
            </span>
          </div>

          {data.dropSets.map((drop, idx) => (
            <div key={drop.id} className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-muted-foreground">Drop #{idx + 1}:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  value={drop.weight}
                  onChange={(e) => {
                    const newWeight = parseFloat(e.target.value) || 0;
                    const updatedDrops = data.dropSets?.map((d) =>
                      d.id === drop.id ? { ...d, weight: newWeight } : d
                    );
                    onUpdate({ ...data, dropSets: updatedDrops });
                  }}
                  className="w-16 rounded border border-border bg-background px-2 py-0.5 text-center font-mono text-xs font-bold"
                />
                <span className="text-[10px] text-muted-foreground">kg</span>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={drop.reps}
                  onChange={(e) => {
                    const newReps = parseInt(e.target.value) || 0;
                    const updatedDrops = data.dropSets?.map((d) =>
                      d.id === drop.id ? { ...d, reps: newReps } : d
                    );
                    onUpdate({ ...data, dropSets: updatedDrops });
                  }}
                  className="w-14 rounded border border-border bg-background px-2 py-0.5 text-center font-mono text-xs font-bold"
                />
                <span className="text-[10px] text-muted-foreground">reps</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !drop.completed;
                  const updatedDrops = data.dropSets?.map((d) =>
                    d.id === drop.id ? { ...d, completed: nextState } : d
                  );
                  onUpdate({ ...data, dropSets: updatedDrops });
                }}
                className={`size-6 rounded border flex items-center justify-center ${
                  drop.completed 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Check size={12} />
              </button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const lastWeight = data.dropSets?.[data.dropSets.length - 1]?.weight ?? data.weight;
              const newDrop: DropSubSet = {
                id: crypto.randomUUID(),
                weight: Math.round(lastWeight * 0.75 * 2) / 2,
                reps: 6,
                completed: false,
              };
              onUpdate({ ...data, dropSets: [...(data.dropSets || []), newDrop] });
            }}
            className="text-[10px] h-6 border-dashed"
          >
            + Adicionar Drop
          </Button>
        </div>
      )}

      {/* SUB-LINHAS DINÂMICAS: 4. REST-PAUSE (PAUSA 15-20S ATÉ NOVA FALHA) */}
      {data.technique === 'REST_PAUSE' && data.restPauseSubSets && (
        <div className="ml-2 sm:ml-8 rounded-lg border border-chart-3/40 bg-chart-3/5 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-chart-3">
            <span className="flex items-center gap-1">
              <CornerDownRight size={13} /> Rest-Pause (Descansa 15s e segue com a mesma carga de {data.weight}kg):
            </span>
            {microTimer > 0 && (
              <span className="font-mono text-xs bg-chart-3 text-background px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 font-black">
                <Clock size={11} /> Descanso Rest-Pause: {microTimer}s
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data.restPauseSubSets.map((rp, idx) => (
              <div 
                key={rp.id}
                className="flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1"
              >
                <span className="text-[10px] text-muted-foreground font-mono">Pós-Pausa #{idx + 1}:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rp.reps}
                  onChange={(e) => {
                    const newReps = parseInt(e.target.value) || 0;
                    const updated = data.restPauseSubSets?.map((r) =>
                      r.id === rp.id ? { ...r, reps: newReps } : r
                    );
                    onUpdate({ ...data, restPauseSubSets: updated });
                  }}
                  className="w-8 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                />
                <span className="text-[9px] text-muted-foreground">reps</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !rp.completed;
                    const updated = data.restPauseSubSets?.map((r) =>
                      r.id === rp.id ? { ...r, completed: nextState } : r
                    );
                    onUpdate({ ...data, restPauseSubSets: updated });
                    if (nextState) startMicroRest(15);
                  }}
                  className={`size-5 rounded border flex items-center justify-center ${
                    rp.completed 
                      ? 'border-chart-3 bg-chart-3 text-background font-bold' 
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <Check size={11} />
                </button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newRp: RestPauseSubSet = { id: crypto.randomUUID(), reps: 3, completed: false };
                onUpdate({ ...data, restPauseSubSets: [...(data.restPauseSubSets || []), newRp] });
              }}
              className="text-[10px] h-6 border-dashed"
            >
              + Mini-Série Rest-Pause
            </Button>
          </div>
        </div>
      )}

      {/* SUB-LINHAS DINÂMICAS: 5. MUSCLE ROUNDS (6 BLOCOS DE 2 REPS COM 15S INTRA-DESCANSO) */}
      {data.technique === 'MUSCLE_ROUNDS' && data.muscleRoundBlocks && (
        <div className="ml-2 sm:ml-8 rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-primary">
            <span>Muscle Rounds: 6 blocos com 15s de descanso intra-série</span>
            {microTimer > 0 && (
              <span className="font-mono text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 font-black">
                <Clock size={11} /> Micro-descanso: {microTimer}s
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data.muscleRoundBlocks.map((round, rIdx) => (
              <div 
                key={round.id}
                className="flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1"
              >
                <span className="text-[10px] text-muted-foreground font-mono">R#{rIdx + 1}:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={round.reps}
                  onChange={(e) => {
                    const newReps = parseInt(e.target.value) || 0;
                    const updated = data.muscleRoundBlocks?.map((r) =>
                      r.id === round.id ? { ...r, reps: newReps } : r
                    );
                    onUpdate({ ...data, muscleRoundBlocks: updated });
                  }}
                  className="w-7 text-center font-mono text-xs font-bold border-0 bg-transparent p-0 text-foreground"
                />
                <span className="text-[9px] text-muted-foreground">reps</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !round.completed;
                    const updated = data.muscleRoundBlocks?.map((r) =>
                      r.id === round.id ? { ...r, completed: nextState } : r
                    );
                    onUpdate({ ...data, muscleRoundBlocks: updated });
                    if (nextState) startMicroRest(15);
                  }}
                  className={`size-5 rounded border flex items-center justify-center ${
                    round.completed 
                      ? 'border-primary bg-primary text-primary-foreground font-bold' 
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <Check size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedSetRow;
