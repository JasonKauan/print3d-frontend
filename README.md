# Print3D Frontend

Frontend da plataforma Print3D, um sistema de gerenciamento para entidades que utilizam impressoras 3D de forma compartilhada.

O sistema permite controlar membros, produção, catálogo de produtos, estoque, vendas e repasses financeiros através de uma interface moderna, responsiva e preparada para dispositivos móveis.

---

# 🚀 Tecnologias Utilizadas

* React
* Vite
* TailwindCSS
* Zustand
* Axios
* React Router DOM

---

# 📱 Objetivo

O frontend foi desenvolvido com foco em:

* Responsividade
* Facilidade de uso
* Compatibilidade mobile
* Upload rápido de imagens
* Navegação simples
* Interface moderna

O sistema funciona tanto em desktop quanto em celulares.

---

# 🧩 Funcionalidades

## 📊 Dashboard

* Métricas gerais
* Últimas impressões
* Repasses pendentes
* Produtos cadastrados
* Total vendido

---

## 👥 Gestão de Membros

* Cadastro de membros
* Edição de informações
* Controle de status
* Filtros

---

## 🖨️ Impressões

* Registro de produção
* Histórico de impressões
* Associação com membros

---

## 🛍️ Catálogo

* Cadastro de produtos
* Upload de imagens
* Controle de estoque
* Visualização do catálogo

---

## 💰 Financeiro

* Registro de vendas
* Controle de repasses
* Status de pagamento
* Resumo financeiro

---

# 📂 Estrutura do Projeto

```bash
src/
├── assets/
├── components/
│   ├── Layout/
│   ├── Dashboard/
│   ├── Membros/
│   ├── Impressoes/
│   ├── Catalogo/
│   └── Financeiro/
│
├── pages/
├── hooks/
├── services/
├── store/
├── routes/
├── utils/
└── App.jsx
```

---

# ⚙️ Configuração do Projeto

# Pré-requisitos

* Node.js 18+
* NPM ou Yarn

---

# 📦 Instalação

## Clone o repositório

```bash
git clone https://github.com/JasonKauan/print3d
```

---

## Instale as dependências

```bash
npm install
```

---

# 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

---

# ▶️ Rodando o Projeto

```bash
npm run dev
```

Frontend disponível em:

```bash
http://localhost:5173
```

---

# 🔐 Autenticação

O frontend utiliza autenticação JWT integrada com o backend Spring Boot.

O token é enviado automaticamente no header das requisições:

```http
Authorization: Bearer TOKEN
```

---

# 📸 Upload de Imagens

O sistema suporta:

* Upload por arquivo
* Captura usando câmera do celular
* Preview da imagem antes do envio

As imagens são armazenadas no Cloudinary através do backend.

---

# 📱 Responsividade

A aplicação foi construída utilizando abordagem mobile-first.

Compatível com:

* Smartphones
* Tablets
* Desktop

---

# 🎯 Objetivo do Projeto

O Print3D Frontend busca entregar uma interface intuitiva para gerenciamento de produção compartilhada em impressoras 3D, focando em simplicidade, organização e acessibilidade.

---

# 🔮 Melhorias Futuras

* Tema dark mode
* PWA completo
* Notificações
* Relatórios
* Dashboard avançado
* Gráficos financeiros
* Controle de múltiplas impressoras

---

# 📄 Licença

Este projeto está sob a licença MIT.
