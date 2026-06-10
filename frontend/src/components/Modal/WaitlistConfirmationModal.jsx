import React from 'react';
import PropTypes from 'prop-types';
import './WaitlistConfirmationModal.css';
import { FaCheck } from 'react-icons/fa';

/**
 * Modal de confirmação ao entrar na lista de espera.
 *
 * Espera receber waitlistData com formato:
 * {
 *   position: number,
 *   barberName: string,
 *   date: string (YYYY-MM-DD),
 *   time: string (HH:MM ou identificador do período)
 * }
 */
function WaitlistConfirmationModal({ isOpen, onClose, waitlistData }) {
  if (!isOpen) return null;

  const position = waitlistData?.position;
  const barberName = waitlistData?.barberName;
  const date = waitlistData?.date;
  const time = waitlistData?.time;

  return (
    <div className="appointment-confirmation-modal-backdrop">
      <div className="appointment-confirmation-modal">
        <div className="appointment-confirmation-modal__header">
          <h3>Você entrou na lista de espera!</h3>
          <div className="waitlist-success-icon">
            <FaCheck />
          </div>
        </div>

        <div className="appointment-confirmation-modal__body">
          {typeof position === 'number' ? (
            <div className="waitlist-position">
              Sua posição na fila<br />
              <strong>{position}</strong>
            </div>
          ) : (
            <p>Recebemos sua solicitação.</p>
          )}

          <div className="appointment-confirmation-modal__summary">
            <div className="appointment-confirmation-modal__row">
              <span>Barbeiro</span>
              <strong>{barberName || '-'}</strong>
            </div>
            <div className="appointment-confirmation-modal__row">
              <span>Data</span>
              <strong>{date || '-'}</strong>
            </div>
            <div className="appointment-confirmation-modal__row">
              <span>Horário/Período</span>
              <strong>{time || '-'}</strong>
            </div>
          </div>

          <p className="appointment-confirmation-modal__note">
            Assim que surgir uma vaga, você será avisado.
          </p>
        </div>

        <div className="appointment-confirmation-modal__footer">
          <button className="appointment-confirmation-modal__cta" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

WaitlistConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  waitlistData: PropTypes.shape({
    position: PropTypes.number,
    barberName: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
  }),
};

WaitlistConfirmationModal.defaultProps = {
  waitlistData: null,
};

export default WaitlistConfirmationModal;

