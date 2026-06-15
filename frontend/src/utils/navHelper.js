// frontend/src/utils/navHelper.js

/**
 * Mapeia o pathname atual para o ID do botão ativo no BottomNav
 * @param {string} pathname - O pathname da rota atual
 * @returns {string} - O ID do botão que deve estar ativo
 */
export const getActiveNavItem = (pathname) => {
  const navMap = {
    '/booking': 'search',
    '/appointments': 'calendar',
    '/profile': 'profile',
    '/dashboard-barbeiro': 'dashboard'
  };

  return navMap[pathname] || 'home';
};

/**
 * Mapeia o ID do botão clicado para a Rota (URL) de destino do Barbeiro
 * @param {string} item - O ID do botão clicado (home, search, calendar, etc)
 * @returns {string} - A URL completa para o redirecionamento
 */
export const getBarberRouteFromNavItem = (item) => {
  const routes = {
    home: '/barber-dashboard',
    dashboard: '/barber-dashboard',
    search: '/barber-dashboard?tab=search',
    calendar: '/barber-chief?section=availability',
    profile: '/barber-chief?section=menu'
  };

  return routes[item] || `/barber-dashboard?tab=${item}`;
};