# DRUDS Frontend

Interface web em React para o sistema de fechamento financeiro do DJ.

---

## Pré-requisitos

- Node.js instalado (baixe em nodejs.org — versão LTS)
- Backend Java rodando em http://localhost:8080

---

## Como rodar

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o frontend
```bash
npm start
```

Abre automaticamente em http://localhost:3000

---

## Estrutura

```
src/
├── services/
│   └── api.js              ← todas as chamadas ao backend
├── components/
│   ├── ShowForm.js          ← formulário de cadastro
│   ├── ShowList.js          ← listagem com opção de deletar
│   └── FechamentoMensal.js  ← tela de fechamento com filtro
├── App.js                   ← navegação entre telas
├── App.css                  ← todo o estilo dark mode
└── index.js                 ← ponto de entrada React
```

---

## Funcionalidades

- Cadastrar shows com data, cachê, local e observações
- Listar e deletar shows
- Calcular fechamento mensal (total bruto, Daniel, Yuri, lucro líquido)
