import React, { useState } from 'react';
import { Check, Sparkles, Clock, Star, Flame, Zap } from 'lucide-react';
import { type AdvancedSetRowData } from './AdvancedSetRow';

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
  onTriggerRestTimer: (seconds: number) => void;
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
  // Nome formatado da técnica
  const techniqueLabel = () => {
    if (data.technique === 'REST_PAUSE' || data.technique === 'CLUSTER_SET') return 'Rest-Pause';
    if (data.technique === 'MYO_REPS') return 'Myo-Reps';
    if (data.technique === 'MUSCLE_ROUNDS') return 'Muscle Rounds';
    if (data.technique === 'DROP_SET') return 'Drop-Set';
    return null;
  };

  // Label do Cabeçalho da Série com badges arredondadas e modernas
  const renderSetLabel = () => {
    const sNum = workingIndex !== undefined ? `S${workingIndex}` : `S${data.setNumber}`;

    if (isWarmup) {
      return (
        <span className="inline-flex items-center text-[11px] font-bold text-muted-foreground bg-muted/60 border border-border/50 px-2 py-0.5 rounded-full">
          {sNum} • Aquecimento
        </span>
      );
    }
    if (isFeeder) {
      return (
        <span className="inline-flex items-center text-[11px] font-bold text-muted-foreground bg-muted/60 border border-border/50 px-2 py-0.5 rounded-full">
          {sNum} • Aclimatação
        </span>
      );
    }
    if (isPAP) {
      return (
        <span className="inline-flex items-center text-[11px] font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-full">
          {sNum} • PAP
        </span>
      );
    }
    if (isBackoff) {
      return (
        <span className="inline-flex items-center text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
          {sNum} • Back-off
        </span>
      );
    }
    const tech = techniqueLabel();
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-black text-foreground">{sNum}</span>
        {tech && (
          <span className="text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full">
            {tech}
          </span>
        )}
      </span>
    );
  };

  // Formatação do Target conforme especificação: 12 reps × 20 kg • 60s
  const targetDescription = () => {
    const tech = techniqueLabel();
    let repsDisplay = `${effectiveTargetReps} reps`;
    if (targetRepsText) {
      repsDisplay = targetRepsText;
    } else if (tech === 'Rest-Pause') {
      repsDisplay = '(4+3+2 reps)';
    } else if (tech === 'Myo-Reps') {
      repsDisplay = '(12+4+3+3 reps)';
    } else if (tech === 'Muscle Rounds') {
      repsDisplay = '(6×2 reps)';
    }

    const weightDisplay = effectiveTargetWeight > 0 ? `${effectiveTargetWeight} kg` : 'Carga livre';

    return (
      <span className="text-[11px] font-mono text-muted-foreground">
        {repsDisplay} × {weightDisplay} • {effectiveRest}s
        {tech && <span className="text-primary font-bold ml-1">({effectiveIntraRest}s intra)</span>}
      </span>
    );
  };

  const handleToggle = () => {
    const nextCompleted = !data.completed;
    const updatedWeight = data.weight > 0 ? data.weight : effectiveTargetWeight;
    const updatedReps = data.reps > 0 ? data.reps : effectiveTargetReps;

    const updatedData: AdvancedSetRowData = {
      ...data,
      completed: nextCompleted,
      weight: updatedWeight,
      reps: updatedReps,
      xpAwarded: nextCompleted ? calculatedXP : 0,
      xpReason: nextCompleted ? xpReason : undefined,
    };

    onUpdate(updatedData);

    if (nextCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1400);

      // Concede XP apenas para Working Sets / Back-off
      if (!isPreparatory && calculatedXP > 0) {
        onTriggerXP(calculatedXP);
      }

      // Dispara descanso
      onTriggerRestTimer(effectiveRest);

      // Vibração no celular
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Celebração de PR de carga
      if (!isPreparatory && calculatedXP === 30 && onCelebratePR) {
        onCelebratePR({
          weight: updatedWeight,
          reps: updatedReps,
          tonnage: updatedWeight * updatedReps,
        });
      }
    }
  };

  return (
    <div 
      className={`py-2 px-2.5 rounded-2xl transition-all duration-200 select-none flex items-center justify-between gap-2.5 ${
        data.completed 
          ? 'bg-emerald-500/[0.08] border border-emerald-500/25 shadow-xs' 
          : 'hover:bg-muted/30 border border-transparent'
      }`}
    >
      {/* 1. ESQUERDA: IDENTIFICADOR DA SÉRIE E META */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {renderSetLabel()}
        </div>
        <div className="mt-0.5 truncate">
          {targetDescription()}
        </div>
      </div>

      {/* 2. DIREITA: INPUTS COMPACTOS ARREDONDADOS E BOTÃO CHECK */}
      <div className="flex items-center gap-1.5 shrink-0">
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
            className={`w-13 sm:w-16 h-8.5 rounded-xl border text-center font-mono text-xs font-bold transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              data.completed
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                : 'bg-background/80 border-border/80 text-foreground'
            }`}
            title="Carga Levantada (kg)"
          />
          <span className="text-[9px] font-black text-muted-foreground uppercase mt-0.5">KG</span>
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
            className={`w-11 sm:w-13 h-8.5 rounded-xl border text-center font-mono text-xs font-bold transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              data.completed
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                : 'bg-background/80 border-border/80 text-foreground'
            }`}
            title="Repetições Realizadas"
          />
          <span className="text-[9px] font-black text-muted-foreground uppercase mt-0.5">REPS</span>
        </div>

        {/* Botão de Conclusão Moderno e Arredondado (Hevy Style) */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleToggle}
            className={`h-8.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-90 cursor-pointer select-none ${
              data.completed
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-black border border-emerald-400'
                : 'bg-muted/60 border border-border/80 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10'
            }`}
            title={data.completed ? 'Série concluída! Toque para reabrir' : 'Toque para concluir série e computar XP'}
          >
            <Check size={16} strokeWidth={data.completed ? 3.5 : 2} />
            {data.completed && !isPreparatory && calculatedXP > 0 && (
              <span className="text-[10px] font-black tracking-tight">+{calculatedXP}</span>
            )}
          </button>
          <span className="text-[9px] font-black text-muted-foreground uppercase mt-0.5">OK</span>
        </div>
      </div>

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
