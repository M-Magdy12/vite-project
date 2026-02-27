export default function Topbar({ onToggleSidebar, orgName, initials, search, onSearch, onLogout }) {
  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onToggleSidebar}>
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
      </button>
      <div className="search-box">
        <span className="search-ico">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
        </span>
        <input className="search-inp" placeholder="Search conversations, tickets..."
          value={search} onChange={e => onSearch(e.target.value)} />
      </div>
      <div className="tb-right">
        <button className="bell-btn">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
          <span className="bell-dot">5</span>
        </button>
        <div className="org-chip">
          <span>{orgName || "University of Tech"}</span>
          <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div className="avatar" title="Signed in">{initials || "?"}</div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out"
            style={{
              background:"none", border:"1px solid #E2E8F0", borderRadius:6,
              padding:"4px 10px", fontSize:12, color:"#64748B", cursor:"pointer",
              display:"flex", alignItems:"center", gap:4
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 100-2H4V5h6a1 1 0 100-2H3zm11.707 4.293a1 1 0 010 1.414L13.414 10l1.293 1.293a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414l2-2a1 1 0 011.414 0z" clipRule="evenodd"/>
              <path d="M13 10a1 1 0 011-1h3a1 1 0 110 2h-3a1 1 0 01-1-1z"/>
            </svg>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
