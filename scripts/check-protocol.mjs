#!/usr/bin/env node
/**
 * check-protocol.mjs — G3 프로토콜 계약 검증 게이트
 *
 * 검증 대상 (3자 일치 + 발신 사이트 대조):
 *   [UI→Core]  PluginAction union (types.ts) ↔ code.ts switch ↔ UI 발신 사이트
 *   [Core→UI]  CoreToUIMessage union (types.ts) ↔ UI 수신 switch ↔ Core 발신 사이트
 *
 * 대응: INV-03/04, R-08/R-09
 *
 * 분류:
 *   KNOWN — protocol-rules.json의 known_* 리스트에 등록된 "예상된 위반" (기존 코드)
 *   NEW   — 미등록 "신규 위반" (회귀)
 *
 * Exit code:
 *   0 — 위반 없음
 *   1 — 위반 감지 (KNOWN 또는 NEW)
 *   2 — 스크립트 오류 (파일 없음, 파싱 실패 등)
 *
 * 사용: node scripts/check-protocol.mjs  (또는 npm run check:protocol)
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------- Helpers ----------

function readRel(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) {
    throw new Error(`파일 없음: ${relPath}`);
  }
  return readFileSync(abs, "utf8");
}

/**
 * `export type <name> = ... ;` 블록에서 `type: 'X'` 값 추출.
 * 중괄호 깊이 카운팅으로 블록 경계를 결정하여 중첩 객체의 `type:`을 오인하지 않는다.
 */
function extractUnionTypes(source, unionName) {
  const marker = `export type ${unionName} =`;
  const startIdx = source.indexOf(marker);
  if (startIdx === -1) {
    throw new Error(`union 미발견: ${unionName}`);
  }

  let i = startIdx + marker.length;
  let depth = 0;
  let endIdx = -1;

  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ";" && depth === 0) {
      endIdx = i;
      break;
    }
  }

  if (endIdx === -1) {
    throw new Error(`union 블록 끝 미발견: ${unionName}`);
  }

  const block = source.slice(startIdx, endIdx + 1);
  const types = [];
  const regex = /type:\s*'([A-Z][A-Z0-9_]*)'/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    if (!types.includes(m[1])) types.push(m[1]);
  }
  return types;
}

/**
 * `switch (msg.type) { ... }` 블록에서 `case 'X':` 값 추출.
 * 중괄호 깊이 카운팅으로 switch 블록 경계를 결정한다.
 */
function extractSwitchCases(source, switchMarker) {
  const startIdx = source.indexOf(switchMarker);
  if (startIdx === -1) {
    throw new Error(`switch 미발견: ${switchMarker}`);
  }

  // switch 블록의 { 찾기
  let i = startIdx + switchMarker.length;
  while (i < source.length && source[i] !== "{") i++;
  if (i >= source.length) {
    throw new Error(`switch { 미발견: ${switchMarker}`);
  }

  let depth = 0;
  let endIdx = -1;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) {
    throw new Error(`switch 블록 끝 미발견: ${switchMarker}`);
  }

  const block = source.slice(startIdx, endIdx + 1);
  const cases = [];
  const regex = /case\s+'([A-Z][A-Z0-9_]*)'\s*:/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    if (!cases.includes(m[1])) cases.push(m[1]);
  }
  return cases;
}

/**
 * `parent.postMessage(...)` 호출 내 `type: 'X'` 추출 (UI→Core 발신 사이트).
 */
