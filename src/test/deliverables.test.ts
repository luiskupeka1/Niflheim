import { describe, expect, it } from 'vitest';
import { calculateCardioMetrics } from '@/lib/calculateCardioMetrics';
import { checkMrvDeload } from '@/lib/checkMrvDeload';
import { localDay } from '@/lib/metrics';
import { createRouter, rootRouteId } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { QueryClient } from '@tanstack/react-query';

describe('Entregáveis Técnicos - NIFLHEIM', () => {
  describe('calculateCardioMetrics (Farm de Passos e Calorias)', () => {
    it('calcula passos e calorias para 30 minutos de alta intensidade a 70kg', () => {
      // 30 min * 150 ppm = 4.500 passos
      // 4500 * 0.04 * (70 / 70) = 180 kcal
      const result = calculateCardioMetrics(30, 'high', 70);
      expect(result.steps).toBe(4500);
      expect(result.calories).toBe(180);
      expect(result.stepsPerMinute).toBe(150);
    });

    it('ajusta queima calórica proporcionalmente ao peso corporal (80kg)', () => {
      // 60 min * 120 ppm = 7.200 passos
      // 7200 * 0.04 * (80 / 70) = 329.14 -> 329 kcal
      const result = calculateCardioMetrics(60, 'moderate', 80);
      expect(result.steps).toBe(7200);
      expect(result.calories).toBe(329);
    });
  });

  describe('checkMrvDeload (Regra de Fadiga e Deload)', () => {
    it('retorna requiresDeload = true quando DOMS = 5 por 3 dias seguidos', () => {
      const today = new Date();
      const d0 = new Date(today);
      const d1 = new Date(today); d1.setDate(d1.getDate() - 1);
      const d2 = new Date(today); d2.setDate(d2.getDate() - 2);

      const logs = [
        { day: localDay(d0), doms: 5 },
        { day: localDay(d1), doms: 5 },
        { day: localDay(d2), doms: 5 },
      ];

      const assessment = checkMrvDeload(logs, today);
      expect(assessment.requiresDeload).toBe(true);
      expect(assessment.recommendedVolumeReductionPercent).toBe(20);
      expect(assessment.alertMessage).toContain('reduzir as séries do próximo treino em 20%');
    });

    it('retorna requiresDeload = false quando DOMS não atinge 3 dias de nível 5', () => {
      const today = new Date();
      const d0 = new Date(today);
      const d1 = new Date(today); d1.setDate(d1.getDate() - 1);
      const d2 = new Date(today); d2.setDate(d2.getDate() - 2);

      const logs = [
        { day: localDay(d0), doms: 5 },
        { day: localDay(d1), doms: 4 },
        { day: localDay(d2), doms: 5 },
      ];

      const assessment = checkMrvDeload(logs, today);
      expect(assessment.requiresDeload).toBe(false);
    });
  });

  describe('Roteamento de Todas as Páginas', () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const pages = ['/', '/nutricao', '/treinos', '/rotina', '/notas', '/perfil'];

    pages.forEach((path) => {
      it(`encontra a rota válida para ${path}`, () => {
        const matches = router.matchRoutes(path);
        expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
      });
    });
  });
});
