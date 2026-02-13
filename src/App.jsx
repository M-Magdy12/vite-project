import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './createClient.js';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (payload.new.conversation_id === selectedConversationId) {
            setMessages((prev) => [...prev, payload.new]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .neq('status', 'closed')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversationId) return;
    
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const createNewConversation = async () => {
    setCreatingConversation(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchConversations();
      setSelectedConversationId(data.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation');
    } finally {
      setCreatingConversation(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversationId) return;

    const messageText = messageInput.trim();
    setMessageInput('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversationId,
          sender_type: 'agent',
          content: messageText
        })
        .select()
        .single();

      if (error) throw error;
      
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(messageText);
      alert('Failed to send message');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>Grade Z - MVP</h1>
          <p className="subtitle">Active Conversations</p>
        </div>
        <div className="new-conversation-wrapper">
          <button 
            className="new-conversation-button" 
            onClick={createNewConversation}
            disabled={creatingConversation}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {creatingConversation ? 'Creating...' : 'New Conversation'}
          </button>
        </div>
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-state">No open conversations</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedConversationId === conv.id ? 'active' : ''}`}
                onClick={() => setSelectedConversationId(conv.id)}
              >
                <div className="conversation-header">
                  <span className="conversation-id">Conversation #{conv.id.slice(0, 8)}</span>
                  <span className={`conversation-status status-${conv.status}`}>
                    {conv.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="conversation-meta">
                  <span className="conversation-time">
                    {new Date(conv.updated_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="main-panel">
        {!selectedConversationId ? (
          <div className="empty-chat">
            <div className="empty-chat-content">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the sidebar to view messages</p>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <h2>Conversation #{selectedConversationId.slice(0, 8)}</h2>
                <span className={`status-badge status-${conversations.find(c => c.id === selectedConversationId)?.status}`}>
                  {conversations.find(c => c.id === selectedConversationId)?.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="messages-container">
              {messagesLoading ? (
                <div className="loading-messages">
                  <div className="spinner"></div>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message message-${msg.sender_type}`}
                  >
                    <div className="message-wrapper">
                      <div className="message-avatar">
                        {msg.sender_type === 'customer' && 'C'}
                        {msg.sender_type === 'ai' && 'AI'}
                        {msg.sender_type === 'agent' && 'S'}
                      </div>
                      <div className="message-bubble">
                        <div className="message-sender">
                          {msg.sender_type === 'agent' ? 'Sender' : msg.sender_type.charAt(0).toUpperCase() + msg.sender_type.slice(1)}
                        </div>
                        <div className="message-content">{msg.content}</div>
                        <div className="message-time">
                          {new Date(msg.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <form className="message-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="message-input"
                  autoFocus
                />
                <button type="submit" className="send-button" disabled={!messageInput.trim()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Send
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;