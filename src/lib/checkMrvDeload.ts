/**
 * Algoritmo de Volume Recuperável Máximo (MRV) e Fadiga Sistêmica - NIFLHEIM
 * 
 * Avalia o histórico de check-ins noturnos dos últimos 3 dias para detectar
 * overreaching não-funcional ou excesso de dano muscular tardio (DOMS).
 */

export interface FatigueLogItem {
  id?: string;
  day: string; // Formato YYYY-MM-DD
  sleep?: number;   // 1 a 5 estrelas
  doms: number;    // 1 a 5 estrelas (Dores Musculares Tardias)
  fatigue?: number; // 1 a 5 estrelas (Cansaço do Sistema Nervoso Central)
}

export interface MrvAssessmentResult {
  requiresDeload: boolean;
  consecutiveSevereDomsDays: number;
  alertMessage?: string;
  recommendedVolumeReductionPercent?: number;
}

/**
 * Função utilitária pura para gerar a data no padrão ISO local YYYY-MM-DD.
 */
function toLocalDayString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Avalia o histórico de Fadiga dos últimos 3 dias consecutivos.
 * 
 * Regra: Se o DOMS estiver no nível 5 (dor muscular extrema) por 3 dias seguidos,
 * aciona a flag requiresDeload = true e sugere redução de 20% no volume de séries.
 * 
 * @param logs Lista de registros diários de fadiga do usuário
 * @param referenceDate Data de referência (default: data atual)
 * @returns MrvAssessmentResult com status e recomendação de deload
 */
export function checkMrvDeload(
  logs: FatigueLogItem[],
  referenceDate = new Date()
): MrvAssessmentResult {
  const targetDays = [0, 1, 2].map((offset) => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - offset);
    return toLocalDayString(d);
  });

  // Verifica se todos os 3 últimos dias possuem registro com DOMS nível 5
  let consecutiveLevel5Count = 0;
  for (const dayStr of targetDays) {
    const log = logs.find((l) => l.day === dayStr);
    if (log && log.doms === 5) {
      consecutiveLevel5Count++;
    }
  }

  const requiresDeload = consecutiveLevel5Count === 3;

  if (requiresDeload) {
    return {
      requiresDeload: true,
      consecutiveSevereDomsDays: consecutiveLevel5Count,
      alertMessage:
        'Atenção: Seu volume de treino pode ter ultrapassado sua capacidade de recuperação. Considere reduzir as séries do próximo treino em 20%.',
      recommendedVolumeReductionPercent: 20,
    };
  }

  return {
    requiresDeload: false,
    consecutiveSevereDomsDays: consecutiveLevel5Count,
  };
}

export default checkMrvDeload;
