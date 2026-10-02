#!/usr/bin/env node
/**
 * connectButton.test.mjs — Connect 버튼 상태 및 라벨 판정 순수 함수 Regression Test
 *
 * 중요: src/ui/utils/connectButton.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 */

import assert from 'node:assert/strict';
import { getConnectButton } from '../src/ui/utils/connectButton.ts';

console.log('=== connectButton.test.mjs — Connect Button Regression Test ===');

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
// T1: 커넥터 1개 선택 -> { kind:'UPDATE', label:'Update Connector', enabled:true }
// ---------------------------------------------------------------------------
runTest('T1 — 커넥터 1개 선택', () => {
  const result = getConnectButton({
    nodeCount: 1,
    isAllConnectors: true,
    connectorCount: 1,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: false,
  });
  assert.equal(result.kind, 'UPDATE');
  assert.equal(result.label, 'Update Connector');
  assert.equal(result.enabled, true);
  assert.equal(result.hint, undefined);
});

// ---------------------------------------------------------------------------
// T2: 커넥터 3개 선택 -> { kind:'UPDATE', label:'Update Connectors', enabled:true }
// ---------------------------------------------------------------------------
runTest('T2 — 커넥터 3개 선택', () => {
  const result = getConnectButton({
    nodeCount: 3,
    isAllConnectors: true,
    connectorCount: 3,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: false,
  });
  assert.equal(result.kind, 'UPDATE');
  assert.equal(result.label, 'Update Connectors');
  assert.equal(result.enabled, true);
  assert.equal(result.hint, undefined);
});

// ---------------------------------------------------------------------------
// T3: 노드 0개 -> { kind:'NONE', label:'Connect', enabled:false }
// ---------------------------------------------------------------------------
runTest('T3 — 노드 0개', () => {
  const result = getConnectButton({
    nodeCount: 0,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: false,
  });
  assert.equal(result.kind, 'NONE');
  assert.equal(result.label, 'Connect');
  assert.equal(result.enabled, false);
});

// ---------------------------------------------------------------------------
// T4: 노드 1개 -> { kind:'NONE', label:'Connect', enabled:false }
// ---------------------------------------------------------------------------
runTest('T4 — 노드 1개', () => {
  const result = getConnectButton({
    nodeCount: 1,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: true,
    hasEnd: true,
    hasExistingConnection: false,
  });
  assert.equal(result.kind, 'NONE');
  assert.equal(result.label, 'Connect');
  assert.equal(result.enabled, false);
});

// ---------------------------------------------------------------------------
// T5: 노드 2개, 연결 없음, hasStart=false, hasEnd=false -> CONNECT, enabled:false
// ---------------------------------------------------------------------------
runTest('T5 — 노드 2개, 연결 없음, hasStart=false, hasEnd=false', () => {
  const result = getConnectButton({
    nodeCount: 2,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: false,
  });
  assert.equal(result.kind, 'CONNECT');
  assert.equal(result.label, 'Connect');
  assert.equal(result.enabled, false);
});

// ---------------------------------------------------------------------------
// T6: 노드 2개, 연결 없음, hasStart=true, hasEnd=false -> CONNECT, enabled:false
// ---------------------------------------------------------------------------
runTest('T6 — 노드 2개, 연결 없음, hasStart=true, hasEnd=false', () => {
  const result = getConnectButton({
    nodeCount: 2,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: true,
    hasEnd: false,
    hasExistingConnection: false,
  });
  assert.equal(result.kind, 'CONNECT');
  assert.equal(result.label, 'Connect');
  assert.equal(result.enabled, false);
});

// ---------------------------------------------------------------------------
// T7: 노드 2개, 연결 없음, hasStart=true, hasEnd=true -> CONNECT, enabled:true
// ---------------------------------------------------------------------------
runTest('T7 — 노드 2개, 연결 없음, hasStart=true, hasEnd=true', () => {
  const result = getConnectButton({
    nodeCount: 2,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: true,
    hasEnd: true,
    hasExistingConnection: false,
  });
  assert.equal(result.kind, 'CONNECT');
  assert.equal(result.label, 'Connect');
  assert.equal(result.enabled, true);
});

