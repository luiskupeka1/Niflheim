/**
 * NIFLHEIM — Advanced Evidence-Based Hypertrophy Engine
 * Volume Tracker: MEV (Minimum Effective Volume), MAV (Maximum Adaptive Volume), MRV (Maximum Recoverable Volume)
 * 
 * Regra Crítica:
 * - WARMUP e FEEDER não contabilizam para o volume efetivo hipertrófico (peso = 0).
 * - WORKING e BACKOFF contam como 1.0 série de trabalho.
 * - MYO_REPS (ativação + micro-séries) conta funcionalmente como 1.75 séries de trabalho
 *   (para evitar inflar o MRV semanal com 'falsas' 5-6 séries isoladas).
 * - DROP_SET conta funcionalmente como 1.5 séries.
 * - CLUSTER_SET conta como 1.2 séries.
 */

export type StandardMuscleGroup =
  | 'Peito'
  | 'Costas'
  | 'Quadríceps'
  | 'Isquiotibiais'
  | 'Glúteos'
  | 'Panturrilhas'
  | 'Ombros Anteriores'
  | 'Ombros Laterais'
  | 'Ombros Posteriores'
  | 'Bíceps'
  | 'Tríceps'
  | 'Trapézio'
  | 'Antebraços'
  | 'Abdômen';

export type MuscleGroup = StandardMuscleGroup | (string & {});

export type BiomechanicalCategory = 'Push' | 'Pull' | 'Legs' | 'Upper' | 'Lower' | 'FullBody';

export type BaseSetType = 'WARMUP' | 'FEEDER' | 'PAP' | 'WORKING' | 'BACKOFF';

export type IntensityTechnique = 'NONE' | 'MYO_REPS' | 'CLUSTER_SET' | 'REST_PAUSE' | 'MUSCLE_ROUNDS' | 'DROP_SET';

export interface SetVolumeData {
  id: string;
  muscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  baseType: BaseSetType;
  intensityTechnique: IntensityTechnique;
  weight: number;
  reps: number;
  rir: number; // 0 a 5
  completed: boolean;
  timestamp: string | Date;
}

export interface MuscleVolumeThresholds {
  mev: number; // Mínimo Efetivo (~6 a 8 séries)
  mavMin: number; // MAV Mínimo (~12 séries)
  mavMax: number; // MAV Máximo (~20 séries)
  mrv: number; // Limite Máximo Recuperável (~22+ séries)
}

