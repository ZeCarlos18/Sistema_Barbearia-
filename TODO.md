ro# TODO - Correção de Avatar e Preço em Agendamentos

- [x] Atualizar `backend/src/controllers/UserController.js` no método `getProfile` para incluir `avatar` no payload retornado.
- [x] Atualizar `backend/src/models/Appointment.js` para fazer `findAll()` e `findById()` retornarem o preço do serviço como `service_price`.

- [ ] Validar manualmente (rodar o backend e conferir no browser/postman):
  - endpoint de perfil (`/api/users/profile`) retorna `avatar`.
  - endpoints de agendamentos usados no frontend retornam `service_price` (e/ou `price`).

