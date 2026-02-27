import { useState } from "react";
import { supabase } from "./createClient";

export default function Login({ onSuccess }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
    // on success, onAuthStateChange in App.jsx picks it up automatically
  }

  return (
    <div style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      overflow: "hidden",
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: "0 0 52%",
        background: "#0A1628",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 56px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Grid texture */}
        <svg style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          opacity: 0.06, pointerEvents: "none",
        }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        {/* Glow blobs */}
        <div style={{
          position: "absolute", top: -120, right: -80,
          width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)",
          pointerEvents: "none",
        }}/>
        <div style={{
          position: "absolute", bottom: -80, left: -60,
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}/>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(37,99,235,0.6)",
          }}>
            <svg viewBox="0 0 28 28" fill="none" width="22" height="22">
              <path d="M7 9h14M7 14h9M7 19h11" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: "-.02em" }}>CampusDesk</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1 }}>University Support</div>
          </div>
        </div>

        {/* Center content */}
        <div style={{ zIndex: 1 }}>
          <div style={{
            display: "inline-block",
            background: "rgba(37,99,235,0.18)",
            border: "1px solid rgba(37,99,235,0.4)",
            borderRadius: 99,
            padding: "5px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: "#60A5FA",
            marginBottom: 24,
            letterSpacing: ".04em",
          }}>
            SUPPORT PLATFORM
          </div>

          <h1 style={{
            color: "#fff",
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: "-.035em",
            lineHeight: 1.1,
            marginBottom: 20,
          }}>
            Resolve faster.<br/>
            <span style={{
              background: "linear-gradient(90deg, #60A5FA, #2563EB)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Support smarter.
            </span>
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 15,
            lineHeight: 1.7,
            maxWidth: 360,
          }}>
            The all-in-one helpdesk for universities — tickets, inbox, announcements, and AI-powered support in one place.
          </p>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: 32, marginTop: 48,
          }}>
            {[
              { num: "98%", label: "Satisfaction rate" },
              { num: "3min", label: "Avg response time" },
              { num: "10k+", label: "Tickets resolved" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{s.num}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{
          zIndex: 1,
          borderLeft: "2px solid rgba(37,99,235,0.5)",
          paddingLeft: 16,
        }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontStyle: "italic", lineHeight: 1.6 }}>
            "Transformed how we handle student support.<br/>Response times dropped by 70%."
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 8 }}>
            — Head of Student Services, University of Tech
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        background: "#F8FAFC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 40px",
        position: "relative",
      }}>

        {/* Subtle dot pattern */}
        <svg style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          opacity: 0.4, pointerEvents: "none",
        }}>
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="#CBD5E1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>

        <div style={{
          width: "100%",
          maxWidth: 400,
          position: "relative",
          zIndex: 1,
        }}>

          {/* Card */}
          <div style={{
            background: "#fff",
            borderRadius: 16,
            padding: "40px 36px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(0,0,0,0.08)",
            border: "1px solid #E2E8F0",
          }}>

            <div style={{ marginBottom: 28 }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#0F172A",
                letterSpacing: "-.03em",
                marginBottom: 6,
              }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: "#94A3B8" }}>
                Sign in to your CampusDesk account
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                  Email address
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                    color: "#94A3B8", pointerEvents: "none",
                  }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    autoComplete="email"
                    required
                    style={{
                      width: "100%",
                      padding: "11px 13px 11px 38px",
                      fontSize: 14,
                      border: `1px solid ${error ? "#FECACA" : "#E2E8F0"}`,
                      borderRadius: 9,
                      outline: "none",
                      background: "#F8FAFC",
                      color: "#0F172A",
                      transition: "border-color .15s, box-shadow .15s",
                      boxSizing: "border-box",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = "#2563EB";
                      e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
                      e.target.style.background = "#fff";
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = error ? "#FECACA" : "#E2E8F0";
                      e.target.style.boxShadow = "none";
                      e.target.style.background = "#F8FAFC";
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                    Password
                  </label>
                  <button
                    type="button"
                    style={{ fontSize: 12, color: "#2563EB", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                    color: "#94A3B8", pointerEvents: "none",
                  }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    autoComplete="current-password"
                    required
                    style={{
                      width: "100%",
                      padding: "11px 40px 11px 38px",
                      fontSize: 14,
                      border: `1px solid ${error ? "#FECACA" : "#E2E8F0"}`,
                      borderRadius: 9,
                      outline: "none",
                      background: "#F8FAFC",
                      color: "#0F172A",
                      transition: "border-color .15s, box-shadow .15s",
                      boxSizing: "border-box",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = "#2563EB";
                      e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
                      e.target.style.background = "#fff";
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = error ? "#FECACA" : "#E2E8F0";
                      e.target.style.boxShadow = "none";
                      e.target.style.background = "#F8FAFC";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      color: "#94A3B8", background: "none", border: "none", cursor: "pointer",
                      padding: 2, display: "flex", alignItems: "center",
                    }}
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: 8, padding: "10px 13px",
                  fontSize: 13, color: "#DC2626", lineHeight: 1.5,
                }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: loading ? "#93C5FD" : "#2563EB",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14.5,
                  border: "none",
                  borderRadius: 9,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background .15s, transform .1s, box-shadow .15s",
                  boxShadow: loading ? "none" : "0 2px 12px rgba(37,99,235,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 4,
                }}
                onMouseEnter={e => { if (!loading) { e.target.style.background = "#1D4ED8"; e.target.style.boxShadow = "0 4px 20px rgba(37,99,235,0.45)"; }}}
                onMouseLeave={e => { if (!loading) { e.target.style.background = "#2563EB"; e.target.style.boxShadow = "0 2px 12px rgba(37,99,235,0.35)"; }}}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ animation: "spin 0.8s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 12.5, color: "#94A3B8" }}>
            Having trouble? Contact{" "}
            <span style={{ color: "#2563EB", fontWeight: 500 }}>it@university.edu</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}