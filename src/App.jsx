<<<<<<< HEAD
import { useState, useEffect } from "react";
import { supabase } from "./createClient";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Dashboard from "./Dashboard";
import Inbox from "./Inbox";
import Tickets from "./Tickets";
import KnowledgeBase from "./KnowledgeBase";
import Announcements from "./Announcements";
import AdminPanel from "./AdminPanel";
import Settings from "./Settings";
import StudentPortal from "./StudentPortal";
import Login from "./Login";
import "./App.css";
=======
import { useState } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { useConversations } from './hooks/useConversations';
import { useMessages } from './hooks/useMessages';
import { useTicket } from './hooks/useTicket';
import { messageService } from './services/messageService';
import { conversationService } from './services/conversationService';
import { ticketService } from './services/ticketService';
import './App.css';

function App() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  
  const { conversations, loading: conversationsLoading } = useConversations();
  const { messages, loading: messagesLoading } = useMessages(selectedConversationId);
  const { ticket } = useTicket(selectedConversationId);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendMessage = async (content) => {
    if (!selectedConversationId) return;

    try {
      await messageService.sendMessage(selectedConversationId, content);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTakeover = async () => {
    if (!selectedConversationId) return;

    try {
      await conversationService.takeoverConversation(selectedConversationId);
      if (ticket) {
        await ticketService.updateTicketStatus(ticket.id, 'assigned');
      }
    } catch (error) {
      console.error('Error taking over conversation:', error);
      alert('Failed to take over conversation.');
    }
  };

  const handleResolve = async () => {
    if (!ticket) return;

    try {
      await ticketService.resolveTicket(ticket.id);
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('Failed to resolve ticket.');
    }
  };

  const handleClose = async () => {
    if (!selectedConversationId || !ticket) return;

    try {
      await ticketService.closeTicket(ticket.id);
      await conversationService.closeConversation(selectedConversationId);
      setSelectedConversationId(null);
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert('Failed to close conversation.');
    }
  };

  if (conversationsLoading) {
    return <div className="loading">Loading...</div>;
  }
>>>>>>> 8fcd696219451732fa8457e3ad4f513deab718c4

function NoSessionPage() {
  return (
<<<<<<< HEAD
    <div className="page-content">
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <div className="empty-title">Not signed in</div>
        <div className="empty-desc">Please sign in to access CampusDesk.</div>
      </div>
=======
    <div className="app">
      <Sidebar
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
      />
      <ChatPanel
        conversation={selectedConversation}
        messages={messages}
        messagesLoading={messagesLoading}
        ticket={ticket}
        onSendMessage={handleSendMessage}
        onTakeover={handleTakeover}
        onResolve={handleResolve}
        onClose={handleClose}
      />
>>>>>>> 8fcd696219451732fa8457e3ad4f513deab718c4
    </div>
  );
}

function NoProfilePage({ error }) {
  return (
    <div className="page-content">
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <div className="empty-title">Profile not found</div>
        <div className="empty-desc">{error || "Your user profile could not be loaded. Contact your administrator."}</div>
      </div>
    </div>
  );
}


export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");

  const [session, setSession]           = useState(undefined);
  const [profile, setProfile]           = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loginError, setLoginError]     = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      if (!s) { setProfile(null); setProfileError(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { setProfile(null); setProfileError(null); return; }
    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);
    supabase.from("profiles").select("id, org_id, full_name, role").eq("id", session.user.id).single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setProfileError(error.message); setProfile(null); }
        else setProfile(data);
        setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [session]);

  async function handleLogin(email, password) {
    setLoginLoading(true); setLoginError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
    setLoginLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // Still resolving
  if (session === undefined || profileLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8FAFC" }}>
        <div style={{ color: "#64748B", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  // Not logged in
  if (!session) return <Login onLogin={handleLogin} error={loginError} loading={loginLoading} />;

  function renderMain() {
    if (profileError) return <NoProfilePage error={profileError} />;
    if (!profile) return (
      <div className="page-content">
        <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Loading profile…</div></div>
      </div>
    );

    // ✅ Profile confirmed — current_org_id() resolves for all RLS checks
    const props = { profile, search };
    switch (activePage) {
      case "Dashboard":      return <Dashboard     {...props} />;
      case "Inbox":          return <Inbox         {...props} />;
      case "Tickets":        return <Tickets       {...props} />;
      case "Knowledge Base": return <KnowledgeBase {...props} />;
      case "Announcements":  return <Announcements {...props} />;
      case "Admin Panel":    return <AdminPanel    {...props} />;
      case "Settings":       return <Settings      {...props} />;
      case "Student Portal": return <StudentPortal {...props} />;
      default:               return <Dashboard     {...props} />;
    }
  }

  const fullHeightPage = activePage === "Inbox" || activePage === "Tickets";

  return (
    <div className={`app ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} open={sidebarOpen} />
      <div className="content">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(s => !s)}
          orgName="University of Tech"
          initials={initials}
          search={search}
          onSearch={setSearch}
          onLogout={handleLogout}
        />
        <main className={`main${fullHeightPage ? " main--full" : ""}`}>
          {renderMain()}
        </main>
      </div>
    </div>
  );
}