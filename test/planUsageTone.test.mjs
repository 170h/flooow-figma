#!/usr/bin/env node
import assert from 'node:assert/strict';
import { usageRemainingTone } from '../src/planUsageTone.ts';

const cases = [
  [{ remaining: 20, paid: false, limitReached: false }, 'calm'],
  [{ remaining: 6, paid: false, limitReached: false }, 'calm'],
  [{ remaining: 5, paid: false, limitReached: false }, 'warning'],
  [{ remaining: 4, paid: false, limitReached: false }, 'warning'],
  [{ remaining: 3, paid: false, limitReached: false }, 'danger'],
  [{ remaining: 2, paid: false, limitReached: false }, 'danger'],
  [{ remaining: 1, paid: false, limitReached: false }, 'critical'],
  [{ remaining: 0, paid: false, limitReached: true }, 'reached'],
  [{ remaining: 12, paid: true, limitReached: false }, 'unlimited'],
];

for (const [input, expected] of cases) {
  const tone = usageRemainingTone(input.remaining, {
    paid: input.paid,
    limitReached: input.limitReached,
  });
  assert.equal(tone, expected, `remaining ${input.remaining} paid ${input.paid}`);
}

console.log('planUsageTone.test.mjs: ok');
