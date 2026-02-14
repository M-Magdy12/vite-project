# n8n Integration Guide

## Overview

This document describes the integration points between the Grade Z frontend and n8n workflows. The frontend does NOT call n8n directly - all communication happens through Supabase.

## Architecture

```
Customer → n8n Webhook → Supabase (service role)
                              ↓
Agent Dashboard ← Supabase (anon key + RLS)
```

## n8n Workflows

### WF01: Chat Inbound (Customer Message)

**Webhook URL:** `POST /chat/inbound`

**Request Body:**
```json
{
  "session_id": "sess_123",
  "message": "Hello I need help"
}
```

**Workflow Steps:**
1. Validate input
2. Find or create conversation
3. Insert customer message
4. Load recent context (last 20 messages)
5. Fetch knowledge base entries
6. Call AI (LLM node)
7. Decision: escalate or reply
8. Insert AI message
9. Update conversation status
10. Respond to customer

**AI Response Format (JSON):**
```json
{
  "reply": "How can I help you today?",
  "should_escalate": false,
  "reason": null
}
```

**Escalation Triggers:**
- `should_escalate = true` from AI
- Customer explicitly requests human
- Multiple failed resolution attempts
- Sensitive topics detected

**Response to Customer:**
```json
{
  "conversation_id": "uuid",
  "reply": "AI response text",
  "status": "ai_handling"
}
```

---

### WF02: Escalation & Ticket Creation

**Triggered by:** WF01 when `should_escalate = true`

**Workflow Steps:**
1. Create ticket record
2. Update conversation status to 'escalated'
3. Respond to customer

**Database Operations:**
```sql
-- Create ticket
INSERT INTO tickets (conversation_id, status) 
VALUES ('uuid', 'open');

-- Update conversation
UPDATE conversations 
SET status = 'escalated' 
WHERE id = 'uuid';
```

**Response to Customer:**
```json
{
  "reply": "Your request has been escalated to a human agent.",
  "status": "escalated",
  "ticket_id": "uuid"
}
```

---

### WF03: Agent Assist Summary (Optional)

**Webhook URL:** `POST /agent/summary`

**Request Body:**
```json
{
  "conversation_id": "uuid"
}
```

**Workflow Steps:**
1. Load all messages for conversation
2. Call AI for summary + suggested response
3. Return to agent dashboard

**Response:**
```json
{
  "summary": "Customer is having trouble with password reset...",
  "suggested_response": "I can help you reset your password...",
  "sentiment": "frustrated",
  "priority": "medium"
}
```

**Note:** This is optional for MVP. Skip if you want to move faster.

---

## Frontend Integration Points

### What Frontend DOES

✅ Read conversations from Supabase
✅ Read messages from Supabase
✅ Read tickets from Supabase
✅ Insert agent messages to Supabase
✅ Update conversation status in Supabase
✅ Update ticket status in Supabase
✅ Subscribe to real-time updates via Supabase

### What Frontend DOES NOT DO

❌ Call n8n webhooks
❌ Create conversations (n8n does this)
❌ Insert customer/AI messages (n8n does this)
❌ Handle AI logic (n8n does this)
❌ Create tickets (n8n does this)

---

## Agent Workflow (Frontend)

### 1. View Escalated Conversations

**Query:**
```javascript
const { data } = await supabase
  .from('conversations')
  .select('*')
  .neq('status', 'closed')
  .order('updated_at', { ascending: false });
```

**Filters:**
- Show all non-closed conversations
- Highlight 'escalated' status
- Sort by most recent first

---

### 2. Take Over Conversation

**Trigger:** Agent clicks "Take Over" button

**Actions:**
```javascript
// Update conversation
await supabase
  .from('conversations')
  .update({ status: 'human_handling' })
  .eq('id', conversationId);

// Update ticket
await supabase
  .from('tickets')
  .update({ status: 'assigned' })
  .eq('conversation_id', conversationId);
```

**UI Changes:**
- "Take Over" button disappears
- "Resolve" button appears
- Status badge updates to "human handling"

---

### 3. Send Agent Message

**Trigger:** Agent types message and clicks "Send"

**Action:**
```javascript
await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    sender_type: 'agent',
    content: messageText
  });
```

**Real-time Effect:**
- Message appears instantly in UI
- Other agents see the message (if viewing same conversation)
- Conversation updated_at timestamp changes

---

### 4. Resolve Ticket

**Trigger:** Agent clicks "Resolve" button

**Action:**
```javascript
await supabase
  .from('tickets')
  .update({ status: 'resolved' })
  .eq('id', ticketId);
```

**UI Changes:**
- "Resolve" button disappears
- "Close" button appears
- Ticket badge updates to "resolved"

---

### 5. Close Conversation

**Trigger:** Agent clicks "Close" button

**Actions:**
```javascript
// Close ticket
await supabase
  .from('tickets')
  .update({ status: 'closed' })
  .eq('id', ticketId);

// Close conversation
await supabase
  .from('conversations')
  .update({ status: 'closed' })
  .eq('id', conversationId);
```

**UI Changes:**
- Conversation disappears from sidebar
- Agent returns to empty state
- Conversation archived (not deleted)

---

## Real-Time Synchronization

### Conversation Updates

**Channel:** `conversations-changes`

**Subscription:**
```javascript
supabase
  .channel('conversations-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'conversations'
  }, (payload) => {
    // Refetch conversation list
    fetchConversations();
  })
  .subscribe();
```

**Triggers:**
- n8n creates new conversation
- n8n updates conversation status
- Agent updates conversation status
- Any conversation change

---

### Message Updates

**Channel:** `messages-{conversationId}`

