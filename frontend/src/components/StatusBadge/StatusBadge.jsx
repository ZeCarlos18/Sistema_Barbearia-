/**
 * StatusBadge - Componente reutilizável de status
 * 
 * Props:
 *  - status: string (confirmado | cancelado | concluído)
 * 
 * Exemplo:
 *  <StatusBadge status="confirmado" />
 */

export default function StatusBadge({ status }) {
  // Mapeamos cada status para cor e texto
  const statusConfig = {
    confirmado: {
      color: '#39b16a',     
      backgroundColor: '#112419',
      label: 'Confirmado'
    },
    cancelado: {
      color: '#ef4444',     
      backgroundColor: '#7f1d1d',
      label: 'Cancelado'
    },
    concluído: {
      color: '#3b82f6',    
      backgroundColor: '#1e3a8a',
      label: 'Concluído'
    }
  };

  // Pega a configuração do status, ou usa padrão se não existir
  const config = statusConfig[status] || statusConfig.confirmado;

  return (
    <div
      className="status-badge"
      style={{
        color: config.color
      }}
    >
      {/* Dot (ponto) visual */}
      <span className="status-badge__dot" style={{ backgroundColor: config.color }} />
      {/* Texto do status */}
      {config.label}
    </div>
  );
}