#!/usr/bin/env node
import assert from 'node:assert/strict';
import { formatSubscriptionStatus } from '../src/subscriptionStatus.ts';

const end = new Date(2026, 9, 12);

function msg(autoRenew, now) {
  return formatSubscriptionStatus({ autoRenew, periodEnd: end, now });
}

const cases = [
  [true, new Date(2026, 9, 4), 'Renews Oct 12, 2026', 'neutral', false],
  [false, new Date(2026, 9, 4), 'Expires Oct 12, 2026', 'neutral', false],
  [true, new Date(2026, 9, 5), 'Renews in 7 days · Oct 12', 'neutral', false],
  [false, new Date(2026, 9, 5), 'Expires in 7 days · Oct 12', 'warning', false],
  [false, new Date(2026, 9, 8), 'Expires in 4 days · Oct 12', 'warning', false],
  [false, new Date(2026, 9, 9), 'Expires in 3 days · Oct 12', 'danger', false],
  [true, new Date(2026, 9, 10), 'Renews in 2 days · Oct 12', 'neutral', false],
  [false, new Date(2026, 9, 10), 'Expires in 2 days · Oct 12', 'danger', false],
  [true, new Date(2026, 9, 11), 'Renews tomorrow · Oct 12', 'neutral', false],
  [false, new Date(2026, 9, 11), 'Expires tomorrow · Oct 12', 'danger', false],
  [true, new Date(2026, 9, 12), 'Renews today', 'success', false],
  [false, new Date(2026, 9, 12), 'Expires today', 'critical', false],
  [false, new Date(2026, 9, 13), '', 'neutral', true],
];

for (const [autoRenew, now, text, tone, expired] of cases) {
  const result = msg(autoRenew, now);
  assert.equal(result.text, text, `${autoRenew} ${now.toDateString()}`);
  assert.equal(result.tone, tone);
  assert.equal(result.expired, expired);
  if (now.getTime() >= new Date(2026, 9, 5).getTime() && now.getTime() <= end.getTime()) {
    assert.equal(result.text.includes('2026'), false, result.text);
  }
}

console.log('subscriptionStatus.test.mjs: ok');
