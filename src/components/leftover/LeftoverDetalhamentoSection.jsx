import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import {
  LEFTOVER_REASONS,
  detalhamentoTotal,
  detalhamentoTotalInbound,
  detalhamentoTotalOutbound,
  emptyLeftoverDetalhamento,
} from '@/lib/leftoverReasons';

const fmt = (n) => (Number(n) || 0).toLocaleString('pt-BR');

export default function LeftoverDetalhamentoSection({
  detalhamento,
  leftoverTotal,
  disabled,
  onChange,
}) {
  const det = detalhamento || emptyLeftoverDetalhamento();
  const sumMotives = detalhamentoTotal(det);
  const totalInbound = detalhamentoTotalInbound(det);
  const totalOutbound = detalhamentoTotalOutbound(det);
  const total = Number(leftoverTotal) || 0;
  const match = sumMotives === total;
  const diff = Math.abs(sumMotives - total);

  const handleReason = (key, value) => {
    const clean = String(value).replace(/[^0-9]/g, '');
    onChange(key, clean === '' ? 0 : parseInt(clean, 10));
  };

  return (
    <div className={`rounded-xl border-2 border-primary/30 bg-primary/5 p-4 transition-opacity ${
      disabled ? 'opacity-40 pointer-events-none' : ''
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-primary rounded-lg p-1.5">
          <AlertTriangle className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-inter font-bold text-primary">Detalhamento do Leftover</p>
          <p className="text-[11px] text-muted-foreground font-inter">
            Informe a quantidade de pacotes por motivo. A categoria (Inbound/Outbound) é definida automaticamente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LEFTOVER_REASONS.map((reason) => (
          <div key={reason.key} className={`rounded-lg border px-3 py-2 ${
            reason.category === 'inbound'
              ? 'border-blue-200 bg-blue-50/40'
              : 'border-orange-200 bg-orange-50/40'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-inter">{reason.label}</Label>
              <span className={`text-[9px] font-inter font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                reason.category === 'inbound'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {reason.category === 'inbound' ? 'Inbound' : 'Outbound'}
              </span>
            </div>
            <Input
              inputMode="numeric"
              min="0"
              value={det[reason.key] ?? 0}
              onChange={(e) => handleReason(reason.key, e.target.value)}
              placeholder="0"
              disabled={disabled}
              className="font-inter mt-1"
            />
          </div>
        ))}
      </div>

      {/* Resumo Inbound / Outbound (tempo real) */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-0.5">
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <p className="text-[10px] uppercase tracking-wider font-inter font-bold">Leftover Inbound</p>
          </div>
          <p className="text-2xl font-inter font-extrabold text-blue-700">{fmt(totalInbound)}</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-orange-600 mb-0.5">
            <ArrowUpFromLine className="w-3.5 h-3.5" />
            <p className="text-[10px] uppercase tracking-wider font-inter font-bold">Leftover Outbound</p>
          </div>
          <p className="text-2xl font-inter font-extrabold text-orange-700">{fmt(totalOutbound)}</p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-primary mb-0.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <p className="text-[10px] uppercase tracking-wider font-inter font-bold">Leftover Total</p>
          </div>
          <p className="text-2xl font-inter font-extrabold text-primary">{fmt(totalInbound + totalOutbound)}</p>
        </div>
      </div>

      {/* Validação automática */}
      <div className={`mt-3 flex items-center gap-3 rounded-lg p-3 ${
        match
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}>
        {match ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
        ) : (
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
        )}
        <div className="flex-1 text-sm font-inter">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Total dos Motivos: <strong>{fmt(sumMotives)}</strong>
            </span>
            <span className="text-muted-foreground">|</span>
            <span>
              Leftover Total: <strong>{fmt(total)}</strong>
            </span>
          </div>
          {match ? (
            <p className="text-xs mt-0.5 font-semibold text-green-700">
              ✓ Os valores conferem.
            </p>
          ) : (
            <p className="text-xs mt-0.5 font-semibold text-red-700">
              ⚠ A soma dos motivos é diferente do Leftover Total (diferença de {fmt(diff)}).
            </p>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground font-inter mt-2 text-right">
        A divergência não impede o salvamento — apenas alerta o usuário.
      </p>
    </div>
  );
}