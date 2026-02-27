import { useState, useEffect, useCallback } from "react";
import { supabase } from "./createClient";

function todayStart() { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
function timeAgo(ts) {
  if (!ts) return "";
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return `${Math.round(d)}s ago`;
  if (d < 3600) return `${Math.round(d/60)} min ago`;
  if (d < 86400) return `${Math.round(d/3600)} hr ago`;
  return `${Math.round(d/86400)}d ago`;
}
function Skel({ w="100%", h=16, r=5, style }) {
  return <div className="skel" style={{width:w,height:h,borderRadius:r,...style}}/>;
}
function KpiCard({ title, value, sub, subCls="", icon, loading }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top"><span className="kpi-title">{title}</span><span className="kpi-ico">{icon}</span></div>
      {loading ? (
        <div className="kpi-body"><Skel w="52%" h={34} r={4}/><Skel w="36%" h={12} r={3} style={{marginTop:7}}/></div>
      ) : (
        <div className="kpi-body">
          <div className="kpi-val">{value ?? "—"}</div>
          {sub && <div className={`kpi-sub ${subCls}`}>{sub}</div>}
        </div>
      )}
    </div>
  );
}
async function sq(promise) {
  try { const r = await promise; return r.error ? null : r; } catch { return null; }
}

export default function Dashboard({ profile }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const today = todayStart();

    // ticket_status enum: open, assigned, waiting, resolved, closed
    // conversation_status enum: open, ai_handling, escalated, human_handling, closed
    const [openR, resolvedR, escalatedR, aiHandlingR, escConvsR, waitingR, activityR] = await Promise.all([
      sq(supabase.from("tickets").select("id",{count:"exact",head:true}).in("status",["open","assigned","waiting"])),
      sq(supabase.from("tickets").select("id",{count:"exact",head:true}).eq("status","resolved").gte("updated_at",today)),
      sq(supabase.from("conversations").select("id",{count:"exact",head:true}).eq("status","escalated").gte("updated_at",today)),
      sq(supabase.from("conversations").select("id",{count:"exact",head:true}).eq("status","ai_handling")),
      sq(supabase.from("conversations").select("id",{count:"exact",head:true}).eq("status","escalated")),
      sq(supabase.from("conversations").select("id",{count:"exact",head:true}).in("status",["open","human_handling"])),
      sq(supabase.from("ticket_events").select("id,event_type,created_at,payload").order("created_at",{ascending:false}).limit(10)),
    ]);

    // Active conversations = open + ai_handling + escalated + human_handling
    const activeR = await sq(supabase.from("conversations").select("id",{count:"exact",head:true}).in("status",["open","ai_handling","escalated","human_handling"]));

    const activities = (activityR?.data ?? []).map(ev => ({
      id: ev.id,
      text: (ev.event_type||"event").replace(/_/g," "),
      ts: ev.created_at,
    }));
    if (!activities.length) {
      const r = await sq(supabase.from("tickets").select("id,title,status,created_at").order("created_at",{ascending:false}).limit(6));
      for (const t of (r?.data??[])) activities.push({id:t.id,text:`Ticket ${t.status}: ${t.title||"No subject"}`,ts:t.created_at});
    }

    setMetrics({
      openCount: openR?.count ?? null,
      resolvedToday: resolvedR?.count ?? null,
      escalatedToday: escalatedR?.count ?? null,
      activeCount: activeR?.count ?? null,
      activities,
      queue: {
        handledByAI: aiHandlingR?.count ?? 0,
        escalated: escConvsR?.count ?? 0,
        waiting: waitingR?.count ?? 0,
      }
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const m = metrics;

  return (
    <div className="page-content">
      <div className="page-head"><h1>Dashboard</h1><p>Overview of your support operations</p></div>
      <div className="kpi-grid">
        <KpiCard title="Open Tickets" loading={loading} value={m?.openCount??'—'} sub={m?.openCount!=null?`${m.openCount} active`:undefined} icon={<TktIco/>}/>
        <KpiCard title="Avg Response Time" loading={loading} value="N/A" sub="Last 7 days" icon={<ClockIco/>}/>
        <KpiCard title="Resolved Today" loading={loading} value={m?.resolvedToday??'—'} sub="Closed tickets" subCls="green" icon={<CheckIco/>}/>
        <KpiCard title="SLA Compliance" loading={loading} value="N/A" sub="No SLA data" icon={<ShieldIco/>}/>
        <KpiCard title="Active Conversations" loading={loading} value={m?.activeCount??'—'} sub="Open & active" icon={<ChatIco/>}/>
        <KpiCard title="AI Resolution Rate" loading={loading} value="N/A" sub="Last 30 days" subCls="green" icon={<BoltIco/>}/>
        <KpiCard title="Escalated Today" loading={loading} value={m?.escalatedToday??'—'} sub={m?.escalatedToday!=null?(m.escalatedToday<=5?"Normal volume":"High volume"):undefined} subCls="muted" icon={<UpIco/>}/>
        <KpiCard title="CSAT Score" loading={loading} value="N/A" sub="No CSAT data" icon={<StarIco/>}/>
      </div>
      <div className="bottom-row">
        <div className="panel">
          <h2 className="panel-ttl">Recent Activity</h2>
          {loading ? (
            <div className="act-list">{[...Array(5)].map((_,i)=><div key={i} className="act-item"><Skel w={8} h={8} r={50} style={{flexShrink:0,marginTop:5}}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}><Skel w="72%" h={13}/><Skel w="25%" h={11}/></div></div>)}</div>
          ) : (
            <div className="act-list">
              {!m?.activities?.length ? <p style={{padding:"16px 0",color:"#94A3B8",fontSize:13}}>No recent activity.</p> :
                m.activities.map(a => (
                  <div key={a.id} className="act-item">
                    <span className="act-dot"/>
                    <div className="act-body"><span className="act-text">{a.text}</span><span className="act-time">{timeAgo(a.ts)}</span></div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
        <div className="panel">
          <h2 className="panel-ttl">Queue Status</h2>
          {loading ? (
            <div className="q-list">{[...Array(3)].map((_,i)=><div key={i} className="q-item"><Skel w="62%" h={15}/><Skel w={24} h={24} r={4}/></div>)}</div>
          ) : (
            <div className="q-list">
              {[{lbl:"Handled by AI",val:m?.queue?.handledByAI,cls:"dot-blue"},{lbl:"Escalated",val:m?.queue?.escalated,cls:"dot-orange"},{lbl:"Waiting for Response",val:m?.queue?.waiting,cls:"dot-gray"}].map(r=>(
                <div key={r.lbl} className="q-item"><div className="q-lbl"><span className={`qdot ${r.cls}`}/>{r.lbl}</div><span className="q-count">{r.val??'—'}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TktIco()   { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/></svg>; }
function ClockIco() { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>; }
function CheckIco() { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>; }
function ShieldIco(){ return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>; }
function ChatIco()  { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/></svg>; }
function BoltIco()  { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>; }
function UpIco()    { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>; }
function StarIco()  { return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>; }