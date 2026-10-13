/**
 * Algoritmo de "Farm" de Passos e Cardio - NIFLHEIM
 * 
 * Converte tempo de atividade e intensidade cardiovascular em passos equivalentes
 * e calorias gastas proporcionais à massa corporal do usuário.
 */

export type CardioIntensity = 'low' | 'moderate' | 'high';

export interface CardioMetricsResult {
  steps: number;
  calories: number;
  stepsPerMinute: number;
}

/** Matriz de conversão de Passos Por Minuto (PPM) */
export const CARDIO_INTENSITY_PPM_MATRIX: Record<CardioIntensity, number> = {
  low: 100,       // Intensidade baixa (caminhada rápida / Z2 leve)
  moderate: 120,  // Intensidade moderada (trote / Z2 consistente)
  high: 150,      // Intensidade alta (corrida / HIIT)
};

/**
 * Função utilitária pura para cálculo de passos farmados e calorias queimadas.
 * 
 * @param minutes Duração do cardio em minutos (1 a 1440)
 * @param intensity Intensidade do exercício ('low' | 'moderate' | 'high')
 * @param weightKg Peso corporal do usuário em kg (25 a 350)
 * @returns Objeto contendo passos farmados e calorias queimadas
 */
export function calculateCardioMetrics(
  minutes: number,
  intensity: CardioIntensity,
  weightKg: number
): CardioMetricsResult {
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) {
    throw new Error('Duração do cardio inválida. Deve estar entre 1 e 1440 minutos.');
  }

  if (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 350) {
    throw new Error('Peso corporal inválido. Deve estar entre 25kg e 350kg.');
  }

  const stepsPerMinute = CARDIO_INTENSITY_PPM_MATRIX[intensity] ?? 120;
  
  // 1. Passos Farmados = minutos * passos por minuto da intensidade
  const steps = Math.round(minutes * stepsPerMinute);

  // 2. Calorias Queimadas = Passos * 0.04 * (Peso Atual / 70kg de referência)
  const calories = Math.round(steps * 0.04 * (weightKg / 70));

  return {
    steps,
    calories,
    stepsPerMinute,
  };
}

export default calculateCardioMetrics;
