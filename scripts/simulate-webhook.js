/**
 * Direct Ring HMAC-SHA256 Webhook Simulation Script
 */

const crypto = require('node:crypto');
const http = require('node:http');

const SECRET = process.env.RING_WEBHOOK_SECRET || 'clearsight_hmac_secret_test_key_99214';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const timestamp = Date.now().toString();
const payload = JSON.stringify({
  event_id: `evt_sim_${Date.now()}`,
  device_id: 'front_doorbell_cam_pro',
  event_type: 'button_press',
  timestamp: new Date().toISOString(),
});

const signature = crypto
  .createHmac('sha256', SECRET)
  .update(`${timestamp}.${payload}`)
  .digest('hex');

console.log('[Webhook Simulator] Sending signed payload to ClearSight Backend...');

const req = http.request(`${BACKEND_URL}/api/webhooks/ring`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'x-ring-signature': signature,
    'x-ring-timestamp': timestamp,
  },
}, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`[Webhook Simulator] Response Code: ${res.statusCode}`);
    console.log(`[Webhook Simulator] Response Body: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`[Webhook Simulator] Request Error: ${e.message}`);
});

req.write(payload);
req.end();
