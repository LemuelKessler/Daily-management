import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CycleFilter from '@/components/dashboard/CycleFilter';
import HubCard from '@/components/dashboard/HubCard';
import HubRanking from '@/components/dashboard/HubRanking';
import RegionalConsolidado from '@/components/dashboard/RegionalConsolidado';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { consolidateHubReports } from '@/lib/reportUtils';
import BackButton from '@/components/ui/BackButton';

export default function RegionalDashboard() {
  const { regional } = useParams();
  const decodedRegional = decodeURIComponent(regional);
  const [cycle, setCycle] = useState('TOTAL');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const queryClient = useQueryClient();

  const { data: hubs = [], isLoading: loadingHubs } = useQuery({
    queryKey: ['hubs', decodedRegional],
    queryFn: () => base44.entities.Hub.filter({ regional: decodedRegional }),
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['reports', decodedRegional, selectedDate],
    queryFn: () => base44.entities.HubReport.filter({ regional: decodedRegional, date: selectedDate }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HubReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', decodedRegional, selectedDate] });
      toast.success('Reporte excluído!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HubReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', decodedRegional, selectedDate] });
      toast.success('Reporte atualizado!');
    },
  });

  // Consolidação por hub aplicando regras de No Show e Leftover
  const consolidatedReports = useMemo(() => {
    const byHub = {};

    if (cycle === 'TOTAL') {
      // Agrupa todos os reports por hub
      const grouped = {};
      reports.forEach(r => {
        if (!grouped[r.hub_id]) grouped[r.hub_id] = [];
        grouped[r.hub_id].push(r);
      });
      // Consolida cada hub com as regras corretas
      Object.entries(grouped).forEach(([hubId, hubReports]) => {
        byHub[hubId] = consolidateHubReports(hubReports);
      });
    } else {
      reports.forEach(r => {
        if (r.cycle === cycle) {
          byHub[r.hub_id] = { ...r, _ids: [r.id], _count: 1 };
        }
      });
    }

    return byHub;
  }, [reports, cycle]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['reports', decodedRegional, selectedDate] });
    queryClient.invalidateQueries({ queryKey: ['hubs', decodedRegional] });
  };

  const handleExport = () => {
    const rows = [['Hub', 'Tipo', 'Recebido', 'Processado', 'Expedido', 'PHD In', 'PHD Out', 'Leftover', 'No Show', 'Status']];
    hubs.forEach(h => {
      const r = consolidatedReports[h.id];
      rows.push([h.name, h.tipo || 'LM', r?.volume_recebido ?? '', r?.processado ?? '', r?.volume_expedido ?? '', r?.phd_inbound ?? '', r?.phd_outbound ?? '', r?.leftover ?? '', r?.no_show ?? '', r?.status ?? '']);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${decodedRegional}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = loadingHubs || loadingReports;

  // Separar hubs LM e FM
  const lmHubs = hubs.filter(h => (h.tipo || 'LM') === 'LM');
  const fmHubs = hubs.filter(h => h.tipo === 'FM');

  const lmReports = lmHubs.map(h => consolidatedReports[h.id]).filter(Boolean);
  const fmReports = fmHubs.map(h => consolidatedReports[h.id]).filter(Boolean);
  const allReportsList = Object.values(consolidatedReports);

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-inter font-extrabold text-foreground">{decodedRegional}</h1>
          <p className="text-sm text-muted-foreground font-inter mt-0.5">
            {format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">Data:</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-9 w-40 text-sm"
            />
          </div>
          <CycleFilter selected={cycle} onChange={setCycle} />
          <Button variant="outline" size="icon" onClick={handleRefresh} className="shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport} className="shrink-0">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : hubs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-inter">
          <p className="text-lg font-medium">Nenhum hub cadastrado</p>
          <p className="text-sm mt-1">Adicione hubs na gestão de hubs</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Seção LM */}
          {lmHubs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-100 text-blue-700 text-xs font-inter font-bold px-2.5 py-1 rounded-full">LM — Last Mile</span>
                <span className="text-xs text-muted-foreground font-inter">{lmHubs.length} hub(s)</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lmHubs.map(hub => (
                    <HubCard
                      key={hub.id}
                      hub={hub}
                      report={consolidatedReports[hub.id]}
                      regional={decodedRegional}
                      selectedDate={selectedDate}
                      cycle={cycle}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                      allReportsForHub={reports.filter(r => r.hub_id === hub.id && (cycle === 'TOTAL' || r.cycle === cycle))}
                    />
                  ))}
                </div>
                <div className="space-y-4">
                  <RegionalConsolidado reports={lmReports} regional={decodedRegional} label="Consolidado LM" tipo="LM" />
                  <HubRanking reports={lmReports} />
                </div>
              </div>
            </div>
          )}

          {/* Seção FM */}
          {fmHubs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-amber-100 text-amber-700 text-xs font-inter font-bold px-2.5 py-1 rounded-full">FM — First Mile</span>
                <span className="text-xs text-muted-foreground font-inter">{fmHubs.length} hub(s)</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fmHubs.map(hub => (
                    <HubCard
                      key={hub.id}
                      hub={hub}
                      report={consolidatedReports[hub.id]}
                      regional={decodedRegional}
                      selectedDate={selectedDate}
                      cycle={cycle}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                      allReportsForHub={reports.filter(r => r.hub_id === hub.id && (cycle === 'TOTAL' || r.cycle === cycle))}
                    />
                  ))}
                </div>
                <div className="space-y-4">
                  <RegionalConsolidado reports={fmReports} regional={decodedRegional} label="Consolidado FM" tipo="FM" />
                  <HubRanking reports={fmReports} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}