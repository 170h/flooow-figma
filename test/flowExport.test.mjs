#!/usr/bin/env node
/**
 * flowExport.test.mjs — Flow Export Regression Test
 *
 * 중요: src/flowExport.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 * Export 스키마 v1 + Copy for AI 텍스트 문법을 고정한다.
 * AI 텍스트 문법 변경 시 프롬프트 템플릿도 함께 갱신할 것 (flowExport.ts 주석 참조).
 */

import assert from 'node:assert/strict';
import { buildFlowExport, FLOW_EXPORT_SCHEMA_VERSION } from '../src/flowExport.ts';

console.log('=== flowExport.test.mjs — Repository Regression Test ===');

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

function loginFlow() {
  return {
    title: 'Auth',
    exportedAt: '2026-10-10T00:00:00.000Z',
    nodes: [
      { id: 'n1', type: 'Screen', title: 'Login', description: 'Allow sign in.', status: 'approved' },
      { id: 'n2', type: 'Decision', title: 'Authentication successful?' },
      { id: 'n3', type: 'Screen', title: 'Dashboard' },
      { id: 'n4', type: 'Screen', title: 'Error Message' },
    ],
    edges: [
      { source: 'n1', target: 'n2' },
      { source: 'n2', target: 'n3', label: 'Yes' },
      { source: 'n2', target: 'n4', label: 'No' },
      { source: 'n4', target: 'n1' },
    ],
  };
}

runTest('스키마 버전 분리 (Export 1.0)', () => {
  const r = buildFlowExport(loginFlow());
  assert.equal(r.json.schemaVersion, '1.0');
  assert.equal(FLOW_EXPORT_SCHEMA_VERSION, '1.0');
  assert.equal(r.json.meta.generator, 'flooow-export/1.0');
  assert.equal(r.nodeCount, 4);
  assert.equal(r.edgeCount, 4);
  assert.equal(r.empty, false);
});

runTest('순환 경로 가드 (Error → Login ↩)', () => {
  const r = buildFlowExport(loginFlow());
  assert.ok(r.aiText.includes('↩'), 'cycle mark missing:\n' + r.aiText);
  assert.ok(!r.aiText.includes('n1'), 'raw id leaked into AI text');
  assert.ok(!r.aiText.includes('n4'), 'raw id leaked into AI text');
});

runTest('Yes/No 분기 렌더 (엣지 라벨)', () => {
  const r = buildFlowExport(loginFlow());
  assert.ok(r.aiText.includes('— Yes → 3. Dashboard'), 'Yes branch missing:\n' + r.aiText);
  assert.ok(r.aiText.includes('— No → 4. Error Message'), 'No branch missing:\n' + r.aiText);
});

runTest('설명·상태 포함, JSON 손실 없음', () => {
  const r = buildFlowExport(loginFlow());
  assert.ok(r.aiText.includes('Allow sign in.'), 'description missing');
  assert.ok(r.aiText.includes('(status: approved)'), 'status missing');
  const login = r.json.nodes.find((n) => n.id === 'n1');
  assert.equal(login.title, 'Login');
  assert.equal(login.description, 'Allow sign in.');
  assert.equal(login.status, 'approved');
  const edge = r.json.edges.find((e) => e.source === 'n2' && e.target === 'n3');
  assert.equal(edge.label, 'Yes');
  assert.equal(edge.condition, 'labeled');
});

