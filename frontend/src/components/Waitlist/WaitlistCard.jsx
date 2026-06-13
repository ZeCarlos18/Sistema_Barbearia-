export default function WaitlistCard({
  position,
  entry,
  onMoveUp,
  onMoveDown
}) {

    function formatWaitingTime(minutes) {

        const hours = Math.floor(minutes / 60);

        const remainingMinutes =
            minutes % 60;

        if (hours <= 0) {
            return `${remainingMinutes} min`;
        }

        return `${hours}h ${remainingMinutes}min`;
    }


  return (
   <div className="waitlist-card">

          <div className="waitlist-position">
              {position}
          </div>

          <div className="waitlist-content">
              <strong>{entry.user_name}</strong>

              <span>
                  Serviço: {entry.service_name}
              </span>

              <span>
                  Horário: {entry.time?.slice(0, 5)}
              </span>


              <span>
                  Esperando há {formatWaitingTime(entry.minutes_waiting)}
              </span>
          </div>

          <div className="waitlist-move-buttons">
              <button
                  className="waitlist-move-btn"
                  onClick={onMoveUp}
              >
                  ↑
              </button>

              <button
                  className="waitlist-move-btn"
                  onClick={onMoveDown}
              >
                  ↓
              </button>
          </div>

      </div>
  );
}