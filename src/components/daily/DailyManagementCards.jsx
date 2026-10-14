import React from 'react';
import {
  detalhamentoTotal,
  detalhamentoTotalInbound,
  detalhamentoTotalOutbound,
} from '@/lib/leftoverReasons';
import { UserX, Package, Activity, Clock, AlertTriangle, Users } from 'lucide-react';

export default function DailyManagementCards({ rows }) {
  // HUBs LM: tipo === 'LM' OU tipo não preenchido (padrão LM)
  const isLM = r => !r.hub?.tipo || r.hub?.tipo === 'LM';

  // Todos os HUBs LM (com ou sem report)
  const lmRows = rows.filter(isLM);

  // HUBs LM com indicadores calculados (têm report)
  const withData = lmRows.filter(r => r.indicators != null);

  // ============================================================
  // VOLUME / FORECAST
  // ============================================================

  // Volume total efetivamente recebido
  const totalVolume = withData.reduce(
    (s, r) => s + (Number(r.report?.volume_recebido) || 0),
    0
  );

  // Forecast total previsto
  const totalForecast = withData.reduce(
    (s, r) => s + (Number(r.report?.forecast) || 0),
    0
  );

  // Desvio absoluto: recebido - forecast
  const volumeDeviation = totalVolume - totalForecast;

  // Desvio percentual
  const volumeDeviationPct =
    totalForecast > 0
      ? (volumeDeviation / totalForecast) * 100
      : null;

  // ============================================================
  // DEMAIS INDICADORES
  // ============================================================

  const phdValues = withData
    .map(r => r.indicators?.phd)
    .filter(v => v != null && v > 0);

  const phdMed = phdValues.length
    ? phdValues.reduce((a, b) => a + b, 0) / phdValues.length
    : null;

  const opsValues = withData
    .map(r => r.indicators?.opsClockPct)
    .filter(v => v != null);

  const opsMed = opsValues.length
    ? opsValues.reduce((a, b) => a + b, 0) / opsValues.length
    : null;
    const totalRotasForaOpsClock = withData.reduce(
      (total, r) =>
        total + (Number(r.report?.rotas_fora_ops_clock) || 0),
      0
    );
  const absValues = withData
    .map(r => r.indicators?.absPct)
    .filter(v => v != null);

    const absMed = absValues.length
    ? absValues.reduce((a, b) => a + b, 0) / absValues.length
    : null;

  const totalAbs = withData.reduce(
    (s, r) => s + (Number(r.report?.absenteismo) || 0),
    0
  );
  const totalLeftover = withData.reduce(
    (s, r) =>
      s + detalhamentoTotal(r.report?.leftover_detalhamento),
    0
  );
  const totalLeftoverInbound = withData.reduce(
    (s, r) =>
      s + detalhamentoTotalInbound(r.report?.leftover_detalhamento),
    0
  );
  
  const totalLeftoverOutbound = withData.reduce(
    (s, r) =>
      s + detalhamentoTotalOutbound(r.report?.leftover_detalhamento),
    0
  );
  
  const leftoverPct =
    totalVolume > 0
      ? (totalLeftover / totalVolume) * 100
      : 0;

  // ============================================================
  // HUBs FORA DA META
  // ============================================================

  const hubsForaMeta = withData.filter(r => {
    const { indicators: ind, hubTargets: t } = r;

    if (!ind) return false;

    return (
      (ind.phd != null && ind.phd < (t.phd || 500)) ||
      (ind.opsClockPct != null && ind.opsClockPct < (t.opsClockPct || 95)) ||
      (ind.leftoverHub != null && ind.leftoverHub > (t.leftoverHub || 2)) ||
      (ind.absPct != null && ind.absPct > (t.absPct || 5))
    );
  }).length;

  // ============================================================
  // FORMATAÇÃO
  // ============================================================

  const formatNumber = value =>
    Number(value || 0).toLocaleString('pt-BR');

  const formatDeviation = value => {
    const number = Number(value || 0);

    if (number > 0) {
      return `+${number.toLocaleString('pt-BR')}`;
    }

    return number.toLocaleString('pt-BR');
  };

  const formatPercentage = value => {
    if (value == null || !Number.isFinite(value)) {
      return '-';
    }

    const number = Number(value);

    if (number > 0) {
      return `+${number.toFixed(1).replace('.', ',')}%`;
    }

    return `${number.toFixed(1).replace('.', ',')}%`;
  };

  // ============================================================
  // CARDS
  // ============================================================

  const cards = [
    {
      label: 'Volume Total',
      value: formatNumber(totalVolume),
      icon: Package,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-100',
      details: true,
      type: 'volume',
    },
    {
      label: 'PHD Médio',
      value:
        phdMed != null
          ? Math.round(phdMed).toLocaleString('pt-BR')
          : '-',
      icon: Activity,
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      iconBg: 'bg-violet-100',
    },
    
{
  label: 'Ops Clock Médio',
  value:
    opsMed != null
      ? `${opsMed.toFixed(1).replace('.', ',')}%`
      : '-',
  icon: Clock,
  color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  iconBg: 'bg-emerald-100',
  details: true,
  type: 'opsClock',
},

        {
          label: 'Absenteísmo Médio',
  value:
    absMed != null
      ? `${absMed.toFixed(1).replace('.', ',')}%`
      : '-',
  icon: UserX,
  color: 'bg-amber-50 text-amber-700 border-amber-200',
  iconBg: 'bg-amber-100',
  details: true,
  type: 'abs',
},
    {
      label: 'Total Leftover',
      value: totalLeftover.toLocaleString('pt-BR'),
      icon: AlertTriangle,
      type: 'leftover',
      color:
        totalLeftover > 0
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-gray-50 text-gray-600 border-gray-200',
      iconBg:
        totalLeftover > 0
          ? 'bg-red-100'
          : 'bg-gray-100',
    },
    
{
  label: 'Daily Workers',
  value:
    withData.reduce(
      (total, r) => total + (Number(r.report?.diaristas) || 0),
      0
    ) >= 0 && withData.reduce(
      (total, r) => total + (Number(r.report?.hc) || 0),
      0
    ) > 0
      ? `${(
          withData.reduce(
            (total, r) => total + (Number(r.report?.diaristas) || 0),
            0
          ) /
          withData.reduce(
            (total, r) => total + (Number(r.report?.hc) || 0),
            0
          )
        * 100).toFixed(1).replace('.', ',')}%`
      : '-',
  icon: Users,
  color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  iconBg: 'bg-emerald-100',
  details: true,
  type: 'dailyWorkers',
},

  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;

        return (
          <div
            key={i}
            className={`border rounded-xl p-3 flex flex-col gap-2 ${c.color}`}
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

            {/* Detalhamento específico do Volume */}
{c.type === 'volume' && (
              <div className="mt-1 pt-2 border-t border-blue-200/70 space-y-1">
                <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                  <span className="opacity-70">
                    Forecast
                  </span>

                  <span className="font-bold">
                    {formatNumber(totalForecast)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                  <span className="opacity-70">
                    Desvio
                  </span>

                  <span className="font-bold">
                    {formatDeviation(volumeDeviation)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                  <span className="opacity-70">
                    Desvio %
                  </span>

                  <span className="font-bold">
                    {formatPercentage(volumeDeviationPct)}
                  </span>
                </div>
              </div>
            )}
            
{/* Detalhamento específico do Ops Clock */}
{c.type === 'opsClock' && (
  <div className="mt-1 pt-2 border-t border-emerald-200/70">
    <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
      <span className="opacity-70">
        Rotas fora do Ops Clock
      </span>

      <span className="font-bold">
        {formatNumber(totalRotasForaOpsClock)}
      </span>
    </div>
  </div>
)}

                        {/* Detalhamento específico do Absenteísmo */}
                        {c.type === 'abs' && (
              <div className="mt-1 pt-2 border-t border-amber-200/70">
                <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
                  <span className="opacity-70">
                    ABS Total
                  </span>

                  <span className="font-bold">
                    {formatNumber(totalAbs)}
                  </span>
                </div>
              </div>
            )}
            
{/* Detalhamento específico do Daily Workers */}
{c.type === 'dailyWorkers' && (
  <div className="mt-1 pt-2 border-t border-emerald-200/70">
    <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
      <span className="opacity-70">
        Total de diaristas
      </span>
      <span className="font-bold">
        {formatNumber(
          withData.reduce(
            (total, r) => total + (Number(r.report?.diaristas) || 0),
            0
          )
        )}
      </span>
    </div>
  </div>
)}

{/* Detalhamento específico do Leftover */}
{c.type === 'leftover' && (
  <div className="mt-1 pt-2 border-t border-red-200/70 space-y-1">
    <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
      <span className="opacity-70">
        Leftover %
      </span>

      <span className="font-bold">
        {leftoverPct.toFixed(1).replace('.', ',')}%
      </span>
    </div>

    <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
      <span className="opacity-70">
        Inbound
      </span>

      <span className="font-bold">
        {formatNumber(totalLeftoverInbound)}
      </span>
    </div>

    <div className="flex items-center justify-between gap-2 text-[10px] font-inter">
      <span className="opacity-70">
        Outbound
      </span>

      <span className="font-bold">
        {formatNumber(totalLeftoverOutbound)}
      </span>
    </div>
  </div>
)}

          </div>
        );
      })}
    </div>
  );
}