#!/usr/bin/env node
/**
 * gizmoState.test.mjs — 선택 대상 사이의 Connector 기준 Gizmo 상태 (0=default, 1=active, 2+=mixed) Regression Test
 *
 * 중요: src/ui/utils/gizmoState.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 */

import assert from 'node:assert/strict';
import {
  buildEndpointMagnetPatches,
  computeGizmoMagnets,
  isEndpointMagnetDraftDirty,
  isGizmoDraftDirty,
} from '../src/ui/utils/gizmoState.ts';

console.log('=== gizmoState.test.mjs — Gizmo State (0=default, 1=active, 2+=mixed) Regression Test ===');

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
// Test 1 — 선택된 두 노드 사이 connector 0개: ALL default
// ---------------------------------------------------------------------------
runTest('Test 1 — 선택된 두 노드 사이 connector 0개: Start와 End 모두 ALL default (fallback 무시)', () => {
  const result = computeGizmoMagnets({
    hasExistingConnection: false,
    connectedConnectors: [],
    fallbackSourceMagnet: 'RIGHT',
    fallbackTargetMagnet: 'LEFT',
  });

  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.RIGHT, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
  assert.equal(result.end.magnetStates.LEFT, 'default');
});

// ---------------------------------------------------------------------------
// Test 2 — 선택된 두 노드 사이 connector 1개: Start 해당 magnet = active, End 해당 magnet = active
// ---------------------------------------------------------------------------
runTest('Test 2 — 선택된 두 노드 사이 connector 1개: Start RIGHT = active, End LEFT = active, 나머지 default', () => {
  const result = computeGizmoMagnets({
    hasExistingConnection: true,
    connectedConnectors: [
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
    ],
  });

  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 3 — 선택된 두 노드 사이 동일 방향 connector 2개: 해당 방향 = mixed
// ---------------------------------------------------------------------------
runTest('Test 3 — 선택된 두 노드 사이 동일 방향 connector 2개: Start RIGHT = mixed, End LEFT = mixed', () => {
  const result = computeGizmoMagnets({
    hasExistingConnection: true,
    connectedConnectors: [
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
    ],
  });

  assert.equal(result.start.magnetStates.RIGHT, 'mixed');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 4 — 선택된 두 노드 사이 동일 방향 connector 3개: 해당 방향 = mixed
// ---------------------------------------------------------------------------
runTest('Test 4 — 선택된 두 노드 사이 동일 방향 connector 3개: Start RIGHT = mixed, End LEFT = mixed', () => {
  const result = computeGizmoMagnets({
    hasExistingConnection: true,
    connectedConnectors: [
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
    ],
  });

  assert.equal(result.start.magnetStates.RIGHT, 'mixed');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'default');
});

// ---------------------------------------------------------------------------
// Test 5 — 선택된 두 노드 사이: RIGHT 1개, TOP 1개 -> 둘 다 active
// ---------------------------------------------------------------------------
runTest('Test 5 — 선택된 두 노드 사이: Start RIGHT 1개 + TOP 1개 -> Start RIGHT active, TOP active', () => {
  const result = computeGizmoMagnets({
    hasExistingConnection: true,
    connectedConnectors: [
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
      { sourceMagnet: 'TOP', targetMagnet: 'BOTTOM', isReversed: false },
    ],
  });

  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'active');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.BOTTOM, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
});

// ---------------------------------------------------------------------------
// Test 6 — 선택된 두 노드 사이: RIGHT 2개, TOP 1개 -> RIGHT mixed, TOP active
// ---------------------------------------------------------------------------
runTest('Test 6 — 선택된 두 노드 사이: Start RIGHT 2개 + TOP 1개 -> RIGHT mixed, TOP active', () => {
  const result = computeGizmoMagnets({
    hasExistingConnection: true,
    connectedConnectors: [
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
      { sourceMagnet: 'TOP', targetMagnet: 'BOTTOM', isReversed: false },
    ],
  });

  assert.equal(result.start.magnetStates.RIGHT, 'mixed');
  assert.equal(result.start.magnetStates.TOP, 'active');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.BOTTOM, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
});

// ---------------------------------------------------------------------------
// Test 7 — 가장 중요: 외부 connector가 존재해도 A와 B 사이 커넥터만 보고 판정
// ---------------------------------------------------------------------------
runTest('Test 7 — 가장 중요: C->A, A->D 등 외부 커넥터가 있어도 A-B 사이가 1개면 A 해당 방향은 active (mixed 아님)', () => {
  // A와 B를 선택했을 때 code.ts는 오직 A-B 사이의 커넥터 1개만 connectedConnectors로 전달한다.
  const result = computeGizmoMagnets({
    hasExistingConnection: true,
    connectedConnectors: [
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
    ],
  });

  // A(Start)의 RIGHT는 active (외부 커넥터 때문에 mixed가 되지 않음)
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  // B(End)의 LEFT는 active
  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 8 — Connector 1개 직접 선택
// ---------------------------------------------------------------------------
runTest('Test 8 — Connector 1개 직접 선택: Start RIGHT = active, End LEFT = active', () => {
  const result = computeGizmoMagnets({
    isSingleConnector: true,
    connectorNodes: [
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'LEFT' },
    ],
  });

  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
});

// ---------------------------------------------------------------------------
// Test 9 — Connector 2개 직접 선택 (동일 엔드포인트 방향으로 통일)
// ---------------------------------------------------------------------------
runTest('Test 9 — Connector 2개 직접 선택 (동일 엔드포인트 방향으로 통일): Start RIGHT = active, End LEFT = active', () => {
  const result = computeGizmoMagnets({
    isMultiConnector: true,
    connectorNodes: [
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'LEFT' },
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'LEFT' },
    ],
  });

  // Start: 둘 다 RIGHT로 통일 -> active
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');
  // End: 둘 다 LEFT로 통일 -> active
  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
});

// ---------------------------------------------------------------------------
// Test 10 — 역방향(isReversed=true) 커넥터 1개
// ---------------------------------------------------------------------------
runTest('Test 10 — 역방향(isReversed=true) 커넥터 1개: Start LEFT = active, End RIGHT = active', () => {
  // 실제 커넥터 물리 기준: Node2(source) = RIGHT, Node1(target) = LEFT, isReversed = true
  const result = computeGizmoMagnets({
    hasExistingConnection: true,
    connectedConnectors: [
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: true },
    ],
  });

  assert.equal(result.start.magnetStates.LEFT, 'active');
  assert.equal(result.start.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'active');
  assert.equal(result.end.magnetStates.LEFT, 'default');
});

