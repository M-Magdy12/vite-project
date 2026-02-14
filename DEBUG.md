# Debug Guide - Messages Not Showing

## Quick Checks

### 1. Check if messages exist in Supabase

Go to: https://supabase.com/dashboard/project/herqvmuhdsjhmpxlixxu/editor

**Check conversations table:**
- Do you see any rows?
- What are their statuses?
- Copy a conversation ID

**Check messages table:**
- Do you see any rows?
- What are the sender_types? (should be 'customer', 'ai', or 'agent')
- Do they have conversation_id values?

### 2. Check browser console

Open Developer Tools (F12) and look for:
- Any red errors?
- Network tab: Are Supabase requests succeeding?
- Console tab: Any error messages?

### 3. Check RLS Policies

If you see "No messages" but messages exist in Supabase:

**Option A: Temporarily disable RLS for testing**
```sql
-- In Supabase SQL Editor
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
```

**Option B: Check if agent authentication is needed**
The current setup assumes agents can read without authentication.
If RLS is blocking, you need to either:
1. Disable RLS for testing (Option A above)
2. Implement proper authentication

### 4. Manual Test

**In Supabase SQL Editor, run:**
```sql
-- Check conversations
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 5;

-- Check messages
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- Check if messages are linked to conversations
SELECT 
  c.id as conversation_id,
  c.status,
  m.sender_type,
  m.content,
  m.created_at
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
ORDER BY m.created_at DESC
LIMIT 20;
```

## Common Issues

### Issue 1: "No messages yet" but messages exist

**Cause:** RLS policies blocking access

**Solution:**
```sql
-- Temporarily disable RLS
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
```

### Issue 2: Conversations not appearing

**Cause:** n8n not creating conversations

**Solution:**
1. Check n8n workflow is running
2. Test webhook manually:
```bash
node test-customer-message.js
```
3. Check n8n execution logs

### Issue 3: Real-time not working

**Cause:** Supabase Realtime not enabled

**Solution:**
1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for: conversations, messages, tickets
3. Refresh your app

### Issue 4: Messages showing but styling is wrong

**Cause:** CSS not loading

**Solution:**
1. Check browser console for CSS errors
2. Verify all CSS files exist
3. Hard refresh (Ctrl+Shift+R)

## Test Data

If you want to manually insert test data:

```sql
-- Insert test conversation
INSERT INTO conversations (id, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'escalated');

-- Insert customer message
INSERT INTO messages (conversation_id, sender_type, content)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'customer',
  'Hello, I need help!'
);

-- Insert AI message
INSERT INTO messages (conversation_id, sender_type, content)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ai',
  'Hi! How can I assist you today?'
);

-- Insert agent message
INSERT INTO messages (conversation_id, sender_type, content)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'agent',
  'I am here to help you with your issue.'
);

-- Insert ticket
INSERT INTO tickets (conversation_id, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'open');
```

After running this, refresh your Agent Dashboard and you should see:
- 1 conversation in the sidebar
- 3 messages when you click on it (customer, AI, agent)

## Verification Checklist

- [ ] Supabase URL and key are correct in .env
- [ ] npm run dev is running without errors
- [ ] Browser console shows no errors
- [ ] Supabase tables have data
- [ ] RLS is disabled for testing (or proper auth is implemented)
- [ ] Realtime is enabled in Supabase
- [ ] n8n workflow is running

## Still Not Working?

1. **Check the browser console** - Copy any error messages
2. **Check Supabase logs** - Go to Supabase Dashboard → Logs
3. **Check network tab** - Are requests to Supabase failing?
4. **Try the manual test data** - Insert test data directly in Supabase

## Contact Points

If you're still stuck, check:
1. Browser console errors
2. Supabase API logs
3. n8n execution logs
4. Network tab in DevTools
