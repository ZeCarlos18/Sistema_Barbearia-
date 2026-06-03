import React from 'react';
import { FiBell, FiChevronRight, FiClock, FiLock, FiLogOut, FiUser } from 'react-icons/fi';
import BottomNav from '../../../components/BottomNav/BottomNav';
import { fetchMyAppointments, getProfile, updateProfile } from '../../../services/userService';
import './ClientSettings.css';

function getStoredUser() {
  const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    return {};
  }
}

export default function ClientSettings({ onNavigate, onLogout }) {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [profile, setProfile] = React.useState(() => getStoredUser());
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState('');
  const [editOpen, setEditOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = React.useState({ oldPassword: '', newPassword: '' });
  const [history, setHistory] = React.useState([]);
  const [historyStatus, setHistoryStatus] = React.useState({ loading: false, error: '' });
  const [formMessage, setFormMessage] = React.useState('');
  const displayName = profile?.name || 'Joao';

  React.useEffect(() => {
    let isMounted = true;
    setLoadingProfile(true);
    setProfileError('');

    getProfile()
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
      })
      .catch((error) => {
        if (!isMounted) return;
        setProfileError(error.message || 'Nao foi possivel carregar o perfil.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function syncStoredUser(nextUser) {
    const storedLocal = localStorage.getItem('user');
    if (storedLocal) {
      const parsed = JSON.parse(storedLocal);
      localStorage.setItem('user', JSON.stringify({ ...parsed, ...nextUser }));
    }

    const storedSession = sessionStorage.getItem('user');
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      sessionStorage.setItem('user', JSON.stringify({ ...parsed, ...nextUser }));
    }
  }

  function openEditProfile() {
    setEditForm({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
    setFormMessage('');
    setEditOpen(true);
  }

  function openPassword() {
    setPasswordForm({ oldPassword: '', newPassword: '' });
    setFormMessage('');
    setPasswordOpen(true);
  }

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryStatus({ loading: true, error: '' });
    try {
      const data = await fetchMyAppointments();
      setHistory(data);
    } catch (error) {
      setHistoryStatus({ loading: false, error: error.message || 'Erro ao carregar historico.' });
      return;
    }
    setHistoryStatus({ loading: false, error: '' });
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    setFormMessage('');

    try {
      const updated = await updateProfile({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone
      });
      setProfile(updated);
      syncStoredUser(updated);
      setEditOpen(false);
    } catch (error) {
      setFormMessage(error.message || 'Nao foi possivel atualizar.');
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setFormMessage('');

    try {
      await updateProfile({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordOpen(false);
    } catch (error) {
      setFormMessage(error.message || 'Nao foi possivel atualizar a senha.');
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-stage">
        <span className="settings-stage-title">CONFIGURAÇÃO</span>

        <div className="settings-phone">
          <div className="settings-shell">
            <main className="settings-main">
              <section className="settings-card">
                <h2 className="settings-title">Configurações</h2>

                <div className="settings-user">
                  <div className="settings-avatar" aria-hidden="true" />
                  <span>{displayName}</span>
                </div>

                <div className="settings-list">
                  <button type="button" className="settings-item" onClick={openEditProfile}>
                    <span className="settings-icon" aria-hidden="true">
                      <FiUser size={18} />
                    </span>
                    <span className="settings-label">Editar Perfil</span>
                    <FiChevronRight className="settings-arrow" size={18} />
                  </button>

                  <button type="button" className="settings-item" onClick={openPassword}>
                    <span className="settings-icon" aria-hidden="true">
                      <FiLock size={18} />
                    </span>
                    <span className="settings-label">Alterar Senha</span>
                    <FiChevronRight className="settings-arrow" size={18} />
                  </button>

                  <div className="settings-item settings-item--toggle">
                    <span className="settings-icon" aria-hidden="true">
                      <FiBell size={18} />
                    </span>
                    <span className="settings-label">Notificações</span>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(event) => setNotificationsEnabled(event.target.checked)}
                      />
                      <span className="settings-toggle-track" />
                    </label>
                  </div>

                  <button type="button" className="settings-item" onClick={openHistory}>
                    <span className="settings-icon" aria-hidden="true">
                      <FiClock size={18} />
                    </span>
                    <span className="settings-label">Histórico</span>
                    <FiChevronRight className="settings-arrow" size={18} />
                  </button>
                </div>

                {loadingProfile ? (
                  <div className="settings-feedback">Carregando perfil...</div>
                ) : null}
                {profileError ? (
                  <div className="settings-feedback settings-feedback--error">{profileError}</div>
                ) : null}

                <button type="button" className="settings-logout" onClick={onLogout}>
                  <FiLogOut size={16} />
                  Sair da Conta
                </button>
              </section>
            </main>

            <BottomNav active="profile" onNavigate={onNavigate} />

            {editOpen ? (
              <div className="settings-modal-overlay" onClick={() => setEditOpen(false)}>
                <div
                  className="settings-modal"
                  role="dialog"
                  aria-modal="true"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3>Editar perfil</h3>
                  <form className="settings-form" onSubmit={handleEditSubmit}>
                    <label>
                      Nome completo
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      E-mail
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, email: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Telefone
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(event) =>
                          setEditForm((current) => ({ ...current, phone: event.target.value }))
                        }
                      />
                    </label>
                    {formMessage ? (
                      <div className="settings-feedback settings-feedback--error">{formMessage}</div>
                    ) : null}
                    <div className="settings-form-actions">
                      <button
                        type="button"
                        className="settings-form-btn settings-form-btn--ghost"
                        onClick={() => setEditOpen(false)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="settings-form-btn">
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            {passwordOpen ? (
              <div className="settings-modal-overlay" onClick={() => setPasswordOpen(false)}>
                <div
                  className="settings-modal"
                  role="dialog"
                  aria-modal="true"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3>Alterar senha</h3>
                  <form className="settings-form" onSubmit={handlePasswordSubmit}>
                    <label>
                      Senha atual
                      <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            oldPassword: event.target.value
                          }))
                        }
                      />
                    </label>
                    <label>
                      Nova senha
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            newPassword: event.target.value
                          }))
                        }
                      />
                    </label>
                    {formMessage ? (
                      <div className="settings-feedback settings-feedback--error">{formMessage}</div>
                    ) : null}
                    <div className="settings-form-actions">
                      <button
                        type="button"
                        className="settings-form-btn settings-form-btn--ghost"
                        onClick={() => setPasswordOpen(false)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="settings-form-btn">
                        Atualizar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            {historyOpen ? (
              <div className="settings-modal-overlay" onClick={() => setHistoryOpen(false)}>
                <div
                  className="settings-modal"
                  role="dialog"
                  aria-modal="true"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3>Histórico</h3>
                  {historyStatus.loading ? (
                    <div className="settings-feedback">Carregando...</div>
                  ) : null}
                  {historyStatus.error ? (
                    <div className="settings-feedback settings-feedback--error">
                      {historyStatus.error}
                    </div>
                  ) : null}
                  {!historyStatus.loading && !historyStatus.error ? (
                    <div className="settings-history">
                      {history.length === 0 ? (
                        <span>Nenhum agendamento encontrado.</span>
                      ) : (
                        history.map((item) => (
                          <div key={item.id} className="settings-history-item">
                            <div>
                              <strong>{item.service_name || 'Servico'}</strong>
                              <span>{item.barber_name || 'Barbeiro'}</span>
                            </div>
                            <div className="settings-history-time">
                              <span>{item.date}</span>
                              <strong>{String(item.time || '').slice(0, 5)}</strong>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                  <div className="settings-form-actions">
                    <button
                      type="button"
                      className="settings-form-btn"
                      onClick={() => setHistoryOpen(false)}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
