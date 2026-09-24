# UI 아이콘 절대 수정 금지 규칙 (Icons Immutability Rule)

## 1. Step Badges 섹션 아이콘 규칙
- **사이즈 규격**: 모든 아이콘은 **24px (`width="24" height="24" viewBox="0 0 24 24"`)** 고정입니다.
- **적용 완료된 아이콘 절대 수정 금지**:
  - `BADGE_CORNERS` 4개 코너 아이콘 (`TOP_LEFT`, `TOP_RIGHT`, `BOTTOM_LEFT`, `BOTTOM_RIGHT`)의 SVG 패스는 오리지널 디자인 시스템의 원본 패스이며, **어떤 경우에도 임의로 SVG를 다시 만들거나 대체하지 마십시오.**
  - `step-number-icon` (# 프레임형 넘버 아이콘) 또한 오리지널 24x24 규격의 원본 패스를 유지해야 하며 임의로 수정/교체하지 마십시오.
- **UI 요소 크기 동기화**:
  - 24px 아이콘이 담기는 입력 필드(`input-scrubber-box`) 및 코너 버튼 그룹(`corner-position-group`)의 높이는 기본 28px 규격을 준수합니다.