runTest('Branch 변형 (Tag 텍스트 / Check=true / Cross=false)', () => {
  const r = buildFlowExport({
    title: 'Pay',
    exportedAt: '2026-10-10T00:00:00.000Z',
    nodes: [
      { id: 'a', type: 'Screen', title: 'Cart' },
      { id: 'b', type: 'Branch', title: '결제 완료', branchVariant: 'TAG', branchText: '결제 완료' },
      { id: 'c', type: 'Branch', title: 'Check', branchVariant: 'CHECK' },
      { id: 'd', type: 'Branch', title: 'Cross', branchVariant: 'CROSS' },
      { id: 'e', type: 'Screen', title: 'Receipt' },
    ],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'e' },
      { source: 'c', target: 'e' },
      { source: 'd', target: 'a' },
    ],
  });
  assert.ok(r.aiText.includes('[Branch:Tag "결제 완료"]'), 'TAG text missing:\n' + r.aiText);
  assert.ok(r.aiText.includes('[Branch:Check=true]'), 'CHECK meaning missing');
  assert.ok(r.aiText.includes('[Branch:Cross=false]'), 'CROSS meaning missing');
  const tag = r.json.nodes.find((n) => n.id === 'b');
  assert.equal(tag.branchVariant, 'TAG');
  assert.equal(tag.branchText, '결제 완료');
  const check = r.json.nodes.find((n) => n.id === 'c');
  assert.equal(check.branchMeaning, 'true');
  const be = r.json.edges.find((e) => e.source === 'b');
  assert.equal(be.condition, 'branch');
});

runTest('무라벨 fan-out (조건 없음 병렬 분기)', () => {
  const r = buildFlowExport({
    title: 'Fan',
    exportedAt: '2026-10-10T00:00:00.000Z',
    nodes: [
      { id: 'a', type: 'Screen', title: 'Home' },
      { id: 'b', type: 'Screen', title: 'A' },
      { id: 'c', type: 'Screen', title: 'B' },
    ],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'a', target: 'c' },
    ],
  });
  assert.ok(r.aiText.includes('(no condition)'), 'fanout mark missing:\n' + r.aiText);
  const e = r.json.edges.find((x) => x.source === 'a');
  assert.equal(e.condition, 'fanout');
});

runTest('중복 제목 구분 (Login / Login (2))', () => {
  const r = buildFlowExport({
    title: 'Dup',
    exportedAt: '2026-10-10T00:00:00.000Z',
    nodes: [
      { id: 'a', type: 'Screen', title: 'Login' },
      { id: 'b', type: 'Screen', title: 'Login' },
    ],
    edges: [{ source: 'a', target: 'b' }],
  });
  assert.ok(r.aiText.includes('Login (2)'), 'duplicate disambiguation missing:\n' + r.aiText);
  assert.equal(r.json.nodes[0].title, 'Login');
  assert.equal(r.json.nodes[1].title, 'Login');
});

runTest('고립 노드 분리 섹션', () => {
  const r = buildFlowExport({
    title: 'Iso',
    exportedAt: '2026-10-10T00:00:00.000Z',
    nodes: [
      { id: 'a', type: 'Screen', title: 'Main' },
      { id: 'b', type: 'Screen', title: 'Orphan' },
    ],
    edges: [],
  });
  assert.ok(r.aiText.includes('### Unconnected nodes'), 'isolated section missing');
  assert.ok(r.aiText.includes('Orphan'), 'isolated node missing');
});

runTest('빈 페이지 (empty + 안내 문구)', () => {
  const r = buildFlowExport({ title: 'Empty', exportedAt: 'x', nodes: [], edges: [] });
  assert.equal(r.empty, true);
  assert.equal(r.nodeCount, 0);
  assert.ok(r.aiText.includes('No flow nodes on this page.'));
  assert.deepEqual(r.json.nodes, []);
  assert.deepEqual(r.json.edges, []);
});

runTest('알 수 없는 endpoint 엣지 제거 + 중복 엣지 제거', () => {
  const r = buildFlowExport({
    title: 'Prune',
    exportedAt: 'x',
    nodes: [
      { id: 'a', type: 'Screen', title: 'A' },
      { id: 'b', type: 'Screen', title: 'B' },
    ],
    edges: [
      { source: 'a', target: 'ghost' },
      { source: 'ghost', target: 'a' },
      { source: 'a', target: 'b', label: 'Go' },
      { source: 'a', target: 'b', label: 'Go' },
    ],
  });
  assert.equal(r.json.edges.length, 1);
  assert.equal(r.json.edges[0].label, 'Go');
  assert.equal(r.edgeCount, 1);
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
