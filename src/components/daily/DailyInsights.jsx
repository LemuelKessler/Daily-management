import React from 'react';
import { Zap } from 'lucide-react';

export default function DailyInsights({ rows }) {
  const withData = rows.filter(r => r.indicators && r.report);

  const insights = [];

  const n = (count, singular, plural) => count === 1 ? singular : plural;

  // HUBs abaixo da meta de PHD
  const phdAbaixo = withData.filter(r => r.indicators.phd != null && r.indicators.phd < (r.hubTargets.phd || 500));
  if (phdAbaixo.length > 0) {
    const worst = [...phdAbaixo].sort((a, b) => a.indicators.phd - b.indicators.phd)[0];
    insights.push({
      text: `${phdAbaixo.length} ${n(phdAbaixo.length, 'HUB finalizou', 'HUBs finalizaram')} abaixo da meta de PHD`,
      sub: `Pior: ${worst.hub.name} (${Math.round(worst.indicators.phd)})`,
      level: 'danger',
    });
  }

  // HUBs com Ops Clock abaixo da meta
  const opsAbaixo = withData.filter(r => r.indicators.opsClockPct != null && r.indicators.opsClockPct < (r.hubTargets.opsClockPct || 95));
  if (opsAbaixo.length > 0) {
    insights.push({
      text: `${opsAbaixo.length} ${n(opsAbaixo.length, 'operação finalizou', 'operações finalizaram')} abaixo da meta de Ops Clock`,
      sub: opsAbaixo.map(r => r.hub.name).join(', '),
      level: 'warning',
    });
  }

  // Maior ofensora por Leftover
  const comLeftover = withData.filter(r => (r.report?.leftover || 0) > 0).sort((a, b) => (b.report?.leftover || 0) - (a.report?.leftover || 0));
  if (comLeftover.length > 0) {
    insights.push({
      text: `Maior Leftover: ${comLeftover[0].hub.name} (${(comLeftover[0].report.leftover || 0).toLocaleString('pt-BR')})`,
      sub: comLeftover.length > 1 ? `+${comLeftover.length - 1} ${n(comLeftover.length - 1, 'HUB', 'HUBs')} com leftover` : '',
      level: 'danger',
    });
  }

  // Maior absenteísmo
  const absValues = withData.filter(r => r.indicators.absPct != null).sort((a, b) => b.indicators.absPct - a.indicators.absPct);
  if (absValues.length > 0 && absValues[0].indicators.absPct > (absValues[0].hubTargets.absPct || 5)) {
    insights.push({
      text: `Maior Absenteísmo: ${absValues[0].hub.name} (${absValues[0].indicators.absPct.toFixed(1)}%)`,
      sub: '',
      level: 'warning',
    });
  }

  // Missorting
  const missortingRed = withData.filter(r => r.indicators.missorting != null && r.indicators.missorting > (r.hubTargets.missorting || 1));
  if (missortingRed.length > 0) {
    const worst = [...missortingRed].sort((a, b) => b.indicators.missorting - a.indicators.missorting)[0];
    insights.push({
      text: `Maior desvio em Missorting: ${worst.hub.name} (${worst.indicators.missorting.toFixed(2)}%)`,
      sub: `${missortingRed.length} ${n(missortingRed.length, 'HUB', 'HUBs')} acima da meta`,
      level: 'warning',
    });
  }

  if (insights.length === 0) {
    insights.push({ text: 'Todos os indicadores dentro da meta até o momento', sub: 'Sem ofensores identificados', level: 'ok' });
  }

  const colorMap = {
    danger: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    ok: 'bg-green-50 border-green-200 text-green-800',
  };
  const dotMap = {
    danger: 'bg-red-500',
    warning: 'bg-amber-500',
    ok: 'bg-green-500',
  };

  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-white font-inter font-bold text-sm">Insights Automáticos</span>
        <span className="bg-primary/20 text-primary text-[10px] font-inter font-bold px-2 py-0.5 rounded-full">{insights.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-2 border rounded-lg px-3 py-2 text-xs font-inter ${colorMap[ins.level]}`}>
            <div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${dotMap[ins.level]}`} />
            <div>
              <p className="font-semibold leading-snug">{ins.text}</p>
              {ins.sub && <p className="opacity-70 mt-0.5 leading-snug">{ins.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}