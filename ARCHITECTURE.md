# Grade Z - Frontend Architecture

## Overview

This document describes the frontend architecture for the Grade Z Agent Dashboard, following the n8n-based workflow system.

## Architecture Principles

### Separation of Concerns

The application follows a clean architecture with clear separation:

```
src/
├── components/          # UI Components (presentational)
├── hooks/              # Custom React hooks (state management)
├── services/           # Business logic & API calls
├── config/             # Configuration files
└── App.jsx             # Main application orchestrator
```

### Data Flow

```
n8n Webhook → Supabase → Agent Dashboard
     ↓
Customer Message → AI Processing → Escalation (if needed)
                                         ↓
                                    Agent Takes Over
                                         ↓
                                    Resolution → Closure
```

## Component Structure

### 1. Components (Presentational)

**Sidebar** (`components/Sidebar/`)
- Displays list of active conversations
- Shows conversation status and metadata
- Handles conversation selection

**ChatPanel** (`components/ChatPanel/`)
- Main container for chat interface
- Orchestrates ChatHeader, MessageList, and MessageInput

**ChatHeader** (`components/ChatHeader/`)
- Shows conversation and ticket status
- Provides action buttons (Takeover, Resolve, Close)
- Conditional rendering based on workflow state

**MessageList** (`components/MessageList/`)
- Renders messages with proper styling per sender type
- Auto-scrolls to latest message
- Shows loading and empty states

**MessageInput** (`components/MessageInput/`)
- Text input for agent messages
- Disabled when conversation is closed
- Form submission handling

### 2. Hooks (State Management)

**useConversations**
- Fetches all non-closed conversations
- Subscribes to real-time conversation updates
- Provides refetch capability

**useMessages**
- Fetches messages for selected conversation
- Subscribes to real-time message inserts
- Filters by conversation_id

**useTicket**
- Fetches ticket associated with conversation
- Provides ticket status information

### 3. Services (Business Logic)

**conversationService**
- `fetchConversations()` - Get all active conversations
- `updateConversationStatus()` - Update conversation state
- `takeoverConversation()` - Change status to 'human_handling'
- `closeConversation()` - Change status to 'closed'

**messageService**
- `fetchMessages()` - Get messages for conversation
- `sendMessage()` - Insert agent message

**ticketService**
- `fetchTicketByConversation()` - Get ticket for conversation
- `updateTicketStatus()` - Update ticket state
- `resolveTicket()` - Mark ticket as resolved
- `closeTicket()` - Mark ticket as closed

## Workflow States

### Conversation Status Flow

```
open → ai_handling → escalated → human_handling → closed
  ↓                      ↓              ↓
closed                closed         closed
```

### Agent Actions by Status

**escalated**
- Action: "Take Over" button visible
- Effect: Status → human_handling, Ticket → assigned

**human_handling**
- Action: "Resolve" button visible (if ticket not resolved)
- Effect: Ticket → resolved

**human_handling + ticket resolved**
- Action: "Close" button visible
- Effect: Conversation → closed, Ticket → closed

## Real-Time Synchronization

### Supabase Realtime Channels

**Conversations Channel**
```javascript
supabase.channel('conversations-changes')
  .on('postgres_changes', { table: 'conversations' })
  .subscribe()
```
- Triggers: Any conversation INSERT/UPDATE/DELETE
- Effect: Refetch conversation list

**Messages Channel**
```javascript
supabase.channel(`messages-${conversationId}`)
  .on('postgres_changes', { 
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  })
  .subscribe()
```
- Triggers: New message INSERT for current conversation
- Effect: Append message to UI instantly

## Security

### Row Level Security (RLS)

All database access goes through Supabase RLS policies:

- Agent must be authenticated via Supabase Auth
- `is_agent()` function validates role
- Only agents/admins can read/write conversations, messages, tickets

### Environment Variables

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

⚠️ Never use SERVICE_ROLE_KEY in frontend (n8n only)

## Integration Points

### n8n Webhooks (Not Used by Frontend)

The frontend does NOT call n8n directly. n8n handles:
- Customer message ingestion
- AI processing
- Escalation logic
- Ticket creation

### Frontend Responsibilities

The agent dashboard ONLY:
- Reads conversations/messages/tickets from Supabase
- Sends agent messages to Supabase
- Updates conversation and ticket status
- Provides UI for agent workflow

## Error Handling

### Service Layer
```javascript
try {
  const data = await service.method();
  return data;
} catch (error) {
  console.error('Error:', error);
  throw error; // Propagate to component
}
```

### Component Layer
```javascript
try {
  await handleAction();
} catch (error) {
  console.error('Error:', error);
  alert('User-friendly error message');
}
```

## Performance Optimizations

### Database Indexes
- `idx_messages_conversation_id_created_at` - Fast message queries
- `idx_conversations_status_updated_at` - Fast conversation filtering
- `idx_tickets_conversation_id` - Fast ticket lookups

### React Optimizations
- Conditional subscriptions (only for selected conversation)
- Cleanup on unmount
- Memoization where appropriate (future enhancement)

## Testing Strategy

### Unit Tests (Future)
- Service functions
- Custom hooks
- Utility functions

### Integration Tests (Future)
- Component interactions
- Real-time subscription behavior
- Workflow state transitions

### Manual Testing Checklist
1. Agent can see escalated conversations
2. Agent can take over conversation
3. Agent can send messages
4. Messages appear in real-time
5. Agent can resolve ticket
6. Agent can close conversation
7. Closed conversations disappear from list

## Future Enhancements

### Phase 2
- Agent authentication UI
- Multiple agent support
- Agent assignment logic
- Internal notes

### Phase 3
- Conversation search and filters
- Analytics dashboard
- Customer satisfaction ratings
- Knowledge base integration

### Phase 4
- Multi-language support
- Voice/video integration
- Advanced AI suggestions
- Team collaboration features

## Development Guidelines

### Adding a New Feature

1. Create service function in `services/`
2. Create custom hook in `hooks/` if needed
3. Create/update component in `components/`
4. Update App.jsx to wire everything together
5. Add CSS in component folder
6. Test manually
7. Update this documentation

### Code Style

- Use functional components
- Use hooks for state management
- Keep components small and focused
- Extract reusable logic to hooks
- Extract API calls to services
- Use async/await for promises
- Handle errors gracefully

### File Naming

- Components: PascalCase (e.g., `ChatPanel.jsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useMessages.js`)
- Services: camelCase with 'Service' suffix (e.g., `messageService.js`)
- CSS: Match component name (e.g., `ChatPanel.css`)

## Troubleshooting

### Messages Not Appearing
- Check Supabase connection
- Verify RLS policies
- Check browser console for errors
- Confirm agent is authenticated

### Real-time Not Working
- Check Supabase Realtime is enabled
- Verify channel subscription
- Check network tab for WebSocket connection
- Ensure cleanup on unmount

### Cannot Send Messages
- Verify agent authentication
- Check RLS policies
- Confirm conversation_id is valid
- Check Supabase logs

## Deployment

### Build
```bash
npm run build
```

### Environment Variables
Set in deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Hosting Options
- Vercel (recommended)
- Netlify
- AWS Amplify
- Any static hosting

---

## Summary

The Grade Z frontend is a clean, maintainable React application that serves as an agent dashboard for managing customer conversations. It integrates seamlessly with n8n workflows and Supabase backend, providing real-time updates and a smooth user experience for support agents.
