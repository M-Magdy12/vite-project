export default function Sidebar({ activePage, setActivePage, open }) {
  const NAV_MAIN = [
    { label: "Dashboard",     icon: <GridIco /> },
    { label: "Inbox",         icon: <InboxIco />, badge: 3 },
    { label: "Tickets",       icon: <TicketIco /> },
    { label: "Knowledge Base",icon: <BookIco /> },
    { label: "Announcements", icon: <MegaIco /> },
  ];
  const NAV_ADMIN = [
    { label: "Admin Panel", icon: <ShieldIco /> },
    { label: "Settings",    icon: <GearIco /> },
  ];

  return (
    <aside className={`sidebar ${open ? "" : "collapsed"}`}>
      <div className="sb-brand">
        <div className="sb-logo">
          <svg viewBox="0 0 28 28" fill="none" width="26" height="26">
            <rect width="28" height="28" rx="7" fill="#2563EB"/>
            <path d="M7 9h14M7 14h9M7 19h11" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
        {open && <div className="sb-txt"><span className="sb-name">CampusDesk</span><span className="sb-sub">University Support</span></div>}
      </div>

      <nav className="sb-nav">
        <div className="nav-grp">
          {open && <span className="nav-grp-lbl">Main</span>}
          {NAV_MAIN.map(item => (
            <button key={item.label} className={`nav-btn ${activePage === item.label ? "active" : ""}`}
              onClick={() => setActivePage(item.label)} title={!open ? item.label : undefined}>
              <span className="nav-ico">{item.icon}</span>
              {open && <span className="nav-lbl">{item.label}</span>}
              {open && item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </div>
        <div className="nav-grp">
          {open && <span className="nav-grp-lbl">Administration</span>}
          {NAV_ADMIN.map(item => (
            <button key={item.label} className={`nav-btn ${activePage === item.label ? "active" : ""}`}
              onClick={() => setActivePage(item.label)} title={!open ? item.label : undefined}>
              <span className="nav-ico">{item.icon}</span>
              {open && <span className="nav-lbl">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      <div className="sb-foot">
        <button className={`nav-btn ${activePage === "Student Portal" ? "active" : ""}`} onClick={() => setActivePage("Student Portal")} title={!open ? "Student Portal" : undefined}>
          <span className="nav-ico"><PortalIco /></span>
          {open && <span className="nav-lbl">Student Portal</span>}
        </button>
      </div>
    </aside>
  );
}

function GridIco()   { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>; }
function InboxIco()  { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2.101a2 2 0 00-1.899 1.368A2 2 0 019.101 14H10.9a2 2 0 01-1.9-1.368A2 2 0 006.1 12H4V5z" clipRule="evenodd"/></svg>; }
function TicketIco() { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>; }
function BookIco()   { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>; }
function MegaIco()   { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>; }
function ShieldIco() { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>; }
function GearIco()   { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>; }
function PortalIco() { return <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>; }