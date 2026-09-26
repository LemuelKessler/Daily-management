import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function HubManagement() {
  const [name, setName] = useState('');
  const [regional, setRegional] = useState('Regional 1');
  const [tipo, setTipo] = useState('LM');
  const [editingHub, setEditingHub] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: hubs = [], isLoading } = useQuery({
    queryKey: ['all-hubs'],
    queryFn: () => base44.entities.Hub.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hub.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-hubs'] });
      toast.success('Hub criado!');
      setName('');
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hub.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-hubs'] });
      toast.success('Hub atualizado!');
      setEditingHub(null);
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Hub.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-hubs'] });
      toast.success('Hub excluído!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingHub) {
      updateMutation.mutate({ id: editingHub.id, data: { name, regional, tipo } });
    } else {
      createMutation.mutate({ name, regional, tipo });
    }
  };

  const startEdit = (hub) => {
    setEditingHub(hub);
    setName(hub.name);
    setRegional(hub.regional);
    setTipo(hub.tipo || 'LM');
    setDialogOpen(true);
  };

  const startCreate = () => {
    setEditingHub(null);
    setName('');
    setRegional('Regional 1');
    setTipo('LM');
    setDialogOpen(true);
  };



  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-inter font-extrabold text-foreground">Gestão de Hubs</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate}>
              <Plus className="w-4 h-4 mr-2" /> Novo Hub
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-inter">{editingHub ? 'Editar Hub' : 'Novo Hub'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-inter">Nome do Hub</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: LRJ-02" />
              </div>
              <div>
                <Label className="text-xs font-inter">Regional</Label>
                <Select value={regional} onValueChange={setRegional}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regional 1">Regional 1</SelectItem>
                    <SelectItem value="Regional 2">Regional 2</SelectItem>
                    <SelectItem value="Regional 3">Regional 3</SelectItem>
                    <SelectItem value="Regional 4">Regional 4</SelectItem>
                    <SelectItem value="Regional ES 01">Regional ES 01</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-inter">Tipo Operacional</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LM">LM — Last Mile</SelectItem>
                    <SelectItem value="FM">FM — First Mile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingHub ? 'Atualizar' : 'Criar Hub'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <HubTable title="Regional 1" hubs={hubs.filter(h => h.regional === 'Regional 1')} isLoading={isLoading} onEdit={startEdit} onDelete={id => deleteMutation.mutate(id)} />
      <HubTable title="Regional 2" hubs={hubs.filter(h => h.regional === 'Regional 2')} isLoading={isLoading} onEdit={startEdit} onDelete={id => deleteMutation.mutate(id)} />
      <HubTable title="Regional 3" hubs={hubs.filter(h => h.regional === 'Regional 3')} isLoading={isLoading} onEdit={startEdit} onDelete={id => deleteMutation.mutate(id)} />
      <HubTable title="Regional 4" hubs={hubs.filter(h => h.regional === 'Regional 4')} isLoading={isLoading} onEdit={startEdit} onDelete={id => deleteMutation.mutate(id)} />
      <HubTable title="Regional ES 01" hubs={hubs.filter(h => h.regional === 'Regional ES 01')} isLoading={isLoading} onEdit={startEdit} onDelete={id => deleteMutation.mutate(id)} />
    </div>
  );
}

function HubTable({ title, hubs, isLoading, onEdit, onDelete }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-inter font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-inter text-xs">Nome</TableHead>
              <TableHead className="font-inter text-xs">Tipo</TableHead>
              <TableHead className="font-inter text-xs text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground font-inter text-sm">Carregando...</TableCell></TableRow>
            ) : hubs.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground font-inter text-sm">Nenhum hub</TableCell></TableRow>
            ) : (
              hubs.map(h => (
                <TableRow key={h.id} className="text-sm font-inter">
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.tipo === 'FM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {h.tipo || 'LM'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(h)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(h.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}