/** Tabela de Referência Baseada na Literatura (Mike Israetel / Brad Schoenfeld) */
export const MUSCLE_VOLUME_LANDMARKS: Record<string, MuscleVolumeThresholds> = {
  'Peito': { mev: 8, mavMin: 12, mavMax: 20, mrv: 22 },
  'Costas': { mev: 10, mavMin: 14, mavMax: 22, mrv: 25 },
  'Quadríceps': { mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
  'Isquiotibiais': { mev: 6, mavMin: 10, mavMax: 16, mrv: 18 },
  'Glúteos': { mev: 6, mavMin: 10, mavMax: 16, mrv: 20 },
  'Panturrilhas': { mev: 8, mavMin: 12, mavMax: 18, mrv: 22 },
  'Ombros Anteriores': { mev: 0, mavMin: 6, mavMax: 8, mrv: 12 }, // Já recebe estímulo indireto no Push
  'Ombros Laterais': { mev: 8, mavMin: 14, mavMax: 24, mrv: 26 },
  'Ombros Posteriores': { mev: 6, mavMin: 12, mavMax: 20, mrv: 22 },
  'Bíceps': { mev: 6, mavMin: 10, mavMax: 18, mrv: 20 },
  'Tríceps': { mev: 6, mavMin: 10, mavMax: 16, mrv: 18 },
  'Trapézio': { mev: 4, mavMin: 8, mavMax: 14, mrv: 18 },
  'Antebraços': { mev: 4, mavMin: 8, mavMax: 14, mrv: 18 },
  'Abdômen': { mev: 0, mavMin: 8, mavMax: 16, mrv: 20 },
};

export type VolumeStatus = 'BELOW_MEV' | 'MEV' | 'MAV' | 'MRV_NEAR' | 'JUNK_VOLUME';

export interface MuscleWeeklyAssessment {
  muscle: MuscleGroup;
  effectiveWorkingSets: number; // directSets + (residualSets * 0.5)
  directSets: number;
  residualSets: number;
  rawSetCount: number;
  totalTonnageKg: number;
  status: VolumeStatus;
  statusLabel: string;
  landmarks: MuscleVolumeThresholds;
  recommendation: string;
}

/**
 * Calcula o peso funcional de uma série para hipertrofia
 */
export function getFunctionalSetWeight(
  baseType: BaseSetType,
  technique: IntensityTechnique
): number {
  if (baseType === 'WARMUP' || baseType === 'FEEDER' || baseType === 'PAP') {
    return 0; // Séries de aquecimento, calibração e PAP não geram fadiga hipertrófica contabilizável
  }

  // Séries WORKING ou BACKOFF:
  switch (technique) {
    case 'MYO_REPS':
      // Ativação + 3-5 micro-séries equivalem a 1.75 séries de trabalho normais
      return 1.75;
    case 'DROP_SET':
      // Série até a falha + 1-2 reduções imediatas de 20-30%
      return 1.5;
    case 'CLUSTER_SET':
      return 1.2;
    case 'REST_PAUSE':
      return 1.5;
    case 'NONE':
    default:
      return 1.0;
  }
}

/**
 * Processa as séries semanais e calcula o balanço MEV / MAV / MRV
 * levando em conta Séries Diretas (1.0) e Séries Residuais (0.5)
 */
export function calculateWeeklyMuscleVolume(sets: SetVolumeData[]): MuscleWeeklyAssessment[] {
  const muscleMap = new Map<string, { directSets: number; residualSets: number; rawCount: number; tonnage: number }>();

  // Inicializa todos os grupos musculares da tabela de referência
  Object.keys(MUSCLE_VOLUME_LANDMARKS).forEach((m) => {
    muscleMap.set(m, { directSets: 0, residualSets: 0, rawCount: 0, tonnage: 0 });
  });

  // Agrega as séries válidas completadas
  for (const s of sets) {
    if (!s.completed) continue;
    const functionalWeight = getFunctionalSetWeight(s.baseType, s.intensityTechnique);
    const setTonnage = s.weight * s.reps;

    // 1. Músculo Primário: ganha 1.0 série direta
    const currentPrimary = muscleMap.get(s.muscle) ?? { directSets: 0, residualSets: 0, rawCount: 0, tonnage: 0 };
    muscleMap.set(s.muscle, {
      directSets: currentPrimary.directSets + functionalWeight,
      residualSets: currentPrimary.residualSets,
      rawCount: currentPrimary.rawCount + 1,
      tonnage: currentPrimary.tonnage + setTonnage,
    });

    // 2. Músculos Secundários / Sinergistas: ganham volume residual (0.5 cada)
    if (s.secondaryMuscles && s.secondaryMuscles.length > 0) {
      for (const sec of s.secondaryMuscles) {
        const currentSec = muscleMap.get(sec) ?? { directSets: 0, residualSets: 0, rawCount: 0, tonnage: 0 };
        muscleMap.set(sec, {
          directSets: currentSec.directSets,
          residualSets: currentSec.residualSets + functionalWeight,
          rawCount: currentSec.rawCount,
          tonnage: currentSec.tonnage,
        });
      }
    }
  }

  const results: MuscleWeeklyAssessment[] = [];

  muscleMap.forEach((val, muscle) => {
    const landmarks = MUSCLE_VOLUME_LANDMARKS[muscle] ?? { mev: 6, mavMin: 10, mavMax: 16, mrv: 20 };
    // Volume Efetivo = Diretas (1.0) + Residuais (0.5)
    const effective = Math.round((val.directSets + (val.residualSets * 0.5)) * 10) / 10;
    let status: VolumeStatus = 'BELOW_MEV';
    let statusLabel = 'Abaixo do MEV';
    let recommendation = 'Aumente o volume semanal para atingir estímulo hipertrófico mínimo.';

    if (effective >= landmarks.mrv) {
      status = 'JUNK_VOLUME';
      statusLabel = 'Junk Volume (Risco)';
      recommendation = 'Limite de recuperação excedido! Reduza as séries para evitar overreaching não-funcional.';
    } else if (effective >= landmarks.mavMax) {
      status = 'MRV_NEAR';
      statusLabel = 'Próximo ao MRV';
      recommendation = 'Volume máximo sustentável. Monitore dores e fadiga para evitar estagnação.';
    } else if (effective >= landmarks.mavMin) {
      status = 'MAV';
      statusLabel = 'MAV (Faixa Ideal)';
      recommendation = 'Volume ótimo de hipertrofia máxima adaptativa.';
    } else if (effective >= landmarks.mev) {
      status = 'MEV';
      statusLabel = 'MEV (Volume Mínimo)';
      recommendation = 'Volume suficiente para manutenção ou ganhos graduais.';
    }

    results.push({
      muscle,
      effectiveWorkingSets: effective,
      directSets: Math.round(val.directSets * 10) / 10,
      residualSets: Math.round(val.residualSets * 10) / 10,
      rawSetCount: val.rawCount,
      totalTonnageKg: Math.round(val.tonnage),
      status,
      statusLabel,
      landmarks,
      recommendation,
    });
  });

  return results;
}
