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
  weight: number;        // Carga realmente levantada
  reps: number;          // Repetições realmente levantadas
  rir: number;           // 0 a 5 (reps guardadas antes de falhar)
  previousWeight?: number;
  previousReps?: number;
  previousRir?: number;
  completed: boolean;
  dropSets?: DropSubSet[];
  myoMicroSets?: MyoMicroSet[];
  clusterBlocks?: ClusterBlock[];
  restPauseSubSets?: RestPauseSubSet[];
}

interface AdvancedSetRowProps {
  data: AdvancedSetRowData;
  workingIndex?: number; // Índice real entre as séries de trabalho (ex: #1, #2...)
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
        dropSets: data.dropSets && data.dropSets.length > 0 ? data.dropSets : [
          { id: crypto.randomUUID(), weight: Math.round(data.weight * 0.75 * 2) / 2, reps: 8, completed: false },
        ],
      });
      return;
    }

    if (mode === 'REST_PAUSE') {
      onUpdate({
        ...data,
        baseType: 'WORKING',
        technique: 'REST_PAUSE',
        restPauseSubSets: data.restPauseSubSets && data.restPauseSubSets.length > 0 ? data.restPauseSubSets : [
          { id: crypto.randomUUID(), reps: 4, completed: false },
        ],
      });
      return;
    }

    // Normal
    onUpdate({ ...data, baseType: 'WORKING', technique: 'NONE' });
  };

  // Render do Badge BaseSetType
  const renderBaseBadge = () => {
    switch (data.baseType) {
      case 'WARMUP':
        return (
          <span 
            title="Aquecimento Articular / Ativação (Não conta no MEV/MAV)"
            className="flex size-7 items-center justify-center rounded bg-muted/80 border border-muted-foreground/30 font-mono text-[11px] font-black text-muted-foreground"
          >
            W
          </span>
        );
      case 'FEEDER':
        return (
          <span 
            title="Preparatória / Feeder de Reconhecimento de Carga (1-3 reps de calibração neural)"
            className="flex size-7 items-center justify-center rounded bg-amber-500/20 border border-amber-500/40 font-mono text-[11px] font-black text-amber-500"
          >
            F
          </span>
        );
      case 'PAP':
        return (
          <span 
            title="PAP (Potenciação Pós-Ativação): 1-2 reps com sobrecarga máxima para acordar o SNC e aumentar produção de força"
            className="flex h-7 px-1.5 items-center justify-center rounded bg-purple-500/20 border border-purple-500/50 font-mono text-[10px] font-black text-purple-400"
          >
            PAP
          </span>
        );
      case 'BACKOFF':
        return (
          <span 
            title="Back-off Set (B)"
            className="flex size-7 items-center justify-center rounded bg-chart-2/20 border border-chart-2/40 font-mono text-[11px] font-black text-chart-2"
          >
            B
          </span>
        );
      case 'WORKING':
      default:
        return (
          <span 
            title={`Série de Trabalho Efetiva #${workingIndex ?? data.setNumber}`}
            className="flex size-7 items-center justify-center rounded bg-primary font-mono text-xs font-black text-primary-foreground shadow-sm"
          >
            {workingIndex !== undefined ? `#${workingIndex}` : `#${data.setNumber}`}
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
    return 'WORKING_NORMAL';
  };

  return (
    <div 
      className={`rounded-xl border transition-all p-3 space-y-3 ${
        isPreparatory
          ? data.completed
            ? 'border-border/60 bg-muted/20 opacity-80'
            : 'border-border/40 bg-card/40'
          : data.completed 
            ? 'border-primary/50 bg-primary/5' 
            : 'border-border/70 bg-card/70 hover:border-border'
      }`}
    >
      {/* Linha Principal da Série */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Lado Esquerdo: Badge e Seletor EXCLUSIVO para o contexto */}
        <div className="flex items-center gap-2">
          {renderBaseBadge()}

          {/* SELETOR: SE PREPARATÓRIA, APENAS OPÇÕES PREPARATÓRIAS. SE TRABALHO, APENAS TÉCNICAS DE TRABALHO! */}
          {isPreparatory ? (
            <select
              value={data.baseType}
              onChange={(e) => handleSelectSetMode(e.target.value)}
              className="rounded border border-border/60 bg-background/80 px-2 py-1 text-[11px] font-bold text-muted-foreground focus:border-primary"
            >
              <option value="WARMUP">Aquecimento / Ativação (W)</option>
              <option value="FEEDER">Feeder / Calibração (F)</option>
              <option value="PAP">PAP (Potenciação Pós-Ativação)</option>
            </select>
          ) : (
            <select
              value={currentSelectValue()}
              onChange={(e) => handleSelectSetMode(e.target.value)}
              className="rounded border border-primary/40 bg-background px-2.5 py-1 text-[11px] font-black text-foreground focus:border-primary"
            >
              <option value="WORKING_NORMAL">Série Normal de Trabalho</option>
              <option value="BACKOFF">Back-off Set (B)</option>
              <option value="CLUSTER_SET">Cluster Set (Blocos Intra-série)</option>
              <option value="MYO_REPS">Myo-Reps (Ativação + Micros)</option>
              <option value="DROP_SET">Drop Set (Redução)</option>
              <option value="REST_PAUSE">Rest-Pause (Pausa 15s)</option>
            </select>
          )}

          {data.technique !== 'NONE' && (
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-black text-primary uppercase">
              {data.technique.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Inputs Centrais: Meta Programada (FACILMENTE EDITÁVEL), Carga Levantada, Reps e RIR */}
        <div className="flex items-center gap-3">
          {/* Carga Meta / Programada Facilmente Editável */}
          <div className="text-right flex items-center gap-1 bg-background/60 border border-border/60 rounded px-1.5 py-0.5">
            <span className="text-[9px] text-primary font-bold flex items-center gap-0.5" title="Altere sua meta de carga aqui diretamente">
              <Target size={10} /> Meta:
            </span>
            <input
              type="number"
              step="0.5"
              value={data.targetWeight ?? ''}
              placeholder="kg"
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate({ ...data, targetWeight: parseFloat(e.target.value) || 0 })}
              className="w-12 text-center font-mono text-[11px] font-bold border-0 bg-transparent p-0 text-foreground"
              title="Carga meta programada"
            />
            <span className="text-[9px] text-muted-foreground">×</span>
            <input
              type="number"
              value={data.targetReps ?? ''}
              placeholder="reps"
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate({ ...data, targetReps: parseInt(e.target.value) || 0 })}
              className="w-10 text-center font-mono text-[11px] font-bold border-0 bg-transparent p-0 text-foreground"
              title="Reps meta programadas"
            />
          </div>

          {/* Carga Anterior (Referência) */}
          {data.previousWeight !== undefined && data.targetWeight === undefined && (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-muted-foreground block">Anterior</span>
              <span className="font-mono text-xs text-muted-foreground/80">
                {data.previousWeight}kg × {data.previousReps}
              </span>
            </div>
          )}

          {/* Input Carga Realmente Levantada (Sem bug de 020) */}
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
                onUpdate({ ...data, weight: val === '' ? 0 : parseFloat(val) || 0 });
              }}
              className="w-16 rounded border border-border bg-background px-2 py-1 text-center font-mono text-xs font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span className="text-[9px] text-muted-foreground block">kg feito</span>
          </div>

          {/* Input Repetições Realmente Feitas (Sem bug de 020) */}
          <div className="relative text-center">
            <input
              type="number"
              min="0"
              value={data.reps === 0 ? '' : data.reps}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value;
                onUpdate({ ...data, reps: val === '' ? 0 : parseInt(val) || 0 });
              }}
              className="w-14 rounded border border-border bg-background px-2 py-1 text-center font-mono text-xs font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span className="text-[9px] text-muted-foreground block">reps feitas</span>
          </div>

          {/* Input RIR Customizável (Pode escolher 0-5, 6-10 ou escrever livremente) */}
          <div className="relative text-center flex flex-col items-center">
            <div className="flex items-center gap-1">
              <select
                value={typeof data.rir === 'number' && data.rir <= 5 ? data.rir : 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    // Mantém ou abre edição livre
                    onUpdate({ ...data, rir: 6 });
                  } else {
                    onUpdate({ ...data, rir: parseInt(e.target.value) });
                  }
                }}
                className="rounded border border-border bg-background px-1.5 py-1 font-mono text-[11px] font-bold text-foreground focus:border-primary"
                title="RIR (Reps in Reserve): Repetições antes da falha ou selecione digitar livre"
              >
                <option value={0}>0 (Falha)</option>
                <option value={1}>1 rep</option>
                <option value={2}>2 reps</option>
                <option value={3}>3 reps</option>
                <option value={4}>4 reps</option>
                <option value={5}>5 reps</option>
                <option value="custom">5+ (Escrever)</option>
              </select>

              {/* Se for mais de 5 ou modo customizado, exibe input para digitar livremente */}
              {(typeof data.rir !== 'number' || data.rir >= 5) && (
                <input
                  type="text"
                  value={data.rir === 5 ? '5+' : data.rir}
                  placeholder="ex: 6+"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = parseInt(val);
                    onUpdate({ ...data, rir: isNaN(num) ? val : num });
                  }}
                  className="w-12 rounded border border-primary/50 bg-background px-1 py-1 text-center font-mono text-[11px] font-bold text-primary focus:border-primary"
                  title="Digite livremente a reserva ou observação (ex: 6+, 7, leve, etc.)"
                />
              )}
            </div>
            <span className="text-[9px] text-muted-foreground block mt-0.5" title="Reps in Reserve: reps que faltavam para falhar">
              RIR (reserva)
            </span>
          </div>
        </div>

        {/* Lado Direito: Gamificação de Meta / PR e Botão Explícito de Concluir Série */}
        <div className="flex items-center gap-2">
          {/* Badge de Meta Superada / Batida */}
          {isTargetAchieved && data.completed && (
            <div 
              title="Você bateu ou superou a meta de carga programada!"
              className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-1 text-[10px] font-black text-emerald-400"
            >
              <Target size={11} />
              <span>META OK</span>
            </div>
          )}

          {/* Feedback de Recorde Pessoal (PR) */}
          {isPrTonnage && (
            <div 
              title={`Tonelagem atual (${currentTonnage}kg) superou anterior (${previousTonnage}kg)!`}
              className="flex items-center gap-1 rounded bg-primary/20 px-2 py-1 text-[10px] font-black text-primary animate-bounce"
            >
              <Trophy size={12} />
              <span>NOVO PR</span>
            </div>
          )}

          {/* BOTÃO DIRETO DE CRONÔMETRO DE DESCANSO */}
          <button
            type="button"
            onClick={() => onTriggerRestTimer(isPreparatory ? restWarmupSeconds : restWorkingSeconds)}
            title={`Iniciar cronômetro de descanso de ${isPreparatory ? restWarmupSeconds : restWorkingSeconds}s`}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border/80 bg-background/80 text-[11px] font-mono font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all"
          >
            <Clock size={12} className="text-primary" />
            <span>{isPreparatory ? restWarmupSeconds : restWorkingSeconds}s</span>
          </button>

          {/* BOTÃO EXPLÍCITO DE CONCLUIR SÉRIE */}
          <button
            type="button"
            onClick={handleToggleComplete}
            title={data.completed ? 'Clique para reabrir esta série' : 'Clique para concluir esta série e iniciar o descanso'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black transition-all cursor-pointer ${
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

          {/* Excluir Linha */}
          <button
            type="button"
            onClick={onDelete}
            title="Remover esta série"
            className="p-1.5 text-muted-foreground/60 hover:text-destructive rounded transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* SUB-LINHAS DINÂMICAS: 1. CLUSTER SET (BLOCOS INTRA-SÉRIE COM MICRO-DESCANSO) */}
      {data.technique === 'CLUSTER_SET' && data.clusterBlocks && (
        <div className="ml-8 rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
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
        <div className="ml-8 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
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
        <div className="ml-8 rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
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
        <div className="ml-8 rounded-lg border border-chart-3/40 bg-chart-3/5 p-3 space-y-2">
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
    </div>
  );
}

export default AdvancedSetRow;
