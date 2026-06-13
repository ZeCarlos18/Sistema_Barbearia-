import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../../styles/BarberWaitlist.css';

export default function WaitlistHeader() {
  const navigate = useNavigate();

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

      <span className="waitlist-subtitle">
        Sáb 13 Abr - Lucas
      </span>

      <select className="waitlist-criteria-select">
        <option>Critérios da Lista</option>
        <option>Tempo de Espera</option>
        <option>Quantidade de Cortes</option>
      </select>

    </div>
  );
}