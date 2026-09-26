import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import CycleFilter from '@/components/dashboard/CycleFilter';
import BackButton from '@/components/ui/BackButton';
import HubDetailCharts from '@/components/hub/HubDetailCharts';
import HubMonthlyTable from '@/components/hub/HubMonthlyTable';

export default function HubDetail() {
  const { hubId } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const regional = urlParams.get('regional') || '';

  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cycle, setCycle] = useState('TOTAL');

  const { data: hub } = useQuery({
    queryKey: ['hub', hubId],
    queryFn: async () => {
      const hubs = await base44.entities.Hub.filter({ id: hubId });
      return hubs[0];
    },
  });

  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ['hub-reports', hubId],
    queryFn: () => base44.entities.HubReport.filter({ hub_id: hubId }, '-date'),
  });

  const filteredReports = useMemo(() => {
    return allReports.filter(r => {
      const matchDate = r.date >= dateFrom && r.date <= dateTo;
      const matchCycle = cycle === 'TOTAL' || r.cycle === cycle;
      return matchDate && matchCycle;
    });
  }, [allReports, dateFrom, dateTo, cycle]);

  const dailyConsolidated = useMemo(() => {
    if (cycle !== 'TOTAL') {
      // AM ou PM individuais: sem consolidação
      const byDate = {};
      filteredReports.forEach(r => { byDate[r.date] = { ...r }; });
      return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }
    // TOTAL: consolida AM+PM por dia com regras corretas
    const byDate = {};
    allReports.filter(r => r.date >= dateFrom && r.date <= dateTo).forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    });
    return Object.values(
      Object.fromEntries(
        Object.entries(byDate).map(([date, reps]) => {
          const sorted = [...reps].sort((a, b) => (a.cycle === 'AM' ? -1 : 1));
          const pmR = sorted.find(x => x.cycle === 'PM' && !x.sem_janela);
          const amR = sorted.find(x => x.cycle === 'AM' && !x.sem_janela);
          const last = pmR || amR || sorted.find(x => x.cycle === 'PM') || sorted[0];
          let vol_rec = 0, proc = 0, vol_exp = 0, tot_rot = 0, hc_sum = 0;
          sorted.forEach(r => {
            vol_rec += r.volume_recebido || 0;
            proc    += r.processado      || 0;
            vol_exp += r.volume_expedido || 0;
            tot_rot += r.total_rotas     || 0;
            hc_sum  += r.hc              || 0;
          });
          return [date, {
            ...last,
            date,
            volume_recebido: vol_rec,
            processado: proc,
            volume_expedido: vol_exp,
            total_rotas: tot_rot,
            hc: hc_sum,
            phd_inbound:  hc_sum > 0 ? vol_rec / hc_sum : 0,
            phd_outbound: hc_sum > 0 ? vol_exp / hc_sum : 0,
            no_show:      last.no_show     || 0,
            leftover:     last.leftover    || 0,
            leftover_obs: last.leftover_obs || '',
          }];
        })
      )
    ).sort((a, b) => a.date.localeCompare(b.date));
  }, [allReports, filteredReports, cycle, dateFrom, dateTo]);

  const monthlyConsolidated = useMemo(() => {
    const byMonth = {};
    dailyConsolidated.forEach(r => {
      const month = r.date.substring(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = {
          month,
          volume_recebido: 0, processado: 0, volume_expedido: 0,
          hc: 0, leftover: 0, no_show: 0, total_rotas: 0,
        };
      }
      const m = byMonth[month];
      m.volume_recebido += r.volume_recebido || 0;
      m.processado      += r.processado      || 0;
      m.volume_expedido += r.volume_expedido || 0;
      m.hc              += r.hc              || 0;
      m.leftover        += r.leftover        || 0;
      m.no_show         += r.no_show         || 0;
      m.total_rotas     += r.total_rotas     || 0;
    });
    return Object.values(byMonth).map(m => ({
      ...m,
      phd_inbound:  m.hc > 0 ? m.volume_recebido  / m.hc : 0,
      phd_outbound: m.hc > 0 ? m.volume_expedido / m.hc : 0,
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [dailyConsolidated]);

  const periodSummary = useMemo(() => {
    if (dailyConsolidated.length === 0) return null;
    let vol_rec = 0, proc = 0, vol_exp = 0, leftover = 0, hc = 0;
    dailyConsolidated.forEach(r => {
      vol_rec  += r.volume_recebido  || 0;
      proc     += r.processado       || 0;
      vol_exp  += r.volume_expedido  || 0;
      leftover += r.leftover         || 0;
      hc       += r.hc               || 0;
    });
    return {
      volume_recebido: vol_rec,
      processado: proc,
      volume_expedido: vol_exp,
      leftover,
      phd_inbound:  hc > 0 ? (vol_rec / hc).toFixed(0) : 0,
      phd_outbound: hc > 0 ? (vol_exp / hc).toFixed(0) : 0,
    };
  }, [dailyConsolidated]);

  const handleExport = () => {
    const rows = [['Data', 'Ciclo', 'Recebido', 'Processado', 'Expedido', 'PHD In', 'PHD Out', 'Leftover']];
    filteredReports.forEach(r => {
      rows.push([r.date, r.cycle, r.volume_recebido, r.processado, r.volume_expedido, r.phd_inbound, r.phd_outbound, r.leftover]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hub?.name || 'hub'}_historico.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-extrabold text-foreground">
            {hub?.name || 'Hub'}
          </h1>
          <p className="text-sm text-muted-foreground font-inter">{decodeURIComponent(regional)} — Histórico</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CycleFilter selected={cycle} onChange={setCycle} />
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs font-inter">Data Inicial</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs font-inter">Data Final</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {periodSummary && (
            <Card className="border-primary/20 bg-accent/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-inter font-bold">Consolidado do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <SummaryItem label="Recebido (Σ)" value={periodSummary.volume_recebido.toLocaleString()} />
                  <SummaryItem label="Processado (Σ)" value={periodSummary.processado.toLocaleString()} />
                  <SummaryItem label="Expedido (Σ)" value={periodSummary.volume_expedido.toLocaleString()} />
                  <SummaryItem label="PHD In (x̄)" value={periodSummary.phd_inbound} />
                  <SummaryItem label="PHD Out (x̄)" value={periodSummary.phd_outbound} />
                  <SummaryItem label="Leftover (Σ)" value={periodSummary.leftover.toLocaleString()} />
                </div>
              </CardContent>
            </Card>
          )}

          <HubDetailCharts data={dailyConsolidated} />
          <HubMonthlyTable data={monthlyConsolidated} />
        </>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium">{label}</p>
      <p className="text-xl font-inter font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}