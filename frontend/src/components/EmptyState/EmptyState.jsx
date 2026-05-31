/**
 * EmptyState - Componente para estados vazios
 * 
 * Props:
 *  - title: string (obrigatório) - Título principal
 *  - description: string (obrigatório) - Descrição do estado vazio
 *  - buttonLabel: string (opcional) - Texto do botão
 *  - onButtonClick: function (opcional) - Callback do botão
 * 
 * Exemplo:
 *  <EmptyState 
 *    title="Nenhum agendamento"
 *    description="Você ainda não tem agendamentos"
 *    buttonLabel="Agendar agora"
 *    onButtonClick={handleNavigateToBooking}
 *  />
 */

export default function EmptyState({ 
  title, 
  description, 
  buttonLabel, 
  onButtonClick 
}) {
  return (
    <div className="empty-state">
      {/* Ícone visual (Calendário vazio) */}
      <div className="empty-state__icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Calendário SVG */}
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      {/* Conteúdo textual */}
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__description">{description}</p>

      {/* Botão (renderizado apenas se buttonLabel foi fornecido) */}
      {buttonLabel && onButtonClick && (
        <button
          className="empty-state__button"
          onClick={onButtonClick}
          type="button"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}