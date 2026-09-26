import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Clock, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import LeftoverCell from '@/components/ui/LeftoverCell';
import TimeInput from '@/components/ui/TimeInput';
import ForecastCell from '@/components/ui/ForecastCell';
import LastUpdateBadge from '@/components/ui/LastUpdateBadge';
import HcTooltipCell from '@/components/ui/HcTooltipCell';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function getAlerts(report) {
  const alerts = [];
  if (!report) return alerts;
  if (report.processado > 0 && report.volume_recebido > 0) {
    const ratio = report.processado / report.volume_recebido;
    if (ratio < 0.7) alerts.push({ text: 'Processamento baixo', type: 'warning' });
  }
  if (report.phd_inbound > 5) alerts.push({ text: `PHD In: ${report.phd_inbound.toFixed(0)}`, type: 'danger' });
  if (report.phd_outbound > 5) alerts.push({ text: `PHD Out: ${report.phd_outbound.toFixed(0)}`, type: 'danger' });
  if (report.leftover > 0) alerts.push({ text: `Leftover: ${report.leftover}`, type: 'warning' });
  return alerts;
}

export default function HubCard({ hub, report, regional, selectedDate, cycle, onDelete, onUpdate, allReportsForHub = [] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  const alerts = getAlerts(report);
  const statusIcon = report?.status === 'concluido'
    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
    : <Clock className="w-4 h-4 text-amber-500" />;
  const statusText = report?.status === 'concluido' ? 'Concluído' : 'Em andamento';
  const hasData = !!report;
  const isSemJanela = report?.sem_janela && cycle !== 'TOTAL';

  const editableReport = allReportsForHub.length > 0 ? allReportsForHub[allReportsForHub.length - 1] : null;

  const openEdit = () => {
    if (!editableReport) return;
    setEditForm({
      forecast:               editableReport.forecast               ?? '',
      volume_recebido:        editableReport.volume_recebido        ?? '',
      processado:             editableReport.processado             ?? '',
      volume_expedido:        editableReport.volume_expedido        ?? '',
      colaboradores:          editableReport.colaboradores          ?? '',
      diaristas:              editableReport.diaristas              ?? '',
      sinergia_recebida:      editableReport.sinergia_recebida      ?? '',
      sinergia_enviada:       editableReport.sinergia_enviada       ?? '',
      absenteismo:            editableReport.absenteismo            ?? '',
      no_show:                editableReport.no_show                ?? '',
      total_rotas:            editableReport.total_rotas            ?? '',
      rotas_fora_ops_clock:   editableReport.rotas_fora_ops_clock   ?? '',
      inicio_expedicao:       editableReport.inicio_expedicao       ?? '',
      fim_expedicao:          editableReport.fim_expedicao          ?? '',
      ponto_atencao:          editableReport.ponto_atencao          ?? '',
      leftover:               editableReport.leftover               ?? '',
      leftover_obs:           editableReport.leftover_obs           ?? '',
      missorting:             editableReport.missorting             ?? '',
      bwt:                    editableReport.bwt                    ?? '',
      status:                 editableReport.status                 ?? 'em_andamento',
    });
    setEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const colab = Number(editForm.colaboradores) || 0;
    const diar  = Number(editForm.diaristas) || 0;
    const siner = Number(editForm.sinergia_recebida) || 0;
    const hc    = colab + diar + siner;
    const vol_rec = Number(editForm.volume_recebido) || 0;
    const vol_exp = Number(editForm.volume_expedido) || 0;
    const tot_rotas = Number(editForm.total_rotas) || 0;
    const rotas_fora = Number(editForm.rotas_fora_ops_clock) || 0;
    const ops_clock_calc = tot_rotas > 0 ? ((tot_rotas - rotas_fora) / tot_rotas) * 100 : null;
    onUpdate(editableReport.id, {
      ...editForm,
      forecast:             editForm.forecast !== '' ? Number(editForm.forecast) : null,
      volume_recebido:      vol_rec,
      processado:           Number(editForm.processado) || 0,
      volume_expedido:      vol_exp,
      colaboradores:        colab,
      diaristas:            diar,
      sinergia_recebida:    siner,
      sinergia_enviada:     editForm.sinergia_enviada !== '' ? parseInt(editForm.sinergia_enviada) : null,
      absenteismo:          Number(editForm.absenteismo) || 0,
      hc,
      phd_inbound:          hc > 0 ? vol_rec / hc : 0,
      phd_outbound:         hc > 0 ? vol_exp / hc : 0,
      no_show:              Number(editForm.no_show) || 0,
      total_rotas:          tot_rotas,
      rotas_fora_ops_clock: rotas_fora,
      leftover:             Number(editForm.leftover) || 0,
      ops_clock:            ops_clock_calc,
      missorting:           editForm.missorting !== '' ? parseInt(editForm.missorting) : null,
      bwt:                  editForm.bwt !== '' ? Number(editForm.bwt) : null,
    });
    setEditOpen(false);
  };

  const updateField = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));

  const fmtPhd = (v) => (v != null && v > 0) ? Math.round(v).toLocaleString('pt-BR') : '-';

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 border-border/60 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-inter font-bold text-foreground">{hub.name}</CardTitle>
            <div className="flex items-center gap-2">
              {hasData && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {statusIcon}
                  <span>{statusText}</span>
                  <LastUpdateBadge report={editableReport || report} />
                </div>
              )}
              <div className="flex items-center gap-1">
                <Link to={`/hub/${hub.id}?regional=${encodeURIComponent(regional)}`}>
                  <Button size="sm" variant="outline" className="h-8 text-xs font-inter font-semibold border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground px-2.5">
                    Mais informações
                  </Button>
                </Link>
                {hasData && editableReport && cycle !== 'TOTAL' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={openEdit} className="gap-2 font-inter text-sm">
                        <Pencil className="w-3.5 h-3.5" /> Editar report
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(editableReport.id)}
                        className="gap-2 font-inter text-sm text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
          {alerts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {alerts.map((a, i) => (
                <Badge key={i} variant="outline" className={`text-[10px] font-inter font-medium ${
                  a.type === 'danger' ? 'border-destructive/40 text-destructive bg-destructive/5' : 'border-amber-400/40 text-amber-600 bg-amber-50'
                }`}>
                  <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                  {a.text}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {hasData ? (
            <div className="grid grid-cols-3 gap-3">
              {isSemJanela && (
                <div className="col-span-3 flex items-center gap-2 bg-slate-100 text-slate-500 rounded-lg px-3 py-2 text-xs font-inter font-medium">
                  <span className="text-base">🚫</span> Sem janela neste ciclo — indicadores zerados
                </div>
              )}
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium">Recebido</p>
                <p className="text-lg font-inter font-bold mt-0.5">
                  <ForecastCell volumeRecebido={report.volume_recebido ?? 0} forecast={report.forecast} />
                </p>
              </div>
              <MetricItem label="Processado" value={(report.processado ?? 0).toLocaleString('pt-BR')} />
              <MetricItem label="Expedido"   value={(report.volume_expedido ?? 0).toLocaleString('pt-BR')} />
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium">HC</p>
                <HcTooltipCell report={report} />
              </div>
              <MetricItem label="PHD In"     value={fmtPhd(report.phd_inbound)}  warn={report.phd_inbound > 5} />
              <MetricItem label="PHD Out"    value={fmtPhd(report.phd_outbound)} warn={report.phd_outbound > 5} />
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium">Leftover</p>
                <p className={`text-lg font-inter font-bold mt-0.5 ${report.leftover > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  <LeftoverCell value={report.leftover ?? 0} obs={report.leftover_obs} warn={report.leftover > 0} />
                </p>
              </div>
              <MetricItem label="No Show"   value={report.no_show ?? 0}   warn={report.no_show > 0} />
              <MetricItem label="Tot. Rotas" value={report.total_rotas ?? 0} />
              {(report.inicio_expedicao || report.fim_expedicao || report.ops_clock != null) && (
                <div className="col-span-3 text-xs text-muted-foreground font-inter flex flex-wrap gap-x-3 gap-y-0.5">
                  {report.inicio_expedicao && <span><span className="font-medium text-foreground">Início exp:</span> {report.inicio_expedicao}</span>}
                  {report.fim_expedicao && <span><span className="font-medium text-foreground">Fim exp:</span> {report.fim_expedicao}</span>}
                  {report.ops_clock != null && <span><span className="font-medium text-foreground">OpsClock:</span> {Number(report.ops_clock).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%</span>}
                </div>
              )}
              {report.ponto_atencao && (
                <div className="col-span-3 text-xs text-muted-foreground font-inter bg-amber-50 border border-amber-200/50 rounded-lg px-2.5 py-1.5">
                  <span className="font-medium text-amber-700">⚠ Atenção:</span> {report.ponto_atencao}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm font-inter">
              Sem dados para este ciclo
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-inter">Editar Report — {hub.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-inter">Forecast <span className="text-muted-foreground">(volume previsto)</span></Label>
              <Input inputMode="numeric" value={editForm.forecast} onChange={e => updateField('forecast', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-inter">Vol. Recebido</Label>
                <Input inputMode="numeric" value={editForm.volume_recebido} onChange={e => updateField('volume_recebido', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">Processado</Label>
                <Input inputMode="numeric" value={editForm.processado} onChange={e => updateField('processado', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">Vol. Expedido</Label>
                <Input inputMode="numeric" value={editForm.volume_expedido} onChange={e => updateField('volume_expedido', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
            </div>
            {/* Composição HC */}
            <div>
              <p className="text-xs font-inter font-semibold text-primary mb-2">Composição do HC</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-inter">Colaboradores</Label>
                  <Input inputMode="numeric" value={editForm.colaboradores} onChange={e => updateField('colaboradores', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs font-inter">Diaristas</Label>
                  <Input inputMode="numeric" value={editForm.diaristas} onChange={e => updateField('diaristas', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs font-inter">Sinergia Recebida</Label>
                  <Input inputMode="numeric" value={editForm.sinergia_recebida} onChange={e => updateField('sinergia_recebida', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs font-inter">Sinergia Enviada <span className="text-muted-foreground font-normal">(informativo)</span></Label>
                  <Input inputMode="numeric" value={editForm.sinergia_enviada} onChange={e => updateField('sinergia_enviada', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
                </div>
              </div>
              {(Number(editForm.colaboradores) + Number(editForm.diaristas) + Number(editForm.sinergia_recebida)) > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm font-inter text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">
                  <span>HC calculado:</span>
                  <span className="font-bold text-primary">
                    {(Number(editForm.colaboradores) || 0) + (Number(editForm.diaristas) || 0) + (Number(editForm.sinergia_recebida) || 0)}
                  </span>
                </div>
              )}
            </div>
            {/* Absenteísmo */}
            <div>
              <Label className="text-xs font-inter">Absenteísmo</Label>
              <Input inputMode="numeric" value={editForm.absenteismo} onChange={e => updateField('absenteismo', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
            </div>
            {/* PHD preview */}
            {((Number(editForm.colaboradores) || 0) + (Number(editForm.diaristas) || 0) + (Number(editForm.sinergia_recebida) || 0)) > 0 && (
              <div className="grid grid-cols-2 gap-4 bg-primary/5 border border-primary/20 rounded-xl p-3">
                {(() => {
                  const hcCalc = (Number(editForm.colaboradores) || 0) + (Number(editForm.diaristas) || 0) + (Number(editForm.sinergia_recebida) || 0);
                  return (
                    <>
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-inter">PHD In (auto)</p>
                        <p className="text-lg font-inter font-bold text-primary">
                          {hcCalc > 0 ? Math.round((Number(editForm.volume_recebido) || 0) / hcCalc) : '-'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-inter">PHD Out (auto)</p>
                        <p className="text-lg font-inter font-bold text-primary">
                          {hcCalc > 0 ? Math.round((Number(editForm.volume_expedido) || 0) / hcCalc) : '-'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-inter">Leftover</Label>
                <Input inputMode="numeric" value={editForm.leftover} onChange={e => updateField('leftover', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">No Show</Label>
                <Input inputMode="numeric" value={editForm.no_show} onChange={e => updateField('no_show', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">Total de Rotas</Label>
                <Input inputMode="numeric" value={editForm.total_rotas} onChange={e => updateField('total_rotas', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter font-semibold text-primary">Fora OpsClock</Label>
                <Input inputMode="numeric" value={editForm.rotas_fora_ops_clock} onChange={e => updateField('rotas_fora_ops_clock', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
            </div>
            {Number(editForm.total_rotas) > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground font-inter">OpsClock (calculado)</p>
                <p className="text-lg font-inter font-bold text-primary">
                  {(((Number(editForm.total_rotas) - (Number(editForm.rotas_fora_ops_clock) || 0)) / Number(editForm.total_rotas)) * 100).toFixed(1)}%
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs font-inter">Obs. Leftover</Label>
              <Input value={editForm.leftover_obs} onChange={e => updateField('leftover_obs', e.target.value)} placeholder="Ex: LH atrasou..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-inter">Missorting <span className="text-muted-foreground font-normal">(qtd.)</span></Label>
                <Input inputMode="numeric" value={editForm.missorting} onChange={e => updateField('missorting', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">BWT <span className="text-muted-foreground font-normal">(%)</span></Label>
                <Input type="number" step="0.1" min="0" max="100" value={editForm.bwt} onChange={e => updateField('bwt', e.target.value)} placeholder="Ex: 90.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-inter">Início Exp.</Label>
                <TimeInput value={editForm.inicio_expedicao} onChange={v => updateField('inicio_expedicao', v)} />
              </div>
              <div>
                <Label className="text-xs font-inter">Fim Exp.</Label>
                <TimeInput value={editForm.fim_expedicao} onChange={v => updateField('fim_expedicao', v)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-inter">Ponto de Atenção</Label>
              <Textarea value={editForm.ponto_atencao} onChange={e => updateField('ponto_atencao', e.target.value)} rows={3} />
            </div>
            <div>
              <Label className="text-xs font-inter">Status</Label>
              <Select value={editForm.status} onValueChange={v => updateField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full font-inter font-semibold">Salvar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricItem({ label, value, warn }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium">{label}</p>
      <p className={`text-lg font-inter font-bold mt-0.5 ${warn ? 'text-destructive' : 'text-foreground'}`}>
        {value ?? '-'}
      </p>
    </div>
  );
}