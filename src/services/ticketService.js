import { supabase } from '../config/supabase';

export const ticketService = {
  async fetchTicketByConversation(conversationId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateTicketStatus(ticketId, status) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async resolveTicket(ticketId) {
    return this.updateTicketStatus(ticketId, 'resolved');
  },

  async closeTicket(ticketId) {
    return this.updateTicketStatus(ticketId, 'closed');
  }
};
