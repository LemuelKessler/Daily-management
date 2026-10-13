
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  ListOrdered,
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
} from 'lucide-react';
import { LEFTOVER_REASONS_COUNT } from '@/lib/leftoverReasons';

const fmt = (n) => (Number(n) || 0).toLocaleString('pt-BR');

const fmtPct = (n) =>
  `${(Number(n) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

const INBOUND_COLOR = '#3b82f6';
const OUTBOUND_COLOR = '#ee4d2d';

const CATEGORY_LABEL = {
  inbound: 'Inbound',
  outbound: 'Outbound',
};

function EmptyState({ message }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground font-inter">
      {message}
    </div>
  );
}

export default function LeftoverAnalysisCharts({
  leftoverTotal = 0,
  leftoverInbound = 0,
  leftoverOutbound = 0,
  motivosCadastrados = 0,
  ranking = [],
  hubCount = 0,
  hubRanking = [],
}) {
  const activeRanking = [...(ranking || [])]
    .filter((r) => Number(r.value) > 0)
    .sort((a, b) => Number(b.value) - Number(a.value));

  const activeHubRanking = [...(hubRanking || [])]
    .sort(
      (a, b) =>
        Number(b.leftover_percentual) - Number(a.leftover_percentual)
    );

  const pct = (value) =>
    leftoverTotal > 0 ? (Number(value) / leftoverTotal) * 100 : 0;

  const maxHubPct = Math.max(
    ...activeHubRanking.map((h) => Number(h.leftover_percentual) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Package className="w-4 h-4" />
              <p className="text-[10px] uppercase tracking-wider font-inter font-medium">
                Leftover Total
              </p>
            </div>
            <p className="text-3xl font-inter font-extrabold text-primary">
              {fmt(leftoverTotal)}
            </p>
            <p className="text-[11px] text-muted-foreground font-inter mt-1">
              {hubCount} HUB(s) no período
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
              <ArrowDownToLine className="w-4 h-4" />
              <p className="text-[10px] uppercase tracking-wider font-inter font-medium">
                Leftover Inbound
              </p>
            </div>
            <p className="text-3xl font-inter font-extrabold text-blue-700">
              {fmt(leftoverInbound)}
            </p>
            <p className="text-[11px] text-muted-foreground font-inter mt-1">
              {fmtPct(pct(leftoverInbound))} do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/40">
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
              <ArrowUpFromLine className="w-4 h-4" />
              <p className="text-[10px] uppercase tracking-wider font-inter font-medium">
                Leftover Outbound
              </p>
            </div>
            <p className="text-3xl font-inter font-extrabold text-orange-700">
              {fmt(leftoverOutbound)}
            </p>
            <p className="text-[11px] text-muted-foreground font-inter mt-1">
              {fmtPct(pct(leftoverOutbound))} do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de HUBs */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-inter font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Ranking de HUBs por Leftover %
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Do maior para o menor percentual · Leftover / volume recebido
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {activeHubRanking.length > 0 ? (
            <div className="divide-y divide-border/60">
              {activeHubRanking.map((hub, index) => {
                const percentual = Number(hub.leftover_percentual) || 0;
                const barWidth =
                  maxHubPct > 0 ? (percentual / maxHubPct) * 100 : 0;

                return (
                  <div
                    key={hub.hub_id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-inter font-bold bg-muted text-foreground flex-shrink-0">
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-inter font-semibold text-foreground truncate">
                        {hub.hub_name}
                      </p>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[100px]">
                      <p className="text-sm font-inter font-bold text-primary">
                        {fmtPct(percentual)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-inter">
                        {fmt(hub.leftover)} pacotes
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Nenhum dado de HUB para o período selecionado." />
          )}
        </CardContent>
      </Card>

      {/* Ranking de motivos */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-inter font-bold flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-primary" />
            Ranking de Motivos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Do maior para o menor volume, com classificação Inbound/Outbound
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {activeRanking.length > 0 ? (
            <div className="divide-y divide-border/60 max-h-[600px] overflow-y-auto">
              {activeRanking.map((reason, index) => {
                const isInbound = reason.category === 'inbound';
                const color = isInbound ? INBOUND_COLOR : OUTBOUND_COLOR;
                const percentual = pct(reason.value);

                return (
                  <div
                    key={reason.key}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-inter font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-inter font-medium text-foreground">
                          {reason.label}
                        </p>
                        <span
                          className={`text-[9px] font-inter font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isInbound
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {CATEGORY_LABEL[reason.category] || reason.category}
                        </span>
                      </div>

                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(percentual, reason.value > 0 ? 1 : 0)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[90px]">
                      <p className="text-sm font-inter font-bold text-foreground">
                        {fmt(reason.value)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-inter">
                        {fmtPct(percentual)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Nenhum motivo cadastrado no período." />
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground font-inter text-center">
        {LEFTOVER_REASONS_COUNT} motivos disponíveis · {motivosCadastrados} com
        registros no período · Classificação Inbound/Outbound por motivo.
      </p>
    </div>
  );
}
