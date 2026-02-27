import { supabase } from '../config/supabase';

export const messageService = {
  async fetchMessages(conversationId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage(conversationId, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'agent',
        content
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
