# 0004 — 복수 선택 Stroke 칩 None 전환 불가 (수정됨)

> **상태:** FIXED (2026-10-08, UI 측 1줄 수정 · Core 변경 없음)
> **분류:** R-01 (draft 기록 누락) · INV-05 (읽기·쓰기 경로)
> **감지:** 수동 시나리오 (Mixed stroke + weight 0 복수 선택에서 칩 클릭)
> **관련 파일:** `StyleSection.tsx` (`applyStrokeNone`)
> **선행:** 0002 (multiDraft 표시·적용 기반)

---

## 1. 증상

복수 오브젝트 선택(Mixed, 특히 stroke 색상 Mixed + 두께 0)에서
Style 행 보더 칩을 클릭해도 `/` (None) 아이콘으로 바뀌지 않음.

## 2. 근원

`applyStrokeNone`의 복수 분기가 `updateMultiDraft({ strokeWeight: 0 })`만 기록하고
`strokeColor`는 손대지 않았다. stroke 색상이 Mixed인 상태에서는
`isStrokeMixed`가 계속 true이므로 `isStrokeNone = !isStrokeMixed && ...`이
false로 막혀 칩이 None 표시로 전환되지 않는다.
(단일 선택에는 Mixed 게이트가 없어 정상 동작했음.)

## 3. 수정

복수 분기를 `updateMultiDraft({ strokeColor: "None", strokeWeight: 0 })`으로 변경.
단일 분기는 그대로 둔다 (단일은 weight만으로 None 판정이 성립하고,
기존 색상을 보존해야 칩 재클릭 시 원래 색으로 복원되기 때문).

Core 안전성: batch patch `{strokeColor:'None', strokeWeight:0}`는
weight 0 분기에서 strokes를 비우므로 `'None'`이 `hexToRgbColor`로 들어가도
문제없다 (NaN fallback 있음, 실제 사용 안 됨). Undo 스냅샷은 원본 색을 보존한다.

## 4. 재발 방지

- None/해제 토글은 **색상·두께 draft를 함께** 기록할 것. 한쪽만 기록하면
  Mixed 게이트(`isXxxMixed`)가 반대쪽 표시를 막는다.
- 복원 경로는 `effectiveStrokeColor`가 `'None'`이면 `#000000`으로 복원됨
  (Mixed 원복 불가 — 기존 색이 Mixed였으므로 허용).
