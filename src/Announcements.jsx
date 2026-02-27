import { useState, useEffect, useCallback } from "react";
import { supabase } from "./createClient";

function fmtDate(ts){if(!ts)return"—";return new Date(ts).toLocaleDateString([],{month:"numeric",day:"numeric",year:"numeric"});}
function Skel({w="100%",h=16,r=5,style}){return<div className="skel" style={{width:w,height:h,borderRadius:r,...style}}/>;}

export default function Announcements({ profile }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew]   = useState(false);
  const [form, setForm]         = useState({title:"",content:"",audience_type:"all",audience_value:""});
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {data,error:err}=await supabase.from("announcements")
        .select("id,title,content,audience_type,audience_value,publish_at,expires_at,pinned,created_at")
        .order("publish_at",{ascending:false}).limit(50);
      if (err) throw err;
      // Filter out expired announcements in UI
      const now = new Date();
      setItems((data||[]).filter(a=>!a.expires_at||new Date(a.expires_at)>=now));
    } catch(e){ setError(e.message); } finally { setLoading(false); }
  },[]);

  useEffect(()=>{load();},[load]);

  async function create() {
    if (!form.title.trim()) return;
    setSaving(true);
    const insertPayload = {
      title: form.title.trim(),
      content: form.content.trim(),
      audience_type: form.audience_type,
      audience_value: form.audience_value.trim()||null,
      pinned: false,
    };
    if (profile?.org_id) insertPayload.org_id = profile.org_id;
    const {data,error:err}=await supabase.from("announcements").insert(insertPayload).select().single();
    if (!err&&data){
      setItems(a=>[data,...a]);
      setShowNew(false);
      setForm({title:"",content:"",audience_type:"all",audience_value:""});
    } else if (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const isAdmin=profile?.role==="admin";

  return (
    <div className="page-content">
      <div className="page-head-row">
        <div><h1>Announcements</h1><p>Campus-wide communications</p></div>
        {isAdmin&&<button className="btn-primary" onClick={()=>setShowNew(true)}>+ New</button>}
      </div>

      {loading ? Array.from({length:3}).map((_,i)=>(
        <div key={i} className="announcement-card">
          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            <Skel w={40} h={40} r={10}/>
            <div style={{flex:1}}><Skel w="50%" h={16}/><Skel w="80%" h={13} style={{marginTop:8}}/><Skel w="30%" h={12} style={{marginTop:12}}/></div>
          </div>
        </div>
      )) : items.length===0 ? (
        <div className="empty-state"><div className="empty-icon">📣</div><div className="empty-title">No announcements</div><div className="empty-desc">Create one to broadcast campus-wide communications.</div></div>
      ) : items.map(item=>(
        <div key={item.id} className={`announcement-card ${selected?.id===item.id?"selected":""}`} onClick={()=>setSelected(selected?.id===item.id?null:item)}>
          <div className="ann-card-inner">
            <div className="ann-icon-wrap">
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>
            </div>
            <div className="ann-body">
              <div className="ann-title-row">
                <span className="ann-title">{item.title}</span>
                <div className="ann-tags">
                  {item.pinned&&<span className="badge badge-blue">pinned</span>}
                  {item.audience_type&&<span className="badge badge-outline">{item.audience_type}</span>}
                  {item.audience_value&&<span className="badge badge-outline">{item.audience_value}</span>}
                </div>
              </div>
              <p className="ann-preview">{item.content}</p>
              <div className="ann-meta">{item.audience_value||item.audience_type||"All"} · {fmtDate(item.publish_at||item.created_at)}</div>
              {selected?.id===item.id&&(
                <div className="ann-expanded">
                  {item.publish_at&&<div className="ann-detail-row"><strong>Published:</strong> {fmtDate(item.publish_at)}</div>}
                  {item.expires_at&&<div className="ann-detail-row"><strong>Expires:</strong> {fmtDate(item.expires_at)}</div>}
                  {item.audience_type&&<div className="ann-detail-row"><strong>Audience:</strong> {item.audience_type}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {showNew&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div className="modal">
            <div className="modal-header"><span>New Announcement</span><button className="panel-close" onClick={()=>setShowNew(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-field"><label>Title</label><input className="form-input" placeholder="Announcement title..." value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
              <div className="form-field"><label>Content</label><textarea className="form-textarea" placeholder="Announcement content..." value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={5}/></div>
              <div className="form-row">
                <div className="form-field">
                  <label>Audience</label>
                  <select className="form-select" value={form.audience_type} onChange={e=>setForm(f=>({...f,audience_type:e.target.value}))}>
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="staff">Staff</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>
                <div className="form-field"><label>Audience Value</label><input className="form-input" placeholder="e.g. IT Department" value={form.audience_value} onChange={e=>setForm(f=>({...f,audience_value:e.target.value}))}/></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={()=>setShowNew(false)}>Cancel</button>
              <button className="btn-primary" onClick={create} disabled={saving||!form.title.trim()}>{saving?"Saving...":"Create"}</button>
            </div>
          </div>
        </div>
      )}
      {error&&<div className="banner err" style={{position:"fixed",bottom:16,right:16,maxWidth:400,zIndex:100}}>{error}</div>}
    </div>
  );
}