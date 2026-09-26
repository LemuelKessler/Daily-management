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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save, Loader2, Plus, Pencil, Trash2, ClipboardList, LogOut } from 'lucide-react';

const defaultForm = {
  hub_id: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  cycle: 'AM',
  volume_recebido: '',
  processado: '',
  volume_expedido: '',
  phd_inbound: '',
  phd_outbound: '',
  inicio_expedicao: '',
  fim_expedicao: '',
  ponto_atencao: '',
  leftover: '',
  status: 'em_andamento',
};

export default function LiderReports({ onLogout }) {
  const [form, setForm] = useState(defaultForm);
  const [editingReport, setEditingReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const queryClient = useQueryClient();

  const { data: hubs = [] } = useQuery({
    queryKey: ['all-hubs'],
    queryFn: () => base44.entities.Hub.list(),
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports-lider', filterDate],
    queryFn: () => base44.entities.HubReport.filter({ date: filterDate }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const hub = hubs.find(h => h.id === data.hub_id);
      return base44.entities.HubReport.create({
        ...data,
        hub_name: hub?.name || '',
        regional: hub?.regional || '',
        volume_recebido: Number(data.volume_recebido) || 0,
        processado: Number(data.processado) || 0,
        volume_expedido: Number(data.volume_expedido) || 0,
        phd_inbound: Number(data.phd_inbound) || 0,
        phd_outbound: Number(data.phd_outbound) || 0,
        leftover: Number(data.leftover) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-lider'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reporte criado!');
      setDialogOpen(false);
      setForm(defaultForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const hub = hubs.find(h => h.id === data.hub_id);
      return base44.entities.HubReport.update(id, {
        ...data,
        hub_name: hub?.name || data.hub_name,
        regional: hub?.regional || data.regional,
        volume_recebido: Number(data.volume_recebido) || 0,
        processado: Number(data.processado) || 0,
        volume_expedido: Number(data.volume_expedido) || 0,
        phd_inbound: Number(data.phd_inbound) || 0,
        phd_outbound: Number(data.phd_outbound) || 0,
        leftover: Number(data.leftover) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-lider'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reporte atualizado!');
      setDialogOpen(false);
      setEditingReport(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HubReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-lider'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reporte excluído!');
    },
  });

  const openCreate = () => {
    setEditingReport(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (report) => {
    setEditingReport(report);
    setForm({
      hub_id: report.hub_id,
      date: report.date,
      cycle: report.cycle,
      volume_recebido: report.volume_recebido ?? '',
      processado: report.processado ?? '',
      volume_expedido: report.volume_expedido ?? '',
      phd_inbound: report.phd_inbound ?? '',
      phd_outbound: report.phd_outbound ?? '',
      inicio_expedicao: report.inicio_expedicao ?? '',
      fim_expedicao: report.fim_expedicao ?? '',
      ponto_atencao: report.ponto_atencao ?? '',
      leftover: report.leftover ?? '',
      status: report.status ?? 'em_andamento',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.hub_id) { toast.error('Selecione um hub.'); return; }
    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Header próprio sem links de navegação */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="font-inter font-bold text-lg tracking-tight">Área do Líder</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-white/80 hover:text-white hover:bg-white/20 font-inter text-xs">
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-inter font-extrabold text-foreground">Reports Diários</h1>
            <p className="text-sm text-muted-foreground font-inter mt-0.5">Visualize, crie, edite e exclua reports</p>
          </div>
          <Button onClick={openCreate} className="font-inter font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Novo Reporte
          </Button>
        </div>

        {/* Filtro de data */}
        <Card className="border-border/60">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-inter font-medium whitespace-nowrap">Filtrar por data:</Label>
              <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="max-w-xs" />
              <span className="text-sm text-muted-foreground font-inter">{reports.length} reporte(s)</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-inter font-bold">
              Reports de {format(new Date(filterDate + 'T12:00:00'), 'dd/MM/yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-inter text-xs">Hub</TableHead>
                    <TableHead className="font-inter text-xs">Ciclo</TableHead>
                    <TableHead className="font-inter text-xs text-right">Recebido</TableHead>
                    <TableHead className="font-inter text-xs text-right">Processado</TableHead>
                    <TableHead className="font-inter text-xs text-right">Expedido</TableHead>
                    <TableHead className="font-inter text-xs text-right">PHD In</TableHead>
                    <TableHead className="font-inter text-xs text-right">PHD Out</TableHead>
                    <TableHead className="font-inter text-xs text-right">Leftover</TableHead>
                    <TableHead className="font-inter text-xs">Status</TableHead>
                    <TableHead className="font-inter text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-sm">Carregando...</TableCell></TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-sm">Nenhum report para esta data</TableCell></TableRow>
                  ) : (
                    reports.map(r => (
                      <TableRow key={r.id} className="text-sm font-inter">
                        <TableCell className="font-semibold">{r.hub_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${r.cycle === 'AM' ? 'border-amber-400/60 text-amber-600 bg-amber-50' : 'border-blue-400/60 text-blue-600 bg-blue-50'}`}>
                            {r.cycle}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{r.volume_recebido?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell className="text-right">{r.processado?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell className="text-right">{r.volume_expedido?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell className={`text-right ${(r.phd_inbound || 0) > 5 ? 'text-destructive font-semibold' : ''}`}>
                          {r.phd_inbound != null ? r.phd_inbound : '-'}
                        </TableCell>
                        <TableCell className={`text-right ${(r.phd_outbound || 0) > 5 ? 'text-destructive font-semibold' : ''}`}>
                          {r.phd_outbound != null ? r.phd_outbound : '-'}
                        </TableCell>
                        <TableCell className={`text-right ${(r.leftover || 0) > 0 ? 'text-amber-600 font-semibold' : ''}`}>
                          {(r.leftover ?? 0).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${r.status === 'concluido' ? 'border-green-400/60 text-green-600 bg-green-50' : 'border-amber-400/60 text-amber-600 bg-amber-50'}`}>
                            {r.status === 'concluido' ? 'Concluído' : 'Em andamento'}
                          </Badge>
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
      </main>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-inter">{editingReport ? 'Editar Reporte' : 'Novo Reporte'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-inter">Hub</Label>
                <Select value={form.hub_id} onValueChange={v => updateField('hub_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {hubs.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name} ({h.regional})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-inter">Volume Recebido</Label>
                <Input type="number" value={form.volume_recebido} onChange={e => updateField('volume_recebido', e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">Processado</Label>
                <Input type="number" value={form.processado} onChange={e => updateField('processado', e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">Volume Expedido</Label>
                <Input type="number" value={form.volume_expedido} onChange={e => updateField('volume_expedido', e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">PHD Inbound (%)</Label>
                <Input type="number" step="0.1" value={form.phd_inbound} onChange={e => updateField('phd_inbound', e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">PHD Outbound (%)</Label>
                <Input type="number" step="0.1" value={form.phd_outbound} onChange={e => updateField('phd_outbound', e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-inter">Leftover</Label>
                <Input type="number" value={form.leftover} onChange={e => updateField('leftover', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-inter">Início da expedição</Label>
                <Input value={form.inicio_expedicao} onChange={e => updateField('inicio_expedicao', e.target.value)} placeholder="Horário ou descrição" />
              </div>
              <div>
                <Label className="text-xs font-inter">Fim da expedição</Label>
                <Input value={form.fim_expedicao} onChange={e => updateField('fim_expedicao', e.target.value)} placeholder="Horário ou descrição" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-inter">Ponto de Atenção</Label>
              <Textarea value={form.ponto_atencao} onChange={e => updateField('ponto_atencao', e.target.value)} placeholder="Observações relevantes..." rows={3} />
            </div>
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
            <Button type="submit" className="w-full font-inter font-semibold" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingReport ? 'Atualizar Reporte' : 'Salvar Reporte'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}