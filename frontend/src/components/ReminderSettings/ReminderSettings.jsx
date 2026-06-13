import React from 'react';
import PropTypes from 'prop-types';
import './ReminderSettings.css';

export default function ReminderSettings({ isOpen, onClose, initial = {}, onSave }) {
  const [lead, setLead] = React.useState(initial.lead || '1h');
  const [appChannel, setAppChannel] = React.useState(Boolean(initial.appChannel ?? true));
  const [emailChannel, setEmailChannel] = React.useState(Boolean(initial.emailChannel ?? false));

  React.useEffect(() => {
    if (isOpen) {
      setLead(initial.lead || '1h');
      setAppChannel(Boolean(initial.appChannel ?? true));
      setEmailChannel(Boolean(initial.emailChannel ?? false));
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  function handleSave() {
    const payload = { lead, appChannel, emailChannel };
    try {
      localStorage.setItem('reminderSettings', JSON.stringify(payload));
    } catch (e) { /* ignore */ }
    onSave?.(payload);
    onClose?.();
  }

  return (
    <div className="reminder-overlay" onClick={onClose}>
      <div className="reminder-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className="reminder-title">Antecedência do Lembrete</h3>

        <div className="reminder-leads">
          <button type="button" className={`reminder-lead ${lead === '30m' ? 'is-active' : ''}`} onClick={() => setLead('30m')}>30min</button>
          <button type="button" className={`reminder-lead ${lead === '1h' ? 'is-active' : ''}`} onClick={() => setLead('1h')}>1H</button>
          <button type="button" className={`reminder-lead ${lead === '2h' ? 'is-active' : ''}`} onClick={() => setLead('2h')}>2H</button>
          <button type="button" className={`reminder-lead ${lead === '24h' ? 'is-active' : ''}`} onClick={() => setLead('24h')}>24H</button>
        </div>

        <h4 className="reminder-sub">Canais de envio</h4>

        <div className="reminder-channels">
          <label className="reminder-channel">
            <span>Pelo aplicativo</span>
            <button type="button" className={`reminder-toggle ${appChannel ? 'is-on' : ''}`} onClick={() => setAppChannel((v) => !v)} aria-pressed={appChannel}>
              <span className="reminder-thumb" />
            </button>
          </label>

          <label className="reminder-channel">
            <span>Pelo Email</span>
            <button type="button" className={`reminder-toggle ${emailChannel ? 'is-on' : ''}`} onClick={() => setEmailChannel((v) => !v)} aria-pressed={emailChannel}>
              <span className="reminder-thumb" />
            </button>
          </label>
        </div>

        <button type="button" className="reminder-save" onClick={handleSave}>SALVAR CONFIGURAÇÃO</button>
      </div>
    </div>
  );
}

ReminderSettings.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  initial: PropTypes.object,
  onSave: PropTypes.func
};

ReminderSettings.defaultProps = {
  isOpen: false,
  onClose: () => {},
  initial: {},
  onSave: () => {}
};
