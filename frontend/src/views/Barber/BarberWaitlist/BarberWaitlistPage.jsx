import { useState, useEffect } from 'react';

import WaitlistHeader from '../../../components/Waitlist/WaitlistHeader';
import WaitlistSlotSelector from '../../../components/Waitlist/WaitlistSlotSelector';
import WaitlistEntryPanelBarber from '../../../components/Waitlist/WaitlistEntryPanelBarber';
import '../../../styles/BarberWaitlist.css';
import { getWaitlistSlots, getSlotWaitlist, savePendingPositions, confirmReorder } from '../../../services/waitlistService';
import { FiUsers } from 'react-icons/fi';

export default function BarberWaitlistPage() {

  const [hasChanges, setHasChanges] = useState(false);

  const [queue, setQueue] = useState([]);

  const [selectedSlot, setSelectedSlot] =
    useState('');

  const [slots, setSlots] = useState([]);

  const [successMessage, setSuccessMessage] =
  useState('');

  const [selectedDate, setSelectedDate] =
  useState(
    new Date().toISOString().split('T')[0]
  );

  const [sortCriterion, setSortCriterion] =
  useState('waiting_time');

  const [locked, setLocked] = useState(false);
  console.log('TODAY:', selectedDate);

  useEffect(() => {
    async function load() {

      const user =
        JSON.parse(localStorage.getItem('user'));

        console.log('USER:', user);

      const result =
        await getWaitlistSlots(
          user.id,
          selectedDate
        );

        setSlots(result);

      if (result.length > 0) {
        setSelectedSlot(result[0].time);
      }

      console.log(result);

      console.log('SLOTS:', result);

    }

    load();
  }, [selectedDate]);

  useEffect(() => {

    if (!selectedSlot) return;

    async function loadQueue() {

      const user =
        JSON.parse(localStorage.getItem('user'));

      const queueData =
        await getSlotWaitlist(
          user.id,
          selectedDate,
          selectedSlot
        );

      console.log(
        'QUEUE FULL:',
        queueData
      );

      setQueue(
        queueData.entries || []
      );

      setLocked(
        queueData.locked || false
      );
      console.log('LOCKED:', queueData.locked);
    }

    loadQueue();

  }, [selectedSlot, selectedDate]);

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
    selectedDate,
    selectedSlot,
    positions
  );

  const result = await confirmReorder(
    user.id,
    selectedDate,
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

const sortedQueue =
  [...queue];

  if (sortCriterion === 'waiting_time') {

  sortedQueue.sort(
    (a, b) =>
      b.minutes_waiting -
      a.minutes_waiting
  );

}

if (sortCriterion === 'position') {

  sortedQueue.sort(
    (a, b) =>
      a.position -
      b.position
  );

}

if (sortCriterion === 'arrival') {

  sortedQueue.sort(
    (a, b) =>
      new Date(a.created_at) -
      new Date(b.created_at)
  );

}

  return (
    <div className="barber-waitlist-page">



      <WaitlistHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        sortCriterion={sortCriterion}
        setSortCriterion={setSortCriterion}
      />

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

      {queue.length === 0 ? (

  <div className="waitlist-empty-state">

          <div className="waitlist-empty-icon">
              <FiUsers />
          </div>

          <h3>
            Nenhum cliente na fila
          </h3>

          <p>
            Não existem clientes aguardando
            na lista de espera até o momento.
          </p>

        </div>

      ) : (

        <WaitlistEntryPanelBarber
          entries={sortedQueue}
          setEntries={setQueue}
          hasChanges={hasChanges}
          setHasChanges={setHasChanges}
          onConfirm={handleConfirmChanges}
          locked={locked}
        />

      )}

    </div>
  );
}