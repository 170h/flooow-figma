#!/usr/bin/env node
/**
 * presetStore.test.mjs — Preset Envelope Regression Test
 *
 * 중요: src/presetStore.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 * 사용자 프리셋 영속화 규칙을 검증한다:
 * - 구형 plain array 읽기 (savedAt = 0 마이그레이션)
 * - envelope 파싱 및 무효값 거부
 * - newer-wins 병합 규칙
 */

import assert from 'node:assert/strict';
import {
  parsePresetEnvelope,
  isStoredNewer,
  makePresetEnvelope,
  PRESET_STORAGE_KEYS,
  PRESET_LOCAL_KEYS,
} from '../src/presetStore.ts';

console.log('=== presetStore.test.mjs — Repository Regression Test ===');

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

runTest('저장소 키 상수 고정 (Core·UI 드리프트 방지)', () => {
  assert.deepEqual(PRESET_STORAGE_KEYS, { style: 'flooow_style_presets', size: 'flooow_size_presets' });
  assert.deepEqual(PRESET_LOCAL_KEYS, { style: 'ui_flow_style_presets', size: 'ui_flow_size_presets' });
});

runTest('구형 plain array → savedAt 0 envelope', () => {
  const items = [{ id: 'a' }];
  const env = parsePresetEnvelope(items);
  assert.deepEqual(env, { savedAt: 0, items });
});

runTest('구형 빈 array → null (기본값 유지)', () => {
  assert.equal(parsePresetEnvelope([]), null);
});

runTest('envelope 그대로 통과 (savedAt 내림)', () => {
  const env = parsePresetEnvelope({ savedAt: 123.9, items: [{ id: 'a' }] });
  assert.deepEqual(env, { savedAt: 123, items: [{ id: 'a' }] });
});

runTest('무효값 거부 → null', () => {
  assert.equal(parsePresetEnvelope(null), null);
  assert.equal(parsePresetEnvelope(undefined), null);
  assert.equal(parsePresetEnvelope('str'), null);
  assert.equal(parsePresetEnvelope(42), null);
  assert.equal(parsePresetEnvelope({}), null);
  assert.equal(parsePresetEnvelope({ savedAt: 'x', items: [{ id: 'a' }] }), null);
  assert.equal(parsePresetEnvelope({ savedAt: 5, items: [] }), null);
  assert.equal(parsePresetEnvelope({ savedAt: 5 }), null);
});

runTest('newer-wins: 클 때만 true', () => {
  assert.equal(isStoredNewer(0, { savedAt: 1, items: [{ id: 'a' }] }), true);
  assert.equal(isStoredNewer(5, { savedAt: 5, items: [{ id: 'a' }] }), false);
  assert.equal(isStoredNewer(9, { savedAt: 5, items: [{ id: 'a' }] }), false);
  assert.equal(isStoredNewer(0, null), false);
  assert.equal(isStoredNewer(0, undefined), false);
});

runTest('makePresetEnvelope 형태 (savedAt 숫자 + items 동일 참조)', () => {
  const items = [{ id: 'a' }];
  const env = makePresetEnvelope(items);
  assert.equal(typeof env.savedAt, 'number');
  assert.ok(env.savedAt > 0);
  assert.equal(env.items, items);
});

runTest('JSON 왕복 후에도 파싱 가능 (clientStorage 저장 형태)', () => {
  const env = makePresetEnvelope([{ id: 'a' }, { id: 'b' }]);
  const revived = parsePresetEnvelope(JSON.parse(JSON.stringify(env)));
  assert.deepEqual(revived, env);
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
