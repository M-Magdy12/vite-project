import { useState, useEffect, useCallback } from "react";
import { supabase } from "./createClient";

function Skel({ w = "100%", h = 16, r = 5, style }) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}
function timeAgo(ts) {
  if (!ts) return "—";
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return `${Math.round(d)}s ago`;
  if (d < 3600) return `${Math.round(d / 60)} min ago`;
  if (d < 86400) return `${Math.round(d / 3600)} hr ago`;
  return `${Math.round(d / 86400)}d ago`;
}
function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function Avatar({ name, size = 36 }) {
  const colors = ["#2563EB", "#7C3AED", "#DB2777", "#D97706", "#059669", "#DC2626"];
  const idx = (name || "").charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: colors[idx],
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0
    }}>{initials(name)}</div>
  );
}

const TABS = ["Staff Management", "Courses", "Announcements", "SLA Policies", "Tags"];

export default function AdminPanel({ profile }) {
  const [activeTab, setActiveTab] = useState("Staff Management");

  if (profile?.role !== "admin") {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">Admin access required</div>
          <div className="empty-desc">You need admin privileges to view this page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-head">
        <h1>Admin Panel</h1>
        <p>Manage staff, courses, and system settings</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, borderBottom: "1px solid var(--border)",
        marginBottom: 4
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 18px", fontSize: 13.5, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "var(--brand)" : "var(--tx2)",
              borderBottom: activeTab === tab ? "2px solid var(--brand)" : "2px solid transparent",
              borderRadius: 0, background: "none", cursor: "pointer",
              marginBottom: -1, transition: "color .15s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Staff Management" && <StaffTab profile={profile} />}
      {activeTab === "Courses"          && <CoursesTab profile={profile} />}
      {activeTab === "Announcements"    && <AnnouncementsTab profile={profile} />}
      {activeTab === "SLA Policies"     && <SLATab profile={profile} />}
      {activeTab === "Tags"             && <TagsTab profile={profile} />}
    </div>
  );
}

