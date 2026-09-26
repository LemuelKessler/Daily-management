/**
 * Parser e mapeador para importação de relatórios retroativos via CSV (ponto e vírgula).
 */

const COLUMN_MAP = {
  'Hub': 'hub_name',
  'Regional': 'regional',
  'Data': 'date',
  'Ciclo': 'cycle',
  'Sem Janela': 'sem_janela',
  'Forecast': 'forecast',
  'Volume Recebido': 'volume_recebido',
  'Processado': 'processado',
  'Volume Expedido': 'volume_expedido',
  'Colaboradores': 'colaboradores',
  'Diaristas': 'diaristas',
  'Sinergia Recebida': 'sinergia_recebida',
  'Sinergia Enviada': 'sinergia_enviada',
  'Absenteísmo': 'absenteismo',
  'HC': 'hc',
  'PHD Inbound': 'phd_inbound',
  'PHD Outbound': 'phd_outbound',
  'No Show': 'no_show',
  'Total Rotas': 'total_rotas',
  'Rotas Fora Ops Clock': 'rotas_fora_ops_clock',
  'Início Expedição': 'inicio_expedicao',
  'Fim Expedição': 'fim_expedicao',
  'Ops Clock': 'ops_clock',
  'Leftover': 'leftover',
  'Leftover Obs': 'leftover_obs',
  'Missorting': 'missorting',
  'BWT': 'bwt',
  'Ponto de Atenção': 'ponto_atencao',
  'Status': 'status',
};

const NUMERIC_FIELDS = new Set([
  'forecast', 'volume_recebido', 'processado', 'volume_expedido',
  'colaboradores', 'diaristas', 'sinergia_recebida', 'absenteismo',
  'hc', 'phd_inbound', 'phd_outbound', 'no_show', 'total_rotas',
  'rotas_fora_ops_clock', 'ops_clock', 'leftover', 'bwt',
]);

const INTEGER_FIELDS = new Set(['sinergia_enviada', 'missorting']);

function toNumber(val) {
  if (val == null || val === '') return null;
  const n = parseFloat(String(val).replace(/,/g, '.'));
  return isNaN(n) ? null : n;
}

function toInteger(val) {
  if (val == null || val === '') return null;
  const n = parseInt(String(val).replace(/,/g, '.'), 10);
  return isNaN(n) ? null : n;
}

/**
 * Parser de CSV delimitado por ponto e vírgula.
 * Suporta campos entre aspas com quebras de linha e aspas escapadas ("").
 */
export function parseSemicolonCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ';') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\r') {
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  while (rows.length > 0 && rows[rows.length - 1].every(c => c === '')) {
    rows.pop();
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? r[idx] : '';
    });
    return obj;
  });
}

/**
 * Mapeia uma linha do CSV para o formato do HubReport.
 */
export function mapRowToReport(row) {
  const report = {};
  Object.entries(COLUMN_MAP).forEach(([csvCol, field]) => {
    const raw = row[csvCol] ?? '';
    if (field === 'sem_janela') {
      report[field] = raw.trim().toLowerCase() === 'sim';
    } else if (field === 'status') {
      const s = raw.trim().toLowerCase();
      report[field] = s === 'concluido' || s === 'em_andamento' ? s : 'em_andamento';
    } else if (field === 'cycle') {
      const c = raw.trim().toUpperCase();
      report[field] = c === 'AM' || c === 'PM' ? c : 'AM';
    } else if (field === 'regional') {
      report[field] = raw.trim();
    } else if (NUMERIC_FIELDS.has(field)) {
      report[field] = toNumber(raw);
    } else if (INTEGER_FIELDS.has(field)) {
      report[field] = toInteger(raw);
    } else {
      report[field] = raw.trim();
    }
  });
  return report;
}