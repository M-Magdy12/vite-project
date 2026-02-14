# Grade Z - Project Structure

## Directory Overview

```
vite-project/
├── public/                      # Static assets
│   └── vite.svg                # Vite logo
│
├── src/                        # Source code
│   ├── components/             # React components
│   │   ├── ChatHeader/
│   │   │   ├── ChatHeader.jsx
│   │   │   └── ChatHeader.css
│   │   ├── ChatPanel/
│   │   │   ├── ChatPanel.jsx
│   │   │   └── ChatPanel.css
│   │   ├── MessageInput/
│   │   │   ├── MessageInput.jsx
│   │   │   └── MessageInput.css
│   │   ├── MessageList/
│   │   │   ├── MessageList.jsx
│   │   │   └── MessageList.css
│   │   └── Sidebar/
│   │       ├── Sidebar.jsx
│   │       └── Sidebar.css
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useConversations.js
│   │   ├── useMessages.js
│   │   └── useTicket.js
│   │
│   ├── services/               # Business logic & API
│   │   ├── conversationService.js
│   │   ├── messageService.js
│   │   └── ticketService.js
│   │
│   ├── config/                 # Configuration
│   │   └── supabase.js
│   │
│   ├── App.jsx                 # Main app component
│   ├── App.css                 # Global app styles
│   ├── main.jsx                # React entry point
│   └── index.css               # Global CSS reset
│
├── node_modules/               # Dependencies (gitignored)
│
├── .env                        # Environment variables (gitignored)
├── .gitignore                  # Git ignore rules
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML template
├── package.json                # Project dependencies
├── package-lock.json           # Locked dependencies
├── vite.config.js              # Vite configuration
│
├── README.md                   # Project overview
├── ARCHITECTURE.md             # Architecture documentation
├── N8N_INTEGRATION.md          # n8n integration guide
├── SYSTEM_WORKFLOW.md          # System workflow documentation
├── PROJECT_STRUCTURE.md        # This file
├── SQL.txt                     # Original SQL schema
├── supabase-logic.md           # Supabase schema with RLS
└── workflow-logic.md           # n8n workflow documentation
```

## Component Hierarchy

```
App
├── Sidebar
│   └── ConversationItem (multiple)
│
└── ChatPanel
    ├── ChatHeader
    │   └── ActionButtons (conditional)
    ├── MessageList
    │   └── Message (multiple)
    │       ├── MessageAvatar
    │       └── MessageBubble
    └── MessageInput
        └── SendButton
```

## Data Flow

```
User Action → Component → Hook → Service → Supabase
                                              ↓
                                    Real-time Update
                                              ↓
                                    Hook (subscription)
                                              ↓
                                    Component Re-render
```

## File Responsibilities

### Components

**Sidebar**
- Purpose: Display conversation list
- Props: conversations, selectedId, onSelect
- State: None (stateless)
- Styling: Sidebar.css

**ChatPanel**
- Purpose: Main chat interface container
- Props: conversation, messages, ticket, handlers
- State: messageInput (local)
- Children: ChatHeader, MessageList, MessageInput

**ChatHeader**
- Purpose: Show status and action buttons
- Props: conversation, ticket, handlers
- Logic: Conditional button rendering
- Styling: ChatHeader.css

**MessageList**
- Purpose: Render message history
- Props: messages, loading, messagesEndRef
- Features: Auto-scroll, loading states
- Styling: MessageList.css

**MessageInput**
- Purpose: Text input for agent
- Props: value, onChange, onSubmit, disabled
- Features: Form handling, disabled state
- Styling: MessageInput.css

### Hooks

**useConversations**
- Purpose: Manage conversation list state
- Returns: { conversations, loading, error, refetch }
- Side Effects: Supabase subscription
- Cleanup: Unsubscribe on unmount

**useMessages**
- Purpose: Manage messages for conversation
- Params: conversationId
- Returns: { messages, loading, error, refetch }
- Side Effects: Supabase subscription (filtered)
- Cleanup: Unsubscribe on unmount

**useTicket**
- Purpose: Fetch ticket for conversation
- Params: conversationId
- Returns: { ticket, loading, refetch }
- Side Effects: Fetch on conversationId change

### Services

**conversationService**
- Purpose: Conversation CRUD operations
- Methods:
  - fetchConversations()
  - updateConversationStatus(id, status)
  - takeoverConversation(id)
  - closeConversation(id)

**messageService**
- Purpose: Message operations
- Methods:
  - fetchMessages(conversationId)
  - sendMessage(conversationId, content)

