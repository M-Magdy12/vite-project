# Grade Z - Deployment & Testing Guide

## Pre-Deployment Checklist

### 1. Supabase Setup

✅ **Database Schema**
- [ ] Run `supabase-logic.md` SQL in Supabase SQL Editor
- [ ] Verify all tables created: conversations, messages, tickets, knowledge_base, profiles
- [ ] Verify all enums created: conversation_status, message_sender, ticket_status
- [ ] Verify all indexes created
- [ ] Verify all triggers created
- [ ] Verify all RLS policies enabled

✅ **Realtime**
- [ ] Enable Realtime in Supabase Dashboard
- [ ] Enable Realtime for tables: conversations, messages

✅ **Authentication** (if using)
- [ ] Configure auth providers
- [ ] Test user signup/login
- [ ] Verify profile creation trigger

✅ **API Keys**
- [ ] Copy Supabase URL
- [ ] Copy Supabase Anon Key
- [ ] Keep Service Role Key secure (n8n only)

---

### 2. n8n Setup

✅ **Workflows**
- [ ] Create WF01: Chat Inbound
- [ ] Create WF02: Escalation
- [ ] (Optional) Create WF03: Agent Assist
- [ ] Test each workflow individually

✅ **Credentials**
- [ ] Add Supabase credentials (service role)
- [ ] Test Supabase connection
- [ ] Configure AI/LLM credentials

✅ **Webhooks**
- [ ] Note WF01 webhook URL
- [ ] Test webhook with curl
- [ ] Verify responses

---

### 3. Frontend Setup

✅ **Environment Variables**
```bash
# .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

✅ **Dependencies**
```bash
npm install
```

✅ **Build Test**
```bash
npm run build
```

---

## Local Testing

### Test 1: Basic Connectivity

**Start Dev Server:**
```bash
npm run dev
```

**Expected:**
- App loads at http://localhost:5173
- No console errors
- Empty state shows "No active conversations"

**If Fails:**
- Check .env file exists
- Verify Supabase credentials
- Check browser console

---

### Test 2: Database Connection

**Manual Test:**
1. Open Supabase Table Editor
2. Manually insert a conversation:
```sql
INSERT INTO conversations (status) VALUES ('escalated');
```
3. Check if conversation appears in dashboard

**Expected:**
- Conversation appears in sidebar
- Status badge shows "escalated"
- Timestamp displays correctly

**If Fails:**
- Check RLS policies
- Verify agent authentication
- Check browser network tab

---

### Test 3: n8n Integration

**Send Test Message:**
```bash
curl -X POST https://your-n8n-instance.com/webhook/chat/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_001",
    "message": "Hello, I need help"
  }'
```

**Expected:**
1. n8n creates conversation
2. n8n inserts customer message
3. n8n calls AI
4. n8n inserts AI response
5. Conversation appears in dashboard
6. Messages visible when conversation selected

**If Fails:**
- Check n8n workflow logs
- Verify Supabase credentials in n8n
- Check n8n webhook URL
- Review n8n error messages

---

### Test 4: Agent Actions

**Takeover Test:**
1. Select escalated conversation
2. Click "Take Over" button
3. Verify status changes to "human_handling"
4. Verify ticket status changes to "assigned"

**Message Test:**
1. Type message in input
2. Click "Send"
3. Verify message appears instantly
4. Verify message saved to database

**Resolve Test:**
1. Click "Resolve" button
2. Verify ticket status changes to "resolved"
3. Verify "Close" button appears

**Close Test:**
1. Click "Close" button
2. Verify conversation disappears from sidebar
3. Verify conversation status is "closed" in database

---

### Test 5: Real-Time Sync

**Setup:**
1. Open dashboard in two browser windows
2. Select same conversation in both

**Test:**
1. Send message from Window 1
2. Verify message appears in Window 2 instantly

**Expected:**
- Real-time message sync
- No page refresh needed
- Both windows stay in sync

**If Fails:**
- Check Supabase Realtime enabled
- Check WebSocket connection
- Review browser console

---

## Production Deployment

### Option 1: Vercel (Recommended)

**Steps:**
1. Push code to GitHub
2. Go to vercel.com
3. Click "New Project"
4. Import your repository
5. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click "Deploy"

**Post-Deployment:**
- Test production URL
- Verify environment variables loaded
- Check browser console for errors
- Test all workflows

---

### Option 2: Netlify

**Steps:**
1. Push code to GitHub
2. Go to netlify.com
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add Environment Variables in Site Settings
7. Click "Deploy site"

**Post-Deployment:**
- Same testing as Vercel

---

### Option 3: AWS Amplify

**Steps:**
1. Push code to GitHub
2. Go to AWS Amplify Console
3. Click "New app" → "Host web app"
4. Connect repository
5. Configure build settings:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```
6. Add environment variables
7. Deploy

---

## Post-Deployment Testing

### Smoke Tests

**Test 1: Load Test**
- [ ] Open production URL
- [ ] Verify app loads
- [ ] Check console for errors
- [ ] Verify no 404s in network tab

**Test 2: Database Test**
- [ ] Manually create conversation in Supabase
- [ ] Verify appears in production dashboard
- [ ] Delete test conversation

