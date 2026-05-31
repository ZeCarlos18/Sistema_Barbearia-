import PropTypes from 'prop-types';
import { FiBell } from 'react-icons/fi';
import './BarberHeader.css';

/**
 * Cabeçalho do dashboard do barbeiro
 * Exibe: avatar, mensagem de boas-vindas, nome e ícone de notificação
 * 
 * @param {Object} props - Props do componente
 * @param {string} props.name - Nome do barbeiro (ex: "Lucas")
 * @param {string} props.avatar - URL da foto do barbeiro
 * @param {function} [props.onNotificationClick] - Callback ao clicar no sino
 * @returns {JSX.Element} Cabeçalho do dashboard
 * 
 * @example
 * <BarberHeader 
 *   name="Lucas" 
 *   avatar="https://i.pravatar.cc/150?img=12"
 *   onNotificationClick={() => console.log('Notificação')}
 * />
 */
function BarberHeader({ name, avatar, onNotificationClick }) {
  return (
    <header className="barber-header">
      <div className="barber-header__content">
        {/* Avatar do barbeiro */}
        <img 
          src={avatar} 
          alt={name}
          className="barber-header__avatar"
        />

        {/* Info de boas-vindas */}
        <div className="barber-header__info">
          <p className="barber-header__label">Bem-Vindo</p>
          <h1 className="barber-header__name">{name}</h1>
        </div>

        {/* Botão de notificação */}
        <button 
          className="barber-header__notification-btn"
          onClick={onNotificationClick}
          aria-label="Notificações"
        >
          <FiBell size={24} />
        </button>
      </div>
    </header>
  );
}

BarberHeader.propTypes = {
  name: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired,
  onNotificationClick: PropTypes.func
};

BarberHeader.defaultProps = {
  onNotificationClick: () => {}
};

export default BarberHeader;