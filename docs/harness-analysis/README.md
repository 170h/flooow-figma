# Harness Engineering 도입 분석

> **작성일**: 2026-09-28
> **프로젝트**: `/Users/170h/Developer/Figma/ui-flow-diagram`
> **참고 Harness**: `./harness-starter-kit`

## 문서 목록

| 파일                                                                                           | 내용                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`01-current-architecture-analysis.md`](01-current-architecture-analysis.md)                   | Current Architecture, Existing Verification Commands, Important Architecture Boundaries + Harness 검증 게이트 설계 제안                           |
| [`02-architecture-invariants.md`](02-architecture-invariants.md)                               | Architecture Invariants 10개 (INV-01~INV-10) — Rule/Why/Evidence/Agent Constraint/Verification + 위반 상태 매트릭스                               |
| [`03-agent-failure-risks.md`](03-agent-failure-risks.md)                                       | Agent Failure Risks 18개 (R-01~R-18) — Risk/실제 근거/Agent 실수 시나리오/Harness 제약 (R-14~17: Figma 공식 규칙, R-18: 명령 실행 루프 방지) |
| [`04-harness-architecture-design.md`](04-harness-architecture-design.md)                       | Harness Architecture 설계 — AGENTS.md 역할, 파일 목록, R/INV↔Harness 매핑, 자동/수동 검증, `.harness/` 구성, 최종 구조                            |
| [`05-action-index.md`](05-action-index.md)                                                     | 액션별 발신 위치 인덱스 — `PluginAction` 29종 / `CoreToUIMessage` 6종의 발신·수신·처리 위치 + 상태 (R-06/R-11)                                    |
| [`06-field-ownership.md`](06-field-ownership.md)                                               | 폼 필드 상태 소유권 맵 — 필드별 truth(DOM/React)·DOM ID·읽기/쓰기 위치 (R-01/INV-05)                                                              |
| [`07-verification-gates.md`](07-verification-gates.md)                                         | 완료 검증 게이트 — 자동(G1~G4) + 수동(M1~M8) + 완료 체크리스트 (INV-10/R-13)                                                                      |
| [`failures/0001-protocol-union-switch-drift.md`](failures/0001-protocol-union-switch-drift.md) | Failure Memory — INV-03/04 위반(union↔switch 불일치 10건) 기록 + `check:protocol` 링크 (KNOWN)                                                    |
| [`08-implementation-report.md`](08-implementation-report.md)                                   | Harness 구현 완료 보고서 — 생성/수정 파일, 검증 5종 결과, KNOWN 10건, git 미수정 확인                                                             |
| [`09-final-report.md`](09-final-report.md)                                                     | Figma 공식 규칙 추출·분류·통합 10항목 최종 보고서 — 30개 문서 전수 분석, 4분류, R-14~17 상세, 수정/미수정 파일, 공식 문서 매핑, 검증 게이트, 결론 |

## 분석 범위

- `package.json`, `tsconfig.json`, `manifest.json`
- `src/code.ts` (4,993줄), `src/types.ts` (419줄), `src/customConnector.ts`
- `src/ui/` 구조 (React 18, 3탭, 7모달)
- `scripts/build-ui.mjs` (빌드 파이프라인)
- `README.md`, `BUG_REPORT.md`, `VERIFICATION_REPORT.md`
- git status (main, clean)

## 핵심 발견 요약

1. **양방향 프로토콜 불일치**: `PluginAction` union ↔ `code.ts` switch ↔ `useFigmaMessage.ts` switch 3자 간 불일치 존재
2. **런타임 검증 부재**: 타입은 컴파일 타임 union으로만 보장, 런타임 스키마 검증 없음
3. **모놀리스 리스크**: `code.ts` 4,993줄 단일 파일, 신규 액션 추가 시 3곳 동시 수정 필요
4. **검증 자동화 부재**: typecheck + build + 수동 Figma 테스트가 전부 (테스트/Linter/CI 없음)
