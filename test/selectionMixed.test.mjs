#!/usr/bin/env node
/**
 * selectionMixed.test.mjs — 노드+커넥터 혼합 선택 요약 회귀 테스트.
 * - isMixedWithConnectors 판정 (1노드+커넥터 / 복수노드+커넥터 / 순수 선택은 false)
 * - 혼합 선택에서도 플로우 노드 기준 width/color/sizeMode 요약이 유지됨
 *   (Size/Style 섹션 Mixed 표시 + 스타일 모달 Apply의 표시 기반)
 *
 * 중요: src/ui/utils/selectionUtils.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 */
import assert from 'node:assert/strict';
import { analyzeSelection, getCommonProperty } from '../src/ui/utils/selectionUtils.ts';

console.log('=== selectionMixed.test.mjs — Mixed Selection Regression Test ===');

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

const flow = (over = {}) => ({
  id: 'n1',
  isFlowNode: true,
  isConnector: false,
  flowNodeType: 'Screen',
  nodeType: 'FRAME',
  fillColorHex: '#FFFFFF',
  strokeColorHex: '#000000',
  strokeWeight: 1.5,
  width: 250,
  height: 90,
  cornerRadius: 0,
  sizeMode: 'hug',
  ...over,
});

const conn = (over = {}) => ({
  id: 'c1',
  isFlowNode: false,
  isConnector: true,
  ...over,
});

runTest('1노드+커넥터 혼합: 플래그 true, 단일/복수 모두 false', () => {
  const s = analyzeSelection([flow(), conn({ id: 'c2' })]);
  assert.equal(s.isMixedWithConnectors, true);
  assert.equal(s.isMultiFlowNode, false);
  assert.equal(s.isSingleFlowNode, false);
  assert.equal(s.isSingleConnector, false);
  assert.equal(s.isMultiConnector, false);
});

runTest('1노드+커넥터 혼합: 노드 단일값 요약 유지 (Size/Style 표시 기반)', () => {
  const s = analyzeSelection([flow({ width: 300 }), conn({ id: 'c2' })]);
  assert.equal(s.width.isMixed, false);
  assert.equal(s.width.value, 300);
  assert.equal(s.color.isMixed, false);
  assert.equal(s.color.value, '#FFFFFF');
  assert.equal(s.sizeMode.isMixed, false);
  assert.equal(s.sizeMode.value, 'hug');
});

runTest('복수노드(상이 치수)+커넥터 혼합: width Mixed', () => {
  const s = analyzeSelection([
    flow({ id: 'n1', width: 250 }),
    flow({ id: 'n2', width: 300 }),
    conn({ id: 'c1' }),
  ]);
  assert.equal(s.isMixedWithConnectors, true);
  assert.equal(s.isMultiFlowNode, true);
  assert.equal(s.width.isMixed, true);
});

runTest('복수노드(동일 컬러)+커넥터 혼합: color 공통값 유지', () => {
  const s = analyzeSelection([
    flow({ id: 'n1', fillColorHex: '#FF0000' }),
    flow({ id: 'n2', fillColorHex: '#ff0000' }),
    conn({ id: 'c1' }),
  ]);
  assert.equal(s.color.isMixed, false);
  assert.equal(s.color.value, '#FF0000');
});

runTest('순수 선택에서는 플래그 false (단일노드/복수노드/커넥터만)', () => {  assert.equal(analyzeSelection([flow()]).isMixedWithConnectors, false);
  assert.equal(analyzeSelection([flow()]).isSingleFlowNode, true);
  const multi = analyzeSelection([flow({ id: 'n1' }), flow({ id: 'n2' })]);
  assert.equal(multi.isMixedWithConnectors, false);
  assert.equal(multi.isMultiFlowNode, true);
  const conns = analyzeSelection([conn({ id: 'c1' }), conn({ id: 'c2' })]);
  assert.equal(conns.isMixedWithConnectors, false);
  assert.equal(conns.isMultiConnector, true);
});

runTest('비-Screen 혼합(Process/Junction/Decision)+커넥터: 실제값 기준 width Mixed', () => {
  const nodes = [
    flow({ id: 'n1', flowNodeType: 'Process', width: 200, sizeMode: 'fixed' }),
    flow({ id: 'n2', flowNodeType: 'Junction', width: 120, sizeMode: 'fixed' }),
    flow({ id: 'n3', flowNodeType: 'Decision', width: 200, sizeMode: 'hug' }),
    conn({ id: 'c1' }),
  ];
  const s = analyzeSelection(nodes);
  assert.equal(s.isMixedWithConnectors, true);
  // 'size' 옵션 필터가 걸린 요약은 비-Screen 노드를 제외하므로 Mixed가 아님 (빈칸 버그의 원인)
  assert.equal(s.width.isMixed, false);
  // Size 섹션 표시용 실제값 판정(필터 없음)은 차이를 감지해야 함
  const flows = nodes.filter((n) => n && n.isFlowNode);
  assert.equal(getCommonProperty(flows, (n) => n.width).isMixed, true);
  assert.equal(getCommonProperty(flows, (n) => n.sizeMode).isMixed, true);
});

runTest('비-Screen 혼합(동일 치수): 실제값 기준 공통값 표시', () => {
  const nodes = [
    flow({ id: 'n1', flowNodeType: 'Process', width: 200 }),
    flow({ id: 'n2', flowNodeType: 'Process', width: 200 }),
    conn({ id: 'c1' }),
  ];
  const flows = nodes.filter((n) => n && n.isFlowNode);
  const w = getCommonProperty(flows, (n) => n.width);
  assert.equal(w.isMixed, false);
  assert.equal(w.value, 200);
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
