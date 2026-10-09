import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
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

// ============================================================
// CONVERSÃO DOS DADOS DO SUPABASE
// ============================================================

const numberFields = [
  'forecast',
  'volume_recebido',
  'processado',
  'volume_expedido',
  'colaboradores',
  'diaristas',
  'sinergia_recebida',
  'sinergia_enviada',
  'absenteismo',
  'no_show',
  'total_rotas',
  'rotas_fora_opsclock',
  'opsclock',
  'missorting',
  'bwt',
  'leftover',
  'leftover_total',
  'leftover_inbound',
  'leftover_outbound',
  'on_hold',
  'avaria',
  'outro_hub',
  'misscan',
  'volumoso_nao_roteirizado',
  'fora_de_rota',
  'erro_etiquetagem',
  'erro_sorting',
  'comercial',
  'retirado_at_modal_incorreto',
  'retirado_at_estouro_capacidade',
  'erro_realocacao',
  'backlog',
  'lh_atrasado',
  'lh_cortado_incapacidade',
  'lh_nao_descarregado',
  'soctransported',
  'hc',
  'hc_calculado',
  'hccalculado',
  'opsclock_perc',
  'opsclockperc',
  'phd_inbound',
  'phdinbound',
  'phd_outbound',
  'phdoutbound',
  'total_motivos',
  'totalmotivos',
  'diferenca',
  'ops_clock',
  'rotas_fora_ops_clock',
];

function normalizeReport(report) {
  if (!report) return report;

  const normalized = { ...report };

  numberFields.forEach(field => {
    if (normalized[field] !== null && normalized[field] !== undefined && normalized[field] !== '') {
      const value = Number(normalized[field]);
      normalized[field] = Number.isFinite(value) ? value : 0;
    } else {
      normalized[field] = null;
    }
  });

  // Compatibilidade com nomes usados pelo código antigo
  if (normalized.rotas_fora_ops_clock == null && normalized.rotas_fora_opsclock != null) {
    normalized.rotas_fora_ops_clock = Number(normalized.rotas_fora_opsclock) || 0;
  }

  if (normalized.ops_clock == null && normalized.opsclock != null) {
    normalized.ops_clock = Number(normalized.opsclock) || 0;
  }

  if (normalized.ops_clock == null && normalized.opsclock_perc != null) {
    normalized.ops_clock = Number(normalized.opsclock_perc) || 0;
  }

  if (normalized.hc == null) {
    normalized.hc =
      Number(normalized.colaboradores || 0) +
      Number(normalized.diaristas || 0) +
      Number(normalized.sinergia_recebida || 0);
  }

  return normalized;
}

