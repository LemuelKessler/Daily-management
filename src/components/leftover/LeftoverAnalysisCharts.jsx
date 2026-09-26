import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Package, ListOrdered, BarChart3, PieChart as PieIcon,
  ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react';
import { LEFTOVER_REASONS_COUNT } from '@/lib/leftoverReasons';

const fmt = (n) => (Number(n) || 0).toLocaleString('pt-BR');

const COLORS = [
  '#ee4d2d', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6',
  '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#f97316',
  '#06b6d4', '#84cc16', '#a855f7', '#ef4444', '#0ea5e9', '#64748b', '#22c55e',
];

const INBOUND_COLOR = '#3b82f6';
const OUTBOUND_COLOR = '#ee4d2d';

const CATEGORY_LABEL = { inbound: 'Inbound', outbound: 'Outbound' };

function EmptyChart() {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground font-inter">
      Sem dados para exibir.
    </div>
  );
}

export default function LeftoverAnalysisCharts({
  leftoverTotal,
  leftoverInbound,
  leftoverOutbound,
  detalhamento,
  motivosCadastrados,
  ranking,
  hubCount,
}) {
  if (!leftoverTotal && !motivosCadastrados) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-16 text-center">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-inter text-sm text-muted-foreground">
            Nenhum dado de leftover para os filtros selecionados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeRanking = ranking.filter((r) => r.value > 0);
  const barData = activeRanking.map((r) => ({ name: r.label, value: r.value, category: r.category }));

  const pct = (value) =>
    leftoverTotal > 0 ? ((value / leftoverTotal) * 100).toFixed(1) : '0.0';

  // Dados para gráficos Inbound vs Outbound
  const compareData = [
    { name: 'Inbound', value: leftoverInbound, fill: INBOUND_COLOR },
    { name: 'Outbound', value: leftoverOutbound, fill: OUTBOUND_COLOR },
  ];
  const pieCompareData = compareData.filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Package className="w-4 h-4" />
              <p className="text-[10px] uppercase tracking-wider font-inter font-medium">Leftover Total</p>
            </div>
            <p className="text-3xl font-inter font-extrabold text-primary">{fmt(leftoverTotal)}</p>
            <p className="text-[11px] text-muted-foreground font-inter mt-1">{hubCount} hub(s) no período</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
              <ArrowDownToLine className="w-4 h-4" />
              <p className="text-[10px] uppercase tracking-wider font-inter font-medium">Leftover Inbound</p>
            </div>
            <p className="text-3xl font-inter font-extrabold text-blue-700">{fmt(leftoverInbound)}</p>
            <p className="text-[11px] text-muted-foreground font-inter mt-1">{pct(leftoverInbound)}% do total</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/40">
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
              <ArrowUpFromLine className="w-4 h-4" />
              <p className="text-[10px] uppercase tracking-wider font-inter font-medium">Leftover Outbound</p>
            </div>
            <p className="text-3xl font-inter font-extrabold text-orange-700">{fmt(leftoverOutbound)}</p>
            <p className="text-[11px] text-muted-foreground font-inter mt-1">{pct(leftoverOutbound)}% do total</p>
          </CardContent>
        </Card>
      </div>

      {/* Inbound vs Outbound — comparativo de barras + pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-inter font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Comparativo Inbound x Outbound
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leftoverInbound > 0 || leftoverOutbound > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={compareData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Inter' }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} tickFormatter={fmt} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
                  <Bar dataKey="value" name="Qtd." radius={[4, 4, 0, 0]}>
                    {compareData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-inter font-bold flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Participação Inbound x Outbound
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieCompareData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieCompareData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={(entry) => `${pct(entry.value)}%`}
                    labelLine={false}
                  >
                    {pieCompareData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras — todos os motivos individuais */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-inter font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Quantidade por Motivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Inter' }} tickFormatter={fmt} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={170}
                  tick={{ fontSize: 10, fontFamily: 'Inter' }}
                />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
                <Bar dataKey="value" name="Qtd." radius={[0, 4, 4, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.category === 'inbound' ? INBOUND_COLOR : OUTBOUND_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {/* Gráfico de pizza (por motivo) + Ranking com categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-inter font-bold flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Participação Percentual por Motivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={barData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${pct(entry.value)}%`}
                    labelLine={false}
                  >
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.category === 'inbound' ? INBOUND_COLOR : COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-inter font-bold flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-primary" />
              Ranking de Motivos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60 max-h-[300px] overflow-y-auto">
              {activeRanking.length > 0 ? (
                activeRanking.map((r, i) => {
                  const isInbound = r.category === 'inbound';
                  const color = isInbound ? INBOUND_COLOR : OUTBOUND_COLOR;
                  return (
                    <div key={r.key} className="flex items-center gap-3 px-4 py-2.5">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-inter font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-inter font-medium text-foreground truncate">{r.label}</p>
                          <span className={`text-[9px] font-inter font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isInbound ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {CATEGORY_LABEL[r.category]}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(pct(r.value), 2)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-inter font-bold text-foreground">{fmt(r.value)}</p>
                        <p className="text-[10px] text-muted-foreground font-inter">{pct(r.value)}%</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground font-inter">
                  Nenhum motivo cadastrado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground font-inter text-center">
        {LEFTOVER_REASONS_COUNT} motivos disponíveis · Classificação Inbound/Outbound automática por motivo.
      </p>
    </div>
  );
}