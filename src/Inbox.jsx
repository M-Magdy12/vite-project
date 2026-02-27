import { useState, useEffect, useCallback } from "react";
import { supabase } from "./createClient";

const STATUS_CFG = {
  open:          { bg:"#EFF6FF", color:"#2563EB", label:"Open" },
  ai_handling:   { bg:"#F0FDF4", color:"#16A34A", label:"AI Handling" },
  human_handling:{ bg:"#F0F9FF", color:"#0284C7", label:"Agent" },
  escalated:     { bg:"#FEF2F2", color:"#DC2626", label:"Escalated" },
  closed:        { bg:"#F8FAFC", color:"#64748B", label:"Closed" },
};
function sCfg(s) { return STATUS_CFG[s] || {bg:"#F1F5F9",color:"#475569",label:s}; }
function timeAgo(ts) {
  if (!ts) return "";
  const d = (Date.now()-new Date(ts).getTime())/1000;
  if (d<60) return `${Math.round(d)}s ago`;
  if (d<3600) return `${Math.round(d/60)} min ago`;
  if (d<86400) return `${Math.round(d/3600)} hr ago`;
  return `${Math.round(d/86400)}d ago`;
}
function initials(name) { if(!name) return "?"; return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(); }
function Skel({ w="100%",h=16,r=5,style }) { return <div className="skel" style={{width:w,height:h,borderRadius:r,...style}}/>; }
function Avatar({ name, size=36 }) {
  const colors=["#2563EB","#7C3AED","#DB2777","#D97706","#059669","#DC2626"];
  const idx=(name||"").charCodeAt(0)%colors.length;
  return <div style={{width:size,height:size,borderRadius:"50%",background:colors[idx],color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,flexShrink:0}}>{initials(name)}</div>;
}

