import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { messageService } from '../services/messageService';

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = async () => {
    console.log('useMessages - fetchMessages called with conversationId:', conversationId);
    
    if (!conversationId) {
      console.log('useMessages - No conversationId, clearing messages');
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const data = await messageService.fetchMessages(conversationId);
      console.log('useMessages - Fetched messages:', data);
      console.log('useMessages - Message count:', data?.length);
      setMessages(data);
      setError(null);
    } catch (err) {
      console.error('useMessages - Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useMessages - useEffect triggered, conversationId:', conversationId);
    fetchMessages();

    if (!conversationId) return;

    // Subscribe to new messages
    console.log('useMessages - Setting up realtime subscription for:', conversationId);
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('useMessages - Realtime message received:', payload.new);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      console.log('useMessages - Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, loading, error, refetch: fetchMessages };
};
