import React, { useState } from 'react';
import { Code, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportSourceCode } from '@/lib/exportSource';

export default function ExportSourceButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSourceCode();
      toast.success('Código fonte exportado!');
    } catch (e) {
      toast.error('Erro ao exportar: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 text-xs font-inter font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm disabled:opacity-50"
    >
      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Code className="w-3.5 h-3.5" />}
      Exportar
    </button>
  );
}