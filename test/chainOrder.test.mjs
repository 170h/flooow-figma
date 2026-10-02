#!/usr/bin/env node
/**
 * chainOrder.test.mjs — 3+ 노드 Chain 공간 정렬 및 Pair Key Regression Test
 *
 * 중요: src/chainOrder.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 */

import assert from 'node:assert/strict';
import { orderNodesForChain, makePairKey, ROW_OVERLAP_THRESHOLD } from '../src/chainOrder.ts';

console.log('=== chainOrder.test.mjs — Repository Regression Test ===');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------------
// Test 1 — Horizontal
// ---------------------------------------------------------------------------
runTest('Test 1 — Horizontal (A, B, C)', () => {
  const nodes = [
    { id: 'B', x: 200, y: 0, width: 100, height: 100 },
    { id: 'C', x: 400, y: 0, width: 100, height: 100 },
    { id: 'A', x: 0, y: 0, width: 100, height: 100 },
  ];
  const result = orderNodesForChain(nodes);
  assert.deepEqual(result.map((n) => n.id), ['A', 'B', 'C']);
});

// ---------------------------------------------------------------------------
// Test 2 — Vertical
// ---------------------------------------------------------------------------
runTest('Test 2 — Vertical (A, B, C)', () => {
  const nodes = [
    { id: 'C', x: 0, y: 400, width: 100, height: 100 },
    { id: 'A', x: 0, y: 0, width: 100, height: 100 },
    { id: 'B', x: 0, y: 200, width: 100, height: 100 },
  ];
  const result = orderNodesForChain(nodes);
  assert.deepEqual(result.map((n) => n.id), ['A', 'B', 'C']);
});

// ---------------------------------------------------------------------------
// Test 3 — 2×2 Grid
// ---------------------------------------------------------------------------
runTest('Test 3 — 2×2 Grid', () => {
  const nodes = [
    { id: 'D', x: 200, y: 200, width: 100, height: 100 },
    { id: 'C', x: 0, y: 200, width: 100, height: 100 },
    { id: 'B', x: 200, y: 0, width: 100, height: 100 },
    { id: 'A', x: 0, y: 0, width: 100, height: 100 },
  ];
  const result = orderNodesForChain(nodes);
  assert.deepEqual(result.map((n) => n.id), ['A', 'B', 'C', 'D']);
});

// ---------------------------------------------------------------------------
// Test 4 — 3×2 Grid
// ---------------------------------------------------------------------------
runTest('Test 4 — 3×2 Grid', () => {
  const nodes = [
    { id: 'F', x: 400, y: 200, width: 100, height: 100 },
    { id: 'B', x: 200, y: 0, width: 100, height: 100 },
    { id: 'D', x: 0, y: 200, width: 100, height: 100 },
    { id: 'A', x: 0, y: 0, width: 100, height: 100 },
    { id: 'E', x: 200, y: 200, width: 100, height: 100 },
    { id: 'C', x: 400, y: 0, width: 100, height: 100 },
  ];
  const result = orderNodesForChain(nodes);
  assert.deepEqual(result.map((n) => n.id), ['A', 'B', 'C', 'D', 'E', 'F']);
});

// ---------------------------------------------------------------------------
// Test 5 — Same Coordinates / ID Tie-break
// ---------------------------------------------------------------------------
runTest('Test 5 — Same Coordinates / ID Tie-break', () => {
  const nodes = [
    { id: 'b', x: 0, y: 0, width: 100, height: 100 },
    { id: 'a', x: 0, y: 0, width: 100, height: 100 },
    { id: 'c', x: 0, y: 0, width: 100, height: 100 },
  ];
  const result = orderNodesForChain(nodes);
  assert.deepEqual(result.map((n) => n.id), ['a', 'b', 'c']);
});

// ---------------------------------------------------------------------------
// Test 6 — Mixed Heights
// ---------------------------------------------------------------------------
runTest('Test 6 — Mixed Heights (A=120, B=64, C=180 all in Row 1)', () => {
  const nodes = [
    { id: 'C', x: 400, y: 20, width: 100, height: 180 },
    { id: 'A', x: 0, y: 0, width: 100, height: 120 },
    { id: 'B', x: 200, y: 50, width: 100, height: 64 },
  ];
  const result = orderNodesForChain(nodes);
  assert.deepEqual(result.map((n) => n.id), ['A', 'B', 'C']);
});

// ---------------------------------------------------------------------------
// Test 7 — Exact 50% Boundary
// ---------------------------------------------------------------------------
runTest('Test 7 — Exact 50% Boundary (overlap === refHeight * 0.5 -> same row)', () => {
  const nodes = [
    { id: 'B', x: 200, y: 50, width: 100, height: 100 },
    { id: 'A', x: 0, y: 0, width: 100, height: 100 },
  ];
  const result = orderNodesForChain(nodes);
  assert.deepEqual(result.map((n) => n.id), ['A', 'B']);
});

// ---------------------------------------------------------------------------
// Test 8 — Stair-step / Anchor Regression Test
// ---------------------------------------------------------------------------
runTest('Test 8 — Stair-step (Anchor-only: Row 1 = {A,B}, Row 2 = {C,D} -> [A,B,C,D])', () => {
  const nodes = [
    { id: 'A', x: 300, y: 0, width: 100, height: 100 },
    { id: 'B', x: 400, y: 40, width: 100, height: 100 },
    { id: 'C', x: 0, y: 80, width: 100, height: 100 },
    { id: 'D', x: 100, y: 120, width: 100, height: 100 },
  ];
  const result = orderNodesForChain(nodes);
  // 기존 누적 방식이었다면 [C, D, A, B]로 실패함. Anchor 방식에서는 반드시 [A, B, C, D]여야 함.
  assert.deepEqual(result.map((n) => n.id), ['A', 'B', 'C', 'D']);
});

// ---------------------------------------------------------------------------
// Test 9 — makePairKey Direction Independence & Uniqueness
// ---------------------------------------------------------------------------
runTest('Test 9 — makePairKey Direction Independence', () => {
  const keyForward = makePairKey('A', 'B');
  const keyBackward = makePairKey('B', 'A');
  assert.equal(keyForward, keyBackward, 'makePairKey should be direction independent');
  assert.equal(keyForward, 'A|B');

  const keyDifferent = makePairKey('A', 'C');
  assert.notEqual(keyForward, keyDifferent, 'different pairs should produce different keys');
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
