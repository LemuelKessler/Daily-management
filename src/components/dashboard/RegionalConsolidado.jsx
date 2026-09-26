import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, ExternalLink } from 'lucide-react';
import LastUpdateBadge from '@/components/ui/LastUpdateBadge';

export default function RegionalConsolidado({ reports, regional, label, hideLink, tipo }) {
  if (!reports || reports.length === 0) return null;

  const totalRecebido  = reports.reduce((s, r) => s + (r.volume_recebido  || 0), 0);
  const totalProcessado = reports.reduce((s, r) => s + (r.processado      || 0), 0);
  const totalExpedido   = reports.reduce((s, r) => s + (r.volume_expedido || 0), 0);
  const totalNoShow     = reports.reduce((s, r) => s + (r.no_show         || 0), 0);
  const totalRotas      = reports.reduce((s, r) => s + (r.total_rotas     || 0), 0);
  const totalLeftover   = reports.reduce((s, r) => s + (r.leftover        || 0), 0);
  const totalHC         = reports.reduce((s, r) => s + (r.hc              || 0), 0);

  // PHD calculado sobre totais (volume total / HC total)
  const phdIn  = totalHC > 0 ? (totalRecebido / totalHC).toFixed(0)  : '-';
  const phdOut = totalHC > 0 ? (totalExpedido / totalHC).toFixed(0) : '-';

  // OpsClock: média dos hubs que têm o dado
  const hubsComOps = reports.filter(r => r.ops_clock != null);
  const mediaOpsClock = hubsComOps.length > 0
    ? (hubsComOps.reduce((s, r) => s + r.ops_clock, 0) / hubsComOps.length).toFixed(0)
    : null;

  // Último report atualizado do conjunto
  const lastUpdatedReport = reports.reduce((latest, r) => {
    const d = new Date(r.updated_date || r.created_date || 0);
    return !latest || d > new Date(latest.updated_date || latest.created_date || 0) ? r : latest;
  }, null);

  // Link para "Ver mais" separado por tipo
  const tipoParam = tipo ? `?tipo=${tipo}` : '';
  const consolidadoLink = regional
    ? `/regional/${encodeURIComponent(regional)}/consolidado${tipoParam}`
    : null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-inter font-bold flex items-center gap-2 text-primary">
            <BarChart3 className="w-4 h-4" />
            {label || 'Consolidado da Regional'}
            <LastUpdateBadge report={lastUpdatedReport} />
          </CardTitle>
          {!hideLink && consolidadoLink && (
            <Link to={consolidadoLink}>
              <Button size="sm" variant="outline" className="h-7 text-xs font-inter px-2 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground">
                <ExternalLink className="w-3 h-3 mr-1" /> Mais
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <MetricItem label="Vol. Recebido" value={totalRecebido.toLocaleString('pt-BR')} />
          <MetricItem label="Processado"    value={totalProcessado.toLocaleString('pt-BR')} />
          <MetricItem label="Vol. Expedido" value={totalExpedido.toLocaleString('pt-BR')} />
          <MetricItem label="HC Total"      value={totalHC > 0 ? totalHC.toLocaleString('pt-BR') : '-'} />
          <MetricItem label="PHD Inbound"   value={phdIn}  warn={parseFloat(phdIn) > 5} />
          <MetricItem label="PHD Outbound"  value={phdOut} warn={parseFloat(phdOut) > 5} />
          <MetricItem label="No Show"       value={totalNoShow.toLocaleString('pt-BR')} warn={totalNoShow > 0} />
          <MetricItem label="Tot. Rotas"    value={totalRotas.toLocaleString('pt-BR')} />
          <MetricItem label="Leftover"      value={totalLeftover.toLocaleString('pt-BR')} warn={totalLeftover > 0} />
          {mediaOpsClock != null && (
            <MetricItem label="OpsClock"    value={`${mediaOpsClock}%`} />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground font-inter mt-3 text-right">
          {reports.length} hub(s) com dados
        </p>
      </CardContent>
    </Card>
  );
}

function MetricItem({ label, value, warn }) {
  return (
    <div className="text-center bg-white rounded-lg py-2 px-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium">{label}</p>
      <p className={`text-lg font-inter font-bold mt-0.5 ${warn ? 'text-destructive' : 'text-primary'}`}>
        {value ?? '-'}
      </p>
    </div>
  );
}