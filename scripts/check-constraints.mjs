#!/usr/bin/env node
/**
 * check-constraints.mjs — G2 구조/제약 검증 게이트
 *
 * 근거: docs/harness-analysis/04-harness-architecture-design.md §7(자동 검증) / §8(.harness 구성)
 * 읽는 규칙 파일:
 *   - .harness/structure-rules.json  (금지 패턴 / 무시 디렉터리 / 보호 파일)
 *   - .harness/allowlists.json       (DOM ID 레지스트리 / DOM 접근 파일 / dispatchEvent / postMessage 사이트)
 *
 * 검증 항목 (정적 분석):
 *   [S ] 구조 (R-12)            — 금지 파일 패턴, 보호 파일 존재
 *   [I1] 샌드박스 격리 (INV-01) — src/ui/** 에서 `figma.` API 사용 금지
 *   [I6] Core 전용 (INV-06)     — src/ui/** 에서 customConnector import 금지
 *   [D1] DOM allowlist (R-02)   — 정적 getElementById ID ∈ dom_id_registry, 해당 파일 ∈ dom_access_files
 *   [D2] querySelector (R-03)   — querySelector 사용 파일 ∈ dom_access_files
 *   [W ] window 상태 (R-04)     — src/ui/** 에서 `window.X =` 가변 상태 금지
 *   [E ] dispatchEvent (R-05)   — dispatchEvent 사용 파일 ∈ dispatch_event_sites
 *   [P1] postMessage UI→Core (INV-02) — parent.postMessage 사용 파일 ∈ post_message_ui_to_core_files
 *   [P2] postMessage Core→UI (INV-02) — figma.ui.postMessage 사용 파일 = post_message_core_to_ui.file
 *
 * 설계 원칙:
 *   - allowlist은 "파일+ID+함수" 기준 (라인 번호 아님) → 코드 이동에도 깨지지 않음.
 *   - 정적 문자열 ID만 검증. 템플릿 리터럴(동적) ID는 레지스트리 대상이 아니므로 스킵.
 *   - 등록된 사이트 = 허용(OK), 미등록 사이트 = 위반(FAIL).
 *
 * 종료 코드: 0 = 위반 없음, 1 = 위반 감지, 2 = 스크립트 오류
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const rel = (p) => relative(ROOT, p).split(sep).join("/");
const readRel = (p) => readFileSync(join(ROOT, p), "utf8");

function loadJson(p) {
  try {
    return JSON.parse(readRel(p));
  } catch (e) {
    console.error(`[FATAL] ${p} 읽기/파싱 실패: ${e.message}`);
    process.exit(2);
  }
}

const structure = loadJson(".harness/structure-rules.json");
const allow = loadJson(".harness/allowlists.json");

const IGNORED = new Set(structure.ignored_directories || []);
const CODE_EXT = new Set([".ts", ".tsx"]);

// ---------------------------------------------------------------------------
// 유틸
// ---------------------------------------------------------------------------

/** 프로젝트 전체 .ts/.tsx 파일 열거 (ignored 디렉터리 제외, 절대경로 반환) */
function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (IGNORED.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
    } else if (CODE_EXT.has(extname(name))) {
      out.push(full);
    }
  }
  return out;
}

/** 주석 제거 (정적 분석의 오탐 감소용. 문자열 내 `//`는 이 체크에 무해) */
function stripComments(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, "");
  src = src.replace(/\/\/[^\n]*/g, "");
  return src;
}