// ---------------------------------------------------------------------------
// Test 11 — 사용자가 기즈모를 명시적으로 클릭한 경우 (userPending 우선순위)
// ---------------------------------------------------------------------------
runTest('Test 11 — 사용자가 기즈모를 명시적으로 클릭한 경우 해당 위치 active 표시', () => {
  const result = computeGizmoMagnets({
    hasExistingConnection: true,
    connectedConnectors: [
      { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT', isReversed: false },
    ],
    userPendingSourceMagnet: 'BOTTOM',
  });

  assert.equal(result.start.magnetStates.BOTTOM, 'active');
  assert.equal(result.start.magnetStates.RIGHT, 'default');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 12 — 3+ Node 선택, 연결 커넥터 0개: ALL default
// ---------------------------------------------------------------------------
runTest('Test 12 — 3+ Node 선택, 커넥터 0개: Start/More 모두 ALL default', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [],
  });

  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.RIGHT, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
  assert.equal(result.end.magnetStates.LEFT, 'default');
});

// ---------------------------------------------------------------------------
// Test 13 — 3+ Node 선택: A->B 1개만 연결, C는 미연결 (전체 연결 1개 -> 해당 방향 Active)
// ---------------------------------------------------------------------------
runTest('Test 13 — 3+ Node 선택: A->B 1개 연결, C 미연결 -> Start RIGHT active, End LEFT active (전체 1개씩)', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
    ],
  });

  // Start (A): 전체 1개 -> RIGHT active
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');

  // End (B, C): More 그룹 전체 연결 1개 (B의 LEFT) -> LEFT active
  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 14 — 3+ Node 선택: A->B, B->C 연속 체인 (Start 1개: Active, End/More 2개: Mixed)
