/* Texto do fechamento do mês formatado para colar no WhatsApp. */
import { moeda } from '../../utils/format';

export function gerarMsgWPP(dados, nomeMes, ano, djNome, isBraichi, imposto) {
  const sep = '━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  const fmtDDMM = d => {
    if (!d) return '—';
    const p = d.toString().split('-');
    return `${p[2]}/${p[1]}`;
  };
  const lines = [
    sep,
    `🎧 *FECHAMENTO MENSAL — ${djNome.toUpperCase()} DJ*`,
    `📅 *${nomeMes} / ${ano}*`,
    sep,
    `*${dados.quantidadeShows} show${dados.quantidadeShows !== 1 ? 's' : ''} realizado${dados.quantidadeShows !== 1 ? 's' : ''}*`,
    '',
    '📋 *SHOWS DO MÊS:*',
  ];
  dados.shows.forEach((s, i) => {
    const local = s.endereco || s.contratante || '—';
    const cache = s.cache ? moeda(s.cache) : 'A definir';
    lines.push(`*${i + 1}. ${(s.evento || '—').toUpperCase()}* — ${fmtDDMM(s.data)} / 📍 ${local} · ${cache}`);
  });
  lines.push('');
  lines.push('💰 *RESUMO FINANCEIRO:*');
  lines.push(`💵 Total Bruto: *${moeda(dados.totalBruto)}*`);
  if (isBraichi) {
    lines.push(`🎛️ Daniel (10%): *${moeda(dados.totalDaniel)}*`);
    if (dados.totalProdutor > 0) lines.push(`🎚️ Produtor: *${moeda(dados.totalProdutor)}*`);
  } else {
    lines.push(`👤 Daniel: *${moeda(dados.totalDaniel)}*`);
    if (dados.totalYuri > 0) lines.push(`👤 Yuri: *${moeda(dados.totalYuri)}*`);
  }
  if (dados.totalCustos > 0) lines.push(`📦 Outros Custos: *${moeda(dados.totalCustos)}*`);
  if (dados.totalImpostos > 0) lines.push(`🧾 Impostos (${imposto}%): *${moeda(dados.totalImpostos)}*`);
  lines.push(`✅ *Lucro Líquido: ${moeda(dados.lucroLiquido)}*`);
  lines.push(sep);
  return lines.join('\n');
}
