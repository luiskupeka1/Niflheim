import { describe, expect, it } from 'vitest';
import { 
  getFunctionalSetWeight, 
  calculateWeeklyMuscleVolume, 
  type SetVolumeData 
} from '@/lib/volumeTracker';

describe('Advanced Hypertrophy Science - Volume Tracker', () => {
  it('atribui peso zero para séries de WARMUP e FEEDER', () => {
    expect(getFunctionalSetWeight('WARMUP', 'NONE')).toBe(0);
    expect(getFunctionalSetWeight('FEEDER', 'NONE')).toBe(0);
  });

  it('atribui peso 1.0 para séries de WORKING normais', () => {
    expect(getFunctionalSetWeight('WORKING', 'NONE')).toBe(1.0);
    expect(getFunctionalSetWeight('BACKOFF', 'NONE')).toBe(1.0);
  });

  it('atribui peso funcional de 1.75 para bloco completo de MYO_REPS', () => {
    // Um bloco de Myo-reps conta como 1.75 séries no cálculo de volume semanal
    expect(getFunctionalSetWeight('WORKING', 'MYO_REPS')).toBe(1.75);
  });

  it('atribui peso funcional de 1.5 para DROP_SET', () => {
    expect(getFunctionalSetWeight('WORKING', 'DROP_SET')).toBe(1.5);
  });

  it('calcula o volume semanal e detecta risco de Junk Volume se exceder o MRV do Peito (22 séries)', () => {
    // Cria 14 séries de Myo-Reps para Peito: 14 * 1.75 = 24.5 séries efetivas (> MRV de 22)
    const sets: SetVolumeData[] = Array.from({ length: 14 }, (_, i) => ({
      id: `s-${i}`,
      muscle: 'Peito',
      baseType: 'WORKING',
      intensityTechnique: 'MYO_REPS',
      weight: 80,
      reps: 12,
      rir: 1,
      completed: true,
      timestamp: new Date(),
    }));

    const assessment = calculateWeeklyMuscleVolume(sets);
    const peito = assessment.find((a) => a.muscle === 'Peito');

    expect(peito).toBeDefined();
    expect(peito?.effectiveWorkingSets).toBe(24.5);
    expect(peito?.status).toBe('JUNK_VOLUME');
    expect(peito?.recommendation).toContain('Limite de recuperação excedido');
  });

  it('classifica corretamente como MAV (Faixa Ideal) quando entre 12 e 20 séries', () => {
    // 14 séries normais para Costas
    const sets: SetVolumeData[] = Array.from({ length: 14 }, (_, i) => ({
      id: `c-${i}`,
      muscle: 'Costas',
      baseType: 'WORKING',
      intensityTechnique: 'NONE',
      weight: 70,
      reps: 10,
      rir: 2,
      completed: true,
      timestamp: new Date(),
    }));

    const assessment = calculateWeeklyMuscleVolume(sets);
    const costas = assessment.find((a) => a.muscle === 'Costas');

    expect(costas?.effectiveWorkingSets).toBe(14);
    expect(costas?.status).toBe('MAV');
  });
});
