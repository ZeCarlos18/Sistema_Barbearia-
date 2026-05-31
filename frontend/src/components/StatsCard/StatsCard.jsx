import PropTypes from 'prop-types';
import './StatsCard.css';

/**
 * Card reutilizável para exibir um stat (estatística)
 * Mostra um número grande com um label descritivo
 * 
 * @param {Object} props - Props do componente
 * @param {string|number} props.value - Valor a exibir (ex: "8" ou "R$120")
 * @param {string} props.label - Label descritivo (ex: "Atendimentos hoje")
 * @param {string} [props.variant='default'] - Variante visual: 'default' | 'profit' | 'remaining'
 * @returns {JSX.Element} Card de estatística
 * 
 * @example
 * <StatsCard value={8} label="Atendimentos hoje" />
 * <StatsCard value="R$120" label="Lucro do dia" variant="profit" />
 */
const StatsCard = ({ value, label, variant = 'default' }) => (
  <div className={`stats-card stats-card--${variant}`}>
    <p className="stats-card__label">{label}</p>
    <h2 className="stats-card__value">{value}</h2>
  </div>
);

StatsCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['default', 'profit', 'remaining'])
};

StatsCard.defaultProps = {
  variant: 'default'
};

export default StatsCard;

