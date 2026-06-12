import '../../styles/BarberWaitlist.css';

export default function WaitlistHeader() {
  return (
    <div className="waitlist-header">

          <div>
              <h1>Fila de Espera</h1>
              <p>Sáb 13 Abr - Lucas</p>
          </div>

      <select className="waitlist-criteria-select">
        <option>Critérios da Lista</option>
        <option>Tempo de Espera</option>
        <option>Quantidade de Cortes</option>
      </select>
    </div>
  );
}