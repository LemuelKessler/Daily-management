import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2, BanIcon } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import TimeInput from '@/components/ui/TimeInput';
import LeftoverDetalhamentoSection from '@/components/leftover/LeftoverDetalhamentoSection';
import { emptyLeftoverDetalhamento } from '@/lib/leftoverReasons';

const REGIONAIS = ['Regional 1', 'Regional 2', 'Regional 3', 'Regional 4', 'Regional ES 01'];

const defaultForm = {
  hub_id: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  cycle: 'AM',
  sem_janela: false,
  forecast: '',
  volume_recebido: '',
  processado: '',
  volume_expedido: '',
  colaboradores: '',
  diaristas: '',
  sinergia_recebida: '',
  sinergia_enviada: '',
  absenteismo: '',
  no_show: '',
  total_rotas: '',
  rotas_fora_ops_clock: '',
  inicio_expedicao: '',
  fim_expedicao: '',
  ops_clock: '',
  ponto_atencao: '',
  leftover: '',
  leftover_obs: '',
  leftover_detalhamento: emptyLeftoverDetalhamento(),
  missorting: '',
  bwt: '',
  status: 'em_andamento',
};

function NumericInput({ value, onChange, placeholder, disabled }) {
  return (
    <Input
      inputMode="numeric"
      value={value}
      onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
      placeholder={placeholder || '0'}
      disabled={disabled}
    />
  );
}

// Apenas inteiros (sem vírgula, sem ponto)
function IntegerInput({ value, onChange, placeholder, disabled }) {
  return (
    <Input
      inputMode="numeric"
      value={value}
      onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
      placeholder={placeholder || '0'}
      disabled={disabled}
    />
  );
}

function DecimalInput({ value, onChange, placeholder, disabled }) {
  return (
    <Input
      type="number"
      step="0.1"
      min="0"
      max="100"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || '0'}
      disabled={disabled}
    />
  );
}

