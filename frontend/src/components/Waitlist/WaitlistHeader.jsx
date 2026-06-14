import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../../styles/BarberWaitlist.css';

export default function WaitlistHeader({
  selectedDate,
  setSelectedDate,
  sortCriterion,
  setSortCriterion
}) {
  const navigate = useNavigate();

  const user =
    JSON.parse(
      localStorage.getItem('user')
    );

  const barberName =
    user?.name || 'Barbeiro';

  return (
    <div className="waitlist-header">
         
      <button
        className="waitlist-back-btn"
        onClick={() => navigate('/barber/profile')}
      >
        <FiArrowLeft />
      </button>

      <h1 className="waitlist-title">
        Fila de Espera
      </h1>

      <span className="waitlist-barber-name">
        {barberName}
      </span>

      <div className="waitlist-filters">
        <input
        className="waitlist-date-input"
          type="date"
          value={selectedDate}
          onChange={(e) =>
            setSelectedDate(
              e.target.value
            )
          }
        />

        <select
          className="waitlist-sort-select"
          value={sortCriterion}
          onChange={(e) =>
            setSortCriterion(
              e.target.value
            )
          }
        >

          <option value="waiting_time">
            Tempo de Espera
          </option>

          <option value="position">
            Posição Atual
          </option>

          <option value="arrival">
            Ordem de Entrada
          </option>

        </select>
      </div>

    </div>
  );
}