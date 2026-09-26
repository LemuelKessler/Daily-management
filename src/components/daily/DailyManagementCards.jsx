import React from 'react';
import { UserX, Package, Activity, Clock, AlertTriangle, Users } from 'lucide-react';

export default function DailyManagementCards({ rows }) {
  // HUBs LM: tipo === 'LM' OU tipo não preenchido (padrão LM)
  const isLM = r => !r.hub?.tipo || r.hub?.tipo === 'LM';

  // Todos os HUBs LM (com ou sem report)
  const lmRows = rows.filter(isLM);
  // HUBs LM com indicadores calculados (têm report)
  const withData = lmRows.filter(r => r.indicators != null);

  const totalVolume = withData.reduce((s, r) => s + (r.report?.volume_recebido || 0), 0);
  const phdValues = withData.map(r => r.indicators?.phd).filter(v => v != null && v > 0);
  const phdMed = phdValues.length ? phdValues.reduce((a, b) => a + b, 0) / phdValues.length : null;
  const opsValues = withData.map(r => r.indicators?.opsClockPct).filter(v => v != null);
  const opsMed = opsValues.length ? opsValues.reduce((a, b) => a + b, 0) / opsValues.length : null;
  const absValues = withData.map(r => r.indicators?.absPct).filter(v => v != null);
  const absMed = absValues.length ? absValues.reduce((a, b) => a + b, 0) / absValues.length : null;
  const totalLeftover = withData.reduce((s, r) => s + (r.report?.leftover || 0), 0);

  // HUBs LM fora da meta (apenas os com dados)
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

  const cards = [
    { label: 'Volume Total', value: totalVolume.toLocaleString('pt-BR'), icon: Package, color: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-100' },
    { label: 'PHD Médio', value: phdMed != null ? Math.round(phdMed).toLocaleString('pt-BR') : '-', icon: Activity, color: 'bg-violet-50 text-violet-700 border-violet-200', iconBg: 'bg-violet-100' },
    { label: 'Ops Clock Médio', value: opsMed != null ? `${opsMed.toFixed(1)}%` : '-', icon: Clock, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconBg: 'bg-emerald-100' },
    { label: 'Absenteísmo Médio', value: absMed != null ? `${absMed.toFixed(1)}%` : '-', icon: UserX, color: 'bg-amber-50 text-amber-700 border-amber-200', iconBg: 'bg-amber-100' },
    { label: 'Total Leftover', value: totalLeftover.toLocaleString('pt-BR'), icon: AlertTriangle, color: totalLeftover > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200', iconBg: totalLeftover > 0 ? 'bg-red-100' : 'bg-gray-100' },
    { label: 'HUBs Fora da Meta', value: `${hubsForaMeta}/${lmRows.length}`, icon: Users, color: hubsForaMeta > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200', iconBg: hubsForaMeta > 0 ? 'bg-red-100' : 'bg-green-100' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`border rounded-xl p-3 flex flex-col gap-2 ${c.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-inter font-semibold uppercase tracking-wider opacity-70">{c.label}</span>
              <div className={`${c.iconBg} rounded-lg p-1.5`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-inter font-extrabold leading-none">{c.value}</span>
          </div>
        );
      })}
    </div>
  );
}