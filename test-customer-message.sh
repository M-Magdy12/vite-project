#!/bin/bash

# Grade Z - Customer Message Test Script
# This simulates a customer sending a message through n8n

N8N_WEBHOOK="https://zemonze.app.n8n.cloud/webhook-test/ee1a363c-d377-4c79-9465-109bcb8d17e5/chat/inbound"

echo "🧪 Testing Grade Z Customer Message Flow"
echo "=========================================="
echo ""

# Test 1: Simple customer message
echo "📨 Test 1: Sending simple customer message..."
curl -X POST "$N8N_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_001",
    "message": "Hello, I need help with my account"
  }'
echo ""
echo ""

# Wait a bit
sleep 2

# Test 2: Message that might trigger escalation
echo "📨 Test 2: Sending message that might escalate..."
curl -X POST "$N8N_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_002",
    "message": "I want to speak to a human agent immediately. This is urgent!"
  }'
echo ""
echo ""

# Test 3: Another simple message
echo "📨 Test 3: Sending another customer message..."
curl -X POST "$N8N_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_003",
    "message": "How do I reset my password?"
  }'
echo ""
echo ""

echo "✅ Tests complete!"
echo ""
echo "Now check your Agent Dashboard at http://localhost:5173"
echo "You should see new conversations appear in the sidebar."
