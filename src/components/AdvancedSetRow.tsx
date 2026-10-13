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
  Zap
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

export interface AdvancedSetRowData {
  id: string;
  setNumber: number;
  baseType: BaseSetType;
  technique: IntensityTechnique;
  weight: number;
  reps: number;
  rir: number; // 0 a 5
  previousWeight?: number;
  previousReps?: number;
  previousRir?: number;
  completed: boolean;
  dropSets?: DropSubSet[];
  myoMicroSets?: MyoMicroSet[];
}

interface AdvancedSetRowProps {
  data: AdvancedSetRowData;
  onUpdate: (updated: AdvancedSetRowData) => void;
  onDelete: () => void;
  onTriggerRestTimer: (seconds: number) => void;
}

export function AdvancedSetRow({
  data,
  onUpdate,
  onDelete,
  onTriggerRestTimer,
}: AdvancedSetRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  // Micro-temporizador para Myo-reps e Cluster sets (10 a 15 segundos)
  const [microTimer, setMicroTimer] = useState<number>(0);
  const [microTimerActive, setMicroTimerActive] = useState<boolean>(false);

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
  const isPrTonnage = 
    data.previousWeight !== undefined && 
    data.previousReps !== undefined && 
    currentTonnage > previousTonnage &&
    data.rir <= (data.previousRir ?? 5);

  const handleToggleComplete = () => {
    const nextCompleted = !data.completed;
    onUpdate({ ...data, completed: nextCompleted });

    if (nextCompleted) {
      // Dispara o timer apropriado
      if (data.technique === 'MYO_REPS' || data.technique === 'CLUSTER_SET') {
        startMicroRest(15);
      } else {
        onTriggerRestTimer(90);
      }
    }
  };

  // Handler de seleção de Técnica Avançada
  const handleSelectTechnique = (tech: IntensityTechnique) => {
    let updated = { ...data, technique: tech };
    if (tech === 'MYO_REPS' && (!data.myoMicroSets || data.myoMicroSets.length === 0)) {
      updated.myoMicroSets = [
        { id: crypto.randomUUID(), reps: 4, completed: false },
        { id: crypto.randomUUID(), reps: 4, completed: false },
        { id: crypto.randomUUID(), reps: 3, completed: false },
      ];
    }
    if (tech === 'DROP_SET' && (!data.dropSets || data.dropSets.length === 0)) {
      updated.dropSets = [
        { id: crypto.randomUUID(), weight: Math.round(data.weight * 0.75), reps: 8, completed: false },
      ];
    }
    onUpdate(updated);
    setShowMenu(false);
  };

  // Render do Badge BaseSetType
  const renderBaseBadge = () => {
    switch (data.baseType) {
      case 'WARMUP':
        return (
          <span 
            title="Aquecimento (não conta para MEV)"
            className="flex size-7 items-center justify-center rounded bg-muted font-mono text-xs font-bold text-muted-foreground"
          >
            W
          </span>
        );
      case 'FEEDER':
        return (
          <span 
            title="Preparatória / Feeder"
            className="flex size-7 items-center justify-center rounded bg-primary/20 font-mono text-xs font-extrabold text-primary"
          >
            F
          </span>
        );
      case 'BACKOFF':
        return (
          <span 
            title="Back-off Set (-10% a -15% de carga)"
            className="flex size-7 items-center justify-center rounded bg-chart-2/20 font-mono text-xs font-extrabold text-chart-2"
          >
            B
          </span>
        );
      case 'WORKING':
      default:
        return (
          <span 
            title="Série de Trabalho Principal"
            className="flex size-7 items-center justify-center rounded bg-primary font-mono text-xs font-black text-primary-foreground shadow"
          >
            {data.setNumber}
          </span>
        );
    }
  };

  return (
    <div 
      className={`rounded-xl border transition-all p-3 space-y-3 ${
        data.completed 
          ? 'border-primary/50 bg-primary/5' 
          : 'border-border/60 bg-card/60 hover:border-border'
      }`}
    >
      {/* Linha Principal da Série */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Lado Esquerdo: Badge e Seletor de BaseSetType */}
        <div className="flex items-center gap-2">
          {renderBaseBadge()}

          <select
            value={data.baseType}
            onChange={(e) => onUpdate({ ...data, baseType: e.target.value as BaseSetType })}
            className="rounded border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground focus:border-primary"
          >
            <option value="WORKING">Trabalho</option>
            <option value="WARMUP">Aquecimento (W)</option>
            <option value="FEEDER">Feeder (F)</option>
            <option value="BACKOFF">Back-off (B)</option>
          </select>

          {data.technique !== 'NONE' && (
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
              {data.technique.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Inputs Centrais: Carga, Reps, RIR e Carga de Referência */}
        <div className="flex items-center gap-3">
          {/* Carga de Referência Anterior em Cinza Opaco */}
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-muted-foreground block">Anterior</span>
            <span className="font-mono text-xs text-muted-foreground/80">
              {data.previousWeight ? `${data.previousWeight}kg × ${data.previousReps}` : '—'}
            </span>
          </div>

          {/* Input Carga */}
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0"
              value={data.weight}
              onChange={(e) => onUpdate({ ...data, weight: parseFloat(e.target.value) || 0 })}
              className="w-16 rounded border border-border bg-background px-2 py-1 text-center font-mono text-xs font-bold text-foreground focus:border-primary"
            />
            <span className="text-[9px] text-muted-foreground block text-center">kg</span>
          </div>

          {/* Input Repetições */}
          <div className="relative">
            <input
              type="number"
              min="1"
              value={data.reps}
              onChange={(e) => onUpdate({ ...data, reps: parseInt(e.target.value) || 0 })}
              className="w-14 rounded border border-border bg-background px-2 py-1 text-center font-mono text-xs font-bold text-foreground focus:border-primary"
            />
            <span className="text-[9px] text-muted-foreground block text-center">reps</span>
          </div>

          {/* Input RIR (Reps in Reserve 0 a 5) */}
          <div className="relative">
            <select
              value={data.rir}
              onChange={(e) => onUpdate({ ...data, rir: parseInt(e.target.value) })}
              className="rounded border border-border bg-background px-2 py-1 font-mono text-xs font-semibold text-foreground focus:border-primary"
            >
              <option value={0}>RIR 0 (Falha)</option>
              <option value={1}>RIR 1</option>
              <option value={2}>RIR 2</option>
              <option value={3}>RIR 3</option>
              <option value={4}>RIR 4</option>
              <option value={5}>RIR 5+</option>
            </select>
            <span className="text-[9px] text-muted-foreground block text-center">reserva</span>
          </div>
        </div>

        {/* Lado Direito: Badge de PR, Checkbox de Conclusão e Menu de Técnicas */}
        <div className="flex items-center gap-2">
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

          {/* Checkbox de Conclusão */}
          <button
            type="button"
            onClick={handleToggleComplete}
            className={`inline-flex size-8 items-center justify-center rounded-lg border transition-all ${
              data.completed
                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                : 'border-border bg-background text-muted-foreground hover:border-primary'
            }`}
          >
            <Check size={16} strokeWidth={data.completed ? 3 : 2} />
          </button>

          {/* Menu Dropdown de Técnicas Avançadas */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={14} />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-50 w-44 rounded-lg border border-border bg-popover p-1.5 shadow-xl text-xs">
                <span className="block px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                  Técnica Avançada
                </span>
                <button
                  onClick={() => handleSelectTechnique('NONE')}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-foreground"
                >
                  Normal
                </button>
                <button
                  onClick={() => handleSelectTechnique('MYO_REPS')}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-primary font-bold flex items-center justify-between"
                >
                  Myo-Reps (15s rest)
                  <Zap size={12} />
                </button>
                <button
                  onClick={() => handleSelectTechnique('DROP_SET')}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-destructive font-semibold flex items-center justify-between"
                >
                  Drop Set (-25%)
                  <ArrowDown size={12} />
                </button>
                <button
                  onClick={() => handleSelectTechnique('CLUSTER_SET')}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-foreground flex items-center justify-between"
                >
                  Cluster Set
                  <Layers size={12} />
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={onDelete}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-destructive/20 text-destructive font-semibold flex items-center justify-between"
                >
                  Excluir Série
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUB-LINHAS DINÂMICAS: MYO-REPS */}
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
                <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
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
                  className="w-10 text-center font-mono text-xs font-bold border-0 bg-transparent p-0"
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

      {/* SUB-LINHAS DINÂMICAS: DROP-SET */}
      {data.technique === 'DROP_SET' && data.dropSets && (
        <div className="ml-8 rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-destructive">
            <span className="flex items-center gap-1">
              <ArrowDown size={13} /> Drops Acoplados (Redução imediata sem descanso):
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
                weight: Math.round(lastWeight * 0.75),
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
    </div>
  );
}

export default AdvancedSetRow;
