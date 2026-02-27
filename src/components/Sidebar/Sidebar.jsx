import './Sidebar.css';

export const Sidebar = ({ conversations, selectedId, onSelect }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Grade Z - MVP</h1>
        <p className="subtitle">Agent Dashboard</p>
      </div>

      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="empty-state">No active conversations</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedId === conv.id ? 'active' : ''}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="conversation-header">
                <span className="conversation-id">
                  Conv #{conv.id.slice(0, 8)}
                </span>
                <span className={`conversation-status status-${conv.status}`}>
                  {conv.status.replace('_', ' ')}
                </span>
              </div>
              <div className="conversation-meta">
                <span className="conversation-time">
                  {new Date(conv.updated_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
