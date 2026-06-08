import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './WaitlistEntryPanel.css';

/** Painel usado no Booking step 3
 * Faz a inscrição chamando o serviço (passado via props) e retorna dados para modal.
 */

function WaitlistEntryPanel({
    selectedBarberId,
    selectedDateISO,
    selectedTime,
    onSubmit,
    alreadyInQueue,
}) {
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleEnterWaitlist = async () => {
        setLocalError('');

        if (!selectedBarberId || !selectedDateISO || !selectedTime) {
            setLocalError('Selecione um período válido.');
            return;
        }

        if (alreadyInQueue) {
            setLocalError('Você já está na lista de espera para este período.');
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                barberId: selectedBarberId,
                date: selectedDateISO,
                time: selectedTime,
            });
        } catch (err) {
            setLocalError(err.message || 'Não foi possível entrar na lista de espera');
        } finally {
            setLoading(false);
        }
    };
    return (
        <section className="waitlist-panel">
            <div className="waitlist-panel__title">Horário indisponível</div>
            <div className="waitlist-panel__subtitle">
                Entre na lista de espera para <strong>{selectedTime}</strong>
            </div>

            {localError ? <div className="waitlist-panel__error">{localError}</div> : null}

            <button
                className="booking-cta waitlist-panel__cta"
                onClick={handleEnterWaitlist}
                disabled={loading || alreadyInQueue}
            >
                {loading ? 'ENTRANDO...' : alreadyInQueue ? 'JÁ NA LISTA' : 'ENTRAR NA LISTA DE ESPERA'}
            </button>

            <div className="waitlist-panel__hint">
                Você verá sua posição na fila após o cadastro.
            </div>

        </section>
    );
}

WaitlistEntryPanel.propTypes = {
  selectedBarberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedDateISO: PropTypes.string,
  selectedTime: PropTypes.string,

  // Função disparada ao clicar: deve fazer createWaitlistEntry e retornar position
  onSubmit: PropTypes.func.isRequired,

  // Validação visual/lógica 
  alreadyInQueue: PropTypes.bool,
};

WaitlistEntryPanel.defaultProps = {
  selectedBarberId: '',
  selectedDateISO: '',
  selectedTime: '',
  alreadyInQueue: false,
};

export default WaitlistEntryPanel;