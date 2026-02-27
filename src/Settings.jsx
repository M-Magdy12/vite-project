import { useState, useEffect } from "react";
import { supabase } from "./createClient";

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 99, cursor: "pointer",
        background: value ? "var(--brand)" : "#CBD5E1",
        position: "relative", transition: "background .2s", flexShrink: 0
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s"
      }} />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)", padding: "24px 28px",
      boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 20
    }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--tx1)" }}>{title}</div>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--tx1)" }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: "var(--tx3)", marginTop: 2 }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

export default function Settings({ profile }) {
  const [orgName, setOrgName]     = useState("University of Technology");
  const [supportEmail, setSupportEmail] = useState("support@university.edu");
  const [notifications, setNotifications] = useState({
    email_new_tickets: true,
    sla_breach_alerts: true,
    daily_summary: false,
    escalation_notifications: true,
  });
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  // Load org name from DB
  useEffect(() => {
    if (!profile?.org_id) return;
    supabase.from("organizations").select("name").eq("id", profile.org_id).single()
      .then(({ data }) => { if (data) setOrgName(data.name); });
  }, [profile?.org_id]);

  async function saveChanges() {
    setSaving(true);
    // Update org name
    if (profile?.org_id) {
      await supabase.from("organizations").update({ name: orgName }).eq("id", profile.org_id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="page-content">
      <div className="page-head">
        <h1>Settings</h1>
        <p>Manage system preferences</p>
      </div>

      {/* General */}
      <Section title="General">
        <div className="form-field">
          <label>Organization Name</label>
          <input
            className="form-input"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            style={{ maxWidth: 480 }}
          />
        </div>
        <div className="form-field">
          <label>Support Email</label>
          <input
            className="form-input"
            type="email"
            value={supportEmail}
            onChange={e => setSupportEmail(e.target.value)}
            style={{ maxWidth: 480 }}
          />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <SettingRow label="Email notifications for new tickets">
          <Toggle value={notifications.email_new_tickets} onChange={v => setNotifications(n => ({ ...n, email_new_tickets: v }))} />
        </SettingRow>
        <div style={{ height: 1, background: "var(--border-lt)" }} />
        <SettingRow label="SLA breach alerts" description="Get notified when a ticket breaches its SLA deadline">
          <Toggle value={notifications.sla_breach_alerts} onChange={v => setNotifications(n => ({ ...n, sla_breach_alerts: v }))} />
        </SettingRow>
        <div style={{ height: 1, background: "var(--border-lt)" }} />
        <SettingRow label="Daily summary report" description="Receive a daily digest of support activity">
          <Toggle value={notifications.daily_summary} onChange={v => setNotifications(n => ({ ...n, daily_summary: v }))} />
        </SettingRow>
        <div style={{ height: 1, background: "var(--border-lt)" }} />
        <SettingRow label="Escalation notifications" description="Alerts when conversations are escalated to human agents">
          <Toggle value={notifications.escalation_notifications} onChange={v => setNotifications(n => ({ ...n, escalation_notifications: v }))} />
        </SettingRow>
      </Section>

      {/* Profile */}
      <Section title="Your Profile">
        <SettingRow label="Full Name">
          <span style={{ fontSize: 14, color: "var(--tx2)", fontWeight: 500 }}>{profile?.full_name || "—"}</span>
        </SettingRow>
        <div style={{ height: 1, background: "var(--border-lt)" }} />
        <SettingRow label="Role">
          <span style={{
            padding: "3px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
            background: profile?.role === "admin" ? "#FEF3C7" : "var(--brand-lt)",
            color: profile?.role === "admin" ? "#B45309" : "var(--brand)"
          }}>
            {profile?.role === "admin" ? "Admin" : "Agent"}
          </span>
        </SettingRow>
        <div style={{ height: 1, background: "var(--border-lt)" }} />
        <SettingRow label="Organization ID">
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--tx3)", background: "var(--bg)", padding: "3px 8px", borderRadius: 5, border: "1px solid var(--border)" }}>
            {profile?.org_id?.slice(0, 16)}…
          </span>
        </SettingRow>
      </Section>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="btn-primary"
          onClick={saveChanges}
          disabled={saving}
          style={{ fontSize: 13.5, padding: "9px 22px" }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
            ✓ Changes saved
          </span>
        )}
      </div>
    </div>
  );
}
