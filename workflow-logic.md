Absolutely — here is the **same message fully in English**, clean and ready to paste into your Docs / Notion.

---

## Confirmed Architecture (Phase 1 — MVP)

You want **n8n** to be the “system brain” because it will:

* Log customer + AI messages
* Decide escalation
* Create tickets
* Enable the agent to view, take over, reply, and close

You already have:

* Supabase schema + RLS
* A simple frontend for conversations

Now here is a **detailed n8n execution plan** to complete the “Agent Flow” end-to-end.

### Chosen MVP Option (Clear + Safe)

* **Customer** → n8n (Webhook)
* **Agent dashboard** → Supabase directly (read/write via RLS)
* **n8n** → Supabase (service role) + AI + ticket logic

---

# Phase 1 — n8n Steps (Detailed, Practical)

## 0) Before n8n: Prepare Your Keys

From Supabase → **Settings → API**

You will need:

* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY` ✅ (n8n only)
* `SUPABASE_ANON_KEY` (frontend agent login only)

⚠️ Never expose the service role key to the frontend.

---

## 1) In n8n: Create Supabase Credentials

Go to:
**n8n → Credentials → New → Supabase**

Set:

* URL = `SUPABASE_URL`
* Key = `SUPABASE_SERVICE_ROLE_KEY`

Name it:
`supabase_service_role`

✅ Now any Supabase node in n8n can access your tables.

---

## 2) Workflow #1 (Core): Inbound Customer Message

Workflow name:
**WF01 - Chat Inbound**

### Node-by-node (in order)

#### (A) Webhook Trigger

**Webhook**: `POST /chat/inbound`

Frontend sends:

```json
{
  "session_id": "sess_123",
  "message": "Hello I need help"
}
```

---

#### (B) Validate Input (Function / IF)

Validate:

* `session_id` exists
* `message` is not empty

If invalid → return an error response.

---

#### (C) Find or Create Conversation

MVP decision:

**Fast MVP approach:** create a new conversation every time (for the first version).
Later you can add a `sessions` table for proper session mapping.

**Supabase → Create Row (conversations)**

```json
{ "status": "open" }
```

---

#### (D) Insert Customer Message

**Supabase → Create Row (messages)**

```json
{
  "conversation_id": "{{ $json.conversation_id }}",
  "sender_type": "customer",
  "content": "{{ $json.message }}"
}
```

---

#### (E) Load Recent Context

**Supabase → Get Many Rows (messages)**

* Filter: `conversation_id = {id}`
* Sort: `created_at desc`
* Limit: `20`

---

#### (F) Knowledge Base Retrieval (MVP)

**Supabase → Get Many Rows (knowledge_base)**

Simple MVP options:

* Load a general category (e.g. `general`)
* Or do a basic keyword match in n8n

For MVP, keep it simple:

* Fetch top 5 KB entries

---

#### (G) AI Call (LLM Node)

Build the prompt using:

* System rules
* Last 20 messages (short summary or raw)
* KB entries

AI must return:

* `reply`
* `should_escalate` (true/false)
* `reason` (optional)

📌 Important: force the AI output to be **JSON** to keep routing deterministic.

---

#### (H) Decision: Escalate or Reply

Use an **IF node**:

* If `should_escalate = true` → route to WF02 (Escalation)
* Else → continue normally

---

#### (I) Insert AI Reply

**Supabase → Create Row (messages)**

```json
{
  "conversation_id": "{{conversation_id}}",
  "sender_type": "ai",
  "content": "{{ai.reply}}"
}
```

---

#### (J) Update Conversation Status

**Supabase → Update Row (conversations)**

* status = `ai_handling`

---

#### (K) Respond to Customer

**Respond to Webhook**:

```json
{
  "conversation_id": "uuid",
  "reply": "text",
  "status": "ai_handling"
}
```

✅ Customer flow is now working.

---

## 3) Workflow #2: Escalation & Ticket

Workflow name:
**WF02 - Escalation**

(You can call it from WF01 using an “Execute Workflow” node.)

### Steps

#### (A) Create Ticket

**Supabase → Create Row (tickets)**

```json
{
  "conversation_id": "{{conversation_id}}",
  "status": "open"
}
```

#### (B) Update Conversation

**Supabase → Update Row (conversations)**

* status = `escalated`

#### (C) Respond Back (Customer)

```json
{
  "reply": "Your request has been escalated to a human agent.",
  "status": "escalated",
  "ticket_id": "uuid"
}
```

✅ Escalation is ready.

---

## 4) Workflow #3 (Optional): Agent Assist Summary

Workflow name:
**WF03 - Agent Assist (Summary)**

Purpose:
When the agent opens a conversation, they can see a summary + suggested reply.

### Steps

* Webhook: `POST /agent/summary`
* Input: `conversation_id`
* Workflow:

  * Load messages
  * Ask AI for a summary + suggested response
* Store output:

  * Either as an AI message
  * Or in a separate table like `conversation_notes` (optional)

MVP note: optional — skip if you want to move faster.

---

## 5) Agent Dashboard: How it Works with This Setup

Agent actions:

* Agent logs in via **Supabase Auth**
* Agent dashboard reads directly from Supabase:

  * conversations (filter `status=escalated`)
  * messages per conversation
  * tickets

When the agent replies:

* Frontend writes directly to Supabase:

  * Insert message (`sender_type=agent`)
  * Update conversation status (`human_handling`)
  * Update ticket status (`resolved/closed`)

✅ This works because your RLS policies allow agents to select/insert/update these tables.

---

# Smoke Tests (Must Pass)

### Test 1: Customer inbound

Send `POST /chat/inbound` and confirm:

* conversation created
* customer message inserted
* AI message inserted
* conversation status updated

### Test 2: Escalation

Force AI output: `should_escalate=true`, confirm:

* ticket created
* conversation status = `escalated`

### Test 3: Agent flow

* agent logs in
* opens escalated conversation
* takeover (status → `human_handling`)
* sends agent message (insert)
* closes ticket + conversation (update)

---

## Final Understanding

The “Agent system” means:

* Customer talks to AI through n8n
* If human is needed → n8n creates ticket + sets `escalated`
* Agent dashboard finds escalated conversations and handles them
* Agent replies and closes the ticket/conversation

Your conversation lifecycle (simple state machine):

* `open → ai_handling / escalated → human_handling → closed`

---

## Optional Next Improvement

If you want deterministic routing, I can provide a strict **AI JSON output format** (reply + should_escalate + category), so the workflow never “guesses”.

---
