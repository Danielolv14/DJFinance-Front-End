import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createShow, updateShow } from '../services/api';

/* ─── constants ─── */
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const STATUS_OPCOES = [
  { value: 'CONFIRMADO', label: 'CONFIRMADO', color: '#3dd457' },
  { value: 'PENDENTE',   label: 'PENDENTE',   color: '#ffd60a' },
  { value: 'CANCELADO',  label: 'CANCELADO',  color: '#ff453a' },
];

const VAZIO = {
  nome:'', data:'', ano: new Date().getFullYear(), mes: new Date().getMonth()+1,
  evento:'', status:'CONFIRMADO',
  horaInicio:'', horaTermino:'', duracao:'',
  cache:'', xdj:false, adiantamento:false, valorAdiantamento:'',
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

/* ─── design tokens ─── */
const ACCENT = '#ffd60a';
const surface = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
};

/* ─── sub-components ─── */
function SectionPanel({ color, label, icon, children }) {
  return (
    <div style={{ ...surface, padding: '20px 24px', borderTop: `2px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: color,
          boxShadow: `0 0 6px ${color}`, flexShrink: 0,
        }} />
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, color: `${color}cc`, letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            {icon} {label}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, color: error ? '#ff453a' : 'rgba(255,255,255,0.3)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: '#ff453a', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: '#ff453a', letterSpacing: '0.08em',
        }}>
          {error}
        </span>
      )}
    </div>
  );
}

const inputStyle = (error) => ({
  background: '#0d0e14',
  border: `1px solid ${error ? '#ff453a60' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 4,
  color: 'rgba(255,255,255,0.88)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
});

function HwInput({ name, value, onChange, type = 'text', placeholder, error, readOnly, min, step }) {
  return (
    <input
      name={name} value={value} onChange={onChange}
      type={type} placeholder={placeholder} readOnly={readOnly}
      min={min} step={step}
      style={inputStyle(error)}
      onFocus={e => { if (!error) e.target.style.borderColor = `${ACCENT}50`; }}
      onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    />
  );
}

function HwSelect({ name, value, onChange, children, error }) {
  return (
    <select
      name={name} value={value} onChange={onChange}
      style={{
        ...inputStyle(error),
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: 28,
      }}
    >
      {children}
    </select>
  );
}

function HwTextarea({ name, value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      name={name} value={value} onChange={onChange}
      placeholder={placeholder} rows={rows}
      style={{
        ...inputStyle(false),
        resize: 'vertical',
        lineHeight: 1.5,
      }}
      onFocus={e => e.target.style.borderColor = `${ACCENT}50`}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
    />
  );
}

function ToggleCard({ name, checked, onChange, label, sub, color = ACCENT }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: checked ? `${color}0d` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${checked ? color + '35' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} style={{ display: 'none' }} />

      {/* Toggle track */}
      <div style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: checked ? color : 'rgba(255,255,255,0.08)',
        border: `1px solid ${checked ? color : 'rgba(255,255,255,0.1)'}`,
        position: 'relative', transition: 'all 0.2s',
        boxShadow: checked ? `0 0 10px ${color}50` : 'none',
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: checked ? 18 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: checked ? '#fff' : 'rgba(255,255,255,0.3)',
          transition: 'left 0.2s',
        }} />
      </div>

      <div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, fontWeight: 700, color: checked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
          letterSpacing: '0.06em',
        }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {sub}
        </div>
      </div>
    </label>
  );
}

