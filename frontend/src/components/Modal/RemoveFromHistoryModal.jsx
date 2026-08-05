import React from 'react';
import PropTypes from 'prop-types';
import './AppointmentConfirmationModal.css';

export default function RemoveFromHistoryModal({ isOpen, onClose, onConfirm, appointment }) {
  const [dontAsk, setDontAsk] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) setDontAsk(false);
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  function handleConfirm() {
    try {
      if (dontAsk) localStorage.setItem('dontAskRemoveHistory', '1');
      onConfirm(appointment.id);
    } finally {
      onClose();
    }
  }

  return (
    <>
      <div className="confirmation-modal__backdrop" onClick={onClose} />
      <div className="confirmation-modal">
        <h1 className="confirmation-modal__title">Remover do histórico?</h1>

        <div className="confirmation-modal__details">
          <div className="confirmation-modal__detail-row">
            <div className="confirmation-modal__detail-item">
              <span className="confirmation-modal__label">Barbeiro:</span>
              <span className="confirmation-modal__value">{appointment.barberName}</span>
            </div>
            <div className="confirmation-modal__detail-item">
              <span className="confirmation-modal__label">Serviço</span>
              <span className="confirmation-modal__value">{appointment.serviceName}</span>
            </div>
          </div>

          <div className="confirmation-modal__detail-row">
            <div className="confirmation-modal__detail-item">
              <span className="confirmation-modal__label">Data</span>
              <span className="confirmation-modal__value">{appointment.date}</span>
            </div>
            <div className="confirmation-modal__detail-item">
              <span className="confirmation-modal__label">Horário</span>
              <span className="confirmation-modal__value">{appointment.time}</span>
            </div>
          </div>
        </div>

        <label className="confirmation-modal__checkbox">
          <input type="checkbox" checked={dontAsk} onChange={(e) => setDontAsk(e.target.checked)} />
          <span>Não perguntar novamente</span>
        </label>

        <div className="confirmation-modal__button--group" style={{ marginTop: 12 }}>
          <button className="confirmation-modal__button confirmation-modal__button--ghost" onClick={onClose} type="button">Cancelar</button>
          <button className="confirmation-modal__button confirmation-modal__button--danger" onClick={handleConfirm} type="button">Excluir</button>
        </div>
      </div>
    </>
  );
}

RemoveFromHistoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  appointment: PropTypes.object
};
