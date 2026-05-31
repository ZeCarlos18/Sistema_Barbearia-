import PropTypes from 'prop-types';
import SchedulItem from '../SchedulItem/SchedulItem';
import './ScheduleList.css';

/**
 * Lista de agendamentos do dia
 * Renderiza uma seção com título e lista de ScheduleItem
 * 
 * @param {Object} props - Props do componente
 * @param {Array<{id: string|number, time: string, clientName: string, service: string}>} props.schedule - Array de agendamentos
 * @param {boolean} [props.isLoading] - Indica se está carregando
 * @param {string} [props.emptyMessage] - Mensagem exibida quando não há agendamentos
 * @returns {JSX.Element} Seção com lista de agendamentos
 * 
 * @example
 * <ScheduleList 
 *   schedule={[{id: 1, time: "14:00", clientName: "João", service: "Corte"}]} 
 *   isLoading={false}
 * />
 */
function ScheduleList({ schedule = [], isLoading = false, emptyMessage = 'Nenhum agendamento' }) {
  return (
    <section className="schedule-section">
      <h2 className="schedule-section__title">AGENDA DO DIA</h2>
      
      {isLoading ? (
        <p className="schedule-section__loading">Carregando agendamentos...</p>
      ) : schedule.length > 0 ? (
        <div className="schedule-section__list">
          {schedule.map((item) => (
            <SchedulItem
              key={item.id}
              time={item.time}
              clientName={item.clientName}
              service={item.service}
            />
          ))}
        </div>
      ) : (
        <p className="schedule-section__empty">{emptyMessage}</p>
      )}
    </section>
  );
}

ScheduleList.propTypes = {
  schedule: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      time: PropTypes.string.isRequired,
      clientName: PropTypes.string.isRequired,
      service: PropTypes.string.isRequired
    })
  ),
  isLoading: PropTypes.bool,
  emptyMessage: PropTypes.string
};

ScheduleList.defaultProps = {
  schedule: [],
  isLoading: false,
  emptyMessage: 'Nenhum agendamento'
};

export default ScheduleList;

