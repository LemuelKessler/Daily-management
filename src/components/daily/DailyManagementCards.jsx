import React from 'react';
import {
  detalhamentoTotal,
  detalhamentoTotalInbound,
  detalhamentoTotalOutbound,
} from '@/lib/leftoverReasons';
import { UserX, Package, Activity, Clock, AlertTriangle, Users, UserPlus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function DailyManagementCards({ rows }) {
  // HUBs LM: tipo === 'LM' OU tipo não preenchido (padrão LM)
  const isLM = r => !r.hub?.tipo || r.hub?.tipo === 'LM';

  // Todos os HUBs LM (com ou sem report)
  const lmRows = rows.filter(isLM);

  // HUBs LM com indicadores calculados (têm report)
  const withData = lmRows.filter(r => r.indicators != null);

  // ============================================================
  // FORMATAÇÃO AUXILIAR
  // ============================================================
  const formatNumber = value => Number(value || 0).toLocaleString('pt-BR');

  const formatDeviation = value => {
    const number = Number(value || 0);
    if (number > 0) return `+${number.toLocaleString('pt-BR')}`;
    return number.toLocaleString('pt-BR');
  };

  const formatPercentage = value => {
    if (value == null || !Number.isFinite(value)) return '-';
    const number = Number(value);
    if (number > 0) return `+${number.toFixed(1).replace('.', ',')}%`;
    return `${number.toFixed(1).replace('.', ',')}%`;
  };

  // ============================================================
  // LOGICA DE HC (BASELINE E MOVIMENTAÇÃO)
  // ============================================================
  
  // Base Inicial orçada / cadastrada nos HubTargets
  const hcInicialTotal = withData.reduce(
    (s, r) => s + (Number(r.hubTargets?.hc_inicial) || 0),
    0
  );

  const totalContratados = withData.reduce(
    (s, r) => s + (Number(r.report?.contratados) || 0),
    0
  );

  const totalDesligamentos = withData.reduce(
    (s, r) => s + (Number(r.report?.desligamentos) || 0),
    0
  );

  const totalFerias = withData.reduce(
    (s, r) => s + (Number(r.report?.ferias) || 0),
    0
  );

  // HC Atual Efetivo = (Base Inicial + Contratados - Desligamentos)
  const hcAtualEfetivo = hcInicialTotal + totalContratados - totalDesligamentos;

  // ============================================================
  // CÁLCULOS DEMAIS INDICADORES
  // ============================================================

  // 1. VOLUME / FORECAST
  const totalVolume = withData.reduce((s, r) => s + (Number(r.report?.volume_recebido) || 0), 0);
  const totalForecast = withData.reduce((s, r) => s + (Number(r.report?.forecast) || 0), 0);
  const volumeDeviation = totalVolume - totalForecast;
  const volumeDeviationPct = totalForecast > 0 ? (volumeDeviation / totalForecast) * 100 : null;

  const hubMaiorVolume = [...withData].sort(
    (a, b) => (Number(b.report?.volume_recebido) || 0) - (Number(a.report?.volume_recebido) || 0)
  )[0];

  const hubsComDesvio = withData.map(r => {
    const rec = Number(r.report?.volume_recebido) || 0;
    const fore = Number(r.report?.forecast) || 0;
    return { name: r.hub?.name || 'Hub', desvio: rec - fore };
  });

  const hubMaiorDesvioPositivo = [...hubsComDesvio].sort((a, b) => b.desvio - a.desvio)[0];
  const hubMaiorDesvioNegativo = [...hubsComDesvio].sort((a, b) => a.desvio - b.desvio)[0];

  // 2. PHD
  const phdValues = withData.map(r => r.indicators?.phd).filter(v => v != null && v > 0);
  const phdMed = phdValues.length ? phdValues.reduce((a, b) => a + b, 0) / phdValues.length : null;

  // 3. OPS CLOCK
  const opsValues = withData.map(r => r.indicators?.opsClockPct).filter(v => v != null);
  const opsMed = opsValues.length ? opsValues.reduce((a, b) => a + b, 0) / opsValues.length : null;
  const totalRotasForaOpsClock = withData.reduce((total, r) => total + (Number(r.report?.rotas_fora_ops_clock) || 0), 0);

  const hubMenorOpsClockPct = [...withData]
    .filter(r => r.indicators?.opsClockPct != null)
    .sort((a, b) => a.indicators.opsClockPct - b.indicators.opsClockPct)[0];

  const hubMaiorVeiculosForaOps = [...withData].sort(
    (a, b) => (Number(b.report?.rotas_fora_ops_clock) || 0) - (Number(a.report?.rotas_fora_ops_clock) || 0)
  )[0];

  // 4. ABSENTEÍSMO
  const absValues = withData.map(r => r.indicators?.absPct).filter(v => v != null);
  const absMed = absValues.length ? absValues.reduce((a, b) => a + b, 0) / absValues.length : null;
  const totalAbs = withData.reduce((s, r) => s + (Number(r.report?.absenteismo) || 0), 0);

  const hubMaiorAbsPct = [...withData]
    .filter(r => r.indicators?.absPct != null)
    .sort((a, b) => b.indicators.absPct - a.indicators.absPct)[0];

  const hubMaiorAbsAbsoluto = [...withData].sort(
    (a, b) => (Number(b.report?.absenteismo) || 0) - (Number(a.report?.absenteismo) || 0)
  )[0];

  // 5. MOVIMENTAÇÃO DE PESSOAL (TOP 3 DESLIGAMENTOS)
  const top3Desligamentos = [...withData]
    .filter(r => (Number(r.report?.desligamentos) || 0) > 0)
    .sort((a, b) => (Number(b.report?.desligamentos) || 0) - (Number(a.report?.desligamentos) || 0))
    .slice(0, 3);

  // 6. LEFTOVER
  const totalLeftover = withData.reduce((s, r) => s + detalhamentoTotal(r.report?.leftover_detalhamento), 0);
  const totalLeftoverInbound = withData.reduce((s, r) => s + detalhamentoTotalInbound(r.report?.leftover_detalhamento), 0);
  const totalLeftoverOutbound = withData.reduce((s, r) => s + detalhamentoTotalOutbound(r.report?.leftover_detalhamento), 0);
  const leftoverPct = totalVolume > 0 ? (totalLeftover / totalVolume) * 100 : 0;

  const top3LeftoverPct = [...withData]
    .filter(r => r.indicators?.leftoverHub != null && r.indicators.leftoverHub > 0)
    .sort((a, b) => b.indicators.leftoverHub - a.indicators.leftoverHub)
    .slice(0, 3);

  // 7. DAILY WORKERS
  const totalDiaristas = withData.reduce((total, r) => total + (Number(r.report?.diaristas) || 0), 0);
  const totalHCAll = withData.reduce((total, r) => total + (Number(r.report?.hc) || 0), 0);
  const dailyWorkersMed = totalHCAll > 0 ? (totalDiaristas / totalHCAll) * 100 : null;

  const hubMaiorDailyWorkersPct = [...withData]
    .filter(r => r.indicators?.dailyWorkers != null)
    .sort((a, b) => b.indicators.dailyWorkers - a.indicators.dailyWorkers)[0];

  const hubMaiorDailyWorkersAbsoluto = [...withData].sort(
    (a, b) => (Number(b.report?.diaristas) || 0) - (Number(a.report?.diaristas) || 0)
  )[0];

  // ============================================================
  // CARDS E SEUS POPOUPS
  // ============================================================
  const cards = [
    {
      label: 'Volume Total',
      value: formatNumber(totalVolume),
      icon: Package,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-100',
      type: 'volume',
      renderTooltip: () => (
        <div className="space-y-1.5 text-xs font-inter">
          <p className="font-bold border-b border-slate-700 pb-1 text-slate-300">Destaques do Volume</p>
          <div>
            <span className="text-slate-400">Maior Volume:</span>{' '}
            <strong className="text-white">
              {hubMaiorVolume ? `${hubMaiorVolume.hub.name} (${formatNumber(hubMaiorVolume.report?.volume_recebido)})` : '-'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Maior Desvio (+):</span>{' '}
            <strong className="text-emerald-400">
              {hubMaiorDesvioPositivo && hubMaiorDesvioPositivo.desvio > 0
                ? `${hubMaiorDesvioPositivo.name} (+${formatNumber(hubMaiorDesvioPositivo.desvio)})`
                : '-'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Maior Desvio (-):</span>{' '}
            <strong className="text-rose-400">
              {hubMaiorDesvioNegativo && hubMaiorDesvioNegativo.desvio < 0
                ? `${hubMaiorDesvioNegativo.name} (${formatNumber(hubMaiorDesvioNegativo.desvio)})`
                : '-'}
            </strong>
          </div>
        </div>
      ),
    },
    {
      label: 'PHD Médio',
      value: phdMed != null ? Math.round(phdMed).toLocaleString('pt-BR') : '-',
      icon: Activity,
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      iconBg: 'bg-violet-100',
      renderTooltip: () => (
        <div className="text-xs font-inter">
          <p className="font-bold text-slate-300 mb-1">Média PHD Outbound</p>
          <p className="text-slate-400">Desempenho produtivo médio por operador nos hubs.</p>
        </div>
      ),
    },
    {
      label: 'Ops Clock Médio',
      value: opsMed != null ? `${opsMed.toFixed(1).replace('.', ',')}%` : '-',
      icon: Clock,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-100',
      type: 'opsClock',
      renderTooltip: () => (
        <div className="space-y-1.5 text-xs font-inter">
          <p className="font-bold border-b border-slate-700 pb-1 text-slate-300">Ofensores de Janela</p>
          <div>
            <span className="text-slate-400">Menor % Ops Clock:</span>{' '}
            <strong className="text-amber-400">
              {hubMenorOpsClockPct ? `${hubMenorOpsClockPct.hub.name} (${hubMenorOpsClockPct.indicators.opsClockPct.toFixed(1)}%)` : '-'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Mais veículos fora:</span>{' '}
            <strong className="text-rose-400">
              {hubMaiorVeiculosForaOps
                ? `${hubMaiorVeiculosForaOps.hub.name} (${formatNumber(hubMaiorVeiculosForaOps.report?.rotas_fora_ops_clock)} rotas)`
                : '-'}
            </strong>
          </div>
        </div>
      ),
    },
    {
      label: 'Absenteísmo Médio',
      value: absMed != null ? `${absMed.toFixed(1).replace('.', ',')}%` : '-',
      icon: UserX,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-100',
      type: 'abs',
      renderTooltip: () => (
        <div className="space-y-1.5 text-xs font-inter">
          <p className="font-bold border-b border-slate-700 pb-1 text-slate-300">Ofensores de Absenteísmo</p>
          <div>
            <span className="text-slate-400">Maior % ABS:</span>{' '}
            <strong className="text-amber-400">
              {hubMaiorAbsPct ? `${hubMaiorAbsPct.hub.name} (${hubMaiorAbsPct.indicators.absPct.toFixed(1)}%)` : '-'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Maior ABS Absoluto:</span>{' '}
            <strong className="text-rose-400">
              {hubMaiorAbsAbsoluto ? `${hubMaiorAbsAbsoluto.hub.name} (${formatNumber(hubMaiorAbsAbsoluto.report?.absenteismo)} pessoas)` : '-'}
            </strong>
          </div>
        </div>
      ),
    },
    {
      label: 'Headcount Efetivo',
      value: formatNumber(hcAtualEfetivo),
      icon: UserPlus,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      iconBg: 'bg-sky-100',
      type: 'movimentacao',
      renderTooltip: () => (
        <div className="space-y-1.5 text-xs font-inter min-w-[210px]">
          <p className="font-bold border-b border-slate-700 pb-1 text-slate-300">Movimentação & Posição de Pessoal</p>
          <div>
            <span className="text-slate-400">HC Base Inicial:</span>{' '}
            <strong className="text-white">{formatNumber(hcInicialTotal)} pessoas</strong>
          </div>
          <div className="pt-1 border-t border-slate-800">
            <span className="text-slate-400 font-medium block mb-1">Top 3 Desligamentos:</span>
            {top3Desligamentos.length > 0 ? (
              top3Desligamentos.map((r, index) => (
                <div key={r.hub.id} className="flex justify-between items-center gap-3 text-rose-400 font-medium">
                  <span className="text-slate-300">{index + 1}. {r.hub.name}</span>
                  <strong>({formatNumber(r.report?.desligamentos)} deslig.)</strong>
                </div>
              ))
            ) : (
              <span className="text-slate-500 italic">Nenhum desligamento</span>
            )}
          </div>
        </div>
      ),
    },
    {
      label: 'Total Leftover',
      value: totalLeftover.toLocaleString('pt-BR'),
      icon: AlertTriangle,
      type: 'leftover',
      color: totalLeftover > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200',
      iconBg: totalLeftover > 0 ? 'bg-red-100' : 'bg-gray-100',
      renderTooltip: () => (
        <div className="space-y-1.5 text-xs font-inter">
          <p className="font-bold border-b border-slate-700 pb-1 text-slate-300">Top 3 Hubs com maior % Leftover</p>
          {top3LeftoverPct.length > 0 ? (
            top3LeftoverPct.map((r, index) => (
              <div key={r.hub.id} className="flex justify-between gap-4">
                <span className="text-slate-400">{index + 1}. {r.hub.name}</span>
                <strong className="text-red-400">{r.indicators.leftoverHub.toFixed(1)}%</strong>
              </div>
            ))
          ) : (
            <p className="text-slate-400">Nenhum leftover registrado.</p>
          )}
        </div>
      ),
    },
    {
      label: 'Daily Workers',
      value: dailyWorkersMed != null ? `${dailyWorkersMed.toFixed(1).replace('.', ',')}%` : '-',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-100',
      type: 'dailyWorkers',
      renderTooltip: () => (
        <div className="space-y-1.5 text-xs font-inter">
          <p className="font-bold border-b border-slate-700 pb-1 text-slate-300">Destaques de Diaristas</p>
          <div>
            <span className="text-slate-400">Maior % Daily Workers:</span>{' '}
            <strong className="text-emerald-400">
              {hubMaiorDailyWorkersPct ? `${hubMaiorDailyWorkersPct.hub.name} (${hubMaiorDailyWorkersPct.indicators.dailyWorkers.toFixed(1)}%)` : '-'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Maior nº Absoluto:</span>{' '}
            <strong className="text-white">
              {hubMaiorDailyWorkersAbsoluto ? `${hubMaiorDailyWorkersAbsoluto.hub.name} (${formatNumber(hubMaiorDailyWorkersAbsoluto.report?.diaristas)} diaristas)` : '-'}
            </strong>
          </div>
        </div>
      ),
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className={`border rounded-xl p-3 flex flex-col gap-2 ${c.color} transition-all hover:shadow-md cursor-help`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-inter font-semibold uppercase tracking-wider opacity-70">
                      {c.label}
                    </span>

                    <div className={`${c.iconBg} rounded-lg p-1.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <span className="text-2xl font-inter font-extrabold leading-none">
                    {c.value}
                  </span>

                  {/* Detalhamento do Volume */}
                  {c.type === 'volume' && (
                    <div className="mt-1 pt-2 border-t border-blue-200/70 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Forecast</span>
                        <span className="font-bold">{formatNumber(totalForecast)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Desvio</span>
                        <span className="font-bold">{formatDeviation(volumeDeviation)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Desvio %</span>
                        <span className="font-bold">{formatPercentage(volumeDeviationPct)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Detalhamento do Ops Clock */}
                  {c.type === 'opsClock' && (
                    <div className="mt-1 pt-2 border-t border-emerald-200/70">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Rotas fora do Ops Clock</span>
                        <span className="font-bold">{formatNumber(totalRotasForaOpsClock)}</span>
                      </div>
                    </div>
                  )}

                  {/* Detalhamento do Absenteísmo */}
                  {c.type === 'abs' && (
                    <div className="mt-1 pt-2 border-t border-amber-200/70">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">ABS Total</span>
                        <span className="font-bold">{formatNumber(totalAbs)}</span>
                      </div>
                    </div>
                  )}

                  {/* Detalhamento do Headcount Efetivo (BASE INICIAL + MOVIMENTAÇÃO) */}
                  {c.type === 'movimentacao' && (
                    <div className="mt-1 pt-2 border-t border-sky-200/70 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Base Inicial</span>
                        <span className="font-bold">{formatNumber(hcInicialTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Contratados</span>
                        <span className="font-bold text-emerald-700">+{formatNumber(totalContratados)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Desligamentos</span>
                        <span className="font-bold text-rose-700">-{formatNumber(totalDesligamentos)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Em Férias</span>
                        <span className="font-bold text-amber-700">{formatNumber(totalFerias)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Detalhamento do Daily Workers */}
                  {c.type === 'dailyWorkers' && (
                    <div className="mt-1 pt-2 border-t border-emerald-200/70">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Total de diaristas</span>
                        <span className="font-bold">{formatNumber(totalDiaristas)}</span>
                      </div>
                    </div>
                  )}

                  {/* Detalhamento do Leftover */}
                  {c.type === 'leftover' && (
                    <div className="mt-1 pt-2 border-t border-red-200/70 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Leftover %</span>
                        <span className="font-bold">{leftoverPct.toFixed(1).replace('.', ',')}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Inbound</span>
                        <span className="font-bold">{formatNumber(totalLeftoverInbound)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                        <span className="opacity-70">Outbound</span>
                        <span className="font-bold">{formatNumber(totalLeftoverOutbound)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 text-white p-3 font-inter shadow-2xl rounded-lg border border-slate-800">
                {c.renderTooltip()}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}