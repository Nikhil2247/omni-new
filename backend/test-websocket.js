/**
 * WebSocket Connection Test Script
 * Tests if the Socket.IO server is properly initialized and responding
 */

const io = require('socket.io-client');

console.log('Testing WebSocket connection to localhost:3001...\n');

// Test connection
const socket = io('http://localhost:3001/notifications', {
  path: '/api/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: false,
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('✅ SUCCESS: WebSocket connected!');
  console.log('   Socket ID:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);
  console.log('\nWebSocket server is working correctly.');
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ FAILED: Could not connect to WebSocket server');
  console.log('   Error:', error.message);
  console.log('\nPossible causes:');
  console.log('   1. Backend server is not running');
  console.log('   2. Backend server needs to be restarted');
  console.log('   3. WebSocket adapter not initialized');
  console.log('\nTo fix:');
  console.log('   1. Stop your backend (Ctrl+C)');
  console.log('   2. Run: cd backend && npm run start:dev');
  console.log('   3. Wait for "WebSocket adapter initialized" message');
  console.log('   4. Run this test again\n');
  socket.disconnect();
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error.message);
  socket.disconnect();
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('❌ TIMEOUT: Connection attempt timed out');
  console.log('\nThe backend server may not be running or not responding.');
  socket.disconnect();
  process.exit(1);
}, 5000);
