import { supabase } from '../config/supabase';

export const conversationService = {
  async fetchConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .neq('status', 'closed')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateConversationStatus(conversationId, status) {
    const { data, error } = await supabase
      .from('conversations')
      .update({ status })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async takeoverConversation(conversationId) {
    return this.updateConversationStatus(conversationId, 'human_handling');
  },

  async closeConversation(conversationId) {
    return this.updateConversationStatus(conversationId, 'closed');
  }
};