**ticketService**
- Purpose: Ticket operations
- Methods:
  - fetchTicketByConversation(conversationId)
  - updateTicketStatus(id, status)
  - resolveTicket(id)
  - closeTicket(id)

### Configuration

**supabase.js**
- Purpose: Supabase client initialization
- Exports: supabase client instance
- Validation: Checks for required env vars

## Styling Architecture

### Global Styles

**index.css**
- CSS reset
- Root variables
- Base typography
- Default link styles

**App.css**
- App container layout
- Loading state
- Global utilities

### Component Styles

Each component has its own CSS file:
- Scoped to component
- BEM-like naming
- Responsive design
- Dark theme colors

### Color Palette

```css
/* Background */
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--bg-tertiary: #1a1a1a;

/* Borders */
--border-primary: #222222;
--border-secondary: #333333;

/* Text */
--text-primary: #e0e0e0;
--text-secondary: #888888;
--text-tertiary: #666666;

/* Status Colors */
--status-open: #4ade80;
--status-ai: #60a5fa;
--status-escalated: #fb923c;
--status-human: #f87171;
--status-closed: #888888;

/* Gradients */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-customer: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--gradient-ai: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

## State Management

### Local State (useState)
- Component-specific UI state
- Form inputs
- Loading indicators

### Custom Hooks (useEffect + useState)
- Data fetching
- Real-time subscriptions
- Derived state

### No Global State Library
- Simple app, no Redux/Zustand needed
- Props drilling is minimal
- Hooks provide sufficient abstraction

## Build & Development

### Development
```bash
npm run dev
# Runs on http://localhost:5173
```

### Build
```bash
npm run build
# Output: dist/
```

### Preview
```bash
npm run preview
# Preview production build
```

### Lint
```bash
npm run lint
# Run ESLint
```

## Environment Variables

### Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Optional
- None for MVP

### Security
- Never commit .env file
- Use .env.example for templates
- Validate env vars on app start

## Dependencies

### Production
- `react` - UI library
- `react-dom` - React DOM renderer
- `@supabase/supabase-js` - Supabase client

### Development
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin for Vite
- `eslint` - Code linting
- `eslint-plugin-react-hooks` - React hooks linting
- `eslint-plugin-react-refresh` - React refresh linting

## Git Workflow

### Ignored Files
- `node_modules/`
- `dist/`
- `.env`
- `.env.local`
- `*.log`

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches

### Commit Convention
```
feat: Add ticket resolution feature
fix: Fix message scroll behavior
docs: Update architecture documentation
style: Improve button hover effects
refactor: Extract message service
test: Add conversation service tests
```

## Testing Strategy

### Manual Testing
- Smoke tests for each workflow
- Cross-browser testing
- Responsive design testing

### Automated Testing (Future)
- Unit tests for services
- Integration tests for hooks
- E2E tests for workflows

## Performance Considerations

### Optimizations
- Lazy loading (future)
- Memoization (future)
- Virtual scrolling for long message lists (future)
- Debounced search (future)

### Current Performance
- Fast initial load
- Real-time updates without polling
- Efficient Supabase queries with indexes

## Accessibility

### Current
- Semantic HTML
- Keyboard navigation
- Focus states

### Future Improvements
- ARIA labels
- Screen reader testing
- Keyboard shortcuts
- High contrast mode

## Browser Support

### Supported
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Not Supported
- IE11
- Old mobile browsers

## Deployment

### Recommended Platforms
1. Vercel (easiest)
2. Netlify
3. AWS Amplify
4. Cloudflare Pages

### Deployment Steps
1. Set environment variables
2. Run build command: `npm run build`
3. Deploy `dist/` folder
4. Configure custom domain (optional)

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review Supabase logs
- Monitor error rates
- Check performance metrics

### Security Updates
- Update Supabase client
- Review RLS policies
- Rotate API keys if compromised

---

## Quick Reference

### Add New Component
1. Create folder in `src/components/`
2. Create `ComponentName.jsx`
3. Create `ComponentName.css`
4. Export from component file
5. Import in parent component

### Add New Service
1. Create file in `src/services/`
2. Export service object with methods
3. Import in hook or component
4. Handle errors appropriately

### Add New Hook
1. Create file in `src/hooks/`
2. Use `use` prefix
3. Return object with state and methods
4. Handle cleanup in useEffect

### Debug Real-time Issues
1. Check browser console
2. Verify Supabase Realtime enabled
3. Check WebSocket connection
4. Review subscription code
5. Test with manual DB insert

---

This structure provides a clean, maintainable codebase that follows React best practices and integrates seamlessly with the n8n workflow system.
