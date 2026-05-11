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
DB_PASSWORD=
DB_NAME=barbearia_db
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
```

**Nota**: Se seu MySQL tem senha, adicione em `DB_PASSWORD`

---

### 🗄️ Passo 5: Inicializar o Banco de Dados

⚠️ **IMPORTANTE**: Execute este comando para criar automaticamente o banco de dados e as tabelas necessárias:

```bash
npm run setup
```

Você verá:
```
🔧 Inicializando banco de dados...
✅ Conectado ao MySQL
✅ Banco de dados criado/verificado: barbearia_db
✅ Tabela "users" criada/verificada
✅ Setup do banco de dados concluído!

🎉 Banco pronto! Agora você pode rodar: npm run dev
```

**Este comando executa uma única vez e cria automaticamente:**
- ✅ Banco de dados `barbearia_db`
- ✅ Tabela `users` com todos os campos necessários
- ✅ Índices de performance
- ✅ Constraints de segurança

---

## ▶️ Como Executar o Projeto

### 🚀 Inicialização Rápida (Recomendado)

#### Pré-requisitos antes de começar:
1. **MySQL rodando** - Abra XAMPP Control Panel e inicie o MySQL
2. **Banco configurado** - Execute uma vez (se não fez ainda):
   ```bash
   cd backend
   npm run setup
   ```

#### Inicie o Sistema Inteiro com Um Comando:

Da **raiz do projeto**, execute:

```bash
npm start
```

✨ **Pronto!** Isso iniciará automaticamente:
- 🔙 **Backend** na porta `3001` (com auto-reload)
- 🎨 **Frontend** na porta `3000`

Ambos rodam em **dois terminais separados** simultaneamente.

---

### 🚀 Alternativa: Iniciar Manualmente (Se Preferir)

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend (em novo terminal):
```bash
cd frontend
npm start
```



---

## 📝 Scripts Disponíveis

### Raiz do Projeto (`/`)

```bash
npm start           # 🚀 Inicia backend e frontend simultaneamente
npm run dev         # 🚀 Mesmo que npm start
npm run dev:backend # Inicia apenas o backend
npm run dev:frontend # Inicia apenas o frontend
npm run install:all # Instala dependências em backend e frontend
```

### Backend (`backend/`)

```bash
npm run setup      # 🔧 Cria o banco de dados e tabelas (execute uma única vez!)
npm run dev        # 🚀 Inicia com nodemon (recarregamento automático)
npm start          # Inicia o servidor em produção
npm test           # Executar testes (quando implementados)
```

### Frontend (`frontend/`)

```bash
npm start          # 🚀 Inicia servidor de desenvolvimento (porta 3000)
npm run build      # 📦 Cria build otimizado para produção
npm test           # Executar testes
```

- Comando para rodar o Frontend: npm start dev
- Instalar a biblioteca de ícones: npm install react-icons



## 📄 Documentos Importantes

- [Documento de Visão](https://www.notion.so/Documento-de-Vis-o-334f661c202b804ea8cccdd2d5f397a1?pvs=21)
