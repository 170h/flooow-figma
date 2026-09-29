# Figma 공식 규칙 추출·분류·통합 — 10항목 최종 보고서

> **작성일**: 2026-09-29
> **작업**: [`figma-plugin-guide/`](../figma-plugin-guide/) 30개 문서 전수 분석 → 기존 Harness(INV-01~10, R-01~13) 대조·분류·통합

---

## 1. 분석 대상

[`figma-plugin-guide/`](../figma-plugin-guide/) 전체 **30개 문서** 전수 분석:

- **Getting Started (4)**: `00-introduction`, `00b-prerequisites`, `01-quickstart`, `02-setting-editor-type`
- **Basics (5)**: `03-how-plugins-run`, `04-network-requests`, `05-libraries-and-bundling`, `06-publishing`, `07-api-reference`
- **API Reference (10)**: `api/README`, `api/typings-and-errors`, `api/data-types`, `api/node-properties`, `api/manifest`, `api/figma-ui`, `api/figma-viewport`, `api/figma-variables`, `api/figma-util`, `api/figma-clientStorage`
- **Nodes (9)**: `api/nodes/` — TextNode, FrameNode, RectangleNode, ShapeNodes, ConnectorNode, ComponentNode, InstanceNode, FigJamNodes, DocumentNode-PageNode
- **README (2)**: 루트 + `api/` 인덱스

## 2. 4분류 결과

| 분류             | 건수 | 내용                                                                                                                                                                                                                |
| ---------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. 기존 커버** | 12   | 샌드박스 격리(INV-01), postMessage(INV-02), 빌드 순서(INV-09), Viewport/UI Core-only, `figma.create*`, Node types, Data types, Connector 격리(INV-06), Editor type(`figjam`), Network manifest, Typings, pluginData |
| **2. 신규 규칙** | 4    | **R-14** 폰트 미로드 텍스트 변경, **R-15** clientStorage 키 무분별, **R-16** variables API 미검증, **R-17** 제거된 노드 접근                                                                                        |
| **3. 보완**      | 2    | R-14~17 공식 문서 근거 링크, `client_storage_keys` allowlist 등록                                                                                                                                                   |
| **4. 해당없음**  | 6    | `figma.util`(코드 미사용), FigJam 전용 노드(Sticky/CodeBlock/Table), Component/Instance, ESLint 플러그인, Publishing/애널리틱스, Hot reload                                                                         |

## 3. R-14 — 폰트 미로드 상태에서 텍스트 노드 변경 금지

- `TextNode` 폰트 의존 속성(`characters`, `fontSize`, `fontFamily`, `fontStyle` 등) 변경 전 **`await figma.loadFontAsync(...)` 필수**
- 코드 근거: [`src/code.ts`](../../src/code.ts) 광범위 사용, [`src/customConnector.ts`](../../src/customConnector.ts:812)
- 공식 문서: [`api/typings-and-errors.md`](../figma-plugin-guide/api/typings-and-errors.md:93) (`Error: Missing font ... (not loaded)`), [`api/nodes/TextNode.md`](../figma-plugin-guide/api/nodes/TextNode.md:37)

## 4. R-15 — `clientStorage` 키 무분별 사용 금지

- `figma.clientStorage` 사용 키는 [`.harness/allowlists.json`](../../.harness/allowlists.json) **`client_storage_keys`에 등록 필수** (현재: `figma_token`, `figma_file_url`)
- 코드 근거: [`src/code.ts`](../../src/code.ts:4565)
- 공식 문서: [`api/figma-clientStorage.md`](../figma-plugin-guide/api/figma-clientStorage.md:14)

## 5. R-16 — `figma.variables` feature detection 없이 호출 금지

- `figma.variables` 접근 전 **`'variables' in figma` guard 필수** (Figma 버전/권한에 따라 미존재 가능)
- 코드 근거: [`src/code.ts`](../../src/code.ts:4585) — 이미 feature detection 정확히 사용 중
- 공식 문서: [`api/figma-variables.md`](../figma-plugin-guide/api/figma-variables.md:11)

## 6. R-17 — `node.remove()` 후 해당 노드 참조 접근 금지