export default function ReportInput() {
  const [form, setForm] = useState(defaultForm);
  const [selectedRegional, setSelectedRegional] = useState('');
  const queryClient = useQueryClient();

  const { data: hubs = [] } = useQuery({
    queryKey: ['all-hubs'],
    queryFn: () => base44.entities.Hub.list(),
  });

  const { data: allReports = [] } = useQuery({
    queryKey: ['all-reports-validation'],
    queryFn: () => base44.entities.HubReport.list('-date', 500),
  });

  // HC calculado automaticamente: Colaboradores + Diaristas + Sinergia Recebida
  const colabNum = Number(form.colaboradores) || 0;
  const diaristasNum = Number(form.diaristas) || 0;
  const sinergiaNum = Number(form.sinergia_recebida) || 0;
  const hcNum = colabNum + diaristasNum + sinergiaNum;
  const volRecNum = Number(form.volume_recebido) || 0;
  const volExpNum = Number(form.volume_expedido) || 0;
  const phd_inbound_calc  = hcNum > 0 ? (volRecNum / hcNum) : 0;
  const phd_outbound_calc = hcNum > 0 ? (volExpNum / hcNum) : 0;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const hub = hubs.find(h => h.id === data.hub_id);
      const isSemJanela = data.sem_janela;
      const colab = isSemJanela ? 0 : (Number(data.colaboradores) || 0);
      const diar  = isSemJanela ? 0 : (Number(data.diaristas) || 0);
      const siner = isSemJanela ? 0 : (Number(data.sinergia_recebida) || 0);
      const hc    = isSemJanela ? 0 : (colab + diar + siner);
      const vol_rec = isSemJanela ? 0 : (Number(data.volume_recebido) || 0);
      const vol_exp = isSemJanela ? 0 : (Number(data.volume_expedido) || 0);
      const tot_rotas = isSemJanela ? 0 : (Number(data.total_rotas) || 0);
      const rotas_fora = isSemJanela ? 0 : (Number(data.rotas_fora_ops_clock) || 0);
      const ops_clock_calc = tot_rotas > 0
        ? ((tot_rotas - rotas_fora) / tot_rotas) * 100
        : null;
      return base44.entities.HubReport.create({
        ...data,
        hub_name: hub?.name || '',
        regional: hub?.regional || '',
        forecast: isSemJanela ? null : (Number(data.forecast) || null),
        volume_recebido: vol_rec,
        processado: isSemJanela ? 0 : (Number(data.processado) || 0),
        volume_expedido: vol_exp,
        colaboradores: colab,
        diaristas: diar,
        sinergia_recebida: siner,
        sinergia_enviada: isSemJanela ? null : (parseInt(data.sinergia_enviada) || null),
        absenteismo: isSemJanela ? 0 : (Number(data.absenteismo) || 0),
        hc,
        phd_inbound:  hc > 0 ? vol_rec / hc : 0,
        phd_outbound: hc > 0 ? vol_exp / hc : 0,
        no_show:    isSemJanela ? 0 : (Number(data.no_show) || 0),
        total_rotas: tot_rotas,
        rotas_fora_ops_clock: rotas_fora,
        leftover:    isSemJanela ? 0 : (Number(data.leftover) || 0),
        leftover_detalhamento: isSemJanela ? emptyLeftoverDetalhamento() : (data.leftover_detalhamento || emptyLeftoverDetalhamento()),
        ops_clock:   isSemJanela ? null : ops_clock_calc,
        missorting:  isSemJanela ? 0 : (parseInt(data.missorting) || 0),
        bwt:         isSemJanela ? null : (data.bwt !== '' ? Number(data.bwt) : null),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['all-reports-validation'] });
      toast.success('✅ Report salvo com sucesso!');
      setForm(defaultForm);
    },
    onError: () => {
      toast.error('Erro ao salvar o report. Tente novamente.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.hub_id) { toast.error('Selecione um hub.'); return; }
    const duplicate = allReports.find(
      r => r.hub_id === form.hub_id && r.date === form.date && r.cycle === form.cycle
    );
    if (duplicate) {
      toast.error('❌ Já existe um report cadastrado para este hub, data e ciclo.');
      return;
    }
    createMutation.mutate(form);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleSemJanela = () => {
    setForm(prev => ({
      ...prev,
      sem_janela: !prev.sem_janela,
      ...((!prev.sem_janela) ? {
        forecast: '', volume_recebido: '', processado: '', volume_expedido: '',
        colaboradores: '', diaristas: '', sinergia_recebida: '', absenteismo: '',
        no_show: '', total_rotas: '', rotas_fora_ops_clock: '', leftover: '', ops_clock: '',
        leftover_detalhamento: emptyLeftoverDetalhamento(),
      } : {})
    }));
  };

  const disabled = form.sem_janela;

  return (
    <div className="max-w-2xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-inter font-extrabold text-foreground mb-6">Input de Dados</h1>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-inter">Novo Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Etapa 1: Regional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-inter">1. Regional</Label>
                <Select value={selectedRegional} onValueChange={v => { setSelectedRegional(v); updateField('hub_id', ''); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione a regional" /></SelectTrigger>
                  <SelectContent>
                    {REGIONAIS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-inter">2. Hub</Label>
                <Select
                  value={form.hub_id}
                  onValueChange={v => updateField('hub_id', v)}
                  disabled={!selectedRegional}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedRegional ? 'Selecione o hub' : 'Selecione a regional primeiro'} />
                  </SelectTrigger>
                  <SelectContent>
                    {hubs
                      .filter(h => h.regional === selectedRegional)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(h => (
                        <SelectItem key={h.id} value={h.id}>{h.name} ({h.tipo || 'LM'})</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data / Ciclo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-inter">Data</Label>
                <Input type="date" value={form.date} onChange={e => updateField('date', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">Ciclo</Label>
                <Select value={form.cycle} onValueChange={v => updateField('cycle', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM (Manhã)</SelectItem>
                    <SelectItem value="PM">PM (Tarde)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sem Janela */}
            <div
              onClick={toggleSemJanela}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition-all ${
                form.sem_janela
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : 'border-border/50 bg-muted/30 hover:border-border text-muted-foreground'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                form.sem_janela ? 'bg-amber-400 border-amber-400' : 'border-muted-foreground/50'
              }`}>
                {form.sem_janela && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <BanIcon className={`w-4 h-4 flex-shrink-0 ${form.sem_janela ? 'text-amber-600' : 'text-muted-foreground/60'}`} />
              <div>
                <p className="text-sm font-inter font-semibold">Não houve janela para este ciclo</p>
                <p className="text-xs font-inter opacity-70">Todos os indicadores serão zerados automaticamente</p>
              </div>
            </div>

            {/* Forecast */}
            <div className={`transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <Label className="text-xs font-inter">Forecast <span className="text-muted-foreground">(volume previsto)</span></Label>
              <NumericInput value={form.forecast} onChange={v => updateField('forecast', v)} placeholder="0" disabled={disabled} />
            </div>

            {/* Volumes */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <Label className="text-xs font-inter">Volume Recebido</Label>
                <NumericInput value={form.volume_recebido} onChange={v => updateField('volume_recebido', v)} disabled={disabled} />
              </div>
              <div>
                <Label className="text-xs font-inter">Processado</Label>
                <NumericInput value={form.processado} onChange={v => updateField('processado', v)} disabled={disabled} />
              </div>
              <div>
                <Label className="text-xs font-inter">Volume Expedido</Label>
                <NumericInput value={form.volume_expedido} onChange={v => updateField('volume_expedido', v)} disabled={disabled} />
              </div>
            </div>

            {/* HC — composição */}
            <div className={`transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <p className="text-xs font-inter font-semibold text-primary mb-2">Composição do HC</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-inter">Colaboradores</Label>
                  <NumericInput value={form.colaboradores} onChange={v => updateField('colaboradores', v)} disabled={disabled} />
                </div>
                <div>
                  <Label className="text-xs font-inter">Diaristas</Label>
                  <NumericInput value={form.diaristas} onChange={v => updateField('diaristas', v)} disabled={disabled} />
                </div>
                <div>
                  <Label className="text-xs font-inter">Sinergia Recebida</Label>
                  <NumericInput value={form.sinergia_recebida} onChange={v => updateField('sinergia_recebida', v)} disabled={disabled} />
                </div>
                <div>
                  <Label className="text-xs font-inter">Sinergia Enviada <span className="text-muted-foreground font-normal">(apenas informativo)</span></Label>
                  <IntegerInput value={form.sinergia_enviada} onChange={v => updateField('sinergia_enviada', v)} placeholder="0" disabled={disabled} />
                </div>
              </div>
              {!disabled && hcNum > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm font-inter text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">
                  <span>HC calculado automaticamente:</span>
                  <span className="font-bold text-primary text-base">{hcNum}</span>
                </div>
              )}
            </div>

            {/* Absenteísmo */}
            <div className={`transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <Label className="text-xs font-inter">Absenteísmo <span className="text-muted-foreground">(quantidade)</span></Label>
              <NumericInput value={form.absenteismo} onChange={v => updateField('absenteismo', v)} placeholder="0" disabled={disabled} />
              {!disabled && hcNum > 0 && Number(form.absenteismo) > 0 && (
                <p className="text-xs text-muted-foreground mt-1 font-inter">
                  % Absenteísmo: <span className="font-semibold text-amber-600">{((Number(form.absenteismo) / hcNum) * 100).toFixed(1)}%</span>
                </p>
              )}
            </div>

            {/* PHD calculado automaticamente */}
            {!disabled && hcNum > 0 && (
              <div className="grid grid-cols-2 gap-4 bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium mb-1">PHD Inbound (auto)</p>
                  <p className="text-xl font-inter font-bold text-primary">{phd_inbound_calc.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Recebido ÷ HC</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium mb-1">PHD Outbound (auto)</p>
                  <p className="text-xl font-inter font-bold text-primary">{phd_outbound_calc.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Expedido ÷ HC</p>
                </div>
              </div>
            )}

            {/* Leftover */}
            <div className={`grid grid-cols-2 gap-4 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <Label className="text-xs font-inter">Leftover</Label>
                <NumericInput value={form.leftover} onChange={v => updateField('leftover', v)} disabled={disabled} />
              </div>
              <div className="col-span-1">
                <Label className="text-xs font-inter">Obs. Leftover <span className="text-muted-foreground">(opcional)</span></Label>
                <Input value={form.leftover_obs} onChange={e => updateField('leftover_obs', e.target.value)} placeholder='Ex: LH atrasou...' disabled={disabled} />
              </div>
            </div>

            {/* Detalhamento do Leftover por motivo */}
            <LeftoverDetalhamentoSection
              detalhamento={form.leftover_detalhamento}
              leftoverTotal={form.leftover}
              disabled={disabled}
              onChange={(key, value) => setForm(prev => ({
                ...prev,
                leftover_detalhamento: { ...(prev.leftover_detalhamento || emptyLeftoverDetalhamento()), [key]: value },
              }))}
            />

            {/* No Show / Total Rotas / Rotas Fora OpsClock */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <Label className="text-xs font-inter">No Show <span className="text-muted-foreground">(rotas no piso)</span></Label>
                <NumericInput value={form.no_show} onChange={v => updateField('no_show', v)} disabled={disabled} />
              </div>
              <div>
                <Label className="text-xs font-inter">Total de Rotas</Label>
                <NumericInput value={form.total_rotas} onChange={v => updateField('total_rotas', v)} disabled={disabled} />
              </div>
              <div>
                <Label className="text-xs font-inter font-semibold text-primary">Rotas Fora do OpsClock</Label>
                <NumericInput value={form.rotas_fora_ops_clock} onChange={v => updateField('rotas_fora_ops_clock', v)} placeholder="0" disabled={disabled} />
              </div>
            </div>

            {/* Expedição */}
            <div className={`grid grid-cols-2 gap-4 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <Label className="text-xs font-inter">Início Exp.</Label>
                <TimeInput value={form.inicio_expedicao} onChange={v => updateField('inicio_expedicao', v)} disabled={disabled} />
              </div>
              <div>
                <Label className="text-xs font-inter">Fim Exp.</Label>
                <TimeInput value={form.fim_expedicao} onChange={v => updateField('fim_expedicao', v)} disabled={disabled} />
              </div>
            </div>

            {/* Preview OpsClock calculado */}
            {!disabled && Number(form.total_rotas) > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-inter font-medium mb-1">OpsClock (calculado automaticamente)</p>
                <p className="text-xl font-inter font-bold text-primary">
                  {(((Number(form.total_rotas) - (Number(form.rotas_fora_ops_clock) || 0)) / Number(form.total_rotas)) * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground">(Total Rotas - Fora) ÷ Total Rotas</p>
              </div>
            )}

            {/* Missorting + BWT */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <Label className="text-xs font-inter font-semibold">Missorting <span className="text-muted-foreground font-normal">(qtd. inteira)</span></Label>
                <p className="text-[10px] text-muted-foreground font-inter mb-1">Erros operacionais identificados no ciclo</p>
                <IntegerInput value={form.missorting} onChange={v => updateField('missorting', v)} placeholder="0" disabled={disabled} />
                {!disabled && Number(form.missorting) > 0 && volExpNum > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 font-inter">
                    % Missorting: <span className="font-semibold text-amber-600">{((Number(form.missorting) / volExpNum) * 100).toFixed(2)}%</span>
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs font-inter font-semibold">BWT (%) <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <p className="text-[10px] text-muted-foreground font-inter mb-1">Better Way Together — adesão ao processo</p>
                <DecimalInput value={form.bwt} onChange={v => updateField('bwt', v)} placeholder="Ex: 90.5" disabled={disabled} />
              </div>
            </div>

            {/* Ponto de atenção */}
            <div>
              <Label className="text-xs font-inter">Ponto de Atenção</Label>
              <Textarea value={form.ponto_atencao} onChange={e => updateField('ponto_atencao', e.target.value)} placeholder="Observações relevantes..." rows={3} />
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs font-inter">Status</Label>
              <Select value={form.status} onValueChange={v => updateField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Reporte
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}