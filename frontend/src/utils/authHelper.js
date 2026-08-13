const VALID_ROLES = ['admin', 'barber', 'client'];

/**
 * Lê o usuário salvo em localStorage/sessionStorage.
 * Se o cargo (role) estiver ausente ou for inválido, limpa as credenciais
 * armazenadas e retorna null, evitando que a aplicação confie em um usuário
 * com permissões indefinidas.
 */
export function getStoredUser() {
  const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!stored) return null;

  try {
    const user = JSON.parse(stored);
    const userRole = user?.role ? String(user.role).toLowerCase() : '';

    if (!VALID_ROLES.includes(userRole)) {
      localStorage.clear();
      sessionStorage.clear();
      return null;
    }

    user.role = userRole;
    return user;
  } catch {
    return null;
  }
}