function extractPostMessageTypes(source) {
  const types = new Set();
  const regex = /parent\.postMessage\s*\(/g;
  let m;
  while ((m = regex.exec(source)) !== null) {
    const start = m.index + m[0].length;
    const chunk = source.slice(start, start + 1000);
    const typeMatch = /type:\s*'([A-Z][A-Z0-9_]*)'/.exec(chunk);
    if (typeMatch) types.add(typeMatch[1]);
  }
  return [...types];
}

/**
 * `postToUI(...)` 호출 내 `type: 'X'` 추출 (Core→UI 발신 사이트).
 */
function extractPostToUITypes(source) {
  const types = new Set();
  const regex = /postToUI\s*\(/g;
  let m;
  while ((m = regex.exec(source)) !== null) {
    const start = m.index + m[0].length;
    const chunk = source.slice(start, start + 1000);
    const typeMatch = /type:\s*'([A-Z][A-Z0-9_]*)'/.exec(chunk);
    if (typeMatch) types.add(typeMatch[1]);
  }
  return [...types];
}

/**
 * 디렉터리 재귀 열거 — .ts/.tsx 파일의 ROOT 상대 경로 반환.
 */
function walk(dir, base = ROOT) {
  const abs = join(base, dir);
  const results = [];
  for (const entry of readdirSync(abs)) {
    const full = join(abs, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...walk(relative(base, full), base));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      results.push(relative(base, full));
    }
  }
  return results;
}

const setDiff = (a, b) => a.filter((x) => !b.includes(x));

// ---------- Main ----------

function main() {
  // 1. protocol-rules.json 로드
  const rules = JSON.parse(readRel(".harness/protocol-rules.json"));

  const typesSource = readRel(rules.protocol_source);
  const coreSource = readRel(rules.ui_to_core.core_switch_file);
  const uiReceiveSource = readRel(rules.core_to_ui.ui_receive_file);

  // 2. union 추출 (types.ts 단일 소스 오브 트루스, INV-07)
  const pluginActionTypes = extractUnionTypes(
    typesSource,
    rules.ui_to_core.union,
  );
  const coreToUITypes = extractUnionTypes(typesSource, rules.core_to_ui.union);

  // 3. switch 추출
  const coreSwitchCases = extractSwitchCases(coreSource, "switch (msg.type)");
  const uiReceiveCases = extractSwitchCases(
    uiReceiveSource,
    "switch (msg.type)",
  );

  // 4. 발신 사이트 추출
  // UI 발신: src/ui/ 전체 parent.postMessage
  const uiFiles = walk("src/ui");
  const uiSendTypes = new Set();
  for (const f of uiFiles) {
    for (const t of extractPostMessageTypes(readRel(f))) uiSendTypes.add(t);
  }
  // Core 발신: code.ts postToUI
  const coreSendTypes = extractPostToUITypes(coreSource);

  // 5. drift 계산
  // UI→Core
  const unhandled = setDiff(pluginActionTypes, coreSwitchCases); // union - switch
  const undeclaredHandled = setDiff(coreSwitchCases, pluginActionTypes); // switch - union
  const undeclaredSent = setDiff([...uiSendTypes], pluginActionTypes); // send - union

  // Core→UI
  const undeclaredReceived = setDiff(uiReceiveCases, coreToUITypes); // receive - union
  const unsent = setDiff(coreToUITypes, coreSendTypes); // union - send
  const unreceived = setDiff(coreToUITypes, uiReceiveCases); // union - receive

  // 6. 분류 (KNOWN / NEW)
  const knownUnhandled = rules.ui_to_core.known_unhandled || [];
  const knownUndeclared = rules.core_to_ui.known_undeclared || [];
  const knownUnsent = rules.core_to_ui.known_unsent || [];
  const knownUnreceived = rules.core_to_ui.known_unreceived || [];

  const classify = (items, knownList) => {
    const known = items.filter((x) => knownList.includes(x));
    const neu = items.filter((x) => !knownList.includes(x));
    return { known, neu };
  };

  const r1 = classify(unhandled, knownUnhandled);
  const r2 = classify(undeclaredHandled, []); // 항상 NEW (known 리스트 없음)
  const r3 = classify(undeclaredSent, []); // 항상 NEW (known 리스트 없음)
  const r4 = classify(undeclaredReceived, knownUndeclared);
  const r5 = classify(unsent, knownUnsent);
  const r6 = classify(unreceived, knownUnreceived); // TOAST는 unsent+unreceived 중복

  // 7. 리포트
  const L = [];
  L.push("=== check-protocol.mjs — G3 프로토콜 계약 검증 ===");
  L.push("");
  L.push(`[UI→Core] ${rules.ui_to_core.union}`);
  L.push(
    `  union (${pluginActionTypes.length}): ${pluginActionTypes.join(", ")}`,
  );
  L.push(
    `  Core switch (${coreSwitchCases.length}): ${coreSwitchCases.join(", ")}`,
  );
  L.push(`  UI 발신 (${uiSendTypes.size}): ${[...uiSendTypes].join(", ")}`);
  L.push("");

  const report = (label, { known, neu }) => {
    if (known.length) L.push(`  ⚠ KNOWN  ${label}: ${known.join(", ")}`);
    if (neu.length) L.push(`  ✗ NEW    ${label}: ${neu.join(", ")}`);
    if (!known.length && !neu.length) L.push(`  ✓ OK     ${label}: 없음`);
  };

  report("union에서 Core 미처리 (unhandled)", r1);
  report("Core에서 union 미선언 처리 (undeclared_handled)", r2);
  report("UI 발신 union 미선언 (undeclared_sent)", r3);
  L.push("");
  L.push(`[Core→UI] ${rules.core_to_ui.union}`);
  L.push(`  union (${coreToUITypes.length}): ${coreToUITypes.join(", ")}`);
  L.push(`  UI 수신 (${uiReceiveCases.length}): ${uiReceiveCases.join(", ")}`);
  L.push(`  Core 발신 (${coreSendTypes.length}): ${coreSendTypes.join(", ")}`);
  L.push("");
  report("UI 수신 union 미선언 (undeclared_received)", r4);
  report("union에서 Core 미발신 (unsent)", r5);
  report("union에서 UI 미수신 (unreceived)", r6);
  L.push("");

  const allKnown = [
    r1.known,
    r2.known,
    r3.known,
    r4.known,
    r5.known,
    r6.known,
  ].flat();
  const allNew = [r1.neu, r2.neu, r3.neu, r4.neu, r5.neu, r6.neu].flat();

  L.push("=== Summary ===");
  L.push(`  KNOWN 위반 (예상된, protocol-rules.json 등록): ${allKnown.length}`);
  if (allKnown.length) L.push(`    ${allKnown.join(", ")}`);
  L.push(`  NEW 위반 (신규, 미등록): ${allNew.length}`);
  if (allNew.length) L.push(`    ${allNew.join(", ")}`);
  L.push("");

  const total = allKnown.length + allNew.length;
  if (total === 0) {
    L.push("  Result: PASS (위반 없음)");
    console.log(L.join("\n"));
    process.exit(0);
  } else {
    L.push(
      `  Result: FAIL (${total}건 위반 감지 — KNOWN ${allKnown.length} / NEW ${allNew.length})`,
    );
    console.log(L.join("\n"));
    process.exit(1);
  }
}

try {
  main();
} catch (e) {
  console.error(`[check-protocol] 오류: ${e.message}`);
  process.exit(2);
}
