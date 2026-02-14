#!/usr/bin/env node

/**
 * Grade Z - Customer Message Test Script (Node.js version)
 * This simulates a customer sending a message through n8n
 */

const N8N_WEBHOOK = 'https://zemonze.app.n8n.cloud/webhook-test/ee1a363c-d377-4c79-9465-109bcb8d17e5/chat/inbound';

async function sendMessage(sessionId, message, testName) {
  console.log(`\n📨 ${testName}`);
  console.log(`Session: ${sessionId}`);
  console.log(`Message: "${message}"`);
  
  try {
    const response = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message
      })
    });

    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing Grade Z Customer Message Flow');
  console.log('==========================================\n');

  // Test 1: Simple customer message
  await sendMessage(
    'test_session_001',
    'Hello, I need help with my account',
    'Test 1: Simple customer message'
  );

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Message that might trigger escalation
  await sendMessage(
    'test_session_002',
    'I want to speak to a human agent immediately. This is urgent!',
    'Test 2: Escalation trigger message'
  );

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Another simple message
  await sendMessage(
    'test_session_003',
    'How do I reset my password?',
    'Test 3: FAQ-type message'
  );

  console.log('\n✅ Tests complete!');
  console.log('\nNow check your Agent Dashboard at http://localhost:5173');
  console.log('You should see new conversations appear in the sidebar.\n');
}

runTests();
