import { useState, useEffect, useCallback } from "react";
import { supabase } from "./createClient";

function fmtDate(ts){if(!ts)return"—";return new Date(ts).toLocaleDateString([],{month:"numeric",day:"numeric",year:"numeric"});}
function Skel({w="100%",h=16,r=5,style}){return<div className="skel" style={{width:w,height:h,borderRadius:r,...style}}/>;}

const CAT_ICONS=["📚","📋","❓","📄","🎓","🔧","📢","💡"];
function deriveCategories(articles){
  const cats={};
  for(const a of articles){const cat=a.category||"General";if(!cats[cat])cats[cat]={name:cat,count:0};cats[cat].count++;}
  return Object.values(cats);
}

export default function KnowledgeBase({ profile }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew]   = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {data,error:err}=await supabase.from("kb_articles")
        .select("id,title,content,is_published,category,created_at,updated_at")
        .order("updated_at",{ascending:false}).limit(50);
      if (err) throw err;
      setArticles(data||[]);
    } catch(e){ setError(e.message); } finally { setLoading(false); }
  },[]);

  useEffect(()=>{load();},[load]);

  async function saveArticle() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const insertPayload = {
      title: newTitle.trim(),
      content: newContent.trim(),
      is_published: false,
    };
    if (profile?.org_id) insertPayload.org_id = profile.org_id;
    const {data,error:err}=await supabase.from("kb_articles").insert(insertPayload).select().single();
    if (!err&&data){
      setArticles(a=>[data,...a]);
      setShowNew(false); setNewTitle(""); setNewContent("");
    } else if (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const filtered=articles.filter(a=>!search||(a.title||"").toLowerCase().includes(search.toLowerCase()));
  const categories=deriveCategories(articles);
  const isAdmin=profile?.role==="admin";

  return (
    <div className="page-content">
      <div className="page-head-row">
        <div><h1>Knowledge Base</h1><p>Find answers and documentation</p></div>
        {isAdmin&&<button className="btn-primary" onClick={()=>setShowNew(true)}>+ New Article</button>}
      </div>

      <div className="kb-search-wrap">
        <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" style={{color:"#94A3B8"}}><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
        <input className="kb-search-inp" placeholder="Search articles..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {!search&&!selected&&(
        <div className="kb-cats">
          {loading ? Array.from({length:4}).map((_,i)=><div key={i} className="kb-cat-card"><Skel w={40} h={40} r={10}/><div style={{flex:1}}><Skel w="60%" h={14}/><Skel w="40%" h={12} style={{marginTop:6}}/></div></div>) :
            categories.map((cat,i)=>(
              <div key={cat.name} className="kb-cat-card" onClick={()=>setSearch(cat.name)}>
                <div className="kb-cat-icon">{CAT_ICONS[i%CAT_ICONS.length]}</div>
                <div><div className="kb-cat-name">{cat.name}</div><div className="kb-cat-count">{cat.count} article{cat.count!==1?"s":""}</div></div>
              </div>
            ))
          }
        </div>
      )}

      {selected ? (
        <div className="kb-article-view">
          <button className="kb-back" onClick={()=>setSelected(null)}>← Back to articles</button>
          <div className="kb-article-header">
            <h2 className="kb-article-title">{selected.title}</h2>
            <div className="kb-article-meta">
              <span className={`badge ${selected.is_published?"badge-blue":"badge-gray"}`}>{selected.is_published?"Published":"Draft"}</span>
              <span className="kb-article-date">Updated {fmtDate(selected.updated_at)}</span>
            </div>
          </div>
          <div className="kb-article-content">{selected.content||<em style={{color:"#94A3B8"}}>No content yet.</em>}</div>
        </div>
      ) : (
        <div className="kb-articles-panel">
          <div className="panel-section-title" style={{marginBottom:8}}>{search?`Results for "${search}"`:"Popular Articles"}</div>
          {loading ? Array.from({length:5}).map((_,i)=><div key={i} className="kb-article-row"><Skel w={18} h={18} r={4}/><Skel w="50%" h={14}/></div>) :
            filtered.length===0 ? <div className="empty-state"><div className="empty-icon">📖</div><div className="empty-title">No articles found</div></div> :
            filtered.map(a=>(
              <button key={a.id} className="kb-article-row" onClick={()=>setSelected(a)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{color:"#94A3B8",flexShrink:0}}><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
                <span className="kb-article-row-title">{a.title}</span>
                {!a.is_published&&<span className="badge badge-gray" style={{fontSize:10}}>Draft</span>}
                <span className="kb-article-date" style={{marginLeft:"auto"}}>{fmtDate(a.updated_at)}</span>
              </button>
            ))
          }
        </div>
      )}

      {showNew&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div className="modal">
            <div className="modal-header"><span>New Article</span><button className="panel-close" onClick={()=>setShowNew(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-field"><label>Title</label><input className="form-input" placeholder="Article title..." value={newTitle} onChange={e=>setNewTitle(e.target.value)}/></div>
              <div className="form-field"><label>Content</label><textarea className="form-textarea" placeholder="Write article content..." value={newContent} onChange={e=>setNewContent(e.target.value)} rows={8}/></div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={()=>setShowNew(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveArticle} disabled={saving||!newTitle.trim()}>{saving?"Saving...":"Save Draft"}</button>
            </div>
          </div>
        </div>
      )}
      {error&&<div className="banner err" style={{position:"fixed",bottom:16,right:16,maxWidth:400,zIndex:100}}>{error}</div>}
    </div>
  );
}