**Subscription:**
```javascript
supabase
  .channel(`messages-${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // Add new message to UI
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();
```

**Triggers:**
- n8n inserts customer message
- n8n inserts AI message
- Agent inserts agent message

---

## Testing the Integration

### Test 1: Customer Inbound Flow

**Setup:**
1. Ensure n8n WF01 is running
2. Ensure Supabase is configured
3. Open agent dashboard

**Test Steps:**
```bash
# Send customer message via n8n webhook
curl -X POST https://your-n8n-instance.com/webhook/chat/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_1",
    "message": "I need help with my account"
  }'
```

**Expected Results:**
1. n8n creates conversation (status: 'open')
2. n8n inserts customer message
3. n8n calls AI
4. n8n inserts AI message
5. n8n updates conversation (status: 'ai_handling')
6. Agent dashboard shows new conversation
7. Agent can see customer and AI messages

---

### Test 2: Escalation Flow

**Setup:**
1. Complete Test 1
2. Force AI to escalate

**Test Steps:**
```bash
# Send message that triggers escalation
curl -X POST https://your-n8n-instance.com/webhook/chat/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_1",
    "message": "I want to speak to a human agent NOW"
  }'
```

**Expected Results:**
1. n8n detects escalation trigger
2. n8n creates ticket (status: 'open')
3. n8n updates conversation (status: 'escalated')
4. Agent dashboard highlights conversation
5. "Take Over" button appears

---

### Test 3: Agent Takeover Flow

**Setup:**
1. Complete Test 2
2. Agent is logged in

**Test Steps:**
1. Agent clicks on escalated conversation
2. Agent clicks "Take Over" button
3. Agent sends message: "Hi, I'm here to help"

**Expected Results:**
1. Conversation status → 'human_handling'
2. Ticket status → 'assigned'
3. "Take Over" button disappears
4. "Resolve" button appears
5. Agent message appears in chat

---

### Test 4: Resolution Flow

**Setup:**
1. Complete Test 3
2. Conversation is in 'human_handling' state

**Test Steps:**
1. Agent resolves customer issue
2. Agent clicks "Resolve" button
3. Agent clicks "Close" button

**Expected Results:**
1. Ticket status → 'resolved'
2. "Resolve" button disappears
3. "Close" button appears
4. Ticket status → 'closed'
5. Conversation status → 'closed'
6. Conversation disappears from sidebar

---

## Environment Setup

### n8n Configuration

**Supabase Credentials:**
```
URL: https://your-project.supabase.co
Key: your_service_role_key (⚠️ service role, not anon)
```

**Webhook URLs:**
- WF01: `https://your-n8n.com/webhook/chat/inbound`
- WF02: (internal, called by WF01)
- WF03: `https://your-n8n.com/webhook/agent/summary` (optional)

---

### Frontend Configuration

**Environment Variables:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

⚠️ **Security Note:** Frontend uses ANON key + RLS, n8n uses SERVICE_ROLE key

---

## Troubleshooting

### Issue: Conversations Not Appearing

**Possible Causes:**
- n8n not creating conversations
- RLS policies blocking access
- Agent not authenticated

**Debug Steps:**
1. Check Supabase table browser
2. Verify conversations exist
3. Check agent authentication
4. Review RLS policies

---

### Issue: Messages Not Syncing

**Possible Causes:**
- Realtime not enabled
- Subscription not active
- Network issues

**Debug Steps:**
1. Check browser console for errors
2. Verify WebSocket connection
3. Check Supabase Realtime logs
4. Test with manual insert

---

### Issue: Cannot Send Messages

**Possible Causes:**
- RLS policy blocking insert
- Agent not authenticated
- Invalid conversation_id

**Debug Steps:**
1. Check browser console
2. Verify agent role in profiles table
3. Test RLS policy manually
4. Check Supabase logs

---

## n8n Workflow Templates

### WF01 Pseudocode

```javascript
// 1. Webhook Trigger
const { session_id, message } = $input.json;

// 2. Validate
if (!session_id || !message) {
  return { error: 'Invalid input' };
}

// 3. Create Conversation
const conversation = await supabase
  .from('conversations')
  .insert({ status: 'open' })
  .select()
  .single();

// 4. Insert Customer Message
await supabase
  .from('messages')
  .insert({
    conversation_id: conversation.id,
    sender_type: 'customer',
    content: message
  });

// 5. Load Context
const messages = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversation.id)
  .order('created_at', { ascending: false })
  .limit(20);

// 6. Load KB
const kb = await supabase
  .from('knowledge_base')
  .select('*')
  .limit(5);

// 7. Call AI
const aiResponse = await callAI({
  messages,
  kb,
  prompt: 'You are a helpful customer service AI...'
});

// 8. Check Escalation
if (aiResponse.should_escalate) {
  // Execute WF02
  await executeWorkflow('WF02', { conversation_id: conversation.id });
} else {
  // Insert AI Message
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_type: 'ai',
      content: aiResponse.reply
    });

  // Update Status
  await supabase
    .from('conversations')
    .update({ status: 'ai_handling' })
    .eq('id', conversation.id);
}

// 9. Respond
return {
  conversation_id: conversation.id,
  reply: aiResponse.reply,
  status: aiResponse.should_escalate ? 'escalated' : 'ai_handling'
};
```

---

## Summary

The Grade Z system uses n8n as the "brain" for customer interactions and AI processing, while the frontend serves as a clean agent dashboard. All communication happens through Supabase, ensuring security, scalability, and real-time synchronization.

**Key Points:**
- Frontend never calls n8n directly
- n8n uses service role key
- Frontend uses anon key + RLS
- Real-time updates via Supabase
- Clear separation of concerns
