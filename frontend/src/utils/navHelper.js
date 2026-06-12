/**
 * Mapeia o pathname atual para o ID do botão ativo no BottomNav
 * @param {string} pathname - O pathname da rota atual
 * @returns {string} - O ID do botão que deve estar ativo (home, dashboard, search, calendar, profile)
 */
export const getActiveNavItem = (pathname) => {
  if (pathname === '/home') return 'home';
  if (pathname === '/booking') return 'search';
  if (pathname === '/appointments') return 'calendar';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/barber-dashboard') return 'home';
  if (pathname === '/dashboard-barbeiro') return 'dashboard';
  if (pathname === '/barber-chief') return 'home';
  if (pathname === '/barber-create') return 'home';
  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/recover') {
    return 'home';
  }
  return 'home';
};
