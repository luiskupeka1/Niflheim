import React, { useState } from 'react';
import { Check, Sparkles, Clock, Flame, Zap, Layers, ArrowDown, CornerDownRight } from 'lucide-react';
import { 
  type AdvancedSetRowData, 
  type ClusterBlock, 
  type RestPauseSubSet, 
  type MyoMicroSet, 
  type DropSubSet 
} from './AdvancedSetRow';

interface HevySetRowProps {
  data: AdvancedSetRowData;
  workingIndex?: number;
  exerciseName?: string;
  targetWeight?: number;
  targetReps?: number;
  targetRepsText?: string;
  restSeconds?: number;
  intraRestSeconds?: number;
  onUpdate: (updated: AdvancedSetRowData) => void;
  onDelete?: () => void;
  onTriggerRestTimer: (seconds: number, source?: string) => void;
  onTriggerXP: (xp: number) => void;
  onCelebratePR?: (info: { weight: number; reps: number; tonnage: number }) => void;
}

export function HevySetRow({
  data,
  workingIndex,
  exerciseName,
  targetWeight,
  targetReps,
  targetRepsText,
  restSeconds,
  intraRestSeconds,
  onUpdate,
  onDelete,
  onTriggerRestTimer,
  onTriggerXP,
  onCelebratePR,
}: HevySetRowProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [recentIntraRestTriggered, setRecentIntraRestTriggered] = useState(false);

  const isWarmup = data.baseType === 'WARMUP';
  const isFeeder = data.baseType === 'FEEDER';
  const isPAP = data.baseType === 'PAP';
  const isBackoff = data.baseType === 'BACKOFF';
  const isWorking = data.baseType === 'WORKING' || (!isWarmup && !isFeeder && !isPAP && !isBackoff);
  const isPreparatory = isWarmup || isFeeder || isPAP;

  // Carga e repetições efetivas
  const effectiveTargetWeight = targetWeight ?? data.targetWeight ?? 0;
  const effectiveTargetReps = targetReps ?? data.targetReps ?? 10;
  const effectiveRest = restSeconds ?? data.restSeconds ?? (isPreparatory ? 60 : 120);
  const effectiveIntraRest = intraRestSeconds ?? data.intraRestSeconds ?? 15;

  // Cálculo da Progressão Tripla de XP (apenas para Working Sets e Back-off)
  const currentWeight = data.weight > 0 ? data.weight : effectiveTargetWeight;
  const currentReps = data.reps > 0 ? data.reps : effectiveTargetReps;
  const prevWeight = data.previousWeight ?? 0;
  const prevReps = data.previousReps ?? 0;

  let calculatedXP = 0;
  let xpReason = '';

  if (!isPreparatory) {
    if (prevWeight > 0 && currentWeight > prevWeight) {
      // Prioridade 1: Progressão de Carga
      calculatedXP = 30;
      xpReason = 'Novo Recorde de Carga!';
    } else if (prevReps > 0 && currentReps > prevReps && currentWeight >= prevWeight) {
      // Prioridade 2: Progressão de Repetições
      calculatedXP = 20;
      xpReason = 'Progressão de Repetições!';
    } else if (currentWeight >= effectiveTargetWeight && currentReps >= effectiveTargetReps) {
      // Prioridade 3: Meta Atingida
      calculatedXP = 30;
      xpReason = 'Meta Superada!';
    } else {
      calculatedXP = 20;
      xpReason = 'Série Válida';
    }
  }

  // Nome formatado da técnica
  const techniqueLabel = () => {
    if (data.technique === 'CLUSTER_SET') return 'Cluster Set';
    if (data.technique === 'REST_PAUSE') return 'Rest-Pause';
    if (data.technique === 'MYO_REPS') return 'Myo-Reps';
    if (data.technique === 'MUSCLE_ROUNDS') return 'Muscle Rounds';
    if (data.technique === 'DROP_SET') return 'Drop-Set';
    return null;
  };

  // Label do Cabeçalho da Série com nomenclaturas claras em inglês (Work, Feeder, PAP, Warm-up)
  const renderSetLabel = () => {
    const workNum = workingIndex !== undefined ? workingIndex : data.setNumber;

    if (isWarmup) {
      return (
        <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-muted-foreground bg-muted/60 border border-border/50 px-2 py-0.5 rounded-full">
          Warm-up
        </span>
      );
    }
    if (isFeeder) {
      return (
        <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
          Feeder
        </span>
      );
    }
    if (isPAP) {
      return (
        <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-full">
          PAP
        </span>
      );
    }
    if (isBackoff) {
      return (
        <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
          Back-off
        </span>
      );
    }
    const tech = techniqueLabel();
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-black text-foreground">
          Work {workNum}
        </span>
        {tech && (
          <span className="text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full">
            {tech}
          </span>
        )}
      </span>
    );
  };

  // Formatação do Target com informação de descanso diferenciado
  const targetDescription = () => {
    const tech = techniqueLabel();
    let repsDisplay = `${effectiveTargetReps} reps`;
    if (targetRepsText) {
      repsDisplay = targetRepsText;
    } else if (tech === 'Rest-Pause') {
      repsDisplay = `(${effectiveTargetReps} + 3+2 reps)`;
    } else if (tech === 'Myo-Reps') {
      repsDisplay = `(${effectiveTargetReps} + 4+4+3 reps)`;
    } else if (tech === 'Muscle Rounds') {
      repsDisplay = '(6×2 reps)';
    } else if (tech === 'Cluster Set') {
      repsDisplay = '(2+2+2 reps)';
    }

    const weightDisplay = effectiveTargetWeight > 0 ? `${effectiveTargetWeight} kg` : 'Carga livre';

    return (
      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] sm:text-[11px] font-mono text-muted-foreground leading-tight">
        <span>{repsDisplay} × {weightDisplay}</span>
        <span>•</span>
        <span>{effectiveRest}s</span>
        {tech && data.technique !== 'DROP_SET' && (
          <span className="text-primary font-bold">({effectiveIntraRest}s intra)</span>
        )}
      </div>
    );
  };

  // Handlers para Sub-blocos das Técnicas Avançadas
  const defaultClusterBlocks = (): ClusterBlock[] => [
    { id: `${data.id}-cb1`, reps: 2, completed: false },
    { id: `${data.id}-cb2`, reps: 2, completed: false },
    { id: `${data.id}-cb3`, reps: 2, completed: false },
  ];

  const defaultRestPauseBlocks = (): RestPauseSubSet[] => [
    { id: `${data.id}-rp1`, reps: 3, completed: false },
    { id: `${data.id}-rp2`, reps: 2, completed: false },
  ];

  const defaultMyoMicroSets = (): MyoMicroSet[] => [
    { id: `${data.id}-myo1`, reps: 4, completed: false },
    { id: `${data.id}-myo2`, reps: 4, completed: false },
    { id: `${data.id}-myo3`, reps: 3, completed: false },
  ];

  const defaultMuscleRoundBlocks = (): ClusterBlock[] => [
    { id: `${data.id}-mr1`, reps: 2, completed: false },
    { id: `${data.id}-mr2`, reps: 2, completed: false },
    { id: `${data.id}-mr3`, reps: 2, completed: false },
    { id: `${data.id}-mr4`, reps: 2, completed: false },
    { id: `${data.id}-mr5`, reps: 2, completed: false },
    { id: `${data.id}-mr6`, reps: 2, completed: false },
  ];

  const defaultDropSets = (): DropSubSet[] => [
    { 
      id: `${data.id}-ds1`, 
      weight: Math.max(5, Math.round((currentWeight > 0 ? currentWeight : 40) * 0.75 * 2) / 2), 
      reps: 8, 
      completed: false 
    },
  ];

  const notifyCompletion = (updatedWeight: number, updatedReps: number) => {
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 1400);

    if (!isPreparatory && calculatedXP > 0) {
      onTriggerXP(calculatedXP);
    }

    // Descanso Total Pós-Série Completa
    onTriggerRestTimer(effectiveRest, `${exerciseName || 'Treino'} • Concluído (${effectiveRest}s)`);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    if (!isPreparatory && calculatedXP === 30 && onCelebratePR) {
      onCelebratePR({
        weight: updatedWeight,
        reps: updatedReps,
        tonnage: updatedWeight * updatedReps,
      });
    }
  };

  const triggerIntraRest = (blockLabel: string) => {
    setRecentIntraRestTriggered(true);
    setTimeout(() => setRecentIntraRestTriggered(false), 1500);

    // Descanso Intra-Bloco Diferenciado
    onTriggerRestTimer(effectiveIntraRest, `${exerciseName || 'Treino'} • Intra-Bloco (${effectiveIntraRest}s)`);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60]);
    }
  };

  // Toggle Série Principal (Botão OK Grande)
  const handleToggle = () => {
    const nextCompleted = !data.completed;
    const updatedWeight = data.weight > 0 ? data.weight : effectiveTargetWeight;
    const updatedReps = data.reps > 0 ? data.reps : effectiveTargetReps;

    // Sincroniza todos os sub-blocos com o estado da série principal
    const currentClusters = data.clusterBlocks && data.clusterBlocks.length > 0 ? data.clusterBlocks : defaultClusterBlocks();
    const currentRps = data.restPauseSubSets && data.restPauseSubSets.length > 0 ? data.restPauseSubSets : defaultRestPauseBlocks();
    const currentMyos = data.myoMicroSets && data.myoMicroSets.length > 0 ? data.myoMicroSets : defaultMyoMicroSets();
    const currentMuscles = data.muscleRoundBlocks && data.muscleRoundBlocks.length > 0 ? data.muscleRoundBlocks : defaultMuscleRoundBlocks();
    const currentDrops = data.dropSets && data.dropSets.length > 0 ? data.dropSets : defaultDropSets();

    const updatedData: AdvancedSetRowData = {
      ...data,
      completed: nextCompleted,
      weight: updatedWeight,
      reps: updatedReps,
      xpAwarded: nextCompleted ? calculatedXP : 0,
      xpReason: nextCompleted ? xpReason : undefined,
      clusterBlocks: data.technique === 'CLUSTER_SET' ? currentClusters.map(b => ({ ...b, completed: nextCompleted })) : data.clusterBlocks,
      restPauseSubSets: data.technique === 'REST_PAUSE' ? currentRps.map(r => ({ ...r, completed: nextCompleted })) : data.restPauseSubSets,
      myoMicroSets: data.technique === 'MYO_REPS' ? currentMyos.map(m => ({ ...m, completed: nextCompleted })) : data.myoMicroSets,
      muscleRoundBlocks: data.technique === 'MUSCLE_ROUNDS' ? currentMuscles.map(m => ({ ...m, completed: nextCompleted })) : data.muscleRoundBlocks,
      dropSets: data.technique === 'DROP_SET' ? currentDrops.map(d => ({ ...d, completed: nextCompleted })) : data.dropSets,
    };

    onUpdate(updatedData);

    if (nextCompleted) {
      notifyCompletion(updatedWeight, updatedReps);
    }
  };

  // Toggle de Mini-Bloco do Cluster Set
  const handleToggleClusterBlock = (blockId: string) => {
    const blocks = data.clusterBlocks && data.clusterBlocks.length > 0 ? data.clusterBlocks : defaultClusterBlocks();
    const target = blocks.find(b => b.id === blockId);
    if (!target) return;
    const nextCompleted = !target.completed;
    const updatedBlocks = blocks.map(b => b.id === blockId ? { ...b, completed: nextCompleted } : b);
    const allCompleted = updatedBlocks.every(b => b.completed);

    const updatedWeight = data.weight > 0 ? data.weight : effectiveTargetWeight;
    const updatedReps = data.reps > 0 ? data.reps : effectiveTargetReps;

    const updatedData: AdvancedSetRowData = {
      ...data,
      clusterBlocks: updatedBlocks,
      completed: allCompleted,
      weight: updatedWeight,
      reps: updatedReps,
      xpAwarded: allCompleted ? calculatedXP : 0,
      xpReason: allCompleted ? xpReason : undefined,
    };
    onUpdate(updatedData);

    if (nextCompleted) {
      if (allCompleted) {
        notifyCompletion(updatedWeight, updatedReps);
      } else {
        triggerIntraRest('Cluster Set');
      }
    }
  };

  // Toggle de Mini-Série Rest-Pause
  const handleToggleRestPauseSubSet = (subId: string) => {
    const subs = data.restPauseSubSets && data.restPauseSubSets.length > 0 ? data.restPauseSubSets : defaultRestPauseBlocks();
    const target = subs.find(s => s.id === subId);
    if (!target) return;
    const nextCompleted = !target.completed;
    const updatedSubs = subs.map(s => s.id === subId ? { ...s, completed: nextCompleted } : s);
    const allCompleted = updatedSubs.every(s => s.completed);

    const updatedWeight = data.weight > 0 ? data.weight : effectiveTargetWeight;
    const updatedReps = data.reps > 0 ? data.reps : effectiveTargetReps;

    const updatedData: AdvancedSetRowData = {
      ...data,
      restPauseSubSets: updatedSubs,
      completed: allCompleted,
      weight: updatedWeight,
      reps: updatedReps,
      xpAwarded: allCompleted ? calculatedXP : 0,
      xpReason: allCompleted ? xpReason : undefined,
    };
    onUpdate(updatedData);

    if (nextCompleted) {
      if (allCompleted) {
        notifyCompletion(updatedWeight, updatedReps);
      } else {
        triggerIntraRest('Rest-Pause');
      }
    }
  };

  // Toggle de Micro-Série Myo-Reps
  const handleToggleMyoMicroSet = (microId: string) => {
    const micros = data.myoMicroSets && data.myoMicroSets.length > 0 ? data.myoMicroSets : defaultMyoMicroSets();
    const target = micros.find(m => m.id === microId);
    if (!target) return;
    const nextCompleted = !target.completed;
    const updatedMicros = micros.map(m => m.id === microId ? { ...m, completed: nextCompleted } : m);
    const allCompleted = updatedMicros.every(m => m.completed);

    const updatedWeight = data.weight > 0 ? data.weight : effectiveTargetWeight;
    const updatedReps = data.reps > 0 ? data.reps : effectiveTargetReps;

    const updatedData: AdvancedSetRowData = {
      ...data,
      myoMicroSets: updatedMicros,
      completed: allCompleted,
      weight: updatedWeight,
      reps: updatedReps,
      xpAwarded: allCompleted ? calculatedXP : 0,
      xpReason: allCompleted ? xpReason : undefined,
    };
    onUpdate(updatedData);

    if (nextCompleted) {
      if (allCompleted) {
        notifyCompletion(updatedWeight, updatedReps);
      } else {
        triggerIntraRest('Myo-Reps');
      }
    }
  };

  // Toggle de Round do Muscle Rounds
  const handleToggleMuscleRound = (roundId: string) => {
    const rounds = data.muscleRoundBlocks && data.muscleRoundBlocks.length > 0 ? data.muscleRoundBlocks : defaultMuscleRoundBlocks();
    const target = rounds.find(r => r.id === roundId);
    if (!target) return;
    const nextCompleted = !target.completed;
    const updatedRounds = rounds.map(r => r.id === roundId ? { ...r, completed: nextCompleted } : r);
    const allCompleted = updatedRounds.every(r => r.completed);

    const updatedWeight = data.weight > 0 ? data.weight : effectiveTargetWeight;
    const updatedReps = data.reps > 0 ? data.reps : effectiveTargetReps;

    const updatedData: AdvancedSetRowData = {
      ...data,
      muscleRoundBlocks: updatedRounds,
      completed: allCompleted,
      weight: updatedWeight,
      reps: updatedReps,
      xpAwarded: allCompleted ? calculatedXP : 0,
      xpReason: allCompleted ? xpReason : undefined,
    };
    onUpdate(updatedData);

    if (nextCompleted) {
      if (allCompleted) {
        notifyCompletion(updatedWeight, updatedReps);
      } else {
        triggerIntraRest('Muscle Rounds');
      }
    }
  };

  // Toggle de Drop do Drop-Set
  const handleToggleDropSet = (dropId: string) => {
    const drops = data.dropSets && data.dropSets.length > 0 ? data.dropSets : defaultDropSets();
    const target = drops.find(d => d.id === dropId);
    if (!target) return;
    const nextCompleted = !target.completed;
    const updatedDrops = drops.map(d => d.id === dropId ? { ...d, completed: nextCompleted } : d);
    const allCompleted = updatedDrops.every(d => d.completed);

    const updatedWeight = data.weight > 0 ? data.weight : effectiveTargetWeight;
    const updatedReps = data.reps > 0 ? data.reps : effectiveTargetReps;

    const updatedData: AdvancedSetRowData = {
      ...data,
      dropSets: updatedDrops,
      completed: allCompleted,
      weight: updatedWeight,
      reps: updatedReps,
      xpAwarded: allCompleted ? calculatedXP : 0,
      xpReason: allCompleted ? xpReason : undefined,
    };
    onUpdate(updatedData);

    if (nextCompleted) {
      if (allCompleted) {
        notifyCompletion(updatedWeight, updatedReps);
      } else {
        // Drop set é contínuo (0s de descanso), apenas vibração tátil
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40]);
        }
      }
    }
  };

  // Sub-blocos renderizados
  const renderAdvancedBlocks = () => {
    if (isPreparatory || data.technique === 'NONE') return null;

    return (
      <div className="mt-2.5 p-2.5 rounded-xl border border-primary/35 bg-[#11141e] shadow-sm space-y-2.5">
        {/* Header da Técnica com Indicação do Descanso Diferenciado */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="font-black text-primary flex items-center gap-1">
            <Zap size={12} className="text-primary shrink-0" />
            {data.technique === 'CLUSTER_SET' && `Cluster Set • ${effectiveIntraRest}s intra-bloco`}
            {data.technique === 'REST_PAUSE' && `Rest-Pause • ${effectiveIntraRest}s intra-pausa`}
            {data.technique === 'MYO_REPS' && `Myo-Reps • ${effectiveIntraRest}s intra-micro`}
            {data.technique === 'MUSCLE_ROUNDS' && `Muscle Rounds • 6×2 • ${effectiveIntraRest}s intra`}
            {data.technique === 'DROP_SET' && `Drop-Set • Redução imediata (0s descanso)`}
          </span>

          {recentIntraRestTriggered && (
            <span className="font-mono text-[10px] font-black text-primary bg-primary/20 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 border border-primary/30">
              <Clock size={10} /> {effectiveIntraRest}s iniciados!
            </span>
          )}
        </div>

        {/* 1. CLUSTER SET */}
        {data.technique === 'CLUSTER_SET' && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(data.clusterBlocks && data.clusterBlocks.length > 0 ? data.clusterBlocks : defaultClusterBlocks()).map((block, bIdx) => (
              <div
                key={block.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all shadow-xs ${
                  block.completed
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 font-bold'
                    : 'bg-[#181d2c] border-[#2c354c] text-white hover:border-primary/50'
                }`}
              >
                <span className="text-[10px] font-mono text-primary font-black">#{bIdx + 1}:</span>
                <span className={`font-mono font-black text-xs ${block.completed ? 'text-emerald-200' : 'text-white'}`}>{block.reps} reps</span>
                <button
                  type="button"
                  onClick={() => handleToggleClusterBlock(block.id)}
                  className={`size-6 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    block.completed
                      ? 'bg-emerald-500 border border-emerald-400 text-black shadow-xs font-black'
                      : 'bg-[#22293d] border border-[#374362] text-muted-foreground hover:bg-primary hover:text-black hover:border-primary'
                  }`}
                  title={block.completed ? 'Desmarcar bloco' : `Concluir bloco e iniciar ${effectiveIntraRest}s de pausa`}
                >
                  <Check size={12} strokeWidth={block.completed ? 3.5 : 2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 2. REST-PAUSE */}
        {data.technique === 'REST_PAUSE' && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-chart-3/50 bg-chart-3/15 text-xs font-bold text-chart-3 shadow-xs">
              <span className="text-[10px] uppercase font-mono font-black">Ativação:</span>
              <span className="font-mono font-black text-white">{currentReps} reps</span>
            </div>
            {(data.restPauseSubSets && data.restPauseSubSets.length > 0 ? data.restPauseSubSets : defaultRestPauseBlocks()).map((rp, idx) => (
              <div
                key={rp.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all shadow-xs ${
                  rp.completed
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 font-bold'
                    : 'bg-[#181d2c] border-[#2c354c] text-white hover:border-primary/50'
                }`}
              >
                <span className="text-[10px] font-mono text-muted-foreground font-bold">Pausa #{idx + 1}:</span>
                <span className={`font-mono font-black text-xs ${rp.completed ? 'text-emerald-200' : 'text-white'}`}>{rp.reps} reps</span>
                <button
                  type="button"
                  onClick={() => handleToggleRestPauseSubSet(rp.id)}
                  className={`size-6 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    rp.completed
                      ? 'bg-emerald-500 border border-emerald-400 text-black shadow-xs font-black'
                      : 'bg-[#22293d] border border-[#374362] text-muted-foreground hover:bg-primary hover:text-black hover:border-primary'
                  }`}
                  title={rp.completed ? 'Desmarcar mini-série' : `Concluir mini-série e pausar ${effectiveIntraRest}s`}
                >
                  <Check size={12} strokeWidth={rp.completed ? 3.5 : 2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. MYO-REPS */}
        {data.technique === 'MYO_REPS' && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-primary/50 bg-primary/15 text-xs font-bold text-primary shadow-xs">
              <span className="text-[10px] uppercase font-mono font-black">Ativação:</span>
              <span className="font-mono font-black text-white">{currentReps} reps</span>
            </div>
            {(data.myoMicroSets && data.myoMicroSets.length > 0 ? data.myoMicroSets : defaultMyoMicroSets()).map((micro, idx) => (
              <div
                key={micro.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all shadow-xs ${
                  micro.completed
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 font-bold'
                    : 'bg-[#181d2c] border-[#2c354c] text-white hover:border-primary/50'
                }`}
              >
                <span className="text-[10px] font-mono text-muted-foreground font-bold">Micro #{idx + 1}:</span>
                <span className={`font-mono font-black text-xs ${micro.completed ? 'text-emerald-200' : 'text-white'}`}>{micro.reps} reps</span>
                <button
                  type="button"
                  onClick={() => handleToggleMyoMicroSet(micro.id)}
                  className={`size-6 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    micro.completed
                      ? 'bg-emerald-500 border border-emerald-400 text-black shadow-xs font-black'
                      : 'bg-[#22293d] border border-[#374362] text-muted-foreground hover:bg-primary hover:text-black hover:border-primary'
                  }`}
                  title={micro.completed ? 'Desmarcar micro-série' : `Concluir micro-série e pausar ${effectiveIntraRest}s`}
                >
                  <Check size={12} strokeWidth={micro.completed ? 3.5 : 2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 4. MUSCLE ROUNDS */}
        {data.technique === 'MUSCLE_ROUNDS' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(data.muscleRoundBlocks && data.muscleRoundBlocks.length > 0 ? data.muscleRoundBlocks : defaultMuscleRoundBlocks()).map((round, rIdx) => (
              <div
                key={round.id}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs transition-all shadow-xs ${
                  round.completed
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 font-bold'
                    : 'bg-[#181d2c] border-[#2c354c] text-white hover:border-primary/50'
                }`}
              >
                <span className="text-[10px] font-mono text-primary font-black">R{rIdx + 1}:</span>
                <span className={`font-mono font-black text-xs ${round.completed ? 'text-emerald-200' : 'text-white'}`}>{round.reps}</span>
                <button
                  type="button"
                  onClick={() => handleToggleMuscleRound(round.id)}
                  className={`size-5 rounded-md flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    round.completed
                      ? 'bg-emerald-500 border border-emerald-400 text-black shadow-xs font-black'
                      : 'bg-[#22293d] border border-[#374362] text-muted-foreground hover:bg-primary hover:text-black hover:border-primary'
                  }`}
                  title={round.completed ? 'Desmarcar round' : `Concluir round e pausar ${effectiveIntraRest}s`}
                >
                  <Check size={11} strokeWidth={round.completed ? 3.5 : 2} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 5. DROP-SET */}
        {data.technique === 'DROP_SET' && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(data.dropSets && data.dropSets.length > 0 ? data.dropSets : defaultDropSets()).map((drop, idx) => (
              <div
                key={drop.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all shadow-xs ${
                  drop.completed
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 font-bold'
                    : 'bg-[#181d2c] border-destructive/50 text-white'
                }`}
              >
                <span className="text-[10px] font-mono text-destructive font-black">Drop #{idx + 1}:</span>
                <span className="font-mono font-black text-xs text-white">{drop.weight} kg × {drop.reps} reps</span>
                <button
                  type="button"
                  onClick={() => handleToggleDropSet(drop.id)}
                  className={`size-6 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    drop.completed
                      ? 'bg-emerald-500 border border-emerald-400 text-black shadow-xs font-black'
                      : 'bg-[#22293d] border border-[#374362] text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive'
                  }`}
                  title={drop.completed ? 'Desmarcar drop' : 'Concluir drop'}
                >
                  <Check size={12} strokeWidth={drop.completed ? 3.5 : 2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`py-2 px-2.5 rounded-2xl transition-all duration-200 select-none ${
        data.completed 
          ? 'bg-emerald-950/20 border border-emerald-500/35 shadow-xs' 
          : 'bg-[#12151f]/85 hover:bg-[#151924] border border-[#23293a] shadow-xs'
      }`}
    >
      {/* LINHA SUPERIOR PRINCIPAL (HEVY STYLE) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* 1. ESQUERDA: IDENTIFICADOR DA SÉRIE E META */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1 flex-wrap">
            {renderSetLabel()}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] font-mono text-muted-foreground font-medium leading-tight break-words">
            {targetDescription()}
          </div>
        </div>

        {/* 2. DIREITA: INPUTS COMPACTOS ARREDONDADOS E BOTÃO CHECK */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="flex flex-col items-center">
            <input
              type="number"
              step="0.5"
              min="0"
              value={data.weight === 0 ? '' : data.weight}
              placeholder={String(effectiveTargetWeight || 0)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === '' ? 0 : parseFloat(val) || 0;
                onUpdate({ ...data, weight: num });
              }}
              className="!w-12 sm:!w-14 !h-8 !p-0 rounded-xl border border-[#2b3348] !bg-[#161a26] text-center font-mono text-xs font-black text-white transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Carga Levantada (kg)"
            />
            <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase mt-0.5">KG</span>
          </div>

          <div className="flex flex-col items-center">
            <input
              type="number"
              min="0"
              value={data.reps === 0 ? '' : data.reps}
              placeholder={String(effectiveTargetReps || 0)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === '' ? 0 : parseInt(val) || 0;
                onUpdate({ ...data, reps: num });
              }}
              className="!w-10 sm:!w-12 !h-8 !p-0 rounded-xl border border-[#2b3348] !bg-[#161a26] text-center font-mono text-xs font-black text-white transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Repetições Realizadas"
            />
            <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase mt-0.5">REPS</span>
          </div>

          {/* Botão de Conclusão Moderno e Arredondado (Hevy Style) */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleToggle}
              className={`!h-8 px-2.5 rounded-xl flex items-center justify-center gap-1 transition-all active:scale-90 cursor-pointer select-none shrink-0 ${
                data.completed
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-black border border-emerald-400'
                  : 'bg-[#1e2436] border border-[#323d5a] text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10'
              }`}
              title={data.completed ? 'Série concluída! Toque para reabrir' : 'Toque para concluir série e computar XP'}
            >
              <Check size={14} strokeWidth={data.completed ? 3.5 : 2} />
              {data.completed && !isPreparatory && calculatedXP > 0 && (
                <span className="text-[9px] sm:text-[10px] font-black tracking-tight">+{calculatedXP}</span>
              )}
            </button>
            <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase mt-0.5">OK</span>
          </div>
        </div>
      </div>

      {/* SUB-BLOCOS INTERATIVOS DAS TÉCNICAS AVANÇADAS */}
      {renderAdvancedBlocks()}

      {/* Pop-up flutuante de XP imediato com animação e efeito glow */}
      {justCompleted && !isPreparatory && calculatedXP > 0 && (
        <div className="fixed top-20 right-6 z-50 pointer-events-none animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black px-3.5 py-2 font-black text-xs shadow-2xl shadow-emerald-500/40 flex items-center gap-1.5 border border-emerald-300">
            <Sparkles size={15} />
            <span>+{calculatedXP} XP • {xpReason}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HevySetRow;
