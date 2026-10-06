#!/usr/bin/env node
/**
 * check-tests.mjs — G6 테스트 실행 완전성 게이트
 *
 * 읽는 규칙 파일: .harness/test-rules.json, package.json scripts.test
 *
 * 검증:
 *   test/*.test.mjs 전체 목록과 package.json "test" 스크립트에서
 *   실제로 참조되는 파일을 대조한다.
 *   디렉터리에 있지만 스크립트에서 실행되지 않는 파일이 있으면 보고한다.
 *   파일명 정확 일치로 대조하므로 grep 오탐이 없다.
 *
 * 분류:
 *   KNOWN — test-rules.json known_excluded에 등록된 의도적 제외
 *   NEW   — 미등록 누락 (회귀)
 *
 * Exit code:
 *   0 — 누락 없음
 *   1 — 누락 감지 (KNOWN 또는 NEW)
 *   2 — 스크립트 오류
 *
 * 사용: node scripts/check-tests.mjs  (또는 npm run check:tests)
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadJson(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`[check-tests] 오류: 파일 없음: ${rel}`);
    process.exit(2);
  }
  try {
    return JSON.parse(readFileSync(abs, "utf8"));
  } catch (e) {
    console.error(`[check-tests] 오류: ${rel} 파싱 실패: ${e.message}`);
    process.exit(2);
  }
}

function main() {
  const rules = loadJson(".harness/test-rules.json");
  const pkg = loadJson("package.json");

  const testDir = rules.test_dir || "test";
  const dirAbs = join(ROOT, testDir);
  if (!existsSync(dirAbs)) {
    console.error(`[check-tests] 오류: 디렉터리 없음: ${testDir}`);
    process.exit(2);
  }
  const allTests = readdirSync(dirAbs)
    .filter((f) => f.endsWith(".test.mjs"))
    .sort();

  const scriptName = rules.package_test_script || "test";
  const testScript = pkg.scripts?.[scriptName] || "";
  const knownExcluded = rules.known_excluded || [];

  // 스크립트 문자열에 파일명이 그대로 포함되는지로 대조 (정확 일치)
  const missing = allTests.filter((f) => !testScript.includes(f));
  const classify = (items) => ({
    known: items.filter((x) => knownExcluded.includes(x)),
    neu: items.filter((x) => !knownExcluded.includes(x)),
  });
  const r = classify(missing);

  const L = [];
  L.push("=== check-tests.mjs — G6 테스트 실행 완전성 ===");
  L.push(`  test/ 전체 (${allTests.length}): ${allTests.join(", ")}`);
  L.push(`  package.json scripts.${scriptName} 참조 여부:`);
  for (const f of allTests) {
    const hit = testScript.includes(f);
    const runner =
      rules.runners?.node?.includes(f)
        ? "node"
        : rules.runners?.esbuild?.includes(f)
          ? "esbuild pipe"
          : "runner 미등록";
    L.push(`    ${hit ? "✓" : "✗"} ${f} (${runner})`);
  }
  L.push("");
  if (r.known.length)
    L.push(`  ⚠ KNOWN  의도적 제외 (test-rules.json 등록): ${r.known.join(", ")}`);
  if (r.neu.length)
    L.push(`  ✗ NEW    스크립트 미실행 (미등록 누락): ${r.neu.join(", ")}`);
  if (!r.known.length && !r.neu.length)
    L.push("  ✓ OK     누락 없음 — test/ 전체가 scripts.test에서 실행됨");
  L.push("");
  L.push("=== Summary ===");
  L.push(`  KNOWN 누락 (의도적 제외): ${r.known.length}`);
  L.push(`  NEW 누락 (신규): ${r.neu.length}`);
  L.push("");

  if (r.known.length + r.neu.length === 0) {
    L.push("  Result: PASS (누락 없음)");
    console.log(L.join("\n"));
    process.exit(0);
  } else {
    L.push(
      `  Result: FAIL (${r.known.length + r.neu.length}건 누락 — KNOWN ${r.known.length} / NEW ${r.neu.length})`,
    );
    console.log(L.join("\n"));
    process.exit(1);
  }
}

try {
  main();
} catch (e) {
  console.error(`[check-tests] 오류: ${e.message}`);
  process.exit(2);
}
