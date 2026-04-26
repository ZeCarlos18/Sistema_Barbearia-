# 💇 Sistema de Barbearia

Sistema completo de agendamento e gerenciamento de horários para barbearias que visa diminuir o tempo de um cliente realizar um agendamento e otimizar o tempo do barbeiro.

## 🎯 Visão Geral

Principais funcionalidades:
- ✅ Agendamento de horários online
- ✅ Gerenciamento de horários dos barbeiros
- ✅ Interface para clientes
- ✅ Painel administrativo para barbeiros
- ✅ API REST robusta

## 👥 Equipe

| Papel | Membro |
|-------|--------|
| Scrum Master & Testes | Teógenes Antonio |
| Product Owner & Front-end | João Vitor Maia |
| Back-end | Caique de Souza |
| Back-end | José Carlos |
| Front-end | Matheus |

## 🛠️ Tecnologias

- **Front-end**: React v19.2.5, HTML, CSS, JavaScript
- **Back-end**: Node.js v24.14.1 + Express.js v4.22.1
- **Banco de dados**: MySQL
- **Ferramentas**: npm, nodemon, CORS, dotenv

## 📁 Estrutura do Projeto

```
Sistema_Barbearia/
├── frontend/                    # Aplicação React
│   ├── src/                     # Código fonte React
│   ├── public/                  # Arquivos públicos
│   ├── package.json             # Dependências React
│   └── node_modules/            # Módulos instalados
├── backend/                     # API Node.js + Express
│   ├── src/
│   │   └── index.js             # Arquivo principal
│   ├── .env.example             # Exemplo de variáveis
│   ├── package.json             # Dependências Node
│   └── node_modules/            # Módulos instalados
├── docs/                        # Documentação
└── README.md
```

---

## 🚀 Guia de Instalação (Passo a Passo)

### 📋 Pré-requisitos

Você precisará ter instalado na sua máquina:

- **Node.js** (v24.14.1 ou superior) - [Download](https://nodejs.org/)
  - npm já vem incluído com o Node.js
- **MySQL** (v5.7 ou superior) - [Download](https://www.mysql.com/downloads/)
- **Git** (opcional, para clonar o repositório)

Para verificar se você tem tudo instalado, execute:
```bash
node --version    # Deve retornar v24.14.1 ou superior
npm --version     # Deve retornar 10.0.0 ou superior
mysql --version   # Deve retornar 5.7 ou superior
```

---

### 📥 Passo 1: Clone o Repositório

```bash
git clone <URL-do-repositorio>
cd Sistema_Barbearia
```

Ou, se já tiver os arquivos localmente, navegue até a pasta:
```bash
cd d:\Xampp\htdocs\Vs_Code\Sistema_Barbearia
```

---

### ⚙️ Passo 2: Instale as Dependências do Backend

```bash
cd backend
npm install
```

Este comando irá instalar todas as dependências necessárias:
- Express.js
- CORS
- Body-parser
- Dotenv
- MySQL2
- Nodemon (para desenvolvimento)

---

### ⚙️ Passo 3: Instale as Dependências do Frontend

Abra um **novo terminal** e execute:

```bash
cd frontend
npm install
```

Este comando irá instalar:
- React v19.2.5
- React DOM
- React Scripts
- Testing libraries

---

### 🔐 Passo 4: Configure as Variáveis de Ambiente

#### Para o Backend:

1. Navegue até a pasta backend:
```bash
cd backend
```

2. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
# Ou manualmente, crie um arquivo `.env` com o conteúdo:
```

3. Abra o arquivo `.env` e configure as credenciais do MySQL:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=barbearia_db
NODE_ENV=development
PORT=3001
```

**Substitua `sua_senha_mysql` pela senha do seu MySQL!**

---

### 🗄️ Passo 5: Configure o Banco de Dados (MySQL)

1. Abra o **MySQL Workbench** ou use a linha de comando:

```bash
mysql -u root -p
```

2. Crie o banco de dados:
```sql
CREATE DATABASE barbearia_db;
USE barbearia_db;
```

3. Crie as tabelas necessárias (exemplo básico):
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  barber_id INT NOT NULL,
  appointment_date DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (barber_id) REFERENCES users(id)
);
```

---

## ▶️ Como Executar o Projeto

Você precisará de **2 terminais abertos** simultaneamente:

### Terminal 1 - Iniciar o Backend:

```bash
cd backend
npm run dev
```

Você deve ver:
```
Servidor rodando na porta 3001
```

A API estará disponível em: `http://localhost:3001`

---

### Terminal 2 - Iniciar o Frontend:

```bash
cd frontend
npm start
```

O navegador abrirá automaticamente em: `http://localhost:3000`

---

## 🧪 Testando a Instalação

### Verificar se o Backend está funcionando:

Abra seu navegador ou use `curl`:
```bash
curl http://localhost:3001
```

Você deve receber:
```json
{ "message": "API Barbearia funcionando!" }
```

### Verificar se o Frontend está acessível:

Acesse: `http://localhost:3000`

Você deve ver a aplicação React carregada.

---

## 📝 Scripts Disponíveis

### Backend (`backend/`)

```bash
npm start          # Inicia o servidor em produção
npm run dev        # Inicia com nodemon (recarreguamento automático)
npm test           # Executar testes (quando implementados)
```

### Frontend (`frontend/`)

```bash
npm start          # Inicia o servidor React de desenvolvimento
npm run build      # Cria uma build otimizada para produção
npm test           # Executa os testes
npm run eject      # Ejetar configuração (⚠️ irreversível!)
```

---

## 🐛 Troubleshooting

### Problema: "Port 3001 já está em uso"

**Solução**: Mude a porta no arquivo `.env` do backend:
```env
PORT=3002
```

### Problema: "MySQL connection refused"

**Solução**: Verifique se:
- MySQL está rodando
- Credenciais no `.env` estão corretas
- Banco de dados `barbearia_db` foi criado

### Problema: "node_modules não encontrado"

**Solução**: Execute novamente:
```bash
npm install
```

### Problema: "npm command not found"

**Solução**: Node.js não está instalado. [Baixe e instale aqui](https://nodejs.org/)

---

## 📚 Documentação Adicional

Consulte a pasta `docs/` para:
- Arquitetura completa
- Documentação do banco de dados
- Endpoints da API
- Guia de contribuição

---

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe ou abra uma issue no repositório.

**Última atualização**: Abril, 2026

## 📄 Documentos Importantes

- [Documento de Visão](https://www.notion.so/Documento-de-Vis-o-334f661c202b804ea8cccdd2d5f397a1?pvs=21)
