import PropTypes from 'prop-types';
import './SchedulItem.css';

/**
 * Item individual da agenda
 * Exibe um agendamento com horário, cliente e serviço
 * 
 * @param {Object} props - Props do componente
 * @param {string} props.time - Horário do agendamento (ex: "14:00")
 * @param {string} props.clientName - Nome do cliente (ex: "João Silva")
 * @param {string} props.service - Nome do serviço (ex: "Corte social")
 * @param {function} [props.onClick] - Callback ao clicar no item (futuro)
 * @returns {JSX.Element} Item de agendamento
 * 
 * @example
 * <ScheduleItem 
 *   time="14:00" 
 *   clientName="João Silva" 
 *   service="Corte social" 
 * />
 */
function ScheduleItem({ time, clientName, service, onClick }) {
  return (
    <div className="schedule-item" onClick={onClick}>
      <span className="schedule-item__time">{time}</span>
      <div className="schedule-item__info">
        <p className="schedule-item__client">{clientName}</p>
        <p className="schedule-item__service">{service}</p>
      </div>
    </div>
  );
}

ScheduleItem.propTypes = {
  time: PropTypes.string.isRequired,
  clientName: PropTypes.string.isRequired,
  service: PropTypes.string.isRequired,
  onClick: PropTypes.func
};

export default ScheduleItem;

