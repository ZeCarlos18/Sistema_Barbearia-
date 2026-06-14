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

  const [loading, setLoading] =
  useState(false);

  const [error, setError] =
  useState('');

  useEffect(() => {
    async function load() {
      try{
        setLoading(true);
        setError('');

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

      } catch (err) {
        console.error(err);

        setError(
          'Erro ao carregar horários da lista de espera.'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedDate]);

  useEffect(() => {

    if (!selectedSlot) return;

    async function loadQueue() {
      try {
        setLoading(true);
        setError('');

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

      } catch (err) {
        console.error(err);
        setError(
          'Erro ao carregar a fila de espera.'
        );

      } finally {
        setLoading(false);
      }
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

      {error && (

        <div className="waitlist-error">

          {error}

        </div>

      )}

      <div className="waitlist-counter">
        {queue.length} cliente(s) na fila
      </div>

      <div className="waitlist-active-criterion">

        Ordenando por:

        <strong>

          {
            sortCriterion === 'waiting_time'
              ? ' Tempo de Espera'
              : sortCriterion === 'position'
                ? ' Posição Atual'
                : ' Ordem de Entrada'
          }

        </strong>

      </div>

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

      {loading ? (

        <div className="waitlist-loading">
          Carregando lista de espera...
        </div>

      ) : queue.length === 0 ? (

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
