import { useState } from 'react';

import WaitlistHeader from '../../../components/Waitlist/WaitlistHeader';
import WaitlistSlotSelector from '../../../components/Waitlist/WaitlistSlotSelector';
import WaitlistEntryPanelBarber from '../../../components/Waitlist/WaitlistEntryPanelBarber';
import '../../../styles/BarberWaitlist.css';

export default function BarberWaitlistPage() {

  const [selectedSlot, setSelectedSlot] = useState('14:30');

  const [hasChanges, setHasChanges] = useState(false);

  const [queue, setQueue] = useState([
    {
      id: '1',
      name: 'João Silva',
      requestedTime: '14:30',
      waitingTime: '47 min'
    },
    {
      id: '2',
      name: 'Marcos',
      requestedTime: '14:30',
      waitingTime: '30 min'
    },
    {
      id: '3',
      name: 'Vinicius',
      requestedTime: '14:30',
      waitingTime: '12 min'
    },
    {
      id: '4',
      name: 'Paulo',
      requestedTime: '14:30',
      waitingTime: '5 min'
    }
  ]);

  return (
    <div className="barber-waitlist-page">

      <WaitlistHeader />

      <hr className="waitlist-divider" />

      <WaitlistSlotSelector
        selectedSlot={selectedSlot}
        onChange={setSelectedSlot}
      />

      {hasChanges && (
        <div className="waitlist-pending-alert">
          Alterações pendentes
        </div>
      )}

      <WaitlistEntryPanelBarber
        entries={queue}
        setEntries={setQueue}
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
      />

    </div>
  );
}