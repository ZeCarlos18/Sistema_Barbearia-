import React, { useState, useEffect, useCallback } from 'react';
import { getMyNotifications, markNotificationAsRead, deleteNotification } from '../../services/notificationService';
import { getMyWaitlist, acceptWaitlistEntry, refuseWaitlistEntry } from '../../services/waitlistService';
import './NotificationPanel.css';
import {
  FiClock,
  FiCalendar,
  FiBell,
  FiTrash2
} from 'react-icons/fi';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)} dias`;
}

function NotifIcon({ type }) {
  if (type === 'waitlist_notified') {
    return (
      <div className="notif-icon notif-icon--gold">
        <FiClock />
      </div>
    );
  }

  return (
    <div className="notif-icon">
      <FiBell />
    </div>
  );
}

export default function NotificationPanel({ isOpen, onClose, onAppointmentConfirmed }) {
  const [notifications, setNotifications] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyNotifications();

      const waitlist = await getMyWaitlist();

      setNotifications(Array.isArray(data) ? data : []);
      setWaitlistEntries(Array.isArray(waitlist) ? waitlist : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      load();
    }
  }, [isOpen, load]);

  const handleAccept = async (notification) => {
    setActing(notification.id);
    setFeedback(null);
    try {
      const entries = await getMyWaitlist();
      const notified = entries.find(e => e.status === 'notified');
      if (!notified) throw new Error('Vaga não encontrada ou já expirou.');

      await acceptWaitlistEntry(notified.id);
      await markNotificationAsRead(notification.id);

      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setFeedback({ type: 'success', text: 'Agendamento confirmado! Confira sua agenda.' });
      onAppointmentConfirmed?.();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao confirmar agendamento.' });
    } finally {
      setActing(null);
    }
  };

  const handleRefuse = async (notification) => {
    setActing(notification.id);
    setFeedback(null);
    try {
      const entries = await getMyWaitlist();
      const notified = entries.find(e => e.status === 'notified');
      if (!notified) throw new Error('Entrada na fila não encontrada.');

      await refuseWaitlistEntry(notified.id);
      await markNotificationAsRead(notification.id);

      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setFeedback({ type: 'info', text: 'Vaga recusada. O próximo da fila foi notificado.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao recusar vaga.' });
    } finally {
      setActing(null);
    }
  };

  const handleDismiss = async (notification) => {

    console.log('DELETE NOTIFICATION:', notification);

    try {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, status: 'read' } : n)
      );
    } catch {}
  };

  const handleDelete = async (notification) => {
    try {
      await deleteNotification(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch {}
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const notifiedEntry = waitlistEntries.find(
    entry => entry.status === 'notified'
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (time) => {
    return time?.slice(0, 5);
  };

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className="notif-panel" onClick={e => e.stopPropagation()}>

        <div className="notif-header">
          <div className="notif-header-left">
            <span className="notif-title">Notificações</span>
            {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
          </div>
          <button className="notif-close-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {feedback && (
          <div className={`notif-feedback notif-feedback--${feedback.type}`}>
            {feedback.text}
          </div>
        )}

        <div className="notif-list">
          {loading ? (
            <div className="notif-empty">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">
                <div className="notif-empty-icon">
                  <FiBell />
                </div>
              <p>Nenhuma notificação.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.status === 'unread' ? 'notif-item--unread' : ''}`}>
                {n.type !== 'waitlist_notified' && (
                  <div className="notif-item-top">
                    <NotifIcon type={n.type} />

                    <div className="notif-item-body">
                      <div className="notif-item-row">
                        <span className="notif-item-title">{n.title}</span>
                        <span className="notif-item-time">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>

                      <p className="notif-item-msg">
                        {n.message}
                      </p>
                    </div>

                    <button
                      className="notif-item-delete"
                      onClick={() => handleDelete(n)}
                      aria-label="Remover"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {n.type === 'waitlist_notified' && n.status === 'unread' && (
                  <div className="waitlist-card">

                    <h3 className="waitlist-card-title">
                      {n.title}
                    </h3>

                    <p className="waitlist-card-message">
                      {n.message}
                    </p>

                    <div className="waitlist-card-info">
                      <span>
                        {notifiedEntry
                          ? `${formatDate(notifiedEntry.date)} às ${formatTime(notifiedEntry.time)}`
                          : 'Horário indisponível'}
                      </span>
                      <br></br>
                      <strong>
                        Barbeiro: {notifiedEntry?.barber_name || 'Não informado'}
                      </strong>
                    </div>

                    <div className="waitlist-warning">
                      <FiClock />
                      <span>
                        Confirme em até 15 minutos para garantir sua vaga.
                        Senão, ela será disponibilizada ao próximo cliente da fila.
                      </span>
                      
                    </div>

                    <button
                      className="waitlist-confirm-btn"
                      disabled={acting === n.id}
                      onClick={() => handleAccept(n)}
                    >
                      {acting === n.id ? 'AGUARDE...' : 'CONFIRMAR HORÁRIO'}
                    </button>

                    <button
                      className="waitlist-refuse-btn"
                      disabled={acting === n.id}
                      onClick={() => handleRefuse(n)}
                    >
                      RECUSAR VAGA
                    </button>

                    <p className="waitlist-refuse-note">
                      Ao recusar, a vaga será oferecida ao próximo cliente da fila.
                    </p>

                    <button
                      className="waitlist-delete-btn"
                      onClick={() => handleDelete(n)}
                    >
                      <FiTrash2 />
                      <span>Excluir notificação</span>
                    </button>

                  </div>
                )}

                {n.type !== 'waitlist_notified' && n.status === 'unread' && (
                  <button
                    className="notif-read-btn"
                    onClick={() => handleDismiss(n)}
                  >
                    Marcar como lida
                  </button>
                )}

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
