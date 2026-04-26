# Arquitetura - Sistema de Barbearia

## Diagrama Geral

```
┌─────────────────┐
│     Cliente     │
│   (Browser)     │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼─────────────┐
│  Frontend (React)    │
│  ├─ Agendamento      │
│  └─ Perfil Cliente   │
└────────┬─────────────┘
         │
         │ API Calls
         │
┌────────▼─────────────┐
│ Backend (Node/Express)
│ ├─ Auth API         │
│ ├─ Schedule API     │
│ └─ User API         │
└────────┬─────────────┘
         │
         │ SQL
         │
┌────────▼─────────────┐
│   MySQL Database    │
│ ├─ users            │
│ ├─ agendamentos     │
│ └─ barbeiros        │
└─────────────────────┘
```

## Camadas

### Frontend
- Componentes React
- Gerenciamento de estado
- Interfaces de usuário

### Backend
- API REST com Express
- Autenticação e autorização
- Gerenciamento de dados

### Banco de Dados
- Tabelas de usuários
- Tabelas de agendamentos
- Tabelas de barbeiros
