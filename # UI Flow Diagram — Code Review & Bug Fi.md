# UI Flow Diagram — Code Review & Bug Fix Plan

## 0. 작업 원칙

- 이 문서를 기준으로 작업한다.
- 코드를 수정하기 전에 각 이슈를 실제 코드와 대조하여 검증한다.
- 검증되지 않은 이슈를 버그로 간주하지 않는다.
- 기존 기능/UX를 임의로 변경하지 않는다.
- 관련 없는 리팩터링을 하지 않는다.
- 한 번에 전체 이슈를 수정하지 않는다.
- 각 작업 그룹별로 수정 → TypeScript/build 검사 → 결과 확인을 진행한다.
- CSS 작업과 React/TypeScript 기능 수정은 분리한다.

---

## 1. 1차 작업 — Bug Report Validation

### 목표

아래 버그 리포트의 각 항목을 현재 코드와 대조하여 검증한다.

각 항목을 다음 중 하나로 분류한다.

- CONFIRMED
- PARTIAL
- FALSE POSITIVE
- ALREADY FIXED
- DESIGN INTENT

각 항목에 대해:

- 실제 문제
- 재현 가능성
- 영향 범위
- 관련 파일
- 다른 이슈와의 관계
- 수정 우선순위

를 기록한다.

**중요: 이 단계에서는 코드를 수정하지 않는다.**

---

## 2. Critical — Input / Modal

대상:

1. 3자리 HEX padStart
2. parseInt → parseFloat
3. Enter + blur 이중 커밋
4. Cancel 시 initialColor 재적용

검증 완료 후에만 수정한다.

---

## 3. Critical — State / Data Integrity

대상:

5. elevation >= 0
6. Boolean getter
7. Date.now() ID
8. theme hardcoding
9. undefined stroke values
10. as any
11. multi-node connection
12. title truncation

---

## 4. Critical — UI / Architecture

대상:

13. dead currentStatus
14. stale defaultValue
15. window.\_titleDebounce
16. direct DOM manipulation
17. selectedNodes dependency
18. dead Link feature
19. stale isOn
20. duplicate setUIState
    ...

---

## 5. CSS / Theme

React/TypeScript 수정과 별도로 진행한다.

먼저 분석만 수행한다.

### Theme selectors

- body.figma-dark-auto
- body.figma-dark
- .figma-dark
- .theme-dark
- [data-theme="dark"]
- .dark
- :not(.light)

실제 runtime에서 어떤 selector가 사용되는지 확인한 후 통합한다.

### Primary color

현재 primary:

#8C4CF6

다른 fallback:

#0d99ff

실제 디자인 시스템 기준을 확인한 후 통일한다.

---

## 6. Medium

CSS consistency / hardcoded colors / duplicated rules

---

## 7. Low

dead code / deprecated API / maintainability

---

## 8. 작업 후 검증

각 그룹마다:

- TypeScript
- ESLint
- build
- 관련 기능 regression
- 기존 데이터 호환성

을 확인한다.

## 9. 절대 하지 말 것

- 전체 코드 rewrite
- 대규모 컴포넌트 재구성
- 임의의 디자인 변경
- API/data model 변경
- 검증되지 않은 항목 수정
- 관련 없는 코드 cleanup