export default function Inbox({ profile }) {
  const [convs, setConvs]         = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignFilter, setAssignFilter] = useState("all");
  const [search, setSearch]       = useState("");
  const [reply, setReply]         = useState("");
  const [offset, setOffset]       = useState(0);
  const [hasMore, setHasMore]     = useState(false);
  const [error, setError]         = useState(null);
  const LIMIT = 50;

  const loadConvs = useCallback(async (off=0) => {
    if (off===0) setLoading(true);
    try {
      let q = supabase.from("conversations")
        .select("id,customer_id,status,assigned_to,last_message_at,channel,created_at")
        .order("last_message_at",{ascending:false}).range(off, off+LIMIT-1);
      if (statusFilter!=="all") q=q.eq("status",statusFilter);
      if (assignFilter==="me"&&profile?.id) q=q.eq("assigned_to",profile.id);
      if (assignFilter==="unassigned") q=q.is("assigned_to",null);
      const {data,error:err}=await q;
      if (err) throw err;
      const rows=data||[];
      setHasMore(rows.length===LIMIT);
      if (off===0) setConvs(rows); else setConvs(p=>[...p,...rows]);
      const ids=[...new Set(rows.map(c=>c.customer_id).filter(Boolean))];
      if (ids.length) {
        const {data:custs}=await supabase.from("customers").select("id,full_name,external_ref,department").in("id",ids);
        if (custs) setCustomers(p=>{ const m={...p}; custs.forEach(c=>{m[c.id]=c;}); return m; });
      }
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  }, [statusFilter,assignFilter,profile?.id]);

  useEffect(()=>{ setOffset(0); loadConvs(0); },[loadConvs]);

  const loadMessages = useCallback(async (convId) => {
    setMsgsLoading(true); setMessages([]);
    try {
      const {data,error:err}=await supabase.from("messages")
        .select("id,sender_type,content,created_at,metadata")
        .eq("conversation_id",convId).order("created_at",{ascending:true}).limit(100);
      if (err) throw err;
      setMessages(data||[]);
    } catch(e){ setError(e.message); } finally { setMsgsLoading(false); }
  },[]);

  function selectConv(conv) { setSelected(conv); loadMessages(conv.id); }

  async function assignToMe() {
    if (!selected||!profile?.id) return;
    const {error:err}=await supabase.from("conversations").update({assigned_to:profile.id}).eq("id",selected.id);
    if (!err) { setSelected(c=>({...c,assigned_to:profile.id})); setConvs(cs=>cs.map(c=>c.id===selected.id?{...c,assigned_to:profile.id}:c)); }
    else setError(err.message);
  }

  async function markClosed() {
    if (!selected) return;
    const {error:err}=await supabase.from("conversations").update({status:"closed"}).eq("id",selected.id);
    if (!err) { setSelected(c=>({...c,status:"closed"})); setConvs(cs=>cs.map(c=>c.id===selected.id?{...c,status:"closed"}:c)); }
    else setError(err.message);
  }

  async function sendReply() {
    if (!reply.trim()||!selected) return;
    const content=reply.trim(); setReply("");
    const insertPayload = {
      conversation_id: selected.id,
      sender_type: "agent",
      content,
    };
    if (profile?.org_id) insertPayload.org_id = profile.org_id;
    const {data,error:err}=await supabase.from("messages").insert(insertPayload).select().single();
    if (!err&&data) {
      setMessages(m=>[...m,data]);
      // Update conversation status to human_handling if it was open
      if (selected.status==="open") {
        await supabase.from("conversations").update({status:"human_handling",last_message_at:new Date().toISOString()}).eq("id",selected.id);
        setSelected(c=>({...c,status:"human_handling"}));
        setConvs(cs=>cs.map(c=>c.id===selected.id?{...c,status:"human_handling"}:c));
      } else {
        await supabase.from("conversations").update({last_message_at:new Date().toISOString()}).eq("id",selected.id);
      }
    } else if (err) {
      setError(err.message);
    }
  }

  const filtered=convs.filter(c=>{
    if (!search) return true;
    const cust=customers[c.customer_id];
    return (cust?.full_name||"").toLowerCase().includes(search.toLowerCase())||(c.channel||"").toLowerCase().includes(search.toLowerCase());
  });
  const selCust=selected?customers[selected.customer_id]:null;

  return (
    <div className="inbox-layout">
      {/* LEFT LIST */}
      <div className="inbox-list">
        <div className="inbox-list-header">
          <span className="inbox-title">Inbox</span>
          <span className="inbox-count">{filtered.length}</span>
        </div>
        <div className="inbox-filters">
          <input className="filter-search" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <div style={{display:"flex",gap:6}}>
            <select className="filter-sel" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="ai_handling">AI Handling</option>
              <option value="human_handling">Agent</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
            <select className="filter-sel" value={assignFilter} onChange={e=>setAssignFilter(e.target.value)}>
              <option value="all">All</option><option value="me">Assigned to me</option><option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
        <div className="conv-list">
          {loading ? Array.from({length:5}).map((_,i)=>(
            <div key={i} className="skel-card">
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <Skel w={36} h={36} r={18}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><Skel w="60%" h={14}/><Skel w="40%" h={12}/></div>
              </div>
              <Skel w="85%" h={12} style={{marginTop:8}}/>
            </div>
          )) : filtered.length===0 ? (
            <div className="empty-state"><div className="empty-icon">💬</div><div className="empty-title">No conversations</div><div className="empty-desc">Adjust filters or wait for new messages.</div></div>
          ) : filtered.map(conv=>{
            const cust=customers[conv.customer_id];
            const s=sCfg(conv.status);
            return (
              <button key={conv.id} className={`conv-item ${selected?.id===conv.id?"active":""}`} onClick={()=>selectConv(conv)}>
                <div className="conv-item-top">
                  <Avatar name={cust?.full_name} size={36}/>
                  <div className="conv-item-info">
                    <div className="conv-item-name">{cust?.full_name||"Unknown"}</div>
                    <div className="conv-item-dept">{cust?.department||conv.channel||"—"}</div>
                  </div>
                  <span className="conv-item-time">{timeAgo(conv.last_message_at)}</span>
                </div>
                <div className="conv-item-preview">{conv.channel||"No channel"}</div>
                <div className="conv-item-tags">
                  <span className="tag" style={{background:s.bg,color:s.color}}>{s.label}</span>
                </div>
              </button>
            );
          })}
          {hasMore && <button className="load-more-btn" onClick={()=>{const n=offset+LIMIT;setOffset(n);loadConvs(n);}}>Load more</button>}
        </div>
      </div>

      {/* CENTER THREAD */}
      {selected ? (
        <div className="conv-thread">
          <div className="thread-header">
            <div className="thread-header-left">
              <span className="thread-name">{selCust?.full_name||"Conversation"}</span>
              {(()=>{const s=sCfg(selected.status);return <span className="tag" style={{background:s.bg,color:s.color}}>{s.label}</span>;})()}
            </div>
            <div className="thread-header-actions">
              <button className="btn-outline" onClick={assignToMe}>Assign to me</button>
              <button className="btn-danger-outline" onClick={markClosed}>Close</button>
            </div>
          </div>
          <div className="thread-messages">
            {msgsLoading ? Array.from({length:4}).map((_,i)=><Skel key={i} w={i%2===0?"60%":"50%"} h={60} r={10} style={{marginBottom:12,marginLeft:i%2===0?0:"auto"}}/>) :
              messages.length===0 ? <div className="empty-state"><div className="empty-icon">💬</div><div className="empty-title">No messages yet</div></div> :
              messages.map(msg=>{
                const sender=msg.sender_type||"customer";
                const isCust=sender==="customer", isAI=sender==="ai", isSys=sender==="system";
                return (
                  <div key={msg.id} className={`msg-row ${isCust?"customer":isAI?"ai":isSys?"system":"agent"}`}>
                    {isSys ? <div className="msg-system">{msg.content}</div> : (
                      <>
                        {!isCust&&<div className={`msg-avatar ${isAI?"ai-avatar":"agent-avatar"}`}>{isAI?"AI":"A"}</div>}
                        <div className="msg-bubble-wrap">
                          {!isCust&&<div className="msg-sender-name">{isAI?"Campus AI":"Agent"}</div>}
                          <div className={`msg-bubble ${isCust?"bubble-customer":isAI?"bubble-ai":"bubble-agent"}`}>{msg.content}</div>
                          <div className="msg-time">{new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                        {isCust&&<Avatar name={selCust?.full_name} size={32}/>}
                      </>
                    )}
                  </div>
                );
              })
            }
          </div>
          <div className="thread-reply">
            <input className="reply-input" placeholder="Type your reply..." value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendReply()}/>
            <button className="reply-send" onClick={sendReply} disabled={!reply.trim()}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="conv-thread conv-thread-empty">
          <div className="empty-state"><div className="empty-icon">💬</div><div className="empty-title">Select a conversation</div><div className="empty-desc">Click a conversation to view the thread.</div></div>
        </div>
      )}

      {error&&<div className="banner err" style={{position:"fixed",bottom:16,right:16,maxWidth:400,zIndex:100}}>{error}</div>}
    </div>
  );
}