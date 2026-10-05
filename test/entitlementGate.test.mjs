#!/usr/bin/env node
/**
 * entitlementGate.test.mjs — Create Gate 정책 Regression Test
 *
 * 중요: src/entitlementGate.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 * Figma Plugin API 없이 순수 정책 매트릭스 + batch 원자 승인 계약을 검증한다.
 */

import assert from 'node:assert/strict';
import { canCreateFlooowElements, normalizePaymentStatus, assembleFlooowUsage, FREE_ELEMENT_LIMIT } from '../src/entitlementGate.ts';

console.log('=== entitlementGate.test.mjs — Repository Regression Test ===');

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

runTest('Limit 상수 = 20', () => {
  assert.equal(FREE_ELEMENT_LIMIT, 20);
});

runTest('FREE, count 0, request 1 → allowed (WITHIN_LIMIT)', () => {
  const r = canCreateFlooowElements({ currentCount: 0, requestedCount: 1, entitlement: 'FREE' });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'WITHIN_LIMIT');
  assert.deepEqual([r.currentCount, r.requestedCount, r.limit], [0, 1, 20]);
});

runTest('FREE, count 19, request 1 → allowed', () => {
  const r = canCreateFlooowElements({ currentCount: 19, requestedCount: 1, entitlement: 'FREE' });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'WITHIN_LIMIT');
});

runTest('FREE, count 20, request 1 → denied (LIMIT_EXCEEDED)', () => {
  const r = canCreateFlooowElements({ currentCount: 20, requestedCount: 1, entitlement: 'FREE' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'LIMIT_EXCEEDED');
});

runTest('FREE, count 19, request 2 → denied', () => {
  const r = canCreateFlooowElements({ currentCount: 19, requestedCount: 2, entitlement: 'FREE' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'LIMIT_EXCEEDED');
});

runTest('FREE, count 0, request 20 → allowed (경계값)', () => {
  const r = canCreateFlooowElements({ currentCount: 0, requestedCount: 20, entitlement: 'FREE' });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'WITHIN_LIMIT');
});

runTest('FREE, count 0, request 21 → denied', () => {
  const r = canCreateFlooowElements({ currentCount: 0, requestedCount: 21, entitlement: 'FREE' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'LIMIT_EXCEEDED');
});

runTest('FREE, count 20, batch request 2 → denied', () => {
  const r = canCreateFlooowElements({ currentCount: 20, requestedCount: 2, entitlement: 'FREE' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'LIMIT_EXCEEDED');
});

runTest('FREE, count 19, batch request 1 → allowed', () => {
  const r = canCreateFlooowElements({ currentCount: 19, requestedCount: 1, entitlement: 'FREE' });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'WITHIN_LIMIT');
});

runTest('PAID_ACTIVE, count 20, request 1 → allowed', () => {
  const r = canCreateFlooowElements({ currentCount: 20, requestedCount: 1, entitlement: 'PAID_ACTIVE' });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'PAID_ACTIVE');
});

runTest('PAID_ACTIVE, count 100, request 10 → allowed', () => {
  const r = canCreateFlooowElements({ currentCount: 100, requestedCount: 10, entitlement: 'PAID_ACTIVE' });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'PAID_ACTIVE');
});

runTest('Batch 원자 승인: count 19 + request 2 → denied → 실제 생성 0개', () => {
  // connectChain과 동일한 계약: 실제 신규 수량을 먼저 확정 후 1회 승인.
  // 거부되면 확정 목록을 버리므로 생성 loop에 진입하지 않는다 (0개 생성).
  const plannedNewPairs = [{ a: 'N1', b: 'N2' }, { a: 'N2', b: 'N3' }];
  const gate = canCreateFlooowElements({ currentCount: 19, requestedCount: plannedNewPairs.length, entitlement: 'FREE' });
  assert.equal(gate.allowed, false);
  const approvedPairs = gate.allowed ? plannedNewPairs : [];
  assert.equal(approvedPairs.length, 0);
  let created = 0;
  for (const _ of approvedPairs) created++;
  assert.equal(created, 0);
});

runTest('Batch 원자 승인: count 18 + request 2 → allowed → 2개 생성', () => {
  const plannedNewPairs = [{ a: 'N1', b: 'N2' }, { a: 'N2', b: 'N3' }];
  const gate = canCreateFlooowElements({ currentCount: 18, requestedCount: plannedNewPairs.length, entitlement: 'FREE' });
  assert.equal(gate.allowed, true);
  const approvedPairs = gate.allowed ? plannedNewPairs : [];
  let created = 0;
  for (const _ of approvedPairs) created++;
  assert.equal(created, 2);
});

