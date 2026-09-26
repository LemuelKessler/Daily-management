/**
 * Motivos de detalhamento do Leftover.
 * Fonte única de verdade para o formulário, validação e dashboards.
 *
 * category: classificação automática do motivo.
 *   - 'inbound'  → Leftover Inbound
 *   - 'outbound' → Leftover Outbound
 * O usuário não escolhe a categoria; ela é determinada pelo motivo.
 */

export const LEFTOVER_REASONS = [
  { key: 'on_hold',                    label: 'OnHold',                                              category: 'outbound' },
  { key: 'avaria',                    label: 'Avaria',                                              category: 'outbound' },
  { key: 'outro_hub',                 label: 'Outro HUB',                                           category: 'outbound' },
  { key: 'misscan',                   label: 'Misscan',                                             category: 'outbound' },
  { key: 'volumoso_nao_roteirizado',  label: 'Volumoso não roteirizado',                            category: 'outbound' },
  { key: 'fora_de_rota',              label: 'Fora de rota',                                        category: 'outbound' },
  { key: 'erro_etiquetagem',          label: 'Erro de etiquetagem',                                 category: 'outbound' },
  { key: 'erro_sorting',              label: 'Erro de sorting',                                     category: 'outbound' },
  { key: 'comercial',                 label: 'Comercial',                                           category: 'outbound' },
  { key: 'lh_atrasado',               label: 'LH atrasado',                                         category: 'inbound' },
  { key: 'lh_cortado_capacidade',     label: 'LH cortado por incapacidade operacional',             category: 'inbound' },
  { key: 'lh_nao_descarregado',      label: 'LH não descarregado',                                category: 'inbound' },
  { key: 'soc_transported',           label: 'SocTransported – (Pacote sistêmico sem físico)',      category: 'inbound' },
  { key: 'retirado_at_modal',         label: 'Retirado de AT (Modal incorreto)',                   category: 'outbound' },
  { key: 'retirado_at_capacidade',    label: 'Retirado de AT (Estouro de capacidade do veículo)',  category: 'outbound' },
  { key: 'erro_realocacao',           label: 'Erro de realocação',                                 category: 'outbound' },
  { key: 'backlog',                   label: 'Backlog',                                             category: 'outbound' },
];

export const LEFTOVER_INBOUND_KEYS = LEFTOVER_REASONS
  .filter((r) => r.category === 'inbound')
  .map((r) => r.key);

export const LEFTOVER_OUTBOUND_KEYS = LEFTOVER_REASONS
  .filter((r) => r.category === 'outbound')
  .map((r) => r.key);

export const LEFTOVER_REASONS_COUNT = LEFTOVER_REASONS.length;

/** Objeto com todos os motivos iniciando em zero. */
export function emptyLeftoverDetalhamento() {
  const obj = {};
  LEFTOVER_REASONS.forEach((r) => { obj[r.key] = 0; });
  return obj;
}

/** Soma os motivos a partir de um array de reports (cada um com leftover_detalhamento). */
export function sumDetalhamento(reports) {
  const sums = emptyLeftoverDetalhamento();
  (reports || []).forEach((r) => {
    const det = r && r.leftover_detalhamento;
    if (det && typeof det === 'object') {
      LEFTOVER_REASONS.forEach((reason) => {
        sums[reason.key] += Number(det[reason.key]) || 0;
      });
    }
  });
  return sums;
}

/** Soma total dos motivos de um objeto de detalhamento. */
export function detalhamentoTotal(detalhamento) {
  if (!detalhamento) return 0;
  return LEFTOVER_REASONS.reduce((s, r) => s + (Number(detalhamento[r.key]) || 0), 0);
}

/** Total de Leftover Inbound (soma dos motivos classificados como inbound). */
export function detalhamentoTotalInbound(detalhamento) {
  if (!detalhamento) return 0;
  return LEFTOVER_INBOUND_KEYS.reduce((s, k) => s + (Number(detalhamento[k]) || 0), 0);
}

/** Total de Leftover Outbound (soma dos motivos classificados como outbound). */
export function detalhamentoTotalOutbound(detalhamento) {
  if (!detalhamento) return 0;
  return LEFTOVER_OUTBOUND_KEYS.reduce((s, k) => s + (Number(detalhamento[k]) || 0), 0);
}

/** Ranking dos motivos do maior para o menor, já com a categoria de cada motivo. */
export function detalhamentoRanking(detalhamento) {
  return LEFTOVER_REASONS
    .map((r) => ({
      key: r.key,
      label: r.label,
      value: Number(detalhamento?.[r.key]) || 0,
      category: r.category,
    }))
    .sort((a, b) => b.value - a.value);
}