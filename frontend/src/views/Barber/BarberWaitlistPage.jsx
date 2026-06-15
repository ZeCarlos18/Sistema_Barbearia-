import { useState, useEffect, useMemo } from "react";
import { FiUsers } from "react-icons/fi";

import WaitlistHeader from "../../components/Waitlist/WaitlistHeader";
import WaitlistSlotSelector from "../../components/Waitlist/WaitlistSlotSelector";
import WaitlistEntryPanelBarber from "../../components/Waitlist/WaitlistEntryPanelBarber";
import "../../styles/Barber/BarberWaitlist.css";
import {
  getWaitlistSlots,
  getSlotWaitlist,
  savePendingPositions,
  confirmReorder,
} from "../../services/waitlistService";

const criterionLabels = {
  waiting_time: "Tempo de Espera",
  position: "Posição Atual",
  arrival: "Ordem de Entrada",
};

const sortAlgorithms = {
  waiting_time: (a, b) => b.minutes_waiting - a.minutes_waiting,
  position: (a, b) => a.position - b.position,
  arrival: (a, b) => new Date(a.created_at) - new Date(b.created_at),
};

export default function BarberWaitlistPage() {
  const [queue, setQueue] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [sortCriterion, setSortCriterion] = useState("waiting_time");
  
  const [hasChanges, setHasChanges] = useState(false);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getUser = () => JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    async function loadSlots() {
      try {
        setLoading(true);
        setError("");
        const user = getUser();
        
        if (!user?.id) throw new Error("Usuário não encontrado");

        const result = await getWaitlistSlots(user.id, selectedDate);
        setSlots(result);

        if (result.length > 0) {
          setSelectedSlot(result[0].time);
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar horários da lista de espera.");
      } finally {
        setLoading(false);
      }
    }
    loadSlots();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedSlot) return;

    async function loadQueue() {
      try {
        setLoading(true);
        setError("");
        const user = getUser();

        const queueData = await getSlotWaitlist(user.id, selectedDate, selectedSlot);
        
        setQueue(queueData.entries || []);
        setLocked(queueData.locked || false);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar a fila de espera.");
      } finally {
        setLoading(false);
      }
    }
    loadQueue();
  }, [selectedSlot, selectedDate]);

  // Função para salvar alterações
  async function handleConfirmChanges() {
    try {
      const user = getUser();
      const positions = queue.map((entry, index) => ({
        id: entry.id,
        position: index + 1,
      }));

      await savePendingPositions(user.id, selectedDate, selectedSlot, positions);
      await confirmReorder(user.id, selectedDate, selectedSlot);

      setHasChanges(false);
      setSuccessMessage("Alterações salvas com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar alterações.");
    }
  }

  const sortedQueue = useMemo(() => {
    const sortFn = sortAlgorithms[sortCriterion] || sortAlgorithms.position;
    return [...queue].sort(sortFn);
  }, [queue, sortCriterion]); 

  return (
    <div className="barber-waitlist-page">
      <WaitlistHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        sortCriterion={sortCriterion}
        setSortCriterion={setSortCriterion}
      />

      <hr className="waitlist-divider" />

      {error && <div className="waitlist-error">{error}</div>}

      <div className="waitlist-counter">{queue.length} cliente(s) na fila</div>

      <div className="waitlist-active-criterion">
        Ordenando por: <strong>{criterionLabels[sortCriterion]}</strong>
      </div>

      <WaitlistSlotSelector
        slots={slots}
        selectedSlot={selectedSlot}
        onChange={setSelectedSlot}
      />

      {successMessage && (
        <div className="waitlist-success-message">{successMessage}</div>
      )}

      {loading ? (
        <div className="waitlist-loading">Carregando lista de espera...</div>
      ) : queue.length === 0 ? (
        <div className="waitlist-empty-state">
          <div className="waitlist-empty-icon"><FiUsers /></div>
          <h3>Nenhum cliente na fila</h3>
          <p>Não existem clientes aguardando na lista de espera até o momento.</p>
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