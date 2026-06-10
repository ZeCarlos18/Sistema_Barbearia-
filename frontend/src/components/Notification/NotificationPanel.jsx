import React, { useState, useEffect, useCallback } from 'react';
import { getMyNotifications, markNotificationAsRead, deleteNotification } from '../../services/notificationService';
import { getMyWaitlist, acceptWaitlistEntry, refuseWaitlistEntry } from '../../services/waitlistService';
import './NotificationPanel.css';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)} dias`;
}

function NotifIcon({ type }) {
  if (type === 'waitlist_notified') return <span className="notif-icon notif-icon--alert">⏰</span>;
  if (type === 'waitlist_converted') return <span className="notif-icon notif-icon--success">✅</span>;
  if (type === 'appointment_cancelled') return <span className="notif-icon notif-icon--warn">❌</span>;
  return <span className="notif-icon">🔔</span>;
}

export default function NotificationPanel({ isOpen, onClose, onAppointmentConfirmed }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyNotifications();
      setNotifications(Array.isArray(data) ? data : []);
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
              <span className="notif-empty-icon">🔔</span>
              <p>Nenhuma notificação.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.status === 'unread' ? 'notif-item--unread' : ''}`}>
                <div className="notif-item-top">
                  <NotifIcon type={n.type} />
                  <div className="notif-item-body">
                    <div className="notif-item-row">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="notif-item-msg">{n.message}</p>
                  </div>
                  <button className="notif-item-delete" onClick={() => handleDelete(n)} aria-label="Remover">✕</button>
                </div>

                {n.type === 'waitlist_notified' && n.status === 'unread' && (
                  <div className="notif-actions">
                    <button
                      className="notif-btn notif-btn--accept"
                      disabled={acting === n.id}
                      onClick={() => handleAccept(n)}
                    >
                      {acting === n.id ? 'Aguarde...' : '✓ Aceitar vaga'}
                    </button>
                    <button
                      className="notif-btn notif-btn--refuse"
                      disabled={acting === n.id}
                      onClick={() => handleRefuse(n)}
                    >
                      {acting === n.id ? 'Aguarde...' : '✕ Recusar'}
                    </button>
                  </div>
                )}

                {n.type !== 'waitlist_notified' && n.status === 'unread' && (
                  <button className="notif-read-btn" onClick={() => handleDismiss(n)}>
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
