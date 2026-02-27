import { useState, useEffect, useCallback } from "react";
import { supabase } from "./createClient";

function Skel({ w = "100%", h = 16, r = 5, style }) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}
function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_MAP = {
  open:     { bg: "#EFF6FF", color: "#2563EB", label: "Open" },
  assigned: { bg: "#FFFBEB", color: "#D97706", label: "Assigned" },
  waiting:  { bg: "#F0F9FF", color: "#0284C7", label: "Waiting" },
  resolved: { bg: "#F0FDF4", color: "#16A34A", label: "Resolved" },
  closed:   { bg: "#F8FAFC", color: "#64748B", label: "Closed" },
};

export default function StudentPortal({ profile }) {
  const [tab, setTab]           = useState("tickets");
  const [tickets, setTickets]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [kbArticles, setKbArticles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  // New ticket form
  const [showNew, setShowNew]   = useState(false);
  const [form, setForm]         = useState({ title: "", type: "other", priority: "medium", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tkRes, annRes, kbRes] = await Promise.all([
      supabase.from("tickets")
        .select("id, title, type, priority, status, created_at, updated_at")
        .order("created_at", { ascending: false }).limit(20),
      supabase.from("announcements")
        .select("id, title, content, audience_type, audience_value, publish_at, pinned, created_at")
        .order("publish_at", { ascending: false }).limit(10),
      supabase.from("kb_articles")
        .select("id, title, category, is_published, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false }).limit(12),
    ]);
    setTickets(tkRes.data || []);
    setAnnouncements((annRes.data || []).filter(a => !a.expires_at || new Date(a.expires_at) >= new Date()));
    setKbArticles(kbRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function submitTicket() {
    if (!form.title.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Guard: profile must be loaded
      if (!profile?.id || !profile?.org_id) {
        throw new Error("Profile not loaded. Please refresh and try again.");
      }

      // Step 1: find existing customer by external_ref = profile.id
      let customerId = null;
      const { data: existingCustomers, error: findErr } = await supabase
        .from("customers")
        .select("id")
        .eq("org_id", profile.org_id)
        .eq("external_ref", profile.id)
        .limit(1);

      if (findErr) throw new Error("Customer lookup failed: " + findErr.message);

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        // Create a new customer record for this profile user
        const { data: newCustomer, error: custErr } = await supabase
          .from("customers")
          .insert({
            org_id: profile.org_id,
            external_ref: profile.id,
            full_name: profile.full_name || "Portal User",
          })
          .select("id")
          .single();
        if (custErr) throw new Error("Could not create customer: " + custErr.message);
        customerId = newCustomer.id;
      }

      // Step 2: create a conversation
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          org_id: profile.org_id,
          customer_id: customerId,
          channel: "web",
          status: "open",
        })
        .select("id")
        .single();
      if (convErr) throw new Error("Could not create conversation: " + convErr.message);

      // Step 3: insert opening message if description provided
      if (form.description.trim()) {
        const { error: msgErr } = await supabase.from("messages").insert({
          org_id: profile.org_id,
          conversation_id: conv.id,
          sender_type: "customer",
          content: form.description.trim(),
        });
        if (msgErr) throw new Error("Could not save message: " + msgErr.message);
      }

      // Step 4: create the ticket
      const { data: ticket, error: tktErr } = await supabase
        .from("tickets")
        .insert({
          org_id: profile.org_id,
          conversation_id: conv.id,
          title: form.title.trim(),
          type: form.type,
          priority: form.priority,
          status: "open",
          created_by: profile.id,
        })
        .select("id, title, type, priority, status, created_at, updated_at")
        .single();
      if (tktErr) throw new Error("Could not create ticket: " + tktErr.message);

      // Step 5: log ticket_event (non-blocking — don't fail the whole flow if this errors)
      await supabase.from("ticket_events").insert({
        ticket_id: ticket.id,
        actor_type: "agent",
        actor_id: profile.id,
        event_type: "created",
        payload: { title: form.title.trim(), type: form.type, priority: form.priority },
      });

      // Success
      setTickets(prev => [ticket, ...prev]);
      setShowNew(false);
      setForm({ title: "", type: "other", priority: "medium", description: "" });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);

    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const TABS = [
    { id: "tickets",       label: "My Tickets",    icon: "🎫" },
    { id: "announcements", label: "Announcements", icon: "📣" },
    { id: "kb",            label: "Knowledge Base", icon: "📚" },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, var(--brand) 0%, #1D4ED8 100%)",
        borderRadius: "var(--r-lg)", padding: "28px 32px",
        color: "#fff", boxShadow: "var(--shadow-md)"
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.025em", marginBottom: 6 }}>
          Student Support Portal
        </div>
        <div style={{ fontSize: 14, opacity: .85 }}>
          Welcome back, {profile?.full_name || "Student"} — how can we help you today?
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowNew(true)}
          style={{
            marginTop: 18, background: "#fff", color: "var(--brand)",
            fontWeight: 700, fontSize: 13.5, padding: "9px 20px"
          }}
        >
          + Submit New Request
        </button>
      </div>

      {/* Success banner */}
      {submitSuccess && (
        <div style={{
          background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "var(--r-md)",
          padding: "12px 18px", color: "#16A34A", fontSize: 13.5, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8
        }}>
          ✓ Your request has been submitted. Our support team will get back to you shortly.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 18px", fontSize: 13.5, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? "var(--brand)" : "var(--tx2)",
            borderBottom: tab === t.id ? "2px solid var(--brand)" : "2px solid transparent",
            borderRadius: 0, background: "none", cursor: "pointer", marginBottom: -1,
            display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tickets tab */}
      {tab === "tickets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)", padding: "18px 22px"
            }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <Skel w={80} h={13} /><Skel w={60} h={13} /><Skel w={60} h={13} />
              </div>
              <Skel w="55%" h={16} />
            </div>
          )) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎫</div>
              <div className="empty-title">No tickets yet</div>
              <div className="empty-desc">Submit a request and we'll help you out.</div>
            </div>
          ) : tickets.map(t => {
            const s = STATUS_MAP[t.status] || { bg: "#F1F5F9", color: "#475569", label: t.status };
            return (
              <div key={t.id} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)", padding: "18px 22px",
                boxShadow: "var(--shadow-sm)", cursor: "pointer",
                transition: "box-shadow .15s, border-color .15s",
                borderColor: selected?.id === t.id ? "var(--brand)" : "var(--border)"
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                onClick={() => setSelected(selected?.id === t.id ? null : t)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--tx3)", background: "var(--bg)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border)" }}>
                    {t.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                  <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "var(--bg)", color: "var(--tx2)", border: "1px solid var(--border)", textTransform: "capitalize" }}>{t.type}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--tx3)" }}>{fmtDate(t.created_at)}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--tx1)" }}>{t.title}</div>
                {selected?.id === t.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-lt)", fontSize: 13, color: "var(--tx2)", display: "flex", gap: 20 }}>
                    <div><strong style={{ color: "var(--tx1)" }}>Priority:</strong> <span style={{ textTransform: "capitalize" }}>{t.priority}</span></div>
                    <div><strong style={{ color: "var(--tx1)" }}>Last updated:</strong> {fmtDate(t.updated_at)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Announcements tab */}
      {tab === "announcements" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "20px 22px" }}>
              <Skel w="50%" h={16} /><Skel w="80%" h={13} style={{ marginTop: 10 }} />
            </div>
          )) : announcements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📣</div>
              <div className="empty-title">No announcements</div>
              <div className="empty-desc">Check back later for campus updates.</div>
            </div>
          ) : announcements.map(a => (
            <div key={a.id} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)", padding: "20px 22px",
              boxShadow: "var(--shadow-sm)",
              borderLeft: a.pinned ? "3px solid var(--brand)" : "1px solid var(--border)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {a.pinned && <span style={{ fontSize: 13 }}>📌</span>}
                <span style={{ fontWeight: 700, fontSize: 15 }}>{a.title}</span>
                {a.audience_value && (
                  <span style={{ marginLeft: "auto", fontSize: 11, background: "var(--brand-lt)", color: "var(--brand)", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                    {a.audience_value}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--tx2)", lineHeight: 1.6, marginBottom: 10 }}>{a.content}</div>
              <div style={{ fontSize: 11.5, color: "var(--tx3)" }}>
                {fmtDate(a.publish_at || a.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KB tab */}
      {tab === "kb" && (
        <div>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)"
          }}>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ padding: "15px 20px", borderBottom: "1px solid var(--border-lt)", display: "flex", gap: 12, alignItems: "center" }}>
                <Skel w={18} h={18} r={4} /><Skel w="50%" h={14} />
              </div>
            )) : kbArticles.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📖</div>
                <div className="empty-title">No articles yet</div>
              </div>
            ) : kbArticles.map(a => (
              <div key={a.id} style={{
                padding: "15px 20px", borderBottom: "1px solid var(--border-lt)",
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                transition: "background .1s"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ color: "var(--tx3)", flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{a.title}</span>
                {a.category && (
                  <span style={{ fontSize: 11, background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 99, color: "var(--tx3)" }}>{a.category}</span>
                )}
                <span style={{ fontSize: 11.5, color: "var(--tx3)", whiteSpace: "nowrap" }}>{fmtDate(a.updated_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New request modal */}
      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-header">
              <span>Submit Support Request</span>
              <button className="panel-close" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Subject</label>
                <input className="form-input" placeholder="Brief description of your issue…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Category</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="academic">Academic</option>
                    <option value="technical">Technical</option>
                    <option value="finance">Finance</option>
                    <option value="complaint">Complaint</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea className="form-textarea" placeholder="Describe your issue in detail…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={5} />
              </div>
              {submitError && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 13px", fontSize: 13, color: "#DC2626", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>{submitError}
              </div>
            )}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitTicket} disabled={submitting || !form.title.trim()}>
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}