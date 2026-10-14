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
  const techniqueLabel = () => {
    if (data.technique === 'REST_PAUSE' || data.technique === 'CLUSTER_SET') return 'Rest-Pause';
    if (data.technique === 'MYO_REPS') return 'Myo-Reps';
    if (data.technique === 'MUSCLE_ROUNDS') return 'Muscle Rounds';
    if (data.technique === 'DROP_SET') return 'Drop-Set';
    return null;
  };

  // Label do Cabeçalho da Série: [S1] Warm-up Set, etc.
  const renderSetLabel = () => {
    const sNum = workingIndex !== undefined ? `S${workingIndex}` : `S${data.setNumber}`;

    if (isWarmup) {
      return (
        <span className="font-mono text-xs font-bold text-[#8F9BBA]">
          [{sNum}] Warm-up Set
        </span>
      );
    }
    if (isFeeder) {
      return (
        <span className="font-mono text-xs font-bold text-[#00E5FF]">
          [{sNum}] Feeder Set
        </span>
      );
    }
    if (isPAP) {
      return (
        <span className="font-mono text-xs font-bold text-[#00E5FF]">
          [{sNum}] PAP (Potenciação Neural)
        </span>
      );
    }
    if (isBackoff) {
      return (
        <span className="font-mono text-xs font-bold text-[#FFD600]">
          [{sNum}] Back-off Set
        </span>
      );
    }
    const tech = techniqueLabel();
    return (
      <span className="font-mono text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
        <span className="text-[#FFD600]">[{sNum}] Working Set ⭐</span>
        {tech && (
          <span className="text-[10px] text-[#8F9BBA] font-normal">
            (Técnica: <strong className="text-white">{tech}</strong>)
          </span>
        )}
      </span>
    );
  };

  // Formatação do Target
  const targetDescription = () => {
    const tech = techniqueLabel();
    let repsDisplay = `${effectiveTargetReps} reps`;
    if (targetRepsText) {
      repsDisplay = targetRepsText;
    } else if (tech === 'Rest-Pause') {
      repsDisplay = '(4+3+2 reps)';
    } else if (tech === 'Myo-Reps') {
      repsDisplay = '(12 + 4+3+3 reps)';
    } else if (tech === 'Muscle Rounds') {
      repsDisplay = '(6×2 reps)';
    }

    return (
      <div className="text-[11px] font-mono text-[#8F9BBA] mt-0.5 space-y-0.5">
        <div>
          Target: <span className="text-white font-bold">{repsDisplay}</span> @ <span className="text-white font-bold">{effectiveTargetWeight > 0 ? `${effectiveTargetWeight} kg` : 'Carga livre'}</span>
          {!tech && (
            <span className="ml-2 text-[#8F9BBA]">| Descanso: <strong className="text-white">{effectiveRest}s</strong></span>
          )}
        </div>
        {tech && (
          <div className="text-[10px] text-[#00E5FF]">
            Pausa Intra-bloco: <strong>{effectiveIntraRest}s</strong> | Descanso Final: <strong>{effectiveRest}s</strong>
          </div>
        )}
      </div>
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
      className={`rounded-xl border p-3 transition-all duration-200 select-none ${
        data.completed
          ? 'bg-[#161920] border-[#FFD600]/40 shadow-sm'
          : 'bg-[#161920]/80 border-[#232733] hover:border-[#2E3445]'
      }`}
    >
      {/* 1. TOPO DO CARD: IDENTIFICAÇÃO E TARGET */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          {renderSetLabel()}
          {targetDescription()}
        </div>

        {/* Inputs de Carga e Reps Reais (Compactos e Minimalistas) */}
        <div className="flex items-center gap-2 self-start sm:self-auto mt-1 sm:mt-0 font-mono text-xs">
          <div className="flex items-center gap-1 bg-[#0F1115] border border-[#232733] px-2 py-1 rounded-lg">
            <span className="text-[10px] text-[#8F9BBA]">KG:</span>
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
              className="w-12 bg-transparent text-white font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0F1115] border border-[#232733] px-2 py-1 rounded-lg">
            <span className="text-[10px] text-[#8F9BBA]">REPS:</span>
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
              className="w-10 bg-transparent text-white font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* 2. BOTÃO DE CONCLUSÃO COM STATUS DE XP DINÂMICO */}
      <div className="mt-3 pt-2 border-t border-[#232733]/60 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 ${
            data.completed
              ? 'bg-[#FFD600] text-[#0F1115] shadow-md shadow-[#FFD600]/20'
              : 'bg-[#232733]/80 border border-[#2E3445] text-white hover:border-[#FFD600] hover:text-[#FFD600]'
          }`}
        >
          <span className="font-mono text-xs">{data.completed ? '[✓]' : '[ ]'}</span>
          <span>{data.completed ? 'Concluído' : 'MARCAR COMO FEITO'}</span>
        </button>

        {/* FEEDBACK DE XP: Concedido apenas para Working Sets / Back-off */}
        {data.completed && !isPreparatory && (
          <div className="flex items-center gap-1 text-[11px] font-black text-[#FFD600] animate-in fade-in duration-200">
            <Sparkles size={12} className="animate-spin" />
            <span>+{calculatedXP} XP ({xpReason})</span>
          </div>
        )}

        {/* Warmup / Feeder (0 XP informativo) */}
        {data.completed && isPreparatory && (
          <span className="text-[10px] font-mono text-[#8F9BBA]">
            Aquecimento sem pontuação (0 XP)
          </span>
        )}

        {/* Pop-up flutuante de XP imediato */}
        {justCompleted && !isPreparatory && calculatedXP > 0 && (
          <div className="fixed top-20 right-6 z-50 pointer-events-none animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
            <div className="rounded-xl bg-[#FFD600] text-[#0F1115] px-3.5 py-2 font-black text-xs shadow-2xl flex items-center gap-1.5">
              <Sparkles size={15} />
              <span>+{calculatedXP} XP • {xpReason}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