/* ── Staff Management ─────────────────────────────────────────────────── */
function StaffTab({ profile }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm]       = useState({ full_name: "", role: "agent" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false });
    if (!err) setMembers(data || []);
    else setError(err.message);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Staff Members</div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowNew(true)}>+ Add Staff</button>
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              {["Name", "Role", "Status", "Joined", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-lt)" }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} style={{ padding: "13px 16px" }}><Skel w={j === 0 ? 140 : j === 4 ? 60 : 80} h={13} /></td>
                ))}
              </tr>
            )) : members.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--tx3)", fontSize: 13 }}>No staff members found.</td></tr>
            ) : members.map(m => (
              <tr key={m.id} style={{ borderBottom: "1px solid var(--border-lt)", transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}
              >
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={m.full_name} size={32} />
                    <span style={{ fontWeight: 500 }}>{m.full_name}</span>
                    {m.id === profile?.id && <span style={{ fontSize: 10, background: "var(--brand-lt)", color: "var(--brand)", padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>You</span>}
                  </div>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    background: m.role === "admin" ? "#FEF3C7" : "var(--brand-lt)",
                    color: m.role === "admin" ? "#B45309" : "var(--brand)"
                  }}>{m.role === "admin" ? "Admin" : "Agent"}</span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: "#F0FDF4", color: "#16A34A" }}>active</span>
                </td>
                <td style={{ padding: "13px 16px", color: "var(--tx3)", fontSize: 12 }}>{timeAgo(m.created_at)}</td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ color: "var(--tx3)", fontSize: 13 }} title="Edit">✏️</button>
                    <button style={{ color: "var(--red)", fontSize: 13 }} title="Remove">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-header">
              <span>Add Staff Member</span>
              <button className="panel-close" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Full Name</label>
                <input className="form-input" placeholder="e.g. Sarah Kim" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <div style={{ color: "var(--red)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" disabled={saving || !form.full_name.trim()}>
                {saving ? "Adding…" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Courses ──────────────────────────────────────────────────────────── */
function CoursesTab({ profile }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm]       = useState({ code: "", name: "", department: "", level: "" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("courses")
      .select("id, code, name, department, level, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!err) setCourses(data || []);
    else setError(err.message);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createCourse() {
    if (!form.code.trim() || !form.name.trim()) return;
    setSaving(true);
    const { data, error: err } = await supabase.from("courses").insert({
      org_id: profile.org_id,
      code: form.code.trim(),
      name: form.name.trim(),
      department: form.department.trim(),
      level: parseInt(form.level) || 1,
    }).select().single();
    if (!err && data) {
      setCourses(c => [data, ...c]);
      setShowNew(false);
      setForm({ code: "", name: "", department: "", level: "" });
    } else if (err) setError(err.message);
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Courses</div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowNew(true)}>+ Add Course</button>
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              {["Code", "Name", "Department", "Level", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-lt)" }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} style={{ padding: "13px 16px" }}><Skel w={j === 1 ? 160 : 80} h={13} /></td>
                ))}
              </tr>
            )) : courses.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--tx3)", fontSize: 13 }}>No courses found.</td></tr>
            ) : courses.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border-lt)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}
              >
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ fontFamily: "monospace", background: "var(--brand-lt)", color: "var(--brand)", padding: "2px 8px", borderRadius: 5, fontSize: 12, fontWeight: 700 }}>{c.code}</span>
                </td>
                <td style={{ padding: "13px 16px", fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: "13px 16px", color: "var(--tx2)" }}>{c.department}</td>
                <td style={{ padding: "13px 16px", color: "var(--tx2)" }}>Year {c.level}</td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ color: "var(--tx3)" }} title="Edit">✏️</button>
                    <button style={{ color: "var(--red)" }} title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-header">
              <span>Add Course</span>
              <button className="panel-close" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label>Course Code</label>
                  <input className="form-input" placeholder="e.g. CS101" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Level (Year)</label>
                  <input className="form-input" type="number" min={1} max={6} placeholder="1" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} />
                </div>
              </div>
              <div className="form-field">
                <label>Course Name</label>
                <input className="form-input" placeholder="e.g. Introduction to Computer Science" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Department</label>
                <input className="form-input" placeholder="e.g. Computer Science" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              {error && <div style={{ color: "var(--red)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" onClick={createCourse} disabled={saving || !form.code.trim() || !form.name.trim()}>
                {saving ? "Saving…" : "Add Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Announcements (admin view) ───────────────────────────────────────── */
function AnnouncementsTab({ profile }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("announcements")
      .select("id, title, content, audience_type, audience_value, publish_at, expires_at, pinned, created_at")
      .order("created_at", { ascending: false }).limit(30)
      .then(({ data, error }) => {
        if (!error) setItems(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Announcements</div>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              {["Title", "Audience", "Publish Date", "Expires", "Pinned"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-lt)" }}>
                {Array.from({ length: 5 }).map((_, j) => <td key={j} style={{ padding: "13px 16px" }}><Skel w={j === 0 ? 180 : 90} h={13} /></td>)}
              </tr>
            )) : items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--tx3)", fontSize: 13 }}>No announcements yet.</td></tr>
            ) : items.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--border-lt)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}
              >
                <td style={{ padding: "13px 16px", fontWeight: 500 }}>{a.title}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 12, background: "var(--brand-lt)", color: "var(--brand)", fontWeight: 600 }}>
                    {a.audience_value || a.audience_type || "all"}
                  </span>
                </td>
                <td style={{ padding: "13px 16px", color: "var(--tx2)", fontSize: 12 }}>
                  {a.publish_at ? new Date(a.publish_at).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "13px 16px", color: "var(--tx2)", fontSize: 12 }}>
                  {a.expires_at ? new Date(a.expires_at).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "13px 16px" }}>
                  {a.pinned
                    ? <span style={{ color: "var(--brand)", fontSize: 13 }}>📌</span>
                    : <span style={{ color: "var(--tx3)", fontSize: 13 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── SLA Policies ─────────────────────────────────────────────────────── */
function SLATab({ profile }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [form, setForm]         = useState({ name: "", first_response_minutes: 60, resolution_minutes: 1440 });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    supabase.from("sla_policies")
      .select("id, name, first_response_minutes, resolution_minutes, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (!err) setPolicies(data || []);
        setLoading(false);
      });
  }, []);

  function fmtMins(m) {
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.round(m / 60)}h`;
    return `${Math.round(m / 1440)}d`;
  }

  async function createPolicy() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data, error: err } = await supabase.from("sla_policies").insert({
      org_id: profile.org_id,
      name: form.name.trim(),
      first_response_minutes: Number(form.first_response_minutes),
      resolution_minutes: Number(form.resolution_minutes),
    }).select().single();
    if (!err && data) { setPolicies(p => [data, ...p]); setShowNew(false); setForm({ name: "", first_response_minutes: 60, resolution_minutes: 1440 }); }
    else if (err) setError(err.message);
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>SLA Policies</div>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowNew(true)}>+ New Policy</button>
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              {["Name", "First Response", "Resolution", "Created"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-lt)" }}>
                {Array.from({ length: 4 }).map((_, j) => <td key={j} style={{ padding: "13px 16px" }}><Skel w={j === 0 ? 160 : 80} h={13} /></td>)}
              </tr>
            )) : policies.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "var(--tx3)", fontSize: 13 }}>No SLA policies yet.</td></tr>
            ) : policies.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border-lt)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}
              >
                <td style={{ padding: "13px 16px", fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ background: "#F0FDF4", color: "#16A34A", padding: "2px 8px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{fmtMins(p.first_response_minutes)}</span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ background: "#EFF6FF", color: "var(--brand)", padding: "2px 8px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{fmtMins(p.resolution_minutes)}</span>
                </td>
                <td style={{ padding: "13px 16px", color: "var(--tx3)", fontSize: 12 }}>{timeAgo(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-header"><span>New SLA Policy</span><button className="panel-close" onClick={() => setShowNew(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-field">
                <label>Policy Name</label>
                <input className="form-input" placeholder="e.g. Standard Support" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>First Response (minutes)</label>
                  <input className="form-input" type="number" min={1} value={form.first_response_minutes} onChange={e => setForm(f => ({ ...f, first_response_minutes: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Resolution (minutes)</label>
                  <input className="form-input" type="number" min={1} value={form.resolution_minutes} onChange={e => setForm(f => ({ ...f, resolution_minutes: e.target.value }))} />
                </div>
              </div>
              {error && <div style={{ color: "var(--red)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" onClick={createPolicy} disabled={saving || !form.name.trim()}>{saving ? "Saving…" : "Create Policy"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tags ─────────────────────────────────────────────────────────────── */
function TagsTab({ profile }) {
  const [tags, setTags]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    supabase.from("tags")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (!err) setTags(data || []);
        setLoading(false);
      });
  }, []);

  async function addTag() {
    if (!newTag.trim()) return;
    setSaving(true);
    const { data, error: err } = await supabase.from("tags").insert({
      org_id: profile.org_id,
      name: newTag.trim(),
    }).select().single();
    if (!err && data) { setTags(t => [data, ...t]); setNewTag(""); }
    else if (err) setError(err.message);
    setSaving(false);
  }

  async function deleteTag(id) {
    const { error: err } = await supabase.from("tags").delete().eq("id", id);
    if (!err) setTags(t => t.filter(x => x.id !== id));
    else setError(err.message);
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Tags</div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          className="form-input" placeholder="New tag name…"
          value={newTag} onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTag()}
          style={{ maxWidth: 280 }}
        />
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={addTag} disabled={saving || !newTag.trim()}>
          {saving ? "Adding…" : "+ Add Tag"}
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skel key={i} w={80} h={30} r={99} />)}
        </div>
      ) : tags.length === 0 ? (
        <div style={{ color: "var(--tx3)", fontSize: 13 }}>No tags yet. Add one above.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {tags.map(t => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 99, padding: "5px 12px", fontSize: 13, fontWeight: 500
            }}>
              <span>🏷 {t.name}</span>
              <button onClick={() => deleteTag(t.id)} style={{ color: "var(--tx3)", fontSize: 11, lineHeight: 1 }} title="Delete">✕</button>
            </div>
          ))}
        </div>
      )}
      {error && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</div>}
    </div>
  );
}
