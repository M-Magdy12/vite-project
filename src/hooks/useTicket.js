import { useState, useEffect } from 'react';
import { ticketService } from '../services/ticketService';

export const useTicket = (conversationId) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setTicket(null);
      return;
    }

    const fetchTicket = async () => {
      setLoading(true);
      try {
        const data = await ticketService.fetchTicketByConversation(conversationId);
        setTicket(data);
      } catch (err) {
        console.error('Error fetching ticket:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [conversationId]);

  return { ticket, loading, refetch: () => {} };
};
