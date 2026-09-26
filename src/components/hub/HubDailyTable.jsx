import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import LeftoverCell from '@/components/ui/LeftoverCell';

export default function HubDailyTable({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-inter font-bold">Dados por Dia</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-inter text-xs">Data</TableHead>
                <TableHead className="font-inter text-xs text-right">Recebido</TableHead>
                <TableHead className="font-inter text-xs text-right">Processado</TableHead>
                <TableHead className="font-inter text-xs text-right">Expedido</TableHead>
                <TableHead className="font-inter text-xs text-right">PHD In</TableHead>
                <TableHead className="font-inter text-xs text-right">PHD Out</TableHead>
                <TableHead className="font-inter text-xs text-right">Leftover</TableHead>
                <TableHead className="font-inter text-xs text-right">No Show</TableHead>
                <TableHead className="font-inter text-xs text-right">Tot. Rotas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.date} className="text-sm font-inter">
                  <TableCell className="font-medium">{format(parseISO(r.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">{r.volume_recebido?.toLocaleString() ?? '-'}</TableCell>
                  <TableCell className="text-right">{r.processado?.toLocaleString() ?? '-'}</TableCell>
                  <TableCell className="text-right">{r.volume_expedido?.toLocaleString() ?? '-'}</TableCell>
                  <TableCell className={`text-right ${(r.phd_inbound || 0) > 5 ? 'text-destructive font-semibold' : ''}`}>
                    {r.phd_inbound != null ? Number(r.phd_inbound).toFixed(1) : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${(r.phd_outbound || 0) > 5 ? 'text-destructive font-semibold' : ''}`}>
                    {r.phd_outbound != null ? Number(r.phd_outbound).toFixed(1) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <LeftoverCell value={r.leftover ?? 0} obs={r.leftover_obs} warn={(r.leftover || 0) > 0} />
                  </TableCell>
                  <TableCell className={`text-right ${(r.no_show || 0) > 0 ? 'text-destructive font-semibold' : ''}`}>{r.no_show ?? 0}</TableCell>
                  <TableCell className="text-right">{r.total_rotas ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}