import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parseSemicolonCSV, mapRowToReport } from '@/lib/importReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ImportReport() {
  const [parsedRows, setParsedRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  const queryClient = useQueryClient();
  const { data: hubs = [] } = useQuery({
    queryKey: ['all-hubs'],
    queryFn: () => base44.entities.Hub.list(),
  });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseSemicolonCSV(text);
      const hubMap = new Map(hubs.map(h => [h.name.trim().toLowerCase(), h.id]));
      const mapped = rows
        .filter(r => r['Hub'] && r['Hub'].trim())
        .map(row => {
          const report = mapRowToReport(row);
          const hubId = hubMap.get((report.hub_name || '').trim().toLowerCase());
          return { ...report, hub_id: hubId || report.hub_name, _hubFound: !!hubId };
        });
      setParsedRows(mapped);
      setFileName(file.name);
      setResult(null);
      setProgress(null);
      if (mapped.length === 0) toast.warning('Nenhuma linha válida encontrada.');
    } catch (err) {
      toast.error('Erro ao ler o arquivo: ' + err.message);
    }
  };

  const stats = parsedRows ? {
    total: parsedRows.length,
    hubsNotFound: parsedRows.filter(r => !r._hubFound).length,
  } : null;

  const handleImport = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    setImporting(true);
    const batchSize = 400;
    let created = 0, errors = 0;
    setProgress({ done: 0, total: parsedRows.length, created: 0, errors: 0 });
    for (let i = 0; i < parsedRows.length; i += batchSize) {
      const chunk = parsedRows.slice(i, i + batchSize).map(({ _hubFound, ...r }) => r);
      try {
        await base44.entities.HubReport.bulkCreate(chunk);
        created += chunk.length;
      } catch (e) {
        errors += chunk.length;
      }
      setProgress({ done: Math.min(i + batchSize, parsedRows.length), total: parsedRows.length, created, errors });
    }
    setImporting(false);
    setResult({ created, errors, total: parsedRows.length });
    queryClient.invalidateQueries();
    if (created > 0) toast.success(`${created} reports importados!`);
    if (errors > 0) toast.error(`${errors} reports falharam.`);
  };

  const preview = parsedRows?.slice(0, 5) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></Link>
        <h1 className="text-2xl font-inter font-extrabold">Importar Relatórios</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl py-10 cursor-pointer hover:bg-muted/50 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-inter font-semibold text-sm">Selecionar arquivo CSV</p>
              <p className="text-xs text-muted-foreground">Delimitador: ponto e vírgula (;)</p>
            </div>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
          {fileName && (
            <p className="text-xs text-muted-foreground text-center mt-3 font-inter">
              Arquivo: <span className="font-semibold">{fileName}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total de linhas" value={stats.total} icon={FileSpreadsheet} />
          <StatCard label="Hubs não cadastrados" value={stats.hubsNotFound} icon={AlertTriangle} warning={stats.hubsNotFound > 0} />
          <StatCard label="Pronto para importar" value={stats.total} icon={CheckCircle2} />
        </div>
      )}

      {preview.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-inter">Pré-visualização (5 primeiras linhas)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Hub</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Ciclo</TableHead>
                  <TableHead className="text-xs text-right">Vol. Recebido</TableHead>
                  <TableHead className="text-xs text-right">Leftover</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((r, i) => (
                  <TableRow key={i} className="text-xs">
                    <TableCell className="font-medium">{r.hub_name}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.cycle}</TableCell>
                    <TableCell className="text-right">{r.volume_recebido ?? '-'}</TableCell>
                    <TableCell className="text-right">{r.leftover ?? '-'}</TableCell>
                    <TableCell>{r.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {progress && importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm font-inter">Importando... {progress.done}/{progress.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Criados: {progress.created} | Erros: {progress.errors}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className={result.errors > 0 ? 'border-amber-300' : 'border-green-300'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-6 h-6 ${result.errors > 0 ? 'text-amber-500' : 'text-green-600'}`} />
              <div>
                <p className="font-inter font-bold text-sm">Importação concluída</p>
                <p className="text-xs text-muted-foreground">
                  {result.created} reports criados, {result.errors} erros de {result.total} linhas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {parsedRows && parsedRows.length > 0 && !importing && !result && (
        <Button onClick={handleImport} className="w-full" size="lg">
          <Upload className="w-4 h-4 mr-2" /> Importar {parsedRows.length} reports
        </Button>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, warning }) {
  return (
    <Card className={warning ? 'border-amber-300' : ''}>
      <CardContent className="pt-4 pb-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${warning ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-inter">{label}</p>
          <p className="text-lg font-inter font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}