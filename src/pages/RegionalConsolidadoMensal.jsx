import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const fmt    = (n) => (n ?? 0).toLocaleString('pt-BR');
const fmtDec = (n) => Number(n ?? 0).toFixed(0);

export default function RegionalConsolidadoMensal() {
  const { regional } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const decodedRegional = decodeURIComponent(regional);
  // tipo = 'LM' (default) ou 'FM'
  const tipo = searchParams.get('tipo') || 'LM';

  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo,   setDateTo]   = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: hubs = [] } = useQuery({
    queryKey: ['hubs', decodedRegional],
    queryFn: () => base44.entities.Hub.filter({ regional: decodedRegional }),
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports-mensal', decodedRegional],
    queryFn: () => base44.entities.HubReport.filter({ regional: decodedRegional }),
  });

  // Filtrar hubs pelo tipo (LM ou FM)
  const tipoHubs = useMemo(() =>
    hubs.filter(h => (h.tipo || 'LM') === tipo),
    [hubs, tipo]
  );
  const tipoHubIds = useMemo(() => new Set(tipoHubs.map(h => h.id)), [tipoHubs]);

  const monthReports = useMemo(() =>
    reports.filter(r => r.date >= dateFrom && r.date <= dateTo && tipoHubIds.has(r.hub_id)),
    [reports, dateFrom, dateTo, tipoHubIds]
  );

  // Consolida por hub+dia: volumes somam, PHD = volume_total / hc_total, No Show/Leftover = último ciclo
  const consolidatedByHubDay = useMemo(() => {
    const grouped = {};
    monthReports.forEach(r => {
      const key = `${r.hub_id}_${r.date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
    return Object.values(grouped).map(reps => {
      const sorted = [...reps].sort((a, b) => (a.cycle === 'AM' ? -1 : 1));
      const pmR  = sorted.find(x => x.cycle === 'PM' && !x.sem_janela);
      const amR  = sorted.find(x => x.cycle === 'AM' && !x.sem_janela);
      const last = pmR || amR || sorted.find(x => x.cycle === 'PM') || sorted[0];
      let vol_rec = 0, proc = 0, vol_exp = 0, tot_rot = 0, hc_sum = 0;
      let ops_sum = 0, ops_cnt = 0;
      sorted.forEach(r => {
        vol_rec  += r.volume_recebido  || 0;
        proc     += r.processado       || 0;
        vol_exp  += r.volume_expedido  || 0;
        tot_rot  += r.total_rotas      || 0;
        hc_sum   += r.hc               || 0;
        if (r.ops_clock != null) { ops_sum += r.ops_clock; ops_cnt++; }
      });
      return {
        ...last,
        volume_recebido: vol_rec,
        processado: proc,
        volume_expedido: vol_exp,
        total_rotas: tot_rot,
        hc: hc_sum,
        phd_inbound:  hc_sum > 0 ? vol_rec / hc_sum : 0,
        phd_outbound: hc_sum > 0 ? vol_exp / hc_sum : 0,
        ops_clock: ops_cnt > 0 ? ops_sum / ops_cnt : null,
        no_show:  last.no_show  || 0,
        leftover: last.leftover || 0,
      };
    });
  }, [monthReports]);

  // Consolidado geral do período
  const consolidated = useMemo(() => {
    if (consolidatedByHubDay.length === 0) return null;
    let vol_rec = 0, proc = 0, vol_exp = 0, hc = 0, no_show = 0, tot_rot = 0, leftover = 0;
    let ops_sum = 0, ops_cnt = 0;
    consolidatedByHubDay.forEach(r => {
      vol_rec  += r.volume_recebido  || 0;
      proc     += r.processado       || 0;
      vol_exp  += r.volume_expedido  || 0;
      hc       += r.hc               || 0;
      no_show  += r.no_show          || 0;
      tot_rot  += r.total_rotas      || 0;
      leftover += r.leftover         || 0;
      if (r.ops_clock != null) { ops_sum += r.ops_clock; ops_cnt++; }
    });
    return {
      volume_recebido: vol_rec,
      processado: proc,
      volume_expedido: vol_exp,
      hc,
      phd_inbound:  hc > 0 ? vol_rec / hc : 0,
      phd_outbound: hc > 0 ? vol_exp / hc : 0,
      no_show,
      total_rotas: tot_rot,
      leftover,
      ops_clock: ops_cnt > 0 ? ops_sum / ops_cnt : null,
    };
  }, [consolidatedByHubDay]);

  // Dados por hub para comparação
  const byHub = useMemo(() => {
    const map = {};
    consolidatedByHubDay.forEach(r => {
      if (!map[r.hub_name]) {
        map[r.hub_name] = { hub: r.hub_name, vol_rec: 0, proc: 0, vol_exp: 0, hc: 0, no_show: 0, tot_rot: 0, count: 0 };
      }
      const h = map[r.hub_name];
      h.vol_rec  += r.volume_recebido  || 0;
      h.proc     += r.processado       || 0;
      h.vol_exp  += r.volume_expedido  || 0;
      h.hc       += r.hc               || 0;
      h.no_show  += r.no_show          || 0;
      h.tot_rot  += r.total_rotas      || 0;
      h.count++;
    });
    return Object.values(map).map(h => ({
      hub: h.hub,
      volume_recebido: h.vol_rec,
      processado: h.proc,
      volume_expedido: h.vol_exp,
      phd_inbound:  h.hc > 0 ? parseFloat((h.vol_rec / h.hc).toFixed(0)) : 0,
      phd_outbound: h.hc > 0 ? parseFloat((h.vol_exp / h.hc).toFixed(0)) : 0,
    }));
  }, [consolidatedByHubDay]);

  // Evolução diária
  const dailyEvolution = useMemo(() => {
    const map = {};
    consolidatedByHubDay.forEach(r => {
      if (!map[r.date]) {
        map[r.date] = { date: r.date, vol_rec: 0, proc: 0, vol_exp: 0, hc: 0, no_show: 0, tot_rot: 0 };
      }
      const d = map[r.date];
      d.vol_rec  += r.volume_recebido  || 0;
      d.proc     += r.processado       || 0;
      d.vol_exp  += r.volume_expedido  || 0;
      d.hc       += r.hc               || 0;
      d.no_show  += r.no_show          || 0;
      d.tot_rot  += r.total_rotas      || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        dia:        d.date.slice(8),
        recebido:   d.vol_rec,
        processado: d.proc,
        expedido:   d.vol_exp,
        phd_in:     d.hc > 0 ? parseFloat((d.vol_rec / d.hc).toFixed(0)) : 0,
        phd_out:    d.hc > 0 ? parseFloat((d.vol_exp / d.hc).toFixed(0)) : 0,
        no_show:    d.no_show,
        total_rotas: d.tot_rot,
      }));
  }, [consolidatedByHubDay]);

  const tipoLabel = tipo === 'FM' ? 'FM — First Mile' : 'LM — Last Mile';
  const tipoColor = tipo === 'FM' ? 'text-amber-600' : 'text-blue-700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-inter font-extrabold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Consolidado Mensal — {decodedRegional}
            </h1>
            <p className={`text-sm font-inter font-semibold mt-0.5 ${tipoColor}`}>{tipoLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">De:</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-40 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">Até:</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-40 text-sm" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <>
          {consolidated ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-inter font-bold text-primary">Indicadores do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiItem label="Vol. Recebido"  value={fmt(consolidated.volume_recebido)} />
                  <KpiItem label="Processado"     value={fmt(consolidated.processado)} />
                  <KpiItem label="Vol. Expedido"  value={fmt(consolidated.volume_expedido)} />
                  <KpiItem label="HC Total"       value={fmt(consolidated.hc)} />
                  <KpiItem label="PHD In"         value={fmtDec(consolidated.phd_inbound)}  warn={consolidated.phd_inbound > 5} />
                  <KpiItem label="PHD Out"        value={fmtDec(consolidated.phd_outbound)} warn={consolidated.phd_outbound > 5} />
                  <KpiItem label="No Show"        value={fmt(consolidated.no_show)}    warn={consolidated.no_show > 0} />
                  <KpiItem label="Tot. Rotas (Σ)" value={fmt(consolidated.total_rotas)} />
                  <KpiItem label="Leftover"       value={fmt(consolidated.leftover)}   warn={consolidated.leftover > 0} />
                  {consolidated.ops_clock != null && (
                    <KpiItem label="OpsClock (méd.)" value={`${fmtDec(consolidated.ops_clock)}%`} />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground font-inter">Nenhum dado para o período selecionado.</div>
          )}

          {dailyEvolution.length > 0 && (
            <>
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-inter font-bold">Evolução de Volumes (diária)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dailyEvolution} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} tickFormatter={v => v.toLocaleString('pt-BR')} />
                      <Tooltip formatter={(v) => v.toLocaleString('pt-BR')} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="recebido"   name="Recebido"   fill="hsl(var(--chart-1))" radius={[3,3,0,0]} />
                      <Bar dataKey="processado" name="Processado" fill="hsl(var(--chart-2))" radius={[3,3,0,0]} />
                      <Bar dataKey="expedido"   name="Expedido"   fill="hsl(var(--chart-3))" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-inter font-bold">Tendência de PHD (diária)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dailyEvolution} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="phd_in"  name="PHD In"  stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="phd_out" name="PHD Out" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-inter font-bold">No Show e Total de Rotas (diário)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyEvolution} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                      <Tooltip formatter={(v) => v.toLocaleString('pt-BR')} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="no_show"     name="No Show"     fill="hsl(var(--destructive))" radius={[3,3,0,0]} />
                      <Bar dataKey="total_rotas" name="Total Rotas" fill="hsl(var(--chart-4))"     radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {byHub.length > 1 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-inter font-bold">Comparação entre Hubs {tipo} (período)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={byHub} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="hub" tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                        <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} tickFormatter={v => v.toLocaleString('pt-BR')} />
                        <Tooltip formatter={(v) => v.toLocaleString('pt-BR')} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="volume_recebido"  name="Recebido"   fill="hsl(var(--chart-1))" radius={[3,3,0,0]} />
                        <Bar dataKey="processado"       name="Processado" fill="hsl(var(--chart-2))" radius={[3,3,0,0]} />
                        <Bar dataKey="volume_expedido"  name="Expedido"   fill="hsl(var(--chart-3))" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function KpiItem({ label, value, warn }) {
  return (
    <div className="text-center bg-white rounded-lg py-3 px-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium">{label}</p>
      <p className={`text-xl font-inter font-bold mt-0.5 ${warn ? 'text-destructive' : 'text-primary'}`}>{value}</p>
    </div>
  );
}