# Project Rules & Guidelines

## 1. UI 아이콘 영구 보존 및 사이즈 규칙
- **아이콘 사이즈**: UI에 적용되는 기본 아이콘 사이즈는 **24px (`width="24" height="24" viewBox="0 0 24 24"`)**입니다.
- **아이콘 절대 수정 금지**:
  - `StepBadgesSection`의 `BADGE_CORNERS` 4개 코너 위치 아이콘(Top-Left, Top-Right, Bottom-Left, Bottom-Right)과 `step-number-icon` 등 이미 적용 완료된 공식 SVG 아이콘은 **어떤 이유로도 임의로 다시 만들거나 수정/교체하지 마십시오.**

## 2. 디자인 및 텍스트 규칙
- text에 tracking(letter-spacing) 옵션은 부여하지 마십시오.
- 모든 코드 주석과 설명, 응답은 한국어로 작성하십시오.

## 3. 커넥터 SQUARE(사각 스타일) 단자 렌더링 규칙
- **대각선 세그먼트 절대 생성 금지**:
  - `customConnector.ts`의 `buildVectorNetwork`에서 SQUARE 단자 생성 시, 사각형의 외곽 4개 변(세그먼트 4개)으로만 구성해야 합니다.
  - 내부에 대각선(X자) 세그먼트(`vStart ↔ vStart+2`, `vStart+1 ↔ vStart+3`)를 추가하면 피그마 렌더링 시 사각형 중앙에 X자 스트로크가 그어지거나 면이 뚫린 구멍처럼 보이므로 **절대 추가하지 마십시오.**
- **면 채움(Region Fill) 필수 보장**:
  - SQUARE 단자는 외곽 4변을 루프로 묶은 `regions`(`windingRule: 'NONZERO'`)를 등록하고, `vector.fills = [{ type: 'SOLID', color: strokeColor }]`로 채워져야 내부가 투명해져 캔버스 도트 그리드가 비쳐 보이는 현상을 방지할 수 있습니다.

## 4. 커넥터 단자(Terminal) 크기 영구 고정 규칙 (임의 변경 절대 금지)
- `customConnector.ts`의 `buildVectorNetwork`에서 단자 크기 수식은 사각형/원형/마름모 간의 시각적 부피감(Visual Weight)이 완벽히 균형을 이루도록 확정된 값이므로 **어떤 이유로도 임의로 수정하거나 변경하지 마십시오.**
  1. **BAR (막대)**:
     - `barLen = Math.max(7, Math.round(strokeWeight * 4.8))` (기본 1.5px 기준 길이 약 7px)
  2. **SQUARE (사각형)**:
     - `sqSize = Math.max(6, Math.round(strokeWeight * 3.5))` (기본 1.5px 기준 한 변 6px, 6×6px 박스)
  3. **DIAMOND (마름모)**:
     - `diaRadius = Math.max(3.8, Math.round(strokeWeight * 2.6))` (기본 1.5px 기준 반지름 약 3.8~4px, 대각선 전폭 약 7.6~8px)
     - 마름모는 피그마 내장 Cap 대신 닫힌 루프와 Region Fill을 사용하는 커스텀 벡터 네트워크로 렌더링되어야 하며, 상기 반지름 수식을 유지해야 사각형(6px) 및 원형(직경 6px)과 시각적으로 동등한 크기로 보입니다.