runTest('normalizePaymentStatus: PAID → PAID_ACTIVE', () => {
  assert.equal(normalizePaymentStatus('PAID'), 'PAID_ACTIVE');
});

runTest('normalizePaymentStatus: UNPAID/NOT_SUPPORTED/미선언 → FREE', () => {
  assert.equal(normalizePaymentStatus('UNPAID'), 'FREE');
  assert.equal(normalizePaymentStatus('NOT_SUPPORTED'), 'FREE');
  assert.equal(normalizePaymentStatus(undefined), 'FREE');
  assert.equal(normalizePaymentStatus(null), 'FREE');
  assert.equal(normalizePaymentStatus(''), 'FREE');
  assert.equal(normalizePaymentStatus('GARBAGE'), 'FREE');
});

runTest('실제 PaymentsAPI.status 형태 mock → usage + FREE는 20 제한', () => {
  // 최소 mock (공식 interface의 status.type만 사용)
  const mockPayments = { status: { type: 'UNPAID' } };
  const entitlement = normalizePaymentStatus(mockPayments.status?.type);
  assert.equal(entitlement, 'FREE');
  const usage = assembleFlooowUsage({ nodes: 12, connectors: 8, total: 20 }, entitlement);
  assert.equal(usage.total, 20);
  assert.equal(usage.canCreate, false);
});

runTest('실제 PaymentsAPI.status 형태 mock → usage + PAID_ACTIVE는 제한 없음', () => {
  const mockPayments = { status: { type: 'PAID' } };
  const entitlement = normalizePaymentStatus(mockPayments.status?.type);
  assert.equal(entitlement, 'PAID_ACTIVE');
  const usage = assembleFlooowUsage({ nodes: 60, connectors: 40, total: 100 }, entitlement);
  assert.equal(usage.total, 100);
  assert.equal(usage.canCreate, true);
});

runTest('Lapsed: UNPAID + 0 → true', () => {
  const gate = canCreateFlooowElements({ currentCount: 0, requestedCount: 1, entitlement: normalizePaymentStatus('UNPAID') });
  assert.equal(gate.allowed, true);
});

runTest('Lapsed over-limit lifecycle: 25→24→20 denied, 19→allowed-1', () => {
  // PAID 시 25개 생성 후 UNPAID 전환 시뮬레이션 (삭제는 live recount로 반영).
  for (const total of [25, 24, 20]) {
    const gate = canCreateFlooowElements({ currentCount: total, requestedCount: 1, entitlement: normalizePaymentStatus('UNPAID') });
    assert.equal(gate.allowed, false, `total=${total} must deny`);
    assert.equal(gate.reason, 'LIMIT_EXCEEDED');
  }
  const recovered = canCreateFlooowElements({ currentCount: 19, requestedCount: 1, entitlement: normalizePaymentStatus('UNPAID') });
  assert.equal(recovered.allowed, true);
  assert.equal(recovered.reason, 'WITHIN_LIMIT');
});

runTest('NOT_SUPPORTED: 19→true, 20→false, 100→false', () => {
  const entitlement = normalizePaymentStatus('NOT_SUPPORTED');
  assert.equal(entitlement, 'FREE');
  assert.equal(canCreateFlooowElements({ currentCount: 19, requestedCount: 1, entitlement }).allowed, true);
  assert.equal(canCreateFlooowElements({ currentCount: 20, requestedCount: 1, entitlement }).allowed, false);
  assert.equal(canCreateFlooowElements({ currentCount: 100, requestedCount: 1, entitlement }).allowed, false);
});

runTest('Lapsed여도 기존 수정/삭제는 Gate 대상 아님 (생성 Gate만 존재)', () => {
  // UPDATE/DELETE 경로에는 approveNewElements 호출이 없으므로 (코드 리뷰로 확인),
  // UNPAID + over-limit에서도 수정/삭제 함수는 호출 가능해야 한다.
  // 여기서는 정책 함수가 updates를 모른다는 것을 고정한다:
  // canCreate는 requestedCount가 있는 생성 요청에만 답한다.
  const gate = canCreateFlooowElements({ currentCount: 57, requestedCount: 1, entitlement: normalizePaymentStatus('UNPAID') });
  assert.equal(gate.allowed, false); // 신규 생성만 거부
  assert.equal(gate.currentCount, 57); // 기존 57개는 그대로 유지 (삭제·잠금 없음)
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
