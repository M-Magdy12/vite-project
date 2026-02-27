import './ChatHeader.css';

export const ChatHeader = ({ conversation, ticket, onTakeover, onResolve, onClose }) => {
  const canTakeover = conversation.status === 'escalated';
  const canResolve = conversation.status === 'human_handling' && ticket && ticket.status !== 'resolved';
  const canClose = conversation.status === 'human_handling' && ticket && ticket.status === 'resolved';

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        <h2>Conversation #{conversation.id.slice(0, 8)}</h2>
        <span className={`status-badge status-${conversation.status}`}>
          {conversation.status.replace('_', ' ')}
        </span>
        {ticket && (
          <span className={`ticket-badge ticket-${ticket.status}`}>
            Ticket: {ticket.status}
          </span>
        )}
      </div>

      <div className="chat-actions">
        {canTakeover && (
          <button className="action-button takeover-button" onClick={onTakeover}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Take Over
          </button>
        )}

        {canResolve && (
          <button className="action-button resolve-button" onClick={onResolve}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Resolve
          </button>
        )}

        {canClose && (
          <button className="action-button close-button" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Close
          </button>
        )}
      </div>
    </div>
  );
};
