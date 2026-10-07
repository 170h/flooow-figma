# 0002 — 노드+커넥터 혼합 선택 multiDraft 사각지대 (수정됨)

> **상태:** FIXED (2026-10-08, UI 측 수정 · Core 변경 없음)
> **분류:** R-01 (폼 상태 소유권) · INV-05 (DOM/state 읽기·쓰기 경로)
> **감지 게이트:** 신규 `test/selectionMixed.test.mjs` + 수동 시나리오
> **관련 커밋 범위:** `src/ui/utils/selectionUtils.ts`, `SizeSection.tsx`,
> `StyleSection.tsx`, `src/ui/App.tsx` (fill/stroke 모달), `src/ui/context/AppContext.tsx` (`applyMultiDraft`)

---

## 1. 증상 (2건, 동일 근원)

1. **Size Mixed 미표시:** 노드+커넥터 혼합 선택 시 W/H/Radius/사이즈모드 드롭다운에
   Mixed 표시가 나타나지 않음. 비활성 상태 자체는 정상.
2. **스타일 컬러 모달 무반응:** 혼합 선택에서 Fill/Stroke 모달로 색을 골라도
   Style 입력필드에 값이 등록되지 않고, 푸터 Apply도 동작하지 않음.

## 2. 근원

`analyzeSelection` (`src/ui/utils/selectionUtils.ts`)의 판정:

- `isSingleFlowNode = flowNodeCount === 1 && connectorCount === 0`
- `isMultiFlowNode = flowNodeCount > 1`

노드 1개 + 커넥터 N개 선택에서는 **둘 다 false**가 된다.
Size/Style 섹션·모달의 모든 Mixed/값 표시 분기가 이 두 플래그에만 의존하므로
`nodeOptionState`(생성 기본값)로 떨어졌고, 모달이 기록한 `multiDraft`
(`selectedNodes.length >= 2` 기준 기록)는 표시·적용 양쪽에서 무시됐다.
결정적으로 `applyMultiDraft`가 `nodes.some(n => !n.isFlowNode)` 조건으로
**혼합 선택의 batch 전체를 조용히 폐기**했으므로 Apply가 무반응이었다.

## 3. 수정 (UI 측만, `code.ts` 미변경)

- `SelectionSummary`에 `isMixedWithConnectors = flowNodeCount >= 1 && connectorCount >= 1` 추가.
- Size/Style/App 모달의 `isMultiFlowNode` 게이트를
  `isMultiFlowNode || isMixedWithConnectors`로 확장 (표시는 플로우 노드 요약 기준,
  Size 비활성 판정 `isSizeAllowed`는 그대로 유지).
- `applyMultiDraft`: 전체 폐기 대신 플로우 노드만 적용 대상으로 축소.
  선택 집합 staleness 가드(전체 ID 비교)는 유지하고,
  `BATCH_UPDATE_FLOW_NODES`의 `nodeIds`는 플로우 대상 ID만 전송
  (기존에는 draft 전체 ID = 커넥터 ID 포함이라 Core 오적용 위험이 있었음).
- Mixed 표기는 Figma 표준 리터럴 `'Mixed'`를 그대로 사용한다 (현지화하지 않음,
  `tipMixed` 키는 기즈모 툴팁 등 문장형 tooltip 전용).

## 4. 재발 방지

- `test/selectionMixed.test.mjs`: 혼합 플래그 + 플로우 기준 요약 5건.
  새 요약 플래그 추가 시 본 테스트에 케이스 추가할 것.
- `applyMultiDraft`의 대상 필터/ID 가드를 수정할 때는
  "커넥터 ID가 `nodeIds`에 섞이지 않는지"를 반드시 확인할 것.
