import { useState } from 'react';
import { getFechamento } from '../services/api';
import { gerarPDFFechamento } from '../services/pdfService';

const MESES = [
  {value:1,label:'Janeiro'},{value:2,label:'Fevereiro'},{value:3,label:'Março'},
  {value:4,label:'Abril'},{value:5,label:'Maio'},{value:6,label:'Junho'},
  {value:7,label:'Julho'},{value:8,label:'Agosto'},{value:9,label:'Setembro'},
  {value:10,label:'Outubro'},{value:11,label:'Novembro'},{value:12,label:'Dezembro'},
];

function moeda(v) {
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
}

function fmtData(d) {
  if (!d) return '—';
  return d.toString().split('-').reverse().join('/');
}

function abrirMaps(endereco) {
  if (!endereco) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
  window.open(url, '_blank');
}

export default function FechamentoMensal() {
  const hoje = new Date();
  const [mes,        setMes]        = useState(hoje.getMonth()+1);
  const [ano,        setAno]        = useState(hoje.getFullYear());
  const [imposto,    setImposto]    = useState('');
  const [dados,      setDados]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState('');
  const [gerandoPDF, setGerandoPDF] = useState(false);

  async function buscar() {
    setErro(''); setDados(null); setLoading(true);
    try {
      const aliquota = imposto ? parseFloat(imposto) : null;
      setDados(await getFechamento(mes, ano, aliquota));
    } catch (err) { setErro(err.message); }
    finally { setLoading(false); }
  }

  async function exportarPDF() {
    if (!dados) return;
    setGerandoPDF(true);
    try { await gerarPDFFechamento(dados); }
    catch (err) { alert('Erro ao gerar PDF: ' + err.message); }
    finally { setGerandoPDF(false); }
  }

  const nomeMes = MESES.find(m => m.value === Number(mes))?.label;

  return (
    <div className="card">
      <h2 className="card-title"><span className="icon">💰</span>Fechamento Mensal</h2>

      <div className="filtro-row">
        <div className="form-group">
          <label>Mês</label>
          <select value={mes} onChange={e=>setMes(e.target.value)} className="input">
            {MESES.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Ano</label>
          <input type="number" value={ano} onChange={e=>setAno(e.target.value)}
            className="input" min="2020" max="2099"/>
        </div>
        <div className="form-group">
          <label>Imposto sobre NF (%)</label>
          <input type="number" value={imposto} onChange={e=>setImposto(e.target.value)}
            className="input" placeholder="Ex: 6" min="0" max="100" step="0.1"/>
        </div>
        <button className="btn btn-primary btn-buscar" onClick={buscar} disabled={loading}>
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      {erro && <div className="alert alert-erro">{erro}</div>}

      {dados && (
        <div className="fechamento-resultado">
          <div className="fechamento-header">
            <h3 className="fechamento-titulo">
              {nomeMes} / {ano} — {dados.quantidadeShows} show{dados.quantidadeShows!==1?'s':''}
            </h3>
            <button className="btn btn-pdf" onClick={exportarPDF} disabled={gerandoPDF}>
              {gerandoPDF ? '⏳ Gerando...' : '📄 Exportar PDF'}
            </button>
          </div>

          <div className="cards-grid">
            <div className="resultado-card resultado-bruto">
              <div className="resultado-label">Total Bruto</div>
              <div className="resultado-valor">{moeda(dados.totalBruto)}</div>
            </div>
            <div className="resultado-card resultado-daniel">
              <div className="resultado-label">Daniel</div>
              <div className="resultado-valor">{moeda(dados.totalDaniel)}</div>
              <div className="resultado-detalhe">15% + R$40 transporte/dia</div>
            </div>
            <div className="resultado-card resultado-yuri">
              <div className="resultado-label">Yuri</div>
              <div className="resultado-valor">{moeda(dados.totalYuri)}</div>
              <div className="resultado-detalhe">R$300 fixo por show</div>
            </div>
            {dados.totalCustos > 0 && (
              <div className="resultado-card resultado-custos">
                <div className="resultado-label">Outros Custos</div>
                <div className="resultado-valor">{moeda(dados.totalCustos)}</div>
              </div>
            )}
            {dados.totalImpostos > 0 && (
              <div className="resultado-card resultado-imposto">
                <div className="resultado-label">Impostos ({imposto}%)</div>
                <div className="resultado-valor">{moeda(dados.totalImpostos)}</div>
                <div className="resultado-detalhe">Deduzido do lucro líquido</div>
              </div>
            )}
            <div className={`resultado-card ${dados.lucroLiquido>=0?'resultado-lucro':'resultado-prejuizo'}`}>
              <div className="resultado-label">Lucro Líquido</div>
              <div className="resultado-valor">{moeda(dados.lucroLiquido)}</div>
            </div>
          </div>

          {dados.shows.length > 0 && (
            <div className="shows-fechamento">
              <h4>Shows do período</h4>

              <table className="fechamento-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Evento</th>
                    <th>Local</th>
                    <th>Cachê</th>
                    <th>XDJ</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dados.shows.map(s => (
                    <tr key={s.id}>
                      <td className="data-cell">{fmtData(s.data)}</td>
                      <td>{s.evento || '—'}</td>
                      <td className="muted-cell">{s.endereco || s.contratante || '—'}</td>
                      <td className="cache-cell">
                        {s.cache ? moeda(s.cache) : <span className="sem-valor">—</span>}
                      </td>
                      <td style={{textAlign:'center'}}>
                        {s.xdj ? <span style={{color:'var(--green)'}}>✓</span> : <span className="sem-valor">—</span>}
                      </td>
                      <td>
                        <span className="status-mini" data-status={s.status}>{s.status||'—'}</span>
                      </td>
                      <td>
                        {s.endereco && (
                          <button className="btn-maps" onClick={()=>abrirMaps(s.endereco)}
                            title="Abrir no Google Maps">
                            🗺️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="fechamento-cards-mobile">
                {dados.shows.map(s => (
                  <div key={s.id} className="fech-card-mobile">
                    <div className="fech-card-top">
                      <span className="fech-card-data">{fmtData(s.data)}</span>
                      <span className="status-mini" data-status={s.status}>{s.status||'—'}</span>
                    </div>
                    <div className="fech-card-evento">{s.evento || '—'}</div>
                    <div className="fech-card-bottom">
                      <span className="fech-card-local">
                        {s.endereco || s.contratante || '—'}
                        {s.endereco && (
                          <button className="btn-maps" onClick={()=>abrirMaps(s.endereco)}>🗺️</button>
                        )}
                      </span>
                      <span className="fech-card-cache">
                        {s.cache ? moeda(s.cache) : '—'}
                      </span>
                    </div>
                    {s.xdj && <div style={{fontSize:11,color:'var(--green)',marginTop:4}}>✓ XDJ incluso</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
