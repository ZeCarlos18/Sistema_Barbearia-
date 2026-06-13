import { useState, useEffect } from 'react';

import WaitlistHeader from '../../../components/Waitlist/WaitlistHeader';
import WaitlistSlotSelector from '../../../components/Waitlist/WaitlistSlotSelector';
import WaitlistEntryPanelBarber from '../../../components/Waitlist/WaitlistEntryPanelBarber';
import '../../../styles/BarberWaitlist.css';
import { getWaitlistSlots, getSlotWaitlist, savePendingPositions, confirmReorder } from '../../../services/waitlistService';

export default function BarberWaitlistPage() {

  const [hasChanges, setHasChanges] = useState(false);
  const [queue, setQueue] = useState([]);
  const [selectedSlot, setSelectedSlot] =
    useState('');
  const [slots, setSlots] = useState([]);
  const [successMessage, setSuccessMessage] =
  useState('');

  useEffect(() => {
    async function load() {

      const user =
        JSON.parse(localStorage.getItem('user'));

        console.log('USER:', user);

      const result =
        await getWaitlistSlots(
          user.id,
          '2026-06-11'
        );

        setSlots(result);

      if (result.length > 0) {
        setSelectedSlot(result[0].time);
      }

      console.log(result);

      console.log('SLOTS:', result);

    }

    load();
  }, []);

  useEffect(() => {

    if (!selectedSlot) return;

    async function loadQueue() {

      const user =
        JSON.parse(localStorage.getItem('user'));

      const queueData =
        await getSlotWaitlist(
          user.id,
          '2026-06-11',
          selectedSlot
        );

      console.log(
        'QUEUE FULL:',
        queueData
      );

      setQueue(
        queueData.entries || []
      );
    }

    loadQueue();

  }, [selectedSlot]);

  async function handleConfirmChanges() {

  const user =
    JSON.parse(localStorage.getItem('user'));

  const positions =
    queue.map((entry, index) => ({
      id: entry.id,
      position: index + 1
    }));


  await savePendingPositions(
    user.id,
    '2026-06-11',
    selectedSlot,
    positions
  );

  const result = await confirmReorder(
    user.id,
    '2026-06-11',
    selectedSlot
  );

  setHasChanges(false);

    setSuccessMessage(
      'Alterações salvas com sucesso!'
    );

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);

}

  return (
    <div className="barber-waitlist-page">

      <WaitlistHeader />

      <hr className="waitlist-divider" />

      <WaitlistSlotSelector
        slots={slots}
        selectedSlot={selectedSlot}
        onChange={setSelectedSlot}
      />

      {successMessage && (
        <div className="waitlist-success-message">
          {successMessage}
        </div>
      )}

      <WaitlistEntryPanelBarber
        entries={queue}
        setEntries={setQueue}
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
        onConfirm={handleConfirmChanges}
      />

    </div>
  );
}