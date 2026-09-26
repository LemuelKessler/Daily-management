/**
 * Utilitários centrais para consolidação de reports.
 *
 * Regras:
 * - No Show e Leftover NÃO somam AM+PM. Usa-se o último ciclo com janela (PM > AM).
 * - Volumes, Total Rotas: somam AM+PM.
 * - HC: soma AM+PM.
 * - PHD Inbound  = Volume Recebido Total / HC Total  (quando HC > 0)
 * - PHD Outbound = Volume Expedido Total / HC Total  (quando HC > 0)
 * - OpsClock: usa o último ciclo (mesmo critério de No Show).
 */

/**
 * Dado um array de reports de um mesmo hub/dia, consolida em um único objeto.
 */
import { LEFTOVER_REASONS, emptyLeftoverDetalhamento } from '@/lib/leftoverReasons';

export function consolidateHubReports(reports) {
  if (!reports || reports.length === 0) return null;

  const sorted = [...reports].sort((a, b) => {
    const order = { AM: 0, PM: 1 };
    return (order[a.cycle] ?? 0) - (order[b.cycle] ?? 0);
  });

  // Último ciclo com janela para No Show / Leftover / OpsClock
  const pmReport = sorted.find(r => r.cycle === 'PM' && !r.sem_janela);
  const amReport = sorted.find(r => r.cycle === 'AM' && !r.sem_janela);
  const pmFallback = sorted.find(r => r.cycle === 'PM');
  const amFallback = sorted.find(r => r.cycle === 'AM');
  const lastReport = pmReport || amReport || pmFallback || amFallback || sorted[sorted.length - 1];

  let volume_recebido = 0, processado = 0, volume_expedido = 0, total_rotas = 0, hc_total = 0;
  let colaboradores_total = 0, diaristas_total = 0, sinergia_total = 0, absenteismo_total = 0;
  let rotas_fora_ops_clock_sum = 0;
  let forecast_total = 0;
  let ponto_atencao_parts = [];
  let status = 'concluido';

  sorted.forEach(r => {
    volume_recebido    += r.volume_recebido    || 0;
    processado         += r.processado         || 0;
    volume_expedido    += r.volume_expedido    || 0;
    total_rotas        += r.total_rotas        || 0;
    hc_total           += r.hc                || 0;
    colaboradores_total += r.colaboradores     || 0;
    diaristas_total    += r.diaristas          || 0;
    sinergia_total     += r.sinergia_recebida  || 0;
    absenteismo_total  += r.absenteismo        || 0;
    forecast_total     += r.forecast           || 0;
    // OpsClock: soma rotas fora para recalcular com fórmula correta
    if (!r.sem_janela) rotas_fora_ops_clock_sum += r.rotas_fora_ops_clock || 0;
    if (r.ponto_atencao) ponto_atencao_parts.push(r.ponto_atencao);
    if (r.status === 'em_andamento') status = 'em_andamento';
  });

  // PHD calculado sobre totais do dia
  const phd_inbound  = hc_total > 0 ? volume_recebido  / hc_total : 0;
  const phd_outbound = hc_total > 0 ? volume_expedido / hc_total : 0;
  // OpsClock = ((Total Rotas - Rotas Fora) / Total Rotas) * 100
  const ops_clock = total_rotas > 0
    ? ((total_rotas - rotas_fora_ops_clock_sum) / total_rotas) * 100
    : null;

  return {
    ...lastReport,
    forecast: forecast_total || null,
    volume_recebido,
    processado,
    volume_expedido,
    total_rotas,
    hc: hc_total,
    colaboradores: colaboradores_total,
    diaristas: diaristas_total,
    sinergia_recebida: sinergia_total,
    absenteismo: absenteismo_total,
    rotas_fora_ops_clock: rotas_fora_ops_clock_sum,
    // No Show e Leftover: apenas último ciclo com janela
    no_show:     lastReport.no_show     || 0,
    leftover:    lastReport.leftover    || 0,
    leftover_obs: lastReport.leftover_obs || '',
    leftover_detalhamento: lastReport.leftover_detalhamento || null,
    ops_clock,
    phd_inbound,
    phd_outbound,
    ponto_atencao: ponto_atencao_parts.filter(Boolean).join(' | '),
    status,
    sem_janela: false,
    _ids: sorted.map(r => r.id),
    _count: sorted.length,
    _lastCycle: lastReport.cycle,
  };
}

/**
 * Consolida reports de um hub ao longo de um PERÍODO (múltiplos dias).
 *
 * Regras:
 * - Agrupa por data e consolida cada dia com consolidateHubReports (regra aba TOTAL por dia).
 * - Soma os valores diários consolidados: Leftover e No Show usam a aba TOTAL de cada dia
 *   (último ciclo válido), depois são somados ao longo do período.
 * - Volumes, HC, Diaristas, Absenteísmo, Missorting, Rotas: somados diretamente.
 * - BWT: mantém o valor do último dia.
 */