// ---------------------------------------------------------------------------
runTest('Test 14 — 3+ Node 선택: A->B->C 연속 체인 -> Start RIGHT active, End/More LEFT/RIGHT mixed (전체 2개 이상)', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
      { sourceId: 'B', targetId: 'C', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
    ],
  });

  // Start (A): A->B 전체 1개 -> RIGHT active
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');

  // End / More: More 그룹 전체 2개 이상 연결 -> 존재하는 방향(LEFT, RIGHT) 모두 mixed
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 15 — A->B, B->C의 source/target endpoint가 Start에 중복 표시되지 않는지 명시적 검증
// ---------------------------------------------------------------------------
runTest('Test 15 — Start 노드에는 오직 startNodeId의 source endpoint 하나만 사용되고 타깃/타 노드 endpoint가 중복되지 않음', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
      { sourceId: 'B', targetId: 'C', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
    ],
  });

  // Start의 활성 마그넷은 RIGHT 단 1개뿐이어야 함
  assert.equal(result.start.totalConnections, 1);
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 16 — 3+ Node 선택: Start(A) 미연결, More 간 C->D 연결만 존재 (More 전체 2개 방향 -> Mixed)
// ---------------------------------------------------------------------------
runTest('Test 16 — 3+ Node 선택: Start(A) 미연결, C->D 연결만 존재 -> Start default, More BOTTOM/TOP mixed', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'C', targetId: 'D', sourceMagnet: 'BOTTOM', targetMagnet: 'TOP' },
    ],
  });

  // Start (A): 미연결 -> ALL default
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.RIGHT, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  // More (B, C, D): C의 BOTTOM(1개) + D의 TOP(1개) = More 전체 연결 2개 -> 둘 다 mixed
  assert.equal(result.end.magnetStates.BOTTOM, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.LEFT, 'default');
});

// ---------------------------------------------------------------------------
// Test 17 — 3+ Node 선택: Start 노드 A에 동일 방향 2개 연결 (A->B: RIGHT, A->C: RIGHT)
// ---------------------------------------------------------------------------
runTest('Test 17 — 3+ Node 선택: Start 노드 A에 2개 연결 (모두 RIGHT로 통일) -> Start RIGHT active', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
      { sourceId: 'A', targetId: 'C', sourceMagnet: 'RIGHT', targetMagnet: 'TOP' },
    ],
  });

  // Start (A): 개수는 2개지만 방향이 RIGHT 1곳으로 통일됨 -> active
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');

  // More (B, C): More는 LEFT와 TOP으로 2곳 흩어져 있음 -> LEFT mixed, TOP mixed
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 18 — 3+ Node 선택 시 사용자 클릭(userPending) 우선 반영
// ---------------------------------------------------------------------------
runTest('Test 18 — 3+ Node 선택 시 userPending 우선 반영', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
    ],
    userPendingSourceMagnet: 'TOP',
    userPendingTargetMagnet: 'BOTTOM',
  });

  assert.equal(result.start.magnetStates.TOP, 'active');
  assert.equal(result.start.magnetStates.RIGHT, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'active');
  assert.equal(result.end.magnetStates.LEFT, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.TOP, 'default');
});

// ---------------------------------------------------------------------------
// Test 19 — 3+ Node 선택: A->B, B->C에서 multiNodeConnectors.length = 2
// ---------------------------------------------------------------------------
runTest('Test 19 — 3+ Node 선택: A->B, B->C (multiNodeConnectors 2개) -> Start RIGHT active, End LEFT mixed & RIGHT mixed', () => {
  const multiNodeConnectors = [
    { id: 'conn-1', sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
    { id: 'conn-2', sourceId: 'B', targetId: 'C', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
  ];
  assert.equal(multiNodeConnectors.length, 2);

  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors,
  });

  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');

  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Test 20 — 3+ Node 선택 + 커넥터가 selection에 함께 포함된 경우
// ---------------------------------------------------------------------------
runTest('Test 20 — 3+ Node + 커넥터 포함 selection 상태에서도 multiNodeConnectors 정상 계산 및 방향 보존', () => {
  const multiNodeConnectors = [
    { id: 'conn-1', sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
    { id: 'conn-2', sourceId: 'B', targetId: 'C', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
  ];

  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors,
  });

  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'mixed');
});

// ---------------------------------------------------------------------------
// Case A ~ Case D 명시적 요구사항 검증
// ---------------------------------------------------------------------------
runTest('Case A — 전체 연결 1개 -> 해당 방향 Active', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
    ],
  });
  // Start: 전체 1개 (RIGHT) -> Active
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');

  // End/More: 전체 1개 (LEFT) -> Active
  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

