#!/usr/bin/env node
/**
 * elementCount.test.mjs — Flooow element live recount Regression Test
 *
 * 중요: src/elementCount.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 * Figma Plugin API 없이 순수 mock node로 검증한다 (chainOrder.test.mjs 패턴).
 */

import assert from 'node:assert/strict';
import { countFlooowElements } from '../src/elementCount.ts';

console.log('=== elementCount.test.mjs — Repository Regression Test ===');

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

// Minimal mock node: id/type/name/parent/getPluginData (CountableNode shape)
function mkNode({ id, type = 'FRAME', name = '', data = {}, parent = null, noPluginData = false }) {
  const node = { id, type, name, parent };
  if (!noPluginData) {
    node.getPluginData = (key) => (key in data ? data[key] : '');
  }
  return node;
}

function flowNode(id, parent = null, extra = {}) {
  return mkNode({ id, type: 'FRAME', parent, data: { is_flow_node: 'true', node_type: 'Screen', ...extra } });
}

function connectorGroup(id, parent = null) {
  const group = mkNode({
    id, type: 'GROUP', parent,
    data: { is_custom_connector: 'true', is_flow_connector: 'true', source_node_id: 'A', target_node_id: 'B' },
  });
  const vector = mkNode({ id: `${id}:vec`, type: 'VECTOR', parent: group, data: { is_flow_connector: 'true' } });
  const labelFrame = mkNode({
    id: `${id}:label`, type: 'FRAME', name: 'ConnectorLabel', parent: group,
    data: { is_custom_connector: 'true', is_connector_label: 'true' },
  });
  const labelText = mkNode({ id: `${id}:labelText`, type: 'TEXT', parent: labelFrame });
  return { group, vector, labelFrame, labelText };
}

// ---------------------------------------------------------------------------
runTest('Test 1 — 0 Flooow elements → 0', () => {
  assert.deepEqual(countFlooowElements([]), { nodes: 0, connectors: 0, total: 0 });
});

runTest('Test 2 — Node 1개 → 1', () => {
  const result = countFlooowElements([flowNode('N1')]);
  assert.deepEqual(result, { nodes: 1, connectors: 0, total: 1 });
});

runTest('Test 3 — Connector 1개 → 1', () => {
  const c = connectorGroup('C1');
  const result = countFlooowElements([c.group, c.vector, c.labelFrame, c.labelText]);
  assert.deepEqual(result, { nodes: 0, connectors: 1, total: 1 });
});

runTest('Test 4 — Node + Connector → 2', () => {
  const c = connectorGroup('C1');
  const result = countFlooowElements([flowNode('N1'), c.group, c.vector, c.labelFrame, c.labelText]);
  assert.deepEqual(result, { nodes: 1, connectors: 1, total: 2 });
});

runTest('Test 5 — 여러 node + connector 정확한 합', () => {
  const c1 = connectorGroup('C1');
  const c2 = connectorGroup('C2');
  const all = [
    flowNode('N1'), flowNode('N2'), flowNode('N3'),
    c1.group, c1.vector, c1.labelFrame, c1.labelText,
    c2.group, c2.vector,
  ];
  assert.deepEqual(countFlooowElements(all), { nodes: 3, connectors: 2, total: 5 });
});

runTest('Test 6 — label/helper child 추가 count 없음 + 중복 탐색 1회만', () => {
  const c = connectorGroup('C1');
  // top + 모든 child를 중복 포함해도 1회만 계수
  const result = countFlooowElements([c.group, c.group, c.vector, c.labelFrame, c.labelText, c.labelText]);
  assert.deepEqual(result, { nodes: 0, connectors: 1, total: 1 });
});

runTest('Test 7 — 내부 child만 전달해도 top 1회 계수 (node 자식 TEXT 포함)', () => {
  const card = flowNode('N1');
  const title = mkNode({ id: 'N1:title', type: 'TEXT', name: 'TitleText', parent: card, data: { node_role: 'title' } });
  const c = connectorGroup('C1');
  // top-level 없이 child만 전달
  const result = countFlooowElements([title, c.vector, c.labelText]);
  assert.deepEqual(result, { nodes: 1, connectors: 1, total: 2 });
});

runTest('Test 8 — 일반 node + untagged native CONNECTOR → 0 (정책 A 기본값)', () => {
  const all = [
    mkNode({ id: 'R1', type: 'RECTANGLE' }),
    mkNode({ id: 'T1', type: 'TEXT' }),
    mkNode({ id: 'F1', type: 'FRAME' }),
    mkNode({ id: 'NC1', type: 'CONNECTOR' }),
    null,
  ];
  assert.deepEqual(countFlooowElements(all), { nodes: 0, connectors: 0, total: 0 });
});

runTest('Test 9 — node_type만 있는 node도 계수 + pluginData 없는 node 무시', () => {
  const legacy = mkNode({ id: 'L1', type: 'SHAPE_WITH_TEXT', data: { node_type: 'Process' } });
  const bare = mkNode({ id: 'B1', type: 'FRAME', noPluginData: true });
  const result = countFlooowElements([legacy, bare]);
  assert.deepEqual(result, { nodes: 1, connectors: 0, total: 1 });
});

runTest('Test 10 — includeNativeConnectors:true면 native CONNECTOR 1 계수 (정책 B 후보)', () => {
  const all = [flowNode('N1'), mkNode({ id: 'NC1', type: 'CONNECTOR' })];
  assert.deepEqual(countFlooowElements(all, { includeNativeConnectors: true }), { nodes: 1, connectors: 1, total: 2 });
  assert.deepEqual(countFlooowElements(all), { nodes: 1, connectors: 0, total: 1 });
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
