# Grade Z - System Workflow Documentation

## Overview

This document describes the complete workflow of the Grade Z customer support platform, from initial customer contact through resolution and closure.

## Conversation Lifecycle

### 1. Conversation Initiation

**Trigger:** Customer initiates contact through the platform

**Process:**
- New conversation record created in database
- Initial status: `open`
- Unique UUID assigned
- Timestamps recorded (created_at, updated_at)

**Database Action:**
```sql
INSERT INTO conversations (status) VALUES ('open');
```

---

### 2. AI Handling Phase

**Trigger:** System detects new open conversation

**Process:**
- Conversation status updated to `ai_handling`
- AI agent analyzes customer inquiry
- AI attempts to resolve using knowledge base
- Messages exchanged between customer and AI

**Status:** `ai_handling`

**Message Flow:**
- Customer sends message (sender_type: 'customer')
- AI responds (sender_type: 'ai')
- All messages linked to conversation_id

**Example Scenario:**
```
Customer: "How do I reset my password?"
AI: "I can help you with that. Please click on 'Forgot Password' 
     on the login page and follow the instructions sent to your email."
```

---

### 3. Escalation Decision Point

**Condition A: AI Successfully Resolves**
- Conversation marked as resolved
- Status changed to `closed`
- Ticket not created
- Workflow ends

**Condition B: AI Cannot Resolve**
- AI detects complexity or customer dissatisfaction
- Conversation status updated to `escalated`
- Ticket automatically created
- Human agent notified

**Escalation Triggers:**
- Customer explicitly requests human agent
- AI confidence score below threshold
- Multiple failed resolution attempts
- Sensitive topics detected (billing, legal, complaints)

---

### 4. Human Agent Assignment

**Trigger:** Conversation status = `escalated`

**Process:**
1. Ticket created and linked to conversation
2. Ticket status: `open`
3. Agent sees conversation in sidebar (filtered by status)
4. Agent reviews conversation history
5. Agent clicks on conversation to view details

**Database Actions:**
```sql
UPDATE conversations SET status = 'escalated' WHERE id = [conversation_id];
INSERT INTO tickets (conversation_id, status) VALUES ([conversation_id], 'open');
```

**Agent Dashboard View:**
- Conversation appears in sidebar with "escalated" badge
- Shows conversation ID (first 8 characters)
- Displays last update timestamp
- Color-coded status indicator (orange for escalated)

---

### 5. Active Human Handling

**Trigger:** Agent selects escalated conversation

**Process:**
1. Conversation status updated to `human_handling`
2. Ticket status updated to `assigned`
3. Agent reviews full message history
4. Agent communicates directly with customer
5. Real-time message synchronization active

**Status:** `human_handling`

**Message Flow:**
- Agent sends message (sender_type: 'agent')
- Customer responds (sender_type: 'customer')
- All participants see updates in real-time via Supabase Realtime

**UI Features:**
- Message bubbles color-coded by sender
- Auto-scroll to latest message
- Timestamp on each message
- Status badge shows "human handling"

**Example Interaction:**
```
Agent: "Hi! I've reviewed your case. I can see you're having 
       trouble with password reset. Let me help you directly."
Customer: "Yes, I'm not receiving the reset email."
Agent: "I'll manually send you a reset link to your registered 
       email. Please check your spam folder as well."
```

---

### 6. Resolution Phase

**Trigger:** Agent resolves customer issue

**Process:**
1. Agent confirms resolution with customer
2. Ticket status updated to `resolved`
3. Conversation remains in `human_handling` for final confirmation

**Database Action:**
```sql
UPDATE tickets SET status = 'resolved' WHERE conversation_id = [conversation_id];
```

**Agent Actions:**
- May add notes to knowledge base for future reference
- Documents resolution for training purposes
- Ensures customer satisfaction before closing

---

### 7. Conversation Closure

**Trigger:** Customer confirms satisfaction OR timeout period expires

**Process:**
1. Conversation status updated to `closed`
2. Ticket status updated to `closed`
3. Conversation removed from active list
4. Archived for future reference and analytics

**Database Actions:**
```sql
UPDATE conversations SET status = 'closed' WHERE id = [conversation_id];
UPDATE tickets SET status = 'closed' WHERE conversation_id = [conversation_id];
```

**Post-Closure:**
- Conversation no longer appears in agent sidebar (filtered out)
- Data retained for analytics and compliance
- Can be reopened if customer returns with related issue

---

## Complete Workflow Example

### Scenario: Billing Inquiry

**Step 1: Initial Contact**
```
Time: 10:00 AM
Status: open
Customer: "I was charged twice for my subscription this month."
```

**Step 2: AI Attempts Resolution**
```
Time: 10:00 AM
Status: ai_handling
AI: "I understand you're concerned about duplicate charges. 
     Let me check our billing FAQ..."
AI: "According to our records, you may have seen a pending 
     authorization and the actual charge. Can you confirm 
     if both charges have been finalized?"
Customer: "Yes, both charges went through. This is not right."
```