export function consolidatePeriodReports(reports) {
  if (!reports || reports.length === 0) return null;

  // Agrupa por data
  const byDate = {};
  reports.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push(r);
  });

  // Consolida cada dia separadamente (regra aba TOTAL por dia)
  const daily = Object.values(byDate)
    .map(dayReports => consolidateHubReports(dayReports))
    .filter(Boolean)
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  if (daily.length === 0) return null;
  if (daily.length === 1) return daily[0];

  const lastDay = daily[daily.length - 1];

  let volume_recebido = 0, processado = 0, volume_expedido = 0, total_rotas = 0, hc_total = 0;
  let colaboradores_total = 0, diaristas_total = 0, sinergia_total = 0, absenteismo_total = 0;
  let rotas_fora_ops_clock_sum = 0, forecast_total = 0;
  let no_show_total = 0, leftover_total = 0, missorting_total = 0;
  const leftover_detalhamento_sums = emptyLeftoverDetalhamento();
  let ponto_atencao_parts = [];
  let status = 'concluido';

  daily.forEach(r => {
    volume_recebido    += r.volume_recebido    || 0;
    processado         += r.processado         || 0;
    volume_expedido    += r.volume_expedido    || 0;
    total_rotas        += r.total_rotas        || 0;
    hc_total           += r.hc                 || 0;
    colaboradores_total += r.colaboradores    || 0;
    diaristas_total    += r.diaristas          || 0;
    sinergia_total     += r.sinergia_recebida  || 0;
    absenteismo_total  += r.absenteismo       || 0;
    rotas_fora_ops_clock_sum += r.rotas_fora_ops_clock || 0;
    forecast_total     += r.forecast           || 0;
    no_show_total      += r.no_show            || 0;
    leftover_total     += r.leftover           || 0;
    missorting_total   += r.missorting         || 0;
    if (r.leftover_detalhamento) {
      LEFTOVER_REASONS.forEach(reason => {
        leftover_detalhamento_sums[reason.key] += Number(r.leftover_detalhamento[reason.key]) || 0;
      });
    }
    if (r.ponto_atencao) ponto_atencao_parts.push(r.ponto_atencao);
    if (r.status === 'em_andamento') status = 'em_andamento';
  });

  const phd_inbound  = hc_total > 0 ? volume_recebido  / hc_total : 0;
  const phd_outbound = hc_total > 0 ? volume_expedido / hc_total : 0;
  const ops_clock = total_rotas > 0
    ? ((total_rotas - rotas_fora_ops_clock_sum) / total_rotas) * 100
    : null;

  return {
    ...lastDay,
    forecast: forecast_total || null,
    volume_recebido,
    processado,
    volume_expedido,
    total_rotas,
    hc: hc_total,
    colaboradores: colaboradores_total,
    diaristas: diaristas_total,
    sinergia_recebida: sinergia_total,
    absenteismo: absenteismo_total,
    rotas_fora_ops_clock: rotas_fora_ops_clock_sum,
    no_show: no_show_total,
    leftover: leftover_total,
    leftover_detalhamento: leftover_detalhamento_sums,
    missorting: missorting_total,
    ops_clock,
    phd_inbound,
    phd_outbound,
    ponto_atencao: ponto_atencao_parts.filter(Boolean).join(' | '),
    status,
    sem_janela: false,
    _days: daily.length,
  };
}

/**
 * Consolida um array de reports já consolidados por hub para o painel regional.
 */
export function consolidateRegionalReports(hubReports) {
  if (!hubReports || hubReports.length === 0) return null;

  let volume_recebido = 0, processado = 0, volume_expedido = 0;
  let no_show = 0, total_rotas = 0, leftover = 0, hc_total = 0;
  let rotas_fora_sum = 0;
  const leftover_detalhamento_sums = emptyLeftoverDetalhamento();

  hubReports.forEach(r => {
    volume_recebido += r.volume_recebido || 0;
    processado      += r.processado      || 0;
    volume_expedido += r.volume_expedido || 0;
    no_show         += r.no_show         || 0;
    total_rotas     += r.total_rotas     || 0;
    leftover        += r.leftover        || 0;
    hc_total        += r.hc             || 0;
    rotas_fora_sum  += r.rotas_fora_ops_clock || 0;
    if (r.leftover_detalhamento) {
      LEFTOVER_REASONS.forEach(reason => {
        leftover_detalhamento_sums[reason.key] += Number(r.leftover_detalhamento[reason.key]) || 0;
      });
    }
  });

  const phd_inbound  = hc_total > 0 ? volume_recebido  / hc_total : 0;
  const phd_outbound = hc_total > 0 ? volume_expedido / hc_total : 0;
  const ops_clock = total_rotas > 0
    ? ((total_rotas - rotas_fora_sum) / total_rotas) * 100
    : null;

  return {
    volume_recebido,
    processado,
    volume_expedido,
    no_show,
    total_rotas,
    leftover,
    leftover_detalhamento: leftover_detalhamento_sums,
    hc: hc_total,
    phd_inbound,
    phd_outbound,
    ops_clock,
  };
}