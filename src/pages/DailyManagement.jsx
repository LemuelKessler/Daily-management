import React, { useState, useMemo, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfWeek, getISOWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Target, ChevronDown, Check } from 'lucide-react';
import { consolidatePeriodReports } from '@/lib/reportUtils';
import DailyManagementCards from '@/components/daily/DailyManagementCards';
import DailyInsights from '@/components/daily/DailyInsights';
import DailyTable from '@/components/daily/DailyTable';
import TargetsModal from '@/components/daily/TargetsModal';
import { useDailyTargets } from '@/hooks/useDailyTargets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const REGIONALS = ['Regional 1', 'Regional 2', 'Regional 3', 'Regional 4', 'Regional ES 01'];
const ALL_OPTION = '__ALL__';

// Gera lista de semanas do ano corrente
function getWeekOptions(year) {
  const weeks = [];
  for (let w = 1; w <= 53; w++) {
    const jan4 = new Date(year, 0, 4);
    const firstMonday = startOfWeek(jan4, { weekStartsOn: 1 });
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (w - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    if (weekStart.getFullYear() > year && w > 1) break;
    weeks.push({
      label: `W${w}`,
      from: format(weekStart, 'yyyy-MM-dd'),
      to: format(weekEnd, 'yyyy-MM-dd'),
    });
  }
  return weeks;
}

// PHD outbound consolidado a partir dos reports do hub
function calcPhdOutbound(hubReports) {
  if (!hubReports || hubReports.length === 0) return null;
  let totalExp = 0, totalHC = 0;
  hubReports.forEach(r => {
    totalExp += r.volume_expedido || 0;
    totalHC  += r.hc || 0;
  });
  return totalHC > 0 ? totalExp / totalHC : null;
}

export function calcIndicators(report, hubReports) {
  if (!report) return null;
  const phd = calcPhdOutbound(hubReports);

  // Totais acumulados de todos os reports do período (multi-dia e multi-ciclo)
  const totalVolRecebido = hubReports.reduce((s, r) => s + (r.volume_recebido || 0), 0);
  const totalRotas       = hubReports.reduce((s, r) => s + (r.total_rotas || 0), 0);
  const totalHC          = hubReports.reduce((s, r) => s + (r.hc || 0), 0);
  const totalDiaristas   = hubReports.reduce((s, r) => s + (r.diaristas || 0), 0);
  const totalAbsenteismo = hubReports.reduce((s, r) => s + (r.absenteismo || 0), 0);
  const totalMissorting  = hubReports.reduce((s, r) => s + (r.missorting || 0), 0);
  const totalRotasFora   = hubReports.reduce((s, r) => s + (r.rotas_fora_ops_clock || 0), 0);

  // % Leftover = Leftover (aba TOTAL, último ciclo válido) / Volume Recebido Total × 100
  const leftoverHub = totalVolRecebido > 0
    ? ((report.leftover || 0) / totalVolRecebido) * 100 : null;

  // % Ops Clock = (Total Rotas - Rotas Fora) / Total Rotas × 100
  const opsClockPct = totalRotas > 0
    ? ((totalRotas - totalRotasFora) / totalRotas) * 100 : null;

  // % ATS no Piso = No Show (aba TOTAL, último ciclo válido) / Total de Rotas × 100
  const atsNoPiso = totalRotas > 0
    ? ((report.no_show || 0) / totalRotas) * 100 : null;

  // % Daily Workers = Diaristas Total / HC Total × 100
  const dailyWorkers = totalHC > 0
    ? (totalDiaristas / totalHC) * 100 : null;

  // % Absenteísmo = Absenteísmo Total / (HC Total + Absenteísmo Total) × 100
  const absPct = (totalHC + totalAbsenteismo) > 0
    ? (totalAbsenteismo / (totalHC + totalAbsenteismo)) * 100 : null;

  // % Missorting = Missorting Total / Volume Recebido Total × 100
  const missortingPct = totalVolRecebido > 0
    ? (totalMissorting / totalVolRecebido) * 100 : null;

  const bwt = report.bwt ?? null;
  const hc = report.hc || 0;

  return { hc, phd, leftoverHub, opsClockPct, atsNoPiso, dailyWorkers, absPct, missorting: missortingPct, bwt };
}

// Dropdown de seleção múltipla de regionais
function RegionalMultiSelect({ selectedRegionals, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAll = selectedRegionals.length === 0 || selectedRegionals.length === REGIONALS.length;

  const toggleAll = () => {
    onChange([]); // [] significa todas
  };

  const toggleRegional = (r) => {
    if (selectedRegionals.includes(r)) {
      const next = selectedRegionals.filter(x => x !== r);
      onChange(next.length === 0 ? [] : next);
    } else {
      const next = [...selectedRegionals, r];
      onChange(next.length === REGIONALS.length ? [] : next);
    }
  };

  const label = isAll
    ? 'Regionais'
    : selectedRegionals.length === 1
      ? selectedRegionals[0]
      : `${selectedRegionals.length} regionais`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="h-8 min-w-[9rem] flex items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className="font-inter text-foreground">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[11rem] bg-popover border border-border rounded-md shadow-lg py-1">
          {/* Todas */}
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-inter hover:bg-accent transition-colors"
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isAll ? 'bg-primary border-primary' : 'border-input'}`}>
              {isAll && <Check className="w-2.5 h-2.5 text-white" />}
            </span>
            <span className="font-semibold">Todas as Regionais</span>
          </button>
          <div className="my-1 border-t border-border" />
          {REGIONALS.map(r => {
            const checked = isAll || selectedRegionals.includes(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggleRegional(r)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-inter hover:bg-accent transition-colors"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-primary border-primary' : 'border-input'}`}>
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                {r}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DailyManagement() {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const currentYear = new Date().getFullYear();
  const weekOptions = getWeekOptions(currentYear);

  const [filterMode, setFilterMode] = useState('date');
  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [dateFrom, setDateFrom] = useState(yesterday);
  const [dateTo, setDateTo] = useState(yesterday);
  const [selectedWeek, setSelectedWeek] = useState(() => `W${getISOWeek(new Date())}`);
  // [] = todas as regionais (padrão)
  const [selectedRegionals, setSelectedRegionals] = useState([]);
  const [showTargets, setShowTargets] = useState(false);
  const queryClient = useQueryClient();

  // Regionais efetivas a buscar
  const activeRegionals = useMemo(
    () => selectedRegionals.length === 0 ? REGIONALS : selectedRegionals,
    [selectedRegionals]
  );

  // Resolve datas efetivas de busca conforme modo de filtro
  const { effectiveFrom, effectiveTo } = useMemo(() => {
    if (filterMode === 'date') return { effectiveFrom: selectedDate, effectiveTo: selectedDate };
    if (filterMode === 'range') return { effectiveFrom: dateFrom, effectiveTo: dateTo };
    const week = weekOptions.find(w => w.label === selectedWeek);
    return { effectiveFrom: week?.from || yesterday, effectiveTo: week?.to || yesterday };
  }, [filterMode, selectedDate, dateFrom, dateTo, selectedWeek, weekOptions, yesterday]);

  const { data: hubs = [] } = useQuery({
    queryKey: ['hubs-all'],
    queryFn: () => base44.entities.Hub.list(),
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports-daily', effectiveFrom, effectiveTo],
    queryFn: async () => {
      const all = await base44.entities.HubReport.list('-date', 2000);
      return all.filter(r => r.date >= effectiveFrom && r.date <= effectiveTo);
    },
  });

  const { targets } = useDailyTargets(null, effectiveFrom);

  // Filtra hubs pelas regionais ativas
  const filteredHubs = useMemo(
    () => hubs.filter(h => activeRegionals.includes(h.regional)),
    [hubs, activeRegionals]
  );

  // Consolidar reports por hub
  const consolidatedByHub = useMemo(() => {
    const grouped = {};
    reports.forEach(r => {
      if (!grouped[r.hub_id]) grouped[r.hub_id] = [];
      grouped[r.hub_id].push(r);
    });
    const result = {};
    Object.entries(grouped).forEach(([hubId, hubReports]) => {
      result[hubId] = { consolidated: consolidatePeriodReports(hubReports), raw: hubReports };
    });
    return result;
  }, [reports]);

  const rows = useMemo(() => {
    return filteredHubs.map(hub => {
      const entry = consolidatedByHub[hub.id] || null;
      const report = entry?.consolidated || null;
      const rawReports = entry?.raw || [];
      const indicators = calcIndicators(report, rawReports);
      const hubTargets = targets[hub.id] || targets[hub.name] || {};
      return { hub, report, indicators, hubTargets };
    });
  }, [filteredHubs, consolidatedByHub, targets]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['reports-daily'] });
    queryClient.invalidateQueries({ queryKey: ['hubs-all'] });
    queryClient.invalidateQueries({ queryKey: ['hub-targets'] });
  };

  const periodLabel = useMemo(() => {
    if (filterMode === 'date') return format(parseISO(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (filterMode === 'week') return `${selectedWeek} · ${effectiveFrom} até ${effectiveTo}`;
    return `${effectiveFrom} até ${effectiveTo}`;
  }, [filterMode, selectedDate, selectedWeek, effectiveFrom, effectiveTo]);

  // Regional para o modal de Targets (usa a primeira selecionada, ou todas)
  const targetRegional = activeRegionals.length === 1 ? activeRegionals[0] : activeRegionals[0] || REGIONALS[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h1 className="text-xl font-inter font-extrabold text-foreground tracking-tight">Daily Management</h1>
            <span className="bg-primary/10 text-primary text-xs font-inter font-bold px-2.5 py-1 rounded-full">D-1</span>
          </div>
          <p className="text-xs text-muted-foreground font-inter mt-0.5 ml-4">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {/* Regional multi-select */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">Regional:</Label>
            <RegionalMultiSelect selectedRegionals={selectedRegionals} onChange={setSelectedRegionals} />
          </div>

          {/* Modo de filtro */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">Período:</Label>
            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date" className="text-xs">Por data</SelectItem>
                <SelectItem value="range" className="text-xs">Intervalo</SelectItem>
                <SelectItem value="week" className="text-xs">Semana (W)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inputs conforme modo */}
          {filterMode === 'date' && (
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-8 w-36 text-xs" />
          )}
          {filterMode === 'range' && (
            <>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
              <span className="text-xs text-muted-foreground">até</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
            </>
          )}
          {filterMode === 'week' && (
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-56 overflow-y-auto">
                {weekOptions.map(w => (
                  <SelectItem key={w.label} value={w.label} className="text-xs">{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-inter font-semibold" onClick={() => setShowTargets(true)}>
            <Target className="w-3.5 h-3.5" /> Targets
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Cards executivos */}
      <DailyManagementCards rows={rows} />

      {/* Insights automáticos */}
      <DailyInsights rows={rows} />

      {/* Tabela principal */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm font-inter gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Carregando dados...
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mb-2 opacity-40" />
          <p className="font-inter text-sm">Nenhum hub cadastrado para as regionais selecionadas</p>
        </div>
      ) : (
        <DailyTable rows={rows} />
      )}

      {/* Modal Targets */}
      {showTargets && (
        <TargetsModal
          regional={targetRegional}
          onClose={() => setShowTargets(false)}
          initialMonth={new Date(effectiveFrom + 'T12:00:00').getMonth() + 1}
          initialYear={new Date(effectiveFrom + 'T12:00:00').getFullYear()}
        />
      )}
    </div>
  );
}