# 0003 — 비-Screen 혼합 선택 Size Mixed 표시 빈칸 (수정됨)

> **상태:** FIXED (2026-10-08, UI 측 수정 · Core 변경 없음)
> **분류:** R-01 (폼 상태 소유권) · 표시/적용 판정 분리
> **감지 게이트:** `test/selectionMixed.test.mjs` (실제값 판정 2건 추가) + 수동 시나리오
> **관련 파일:** `SizeSection.tsx` (`test/selectionMixed.test.mjs`)
> **선행:** 0002 (혼합 선택 사각지대)

---

## 1. 증상

8개 오브젝트 선택(Process/Junction/Decision/Terminator + 커넥터)에서
Size W/H/Radius 입력이 빈칸, 사이즈모드 드롭다운은 `Fixed height`로 표시됨.
Style 섹션은 같은 선택에서 Mixed를 정상 표시함.

## 2. 근원

`summary.width/height/cornerRadius/sizeMode`는 `'size'` 옵션 필터로 집계되며,
Size는 Screen 전용이므로 Process 등 비-Screen 노드는 집계에서 제외된다.
전원 제외 시 `{ value: undefined, isMixed: false }`가 되어
placeholder(`isMixed ? Mixed : undefined`)가 사라지고 빈칸이 된다.
비활성 판정(`isSizeAllowed`)은 정상이었으므로 표시만 빈칸인 상태였다.

## 3. 수정 (표시/비활성 분리)

- Mixed **표시**는 노드 실제값 기준 무필터 판정(`getCommonProperty` 직접 호출,
  `judgeW/judgeH/judgeR/judgeSizeMode`)으로 변경. 값이 같으면 공통값 표시,
  다르면 Mixed 표시. 기존 Screen 요약값은 fallback으로 유지.
- 비활성·편집 차단(`isSizeAllowed`, commit early-return)은 그대로 유지.
- `judgeSizeMode` 선언을 `currentSizeMode`보다 앞으로 배치 (TDZ 방지).

## 4. 재발 방지

- 표시용 Mixed와 적용 가능 여부(capability)는 분리해서 판단할 것.
  옵션 필터가 걸린 summary를 표시에 그대로 쓰면 미지원 노드가 포함된 선택에서
  항상 빈칸이 된다.
- `test/selectionMixed.test.mjs`의 비-Screen 2건을 유지할 것.
