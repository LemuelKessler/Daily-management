import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function statusColor(value, target, higherIsBetter = true) {
  if (value == null || target == null) return 'text-slate-400';
  const ok = higherIsBetter ? value >= target : value <= target;
  return ok ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
}

function cellBg(value, target, higherIsBetter = true) {
  if (value == null || target == null) return '';
  const ok = higherIsBetter ? value >= target : value <= target;
  return ok ? 'bg-green-50' : 'bg-red-50';
}

function Actual({ value, target, higherIsBetter = true, fmt }) {
  const display = value != null ? fmt(value) : '-';
  const color = statusColor(value, target, higherIsBetter);
  const bg = value != null && target != null ? cellBg(value, target, higherIsBetter) : '';
  return (
    <td className={`px-1.5 py-1 text-center text-[11px] font-inter ${color} ${bg}`}>{display}</td>
  );
}

function Target({ value, fmt }) {
  return (
    <td className="px-1.5 py-1 text-center text-[11px] font-inter text-slate-500 bg-slate-50">
      {value != null ? fmt(value) : '-'}
    </td>
  );
}

const fmtPct = v => `${Number(v).toFixed(1)}%`;
const fmtPct2 = v => `${Number(v).toFixed(2)}%`;
const fmtNum = v => Math.round(v).toLocaleString('pt-BR');

// Colunas sem % Leftover Over Cap, % Leaked Volume, % DS D0, SPR
const COL_GROUPS = [
  { label: 'PHD', key: 'phd', higherIsBetter: true, fmt: fmtNum },
  { label: '% Leftover Hub', key: 'leftoverHub', higherIsBetter: false, fmt: fmtPct },
  { label: '% Missorting', key: 'missorting', higherIsBetter: false, fmt: fmtPct2 },
  { label: 'BWT', key: 'bwt', higherIsBetter: true, fmt: fmtPct },
  { label: '% Ops Clock', key: 'opsClockPct', higherIsBetter: true, fmt: fmtPct },
  { label: '% ATS no Piso', key: 'atsNoPiso', higherIsBetter: false, fmt: fmtPct },
  { label: '% Daily Workers', key: 'dailyWorkers', higherIsBetter: false, fmt: fmtPct },
  { label: '% Abs', key: 'absPct', higherIsBetter: false, fmt: fmtPct },
];

const GROUP_COLORS = [
  'bg-indigo-900', 'bg-red-900', 'bg-orange-900',
  'bg-purple-900', 'bg-teal-900', 'bg-cyan-900',
  'bg-emerald-900', 'bg-amber-900',
];

function isOutOfTarget(indicators, hubTargets) {
  if (!indicators) return false;
  // Um HUB é "fora da meta" se qualquer indicador com target estiver em vermelho
  return COL_GROUPS.some(({ key, higherIsBetter }) => {
    const val = indicators[key];
    const tgt = hubTargets[key];
    if (val == null || tgt == null) return false;
    return higherIsBetter ? val < tgt : val > tgt;
  });
}

function TableHeader() {
  return (
    <thead>
      <tr>
        <th className="sticky left-0 z-20 bg-slate-900 text-white text-[10px] font-inter font-bold px-2 py-1.5 text-left whitespace-nowrap border-r border-slate-700" rowSpan={2}>Station Code</th>
        <th className="bg-slate-900 text-white text-[10px] font-inter font-bold px-2 py-1.5 text-center whitespace-nowrap" rowSpan={2}>Volume Inbound</th>
        {COL_GROUPS.map((g, gi) => (
          <th key={g.label} colSpan={2} className={`${GROUP_COLORS[gi]} text-white text-[10px] font-inter font-bold px-1.5 py-1.5 text-center whitespace-nowrap border-l border-white/10`}>
            {g.label}
          </th>
        ))}
      </tr>
      <tr>
        {COL_GROUPS.map((g, gi) => (
          <React.Fragment key={g.key + '_sub'}>
            <th className={`${GROUP_COLORS[gi]} text-white/80 text-[9px] font-inter px-1.5 py-1 text-center border-l border-white/10`}>Actual</th>
            <th className={`${GROUP_COLORS[gi]} text-white/60 text-[9px] font-inter px-1.5 py-1 text-center`}>Target</th>
          </React.Fragment>
        ))}
      </tr>
    </thead>
  );
}

export default function DailyTable({ rows }) {
  const [showOk, setShowOk] = useState(false);

  const totalVol = rows.reduce((s, r) => s + (r.report?.volume_recebido || 0), 0);

  const offenders = rows.filter(r => isOutOfTarget(r.indicators, r.hubTargets));
  const okRows = rows.filter(r => !isOutOfTarget(r.indicators, r.hubTargets));

  const renderRow = (row, i) => {
    const { hub, report, indicators: ind, hubTargets: t } = row;
    const vol = report?.volume_recebido;
    const share = totalVol > 0 && vol != null ? (vol / totalVol) * 100 : null;

    return (
      <tr key={hub.id} className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${i % 2 === 0 ? '' : 'bg-white/50'}`}>
        <td className="px-2 py-1.5 text-[11px] font-inter font-bold text-slate-700 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-slate-200">
          <div className="flex items-center gap-1.5">
            <span>{hub.name}</span>
            {!report && <span className="text-[9px] text-slate-400">(sem dados)</span>}
          </div>
        </td>
        <td className="px-2 py-1.5 text-[11px] font-inter text-center font-semibold text-slate-700">{vol != null ? fmtNum(vol) : '-'}</td>

        {COL_GROUPS.map(g => (
          <React.Fragment key={g.key}>
            <Actual value={ind?.[g.key]} target={t[g.key]} higherIsBetter={g.higherIsBetter} fmt={g.fmt} />
            <Target value={t[g.key]} fmt={g.fmt} />
          </React.Fragment>
        ))}
      </tr>
    );
  };

  const minWidth = 'min-w-[900px]';

  return (
    <div className="space-y-4">
      {/* HUBs fora da meta */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-red-900 px-4 py-2 flex items-center gap-2">
          <span className="text-white font-inter font-bold text-sm">🔴 HUBs Fora da Meta</span>
          <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{offenders.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${minWidth} border-collapse text-xs`}>
            <TableHeader />
            <tbody>
              {offenders.length === 0 ? (
                <tr><td colSpan={20} className="text-center py-8 text-slate-400 font-inter text-sm">✅ Nenhum HUB fora da meta!</td></tr>
              ) : (
                offenders.map((row, i) => renderRow(row, i))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HUBs dentro da meta */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowOk(!showOk)}
          className="w-full bg-green-800 px-4 py-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-white font-inter font-bold text-sm">✅ HUBs Dentro da Meta</span>
            <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{okRows.length}</span>
          </div>
          {showOk ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
        </button>
        {showOk && (
          <div className="overflow-x-auto">
            <table className={`w-full ${minWidth} border-collapse text-xs`}>
              <TableHeader />
              <tbody>
                {okRows.length === 0 ? (
                  <tr><td colSpan={20} className="text-center py-8 text-slate-400 font-inter text-sm">Sem HUBs nesta categoria</td></tr>
                ) : (
                  okRows.map((row, i) => renderRow(row, i))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}