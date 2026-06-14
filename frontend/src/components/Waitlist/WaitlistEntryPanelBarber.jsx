import WaitlistCard from './WaitlistCard';

export default function WaitlistEntryPanelBarber({
  entries,
  setEntries,
  hasChanges,
  setHasChanges,
  onConfirm,
  locked
}) {

  const moveUp = (index) => {

    if (locked) return;

    if (index === 0) return;

    const updated = [...entries];

    [updated[index - 1], updated[index]] =
      [updated[index], updated[index - 1]];

    setEntries(updated);
    setHasChanges(true);
  };

  const moveDown = (index) => {
    if (locked) return;
    if (index === entries.length - 1) return;

    const updated = [...entries];

    [updated[index + 1], updated[index]] =
      [updated[index], updated[index + 1]];

    setEntries(updated);
    setHasChanges(true);
  };


  return (
    <div>
      <div className="waitlist-priority-badge">
        Tempo de Espera
      </div>

      {entries.map((entry, index) => (
        <WaitlistCard
          key={entry.id}
          entry={entry}
          position={index + 1}
          onMoveUp={() => moveUp(index)}
          onMoveDown={() => moveDown(index)}
          locked={locked}
        />
      ))}

      {hasChanges && (
        <button
          className="waitlist-confirm-btn"
          onClick={onConfirm}
        >
          CONFIRMAR ALTERAÇÕES
        </button>
      )}

    </div>
  );
}