// ---------------------------------------------------------------------------
// T8: 노드 2개, 연결 있음 -> { kind:'CONNECTED', label:'Connected', enabled:false }
// ---------------------------------------------------------------------------
runTest('T8 — 노드 2개, 연결 있음', () => {
  const result = getConnectButton({
    nodeCount: 2,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: true,
    hasEnd: true,
    hasExistingConnection: true,
  });
  assert.equal(result.kind, 'CONNECTED');
  assert.equal(result.label, 'Connected');
  assert.equal(result.enabled, false);
});

// ---------------------------------------------------------------------------
// T9: 노드 3개, missing=2, connected=0 -> { kind:'CONNECT', label:'Connect (2)', enabled:true, hint 없음 }
// ---------------------------------------------------------------------------
runTest('T9 — 노드 3개, missing=2, connected=0', () => {
  const result = getConnectButton({
    nodeCount: 3,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: false,
    chainMissingPairs: 2,
    chainConnectedPairs: 0,
  });
  assert.equal(result.kind, 'CONNECT');
  assert.equal(result.label, 'Connect (2)');
  assert.equal(result.enabled, true);
  assert.equal(result.hint, undefined);
});

// ---------------------------------------------------------------------------
// T10: 노드 4개, missing=2, connected=1 -> { kind:'CONNECT', label:'Connect (2)', enabled:true, hint:'1 already connected' }
// ---------------------------------------------------------------------------
runTest('T10 — 노드 4개, missing=2, connected=1', () => {
  const result = getConnectButton({
    nodeCount: 4,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: false,
    chainMissingPairs: 2,
    chainConnectedPairs: 1,
  });
  assert.equal(result.kind, 'CONNECT');
  assert.equal(result.label, 'Connect (2)');
  assert.equal(result.enabled, true);
  assert.equal(result.hint, '1 already connected');
});

// ---------------------------------------------------------------------------
// T11: 노드 3개, missing=0, connected=2 -> { kind:'CONNECTED', label:'Connected', enabled:false }
// ---------------------------------------------------------------------------
runTest('T11 — 노드 3개, missing=0, connected=2', () => {
  const result = getConnectButton({
    nodeCount: 3,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: false,
    chainMissingPairs: 0,
    chainConnectedPairs: 2,
  });
  assert.equal(result.kind, 'CONNECTED');
  assert.equal(result.label, 'Connected');
  assert.equal(result.enabled, false);
});

// ---------------------------------------------------------------------------
// T12: 노드 3개, hasStart=false, hasEnd=false, missing=1 -> enabled:true (기즈모 무관 확인)
// ---------------------------------------------------------------------------
runTest('T12 — 노드 3개, hasStart=false, hasEnd=false, missing=1', () => {
  const result = getConnectButton({
    nodeCount: 3,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: false,
    chainMissingPairs: 1,
    chainConnectedPairs: 1,
  });
  assert.equal(result.kind, 'CONNECT');
  assert.equal(result.label, 'Connect (1)');
  assert.equal(result.enabled, true);
});

// ---------------------------------------------------------------------------
// T13: 노드 3개, chainMissingPairs 미전달(undefined) -> { kind:'NONE', enabled:false }
// ---------------------------------------------------------------------------
runTest('T13 — 노드 3개, chainMissingPairs 미전달(undefined)', () => {
  const result = getConnectButton({
    nodeCount: 3,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: true,
    hasEnd: true,
    hasExistingConnection: false,
    chainMissingPairs: undefined,
  });
  assert.equal(result.kind, 'NONE');
  assert.equal(result.label, 'Connect');
  assert.equal(result.enabled, false);
});

// ---------------------------------------------------------------------------
// T14: 노드 3개 이상 + hasExistingConnection=true 이고 missing=1 -> hasExistingConnection 무시하고 CONNECT
// ---------------------------------------------------------------------------
runTest('T14 — 노드 3개 이상 + hasExistingConnection=true 이고 missing=1', () => {
  const result = getConnectButton({
    nodeCount: 3,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: true,
    chainMissingPairs: 1,
    chainConnectedPairs: 1,
  });
  assert.equal(result.kind, 'CONNECT');
  assert.equal(result.label, 'Connect (1)');
  assert.equal(result.enabled, true);
});

