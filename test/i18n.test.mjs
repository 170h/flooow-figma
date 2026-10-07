#!/usr/bin/env node
/**
 * i18n.test.mjs — 다국어 메시지 카탈로그 회귀 테스트.
 * - resolveAppLocale 판정 (8개 언어, 빈값/알 수 없는 언어는 en 기본)
 * - SUPPORTED_LOCALES의 모든 언어에 대해 모든 MESSAGE_KEYS가 존재하고 비어 있지 않음
 * - {param} 치환 동작
 * - 비한국어 카탈로그(en, es, de, fr 등)에 한글 혼입 금지
 * - tip 키는 ()/: 기호를 포함하지 않음
 *
 * 중요: src/i18n.ts의 실제 구현을 직접 import하여 테스트한다. (복사 구현 금지)
 */

import assert from 'node:assert/strict';
import {
  MESSAGE_KEYS,
  SUPPORTED_LOCALES,
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

runTest('resolveAppLocale — 글로벌 8개 언어 판정 및 기본 fallback en', () => {
  assert.equal(resolveAppLocale('en'), 'en');
  assert.equal(resolveAppLocale('en-US'), 'en');
  assert.equal(resolveAppLocale('ja'), 'ja');
  assert.equal(resolveAppLocale('ja-JP'), 'ja');
  assert.equal(resolveAppLocale('zh-TW'), 'zh-TW');
  assert.equal(resolveAppLocale('zh-HK'), 'zh-TW');
  assert.equal(resolveAppLocale('zh-MO'), 'zh-TW');
  assert.equal(resolveAppLocale('zh-Hant-TW'), 'zh-TW');
  assert.equal(resolveAppLocale('zh-Hant'), 'zh-TW');
  assert.equal(resolveAppLocale('zh-CN'), 'zh-CN');
  assert.equal(resolveAppLocale('zh-Hans-CN'), 'zh-CN');
  assert.equal(resolveAppLocale('zh'), 'zh-CN');
  assert.equal(resolveAppLocale('es'), 'es');
  assert.equal(resolveAppLocale('es-ES'), 'es');
  assert.equal(resolveAppLocale('de'), 'de');
  assert.equal(resolveAppLocale('de-DE'), 'de');
  assert.equal(resolveAppLocale('fr'), 'fr');
  assert.equal(resolveAppLocale('fr-FR'), 'fr');
  // 미지원 언어 및 빈값은 en으로 fallback
  assert.equal(resolveAppLocale('pt'), 'en');
  assert.equal(resolveAppLocale('it'), 'en');
  assert.equal(resolveAppLocale(''), 'en');
  assert.equal(resolveAppLocale(undefined), 'en');
  assert.equal(resolveAppLocale(null), 'en');
});

runTest('set/getAppLocale — 유효값만 반영', () => {
  for (const loc of SUPPORTED_LOCALES) {
    setAppLocale(loc);
    assert.equal(getAppLocale(), loc);
  }
  // 유효하지 않은 값은 기존 값 유지
  setAppLocale('unknown_locale');
  assert.equal(getAppLocale(), 'fr');
  setAppLocale(undefined);
  assert.equal(getAppLocale(), 'fr');
  setAppLocale('en');
  assert.equal(getAppLocale(), 'en');
});

runTest('모든 지원 언어에서 모든 키가 존재하고 비어 있지 않음', () => {
  assert.ok(MESSAGE_KEYS.length > 50, `키 개수 부족: ${MESSAGE_KEYS.length}`);
  assert.equal(SUPPORTED_LOCALES.length, 8, '8개 언어 지원 보장');

  for (const loc of SUPPORTED_LOCALES) {
    for (const key of MESSAGE_KEYS) {
      const text = t(key, undefined, loc);
      assert.ok(typeof text === 'string' && text.length > 0, `${loc} 누락/빈값: ${key}`);
      assert.ok(!text.includes('{undefined}'), `${loc} 치환 잔재: ${key}`);
    }
  }
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
    t('nodeCreated', { title: 'Login' }, 'ja'),
    'ノード「Login」を作成しました'
  );
  assert.equal(
    t('chainCreatedPartial', { created: 2, skipped: 1 }, 'en'),
    '2 connections created (1 already connected)'
  );
  assert.equal(
    t('chainCreatedPartial', { created: 2, skipped: 1 }, 'es'),
    '2 conexiones creadas (1 ya existían)'
  );
});

runTest('서양 언어 카탈로그(en, es, de, fr)에 한글 혼입 금지', () => {
  const korean = /[가-힣]/;
  const westernLocales = ['en', 'es', 'de', 'fr'];
  const dummyParams = {
    title: 'T',
    label: 'L',
    error: 'E',
    count: 1,
    nodes: 2,
    conns: 1,
    created: 1,
    skipped: 1,
    current: 1,
    limit: 2,
    name: 'N',
    px: 100,
    level: 1,
  };

  for (const loc of westernLocales) {
    for (const key of MESSAGE_KEYS) {
      const text = t(key, dummyParams, loc);
      assert.ok(!korean.test(text), `${loc} 한글 혼입: ${key} -> ${text}`);
    }
  }
});

runTest('tip 키는 ()/: 기호를 포함하지 않는다', () => {
  const banned = /[():]/;
  const dummy = { fill: 'F', border: 'B', name: 'N', w: 1, h: 1, pos: 'TOP' };
  for (const loc of SUPPORTED_LOCALES) {
    for (const key of MESSAGE_KEYS.filter((k) => k.startsWith('tip'))) {
      assert.ok(!banned.test(t(key, dummy, loc)), `${loc} 기호 혼입: ${key}`);
    }
  }
});

console.log(`\nResult: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}