**Step 3: Escalation**
```
Time: 10:02 AM
Status: escalated
System: Ticket #abc123 created
AI: "I understand this is frustrating. Let me connect you 
     with a billing specialist who can review your account."
```

**Step 4: Agent Takes Over**
```
Time: 10:05 AM
Status: human_handling
Ticket Status: assigned
Agent: "Hi, I'm Sarah from the billing team. I've reviewed 
       your account and I can see the duplicate charge. 
       I sincerely apologize for this error."
Customer: "Thank you for looking into this."
```

**Step 5: Resolution**
```
Time: 10:10 AM
Ticket Status: resolved
Agent: "I've processed a full refund for the duplicate charge. 
       You should see it in 3-5 business days. I've also added 
       a credit to your account as an apology. Is there anything 
       else I can help you with?"
Customer: "No, that's perfect. Thank you so much!"
```

**Step 6: Closure**
```
Time: 10:12 AM
Status: closed
Ticket Status: closed
Agent: "You're welcome! Feel free to reach out if you need 
       anything else. Have a great day!"
```

---

## Real-Time Features

### Message Synchronization

**Technology:** Supabase Realtime (PostgreSQL Change Data Capture)

**How It Works:**
1. Agent sends message → Inserted into messages table
2. PostgreSQL trigger fires
3. Supabase broadcasts INSERT event
4. All connected clients receive update instantly
5. UI updates without page refresh

**Code Implementation:**
```javascript
const channel = supabase
  .channel('all-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    // Add new message to UI
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();
```

### Conversation List Updates

**Trigger:** Any message sent in any conversation

**Effect:**
- Conversation list refreshes
- Updated_at timestamp changes
- Conversation moves to top of list
- Unread indicators update (future feature)

---

## Status Transition Rules

### Valid Transitions

```
open → ai_handling → escalated → human_handling → closed
  ↓                      ↓              ↓
closed                closed         closed
```

### Invalid Transitions (Prevented by Business Logic)

- closed → any other status (conversations cannot be reopened in MVP)
- human_handling → ai_handling (no de-escalation in MVP)
- escalated → open (cannot un-escalate)

---

## Security & Access Control

### Row Level Security (RLS) Policies

**Conversations:**
- Agents can SELECT (read)
- Agents can UPDATE (change status)
- Customers cannot access directly (future: customer portal)

**Messages:**
- Agents can SELECT (read all messages)
- Agents can INSERT (send messages)
- System enforces sender_type validation

**Tickets:**
- Agents have full access (SELECT, INSERT, UPDATE, DELETE)
- Linked to agent profiles via auth system

### Authentication Flow

1. Agent logs in via Supabase Auth
2. Profile created/retrieved from profiles table
3. Role verified (agent or admin)
4. RLS policies enforce access based on role
5. All queries automatically filtered by permissions

---

## Future Enhancements

### Planned Features

1. **Customer Portal**
   - Customers can view their conversation history
   - Self-service knowledge base access
   - Conversation reopening capability

2. **Advanced AI**
   - Sentiment analysis for escalation triggers
   - Automatic categorization
   - Suggested responses for agents

3. **Analytics Dashboard**
   - Average resolution time
   - AI vs Human resolution rates
   - Agent performance metrics
   - Customer satisfaction scores

4. **Multi-Channel Support**
   - Email integration
   - Chat widget for websites
   - Social media integration

5. **Team Features**
   - Agent assignment logic
   - Team-based routing
   - Internal notes and collaboration
   - Shift management

---

## Troubleshooting Common Scenarios

### Scenario: Message Not Appearing

**Possible Causes:**
- Realtime subscription not active
- Network connectivity issue
- RLS policy blocking access

**Solution:**
- Check browser console for errors
- Verify Supabase connection
- Confirm agent authentication status

### Scenario: Cannot Create Conversation

**Possible Causes:**
- Missing environment variables
- Database connection failure
- Insufficient permissions

**Solution:**
- Verify .env file configuration
- Check Supabase project status
- Confirm agent role in profiles table

### Scenario: Status Not Updating

**Possible Causes:**
- RLS policy preventing update
- Invalid status transition
- Database trigger failure

**Solution:**
- Check agent permissions
- Verify status transition is valid
- Review PostgreSQL logs in Supabase

---

## Performance Considerations

### Optimization Strategies

1. **Message Pagination**
   - Load recent messages first
   - Implement infinite scroll for history
   - Cache frequently accessed conversations

2. **Realtime Connection Management**
   - Single channel for all messages
   - Unsubscribe when component unmounts
   - Reconnection logic for network issues

3. **Database Indexing**
   - Index on conversation_id in messages table
   - Index on status in conversations table
   - Index on updated_at for sorting

4. **Query Optimization**
   - Filter closed conversations on client side
   - Limit initial conversation fetch
   - Use select() to fetch only needed fields

---

## Conclusion

The Grade Z system provides a seamless workflow from initial customer contact through AI-assisted resolution and human escalation when needed. The real-time architecture ensures all participants stay synchronized, while the status-based workflow provides clear visibility into conversation progress.
