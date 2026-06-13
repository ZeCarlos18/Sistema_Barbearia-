export default function WaitlistSlotSelector({
  slots,
  selectedSlot,
  onChange
}) {

  return (
    <select
      value={selectedSlot}
      onChange={(e) => onChange(e.target.value)}
      className="waitlist-slot-selector"
    >
      {slots.map((slot) => (
        <option
          key={slot.time}
          value={slot.time}
        >
          {slot.time.slice(0, 5)}
          {' '}
          ({slot.waiting_count})
        </option>
      ))}
    </select>
  );
}