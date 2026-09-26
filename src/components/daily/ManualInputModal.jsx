import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export default function ManualInputModal({ hub, existing, onSave, onClose }) {
  const [form, setForm] = useState({
    missorting:      existing.missorting      ?? '',
    dsD0:            existing.dsD0            ?? '',
    spr:             existing.spr             ?? '',
    leftoverOverCap: existing.leftoverOverCap ?? '',
    leakedVolume:    existing.leakedVolume    ?? '',
    bwt:             existing.bwt            ?? '',
  });

  const upd = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = () => {
    const parsed = {};
    Object.entries(form).forEach(([k, v]) => {
      parsed[k] = v !== '' ? Number(v) : null;
    });
    onSave(parsed);
  };

  const numField = (label, field, placeholder, hint) => (
    <div>
      <Label className="text-xs font-inter font-semibold">{label}</Label>
      {hint && <p className="text-[10px] text-muted-foreground font-inter mb-1">{hint}</p>}
      <Input
        type="number"
        step="0.01"
        value={form[field]}
        onChange={e => upd(field, e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-inter flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Inputs Manuais — {hub.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 text-[11px] text-muted-foreground font-inter bg-muted/40 rounded-lg px-3 py-2 mb-2">
          Estes indicadores não são calculados automaticamente e devem ser preenchidos manualmente após cada operação.
        </div>
        <div className="space-y-3">
          {numField('% Missorting', 'missorting', 'Ex: 0.5', 'Percentual de missorting da operação')}
          {numField('% DS D0', 'dsD0', 'Ex: 95.0', 'Percentual de delivery success no D0')}
          {numField('SPR (%)', 'spr', 'Ex: 97.0', 'Success Pickup Rate')}
          {numField('% Leftover Over Cap', 'leftoverOverCap', 'Ex: 1.5', 'Percentual de leftover sobre capacidade')}
          {numField('% Leaked Volume', 'leakedVolume', 'Ex: 0.8', 'Percentual de volume vazado')}
          {numField('BWT (%)', 'bwt', 'Ex: 90.0', 'Better Way Together — adesão processo')}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 font-inter text-sm" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 font-inter font-semibold text-sm" onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}