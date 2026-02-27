import { useState, useEffect, useCallback } from "react";
import { supabase } from "./createClient";

// ticket_status: open, assigned, waiting, resolved, closed
const STATUS_MAP = {
  open:     {bg:"#EFF6FF",color:"#2563EB",label:"Open"},
  assigned: {bg:"#FFFBEB",color:"#D97706",label:"Assigned"},
  waiting:  {bg:"#F0F9FF",color:"#0284C7",label:"Waiting"},
  resolved: {bg:"#F0FDF4",color:"#16A34A",label:"Resolved"},
  closed:   {bg:"#F8FAFC",color:"#64748B",label:"Closed"},
};
// ticket_priority: low, medium, high, urgent
const PRIORITY_MAP = {
  low:    {bg:"#F8FAFC",color:"#64748B",label:"Low"},
  medium: {bg:"#FFFBEB",color:"#D97706",label:"Medium"},
  high:   {bg:"#FEF2F2",color:"#DC2626",label:"High"},
  urgent: {bg:"#FFF1F2",color:"#BE123C",label:"Urgent"},
};
function badge(map,key){const c=map[key]||{bg:"#F1F5F9",color:"#475569",label:key||"—"};return <span className="badge" style={{background:c.bg,color:c.color}}>{c.label}</span>;}
function fmtDate(ts){if(!ts)return"—";return new Date(ts).toLocaleDateString([],{month:"numeric",day:"numeric",year:"numeric"});}
function timeAgo(ts){if(!ts)return"";const d=(Date.now()-new Date(ts).getTime())/1000;if(d<60)return`${Math.round(d)}s ago`;if(d<3600)return`${Math.round(d/60)} min ago`;if(d<86400)return`${Math.round(d/3600)} hr ago`;return`${Math.round(d/86400)}d ago`;}
function Skel({w="100%",h=16,r=5,style}){return<div className="skel" style={{width:w,height:h,borderRadius:r,...style}}/>;}

