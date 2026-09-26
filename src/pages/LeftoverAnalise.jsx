import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfWeek, getISOWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { consolidatePeriodReports } from '@/lib/reportUtils';
import {
  LEFTOVER_REASONS,
  sumDetalhamento,
  detalhamentoRanking,
  detalhamentoTotalInbound,
  detalhamentoTotalOutbound,
} from '@/lib/leftoverReasons';
import LeftoverAnalysisCharts from '@/components/leftover/LeftoverAnalysisCharts';
import BackButton from '@/components/ui/BackButton';

const REGIONALS = ['Regional 1', 'Regional 2', 'Regional 3', 'Regional 4', 'Regional ES 01'];

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
    weeks.push({ label: `W${w}`, from: format(weekStart, 'yyyy-MM-dd'), to: format(weekEnd, 'yyyy-MM-dd') });
  }
  return weeks;
}

function getMonthOptions(year) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0);
    months.push({
      value: format(start, 'yyyy-MM'),
      label: format(start, 'MMM/yyyy', { locale: ptBR }),
      from: format(start, 'yyyy-MM-dd'),
      to: format(end, 'yyyy-MM-dd'),
    });
  }
  return months;
}

export default function LeftoverAnalise() {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const currentYear = new Date().getFullYear();
  const weekOptions = getWeekOptions(currentYear);
  const monthOptions = getMonthOptions(currentYear);

  const [filterMode, setFilterMode] = useState('range');
  const [selectedDate, setSelectedDate] = useState(yesterday);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(yesterday);
  const [selectedWeek, setSelectedWeek] = useState(() => `W${getISOWeek(new Date())}`);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedRegional, setSelectedRegional] = useState('all');
  const [selectedHub, setSelectedHub] = useState('all');
  const queryClient = useQueryClient();

  const { effectiveFrom, effectiveTo } = useMemo(() => {
    if (filterMode === 'date') return { effectiveFrom: selectedDate, effectiveTo: selectedDate };
    if (filterMode === 'range') return { effectiveFrom: dateFrom, effectiveTo: dateTo };
    if (filterMode === 'week') {
      const w = weekOptions.find((x) => x.label === selectedWeek);
      return { effectiveFrom: w?.from || yesterday, effectiveTo: w?.to || yesterday };
    }
    const m = monthOptions.find((x) => x.value === selectedMonth);
    return { effectiveFrom: m?.from || yesterday, effectiveTo: m?.to || yesterday };
  }, [filterMode, selectedDate, dateFrom, dateTo, selectedWeek, selectedMonth, weekOptions, monthOptions, yesterday]);

  const { data: hubs = [] } = useQuery({
    queryKey: ['hubs-all'],
    queryFn: () => base44.entities.Hub.list(),
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['leftover-reports', effectiveFrom, effectiveTo],
    queryFn: async () => {
      const all = await base44.entities.HubReport.list('-date', 2000);
      return all.filter((r) => r.date >= effectiveFrom && r.date <= effectiveTo);
    },
  });

  const regionalHubs = useMemo(() => {
    const list = selectedRegional === 'all' ? hubs : hubs.filter((h) => h.regional === selectedRegional);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [hubs, selectedRegional]);

  const filteredReports = useMemo(() => {
    const hubIdSet = new Set(regionalHubs.map((h) => h.id));
    return reports.filter((r) => {
      if (!hubIdSet.has(r.hub_id)) return false;
      if (selectedHub !== 'all' && r.hub_id !== selectedHub) return false;
      return true;
    });
  }, [reports, regionalHubs, selectedHub]);

  const aggregated = useMemo(() => {
    const grouped = {};
    filteredReports.forEach((r) => {
      if (!grouped[r.hub_id]) grouped[r.hub_id] = [];
      grouped[r.hub_id].push(r);
    });
    const consolidatedPerHub = Object.values(grouped)
      .map((reps) => consolidatePeriodReports(reps))
      .filter(Boolean);

    const leftoverTotal = consolidatedPerHub.reduce((s, r) => s + (r.leftover || 0), 0);
    const detalhamento = sumDetalhamento(consolidatedPerHub);
    const leftoverInbound = detalhamentoTotalInbound(detalhamento);
    const leftoverOutbound = detalhamentoTotalOutbound(detalhamento);
    const motivosCadastrados = LEFTOVER_REASONS.filter((r) => detalhamento[r.key] > 0).length;
    const ranking = detalhamentoRanking(detalhamento);

    return {
      leftoverTotal,
      leftoverInbound,
      leftoverOutbound,
      detalhamento,
      motivosCadastrados,
      ranking,
      hubCount: consolidatedPerHub.length,
    };
  }, [filteredReports]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['leftover-reports'] });
    queryClient.invalidateQueries({ queryKey: ['hubs-all'] });
  };

  const handleRegionalChange = (v) => {
    setSelectedRegional(v);
    setSelectedHub('all');
  };

  const periodLabel = useMemo(() => {
    if (filterMode === 'date') return format(new Date(selectedDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (filterMode === 'week') return `${selectedWeek} · ${effectiveFrom} a ${effectiveTo}`;
    if (filterMode === 'month') return monthOptions.find((m) => m.value === selectedMonth)?.label || '';
    return `${effectiveFrom} a ${effectiveTo}`;
  }, [filterMode, selectedDate, selectedWeek, selectedMonth, effectiveFrom, effectiveTo, monthOptions]);

  return (
    <div className="space-y-5">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-primary rounded-full" />
          <div>
            <h1 className="text-xl font-inter font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Análise do Leftover
            </h1>
            <p className="text-xs text-muted-foreground font-inter mt-0.5 ml-4">{periodLabel}</p>
          </div>
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-border/60">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Período */}
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">Período:</Label>
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date" className="text-xs">Data</SelectItem>
                  <SelectItem value="range" className="text-xs">Intervalo</SelectItem>
                  <SelectItem value="week" className="text-xs">Semana</SelectItem>
                  <SelectItem value="month" className="text-xs">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterMode === 'date' && (
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-9 w-40 text-sm" />
            )}
            {filterMode === 'range' && (
              <div className="flex items-center gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-40 text-sm" />
                <span className="text-xs text-muted-foreground">até</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-40 text-sm" />
              </div>
            )}
            {filterMode === 'week' && (
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="h-9 w-28 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-56 overflow-y-auto">
                  {weekOptions.map((w) => (
                    <SelectItem key={w.label} value={w.label} className="text-xs">{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filterMode === 'month' && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 w-32 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Operação (Regional) */}
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">Operação:</Label>
              <Select value={selectedRegional} onValueChange={handleRegionalChange}>
                <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todas as Regionais</SelectItem>
                  {REGIONALS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* HUB */}
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">HUB:</Label>
              <Select value={selectedHub} onValueChange={setSelectedHub}>
                <SelectTrigger className="h-9 w-48 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Hubs</SelectItem>
                  {regionalHubs.map((h) => (
                    <SelectItem key={h.id} value={h.id} className="text-xs">{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <LeftoverAnalysisCharts
          leftoverTotal={aggregated.leftoverTotal}
          leftoverInbound={aggregated.leftoverInbound}
          leftoverOutbound={aggregated.leftoverOutbound}
          detalhamento={aggregated.detalhamento}
          motivosCadastrados={aggregated.motivosCadastrados}
          ranking={aggregated.ranking}
          hubCount={aggregated.hubCount}
        />
      )}
    </div>
  );
}