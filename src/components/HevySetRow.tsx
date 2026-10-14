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

  // Label do Cabeçalho da Série: • S1 | Aquecimento, • S2 | Aclimatação, • S3 | Working Set [ Rest-Pause ], etc.
  const renderSetLabel = () => {
    const sNum = workingIndex !== undefined ? `S${workingIndex}` : `S${data.setNumber}`;

    if (isWarmup) {
      return (
        <span className="font-mono text-xs font-bold text-[#8F9BBA]">
          • {sNum} | Aquecimento
        </span>
      );
    }
    if (isFeeder) {
      return (
        <span className="font-mono text-xs font-bold text-[#8F9BBA]">
          • {sNum} | Aclimatação
        </span>
      );
    }
    if (isPAP) {
      return (
        <span className="font-mono text-xs font-bold text-[#8F9BBA]">
          • {sNum} | PAP (Potenciação)
        </span>
      );
    }
    if (isBackoff) {
      return (
        <span className="font-mono text-xs font-bold text-[#FFCC00]">
          • {sNum} | Back-off Set
        </span>
      );
    }
    const tech = techniqueLabel();
    return (
      <span className="font-mono text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
        <span className="text-white">• {sNum} | Working Set</span>
        {tech && (
          <span className="text-[11px] font-bold text-[#FFCC00]">
            [ {tech} ]
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
      repsDisplay = '(12 + 4+3+3 reps)';
    } else if (tech === 'Muscle Rounds') {
      repsDisplay = '(6×2 reps)';
    }

    const weightDisplay = effectiveTargetWeight > 0 ? `${effectiveTargetWeight} kg` : 'Carga livre';

    return (
      <div className="text-[11px] font-mono text-[#8F9BBA] mt-0.5 flex flex-wrap items-center gap-x-2">
        <span>
          <strong className="text-white font-normal">{repsDisplay}</strong> × <strong className="text-white font-normal">{weightDisplay}</strong>  •  {effectiveRest}s
          {tech && <span className="text-[#FFCC00] ml-1.5">({effectiveIntraRest}s intra)</span>}
        </span>
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
      className={`py-3 px-1 transition-all duration-200 select-none ${
        data.completed ? 'opacity-95' : 'opacity-100'
      }`}
    >
      {/* 1. LINHA DA SÉRIE E TARGET */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          {renderSetLabel()}
          {targetDescription()}
        </div>

        {/* Inputs Compactos para o Aluno Ajustar o Peso e Reps Levantados */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <div className="flex items-center gap-1 bg-[#0B0B0B] border border-[#222222] px-2 py-0.5 rounded-lg">
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

          <div className="flex items-center gap-1 bg-[#0B0B0B] border border-[#222222] px-2 py-0.5 rounded-lg">
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

      {/* 2. BOTÃO DE AÇÃO MINIMALISTA CONFORME O MOCKUP */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer active:scale-95 ${
            data.completed
              ? 'bg-[#FFCC00] text-[#0B0B0B] shadow-md shadow-[#FFCC00]/20'
              : 'bg-[#181818] border border-[#282828] text-white hover:border-[#FFCC00] hover:text-[#FFCC00]'
          }`}
        >
          <span>{data.completed ? '[✓]' : '[ ]'}</span>
          <span>
            {data.completed 
              ? (isPreparatory ? 'Concluído' : `FINALIZAR SÉRIE  ➔  +${calculatedXP} XP`) 
              : 'FINALIZAR SÉRIE'}
          </span>
        </button>

        {/* Pop-up flutuante de XP imediato */}
        {justCompleted && !isPreparatory && calculatedXP > 0 && (
          <div className="fixed top-20 right-6 z-50 pointer-events-none animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
            <div className="rounded-xl bg-[#FFCC00] text-[#0B0B0B] px-3.5 py-2 font-black text-xs shadow-2xl flex items-center gap-1.5 font-mono">
              <Sparkles size={15} />
              <span>+{calculatedXP} XP • {xpReason}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