export default function Tickets({ profile }) {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [events, setEvents]     = useState([]);
  const [notes, setNotes]       = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [offset, setOffset]     = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [newNote, setNewNote]   = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const LIMIT = 50;

  const loadTickets = useCallback(async (off=0) => {
    if (off===0) setLoading(true);
    try {
      // Schema: tickets has title (not subject), ticket_type, ticket_priority, ticket_status
      let q = supabase.from("tickets")
        .select("id,conversation_id,status,priority,type,title,assigned_to,created_at,updated_at,resolved_at")
        .order("updated_at",{ascending:false}).range(off,off+LIMIT-1);
      if (statusFilter!=="all") q=q.eq("status",statusFilter);
      if (priorityFilter!=="all") q=q.eq("priority",priorityFilter);
      const {data,error:err}=await q;
      if (err) throw err;
      const rows=data||[];
      setHasMore(rows.length===LIMIT);
      if (off===0) setTickets(rows); else setTickets(p=>[...p,...rows]);
    } catch(e){ setError(e.message); } finally { setLoading(false); }
  },[statusFilter,priorityFilter]);

  useEffect(()=>{setOffset(0);loadTickets(0);},[loadTickets]);

  async function loadDetail(ticket) {
    setSelected(ticket); setDetailLoading(true); setEvents([]); setNotes([]);
    try {
      const [evRes,notRes]=await Promise.all([
        supabase.from("ticket_events")
          .select("id,event_type,payload,created_at,actor_id,actor_type")
          .eq("ticket_id",ticket.id).order("created_at",{ascending:false}).limit(20),
        supabase.from("ticket_notes")
          .select("id,content,created_at,author_id")
          .eq("ticket_id",ticket.id).order("created_at",{ascending:false}).limit(20),
      ]);
      setEvents(evRes.data||[]); setNotes(notRes.data||[]);
    } catch(e){ setError(e.message); } finally { setDetailLoading(false); }
  }

  async function insertEvent(ticketId, event_type, payload={}) {
    const ev = {
      ticket_id: ticketId,
      event_type,
      payload,
      actor_type: "agent",
    };
    if (profile?.id) ev.actor_id = profile.id;
    await supabase.from("ticket_events").insert(ev);
  }

  async function updateStatus(status) {
    if (!selected) return;
    const patch = {status, updated_at:new Date().toISOString()};
    if (status==="resolved"||status==="closed") patch.resolved_at = new Date().toISOString();
    const {error:err}=await supabase.from("tickets").update(patch).eq("id",selected.id);
    if (!err){
      setSelected(t=>({...t,...patch}));
      setTickets(ts=>ts.map(t=>t.id===selected.id?{...t,...patch}:t));
      await insertEvent(selected.id, status==="resolved"?"resolved":status==="closed"?"closed":"status_changed", {status});
      // Reload events
      const {data}=await supabase.from("ticket_events").select("id,event_type,payload,created_at,actor_id,actor_type").eq("ticket_id",selected.id).order("created_at",{ascending:false}).limit(20);
      setEvents(data||[]);
    } else setError(err.message);
  }

  async function updatePriority(priority) {
    if (!selected) return;
    const {error:err}=await supabase.from("tickets").update({priority,updated_at:new Date().toISOString()}).eq("id",selected.id);
    if (!err){
      setSelected(t=>({...t,priority}));
      setTickets(ts=>ts.map(t=>t.id===selected.id?{...t,priority}:t));
    } else setError(err.message);
  }

  async function assignToMe() {
    if (!selected||!profile?.id) return;
    const {error:err}=await supabase.from("tickets").update({assigned_to:profile.id,updated_at:new Date().toISOString()}).eq("id",selected.id);
    if (!err){
      setSelected(t=>({...t,assigned_to:profile.id}));
      setTickets(ts=>ts.map(t=>t.id===selected.id?{...t,assigned_to:profile.id}:t));
      await insertEvent(selected.id,"assigned",{assigned_to:profile.id});
    } else setError(err.message);
  }

  async function addNote() {
    if (!newNote.trim()||!selected) return;
    setAddingNote(true);
    const notePayload = {
      ticket_id: selected.id,
      content: newNote.trim(),
    };
    if (profile?.id) notePayload.author_id = profile.id;
    const {data,error:err}=await supabase.from("ticket_notes").insert(notePayload).select().single();
    if (!err&&data) {
      setNotes(n=>[data,...n]);
      await insertEvent(selected.id,"note_added",{note_id:data.id});
    } else if (err) setError(err.message);
    setNewNote(""); setAddingNote(false);
  }

  const filtered=tickets.filter(t=>!search||(t.title||"").toLowerCase().includes(search.toLowerCase())||(t.id||"").toString().toLowerCase().includes(search.toLowerCase()));
  const tktId=t=>`TKT-${t.id?.slice(0,8).toUpperCase()}`;

  return (
    <div className="tickets-layout">
      <div className={`tickets-main ${selected?"with-panel":""}`}>
        <div className="page-head-row">
          <div><h1>Tickets</h1><p>Manage and track support tickets</p></div>
          <button className="btn-primary">Create Ticket</button>
        </div>

        <div className="tickets-filters">
          <div className="filter-search-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{color:"#94A3B8"}}><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
            <input className="filter-search-inp" placeholder="Search tickets..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="filter-sel" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="filter-sel" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            {Object.entries(PRIORITY_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="tickets-table-wrap">
          <table className="tickets-table">
            <thead><tr><th>Ticket ID</th><th>Title</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Type</th><th>Created</th></tr></thead>
            <tbody>
              {loading ? Array.from({length:6}).map((_,i)=>(
                <tr key={i}>{Array.from({length:7}).map((_,j)=><td key={j}><Skel w={j===1?"140px":j===0?"60px":"70px"} h={14}/></td>)}</tr>
              )) : filtered.length===0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🎫</div><div className="empty-title">No tickets found</div><div className="empty-desc">Try adjusting filters.</div></div></td></tr>
              ) : filtered.map(t=>(
                <tr key={t.id} className={`ticket-row ${selected?.id===t.id?"selected":""}`} onClick={()=>loadDetail(t)}>
                  <td><span className="tkt-id">{tktId(t)}</span></td>
                  <td className="tkt-subject">{t.title||"—"}</td>
                  <td>{badge(PRIORITY_MAP,t.priority)}</td>
                  <td>{badge(STATUS_MAP,t.status)}</td>
                  <td className="tkt-assigned">{t.assigned_to?"Assigned":"—"}</td>
                  <td><span style={{fontSize:12,color:"#64748B",textTransform:"capitalize"}}>{t.type||"—"}</span></td>
                  <td className="tkt-date">{fmtDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore&&<div style={{padding:"12px 16px",borderTop:"1px solid #E2E8F0"}}><button className="load-more-btn" onClick={()=>{const n=offset+LIMIT;setOffset(n);loadTickets(n);}}>Load more</button></div>}
        </div>
      </div>

      {selected&&(
        <div className="ticket-panel">
          <div className="panel-header">
            <div><div className="panel-ticket-id">{tktId(selected)}</div><div className="panel-subject">{selected.title}</div></div>
            <button className="panel-close" onClick={()=>setSelected(null)}>✕</button>
          </div>
          <div className="panel-actions">
            <div className="panel-field">
              <label>Status</label>
              <select value={selected.status||""} onChange={e=>updateStatus(e.target.value)} className="panel-select">
                {Object.entries(STATUS_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="panel-field">
              <label>Priority</label>
              <select value={selected.priority||""} onChange={e=>updatePriority(e.target.value)} className="panel-select">
                {Object.entries(PRIORITY_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <button className="btn-outline" style={{fontSize:12}} onClick={assignToMe}>Assign to me</button>
          </div>
          {detailLoading ? <div style={{padding:16}}><Skel h={200}/></div> : (
            <>
              <div className="panel-section">
                <div className="panel-section-title">Timeline</div>
                {events.length===0 ? <p className="panel-empty">No events yet.</p> : (
                  <div className="timeline">
                    {events.map(ev=>(
                      <div key={ev.id} className="timeline-item">
                        <div className="timeline-dot"/>
                        <div className="timeline-body">
                          <div className="timeline-event">{(ev.event_type||"").replace(/_/g," ")}</div>
                          {ev.payload&&<div className="timeline-detail">{typeof ev.payload==="string"?ev.payload:JSON.stringify(ev.payload)}</div>}
                          <div className="timeline-time">{timeAgo(ev.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="panel-section">
                <div className="panel-section-title">Internal Notes</div>
                <div className="note-add">
                  <textarea className="note-input" placeholder="Add an internal note..." value={newNote} onChange={e=>setNewNote(e.target.value)} rows={3}/>
                  <button className="btn-primary" style={{fontSize:12,padding:"6px 14px"}} onClick={addNote} disabled={addingNote||!newNote.trim()}>{addingNote?"Adding...":"Add Note"}</button>
                </div>
                {notes.length===0 ? <p className="panel-empty">No notes yet.</p> :
                  notes.map(n=><div key={n.id} className="note-item"><div className="note-text">{n.content}</div><div className="note-time">{timeAgo(n.created_at)}</div></div>)
                }
              </div>
            </>
          )}
        </div>
      )}
      {error&&<div className="banner err" style={{position:"fixed",bottom:16,right:16,maxWidth:400,zIndex:100}}>{error}</div>}
    </div>
  );
}