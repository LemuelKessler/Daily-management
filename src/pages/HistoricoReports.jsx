import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, Search, Save, Loader2 } from 'lucide-react';
import LeftoverCell from '@/components/ui/LeftoverCell';
import LastUpdateBadge from '@/components/ui/LastUpdateBadge';

const fmt = (n) => (n ?? 0).toLocaleString('pt-BR');

export default function HistoricoReports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const today = format(new Date(), 'yyyy-MM-dd');
  const thirtyDaysAgo = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [filterHub, setFilterHub] = useState('all');
  const [filterRegional, setFilterRegional] = useState('all');
  const [navTab, setNavTab] = useState('regional'); // 'regional' | 'hub'
  const [editingReport, setEditingReport] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: hubs = [] } = useQuery({
    queryKey: ['all-hubs'],
    queryFn: () => base44.entities.Hub.list(),
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['historico-reports', dateFrom, dateTo],
    queryFn: () => base44.entities.HubReport.list('-date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HubReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reporte atualizado!');
      setEditingReport(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HubReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reporte excluído!');
    },
  });

  const REGIONAIS = ['Regional 1', 'Regional 2', 'Regional 3', 'Regional 4', 'Regional ES 01'];

  const filtered = useMemo(() =>
    reports.filter(r => {
      const inDate = r.date >= dateFrom && r.date <= dateTo;
      const inHub = filterHub === 'all' || r.hub_id === filterHub;
      const inRegional = filterRegional === 'all' || r.regional === filterRegional;
      return inDate && inHub && inRegional;
    }),
    [reports, dateFrom, dateTo, filterHub, filterRegional]
  );

  const openEdit = (r) => {
    setEditingReport(r);
    setEditForm({
      hub_id: r.hub_id,
      date: r.date,
      cycle: r.cycle,
      volume_recebido: r.volume_recebido ?? '',
      processado: r.processado ?? '',
      volume_expedido: r.volume_expedido ?? '',
      phd_inbound: r.phd_inbound ?? '',
      phd_outbound: r.phd_outbound ?? '',
      inicio_expedicao: r.inicio_expedicao ?? '',
      fim_expedicao: r.fim_expedicao ?? '',
      ponto_atencao: r.ponto_atencao ?? '',
      leftover: r.leftover ?? '',
      leftover_obs: r.leftover_obs ?? '',
      no_show: r.no_show ?? '',
      total_rotas: r.total_rotas ?? '',
      status: r.status ?? 'em_andamento',
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingReport.id,
      data: {
        ...editForm,
        volume_recebido: Number(editForm.volume_recebido) || 0,
        processado: Number(editForm.processado) || 0,
        volume_expedido: Number(editForm.volume_expedido) || 0,
        phd_inbound: Number(editForm.phd_inbound) || 0,
        phd_outbound: Number(editForm.phd_outbound) || 0,
        leftover: Number(editForm.leftover) || 0,
        no_show: Number(editForm.no_show) || 0,
        total_rotas: Number(editForm.total_rotas) || 0,
      },
    });
  };

  const updateField = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-inter font-extrabold text-foreground">Histórico de Reports</h1>
          <p className="text-sm text-muted-foreground font-inter mt-0.5">Todos os reports — edite ou exclua</p>
        </div>
      </div>

      {/* Navegação Regional / Hub */}
      <div className="flex gap-2">
        <button
          onClick={() => { setNavTab('regional'); setFilterHub('all'); }}
          className={`px-4 py-2 rounded-lg text-sm font-inter font-semibold transition-all border ${
            navTab === 'regional'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
          }`}
        >
          Por Regional
        </button>
        <button
          onClick={() => { setNavTab('hub'); setFilterRegional('all'); }}
          className={`px-4 py-2 rounded-lg text-sm font-inter font-semibold transition-all border ${
            navTab === 'hub'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
          }`}
        >
          Por Hub
        </button>
      </div>

      {/* Filtros */}
      <Card className="border-border/60">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs font-inter">Data Inicial</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs font-inter">Data Final</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
            </div>
            {navTab === 'regional' && (
              <div>
                <Label className="text-xs font-inter">Regional</Label>
                <Select value={filterRegional} onValueChange={v => { setFilterRegional(v); setFilterHub('all'); }}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Regionais</SelectItem>
                    {REGIONAIS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {navTab === 'hub' && (
              <div>
                <Label className="text-xs font-inter">Hub</Label>
                <Select value={filterHub} onValueChange={v => { setFilterHub(v); setFilterRegional('all'); }}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Hubs</SelectItem>
                    {hubs.sort((a,b) => a.name.localeCompare(b.name)).map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name} ({h.regional})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end pb-0.5">
              <span className="text-sm text-muted-foreground font-inter flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> {filtered.length} registro(s)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-inter text-xs">Data</TableHead>
                  <TableHead className="font-inter text-xs">Hub</TableHead>
                  <TableHead className="font-inter text-xs">Regional</TableHead>
                  <TableHead className="font-inter text-xs">Ciclo</TableHead>
                  <TableHead className="font-inter text-xs text-right">Recebido</TableHead>
                  <TableHead className="font-inter text-xs text-right">Processado</TableHead>
                  <TableHead className="font-inter text-xs text-right">Expedido</TableHead>
                  <TableHead className="font-inter text-xs text-right">PHD In</TableHead>
                  <TableHead className="font-inter text-xs text-right">PHD Out</TableHead>
                  <TableHead className="font-inter text-xs text-right">Leftover</TableHead>
                  <TableHead className="font-inter text-xs text-right">No Show</TableHead>
                  <TableHead className="font-inter text-xs text-right">Tot. Rotas</TableHead>
                  <TableHead className="font-inter text-xs">Status</TableHead>
                  <TableHead className="font-inter text-xs text-center">Atualiz.</TableHead>
                  <TableHead className="font-inter text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={12} className="py-8 text-center text-muted-foreground text-sm font-inter">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={12} className="py-12 text-center text-muted-foreground text-sm font-inter">Nenhum report encontrado para os filtros selecionados.</TableCell></TableRow>
                ) : (
                  filtered.map(r => (
                    <TableRow key={r.id} className="text-sm font-inter">
                      <TableCell className="font-medium whitespace-nowrap">{format(new Date(r.date + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-semibold">{r.hub_name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{r.regional}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${r.cycle === 'AM' ? 'border-amber-400/60 text-amber-600 bg-amber-50' : 'border-blue-400/60 text-blue-600 bg-blue-50'}`}>
                          {r.cycle}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{fmt(r.volume_recebido)}</TableCell>
                      <TableCell className="text-right">{fmt(r.processado)}</TableCell>
                      <TableCell className="text-right">{fmt(r.volume_expedido)}</TableCell>
                      <TableCell className={`text-right ${(r.phd_inbound || 0) > 5 ? 'text-destructive font-semibold' : ''}`}>{r.phd_inbound ?? '-'}</TableCell>
                      <TableCell className={`text-right ${(r.phd_outbound || 0) > 5 ? 'text-destructive font-semibold' : ''}`}>{r.phd_outbound ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        <LeftoverCell value={r.leftover ?? 0} obs={r.leftover_obs} warn={(r.leftover || 0) > 0} />
                      </TableCell>
                      <TableCell className={`text-right ${(r.no_show || 0) > 0 ? 'text-destructive font-semibold' : ''}`}>{r.no_show ?? 0}</TableCell>
                      <TableCell className="text-right">{r.total_rotas ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${r.status === 'concluido' ? 'border-green-400/60 text-green-600 bg-green-50' : 'border-amber-400/60 text-amber-600 bg-amber-50'}`}>
                          {r.status === 'concluido' ? 'Concluído' : 'Em andamento'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <LastUpdateBadge report={r} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={!!editingReport} onOpenChange={(open) => !open && setEditingReport(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-inter">Editar Report — {editingReport?.hub_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-inter">Data</Label>
                <Input type="date" value={editForm.date} onChange={e => updateField('date', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">Ciclo</Label>
                <Select value={editForm.cycle} onValueChange={v => updateField('cycle', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-inter">Vol. Recebido</Label>
                <Input type="number" value={editForm.volume_recebido} onChange={e => updateField('volume_recebido', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">Processado</Label>
                <Input type="number" value={editForm.processado} onChange={e => updateField('processado', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">Vol. Expedido</Label>
                <Input type="number" value={editForm.volume_expedido} onChange={e => updateField('volume_expedido', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">PHD Inbound</Label>
                <Input type="number" step="0.1" value={editForm.phd_inbound} onChange={e => updateField('phd_inbound', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">PHD Outbound</Label>
                <Input type="number" step="0.1" value={editForm.phd_outbound} onChange={e => updateField('phd_outbound', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">Leftover</Label>
                <Input type="number" value={editForm.leftover} onChange={e => updateField('leftover', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">No Show</Label>
                <Input type="number" value={editForm.no_show} onChange={e => updateField('no_show', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-inter">Total de Rotas</Label>
                <Input type="number" value={editForm.total_rotas} onChange={e => updateField('total_rotas', e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-inter">Observação do Leftover</Label>
              <Input value={editForm.leftover_obs} onChange={e => updateField('leftover_obs', e.target.value)} placeholder="Ex: LH atrasou..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-inter">Início da expedição</Label>
                <Input value={editForm.inicio_expedicao} onChange={e => updateField('inicio_expedicao', e.target.value)} placeholder="Horário" />
              </div>
              <div>
                <Label className="text-xs font-inter">Fim da expedição</Label>
                <Input value={editForm.fim_expedicao} onChange={e => updateField('fim_expedicao', e.target.value)} placeholder="Horário" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-inter">Ponto de Atenção</Label>
              <Textarea value={editForm.ponto_atencao} onChange={e => updateField('ponto_atencao', e.target.value)} rows={2} />
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
            <Button type="submit" className="w-full font-inter font-semibold" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}