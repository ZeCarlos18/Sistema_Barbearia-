import css from '../../styles/BarberWaitlist.css';

export default function WaitlistSlotSelector({
  selectedSlot,
  onChange
}) {

  return (
    <select
      value={selectedSlot}
      onChange={(e) => onChange(e.target.value)}
      className="waitlist-slot-selector"
    >
      <option value="14:30">14:30</option>
      <option value="15:00">15:00</option>
      <option value="15:30">15:30</option>
      <option value="16:00">16:00</option>
    </select>
  );
}