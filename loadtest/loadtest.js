import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metric to track total successful ticket checkouts across all VUs
export const successfulCheckouts = new Counter('successful_checkouts');

export const options = {
  scenarios: {
    thundering_herd_flash_sale: {
      executor: 'ramping-arrival-rate',
      startRate: 500,
      timeUnit: '1s',
      preAllocatedVUs: 2000,
      maxVUs: 50000,
      stages: [
        { duration: '30s', target: 50000 }, // Ramp up to 50,000 VUs over 30s
        { duration: '1m', target: 50000 },  // Hold peak 50,000 VUs for 1 min
        { duration: '15s', target: 0 },     // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], // Max 5% error rate under peak load
    successful_checkouts: ['count<=10000'], // STAGGERING VALIDATION: Never exceed 10,000 total checkouts!
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  const userId = `vu_${__VU}_${Math.floor(Math.random() * 1000000)}`;

  // 1. Join Queue / Virtual Waiting Room
  const queueRes = http.get(`${BASE_URL}/join-queue?user_id=${userId}`);
  check(queueRes, {
    'queue status is 200': (r) => r.status === 200,
  });

  sleep(0.1); // Small delay simulating client processing

  // 2. Attempt Checkout with unique Idempotency Key
  const checkoutId = `chk_${__VU}_${Date.now()}`;
  const checkoutRes = http.get(`${BASE_URL}/checkout?checkout_id=${checkoutId}&user_id=${userId}`);

  const isSuccess = check(checkoutRes, {
    'checkout status handled': (r) => r.status === 200 || r.status === 400,
  });

  if (checkoutRes.status === 200) {
    const body = JSON.parse(checkoutRes.body);
    if (body.status === 'success') {
      successfulCheckouts.add(1);
    }
  }

  sleep(0.5);
}
