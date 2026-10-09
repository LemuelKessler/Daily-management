import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Save, Loader2, Plus, History, ChevronDown, ChevronUp, Trash2, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPortal } from 'react-dom';

const TARGET_FIELDS = [
  { key: 'phd',          label: 'PHD Outbound',    placeholder: 'Ex: 500' },
  { key: 'opsClockPct',  label: '% Ops Clock',     placeholder: 'Ex: 95'  },
  { key: 'leftoverHub',  label: '% Leftover',      placeholder: 'Ex: 2'   },
  { key: 'missorting',   label: '% Missorting',    placeholder: 'Ex: 0.5' },
  { key: 'bwt',          label: 'BWT (%)',          placeholder: 'Ex: 90'  },
  { key: 'absPct',       label: '% Absenteísmo',   placeholder: 'Ex: 5'   },
  { key: 'dailyWorkers', label: '% Daily Workers', placeholder: 'Ex: 20'  },
  { key: 'atsNoPiso',    label: '% ATS no Piso',   placeholder: 'Ex: 2'   },
];

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

function monthLabel(month, year) {
  return `${MONTH_NAMES[month - 1]}/${year}`;
}

function generateMonthOptions() {
  const options = [];
  const now = new Date();
  // 6 meses passados até 6 meses futuros
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    options.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return options;
}

