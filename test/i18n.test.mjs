#!/usr/bin/env node
/**
 * i18n.test.mjs — 토스트 메시지 카탈로그 회귀 테스트.
 * - resolveAppLocale 판정 (ko/en/빈값/대소문자)
 * - 모든 MESSAGE_KEYS가 ko/en 양쪽에 존재하고 비어 있지 않음
 * - {param} 치환 동작
 * - en 카탈로그에 한글 혼입 금지
 *
 * 중요: src/i18n.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 */

import assert from 'node:assert/strict';
import {
  MESSAGE_KEYS,
  getAppLocale,
  resolveAppLocale,
  setAppLocale,
  t,
} from '../src/i18n.ts';

console.log('=== i18n.test.mjs — Message Catalog Regression Test ===');

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

runTest('resolveAppLocale — ko 계열 판정', () => {
  assert.equal(resolveAppLocale('ko'), 'ko');
  assert.equal(resolveAppLocale('ko-KR'), 'ko');
  assert.equal(resolveAppLocale('KO-kr'), 'ko');
  assert.equal(resolveAppLocale('  ko  '), 'ko');
});

runTest('resolveAppLocale — 그 외는 en, 빈값은 ko 기본', () => {
  assert.equal(resolveAppLocale('en'), 'en');
  assert.equal(resolveAppLocale('en-US'), 'en');
  assert.equal(resolveAppLocale('ja'), 'en');
  assert.equal(resolveAppLocale(''), 'ko');
  assert.equal(resolveAppLocale(undefined), 'ko');
  assert.equal(resolveAppLocale(null), 'ko');
});

runTest('set/getAppLocale — 유효값만 반영', () => {
  setAppLocale('ko');
  assert.equal(getAppLocale(), 'ko');
  setAppLocale('en');
  assert.equal(getAppLocale(), 'en');
  setAppLocale('ja');
  assert.equal(getAppLocale(), 'en');
  setAppLocale(undefined);
  assert.equal(getAppLocale(), 'en');
  setAppLocale('ko');
});

runTest('모든 키가 ko/en 양쪽에 존재하고 비어 있지 않음', () => {
  assert.ok(MESSAGE_KEYS.length > 50, `키 개수 부족: ${MESSAGE_KEYS.length}`);
  setAppLocale('ko');
  for (const key of MESSAGE_KEYS) {
    const text = t(key);
    assert.ok(typeof text === 'string' && text.length > 0, `ko 누락/빈값: ${key}`);
    assert.ok(!text.includes('{undefined}'), `ko 치환 잔재: ${key}`);
  }
  for (const key of MESSAGE_KEYS) {
    const text = t(key, undefined, 'en');
    assert.ok(typeof text === 'string' && text.length > 0, `en 누락/빈값: ${key}`);
  }
  setAppLocale('ko');
});

runTest('{param} 치환 동작', () => {
  assert.equal(
    t('nodeCreated', { title: 'Login' }, 'ko'),
    '노드 "Login"을 생성했습니다'
  );
  assert.equal(
    t('nodeCreated', { title: 'Login' }, 'en'),
    'Created node "Login"'
  );
  assert.equal(
    t('chainCreatedPartial', { created: 2, skipped: 1 }, 'en'),
    '2 connections created (1 already connected)'
  );
});

runTest('en 카탈로그에 한글 혼입 금지', () => {
  const korean = /[가-힣]/;
  for (const key of MESSAGE_KEYS) {
    const text = t(key, { title: 'T', label: 'L', error: 'E', count: 1, nodes: 2, conns: 1, created: 1, skipped: 1, current: 1, limit: 2, name: 'N', px: 100, level: 1 }, 'en');
    assert.ok(!korean.test(text), `en 한글 혼입: ${key} -> ${text}`);
  }
  setAppLocale('ko');
});

runTest('tip 키는 ()/: 기호를 포함하지 않는다', () => {
  const banned = /[():]/;
  const dummy = { fill: 'F', border: 'B', name: 'N', w: 1, h: 1, pos: 'TOP' };
  for (const key of MESSAGE_KEYS.filter((k) => k.startsWith('tip'))) {
    assert.ok(!banned.test(t(key, dummy, 'ko')), `ko 기호 혼입: ${key}`);
    assert.ok(!banned.test(t(key, dummy, 'en')), `en 기호 혼입: ${key}`);
  }
  setAppLocale('ko');
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