**Test 3: n8n Integration Test**
- [ ] Send test message via n8n webhook
- [ ] Verify conversation created
- [ ] Verify messages appear
- [ ] Verify AI response

**Test 4: Full Workflow Test**
- [ ] Trigger escalation
- [ ] Take over conversation
- [ ] Send agent message
- [ ] Resolve ticket
- [ ] Close conversation

**Test 5: Real-Time Test**
- [ ] Open in two browsers
- [ ] Verify real-time sync works
- [ ] Test message delivery

---

## Monitoring & Maintenance

### Daily Checks

**Supabase Dashboard:**
- Check error logs
- Monitor API usage
- Review slow queries

**n8n Dashboard:**
- Check workflow executions
- Review failed workflows
- Monitor webhook calls

**Frontend:**
- Check error tracking (if configured)
- Monitor user sessions
- Review performance metrics

---

### Weekly Tasks

- [ ] Review Supabase logs
- [ ] Check n8n workflow performance
- [ ] Test critical user flows
- [ ] Update dependencies (if needed)

---

### Monthly Tasks

- [ ] Update npm dependencies
- [ ] Review and optimize database queries
- [ ] Check for security updates
- [ ] Backup database
- [ ] Review RLS policies

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Cause:** .env file not loaded or variables not set

**Solution:**
1. Verify .env file exists
2. Check variable names match exactly
3. Restart dev server
4. For production, check deployment platform env vars

---

### Issue: "No conversations appearing"

**Cause:** RLS policies blocking access or no data

**Solution:**
1. Check Supabase table browser
2. Verify conversations exist
3. Check RLS policies
4. Test with service role key in Supabase SQL editor
5. Verify agent authentication

---

### Issue: "Messages not syncing in real-time"

**Cause:** Realtime not enabled or subscription failed

**Solution:**
1. Enable Realtime in Supabase Dashboard
2. Check browser console for WebSocket errors
3. Verify subscription code
4. Test with manual insert
5. Check Supabase Realtime logs

---

### Issue: "Cannot send messages"

**Cause:** RLS policy blocking or authentication issue

**Solution:**
1. Check browser console
2. Verify agent authenticated
3. Test RLS policy manually
4. Check Supabase logs
5. Verify conversation_id is valid

---

### Issue: "n8n webhook not working"

**Cause:** Webhook URL wrong or n8n workflow not active

**Solution:**
1. Verify webhook URL
2. Check n8n workflow is active
3. Test with curl
4. Review n8n logs
5. Check n8n credentials

---

## Performance Optimization

### Current Performance

**Metrics:**
- Initial load: < 2s
- Time to interactive: < 3s
- Real-time latency: < 500ms
- Message send: < 1s

### Future Optimizations

**Code Splitting:**
```javascript
const ChatPanel = lazy(() => import('./components/ChatPanel/ChatPanel'));
```

**Memoization:**
```javascript
const memoizedConversations = useMemo(
  () => conversations.filter(c => c.status !== 'closed'),
  [conversations]
);
```

**Virtual Scrolling:**
- For conversations list (if > 100 items)
- For message list (if > 500 messages)

---

## Security Checklist

### Pre-Production

- [ ] Never commit .env file
- [ ] Use anon key in frontend (not service role)
- [ ] Enable RLS on all tables
- [ ] Test RLS policies thoroughly
- [ ] Use HTTPS only
- [ ] Configure CORS properly
- [ ] Validate all user inputs
- [ ] Sanitize message content

### Post-Production

- [ ] Monitor for suspicious activity
- [ ] Review access logs regularly
- [ ] Rotate keys if compromised
- [ ] Keep dependencies updated
- [ ] Enable rate limiting (if needed)

---

## Rollback Plan

### If Deployment Fails

**Vercel/Netlify:**
1. Go to deployment dashboard
2. Find previous successful deployment
3. Click "Rollback" or "Promote to production"

**Manual Rollback:**
1. Revert git commit
2. Push to main branch
3. Redeploy

### If Database Migration Fails

1. Restore from Supabase backup
2. Review migration script
3. Test in development first
4. Re-run migration

---

## Success Criteria

### MVP Launch Ready When:

- [ ] All smoke tests pass
- [ ] n8n integration working
- [ ] Real-time sync working
- [ ] Agent can complete full workflow
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security checklist complete
- [ ] Documentation complete
- [ ] Team trained on system

---

## Support & Resources

### Documentation
- README.md - Project overview
- ARCHITECTURE.md - System architecture
- N8N_INTEGRATION.md - n8n integration
- SYSTEM_WORKFLOW.md - Workflow details
- PROJECT_STRUCTURE.md - Code structure

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [n8n Docs](https://docs.n8n.io)
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)

### Getting Help
1. Check documentation first
2. Review browser console
3. Check Supabase logs
4. Review n8n workflow logs
5. Test in isolation
6. Ask team for help

---

## Conclusion

This deployment guide covers everything needed to get Grade Z from development to production. Follow the checklists, run all tests, and monitor the system after deployment. The architecture is designed to be reliable, scalable, and maintainable.

Good luck with your deployment! 🚀
