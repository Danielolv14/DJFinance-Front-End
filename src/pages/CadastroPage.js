import { useState, useEffect } from 'react';
import { createShow, updateShow } from '../services/api';
import FormField from '../components/FormField';
import SectionHeader from '../components/SectionHeader';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];


const STATUS_OPCOES = [
  { value: 'CONFIRMADO', label: 'Confirmado', color: '#34d399' },
  { value: 'PENDENTE',   label: 'Pendente',   color: '#fbbf24' },
  { value: 'CANCELADO',  label: 'Cancelado',  color: '#f87171' },
];

const VAZIO = {
  nome:'', data:'', ano: new Date().getFullYear(), mes: new Date().getMonth()+1,
  duracao:'', cache:'', xdj:false, adiantamento:false, valorAdiantamento:'',
  contratante:'', endereco:'', rider:'', custos:'', observacoes:'',
};

function calcularDuracao(inicio, termino) {
  if (!inicio || !termino) return '';
  const [h1,m1] = inicio.split(':').map(Number);
  const [h2,m2] = termino.split(':').map(Number);
  let totalMin = (h2*60+m2) - (h1*60+m1);
  if (totalMin < 0) totalMin += 24*60;
  const h = Math.floor(totalMin/60);
  const m = totalMin%60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2,'0')}min`;
}

function dataBloqueada(data, bloqueios) {
  if (!data || !bloqueios?.length) return null;
  const d = new Date(data + 'T00:00:00');
  return bloqueios.find(b => {
    const inicio = new Date(b.dataInicio + 'T00:00:00');
    const fim    = new Date(b.dataFim    + 'T00:00:00');
    return d >= inicio && d <= fim;
  }) || null;
}

export default function CadastroPage({ onShowSalvo, showParaEditar, onCancelarEdicao, bloqueios = [] }) {
  const editando = !!showParaEditar;
  const [form, setForm]       = useState(VAZIO);
  const [erros, setErros]     = useState({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erroGeral, setErroGeral] = useState('');

  useEffect(() => {
    if (showParaEditar) {
      setForm({
        nome:              showParaEditar.nome             || '',
        data:              showParaEditar.data             || '',
        ano:               showParaEditar.ano              || new Date().getFullYear(),
        mes:               showParaEditar.mes              || new Date().getMonth()+1,
        evento:            showParaEditar.evento           || '',
        status:            showParaEditar.status           || 'CONFIRMADO',
        horaInicio:        showParaEditar.horaInicio       || '',
        horaTermino:       showParaEditar.horaTermino      || '',
        duracao:           showParaEditar.duracao          || '',
        cache:             showParaEditar.cache            != null ? showParaEditar.cache : '',
        xdj:               showParaEditar.xdj              || false,
        adiantamento:      showParaEditar.adiantamento     || false,
        valorAdiantamento: showParaEditar.valorAdiantamento != null ? showParaEditar.valorAdiantamento : '',
        contratante:       showParaEditar.contratante      || '',
        endereco:          showParaEditar.endereco         || '',
        rider:             showParaEditar.rider            || '',
        custos:            showParaEditar.custos           != null ? showParaEditar.custos : '',
        observacoes:       showParaEditar.observacoes      || '',
      });
    } else {
      setForm(VAZIO);
    }
    setSucesso('');
    setErroGeral('');
    setErros({});
  }, [showParaEditar]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const novo = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'horaInicio' || name === 'horaTermino') {
        novo.duracao = calcularDuracao(
          name === 'horaInicio' ? value : prev.horaInicio,
          name === 'horaTermino' ? value : prev.horaTermino
        );
      }
      return novo;
    });
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
  }

  function handleData(e) {
    const valor = e.target.value;
    if (valor) {
      const d = new Date(valor + 'T00:00:00');
      setForm(prev => ({ ...prev, data: valor, ano: d.getFullYear(), mes: d.getMonth()+1 }));
    } else {
      setForm(prev => ({ ...prev, data: valor }));
    }
    if (erros.data) setErros(prev => ({ ...prev, data: '' }));
  }

  function validar() {
    const e = {};
    if (!form.data)        e.data        = 'Obrigatório';
    if (!form.evento)      e.evento      = 'Obrigatório';
    if (!form.contratante) e.contratante = 'Obrigatório';
    const bloqueio = dataBloqueada(form.data, bloqueios);
    if (bloqueio) {
      e.data = `Data bloqueada${bloqueio.motivo ? ': ' + bloqueio.motivo : ''}`;
    }
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSucesso(''); setErroGeral('');
    const e = validar();
    if (Object.keys(e).length > 0) { setErros(e); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        ano:               Number(form.ano),
        mes:               Number(form.mes),
        cache:             form.cache             !== '' ? Number(form.cache)             : null,
        valorAdiantamento: form.valorAdiantamento !== '' ? Number(form.valorAdiantamento) : null,
        custos:            form.custos            !== '' ? Number(form.custos)            : null,
        horaInicio:        form.horaInicio        || null,
        horaTermino:       form.horaTermino       || null,
        duracao:           form.duracao           || null,
        nome:              form.nome              || null,
        endereco:          form.endereco          || null,
        rider:             form.rider             || null,
        observacoes:       form.observacoes       || null,
      };

      if (editando) {
        await updateShow(showParaEditar.id, payload);
        setSucesso('Show atualizado com sucesso!');
      } else {
        await createShow(payload);
        setSucesso('Show "' + form.evento + '" cadastrado com sucesso!');
        setForm(VAZIO);
      }
      setErros({});
      onShowSalvo();
    } catch (err) {
      setErroGeral(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cadastro-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{editando ? '✏️ Editar Show' : '🎵 Cadastrar Show'}</h1>
          <p className="page-subtitle">{editando ? `Editando: ${showParaEditar.evento}` : 'Preencha os dados do novo show'}</p>
        </div>
        {editando && (
          <button className="btn btn-ghost" onClick={onCancelarEdicao}>← Cancelar edição</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="show-form" noValidate>

        {/* SEÇÃO 1 — IDENTIFICAÇÃO */}
        <div className="form-section">
          <SectionHeader icon="🎯" title="Identificação" subtitle="Nome, tipo e status do show" />
          <div className="form-grid-2">
            <FormField label="Nome / Código">
              <input type="text" name="nome" value={form.nome} onChange={handleChange}
                placeholder="Ex: Show #47" className="input" />
            </FormField>
            <FormField label="Status">
              <div className="status-group">
                {STATUS_OPCOES.map(s => (
                  <label key={s.value}
                    className={'status-btn' + (form.status === s.value ? ' active' : '')}
                    style={form.status === s.value ? { borderColor: s.color, color: s.color, background: s.color+'18' } : {}}>
                    <input type="radio" name="status" value={s.value}
                      checked={form.status === s.value} onChange={handleChange} hidden />
                    {s.label}
                  </label>
                ))}
              </div>
            </FormField>
          </div>
          <FormField label="Evento" required error={erros.evento}>
            <input type="text" name="evento" value={form.evento} onChange={handleChange}
              placeholder="Ex: Calourada PUC, Space, Late Checkout..." className="input" />
          </FormField>
        </div>

        {/* SEÇÃO 2 — DATA E HORÁRIO */}
        <div className="form-section">
          <SectionHeader icon="📅" title="Data e Horário" subtitle="Quando e por quanto tempo" />
          <div className="form-grid-3">
            <FormField label="Data" required error={erros.data}>
              <input type="date" name="data" value={form.data} onChange={handleData} className="input" />
            </FormField>
            <FormField label="Ano">
              <input type="number" name="ano" value={form.ano} onChange={handleChange} className="input" readOnly />
            </FormField>
            <FormField label="Mês">
              <select name="mes" value={form.mes} onChange={handleChange} className="input">
                {MESES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </FormField>
          </div>
          <div className="form-grid-3">
            <FormField label="Hora Início">
              <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleChange} className="input" />
            </FormField>
            <FormField label="Hora Término">
              <input type="time" name="horaTermino" value={form.horaTermino} onChange={handleChange} className="input" />
            </FormField>
            <FormField label="Duração (automática)">
              <div className="duracao-display">
                {form.duracao || <span className="muted">Calculada automaticamente</span>}
              </div>
            </FormField>
          </div>
        </div>

        {/* SEÇÃO 3 — FINANCEIRO */}
        <div className="form-section">
          <SectionHeader icon="💰" title="Financeiro" subtitle="Cachê, adiantamento e custos" />
          <div className="form-grid-2">
            <FormField label="Cachê (R$)">
              <input type="number" name="cache" value={form.cache} onChange={handleChange}
                placeholder="Deixe vazio se não definido" className="input" min="0" step="0.01" />
            </FormField>
            <FormField label="Custos Adicionais (R$)">
              <input type="number" name="custos" value={form.custos} onChange={handleChange}
                placeholder="Ex: 150.00" className="input" min="0" step="0.01" />
            </FormField>
          </div>
          <div className="form-grid-2">
            <label className="toggle-card">
              <input type="checkbox" name="adiantamento" checked={form.adiantamento} onChange={handleChange} className="checkbox" />
              <div>
                <div className="toggle-label">Adiantamento recebido</div>
                <div className="toggle-sub">Parte do cachê foi paga antecipadamente</div>
              </div>
            </label>
            <label className="toggle-card">
              <input type="checkbox" name="xdj" checked={form.xdj} onChange={handleChange} className="checkbox" />
              <div>
                <div className="toggle-label">XDJ incluso</div>
                <div className="toggle-sub">Equipamento fornecido pelo contratante</div>
              </div>
            </label>
          </div>
          {form.adiantamento && (
            <FormField label="Valor do Adiantamento (R$)">
              <input type="number" name="valorAdiantamento" value={form.valorAdiantamento}
                onChange={handleChange} placeholder="Ex: 200.00" className="input" min="0" step="0.01" />
            </FormField>
          )}
        </div>

        {/* SEÇÃO 4 — LOGÍSTICA */}
        <div className="form-section">
          <SectionHeader icon="📍" title="Logística" subtitle="Quem contratou e onde" />
          <FormField label="Contratante" required error={erros.contratante}>
            <input type="text" name="contratante" value={form.contratante} onChange={handleChange}
              placeholder="Ex: Mancini, Felipe, Daniel Lopes" className="input" />
          </FormField>
          <FormField label="Endereço">
            <input type="text" name="endereco" value={form.endereco} onChange={handleChange}
              placeholder="Ex: Av. Boulevard, 315 - Itaúna" className="input" />
          </FormField>
        </div>

        {/* SEÇÃO 5 — EXTRAS */}
        <div className="form-section">
          <SectionHeader icon="📋" title="Extras" subtitle="Rider técnico e observações" />
          <FormField label="Rider Técnico">
            <textarea name="rider" value={form.rider} onChange={handleChange}
              placeholder="Ex: 2 CDJs Pioneer 2000, mixer DJM-900, monitor de palco..."
              className="input textarea" rows={3} />
          </FormField>
          <FormField label="Observações">
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange}
              placeholder="Qualquer informação adicional sobre o show..."
              className="input textarea" rows={2} />
          </FormField>
        </div>

        {erroGeral && <div className="alert alert-erro">{erroGeral}</div>}
        {sucesso   && <div className="alert alert-sucesso">✅ {sucesso}</div>}
        {Object.keys(erros).length > 0 && (
          <div className="alert alert-erro">Preencha os campos obrigatórios (marcados com *).</div>
        )}

        <div className="form-actions">
          {editando && (
            <button type="button" className="btn btn-ghost" onClick={onCancelarEdicao}>Cancelar</button>
          )}
          <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
            {loading ? '⏳ Salvando...' : editando ? '💾 Salvar Alterações' : '+ Cadastrar Show'}
          </button>
        </div>

      </form>
    </div>
  );
}
