#!/usr/bin/env node
/**
 * flooowUsage.test.mjs — Core Usage State Regression Test
 *
 * 중요: src/entitlementGate.ts(assemble) + src/elementCount.ts(recount)의
 * 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 * source of truth가 저장값이 아니라 live recount임을 검증한다.
 */

import assert from 'node:assert/strict';
import { assembleFlooowUsage } from '../src/entitlementGate.ts';
import { countFlooowElements } from '../src/elementCount.ts';

console.log('=== flooowUsage.test.mjs — Repository Regression Test ===');

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

function mkNode({ id, type = 'FRAME', name = '', data = {}, parent = null }) {
  return { id, type, name, parent, getPluginData: (key) => (key in data ? data[key] : '') };
}

function flowNode(id) {
  return mkNode({ id, data: { is_flow_node: 'true', node_type: 'Screen' } });
}

function connectorGroup(id) {
  const group = mkNode({ id, type: 'GROUP', data: { is_custom_connector: 'true' } });
  const vector = mkNode({ id: `${id}:vec`, type: 'VECTOR', parent: group, data: { is_flow_connector: 'true' } });
  return { group, vector };
}

runTest('FREE, 0 elements → total 0, canCreate true', () => {
  const usage = assembleFlooowUsage(countFlooowElements([]), 'FREE');
  assert.deepEqual(usage, { nodes: 0, connectors: 0, total: 0, limit: 20, entitlement: 'FREE', canCreate: true });
});

runTest('FREE, 19 elements → total 19, canCreate true', () => {
  const all = [];
  for (let i = 0; i < 19; i++) all.push(flowNode(`N${i}`));
  const usage = assembleFlooowUsage(countFlooowElements(all), 'FREE');
  assert.equal(usage.total, 19);
  assert.equal(usage.canCreate, true);
  assert.equal(usage.limit, 20);
});

runTest('FREE, 20 elements → total 20, canCreate false', () => {
  const all = [];
  for (let i = 0; i < 20; i++) all.push(flowNode(`N${i}`));
  const usage = assembleFlooowUsage(countFlooowElements(all), 'FREE');
  assert.equal(usage.total, 20);
  assert.equal(usage.canCreate, false);
});

runTest('PAID_ACTIVE, 20 elements → canCreate true', () => {
  const all = [];
  for (let i = 0; i < 20; i++) all.push(flowNode(`N${i}`));
  const usage = assembleFlooowUsage(countFlooowElements(all), 'PAID_ACTIVE');
  assert.equal(usage.total, 20);
  assert.equal(usage.canCreate, true);
  assert.equal(usage.entitlement, 'PAID_ACTIVE');
});

runTest('Composition: 5 nodes + 7 connectors → 5/7/12', () => {
  const all = [];
  for (let i = 0; i < 5; i++) all.push(flowNode(`N${i}`));
  for (let i = 0; i < 7; i++) {
    const c = connectorGroup(`C${i}`);
    all.push(c.group, c.vector);
  }
  const usage = assembleFlooowUsage(countFlooowElements(all), 'FREE');
  assert.equal(usage.nodes, 5);
  assert.equal(usage.connectors, 7);
  assert.equal(usage.total, 12);
  assert.equal(usage.canCreate, true);
});

runTest('Live recount: 문서 변경 후 재요청 시 현재 상태 반환 (저장값 아님)', () => {
  // 같은 배열 객체를 변경하면서 recount → 이전 값이 남지 않아야 한다.
  const live = [flowNode('N1'), flowNode('N2')];
  const first = assembleFlooowUsage(countFlooowElements(live), 'FREE');
  assert.equal(first.total, 2);
  assert.equal(first.canCreate, true);

  // 생성 시뮬레이션: 18개 추가 → 20 (ID 중복 없이)
  for (let i = 0; i < 18; i++) live.push(flowNode(`M${i}`));
  const second = assembleFlooowUsage(countFlooowElements(live), 'FREE');
  assert.equal(second.total, 20);
  assert.equal(second.canCreate, false);

  // 삭제 시뮬레이션: 1개 제거 → 19 (delta 저장 없이 감소 반영)
  live.pop();
  const third = assembleFlooowUsage(countFlooowElements(live), 'FREE');
  assert.equal(third.total, 19);
  assert.equal(third.canCreate, true);
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