runTest('Case B — 전체 연결 2개, 서로 다른 방향 -> 두 방향 모두 Mixed', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
      { sourceId: 'A', targetId: 'C', sourceMagnet: 'BOTTOM', targetMagnet: 'TOP' },
    ],
  });
  // Start: 전체 2개 (RIGHT, BOTTOM) -> 두 방향 모두 Mixed
  assert.equal(result.start.magnetStates.RIGHT, 'mixed');
  assert.equal(result.start.magnetStates.BOTTOM, 'mixed');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  // End/More: 전체 2개 (LEFT, TOP) -> 두 방향 모두 Mixed
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

runTest('Case C — 전체 연결 4개, LEFT/RIGHT/TOP/BOTTOM 각각 1개 -> 네 방향 모두 Mixed', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'TOP', targetMagnet: 'BOTTOM' },
      { sourceId: 'A', targetId: 'C', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
      { sourceId: 'A', targetId: 'D', sourceMagnet: 'BOTTOM', targetMagnet: 'TOP' },
      { sourceId: 'A', targetId: 'E', sourceMagnet: 'LEFT', targetMagnet: 'RIGHT' },
    ],
  });
  // Start: 4개 연결이 TOP, RIGHT, BOTTOM, LEFT에 각각 1개 -> 네 방향 모두 Mixed
  assert.equal(result.start.magnetStates.TOP, 'mixed');
  assert.equal(result.start.magnetStates.RIGHT, 'mixed');
  assert.equal(result.start.magnetStates.BOTTOM, 'mixed');
  assert.equal(result.start.magnetStates.LEFT, 'mixed');

  // End/More: 4개 연결이 BOTTOM, LEFT, TOP, RIGHT에 각각 1개 -> 네 방향 모두 Mixed
  assert.equal(result.end.magnetStates.TOP, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'mixed');
  assert.equal(result.end.magnetStates.BOTTOM, 'mixed');
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
});

runTest('Case D — 전체 연결 2개가 동일 방향 (통일됨) -> 해당 방향 Active', () => {
  const result = computeGizmoMagnets({
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { sourceId: 'A', targetId: 'B', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
      { sourceId: 'A', targetId: 'C', sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' },
    ],
  });
  // Start: 둘 다 RIGHT로 방향 통일 -> RIGHT Active
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  // End/More: 둘 다 LEFT로 방향 통일 -> LEFT Active
  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
});

// ---------------------------------------------------------------------------
// Connector-only Multi-Selection 케이스 검증 (A ~ E)
// ---------------------------------------------------------------------------
runTest('Connector Multi Test A — Connector 1개: source 1개 active, target 1개 active', () => {
  const result = computeGizmoMagnets({
    isSingleConnector: true,
    isMultiConnector: false,
    connectorNodes: [
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'LEFT' },
    ],
  });

  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
});

runTest('Connector Multi Test B — Connector 2개, source/target 방향 각각 동일 (통일됨): 해당 방향 active', () => {
  const result = computeGizmoMagnets({
    isMultiConnector: true,
    connectorNodes: [
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'LEFT' },
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'LEFT' },
    ],
  });

  // Start: 2개 모두 RIGHT로 통일 -> active
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  // End: 2개 모두 LEFT로 통일 -> active
  assert.equal(result.end.magnetStates.LEFT, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
});

