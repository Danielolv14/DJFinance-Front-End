# DJFinance — Front-end

Painel web do sistema de fechamento financeiro dos DJs **DRUDS** e **Braichi**.

React 18 (Create React App) · deploy na Vercel (push na `main` publica).

## Como rodar

```bash
npm install
npm start
```

Abre em http://localhost:3000 e usa a API de produção. Para apontar para outro back-end,
crie um `.env.local` com:

```
REACT_APP_API_URL=http://localhost:8080
```

**Modo demonstração:** abra com `?demo` na URL (ex.: `http://localhost:3000/?demo`).
Usa os dados fictícios de `src/mockData.js` e **nunca** lê nem grava no servidor; é o jeito
seguro de testar as telas e de mostrar o projeto.

Build de produção: `npm run build`.

## Organização (`src/`)

```
App.js               carrega shows e bloqueios do DJ ativo e mostra a aba escolhida
components/          peças usadas por várias telas (Cabecalho, LedDot)
pages/<tela>/        uma pasta por aba, com a tela e os componentes que só ela usa
  dashboard/         resumo do ano e do mês (contas em resumo.js)
  calendario/        calendário mensal e bloqueios de agenda
  shows/             lista de shows, exportação Excel, itinerário e planilha online
  crm/               contratantes e locais, com junção de nomes parecidos
  cadastro/          formulário de show e importação CSV
  fechamento/        fechamento do mês, PDF e mensagem de WhatsApp
  presskit/          press kit (Google Drive)
  selecao-dj/        escolha do painel (DRUDS ou Braichi)
services/            api.js (todas as chamadas ao back), excelService.js, pdfService.js
utils/               format.js (moeda, datas, meses), tema.js (cores), pagamentos.js, demo.js
context/DJContext.js DJ ativo
mockData.js          dados do modo demonstração
```

## Regras que vale saber

- **Quanto Daniel e Yuri recebem é calculado só no back-end** (`RegrasPagamento.java`) e chega
  em cada show (`pagamentoDaniel`, `pagamentoYuri`). O front não repete essa conta. Os valores
  dos dados de demonstração foram gerados com a mesma regra; se ela mudar, recalcule-os.
- O DJ ativo fica no `localStorage` (`djAtivo`) e vai em toda chamada à API.
- Shows antes de 2025 não aparecem.
