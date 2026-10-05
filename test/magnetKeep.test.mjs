#!/usr/bin/env node
/**
 * 드래그 시 magnet 유지 정책.
 * 자동은 관통·방향 반전·주축 불일치·포트 겹침 시 최적 쌍으로 떨어진다.
 * 수동(isManual)은 앵커 이동량이 임계를 넘거나 관통·방향 반전(완화)일 때만 해제된다.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  canKeepMagnetPair,
  getManualBaseDelta,
  getOptimalMagnetPair,
  isManualDirectionReversed,
  isRelativeDirectionReversed,
  manualDisplacement,
  MANUAL_MOVE_THRESHOLD,
  resolveMagnetPair,
} from '../src/customConnector.ts';

console.log('=== magnetKeep.test.mjs — 드래그 시 현재 magnet 유지 ===');

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

const sideBySide = {
  src: { x: 0, y: 0, width: 100, height: 80 },
  tgt: { x: 220, y: 0, width: 100, height: 80 },
};

runTest('가로 배치 TOP→TOP 자동은 주축 불일치로 최적 쌍을 쓴다', () => {
  const optimal = getOptimalMagnetPair(sideBySide.src, sideBySide.tgt);
  assert.notEqual(`${optimal.sourceMagnet}-${optimal.targetMagnet}`, 'TOP-TOP');
  assert.equal(canKeepMagnetPair(sideBySide.src, sideBySide.tgt, 'TOP', 'TOP'), true);

  const resolved = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
    sourceMagnet: 'TOP',
    targetMagnet: 'TOP',
  });
  assert.equal(resolved.kept, false);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
});

runTest('RIGHT→LEFT 정상 대향도 유지', () => {
  const resolved = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'LEFT',
  });
  assert.equal(resolved.kept, true);
  assert.equal(resolved.sourceMagnet, 'RIGHT');
  assert.equal(resolved.targetMagnet, 'LEFT');
});

runTest('도착 노드를 관통하는 L자 경로만 최적 쌍으로 fallback', () => {
  const src = { x: 0, y: 0, width: 100, height: 100 };
  const tgt = { x: 150, y: 40, width: 100, height: 100 };
  assert.equal(canKeepMagnetPair(src, tgt, 'RIGHT', 'TOP'), false);

  const resolved = resolveMagnetPair({
    srcBox: src,
    tgtBox: tgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'TOP',
  });
  assert.equal(resolved.kept, false);
  assert.notEqual(`${resolved.sourceMagnet}-${resolved.targetMagnet}`, 'RIGHT-TOP');
  const optimal = getOptimalMagnetPair(src, tgt);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
  assert.equal(canKeepMagnetPair(src, tgt, resolved.sourceMagnet, resolved.targetMagnet), true);
});

runTest('magnet이 없으면 신규 연결과 같이 최적 쌍을 선택', () => {
  const resolved = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
  });
  const optimal = getOptimalMagnetPair(sideBySide.src, sideBySide.tgt);
  assert.equal(resolved.kept, false);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
});

runTest('AUTO는 고정 magnet이 아니므로 fallback', () => {
  const resolved = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
    sourceMagnet: 'AUTO',
    targetMagnet: 'AUTO',
  });
  const optimal = getOptimalMagnetPair(sideBySide.src, sideBySide.tgt);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
});

const crossing = {
  src: { x: 0, y: 0, width: 100, height: 100 },
  tgt: { x: 150, y: 40, width: 100, height: 100 },
};

runTest('gizmo 수동 magnet + 정상 경로 → 유지', () => {
  const base = getManualBaseDelta(sideBySide.src, sideBySide.tgt);
  const resolved = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
    sourceMagnet: 'TOP',
    targetMagnet: 'TOP',
    isManual: true,
    manualBaseDx: base.dx,
    manualBaseDy: base.dy,
  });
  assert.equal(resolved.kept, true);
  assert.equal(resolved.sourceMagnet, 'TOP');
  assert.equal(resolved.targetMagnet, 'TOP');
});

runTest('gizmo로 지정한 magnet + 노드 관통 → 최적 magnet으로 변경', () => {
  assert.equal(canKeepMagnetPair(crossing.src, crossing.tgt, 'RIGHT', 'TOP'), false);
  const resolved = resolveMagnetPair({
    srcBox: crossing.src,
    tgtBox: crossing.tgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'TOP',
  });
  const optimal = getOptimalMagnetPair(crossing.src, crossing.tgt);
  assert.equal(resolved.kept, false);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
  assert.notEqual(`${resolved.sourceMagnet}-${resolved.targetMagnet}`, 'RIGHT-TOP');
});

runTest('자동 magnet + 정상 경로 → 유지', () => {
  const resolved = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'LEFT',
  });
  assert.equal(resolved.kept, true);
  assert.equal(resolved.sourceMagnet, 'RIGHT');
  assert.equal(resolved.targetMagnet, 'LEFT');
});

runTest('자동 magnet + 노드 관통 → 최적 magnet으로 변경', () => {
  const resolved = resolveMagnetPair({
    srcBox: crossing.src,
    tgtBox: crossing.tgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'TOP',
  });
  const optimal = getOptimalMagnetPair(crossing.src, crossing.tgt);
  assert.equal(resolved.kept, false);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
});

runTest('자동은 더 짧은 쌍이 있으면 주축 불일치로 최적 쌍을 쓴다', () => {
  const optimal = getOptimalMagnetPair(sideBySide.src, sideBySide.tgt);
  assert.notEqual(`${optimal.sourceMagnet}-${optimal.targetMagnet}`, 'TOP-TOP');
  assert.equal(canKeepMagnetPair(sideBySide.src, sideBySide.tgt, 'TOP', 'TOP'), true);
  const resolved = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
    sourceMagnet: 'TOP',
    targetMagnet: 'TOP',
  });
  assert.equal(resolved.kept, false);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
});

runTest('forceOptimal은 유효한 magnet도 최적 쌍으로 교체', () => {
  const resolved = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
    sourceMagnet: 'TOP',
    targetMagnet: 'TOP',
    forceOptimal: true,
  });
  const optimal = getOptimalMagnetPair(sideBySide.src, sideBySide.tgt);
  assert.equal(resolved.kept, false);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
});

runTest('수동 magnet은 앵커 대비 120px 이상 움직이면 최적 쌍으로 해제된다', () => {
  const src = { x: 0, y: 0, width: 100, height: 80 };
  const near = { x: 130, y: -12, width: 100, height: 80 };
  const base = getManualBaseDelta(src, near);
  const far = { x: near.x, y: near.y + MANUAL_MOVE_THRESHOLD + 20, width: 100, height: 80 };
  assert.ok(manualDisplacement(src, far, base.dx, base.dy) > MANUAL_MOVE_THRESHOLD);
  const resolved = resolveMagnetPair({
    srcBox: src,
    tgtBox: far,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'LEFT',
    isManual: true,
    manualBaseDx: base.dx,
    manualBaseDy: base.dy,
  });
  const optimal = getOptimalMagnetPair(src, far);
  assert.equal(resolved.kept, false);
  assert.equal(resolved.sourceMagnet, optimal.sourceMagnet);
  assert.equal(resolved.targetMagnet, optimal.targetMagnet);
});

runTest('수동 magnet은 작은 이동에는 겹친 포트라도 유지하고 관통하면 해제된다', () => {
  const overlapSrc = { x: 0, y: 0, width: 300, height: 80 };
  const overlapTgt = { x: 180, y: 100, width: 200, height: 80 };
  const base = getManualBaseDelta(overlapSrc, overlapTgt);
  const kept = resolveMagnetPair({
    srcBox: overlapSrc,
    tgtBox: overlapTgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'LEFT',
    isManual: true,
    manualBaseDx: base.dx,
    manualBaseDy: base.dy,
  });
  assert.equal(kept.kept, true);
  const crossBase = getManualBaseDelta(crossing.src, crossing.tgt);
  const crossed = resolveMagnetPair({
    srcBox: crossing.src,
    tgtBox: crossing.tgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'TOP',
    isManual: true,
    manualBaseDx: crossBase.dx,
    manualBaseDy: crossBase.dy,
  });
  assert.equal(crossed.kept, false);
});

runTest('수동 방향 반전은 자동보다 큰 dead zone으로 판단한다', () => {
  const src = { x: 0, y: 0, width: 100, height: 80 };
  const target = { x: -80, y: 0, width: 100, height: 80 };
  assert.equal(isRelativeDirectionReversed(src, target, 'RIGHT', 'LEFT'), true);
  assert.equal(isManualDirectionReversed(src, target, 'RIGHT', 'LEFT'), false);
  const anchor = getManualBaseDelta(src, target);
  const resolved = resolveMagnetPair({
    srcBox: src,
    tgtBox: target,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'LEFT',
    isManual: true,
    manualBaseDx: anchor.dx,
    manualBaseDy: anchor.dy,
  });
  assert.equal(resolved.kept, true);
});

runTest('앵커 없는 레거시 수동은 길이 비율로 해제된다', () => {
  const overlapSrc = { x: 0, y: 0, width: 300, height: 80 };
  const overlapTgt = { x: 180, y: 100, width: 200, height: 80 };
  const bad = resolveMagnetPair({
    srcBox: overlapSrc,
    tgtBox: overlapTgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'LEFT',
    isManual: true,
  });
  const optimal = getOptimalMagnetPair(overlapSrc, overlapTgt);
  assert.equal(bad.kept, false);
  assert.equal(bad.sourceMagnet, optimal.sourceMagnet);
  assert.equal(bad.targetMagnet, optimal.targetMagnet);
  const good = resolveMagnetPair({
    srcBox: sideBySide.src,
    tgtBox: sideBySide.tgt,
    sourceMagnet: 'RIGHT',
    targetMagnet: 'LEFT',
    isManual: true,
  });
  assert.equal(good.kept, true);
});

runTest('드래그 갱신은 중복 틱·불필요 reorder·라벨 이동을 건너뛴다 (티어링 완화)', () => {
  const source = fs.readFileSync('src/customConnector.ts', 'utf8');
  const customStart = source.indexOf('export async function updateOrthogonalVectorConnector');
  const tailStart = source.indexOf('export function copyConnectorData');
  const body = source.slice(customStart, tailStart);
  assert.match(body, /appliedConnectorSnapshots\.get\(rootNode\.id\) === dragCacheKey/);
  assert.match(body, /appliedConnectorSnapshots\.set\(rootNode\.id, dragCacheKey\)/);
  assert.match(body, /siblings\[siblings\.length - 1\]\.id !== rootNode\.id/);
  assert.match(body, /labelNeedsMove\(labelFrame, midSegmentPoint\)/);
  assert.match(body, /prevVertical !== isVertical/);
});

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) process.exit(1);
