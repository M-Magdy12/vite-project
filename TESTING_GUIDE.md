# Grade Z - Testing Guide

## Overview

This guide explains how to test the complete Grade Z system, from customer message to agent resolution.

## Architecture Reminder

```
Customer → n8n Webhook → Supabase → Agent Dashboard
```

The Agent Dashboard (your current app) does NOT call n8n. It only reads/writes to Supabase.

## n8n Webhook URL

```
https://zemonze.app.n8n.cloud/webhook-test/ee1a363c-d377-4c79-9465-109bcb8d17e5/chat/inbound
```

**Purpose:** Receives customer messages
**Called by:** Customer-facing app (not built yet) or test scripts
**NOT called by:** Agent Dashboard

## Testing Methods

### Method 1: Using Node.js Script (Recommended)

```bash
# Make sure you have Node.js installed
node test-customer-message.js
```

This will:
1. Send 3 test customer messages to n8n
2. n8n processes them and creates conversations in Supabase
3. Your Agent Dashboard will show them automatically

### Method 2: Using Bash Script

```bash
# Make the script executable
chmod +x test-customer-message.sh

# Run it
./test-customer-message.sh
```

### Method 3: Using curl Directly

```bash
curl -X POST https://zemonze.app.n8n.cloud/webhook-test/ee1a363c-d377-4c79-9465-109bcb8d17e5/chat/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "my_test_session",
    "message": "Hello, I need help!"
  }'
```

### Method 4: Using Postman/Insomnia

**URL:** `https://zemonze.app.n8n.cloud/webhook-test/ee1a363c-d377-4c79-9465-109bcb8d17e5/chat/inbound`
**Method:** POST
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "session_id": "test_session_123",
  "message": "I need help with my account"
}
```

## Complete Test Flow

### Step 1: Start Agent Dashboard

```bash
npm run dev
```

Open http://localhost:5173 in your browser

### Step 2: Send Test Customer Message

Run one of the test methods above. For example:

```bash
node test-customer-message.js
```

### Step 3: Verify in Agent Dashboard

You should see:
1. New conversation appears in sidebar
2. Conversation status shows "ai_handling" or "escalated"
3. Messages from customer and AI are visible

### Step 4: Test Agent Actions

**If status is "escalated":**
1. Click on the conversation
2. Click "Take Over" button
3. Status changes to "human_handling"
4. Type a message and send it
5. Click "Resolve" button
6. Click "Close" button
7. Conversation disappears from sidebar

## Test Scenarios

### Scenario 1: Normal AI Handling

**Customer Message:**
```json
{
  "session_id": "test_001",
  "message": "How do I reset my password?"
}
```

**Expected Flow:**
1. n8n creates conversation (status: open)
2. n8n inserts customer message
3. n8n calls AI
4. AI provides answer
5. n8n inserts AI message
6. n8n updates status to "ai_handling"
7. Agent sees conversation but doesn't need to intervene

### Scenario 2: Escalation to Human

**Customer Message:**
```json
{
  "session_id": "test_002",
  "message": "I want to speak to a human NOW!"
}
```

**Expected Flow:**
1. n8n creates conversation
2. n8n inserts customer message
3. n8n calls AI
4. AI detects escalation trigger
5. n8n creates ticket
6. n8n updates status to "escalated"
7. Agent sees conversation with "Take Over" button
8. Agent takes over and resolves

### Scenario 3: Multiple Messages in Same Session

**First Message:**
```json
{
  "session_id": "test_003",
  "message": "Hello"
}
```

**Second Message (same session):**
```json
{
  "session_id": "test_003",
  "message": "I need help with billing"
}
```

**Expected Flow:**
- n8n should find existing conversation by session_id
- Add messages to same conversation
- Continue AI handling or escalate as needed

## Debugging

### Issue: Conversations Not Appearing

**Check:**
1. Is n8n workflow running?
2. Is Supabase connection working?
3. Check browser console for errors
4. Check Supabase table browser for data

**Debug Steps:**
```bash
# Check if conversation was created
# Go to Supabase Dashboard → Table Editor → conversations
# You should see new rows

# Check if messages were created
# Go to Supabase Dashboard → Table Editor → messages
# You should see customer and AI messages
```

### Issue: Real-time Not Working

**Check:**
1. Is Supabase Realtime enabled?
2. Check browser console for WebSocket errors
3. Try refreshing the page

**Debug Steps:**
```javascript
// Open browser console and check for:
// "WebSocket connection established"
// If you see errors, check Supabase Realtime settings
```

### Issue: Cannot Send Agent Messages

**Check:**
1. Is agent authenticated? (Future: add auth)
2. Check RLS policies in Supabase
3. Check browser console for errors

**Debug Steps:**
```sql
-- In Supabase SQL Editor, test RLS:
SELECT * FROM messages WHERE conversation_id = 'your-conversation-id';