/* ═══════════════ PAGE ═══════════════ */
export default function CadastroPage({ onShowSalvo, showParaEditar, onCancelarEdicao, bloqueios = [] }) {
  const editando = !!showParaEditar;
  const [form, setForm]         = useState(VAZIO);
  const [erros, setErros]       = useState({});
  const [loading, setLoading]   = useState(false);
  const [sucesso, setSucesso]   = useState('');
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
    setSucesso(''); setErroGeral(''); setErros({});
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
    if (bloqueio) e.data = `Bloqueado${bloqueio.motivo ? ': ' + bloqueio.motivo : ''}`;
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
        setSucesso('Show "' + form.evento + '" cadastrado!');
        setForm(VAZIO);
      }
      setErros({}); onShowSalvo();
    } catch (err) {
      setErroGeral(err.message);
    } finally {
      setLoading(false);
    }
  }

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
  const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860, margin: '0 auto', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: `${ACCENT}99`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            DECK 5 · {editando ? 'EDITAR SHOW' : 'CADASTRAR'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
            {editando ? showParaEditar.evento : 'Novo Show'}
          </div>
        </div>
        {editando && (
          <button
            onClick={onCancelarEdicao}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(180deg, #1e1f28, #17181f)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4, cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            }}
          >
            ← CANCELAR
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Section 1: Identificação ── */}
        <SectionPanel color="#9a7ef8" label="IDENTIFICAÇÃO" icon="◈">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={grid2}>
              <Field label="Nome / Código">
                <HwInput name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Show #47" />
              </Field>
              <Field label="Status">
                <div style={{ display: 'flex', gap: 5 }}>
                  {STATUS_OPCOES.map(s => (
                    <label
                      key={s.value}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '9px 4px', borderRadius: 4, cursor: 'pointer',
                        background: form.status === s.value ? `${s.color}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${form.status === s.value ? s.color + '50' : 'rgba(255,255,255,0.06)'}`,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                        color: form.status === s.value ? s.color : 'rgba(255,255,255,0.3)',
                        boxShadow: form.status === s.value ? `0 0 10px ${s.color}25` : 'none',
                        transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {form.status === s.value && (
                        <span style={{
                          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                          background: s.color, boxShadow: `0 0 6px ${s.color}`,
                        }} />
                      )}
                      <input type="radio" name="status" value={s.value}
                        checked={form.status === s.value} onChange={handleChange} hidden />
                      {s.label}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Evento" required error={erros.evento}>
              <HwInput name="evento" value={form.evento} onChange={handleChange}
                placeholder="Ex: Calourada PUC, Space, Late Checkout..." error={erros.evento} />
            </Field>
          </div>
        </SectionPanel>

        {/* ── Section 2: Data e Horário ── */}
        <SectionPanel color="#1a6efa" label="DATA E HORÁRIO" icon="◷">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={grid3}>
              <Field label="Data" required error={erros.data}>
                <HwInput type="date" name="data" value={form.data} onChange={handleData} error={erros.data} />
              </Field>
              <Field label="Ano">
                <HwInput type="number" name="ano" value={form.ano} onChange={handleChange} readOnly />
              </Field>
              <Field label="Mês">
                <HwSelect name="mes" value={form.mes} onChange={handleChange}>
                  {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </HwSelect>
              </Field>
            </div>
            <div style={grid3}>
              <Field label="Hora Início">
                <HwInput type="time" name="horaInicio" value={form.horaInicio} onChange={handleChange} />
              </Field>
              <Field label="Hora Término">
                <HwInput type="time" name="horaTermino" value={form.horaTermino} onChange={handleChange} />
              </Field>
              <Field label="Duração">
                <div style={{
                  ...inputStyle(false),
                  display: 'flex', alignItems: 'center',
                  color: form.duracao ? '#1a6efa' : 'rgba(255,255,255,0.2)',
                  textShadow: form.duracao ? '0 0 10px rgba(26,110,250,0.5)' : 'none',
                  fontWeight: form.duracao ? 700 : 400,
                  fontSize: 13,
                  background: '#0a0b0f',
                }}>
                  {form.duracao || 'AUTO'}
                </div>
              </Field>
            </div>
          </div>
        </SectionPanel>

        {/* ── Section 3: Financeiro ── */}
        <SectionPanel color="#3dd457" label="FINANCEIRO" icon="◉">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={grid2}>
              <Field label="Cachê (R$)">
                <HwInput type="number" name="cache" value={form.cache} onChange={handleChange}
                  placeholder="Deixe vazio se não definido" min="0" step="0.01" />
              </Field>
              <Field label="Custos Adicionais (R$)">
                <HwInput type="number" name="custos" value={form.custos} onChange={handleChange}
                  placeholder="Ex: 150.00" min="0" step="0.01" />
              </Field>
            </div>
            <div style={grid2}>
              <ToggleCard
                name="adiantamento" checked={form.adiantamento} onChange={handleChange}
                label="ADIANTAMENTO RECEBIDO" sub="Parte do cachê paga antecipadamente"
                color="#3dd457"
              />
              <ToggleCard
                name="xdj" checked={form.xdj} onChange={handleChange}
                label="XDJ INCLUSO" sub="Equipamento fornecido pelo contratante"
                color="#1a6efa"
              />
            </div>
            <AnimatePresence>
              {form.adiantamento && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <Field label="Valor do Adiantamento (R$)">
                    <HwInput type="number" name="valorAdiantamento" value={form.valorAdiantamento}
                      onChange={handleChange} placeholder="Ex: 200.00" min="0" step="0.01" />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SectionPanel>

        {/* ── Section 4: Logística ── */}
        <SectionPanel color="#ff8040" label="LOGÍSTICA" icon="◌">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Contratante" required error={erros.contratante}>
              <HwInput name="contratante" value={form.contratante} onChange={handleChange}
                placeholder="Ex: Mancini, Felipe, Daniel Lopes" error={erros.contratante} />
            </Field>
            <Field label="Endereço">
              <HwInput name="endereco" value={form.endereco} onChange={handleChange}
                placeholder="Ex: Av. Boulevard, 315 - Itaúna" />
            </Field>
          </div>
        </SectionPanel>

        {/* ── Section 5: Extras ── */}
        <SectionPanel color="rgba(255,255,255,0.2)" label="EXTRAS" icon="◇">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Rider Técnico">
              <HwTextarea name="rider" value={form.rider} onChange={handleChange}
                placeholder="Ex: 2 CDJs Pioneer 2000, mixer DJM-900, monitor de palco..." rows={3} />
            </Field>
            <Field label="Observações">
              <HwTextarea name="observacoes" value={form.observacoes} onChange={handleChange}
                placeholder="Qualquer informação adicional sobre o show..." rows={2} />
            </Field>
          </div>
        </SectionPanel>

        {/* ── Feedback ── */}
        <AnimatePresence>
          {erroGeral && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                padding: '12px 16px', background: 'rgba(255,69,58,0.1)',
                border: '1px solid rgba(255,69,58,0.3)', borderRadius: 6,
                color: '#ff453a', fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              }}
            >
              ERRO: {erroGeral}
            </motion.div>
          )}
          {sucesso && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                padding: '12px 16px', background: 'rgba(61,212,87,0.1)',
                border: '1px solid rgba(61,212,87,0.3)', borderRadius: 6,
                color: '#3dd457', fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              }}
            >
              ✓ {sucesso}
            </motion.div>
          )}
          {Object.keys(erros).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                padding: '12px 16px', background: 'rgba(255,69,58,0.08)',
                border: '1px solid rgba(255,69,58,0.25)', borderRadius: 6,
                color: '#ff453a', fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              }}
            >
              PREENCHA OS CAMPOS OBRIGATÓRIOS (*)
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 16 }}>
          {editando && (
            <button type="button" onClick={onCancelarEdicao} style={{
              padding: '12px 24px',
              background: 'linear-gradient(180deg, #1e1f28, #17181f)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5,
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            }}>
              CANCELAR
            </button>
          )}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '12px 32px', position: 'relative', overflow: 'hidden',
              background: loading ? 'rgba(255,214,10,0.08)' : `linear-gradient(135deg, ${ACCENT}22, ${ACCENT}0d)`,
              border: `1px solid ${ACCENT}60`,
              borderRadius: 5, cursor: loading ? 'not-allowed' : 'pointer',
              color: ACCENT,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
              boxShadow: loading ? 'none' : `0 0 20px ${ACCENT}25`,
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: ACCENT, borderRadius: '5px 5px 0 0' }} />
            {loading ? 'SALVANDO···' : editando ? 'SALVAR ALTERAÇÕES' : '+ CADASTRAR SHOW'}
          </motion.button>
        </div>

      </form>
    </div>
  );
}