- `node.remove()` 호출 시점부터 참조 무효화, 제거 후 접근이 필요한 값은 **`remove()` 전에 캡처**
- 코드 근거: [`src/code.ts`](../../src/code.ts), [`src/customConnector.ts`](../../src/customConnector.ts:945)
- 공식 문서: [`api/typings-and-errors.md`](../figma-plugin-guide/api/typings-and-errors.md:83) (`Error: Cannot read property of removed node`)

## 7. 수정된 파일 (5개)

| 파일                                                                       | 변경 내용                                                                   |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`03-agent-failure-risks.md`](./03-agent-failure-risks.md)                 | R-14~R-17 4개 섹션 추가 (Risk/실제 근거/Agent 실수/Harness 제약 구조)       |
| [`AGENTS.md`](../../AGENTS.md)                                             | §5 금지사항 4건 추가 (R-14~17), §4 라우팅 테이블에 "Figma API 사용" 행 추가 |
| [`.harness/allowlists.json`](../../.harness/allowlists.json)               | `client_storage_keys: ["figma_token", "figma_file_url"]` 레지스트리 추가    |
| [`04-harness-architecture-design.md`](./04-harness-architecture-design.md) | §5 테이블 제목 R-01~R-13 → R-01~R-17, R-14~17 행 4개 추가                   |
| [`README.md`](./README.md)                                                 | 문서 목록에 09번 문서 등록, R-01~R-13 → R-01~R-17 반영                      |

**의도적 미수정 파일**:

- `src/**`, `dist/**`, `src/ui.html` — **애플리케이션 코드 0건 수정** (git status로 확인)
- `02-architecture-invariants.md` — INV-01~10 유지 (신규 규칙은 R-14~R-17로 R 계열에 편입, INV 확장 불필요)
- `scripts/check-*.mjs` — R-14~R-17은 정적 체크가 어려운 런타임 규칙이라 수동/규칙 기반 통제 (check 스크립트 변경 없음)
- `failures/` — 신규 위반 0건이라 failure 기록 불필요

## 8. 공식 문서 → Harness 매핑

| 공식 문서                                         | Harness 대응                                        |
| ------------------------------------------------- | --------------------------------------------------- |
| `03-how-plugins-run.md` (2샌드박스)               | INV-01, INV-02                                      |
| `04-network-requests.md` (manifest networkAccess) | INV-01 (Core 전용), `manifest.json` `networkAccess` |
| `05-libraries-and-bundling.md` (esbuild)          | INV-09                                              |
| `02-setting-editor-type.md` (figjam)              | `manifest.json` `editorType: ["figjam"]`            |
| `api/typings-and-errors.md` (에러 패턴)           | **R-14, R-17**                                      |
| `api/figma-clientStorage.md`                      | **R-15** + `allowlists.json`                        |
| `api/figma-variables.md`                          | **R-16**                                            |
| `api/nodes/TextNode.md` (폰트 로딩)               | **R-14**                                            |
| `api/figma-util.md`                               | 해당없음 (코드 미사용)                              |
| `api/nodes/FigJamNodes.md`                        | 해당없음 (Sticky/CodeBlock/Table 미사용)            |

## 9. 검증 게이트 결과 (INV-10)

| 게이트                        | 결과                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `npm run typecheck`           | ✅ **PASS**                                                 |
| `npm run check:protocol`      | ⚠ KNOWN 10 / **NEW 0** (기존 예상된 위반만, 신규 위반 없음) |
| `npm run check:constraints`   | ✅ **PASS** (모든 구조/제약 체크 통과)                      |
| `git status` — `src/`·`dist/` | ✅ **미변경** (애플리케이션 코드 0건 수정)                  |

## 10. 결론

Figma 공식 문서 30개 전수 분석 결과, 기존 Harness(INV-01~10, R-01~13)가 **12개 핵심 규칙을 이미 커버**하고 있었으며, Figma 공식 에러 패턴 기반으로 **4개 신규 규칙(R-14~R-17)** 을 추가했다. 신규 규칙은 모두 **Core 샌드박스 전용**이며, `allowlists.json`에 `client_storage_keys` 레지스트리를 추가해 R-15를 기계적으로 추적 가능하게 했다. 애플리케이션 코드(`src/`·`dist/`)는 **0건 수정**했으며, 모든 검증 게이트(typecheck / check:protocol / check:constraints)를 통과했다.
