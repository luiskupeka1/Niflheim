import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Trophy, 
  Flame, 
  Target, 
  Sparkles 
} from 'lucide-react';

export interface ExerciseProgressionPoint {
  date: string;
  sessionName: string;
  weightKg: number;
  targetWeightKg: number;
  reps: number;
  tonnageKg: number;
}

interface WorkoutProgressionChartProps {
  exerciseName: string;
  dataPoints: ExerciseProgressionPoint[];
}

export function WorkoutProgressionChart({
  exerciseName,
  dataPoints,
}: WorkoutProgressionChartProps) {
  const [metric, setMetric] = useState<'weight' | 'tonnage'>('weight');

  // Valores de referência e gamificação
  const maxWeight = Math.max(...dataPoints.map((p) => p.weightKg), 0);
  const initialWeight = dataPoints[0]?.weightKg ?? maxWeight;
  const progressionPercent = initialWeight > 0 
    ? Math.round(((maxWeight - initialWeight) / initialWeight) * 100) 
    : 0;

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-4">
      {/* Header do Gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
            <TrendingUp size={12} /> Sobrecarga Progressiva (Progressive Overload)
          </span>
          <h4 className="text-base font-extrabold text-foreground">{exerciseName}</h4>
        </div>

        {/* Seletor de Métrica: Carga Máxima ou Tonelagem */}
        <div className="flex items-center gap-1 rounded-lg bg-background/80 p-1 border border-border">
          <button
            onClick={() => setMetric('weight')}
            className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
              metric === 'weight'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Carga Máxima (KG)
          </button>
          <button
            onClick={() => setMetric('tonnage')}
            className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
              metric === 'tonnage'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tonelagem Total (KG)
          </button>
        </div>
      </div>

      {/* Badges de Gamificação */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg border border-border bg-background/50 p-2">
          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Recorde (PR)</span>
          <span className="font-mono text-sm font-black text-primary flex items-center justify-center gap-1">
            <Trophy size={13} className="text-primary" /> {maxWeight} kg
          </span>
        </div>
        <div className="rounded-lg border border-border bg-background/50 p-2">
          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Ganho de Força</span>
          <span className="font-mono text-sm font-black text-emerald-400">
            +{progressionPercent}%
          </span>
        </div>
        <div className="rounded-lg border border-border bg-background/50 p-2">
          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Status Sobrecarga</span>
          <span className="font-mono text-[11px] font-black text-foreground">
            {progressionPercent >= 10 ? 'Hipertrofia Ativa 🔥' : 'Em Calibração ⚖️'}
          </span>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="h-48 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary, #FFD700)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--primary, #FFD700)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis 
              dataKey="date" 
              stroke="#737373" 
              fontSize={10} 
              tickLine={false}
            />
            <YAxis 
              stroke="#737373" 
              fontSize={10} 
              tickLine={false} 
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#171717',
                borderColor: '#404040',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#EDEDED',
              }}
              formatter={(value: any, name: any) => [
                `${value} kg`, 
                name === 'weightKg' ? 'Carga Realizada' : name === 'targetWeightKg' ? 'Carga Meta Programada' : 'Tonelagem'
              ]}
            />
            {metric === 'weight' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="targetWeightKg"
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorTarget)"
                  name="Meta Programada"
                />
                <Area
                  type="monotone"
                  dataKey="weightKg"
                  stroke="var(--primary, #FFD700)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorWeight)"
                  name="Carga Realizada"
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="tonnageKg"
                stroke="var(--primary, #FFD700)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorWeight)"
                name="Tonelagem Total"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default WorkoutProgressionChart;