// Tooltip de rastreabilidade do target
function TargetLastUpdateBadge({ target }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = React.useRef(null);

  if (!target?.updated_date && !target?.created_date) return null;

  const rawDate = target.updated_date || target.created_date;
  let displayDate = '-';
  let displayEmail = target.updated_by_email || target.created_by_email || '-';
  try {
    const d = typeof rawDate === 'string' ? new Date(rawDate.includes('T') ? rawDate : rawDate + 'T00:00:00') : new Date(rawDate);
    displayDate = format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {}

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    }
    setVisible(true);
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <Clock className="w-3.5 h-3.5" />
      </button>
      {visible && createPortal(
        <div
          className="fixed z-[9999] bg-slate-900 text-white text-[11px] font-inter rounded-lg shadow-xl px-3 py-2.5 pointer-events-none min-w-[200px]"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="font-semibold text-slate-300 mb-1">Última atualização</p>
          <p className="text-white">{displayDate}</p>
          {displayEmail !== '-' && (
            <p className="text-slate-400 mt-0.5 text-[10px]">{displayEmail}</p>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

// Linha de edição de um target específico (hub + mês + ano)
function HubTargetRow({ hub, existingTarget, month, year }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    const initial = {};
    TARGET_FIELDS.forEach(f => {
      initial[f.key] = existingTarget?.[f.key] != null ? String(existingTarget[f.key]) : '';
    });
    setForm(initial);
  }, [existingTarget]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      const now = new Date().toISOString();
      const data = {
        hub_id: hub.id, hub_name: hub.name, regional: hub.regional, month, year,
        updated_date: now,
        updated_by_email: me?.email || '',
      };
      TARGET_FIELDS.forEach(f => {
        data[f.key] = form[f.key] !== '' ? Number(form[f.key]) : null;
      });
      if (existingTarget?.id) {
        return base44.entities.HubTarget.update(existingTarget.id, data);
      } else {
        data.created_by_email = me?.email || '';
        data.created_date_custom = now;
        return base44.entities.HubTarget.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-targets'] });
      toast.success(`Targets do ${hub.name} (${monthLabel(month, year)}) salvos!`);
    },
    onError: (error) => {
      console.error('Erro ao salvar target:', error);
      toast.error(`Erro ao salvar: ${error?.message || 'Erro desconhecido'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => base44.entities.HubTarget.delete(existingTarget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-targets'] });
      toast.success(`🗑️ Target excluído.`);
    },
  });

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-inter font-bold text-sm text-slate-800">{hub.name}</p>
            <TargetLastUpdateBadge target={existingTarget} />
          </div>
          <p className="text-[10px] text-muted-foreground font-inter">{hub.regional} · {hub.tipo}</p>
        </div>
        <div className="flex gap-1.5">
          {existingTarget?.id && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs font-inter font-semibold"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="ml-1">Salvar</span>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TARGET_FIELDS.map(f => (
          <div key={f.key}>
            <Label className="text-[10px] font-inter font-semibold text-slate-600">{f.label}</Label>
            <Input
              type="number"
              step="0.01"
              value={form[f.key] || ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Seção de histórico: lista todos os targets por hub
function HistorySection({ allTargets, hubs }) {
  const [expandedHub, setExpandedHub] = useState(null);

  const hubMap = Object.fromEntries(hubs.map(h => [h.id, h]));

  // Agrupa targets por hub
  const byHub = useMemo(() => {
    const map = {};
    allTargets.forEach(t => {
      if (!map[t.hub_id]) map[t.hub_id] = [];
      map[t.hub_id].push(t);
    });
    // Ordena por ano desc, mês desc
    Object.values(map).forEach(arr => arr.sort((a, b) => b.year - a.year || b.month - a.month));
    return map;
  }, [allTargets]);

  const hubsWithTargets = Object.keys(byHub);
  if (hubsWithTargets.length === 0) {
    return <p className="text-xs text-muted-foreground font-inter text-center py-4">Nenhum target cadastrado ainda.</p>;
  }

  return (
    <div className="space-y-2">
      {hubsWithTargets.map(hubId => {
        const hub = hubMap[hubId];
        const hubName = hub?.name || byHub[hubId][0]?.hub_name || hubId;
        const isExpanded = expandedHub === hubId;
        return (
          <div key={hubId} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedHub(isExpanded ? null : hubId)}
            >
              <span className="font-inter font-semibold text-sm text-slate-800">{hubName}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-inter">{byHub[hubId].length} período(s)</span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            {isExpanded && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {byHub[hubId].map(t => (
                  <div key={t.id} className="px-4 py-2.5 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-inter font-semibold text-xs text-primary">{monthLabel(t.month, t.year)}</p>
                      {(t.updated_date || t.created_date) && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-inter">
                          <Clock className="w-3 h-3" />
                          <span>
                            {(() => {
                              try {
                                const raw = t.updated_date || t.created_date;
                                const d = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
                                return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
                              } catch { return '-'; }
                            })()}
                            {(t.updated_by_email || t.created_by_email) && ` · ${t.updated_by_email || t.created_by_email}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
                      {TARGET_FIELDS.map(f => t[f.key] != null && (
                        <div key={f.key} className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground font-inter">{f.label}:</span>
                          <span className="text-[10px] font-inter font-semibold text-slate-700">{t[f.key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TargetsModal({ regional, onClose, initialMonth, initialYear }) {
  const now = new Date();
  const [tab, setTab] = useState('edit'); // 'edit' | 'history'
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || (now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(initialYear || now.getFullYear());
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const { data: hubs = [] } = useQuery({
    queryKey: ['hubs', regional],
    queryFn: () => base44.entities.Hub.filter({ regional }),
  });

  const { data: allTargets = [] } = useQuery({
    queryKey: ['hub-targets'],
    queryFn: () => base44.entities.HubTarget.list(),
  });

  // Targets do mês/ano selecionado
  const targetByHubId = useMemo(() => {
    const map = {};
    allTargets.forEach(t => {
      if (t.month === selectedMonth && t.year === selectedYear) {
        map[t.hub_id] = t;
      }
    });
    return map;
  }, [allTargets, selectedMonth, selectedYear]);

  const sortedHubs = [...hubs].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-inter flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Targets por HUB · {regional}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-inter font-semibold transition-colors ${tab === 'edit' ? 'bg-white shadow text-slate-800' : 'text-muted-foreground hover:text-slate-700'}`}
            onClick={() => setTab('edit')}
          >
            <Plus className="w-3 h-3" /> Cadastrar / Editar Metas
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-inter font-semibold transition-colors ${tab === 'history' ? 'bg-white shadow text-slate-800' : 'text-muted-foreground hover:text-slate-700'}`}
            onClick={() => setTab('history')}
          >
            <History className="w-3 h-3" /> Histórico de Metas
          </button>
        </div>

        {tab === 'edit' && (
          <>
            {/* Seletor de Mês/Ano */}
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex-1">
                <p className="text-xs font-inter font-bold text-slate-700 mb-0.5">Período das metas</p>
                <p className="text-[10px] text-muted-foreground font-inter">Selecione o mês/ano para cadastrar ou editar as metas. Meses anteriores são preservados.</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={`${selectedMonth}-${selectedYear}`}
                  onValueChange={v => {
                    const [m, y] = v.split('-').map(Number);
                    setSelectedMonth(m);
                    setSelectedYear(y);
                  }}
                >
                  <SelectTrigger className="h-8 w-44 text-xs font-inter font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(opt => (
                      <SelectItem key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`} className="text-xs">
                        {monthLabel(opt.month, opt.year)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 mt-1">
              {sortedHubs.length === 0 ? (
                <p className="text-sm text-muted-foreground font-inter text-center py-8">Nenhum hub cadastrado nesta regional.</p>
              ) : (
                sortedHubs.map(hub => (
                  <HubTargetRow
                    key={`${hub.id}-${selectedMonth}-${selectedYear}`}
                    hub={hub}
                    existingTarget={targetByHubId[hub.id]}
                    month={selectedMonth}
                    year={selectedYear}
                  />
                ))
              )}
            </div>
          </>
        )}

        {tab === 'history' && (
          <HistorySection allTargets={allTargets} hubs={hubs} />
        )}
      </DialogContent>
    </Dialog>
  );
}