-- If this fails, RLS might be blocking you
-- For testing, you can temporarily disable RLS:
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- (Don't forget to re-enable it later!)
```

## Manual Testing Checklist

### Before Testing
- [ ] Supabase project is set up
- [ ] SQL schema is applied
- [ ] RLS policies are enabled
- [ ] n8n workflow is running
- [ ] Agent Dashboard is running (npm run dev)
- [ ] .env file has correct Supabase credentials

### Test 1: Customer Message Flow
- [ ] Send customer message via webhook
- [ ] Conversation appears in Agent Dashboard
- [ ] Customer message is visible
- [ ] AI message is visible
- [ ] Status is "ai_handling"

### Test 2: Escalation Flow
- [ ] Send escalation trigger message
- [ ] Conversation status changes to "escalated"
- [ ] Ticket is created
- [ ] "Take Over" button appears

### Test 3: Agent Takeover
- [ ] Click "Take Over" button
- [ ] Status changes to "human_handling"
- [ ] Ticket status changes to "assigned"
- [ ] "Resolve" button appears

### Test 4: Agent Messaging
- [ ] Type message in input field
- [ ] Click "Send" button
- [ ] Message appears in chat
- [ ] Message has agent styling (purple gradient)

### Test 5: Resolution
- [ ] Click "Resolve" button
- [ ] Ticket status changes to "resolved"
- [ ] "Close" button appears

### Test 6: Closure
- [ ] Click "Close" button
- [ ] Conversation status changes to "closed"
- [ ] Ticket status changes to "closed"
- [ ] Conversation disappears from sidebar

### Test 7: Real-time Updates
- [ ] Open Agent Dashboard in two browser windows
- [ ] Send customer message
- [ ] Both windows show new conversation
- [ ] Send agent message from one window
- [ ] Other window shows the message instantly

## Performance Testing

### Load Test (Future)

```bash
# Send 100 messages rapidly
for i in {1..100}; do
  curl -X POST https://zemonze.app.n8n.cloud/webhook-test/ee1a363c-d377-4c79-9465-109bcb8d17e5/chat/inbound \
    -H "Content-Type: application/json" \
    -d "{\"session_id\": \"load_test_$i\", \"message\": \"Test message $i\"}"
done
```

**Expected:**
- All messages processed
- Agent Dashboard remains responsive
- No memory leaks
- Real-time updates work correctly

## Security Testing

### Test RLS Policies

```sql
-- In Supabase SQL Editor

-- Test 1: Can anonymous user read conversations?
-- (Should fail if RLS is working)
SELECT * FROM conversations;

-- Test 2: Can agent read conversations?
-- (Should succeed if agent is authenticated)
-- First, authenticate as agent, then:
SELECT * FROM conversations;

-- Test 3: Can agent insert messages?
INSERT INTO messages (conversation_id, sender_type, content)
VALUES ('some-uuid', 'agent', 'Test message');
```

## Monitoring

### What to Monitor

1. **Supabase Dashboard**
   - Table row counts
   - Real-time connections
   - API usage
   - Error logs

2. **n8n Dashboard**
   - Workflow executions
   - Success/failure rate
   - Execution time
   - Error logs

3. **Browser Console**
   - JavaScript errors
   - Network requests
   - WebSocket status
   - Performance metrics

## Next Steps

After testing the basic flow:

1. **Add Authentication**
   - Implement Supabase Auth
   - Add login page
   - Protect routes

2. **Add Customer Portal**
   - Build customer-facing chat widget
   - Integrate with n8n webhook
   - Add session management

3. **Enhance n8n Workflows**
   - Improve AI prompts
   - Add more escalation triggers
   - Implement knowledge base search

4. **Add Analytics**
   - Track resolution time
   - Monitor AI vs human resolution rates
   - Customer satisfaction scores

---

## Quick Reference

**n8n Webhook URL:**
```
https://zemonze.app.n8n.cloud/webhook-test/ee1a363c-d377-4c79-9465-109bcb8d17e5/chat/inbound
```

**Test Command:**
```bash
node test-customer-message.js
```

**Agent Dashboard:**
```
http://localhost:5173
```

**Supabase Dashboard:**
```
https://supabase.com/dashboard/project/herqvmuhdsjhmpxlixxu
```

---

Happy testing! 🚀