// ---------------------------------------------------------------------------
// T15: isAllConnectors=true 이면 nodeCount/hasExistingConnection 값과 무관하게 UPDATE
// ---------------------------------------------------------------------------
runTest('T15 — isAllConnectors=true 이면 다른 값과 무관하게 UPDATE', () => {
  const result = getConnectButton({
    nodeCount: 5,
    isAllConnectors: true,
    connectorCount: 2,
    hasStart: false,
    hasEnd: false,
    hasExistingConnection: true,
    chainMissingPairs: 0,
    chainConnectedPairs: 4,
  });
  assert.equal(result.kind, 'UPDATE');
  assert.equal(result.label, 'Update Connectors');
  assert.equal(result.enabled, true);
});

// ---------------------------------------------------------------------------
// T16: 노드 선택(isAllConnectors=false) 입력들 중 어떤 것도 kind:'UPDATE' 를 반환하지 않음
// ---------------------------------------------------------------------------
runTest('T16 — 노드 선택(isAllConnectors=false) 입력들 중 어떤 것도 UPDATE를 반환하지 않음', () => {
  const nodeInputs = [
    { nodeCount: 0, isAllConnectors: false, connectorCount: 0, hasStart: false, hasEnd: false, hasExistingConnection: false },
    { nodeCount: 1, isAllConnectors: false, connectorCount: 0, hasStart: true, hasEnd: true, hasExistingConnection: false },
    { nodeCount: 2, isAllConnectors: false, connectorCount: 0, hasStart: false, hasEnd: false, hasExistingConnection: false },
    { nodeCount: 2, isAllConnectors: false, connectorCount: 0, hasStart: true, hasEnd: false, hasExistingConnection: false },
    { nodeCount: 2, isAllConnectors: false, connectorCount: 0, hasStart: true, hasEnd: true, hasExistingConnection: false },
    { nodeCount: 2, isAllConnectors: false, connectorCount: 0, hasStart: true, hasEnd: true, hasExistingConnection: true },
    { nodeCount: 3, isAllConnectors: false, connectorCount: 0, hasStart: false, hasEnd: false, hasExistingConnection: false, chainMissingPairs: 2, chainConnectedPairs: 0 },
    { nodeCount: 4, isAllConnectors: false, connectorCount: 0, hasStart: false, hasEnd: false, hasExistingConnection: false, chainMissingPairs: 2, chainConnectedPairs: 1 },
    { nodeCount: 3, isAllConnectors: false, connectorCount: 0, hasStart: false, hasEnd: false, hasExistingConnection: false, chainMissingPairs: 0, chainConnectedPairs: 2 },
    { nodeCount: 3, isAllConnectors: false, connectorCount: 0, hasStart: false, hasEnd: false, hasExistingConnection: false, chainMissingPairs: 1, chainConnectedPairs: 1 },
    { nodeCount: 3, isAllConnectors: false, connectorCount: 0, hasStart: true, hasEnd: true, hasExistingConnection: false, chainMissingPairs: undefined },
    { nodeCount: 3, isAllConnectors: false, connectorCount: 0, hasStart: false, hasEnd: false, hasExistingConnection: true, chainMissingPairs: 1, chainConnectedPairs: 1 },
  ];

  for (const input of nodeInputs) {
    const res = getConnectButton(input);
    assert.notEqual(res.kind, 'UPDATE', `node input must not produce UPDATE: ${JSON.stringify(input)}`);
  }
});

// ---------------------------------------------------------------------------
// T17: 같은 입력 2회 호출 시 결과 동일, 입력 객체가 변경되지 않음
// ---------------------------------------------------------------------------
runTest('T17 — 순수 함수 불변성: 2회 호출 동일 결과 및 입력 객체 미변경', () => {
  const input = {
    nodeCount: 4,
    isAllConnectors: false,
    connectorCount: 0,
    hasStart: true,
    hasEnd: true,
    hasExistingConnection: false,
    chainMissingPairs: 2,
    chainConnectedPairs: 1,
  };
  const snapshot = JSON.stringify(input);

  const res1 = getConnectButton(input);
  const res2 = getConnectButton(input);

  assert.deepEqual(res1, res2);
  assert.equal(JSON.stringify(input), snapshot, 'input object must not be mutated');
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
