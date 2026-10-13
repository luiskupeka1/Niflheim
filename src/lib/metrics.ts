export const activityFactors = [1.2, 1.375, 1.55, 1.725, 1.9] as const;
export function metabolism(p: { weight: number; height: number; age: number; sex: string; activity: number }) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const calories = Math.round(bmr * p.activity);
  const protein = Math.round(p.weight * 2);
  const fat = Math.round(p.weight * 0.8);
  return { bmr: Math.round(bmr), calories, protein, fat, carbs: Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4)) };
}
export function calculateCardioMetrics(minutes: number, intensity: 'low' | 'moderate' | 'high', weight: number) {
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440 || !Number.isFinite(weight) || weight < 25 || weight > 350) throw new Error('Dados de cardio inválidos');
  const steps = Math.round(minutes * { low: 100, moderate: 120, high: 150 }[intensity]);
  return { steps, calories: Math.round(steps * 0.04 * (weight / 70)) };
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function requiresDeload(logs: { day: string; doms: number }[], day = localDay()) {
  const [y, m, d] = day.split('-').map(Number);
  return [0, 1, 2].every(offset => logs.some(log => log.day === localDay(new Date(y, m - 1, d - offset)) && log.doms === 5));
}
export function streak(days: string[], today = localDay()) {
  const [y, m, d] = today.split('-').map(Number);
  let offset = days.includes(today) ? 0 : 1;
  let count = 0;
  while (days.includes(localDay(new Date(y, m - 1, d - offset)))) { count++; offset++; }
  return count;
}
export const XP = { habit: 20, workout: 100, nutrition: 50, perLevel: 500 };
export function level(points: number) { return { level: Math.floor(points / XP.perLevel) + 1, progress: points % XP.perLevel }; }
export function cardioCredit(logs: { day: string; calories: number }[], day: string) { return logs.filter(l => l.day === day).reduce((sum, l) => sum + l.calories, 0); }
export function uniqueXP(events: { source: string; points: number }[]) { return [...new Map(events.map(e => [e.source, e])).values()].reduce((s, e) => s + e.points, 0); }