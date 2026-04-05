// components/ShowForm.js
// Formulário avançado de cadastro de show.
// Dividido em 4 seções: Evento, Financeiro, Logística, Extras.

import { useState } from 'react';
import { createShow } from '../services/api';
import FormField from './FormField';
import SectionHeader from './SectionHeader';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const ESTADO_INICIAL = {
  nome:             '',
  data:             '',
  ano:              new Date().getFullYear(),
  mes:              new Date().getMonth() + 1,
  evento:           '',
  horaInicio:       '',
  duracao:          '',
  cache:            '',
  xdj:              false,
  adiantamento:     false,
  valorAdiantamento:'',
  contratante:      '',
  endereco:         '',
  rider:            '',
  custos:           '',
  observacoes:      '',
};

export default function ShowForm({ onShowCriado }) {
  const [form, setForm]       = useState(ESTADO_INICIAL);
  const [erros, setErros]     = useState({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erroGeral, setErroGeral] = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
  }

  function handleData(e) {
    const valor = e.target.value;
    if (valor) {
      const d = new Date(valor + 'T00:00:00');
      setForm(prev => ({ ...prev, data: valor, ano: d.getFullYear(), mes: d.getMonth() + 1 }));
    } else {
      setForm(prev => ({ ...prev, data: valor }));
    }
    if (erros.data) setErros(prev => ({ ...prev, data: '' }));
  }

  function validar() {
    const novosErros = {};
    if (!form.data)        novosErros.data        = 'Campo obrigatório';
    if (!form.evento)      novosErros.evento      = 'Campo obrigatório';
    if (!form.contratante) novosErros.contratante = 'Campo obrigatório';
    if (form.cache && isNaN(Number(form.cache)))
      novosErros.cache = 'Valor inválido';
    if (form.adiantamento && form.valorAdiantamento && isNaN(Number(form.valorAdiantamento)))
      novosErros.valorAdiantamento = 'Valor inválido';
    return novosErros;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSucesso('');
    setErroGeral('');

    const novosErros = validar();
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setLoading(true);
    try {
      await createShow({
        nome:              form.nome       || null,
        data:              form.data,
        ano:               Number(form.ano),
        mes:               Number(form.mes),
        evento:            form.evento,
        horaInicio:        form.horaInicio || null,
        duracao:           form.duracao    || null,
        cache:             form.cache      ? Number(form.cache)             : null,
        xdj:               form.xdj,
        adiantamento:      form.adiantamento,
        valorAdiantamento: form.valorAdiantamento ? Number(form.valorAdiantamento) : null,
        contratante:       form.contratante,
        endereco:          form.endereco   || null,
        rider:             form.rider      || null,
        custos:            form.custos     ? Number(form.custos)            : null,
        observacoes:       form.observacoes|| null,
      });

      setSucesso('Show "' + form.evento + '" cadastrado com sucesso!');
      setForm(ESTADO_INICIAL);
      setErros({});
      onShowCriado();
    } catch (err) {
      setErroGeral(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="show-form" noValidate>

      <div className="form-section">
        <SectionHeader icon="🎵" title="Informações do Evento" subtitle="Dados básicos do show" />
        <div className="form-grid-3">
          <FormField label="Data" required error={erros.data}>
            <input type="date" name="data" value={form.data} onChange={handleData} className="input" />
          </FormField>
          <FormField label="Ano">
            <input type="number" name="ano" value={form.ano} onChange={handleChange} className="input" readOnly />
          </FormField>
          <FormField label="Mês">
            <select name="mes" value={form.mes} onChange={handleChange} className="input">
              {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Nome / Identificador">
            <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Show #47" className="input" />
          </FormField>
          <FormField label="Evento" required error={erros.evento}>
            <input type="text" name="evento" value={form.evento} onChange={handleChange} placeholder="Ex: Calourada PUC, Space" className="input" />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label="Hora de Início">
            <input type="time" name="horaInicio" value={form.horaInicio} onChange={handleChange} className="input" />
          </FormField>
          <FormField label="Duração do Show">
            <input type="text" name="duracao" value={form.duracao} onChange={handleChange} placeholder="Ex: 1h30min, 2h" className="input" />
          </FormField>
        </div>
      </div>

      <div className="form-section">
        <SectionHeader icon="💰" title="Financeiro" subtitle="Cachê, adiantamento e custos" />
        <div className="form-grid-2">
          <FormField label="Cachê (R$)" error={erros.cache}>
            <input type="number" name="cache" value={form.cache} onChange={handleChange} placeholder="Ex: 700.00" className="input" min="0" step="0.01" />
          </FormField>
          <FormField label="Custos Adicionais (R$)">
            <input type="number" name="custos" value={form.custos} onChange={handleChange} placeholder="Ex: 150.00" className="input" min="0" step="0.01" />
          </FormField>
        </div>
        <div className="form-grid-2">
          <FormField label=" ">
            <label className="checkbox-label">
              <input type="checkbox" name="adiantamento" checked={form.adiantamento} onChange={handleChange} className="checkbox" />
              <span>Recebeu adiantamento?</span>
            </label>
          </FormField>
          <FormField label=" ">
            <label className="checkbox-label">
              <input type="checkbox" name="xdj" checked={form.xdj} onChange={handleChange} className="checkbox" />
              <span>XDJ incluso?</span>
            </label>
          </FormField>
        </div>
        {form.adiantamento && (
          <FormField label="Valor do Adiantamento (R$)" error={erros.valorAdiantamento}>
            <input type="number" name="valorAdiantamento" value={form.valorAdiantamento} onChange={handleChange} placeholder="Ex: 200.00" className="input" min="0" step="0.01" />
          </FormField>
        )}
      </div>

      <div className="form-section">
        <SectionHeader icon="📍" title="Logística" subtitle="Contratante e local do evento" />
        <FormField label="Contratante" required error={erros.contratante}>
          <input type="text" name="contratante" value={form.contratante} onChange={handleChange} placeholder="Ex: Mancini, Felipe, Daniel Lopes" className="input" />
        </FormField>
        <FormField label="Endereço">
          <input type="text" name="endereco" value={form.endereco} onChange={handleChange} placeholder="Ex: Av. Boulevard, 315 - Itaúna" className="input" />
        </FormField>
      </div>

      <div className="form-section">
        <SectionHeader icon="📋" title="Extras" subtitle="Rider técnico e observações" />
        <FormField label="Rider Técnico">
          <textarea name="rider" value={form.rider} onChange={handleChange} placeholder="Ex: 2 CDJs Pioneer 2000, mixer DJM-900..." className="input textarea" rows={3} />
        </FormField>
        <FormField label="Observações">
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange} placeholder="Qualquer informação adicional..." className="input textarea" rows={2} />
        </FormField>
      </div>

      {erroGeral && <div className="alert alert-erro">{erroGeral}</div>}
      {sucesso   && <div className="alert alert-sucesso">✅ {sucesso}</div>}
      {Object.keys(erros).length > 0 && (
        <div className="alert alert-erro">Preencha os campos obrigatórios antes de salvar.</div>
      )}

      <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
        {loading ? '⏳ Salvando...' : '+ Cadastrar Show'}
      </button>

    </form>
  );
}
