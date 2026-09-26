import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LeftoverCell from '@/components/ui/LeftoverCell';

export default function HubMonthlyTable({ data }) {
  if (!data || data.length === 0) return null;

  const monthNames = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-inter font-bold">Consolidado Mensal</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-inter text-xs">Mês</TableHead>
                <TableHead className="font-inter text-xs text-right">Recebido (Σ)</TableHead>
                <TableHead className="font-inter text-xs text-right">Processado (Σ)</TableHead>
                <TableHead className="font-inter text-xs text-right">Expedido (Σ)</TableHead>
                <TableHead className="font-inter text-xs text-right">PHD In (x̄)</TableHead>
                <TableHead className="font-inter text-xs text-right">PHD Out (x̄)</TableHead>
                <TableHead className="font-inter text-xs text-right">Leftover (Σ)</TableHead>
                <TableHead className="font-inter text-xs text-right">No Show (Σ)</TableHead>
                <TableHead className="font-inter text-xs text-right">Tot. Rotas (Σ)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m) => {
                const [year, month] = m.month.split('-');
                return (
                  <TableRow key={m.month} className="text-sm font-inter">
                    <TableCell className="font-medium">{monthNames[month]}/{year}</TableCell>
                    <TableCell className="text-right">{m.volume_recebido.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{m.processado.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{m.volume_expedido.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{m.phd_inbound.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{m.phd_outbound.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{m.leftover.toLocaleString()}</TableCell>
                    <TableCell className={`text-right ${(m.no_show || 0) > 0 ? 'text-destructive font-semibold' : ''}`}>{(m.no_show || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{(m.total_rotas || 0).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}