runTest('Connector Multi Test C — Connector 2개, source 방향 서로 다름, target 방향 동일: source는 둘 다 mixed, target은 1곳 통일 active', () => {
  const result = computeGizmoMagnets({
    isMultiConnector: true,
    connectorNodes: [
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'RIGHT' },
      { isConnector: true, connectorSourceMagnet: 'BOTTOM', connectorTargetMagnet: 'RIGHT' },
    ],
  });

  // Start: RIGHT와 BOTTOM 2곳으로 흩어짐 -> 둘 다 mixed, active 없음
  assert.equal(result.start.magnetStates.RIGHT, 'mixed');
  assert.equal(result.start.magnetStates.BOTTOM, 'mixed');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(Object.values(result.start.magnetStates).includes('active'), false);

  // End: 둘 다 RIGHT 1곳으로 통일 -> RIGHT active
  assert.equal(result.end.magnetStates.RIGHT, 'active');
  assert.equal(result.end.magnetStates.TOP, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
  assert.equal(result.end.magnetStates.LEFT, 'default');
});

runTest('Connector Multi Test D — Connector 2개, source 방향 동일, target 방향 서로 다름: source는 1곳 통일 active, target은 둘 다 mixed', () => {
  const result = computeGizmoMagnets({
    isMultiConnector: true,
    connectorNodes: [
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'LEFT' },
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'TOP' },
    ],
  });

  // Start: 둘 다 RIGHT 1곳으로 통일 -> RIGHT active
  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');

  // End: LEFT와 TOP 2곳으로 흩어짐 -> 둘 다 mixed, active 없음
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(result.end.magnetStates.BOTTOM, 'default');
  assert.equal(Object.values(result.end.magnetStates).includes('active'), false);
});

runTest('Connector Multi Test E — Connector 3개 이상: 각 그룹에서 사용된 방향은 mixed, active 없음', () => {
  const result = computeGizmoMagnets({
    isMultiConnector: true,
    connectorNodes: [
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'LEFT' },
      { isConnector: true, connectorSourceMagnet: 'BOTTOM', connectorTargetMagnet: 'TOP' },
      { isConnector: true, connectorSourceMagnet: 'TOP', connectorTargetMagnet: 'BOTTOM' },
    ],
  });

  // Start: RIGHT, BOTTOM, TOP 모두 mixed
  assert.equal(result.start.magnetStates.RIGHT, 'mixed');
  assert.equal(result.start.magnetStates.BOTTOM, 'mixed');
  assert.equal(result.start.magnetStates.TOP, 'mixed');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(Object.values(result.start.magnetStates).includes('active'), false);

  // End: LEFT, TOP, BOTTOM 모두 mixed
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'mixed');
  assert.equal(result.end.magnetStates.BOTTOM, 'mixed');
  assert.equal(result.end.magnetStates.RIGHT, 'default');
  assert.equal(Object.values(result.end.magnetStates).includes('active'), false);
});

runTest('Draft — Mixed Current에서 RIGHT를 고르면 RIGHT만 active이고 BOTTOM은 inactive', () => {
  const result = computeGizmoMagnets({
    isMultiConnector: true,
    connectorNodes: [
      { isConnector: true, connectorSourceMagnet: 'BOTTOM', connectorTargetMagnet: 'LEFT' },
      { isConnector: true, connectorSourceMagnet: 'BOTTOM', connectorTargetMagnet: 'LEFT' },
      { isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'TOP' },
    ],
    userPendingSourceMagnet: 'RIGHT',
  });

  assert.equal(result.start.magnetStates.RIGHT, 'active');
  assert.equal(result.start.magnetStates.BOTTOM, 'default');
  assert.equal(result.start.magnetStates.TOP, 'default');
  assert.equal(result.start.magnetStates.LEFT, 'default');
  assert.equal(result.end.magnetStates.LEFT, 'mixed');
  assert.equal(result.end.magnetStates.TOP, 'mixed');
});

