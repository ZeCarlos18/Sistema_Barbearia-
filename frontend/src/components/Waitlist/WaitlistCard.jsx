export default function WaitlistCard({
  position,
  entry,
  onMoveUp,
  onMoveDown
}) {
  return (
   <div className="waitlist-card">

          <div className="waitlist-position">
              {position}
          </div>

          <div className="waitlist-content">
              <strong>{entry.name}</strong>

              <span>
                  Horário desejado: {entry.requestedTime}
              </span>

              <span>
                  Na fila há {entry.waitingTime}
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