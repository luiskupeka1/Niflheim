import React, { useState } from 'react';
import { Check, Trophy, Sparkles, Trash2, Clock } from 'lucide-react';
import { type AdvancedSetRowData } from './AdvancedSetRow';

interface HevySetRowProps {
  data: AdvancedSetRowData;
  workingIndex?: number;
  targetWeight?: number;
  targetReps?: number;
  restSeconds: number;
  onUpdate: (updated: AdvancedSetRowData) => void;
  onDelete?: () => void;
  onTriggerRestTimer: (seconds: number) => void;
  onTriggerXP: (xp: number) => void;
  onCelebratePR?: (info: { weight: number; reps: number; tonnage: number }) => void;
}

export function HevySetRow({
  data,
  workingIndex,
  targetWeight,
  targetReps,
  restSeconds,
  onUpdate,
  onDelete,
  onTriggerRestTimer,
  onTriggerXP,
  onCelebratePR,
}: HevySetRowProps) {
  const [justCompleted, setJustCompleted] = useState(false);

  const isPreparatory = data.baseType === 'WARMUP' || data.baseType === 'FEEDER' || data.baseType === 'PAP';

  // Tonelagem e PR
  const currentTonnage = data.weight * data.reps;
  const previousTonnage = (data.previousWeight ?? 0) * (data.previousReps ?? 0);
  const effectiveTargetWeight = targetWeight ?? data.targetWeight;
  const effectiveTargetReps = targetReps ?? data.targetReps;

  const isTargetAchieved = 
    effectiveTargetWeight !== undefined && 
    data.weight >= effectiveTargetWeight && 
    (effectiveTargetReps === undefined || data.reps >= effectiveTargetReps);

  const isPR = 
    !isPreparatory &&
    ((previousTonnage > 0 && currentTonnage > previousTonnage) ||
     ((data.previousWeight ?? 0) > 0 && data.weight > (data.previousWeight ?? 0)) ||
     isTargetAchieved);

  // Badge da Série
  const renderBadge = () => {
    if (data.baseType === 'WARMUP') {
      return (
        <span 
          title="Série de Aquecimento"
          className="size-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono font-black text-xs"
        >
          W
        </span>
      );
    }
    if (data.baseType === 'FEEDER') {
      return (
        <span 
          title="Série de Calibração / Feeder"
          className="size-7 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-black text-xs"
        >
          F
        </span>
      );
    }
    if (data.baseType === 'PAP') {
      return (
        <span 
          title="Potenciação Pós-Ativação"
          className="size-7 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-mono font-black text-xs"
        >
          P
        </span>
      );
    }
    if (data.baseType === 'BACKOFF') {
      return (
        <span 
          title="Back-off Set"
          className="size-7 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center font-mono font-black text-xs"
        >
          B
        </span>
      );
    }
    return (
      <span 
        className={`size-7 rounded-lg flex items-center justify-center font-mono font-black text-xs transition-colors ${
          data.completed 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
            : 'bg-muted/70 text-foreground border border-border/60'
        }`}
      >
        {workingIndex !== undefined ? workingIndex : data.setNumber}
      </span>
    );
  };

  // Texto da Meta / Anterior
  const previousOrTargetText = () => {
    if (data.previousWeight && data.previousReps) {
      return `${data.previousWeight}kg × ${data.previousReps}`;
    }
    if (effectiveTargetWeight && effectiveTargetReps) {
      return `${effectiveTargetWeight}kg × ${effectiveTargetReps}`;
    }
    if (effectiveTargetWeight) {
      return `${effectiveTargetWeight}kg`;
    }
    return '—';
  };

  const handleToggle = () => {
    const nextCompleted = !data.completed;
    onUpdate({ ...data, completed: nextCompleted });

    if (nextCompleted) {
      // Ativa efeito de XP pop-up
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1200);

      onTriggerXP(isPreparatory ? 10 : 25);
      onTriggerRestTimer(restSeconds);

      // Vibração no celular
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }

      // Celebração de PR se bateu
      if (!isPreparatory && isPR && onCelebratePR) {
        onCelebratePR({
          weight: data.weight,
          reps: data.reps,
          tonnage: currentTonnage,
        });
      }
    }
  };

  return (
    <div 
      className={`group relative flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 py-2 rounded-xl border transition-all duration-200 ${
        data.completed
          ? 'bg-emerald-500/[0.08] border-emerald-500/35 shadow-xs'
          : 'bg-card/40 border-border/60 hover:border-border hover:bg-card/70'
      }`}
    >
      {/* 1. NÚMERO / TIPO DA SÉRIE */}
      <div className="w-8 shrink-0 flex items-center justify-center">
        {renderBadge()}
      </div>

      {/* 2. ANTERIOR / META (Estilo Hevy) */}
      <div className="flex-1 min-w-0 max-w-[85px] sm:max-w-[110px] text-center">
        <span 
          className="block text-[11px] font-mono text-muted-foreground truncate select-none"
          title={`Meta ou anterior: ${previousOrTargetText()}`}
        >
          {previousOrTargetText()}
        </span>
      </div>

      {/* 3. INPUT CARGA (KG) */}
      <div className="w-14 sm:w-16 shrink-0 text-center">
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
            onUpdate({ ...data, weight: num });
          }}
          className={`w-full h-8 rounded-lg border text-center font-mono text-xs font-bold transition-all focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            data.completed
              ? 'bg-background/90 border-emerald-500/40 text-foreground'
              : 'bg-background border-border/80 text-foreground'
          }`}
        />
      </div>

      {/* 4. INPUT REPETIÇÕES (REPS) */}
      <div className="w-12 sm:w-14 shrink-0 text-center">
        <input
          type="number"
          min="0"
          value={data.reps === 0 ? '' : data.reps}
          placeholder="0"
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const val = e.target.value;
            const num = val === '' ? 0 : parseInt(val) || 0;
            onUpdate({ ...data, reps: num });
          }}
          className={`w-full h-8 rounded-lg border text-center font-mono text-xs font-bold transition-all focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            data.completed
              ? 'bg-background/90 border-emerald-500/40 text-foreground'
              : 'bg-background border-border/80 text-foreground'
          }`}
        />
      </div>

      {/* 5. RIR (Reps in Reserve) Compacto */}
      <div className="w-11 sm:w-12 shrink-0 text-center">
        <select
          value={typeof data.rir === 'number' && data.rir <= 4 ? data.rir : 2}
          onChange={(e) => onUpdate({ ...data, rir: parseInt(e.target.value) })}
          className="w-full h-8 rounded-lg border border-border/80 bg-background text-center font-mono text-[11px] font-bold text-muted-foreground focus:border-primary cursor-pointer px-0.5"
          title="RIR: repetições restantes na reserva antes da falha total"
        >
          <option value={0}>0 (F)</option>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4+</option>
        </select>
      </div>

      {/* 6. BOTÃO DE CONCLUSÃO CHECKMARK (Estilo Hevy) */}
      <div className="w-10 shrink-0 flex items-center justify-center relative">
        <button
          type="button"
          onClick={handleToggle}
          className={`size-8 sm:size-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none active:scale-90 ${
            data.completed
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40'
              : 'bg-muted/50 border border-border/90 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10'
          }`}
          title={data.completed ? 'Série concluída! Toque para desmarcar' : 'Toque para concluir série e ganhar XP'}
        >
          <Check size={16} strokeWidth={data.completed ? 3.5 : 2} />
        </button>

        {/* Pop-up de XP instantâneo flutuante sobre a linha */}
        {justCompleted && (
          <div className="absolute -top-7 right-0 z-20 pointer-events-none animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200">
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-black shadow-lg flex items-center gap-0.5 whitespace-nowrap">
              <Sparkles size={11} /> +{isPreparatory ? 10 : 25} XP
            </span>
          </div>
        )}
      </div>

      {/* Lixeira sutil visível em hover ou clique */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Remover série"
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-opacity rounded"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
