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

  return (
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
    </div>
  );
}

export default App;