runTest('Draft — 같은 방향이면 dirty가 아니고, 다른 방향이면 dirty', () => {
  assert.equal(isEndpointMagnetDraftDirty(['BOTTOM', 'BOTTOM'], 'BOTTOM'), false);
  assert.equal(isEndpointMagnetDraftDirty(['BOTTOM', 'RIGHT'], 'RIGHT'), true);
  assert.equal(isEndpointMagnetDraftDirty(['BOTTOM'], 'RIGHT'), true);
  assert.equal(isEndpointMagnetDraftDirty([], 'RIGHT'), false);
  assert.equal(isEndpointMagnetDraftDirty(['BOTTOM'], null), false);
});

runTest('Draft — 단일/복수 커넥터 패치는 Draft가 다른 endpoint만 바꾸고 Apply 전 값과 분리된다', () => {
  const base = {
    isMultiConnector: true,
    connectorNodes: [
      { id: 'a', isConnector: true, connectorSourceMagnet: 'BOTTOM', connectorTargetMagnet: 'LEFT', connectorIsReversed: false },
      { id: 'b', isConnector: true, connectorSourceMagnet: 'BOTTOM', connectorTargetMagnet: 'LEFT', connectorIsReversed: false },
      { id: 'c', isConnector: true, connectorSourceMagnet: 'RIGHT', connectorTargetMagnet: 'TOP', connectorIsReversed: true },
    ],
  };
  assert.equal(isGizmoDraftDirty({
    isSingleConnector: true,
    connectorNodes: [
      { id: 'only', isConnector: true, connectorSourceMagnet: 'BOTTOM', connectorTargetMagnet: 'LEFT' },
    ],
    userPendingSourceMagnet: 'BOTTOM',
  }), false);
  assert.deepEqual(buildEndpointMagnetPatches({
    isSingleConnector: true,
    connectorNodes: [
      { id: 'only', isConnector: true, connectorSourceMagnet: 'BOTTOM', connectorTargetMagnet: 'LEFT' },
    ],
    userPendingSourceMagnet: 'BOTTOM',
  }), []);

  const patches = buildEndpointMagnetPatches({ ...base, userPendingSourceMagnet: 'RIGHT' });
  assert.equal(patches.length, 3);
  assert.deepEqual(patches.map((p) => p.sourceMagnet), ['RIGHT', 'RIGHT', 'RIGHT']);
  assert.equal(patches.every((p) => p.targetMagnet === undefined), true);
  assert.equal(patches[2].isReversed, true);
});

runTest('Draft — 2노드 기존 연결은 시작 Draft만 보내고 끝 endpoint는 유지', () => {
  const patches = buildEndpointMagnetPatches({
    hasExistingConnection: true,
    connectedConnectors: [
      { id: 'ab', sourceMagnet: 'BOTTOM', targetMagnet: 'TOP', isReversed: false },
    ],
    userPendingSourceMagnet: 'RIGHT',
  });
  assert.deepEqual(patches, [{ id: 'ab', isReversed: false, sourceMagnet: 'RIGHT' }]);
});

runTest('Draft — 3+ 시작 Draft는 시작 노드 endpoint만 바꾸고 다른 노드를 active로 만들지 않는다', () => {
  const input = {
    is3PlusNodes: true,
    startNodeId: 'A',
    multiNodeConnectors: [
      { id: 'ab', sourceId: 'A', targetId: 'B', sourceMagnet: 'BOTTOM', targetMagnet: 'LEFT' },
      { id: 'ac', sourceId: 'A', targetId: 'C', sourceMagnet: 'RIGHT', targetMagnet: 'TOP' },
    ],
    userPendingSourceMagnet: 'RIGHT',
  };
  const visual = computeGizmoMagnets(input);
  assert.equal(visual.start.magnetStates.RIGHT, 'active');
  assert.equal(visual.start.magnetStates.BOTTOM, 'default');
  assert.equal(visual.end.magnetStates.LEFT, 'mixed');
  assert.equal(visual.end.magnetStates.TOP, 'mixed');
  assert.equal(visual.end.magnetStates.RIGHT, 'default');

  const patches = buildEndpointMagnetPatches(input);
  assert.deepEqual(patches, [
    { id: 'ab', sourceMagnet: 'RIGHT' },
    { id: 'ac', sourceMagnet: 'RIGHT' },
  ]);
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}


