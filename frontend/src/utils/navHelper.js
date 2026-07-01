// frontend/src/utils/navHelper.js

/**
 * Mapeia o pathname atual para o ID do botão ativo no BottomNav
 * @param {string} pathname - O pathname da rota atual
 * @returns {string} - O ID do botão que deve estar ativo
 */
export const getActiveNavItem = (pathname, search = '') => {

  if (pathname === '/barber-chief') {

    const params = new URLSearchParams(search);
    const section = params.get('section');

    if (section === 'availability' || section === 'agenda')
      return 'calendar';

    if (section === 'menu')
      return 'profile';
  }

  const navMap = {
    '/booking': 'search',
    '/appointments': 'calendar',
    '/profile': 'profile',
    '/dashboard-barbeiro': 'dashboard',
    '/barber-dashboard': 'home'
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
    dashboard: '/dashboard-barbeiro',
    search: '/barber-dashboard?tab=search',
    calendar: '/barber-chief?section=agenda',
    profile: '/barber-chief?section=menu'
  };

  return routes[item] || `/barber-dashboard?tab=${item}`;
};