/** glob 패턴을 RegExp로 변환 ( 이중 별, 단일 별, ? 지원, 나머지 특수문자 이스케이프) */
function globToRegex(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if (".+^${}()|[]\\".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp("^" + re + "$");
}

/** src 내 특정 정규식 매치의 (파일, 라인) 목록 */
function findMatches(files, regex) {
  const hits = [];
  for (const f of files) {
    const src = readRel(f);
    const re = new RegExp(
      regex.source,
      regex.flags.includes("g") ? regex.flags : regex.flags + "g",
    );
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split("\n").length;
      hits.push({ file: f, line, text: m[0] });
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// 파일 집합
// ---------------------------------------------------------------------------

const allFiles = walk(ROOT).map(rel);
const uiFiles = allFiles.filter((f) => f.startsWith("src/ui/"));

const domIdRegistry = new Set(allow.dom_id_registry || []);
const domAccessFiles = new Set(allow.dom_access_files || []);
const dispatchFiles = new Set(
  (allow.dispatch_event_sites || []).map((s) => s.file),
);
const pmUIFiles = new Set(allow.post_message_ui_to_core_files || []);
const coreToUIFile = (allow.post_message_core_to_ui || {}).file || null;

// ---------------------------------------------------------------------------
// 체크
// ---------------------------------------------------------------------------

const violations = []; // { tag, msg }
const report = []; // 출력 라인

const section = (title) => report.push(title);
const ok = (label, detail = "") =>
  report.push(`  ✓ OK     ${label}${detail ? " — " + detail : ""}`);
const bad = (label, items) =>
  report.push(`  ✗ VIOL   ${label} — ${items.join(", ")}`);

// [S] 구조 (R-12) -----------------------------------------------------------
section("[S] 구조 (R-12) — 금지 파일 패턴 / 보호 파일");
{
  const forbidden = (structure.forbidden_patterns || []).map(globToRegex);
  const hits = allFiles.filter((f) => forbidden.some((re) => re.test(f)));
  if (hits.length) {
    hits.forEach((f) =>
      violations.push({ tag: "S", msg: `금지 파일 패턴: ${f}` }),
    );
    bad("금지 파일 패턴", hits);
  } else {
    ok(
      "금지 파일 패턴",
      "temp_* / *_new.* / *_old.* / *_backup.* / *.bak 없음",
    );
  }

  const missing = (structure.protected_files || []).filter(
    (f) => !existsSync(join(ROOT, f)),
  );
  if (missing.length) {
    missing.forEach((f) =>
      violations.push({ tag: "S", msg: `보호 파일 누락: ${f}` }),
    );
    bad("보호 파일 존재", missing);
  } else {
    ok(
      "보호 파일 존재",
      (structure.protected_files || []).length + "개 모두 존재",
    );
  }

  const doNotEdit = structure.do_not_edit || [];
  if (doNotEdit.length) ok("편집 금지 (참고)", doNotEdit.join(", "));
}

// [I1] 샌드박스 격리 (INV-01) ----------------------------------------------
section("[I1] 샌드박스 격리 (INV-01) — src/ui/** 에서 figma. API 사용 금지");
{
  const hits = [];
  for (const f of uiFiles) {
    const src = stripComments(readRel(f));
    const re = /\bfigma\.[A-Za-z_$]/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split("\n").length;
      hits.push(`${f}:${line}`);
    }
  }
  if (hits.length) {
    hits.forEach((h) =>
      violations.push({ tag: "I1", msg: `src/ui에서 figma. 사용: ${h}` }),
    );
    bad("figma. 사용", hits);
  } else {
    ok("figma. 사용", "src/ui/** 에서 0건 (Figma API는 Core 전용)");
  }
}

// [I6] Core 전용 (INV-06) ---------------------------------------------------
section("[I6] Core 전용 (INV-06) — src/ui/** 에서 customConnector import 금지");
{
  const hits = [];
  for (const f of uiFiles) {
    const src = stripComments(readRel(f));
    if (
      /import\s+[^;]*\bcustomConnector\b/.test(src) ||
      /from\s+['"][^'"]*customConnector['"]/.test(src)
    ) {
      hits.push(f);
    }
  }
  if (hits.length) {
    hits.forEach((h) =>
      violations.push({
        tag: "I6",
        msg: `src/ui에서 customConnector import: ${h}`,
      }),
    );
    bad("customConnector import", hits);
  } else {
    ok(
      "customConnector import",
      "src/ui/** 에서 0건 (지오메트리 엔진은 Core 전용)",
    );
  }
}

// [D1] DOM allowlist (R-02) -------------------------------------------------
section("[D1] DOM allowlist (R-02) — 정적 getElementById ID / 접근 파일");
{
  const re = /\bgetElementById\(\s*['"]([A-Za-z0-9_-]+)['"]\s*\)/g;
  const unregisteredIds = [];
  const filesWithStatic = new Set();
  for (const f of uiFiles) {
    const src = readRel(f);
    let m;
    const local = new RegExp(re.source, "g");
    while ((m = local.exec(src)) !== null) {
      filesWithStatic.add(f);
      const id = m[1];
      if (!domIdRegistry.has(id)) unregisteredIds.push(`${f} → '${id}'`);
    }
  }
  const unregisteredFiles = [...filesWithStatic].filter(
    (f) => !domAccessFiles.has(f),
  );

  if (unregisteredIds.length) {
    unregisteredIds.forEach((h) =>
      violations.push({ tag: "D1", msg: `미등록 DOM ID: ${h}` }),
    );
    bad("미등록 DOM ID", unregisteredIds);
  } else {
    ok(
      "정적 DOM ID",
      `${filesWithStatic.size}개 파일의 정적 ID 모두 dom_id_registry(${domIdRegistry.size})에 등록`,
    );
  }
  if (unregisteredFiles.length) {
    unregisteredFiles.forEach((h) =>
      violations.push({ tag: "D1", msg: `미등록 DOM 접근 파일: ${h}` }),
    );
    bad("미등록 DOM 접근 파일", unregisteredFiles);
  } else {
    ok(
      "DOM 접근 파일",
      `정적 ID 사용 ${filesWithStatic.size}개 파일 모두 dom_access_files(${domAccessFiles.size})에 등록`,
    );
  }
  report.push(
    "  (참고) 템플릿 리터럴 동적 ID는 레지스트리 대상이 아니므로 검증에서 제외",
  );
}

// [D2] querySelector (R-03) -------------------------------------------------
section(
  "[D2] querySelector (R-03) — querySelector 사용 파일 ∈ dom_access_files",
);
{
  const qsFiles = new Set();
  for (const f of uiFiles) {
    if (/\bquerySelector(All)?\(/.test(readRel(f))) qsFiles.add(f);
  }
  const unregistered = [...qsFiles].filter((f) => !domAccessFiles.has(f));
  if (unregistered.length) {
    unregistered.forEach((h) =>
      violations.push({ tag: "D2", msg: `미등록 querySelector 파일: ${h}` }),
    );
    bad("미등록 querySelector 파일", unregistered);
  } else {
    ok(
      "querySelector 파일",
      `${qsFiles.size}개 파일 모두 dom_access_files에 등록`,
    );
  }
}

// [W] window 상태 (R-04) ----------------------------------------------------
section("[W] window 상태 (R-04) — src/ui/** 에서 window.X = 가변 상태 금지");
{
  const hits = [];
  for (const f of uiFiles) {
    const src = stripComments(readRel(f));
    const re = /\bwindow\.[A-Za-z_$][A-Za-z0-9_$]*\s*=(?!=)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split("\n").length;
      hits.push(`${f}:${line} → ${m[0].trim()}`);
    }
  }
  if (hits.length) {
    hits.forEach((h) =>
      violations.push({ tag: "W", msg: `window 가변 상태: ${h}` }),
    );
    bad("window 가변 상태", hits);
  } else {
    ok(
      "window 가변 상태",
      "src/ui/** 에서 0건 (window.setTimeout/addEventListener 등 표준 API는 허용)",
    );
  }
}

// [E] dispatchEvent (R-05) --------------------------------------------------
section(
  "[E] dispatchEvent (R-05) — dispatchEvent 사용 파일 ∈ dispatch_event_sites",
);
{
  const sites = (allow.dispatch_event_sites || [])
    .map((s) => `${s.file} → ${s.target}`)
    .join(", ");
  const files = new Set();
  for (const f of uiFiles) {
    if (/\bdispatchEvent\(/.test(readRel(f))) files.add(f);
  }
  const unregistered = [...files].filter((f) => !dispatchFiles.has(f));
  if (unregistered.length) {
    unregistered.forEach((h) =>
      violations.push({ tag: "E", msg: `미등록 dispatchEvent: ${h}` }),
    );
    bad("미등록 dispatchEvent", unregistered);
  } else {
    ok(
      "dispatchEvent",
      `${files.size}개 파일 모두 dispatch_event_sites에 등록 (${sites})`,
    );
  }
}

// [P1] postMessage UI→Core (INV-02) ----------------------------------------
section(
  "[P1] postMessage UI→Core (INV-02) — parent.postMessage 사용 파일 ∈ allowlist",
);
{
  const files = new Set();
  for (const f of uiFiles) {
    if (/\bparent\.postMessage\(/.test(readRel(f))) files.add(f);
  }
  const unregistered = [...files].filter((f) => !pmUIFiles.has(f));
  if (unregistered.length) {
    unregistered.forEach((h) =>
      violations.push({ tag: "P1", msg: `미등록 parent.postMessage: ${h}` }),
    );
    bad("미등록 parent.postMessage", unregistered);
  } else {
    ok(
      "parent.postMessage",
      `${files.size}개 파일 모두 post_message_ui_to_core_files(${pmUIFiles.size})에 등록`,
    );
  }
}

// [P2] postMessage Core→UI (INV-02) ----------------------------------------
section(
  "[P2] postMessage Core→UI (INV-02) — figma.ui.postMessage 사용 파일 = allowlist",
);
{
  const files = new Set();
  for (const f of allFiles) {
    if (f.startsWith("src/ui/")) continue; // UI 쪽은 P1에서 처리
    if (/\bfigma\.ui\.postMessage\(/.test(readRel(f))) files.add(f);
  }
  const unregistered = [...files].filter((f) => f !== coreToUIFile);
  if (unregistered.length) {
    unregistered.forEach((h) =>
      violations.push({
        tag: "P2",
        msg: `figma.ui.postMessage 비인가 파일: ${h}`,
      }),
    );
    bad("figma.ui.postMessage 비인가 파일", unregistered);
  } else {
    ok(
      "figma.ui.postMessage",
      `${files.size}개 파일, 모두 ${coreToUIFile} (postToUI 경유)`,
    );
  }
}

// ---------------------------------------------------------------------------
// 출력
// ---------------------------------------------------------------------------

console.log("=== check-constraints.mjs — G2 구조/제약 검증 ===");
console.log("");
for (const line of report) console.log(line);
console.log("");

const byTag = {};
for (const v of violations) (byTag[v.tag] ||= []).push(v.msg);

console.log("=== Summary ===");
if (violations.length === 0) {
  console.log("  위반 없음 — 모든 구조/제약 체크 통과");
  console.log("");
  console.log("  Result: PASS");
  process.exit(0);
} else {
  console.log(`  위반 ${violations.length}건:`);
  for (const [tag, msgs] of Object.entries(byTag)) {
    console.log(`    [${tag}] ${msgs.length}건`);
    msgs.forEach((m) => console.log(`      - ${m}`));
  }
  console.log("");
  console.log(`  Result: FAIL (${violations.length}건 위반 감지)`);
  process.exit(1);
}
