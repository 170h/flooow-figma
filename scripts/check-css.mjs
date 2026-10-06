#!/usr/bin/env node
/**
 * check-css.mjs — G5 CSS 정적 감사 게이트
 *
 * 근거: BUG_REPORT.md M-01~M-08, VERIFICATION_REPORT.md §4
 * 읽는 규칙 파일: .harness/css-rules.json
 *
 * 설계:
 *   - check-constraints/check-protocol과 동일한 KNOWN/NEW 분류를 사용한다.
 *     zero 모드: 1건이라도 발견되면 NEW (현재 0건인 금지 패턴의 회귀 방지).
 *     tracked 모드: known_count까지는 KNOWN(기존 잔재), 초과분은 NEW(신규 추가).
 *   - #ffffff 전체 금지는 하지 않는다. data-color="#ffffff" 같은
 *     명시적 관리 패턴만 검사하여 정상 white 사용의 false positive를 피한다.
 *   - CSS 주석을 먼저 제거한 뒤 검사한다.
 *
 * 분류:
 *   KNOWN — 기존 잔재 (css-rules.json known_count 내)
 *   NEW   — 신규 위반 (zero 모드 발견 또는 tracked 초과분)
 *
 * Exit code:
 *   0 — NEW 위반 없음 (KNOWN 잔재는 실패 조건 아님)
 *   1 — NEW 위반 감지
 *   2 — 스크립트 오류
 *
 * 사용: node scripts/check-css.mjs  (또는 npm run check:css)
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadJson(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`[check-css] 오류: 파일 없음: ${rel}`);
    process.exit(2);
  }
  try {
    return JSON.parse(readFileSync(abs, "utf8"));
  } catch (e) {
    console.error(`[check-css] 오류: ${rel} 파싱 실패: ${e.message}`);
    process.exit(2);
  }
}

function main() {
  const rules = loadJson(".harness/css-rules.json");
  const cssRel = rules.css_source || "src/ui/styles.css";
  const cssAbs = join(ROOT, cssRel);
  if (!existsSync(cssAbs)) {
    console.error(`[check-css] 오류: 파일 없음: ${cssRel}`);
    process.exit(2);
  }
  const raw = readFileSync(cssAbs, "utf8");
  // CSS 주석 제거 후 검사 (주석 속 패턴 오인 방지)
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, "");

  const L = [];
  L.push("=== check-css.mjs — G5 CSS 정적 감사 ===");
  L.push(`  대상: ${cssRel}`);
  L.push("");

  let knownTotal = 0;
  let newTotal = 0;
  const knownItems = [];
  const newItems = [];

  for (const rule of rules.rules || []) {
    const re = new RegExp(rule.regex, rule.flags?.includes("g") ? rule.flags : (rule.flags || "") + "g");
    const hits = [];
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split("\n").length;
      hits.push({ file: cssRel, line, text: m[0] });
      // 빈 매치 무한 루프 방지
      if (m[0].length === 0) re.lastIndex++;
    }

    const show = (h) => `${h.file}:${h.line} → ${h.text.slice(0, 60)}`;
    if (rule.mode === "zero") {
      if (hits.length === 0) {
        L.push(`  ✓ OK     [${rule.id}] ${rule.desc} — 0건`);
      } else {
        newTotal += hits.length;
        hits.forEach((h) => newItems.push(`[${rule.id}] ${show(h)}`));
        L.push(`  ✗ NEW    [${rule.id}] ${rule.desc} — ${hits.length}건`);
        hits.slice(0, 5).forEach((h) => L.push(`           - ${show(h)}`));
        if (hits.length > 5) L.push(`           - …외 ${hits.length - 5}건`);
      }
    } else {
      // tracked: known_count까지 KNOWN, 초과분 NEW
      const knownCount = rule.known_count || 0;
      const knownHits = hits.slice(0, knownCount);
      const newHits = hits.slice(knownCount);
      knownTotal += knownHits.length;
      newTotal += newHits.length;
      knownHits.forEach((h) => knownItems.push(`[${rule.id}] ${show(h)}`));
      newHits.forEach((h) => newItems.push(`[${rule.id}] ${show(h)}`));
      if (hits.length === 0) {
        L.push(`  ✓ OK     [${rule.id}] ${rule.desc} — 0건 (KNOWN ${knownCount})`);
      } else if (newHits.length === 0) {
        L.push(`  ⚠ KNOWN  [${rule.id}] ${rule.desc} — ${hits.length}건 (기존 잔재, KNOWN ${knownCount})`);
        knownHits.slice(0, 3).forEach((h) => L.push(`           - ${show(h)}`));
        if (hits.length > 3) L.push(`           - …외 ${hits.length - 3}건`);
      } else {
        L.push(`  ✗ NEW    [${rule.id}] ${rule.desc} — ${hits.length}건 (KNOWN ${knownHits.length} / NEW ${newHits.length})`);
        newHits.slice(0, 5).forEach((h) => L.push(`           - ${show(h)}`));
        if (newHits.length > 5) L.push(`           - …외 ${newHits.length - 5}건`);
      }
    }
  }

  L.push("");
  L.push("=== Summary ===");
  L.push(`  KNOWN 위반 (기존 잔재, css-rules.json 등록): ${knownTotal}`);
  L.push(`  NEW 위반 (신규, 미등록): ${newTotal}`);
  if (newItems.length) {
    L.push("  NEW 목록:");
    newItems.slice(0, 20).forEach((m) => L.push(`    - ${m}`));
    if (newItems.length > 20) L.push(`    - …외 ${newItems.length - 20}건`);
  }
  L.push("");

  if (newTotal === 0) {
    L.push("  Result: PASS (NEW 0건)");
    console.log(L.join("\n"));
    process.exit(0);
  } else {
    L.push(`  Result: FAIL (${newTotal}건 신규 위반 감지 — KNOWN ${knownTotal} / NEW ${newTotal})`);
    console.log(L.join("\n"));
    process.exit(1);
  }
}

try {
  main();
} catch (e) {
  console.error(`[check-css] 오류: ${e.message}`);
  process.exit(2);
}