export default function RegionalDashboard() {
  const { regional } = useParams();
  const decodedRegional = decodeURIComponent(regional);

  const [cycle, setCycle] = useState('TOTAL');

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  const queryClient = useQueryClient();

  // ============================================================
  // BUSCA HUBs NO SUPABASE
  // ============================================================

  const {
    data: hubs = [],
    isLoading: loadingHubs,
  } = useQuery({
    queryKey: ['hubs', decodedRegional],

    queryFn: async () => {
      const { data, error } = await supabase
        .from('Hub')
        .select('*')
        .eq('regional', decodedRegional);

      if (error) {
        console.error('Erro ao buscar HUBs:', error);
        throw error;
      }

      return data || [];
    },
  });

  // ============================================================
  // BUSCA REPORTS NO SUPABASE
  // ============================================================

  const {
    data: reports = [],
    isLoading: loadingReports,
  } = useQuery({
    queryKey: ['reports', decodedRegional, selectedDate],

    queryFn: async () => {
      const { data, error } = await supabase
        .from('HubReport')
        .select('*')
        .eq('regional', decodedRegional)
        .eq('date', selectedDate);
        console.log('REGIONAL:', decodedRegional);
console.log('DATA SELECIONADA:', selectedDate);
console.log('DADOS HUBREPORT:', data);
console.log('ERRO HUBREPORT:', error);

      if (error) {
        console.error('Erro ao buscar HubReport:', error);
        throw error;
      }

      return (data || []).map(normalizeReport);
    },
  });

  // ============================================================
  // EXCLUIR REPORT
  // ============================================================

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('HubReport')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir report:', error);
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['reports', decodedRegional, selectedDate],
      });

      toast.success('Reporte excluído!');
    },

    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir reporte.');
    },
  });

  // ============================================================
  // ATUALIZAR REPORT
  // ============================================================

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = { ...data };

      // Campos numéricos são TEXT no Supabase.
      numberFields.forEach(field => {
        if (
          payload[field] !== undefined &&
          payload[field] !== null &&
          payload[field] !== ''
        ) {
          payload[field] = String(payload[field]);
        }
      });

      const { error } = await supabase
        .from('HubReport')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar report:', error);
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['reports', decodedRegional, selectedDate],
      });

      toast.success('Reporte atualizado!');
    },

    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar reporte.');
    },
  });

  // ============================================================
  // CONSOLIDAÇÃO POR HUB
  // ============================================================

  const consolidatedReports = useMemo(() => {
    const byHub = {};

    if (cycle === 'TOTAL') {
      const grouped = {};

      reports.forEach(report => {
        if (!grouped[report.hub_id]) {
          grouped[report.hub_id] = [];
        }

        grouped[report.hub_id].push(report);
      });

      Object.entries(grouped).forEach(([hubId, hubReports]) => {
        byHub[hubId] = normalizeReport(
          consolidateHubReports(hubReports)
        );
      });
    } else {
      reports.forEach(report => {
        if (report.cycle === cycle) {
          byHub[report.hub_id] = {
            ...normalizeReport(report),
            _ids: [report.id],
            _count: 1,
          };
        }
      });
    }

    return byHub;
  }, [reports, cycle]);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['reports', decodedRegional, selectedDate],
    });

    queryClient.invalidateQueries({
      queryKey: ['hubs', decodedRegional],
    });
  };

  // ============================================================
  // EXPORTAÇÃO
  // ============================================================

  const handleExport = () => {
    const rows = [
      [
        'Hub',
        'Tipo',
        'Recebido',
        'Processado',
        'Expedido',
        'PHD In',
        'PHD Out',
        'Leftover',
        'No Show',
        'Status',
      ],
    ];

    hubs.forEach(hub => {
      const report = consolidatedReports[hub.id];

      rows.push([
        hub.name,
        hub.tipo || 'LM',
        report?.volume_recebido ?? '',
        report?.processado ?? '',
        report?.volume_expedido ?? '',
        report?.phd_inbound ?? '',
        report?.phd_outbound ?? '',
        report?.leftover ?? '',
        report?.no_show ?? '',
        report?.status ?? '',
      ]);
    });

    const csv = rows
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;
    a.download = `${decodedRegional}_${selectedDate}.csv`;

    a.click();

    URL.revokeObjectURL(url);
  };

  // ============================================================
  // LOADING
  // ============================================================

  const isLoading = loadingHubs || loadingReports;

  // ============================================================
  // SEPARAÇÃO LM / FM
  // ============================================================

  const lmHubs = hubs.filter(
    hub => (hub.tipo || 'LM') === 'LM'
  );

  const fmHubs = hubs.filter(
    hub => hub.tipo === 'FM'
  );

  const lmReports = lmHubs
    .map(hub => consolidatedReports[hub.id])
    .filter(Boolean);

  const fmReports = fmHubs
    .map(hub => consolidatedReports[hub.id])
    .filter(Boolean);

  return (
    <div className="space-y-6">

      <BackButton />

      {/* ======================================================
          CABEÇALHO
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-inter font-extrabold text-foreground">
            {decodedRegional}
          </h1>

          <p className="text-sm text-muted-foreground font-inter mt-0.5">
            {format(
              new Date(selectedDate + 'T12:00:00'),
              "EEEE, d 'de' MMMM",
              { locale: ptBR }
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-2">

            <Label className="text-xs font-inter text-muted-foreground whitespace-nowrap">
              Data:
            </Label>

            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-9 w-40 text-sm"
            />

          </div>

          <CycleFilter
            selected={cycle}
            onChange={setCycle}
          />

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            className="shrink-0"
          >
            <Download className="w-4 h-4" />
          </Button>

        </div>
      </div>

      {/* ======================================================
          CONTEÚDO
      ====================================================== */}

      {isLoading ? (

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {[1, 2, 3, 4].map(i => (
            <Skeleton
              key={i}
              className="h-48 rounded-xl"
            />
          ))}

        </div>

      ) : hubs.length === 0 ? (

        <div className="text-center py-20 text-muted-foreground font-inter">

          <p className="text-lg font-medium">
            Nenhum hub cadastrado
          </p>

          <p className="text-sm mt-1">
            Adicione hubs na gestão de hubs
          </p>

        </div>

      ) : (

        <div className="space-y-8">

          {/* ==================================================
              LM
          ================================================== */}

          {lmHubs.length > 0 && (

            <div>

              <div className="flex items-center gap-2 mb-4">

                <span className="bg-blue-100 text-blue-700 text-xs font-inter font-bold px-2.5 py-1 rounded-full">
                  LM — Last Mile
                </span>

                <span className="text-xs text-muted-foreground font-inter">
                  {lmHubs.length} hub(s)
                </span>

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

                      onDelete={id =>
                        deleteMutation.mutate(id)
                      }

                      onUpdate={(id, data) =>
                        updateMutation.mutate({
                          id,
                          data,
                        })
                      }

                      allReportsForHub={reports.filter(
                        report =>
                          report.hub_id === hub.id &&
                          (
                            cycle === 'TOTAL' ||
                            report.cycle === cycle
                          )
                      )}
                    />

                  ))}

                </div>

                <div className="space-y-4">

                  <RegionalConsolidado
                    reports={lmReports}
                    regional={decodedRegional}
                    label="Consolidado LM"
                    tipo="LM"
                  />

                  <HubRanking
                    reports={lmReports}
                  />

                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              FM
          ================================================== */}

          {fmHubs.length > 0 && (

            <div>

              <div className="flex items-center gap-2 mb-4">

                <span className="bg-amber-100 text-amber-700 text-xs font-inter font-bold px-2.5 py-1 rounded-full">
                  FM — First Mile
                </span>

                <span className="text-xs text-muted-foreground font-inter">
                  {fmHubs.length} hub(s)
                </span>

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

                      onDelete={id =>
                        deleteMutation.mutate(id)
                      }

                      onUpdate={(id, data) =>
                        updateMutation.mutate({
                          id,
                          data,
                        })
                      }

                      allReportsForHub={reports.filter(
                        report =>
                          report.hub_id === hub.id &&
                          (
                            cycle === 'TOTAL' ||
                            report.cycle === cycle
                          )
                      )}
                    />

                  ))}

                </div>

                <div className="space-y-4">

                  <RegionalConsolidado
                    reports={fmReports}
                    regional={decodedRegional}
                    label="Consolidado FM"
                    tipo="FM"
                  />

                  <HubRanking
                    reports={fmReports}
                  />

                </div>

              </div>

            </div>

          )}

        </div>

      )}

    </div>
  );
}