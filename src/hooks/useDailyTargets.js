import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMemo } from 'react';

const DEFAULT_TARGETS = {
  phd: 500,
  opsClockPct: 95,
  leftoverHub: 2,
  missorting: 1,
  absPct: 5,
  dailyWorkers: 20,
  atsNoPiso: 2,
  bwt: 90,
};

/**
 * Retorna os targets corretos para o período selecionado.
 * - effectiveFrom: 'yyyy-MM-dd' — data inicial do filtro atual
 * - effectiveTo:   'yyyy-MM-dd' — data final do filtro atual
 *
 * Lógica de resolução de mês:
 *  - Usa o mês/ano de effectiveFrom como referência principal.
 *  - Para semanas que cruzam meses, cada hub row deve resolver o mês correto,
 *    mas como a Daily consolida por HUB (não por dia), usamos o mês da data inicial.
 */
export function useDailyTargets(regional, effectiveFrom) {
  const { data: allTargets = [], isLoading } = useQuery({
    queryKey: ['hub-targets'],
    queryFn: () => base44.entities.HubTarget.list(),
    staleTime: 30000,
  });

  // Resolve mês/ano de referência a partir da data de início do filtro
  const { refMonth, refYear } = useMemo(() => {
    if (!effectiveFrom) {
      const now = new Date();
      return { refMonth: now.getMonth() + 1, refYear: now.getFullYear() };
    }
    const d = new Date(effectiveFrom + 'T12:00:00');
    return { refMonth: d.getMonth() + 1, refYear: d.getFullYear() };
  }, [effectiveFrom]);

  // Monta mapa: hub_id -> target do mês/ano correto
  const targetMap = useMemo(() => {
    const map = {};
    allTargets.forEach(t => {
      if (t.month === refMonth && t.year === refYear) {
        map[t.hub_id] = t;
        if (t.hub_name) map[t.hub_name] = t;
      }
    });
    return map;
  }, [allTargets, refMonth, refYear]);

  const getHubTargets = (key) => {
    const stored = targetMap[key] || {};
    return { ...DEFAULT_TARGETS, ...Object.fromEntries(Object.entries(stored).filter(([, v]) => v != null)) };
  };

  const targets = new Proxy({}, { get: (_, key) => getHubTargets(key) });

  return { targets, loading: isLoading, defaultTargets: DEFAULT_TARGETS, refMonth, refYear };
}