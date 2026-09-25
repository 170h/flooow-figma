# 🎨 피그마 공식 UI3 디자인 시스템 및 컴포넌트 개발 참조 가이드 (UI3 Design System Reference)

본 문서는 피그마 공식 디자인 키트(`UI3: Figma's UI Kit (Community)`)의 각 컴포넌트 페이지에 수록된 공식 설명, 사용 목적, 변체(Variants), 상태(States), 레이아웃 규격 및 **실제 프론트엔드/플러그인 구현 시 필수적인 엔지니어링 고려사항 및 공식 피그마 변수(Variables/Tokens) 매핑**을 집대성한 표준 개발 문서입니다.

### 🏛️ UI3 공식 기초 디자인 시스템 (Foundations - 6종 전수 구축)
| 번호 | 파운데이션 명칭 | Figma Node ID | 핵심 설계 규칙 및 가이드라인 |
| :---: | :--- | :--- | :--- |
| **F1** | [Color (시맨틱 컬러 시스템)](#f1-color-시맨틱-컬러-시스템---light--dark) | `1-547037` | Light/Dark 테마 대응, Surface/Text/Border/Icon 4계층 분리 |
| **F2** | [Typography (타이포그래피)](#f2-typography-타이포그래피-시스템) | `2012-298199` | 폰트 스케일(10~14px), Tabular 고정폭, **글자 간격(Tracking) 금지** |
| **F3** | [Elevations & Shadows (깊이감)](#f3-elevations--shadows-그림자-및-깊이-시스템) | `2012-307426` | 5단계 그림자(Flat~Modal), 다크 모드 1px 아웃라인 보정 |
| **F4** | [Grid, Spacing & Radius (레이아웃)](#f4-grid-spacing--radius-간격-및-반경-시스템) | `1-530439` | 8px/4px 간격 스케일, 2~8px 둥글기, 인스펙터 패널 컬럼 스냅 |
| **F5** | [Icons (시스템 아이콘 규격)](#f5-icons-시스템-아이콘-규격-및-광학-정렬) | `1-530873` | 16px/24px 그리드, 1.5px 선 두께, 광학 중앙 정렬, currentColor |
| **F6** | [Cursors (커서 및 인터랙션)](#f6-cursors-커서-시스템-및-인터랙션-상태) | `2012-308103` | Scrubbing(ew-resize), Grab, Pointer, Disabled 등 명확한 상태 반응 |

---

### 📋 UI3 공식 핵심 컴포넌트 17종 전체 목록 (100% 반영 완료)
| 번호 | 컴포넌트 명칭 | Figma Node ID | 핵심 키워드 |
| :---: | :--- | :--- | :--- |
| **1** | [Avatar (아바타)](#1-avatar-아바타) | `2012-32015`, `2012-31683` | 4규격 (20/24/32/40), 원형/라운드스퀘어, 음수마진 스택 |
| **2** | [Badges (뱃지)](#2-badges-뱃지) | `2012-32973` | 6시맨틱 컬러, 인라인 메타데이터, 캡슐 라운딩 |
| **3** | [Button (버튼 시스템)](#3-button-버튼-시스템) | `2012-46721` | Primary, Secondary, Destructive, Ghost, 32px/28px/24px |
| **4** | [Menus (메뉴 및 컨텍스트 메뉴)](#4-menus-메뉴-및-컨텍스트-메뉴) | `2028-86486` | 팝오버 메뉴, 8px 반경, Lead/Content/Trail 3단 구조 |
| **5** | [Modals (모달 다이얼로그)](#5-modals-모달-다이얼로그-시스템) | `2028-91765` | Scrim, Header/Body/Footer 3단, 4개 표준 너비 |
| **6** | [Notifications (HUD 토스트 알림)](#6-notifications-hud-토스트-알림) | `2028-109149` | Inverse 플로팅 바, Action/Dismiss, 하단 우측/중앙 |
| **7** | [Radio Button (라디오 버튼)](#7-radio-button-라디오-버튼) | `2015-20200` | 16px 원형 + 6px Dot, 단일 선택, 키보드 화살표 탐색 |
| **8** | [Segmented Control (세그먼트 컨트롤)](#8-segmented-control-세그먼트-컨트롤) | `2015-20818` | 88px/168px 그리드, 캡슐형 탭, 1개 필수 선택 유지 |
| **9** | [Slider (슬라이더 가이드라인)](#9-slider-슬라이더-및-슬라이더-가이드라인) | `2015-23026` | Range, Delta(양방향), Stepper, Color/Alpha, 노브 드래그 |
| **10** | [Switch (스위치)](#10-switch-스위치) | `2015-24401` | 물리 토글 모티브, 즉시 시스템 반영 (Immediate Effect) |
| **11** | [Tooltip (툴팁 및 링크 툴팁)](#11-tooltip-툴팁-및-링크-툴팁) | `2015-32842` | 3~20자 안내, 호버 인텐트 딜레이, 핫키 표기 |
| **12** | [Checkboxes (체크박스)](#12-checkboxes-체크박스) | `2012-55102` | On / Off / Mixed(Indeterminate), 16px, 명시적 저장 폼 |
| **13** | [Comments (댓글 및 스레드)](#13-comments-협업-댓글-및-스레드) | `2012-56281` | 캔버스 핀, 360px 스레드 윈도우, 작성기, 사이드바 행 |
| **14** | [Dropdowns (드롭다운 및 옵션 피커)](#14-dropdowns-드롭다운-및-옵션-피커) | `2028-36479` | Borderless 기본 스타일, 1/2/3컬럼 그리드 스냅 |
| **15** | [Inputs (인풋 시스템)](#15-inputs-인풋-시스템---numeric-combo-paint-emphasized-pill) | `2028-75376`, `2028-23030` | Numeric(스크러빙), Combo, Paint, Emphasized, Pill(변수 칩) |
| **16** | [Tabs (탭 네비게이션)](#16-tabs-탭-네비게이션) | `2015-25519` | 24px 표준 높이, Single Tab 타이틀 모드, 카운터 뱃지 |
| **17** | [Visual Bells (비주얼 벨 및 상태 바)](#17-visual-bells-비주얼-벨-및-상태-바) | `2015-40421` | 하단 중앙 HUD 플로팅 바, Tabular 진행률, 에러 영구 지속 |

---

# Part 1. 기초 디자인 시스템 (Foundations)

## F1. Color (시맨틱 컬러 시스템 - Light & Dark)
> **Figma Node ID**: `1-547037`

### F1.1 핵심 철학 및 4계층 아키텍처
피그마 UI3의 컬러 시스템은 단순 헥스(Hex) 코드의 나열이 아니라, **사용 목적과 계층(Hierarchy)에 따라 철저히 추상화된 시맨틱 토큰(Semantic Tokens)**을 채택하고 있습니다. 라이트 모드와 다크 모드 전환 시 코드 수정 없이 CSS 변수 값만 스왑되도록 4대 계층(`Surface / Text / Border / Icon`)으로 구분됩니다.

### F1.2 공식 시맨틱 컬러 토큰 매핑 테이블
| 계층 (Category) | 공식 피그마 변수 토큰 | 라이트 모드 (Light) | 다크 모드 (Dark) | 설계 목적 및 용도 |
| :--- | :--- | :--- | :--- | :--- |
| **Surface (배경)** | `var(--figma-color-bg)` | `#ffffff` | `#2c2c2c` | 기본 패널, 모달 본체, 캔버스 윈도우 배경 |
| | `var(--figma-color-bg-secondary)` | `#f5f5f5` | `#1e1e1e` | 인스펙터 패널 배경, 그룹화된 섹션 카드, 탭 배경 |
| | `var(--figma-color-bg-tertiary)` | `#ebebeb` | `#383838` | 강조 인풋 필드 바탕, 슬라이더 트랙 미채움 |
| | `var(--figma-color-bg-hover)` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` | 인터랙티브 요소 호버 피드백 |
| | `var(--figma-color-bg-selected)` | `rgba(13,153,255,0.1)` | `rgba(13,153,255,0.2)` | 활성화된 트리 노드, 선택 항목 하이라이트 |
| | `var(--figma-color-bg-brand)` | `#0d99ff` | `#0d99ff` | 피그마 시그니처 블루 (Primary 액션, 체크박스 채움) |
| | `var(--figma-color-bg-inverse)` | `#2c2c2c` | `#ffffff` | 고대비 반전 플로팅 배경 (토스트, 툴팁, Primary 버튼) |
| | `var(--figma-color-bg-danger)` | `#e03e3e` | `#e03e3e` | 삭제/경고/에러 상태 배경 |
| | `var(--figma-color-bg-warning)` | `#f2994a` | `#f2994a` | 주의, 대기, 리스크 알림 배경 |
| | `var(--figma-color-bg-success)` | `#14ae5c` | `#14ae5c` | 정상 완료, 검증 통과 뱃지 |
| **Text (텍스트)** | `var(--figma-color-text)` | `#1e1e1e` | `#ffffff` | 주요 본문 텍스트, 활성 라벨, 입력 값 |
| | `var(--figma-color-text-secondary)` | `rgba(0,0,0,0.5)` | `rgba(255,255,255,0.6)` | 보조 설명, 단축키 힌트, 미선택 탭 텍스트 |
| | `var(--figma-color-text-tertiary)` | `rgba(0,0,0,0.3)` | `rgba(255,255,255,0.35)` | 플레이스홀더, 비활성 텍스트 |
| | `var(--figma-color-text-brand)` | `#0d99ff` | `#0d99ff` | 텍스트 링크, 강조 브랜드 라벨 |
| | `var(--figma-color-text-danger)` | `#e03e3e` | `#e03e3e` | 유효성 실패 에러 메시지, 파괴 액션 텍스트 |
| | `var(--figma-color-text-onbrand)` | `#ffffff` | `#ffffff` | 브랜드 배경 또는 위험 배경 위 텍스트 |
| | `var(--figma-color-text-oninverse)` | `#ffffff` | `#000000` | Inverse 다크/라이트 플로팅 배경 위 텍스트 |
| **Border (경계선)**| `var(--figma-color-border)` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.12)` | 일반 패널 분리선, 1px 보더 |
| | `var(--figma-color-border-strong)` | `rgba(0,0,0,0.2)` | `rgba(255,255,255,0.25)` | 뚜렷한 인풋 경계선, 라디오 외곽선 |
| | `var(--figma-color-border-brand-strong)`| `#0d99ff` | `#0d99ff` | 키보드 내비게이션 활성 포커스 링 (Focus Ring) |
| | `var(--figma-color-border-danger)` | `#e03e3e` | `#e03e3e` | 유효성 에러 인풋 테두리 |
| **Icon (아이콘)** | `var(--figma-color-icon)` | `#1e1e1e` | `#ffffff` | 기본 시스템 아이콘 |
| | `var(--figma-color-icon-secondary)` | `rgba(0,0,0,0.5)` | `rgba(255,255,255,0.6)` | 보조 아이콘, 접힘/펼침 꺾쇠 |
| | `var(--figma-color-icon-tertiary)` | `rgba(0,0,0,0.3)` | `rgba(255,255,255,0.35)` | 비활성 아이콘, 기본값 인디케이터 |
| | `var(--figma-color-icon-brand)` | `#0d99ff` | `#0d99ff` | 브랜드 아이콘, 메뉴 체크마크 |
| | `var(--figma-color-icon-onbrand)` | `#ffffff` | `#ffffff` | 버튼/체크박스 내부 흰색 아이콘 |

---

## F2. Typography (타이포그래피 시스템)
> **Figma Node ID**: `2012-298199`

### F2.1 폰트 패밀리 및 필수 원칙
* **기본 서체**: `Inter`, system-ui, -apple-system, BlinkMacSystemFont, sans-serif
* **★ 글자 간격(Tracking) 금지 원칙**: 피그마 UI3 디자인 시스템에서는 자간을 억지로 넓히거나 좁히는 행위를 엄격히 금지합니다. 모든 타이포그래피 요소는 **`letter-spacing: 0` (기본값)**을 유지해야 합니다.
* **★ 고정폭 숫자 원칙 (Tabular Numbers)**: 인스펙터의 X, Y, W, H 수치, 슬라이더 값, 진행률 퍼센트 등 정량적 수치가 변경될 때 글자 폭이 달라져 레이아웃이 흔들리는 것을 방지하기 위해 반드시 **`font-variant-numeric: tabular-nums`**를 적용합니다.

### F2.2 공식 타이포그래피 스케일 및 용도
| 토큰 명칭 | Font Size | Line Height | Font Weight | 주 용도 및 적용 컴포넌트 |
| :--- | :---: | :---: | :---: | :--- |
| **Title** | `14px` | `20px` | 600 (Semibold) | 모달 다이얼로그 헤더, 섹션 대제목 |
| **Body Medium Strong** | `12px` | `16px` | 600 (Semibold) | 버튼 텍스트, 활성 탭 라벨, 주요 메뉴 타이틀 |
| **Body Medium** | `12px` | `16px` | 400 (Regular) | 일반 본문 텍스트, 메뉴 항목, 드롭다운 옵션 |
| **Body Small Strong** | `11px` | `16px` | 600 (Semibold) | 인스펙터 속성 라벨(X, Y, W, H), 뱃지 텍스트 |
| **Body Small** | `11px` | `16px` | 400 (Regular) | 인스펙터 수치 입력값, 보조 설명문, 툴팁 |
| **Caption** | `10px` | `12px` | 400 (Regular) | 메뉴 단축키 힌트, 미세 아바타 이니셜 |

---

## F3. Elevations & Shadows (그림자 및 깊이 시스템)
> **Figma Node ID**: `2012-307426`

### F3.1 5단계 고도(Elevation) 계층 원칙
화면 캔버스부터 플로팅 모달까지 Z축 깊이감(Z-Index)에 맞춰 5단계 그림자 레이어를 규정합니다.

| Elevation 레벨 | Box Shadow CSS 값 | 적용 컴포넌트 및 용도 |
| :--- | :--- | :--- |
| **Elevation 0 (Flat)** | `none` | 캔버스 본체, 좌/우측 인스펙터 패널 배경 |
| **Elevation 1 (Card/Knob)**| `0 1px 2px rgba(0, 0, 0, 0.08)` | 세그먼트 컨트롤 활성 노브, 슬라이더 노브, 선택 카드 |
| **Elevation 2 (Floating Bar)**| `0 2px 8px rgba(0, 0, 0, 0.16)` | 툴팁(Tooltip), 비주얼 벨(Toast Bell) |
| **Elevation 3 (Menu/Popover)**| `0 4px 16px rgba(0, 0, 0, 0.18)` | 컨텍스트 메뉴, 드롭다운 팝오버, 스레드 윈도우 |
| **Elevation 4 (Modal)** | `0 8px 32px rgba(0, 0, 0, 0.24)` | 모달 다이얼로그 (최상위 Elevation) |

### F3.2 💡 다크 모드 그림자 엔지니어링 고려사항
* 다크 모드(`--figma-color-bg: #2c2c2c`)에서는 검은색 그림자만으로는 배경과 패널 간 경계 구분이 어렵습니다.
* 따라서 UI3 다크 모드에서는 모든 Elevation 2~4 컴포넌트에 **`1px solid rgba(255, 255, 255, 0.1)` 미세 외곽선**을 함께 부여하여 시각적 분리감을 극대화합니다.

---

## F4. Grid, Spacing & Radius (간격 및 반경 시스템)
> **Figma Node ID**: `1-530439`

### F4.1 8px & 4px 스페이싱(Spacing) 스케일
UI3의 모든 컴포넌트 내부 패딩 및 외부 마진은 8px 기본 배수와 밀집 패널용 4px 서브 배수를 엄격히 준수합니다.

* `space-xxs`: **2px** - 초미세 패딩, 아이콘과 카운터 뱃지 사이 간격
* `space-xs`: **4px** - 탭 간격, 인라인 액션 버튼 간격, 메뉴 상하 아이템 간격
* `space-sm`: **8px** - 폼 필드 상하 패딩, 체크박스-라벨 간격, 모달 내부 요소 기본 간격
* `space-md`: **12px** - 인스펙터 패널 섹션 여백, 컴포넌트 그룹 간격
* `space-lg`: **16px** - 모달 본문 패딩, 화면 모서리 안전 여백(Safe margin)
* `space-xl`: **24px** - 대형 모달 헤더 패딩, 튜토리얼 뷰 패딩

### F4.2 모서리 곡률(Corner Radius) 토큰
* `radius-xs`: **2px** - 체크박스 내부 인디케이터, 초소형 게이지 바
* `radius-sm`: **4px** - 체크박스 외곽, 메뉴 행(Row) 호버 하이라이트, 인풋 필드
* `radius-md`: **6px** - 표준 버튼, 세그먼트 컨트롤 외곽, 툴팁, 라운드 아바타
* `radius-lg`: **8px** - 메뉴 팝오버 컨테이너, 비주얼 벨, 모달 다이얼로그 외곽
* `radius-full`: **9999px / 50%** - 원형 프로필 아바타, 라디오 버튼, 캡슐 뱃지

### F4.3 인스펙터 패널 컬럼 스냅 그리드 (Column Snap)
우측 프로퍼티 패널은 컴팩트한 정렬을 위해 3단계 컬럼 규격을 채택합니다:
* **`col-1` (약 72px)**: 단일 X, Y, W, H 수치 입력 필드
* **`col-2` (약 148px)**: 2단 병합 드롭다운 (예: 제약조건, 블렌드 모드)
* **`col-3 / Full` (약 224~240px)**: 패널 전폭 인풋, 색상 스와치 바, 에셋 검색창

---

## F5. Icons (시스템 아이콘 규격 및 광학 정렬)
> **Figma Node ID**: `1-530873`

### F5.1 2대 표준 바운딩 박스(Bounding Box)
* **16px 시스템 아이콘 (`16px × 16px`)**: 인스펙터 패널, 인풋 스크러버, 메뉴 선두 아이콘, 버튼 보조 아이콘
* **24px 툴바 아이콘 (`24px × 24px`)**: 상단 메인 툴바 도구(Move, Frame, Pen 등), 대형 다이얼로그 헤더 아이콘

### F5.2 디자인 및 엔지니어링 구현 원칙
* **광학적 중심 정렬(Optical Centering)**: 모든 SVG 아이콘은 16×16 또는 24×24 정사각형 투명 캔버스 중앙에 광학적 무게 중심을 맞춰 제작됩니다.
* **선 두께 표준 (Stroke Width)**: 16px 아이콘 기준으로 **`1.5px`**의 정밀한 선 두께를 유지하여 레티나 및 고해상도 디스플레이에서 왜곡 없이 렌더링되도록 합니다.
* **색상 동적 상속 (`currentColor`)**: SVG 내부의 `fill` 또는 `stroke`는 하드코딩된 색상이 아닌 `currentColor` 또는 `var(--figma-color-icon)`를 적용하여 부모 컴포넌트의 호버/비활성 상태에 자동으로 반응하도록 구성합니다.

---

## F6. Cursors (커서 시스템 및 인터랙션 상태)
> **Figma Node ID**: `2012-308103`

### F6.1 상황별 표준 마우스 커서 매핑
사용자가 마우스를 올렸을 때 컴포넌트의 동작 가능성을 즉각 인지할 수 있도록 커서 스타일을 엄격히 지정합니다.

| 커서 스타일 | CSS Cursor 속성 | 적용 상황 및 컴포넌트 |
| :--- | :--- | :--- |
| **기본 (Default)** | `cursor: default;` | 캔버스 바탕, 텍스트 라벨(단순 읽기 전용) |
| **포인터 (Pointer)** | `cursor: pointer;` | 버튼, 메뉴 항목, 체크박스, 라디오, 링크 등 클릭 액션 |
| **텍스트 입력 (Text)** | `cursor: text;` | 텍스트 인풋 필드, 콤보박스 타이핑 영역 |
| **스크러빙 (Scrubbing)** | `cursor: ew-resize;` (또는 `col-resize`) | 수치 인풋 라벨(X, Y, W, H) 좌우 드래그 수치 조절 |
| **캔버스 팬/드래그 (Grab)** | `cursor: grab;` / `cursor: grabbing;` | 슬라이더 노브 드래그 중, 핸드 툴 캔버스 이동 |
| **도형 생성 (Crosshair)** | `cursor: crosshair;` | 프레임, 사각형, 펜 툴 드로잉 상태 |
| **비활성 금지 (Disabled)**| `cursor: not-allowed;` | Disabled 상태의 버튼, 스위치, 인풋 필드 |

---

# Part 2. 핵심 UI 컴포넌트 시스템 (Components)

## 1. Avatar (아바타)
> **Figma Node ID**: `2012-32015`, `2012-31683`

### 1.1 개요 및 목적
* 팀원, 공동 작업자, 계정 프로필을 시각적으로 식별하기 위한 컴포넌트입니다.
* 사진 이미지가 없는 경우 이니셜(기본 1~2자) 또는 대표 아이콘을 표시합니다.

### 1.2 규격 및 배리언트
* **크기 표준**:
  * `xs`: 20px × 20px (폰트 10px) - 밀집 리스트 및 테이블용
  * `sm`: 24px × 24px (폰트 11px) - 인스펙터 패널용 기본 크기
  * `md`: 32px × 32px (폰트 12px) - 모달 헤더 및 프로필 카드용
  * `lg`: 40px × 40px (폰트 14px) - 대형 프로필 뷰용
* **형태**:
  * 원형 (`border-radius: 50%`): 사용자 개인 프로필
  * 둥근 사각형 (`border-radius: 6px`): 팀, 프로젝트, 워크스페이스
* **아바타 그룹 (Stacking)**:
  * 겹침 간격: `-6px` (음수 마진)
  * 테두리: `2px solid var(--figma-color-bg)` (배경색과 동일한 아웃라인으로 경계선 분리)

### 1.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **이미지 로드 실패(Fallback) 처리**: 네트워크 에러 시 `onerror` 이벤트로 감지하여 이름 첫 글자 기반 이니셜 또는 기본 유저 SVG 아이콘으로 즉시 대체합니다.
* **스택 z-index 순서**: 호버된 아바타의 `z-index`를 일시적으로 올려 전체 모습을 확인할 수 있도록 처리합니다.

---

## 2. Badges (뱃지)
> **Figma Node ID**: `2012-32973`

### 2.1 개요 및 목적
* 객체의 상태(State), 카테고리, 속성 메타데이터를 컴팩트하게 전달하는 인라인 라벨 컴포넌트입니다.

### 2.2 피그마 공식 UI3 시맨틱 컬러 토큰 매핑
| 시맨틱 구분 | 공식 피그마 변수 토큰 | 용도 및 의미 |
| :--- | :--- | :--- |
| **Neutral** | `var(--figma-color-bg-tertiary)` / `var(--figma-color-text)` | 중립 상태, 일반 태그 |
| **Brand** | `var(--figma-color-bg-brand)` / `var(--figma-color-text-onbrand)` | 피그마 시그니처 블루, 핵심 포커스 |
| **FigJam** | `var(--figma-color-bg-figjam, #9747ff)` | FigJam 퍼플 액션 |
| **Success** | `var(--figma-color-bg-success, #14ae5c)` | 정상, 완료, 검증됨 |
| **Warning** | `var(--figma-color-bg-warning, #f2994a)` | 주의, 대기, 보류 |
| **Danger** | `var(--figma-color-bg-danger)` / `var(--figma-color-text-danger)` | 에러, 위험, 차단 |

### 2.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **텍스트 줄바꿈 방지**: 좁은 패널 내에서도 뱃지 내용이 깨지지 않도록 반드시 `white-space: nowrap`을 지정합니다.
* **글자 간격(Tracking) 금지 원칙 준수**: 가독성을 위해 `letter-spacing`은 기본값(0)을 유지합니다.

---

## 3. Button (버튼 시스템)
> **Figma Node ID**: `2012-46721`

### 3.1 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 버튼 유형 | 배경 토큰 | 텍스트/아이콘 토큰 | 테두리 토큰 |
| :--- | :--- | :--- | :--- |
| **Primary** | `var(--figma-color-bg-inverse, #2c2c2c)` | `var(--figma-color-text-oninverse, #ffffff)` | `none` |
| **Secondary** | `var(--figma-color-bg)` | `var(--figma-color-text)` | `1px solid var(--figma-color-border)` |
| **Destructive** | `var(--figma-color-bg-danger)` | `var(--figma-color-text-onbrand, #ffffff)` | `none` |
| **Destructive Secondary** | `var(--figma-color-bg)` | `var(--figma-color-text-danger)` | `1px solid var(--figma-color-border-danger)` |
| **Ghost / Link** | `transparent` (호버 시 `var(--figma-color-bg-hover)`) | `var(--figma-color-text)` | `none` |

### 3.2 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **마이크로 인터랙션**: 클릭 시 `:active`에서 `transform: scale(0.98)` 미세 축소 모션을 적용합니다.
* **키보드 포커스 링**: `:focus-visible` 시 `outline: 2px solid var(--figma-color-border-brand-strong)`를 부여합니다.

---

## 4. Menus (메뉴 및 컨텍스트 메뉴)
> **Figma Node ID**: `2028-86486`

### 4.1 규격 및 구조
* **컨테이너**: `border-radius: 8px`, 패딩 상하 4~6px, `box-shadow: 0 4px 16px rgba(0,0,0,0.16)`
* **메뉴 행(Row)**: 높이 28~32px, 호버 시 `border-radius: 4px` 하이라이트 박스
* **행 구조**: Lead(체크마크/아이콘/아바타) + Content(라벨) + Trail(단축키/서브메뉴 꺾쇠/뱃지)

### 4.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **메뉴 컨테이너 배경** | `var(--figma-color-bg-menu, var(--figma-color-bg))` | 플로팅 팝오버 배경 |
| **메뉴 테두리 (Border)** | `var(--figma-color-border-menu, var(--figma-color-border))` | 외곽선 1px 경계선 |
| **행 일반 상태 (Default)** | 배경 `transparent`, 텍스트 `var(--figma-color-text)` | 기본 행 텍스트 |
| **행 호버/포커스 (Hover)** | 배경 `var(--figma-color-bg-hover)`, 텍스트 `var(--figma-color-text)` | 호버 시 4px 둥근 하이라이트 |
| **행 비활성 (Disabled)** | 텍스트 `var(--figma-color-text-disabled)` (불투명도 40%) | 클릭 불가 메뉴 항목 |
| **단축키 / 보조 텍스트 (Trail)** | `var(--figma-color-text-secondary)` | `⌘C`, 설명 라벨 |
| **선두 아이콘 (Icon Lead)** | `var(--figma-color-icon-secondary)` (일반) / `var(--figma-color-icon)` (호버) | 16px 선두 아이콘 |
| **체크마크 (Checkmark Lead)** | `var(--figma-color-icon-brand, var(--figma-color-icon))` | 활성 On 체크 표시 |
| **구분선 (Divider)** | `var(--figma-color-border)` | 섹션 분리 1px 수평선 |
| **섹션 헤더 (Header)** | `var(--figma-color-text-secondary)` (`font-size: 10px`) | 대문자 그룹 명칭 |

### 4.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **화면 경계 감지(Collision Detection)**: 팝오버가 화면 오른쪽/하단 가장자리에 걸칠 경우 메뉴를 위쪽이나 왼쪽으로 자동 반전(Flip)시킵니다.
* **서브메뉴 지연(Hover Intent Buffer)**: 대각선 마우스 이동 시 서브메뉴가 닫히지 않도록 150~200ms 디바운스를 부여합니다.

---

## 5. Modals (모달 다이얼로그 시스템)
> **Figma Node ID**: `2028-91765`

### 5.1 3단 아키텍처 및 표준 규격
* **Header / Body / Footer 3단 구조**: 헤더와 푸터는 높이 고정, 본문(Body)만 `overflow-y: auto` 스크롤
* **표준 너비**: 240px(튜토리얼), 320px(텍스트 알림), 400px(폼 모달), 480px(프로젝트 생성/공유 복합 모달)

### 5.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 요소 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **배경 딤 (Scrim)** | `var(--figma-color-bg-scrim, rgba(0,0,0,0.5))` | 화면 배경 차단 오버레이 |
| **모달 컨테이너 배경** | `var(--figma-color-bg)` | 다이얼로그 본체 배경 |
| **모달 외곽 테두리** | `var(--figma-color-border)` | 1px 외곽 테두리선 |
| **모달 드롭 섀도우** | `box-shadow: 0 8px 32px rgba(0,0,0,0.24)` | 최상위 Elevation 그림자 |
| **푸터 상단 분리선** | `1px solid var(--figma-color-border)` | 본문과 푸터 구분선 |

### 5.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **포커스 트랩 (Focus Trap)**: `Tab` 키가 모달 내부에서만 순환하도록 제어합니다.
* **배경 스크롤 락 (Scroll Lock)**: 모달 오픈 시 배경 캔버스에 `overflow: hidden`을 부여합니다.
* **이벤트 버블링 차단**: 모달 내부 클릭 시 닫힘 방지를 위해 `e.stopPropagation()`을 선언합니다.

---

## 6. Notifications (HUD 토스트 알림)
> **Figma Node ID**: `2028-109149`

### 6.1 개요 및 화면 배치
* 작업 상태 변화를 알리고 즉각 액션을 제공하는 헤즈업(HUD) 알림 바입니다.
* 화면 하단 툴바 우측 또는 화면 하단 중앙에 플로팅 배치됩니다.

### 6.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **토스트 바 배경** | `var(--figma-color-bg-inverse, #2c2c2c)` | 고대비 플로팅 다크 컨테이너 |
| **토스트 바 테두리** | `1px solid rgba(255, 255, 255, 0.1)` | 미세 외곽선 |
| **메시지 텍스트** | `var(--figma-color-text-oninverse, #ffffff)` | 안내 텍스트 12px |
| **세로 구분선** | `rgba(255, 255, 255, 0.15)` | 본문과 액션 사이 분리선 |
| **Action 버튼** | `var(--figma-color-text-oninverse)` (굵기 600) | 즉각 실행 버튼 |
| **Dismiss 닫기** | `rgba(255, 255, 255, 0.7)` (호버 시 1.0) | 닫기 텍스트 버튼 |
| **드롭 섀도우** | `box-shadow: 0 4px 16px rgba(0,0,0,0.24)` | 플로팅 레이어 elevation |

### 6.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **멀티라인 클램프**: 2줄 초과 시 `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;` 처리.
* **지속성 라이프사이클**: 단순 알림(3초 후 소멸)과 결정 요구형(사용자 Action/Dismiss 클릭 시까지 고정) 분기.

---

## 7. Radio Button (라디오 버튼)
> **Figma Node ID**: `2015-20200`

### 7.1 규격 및 디자인 토큰
* 외부 원형: `16px × 16px` (`border-radius: 50%`)
* 내부 점(Dot): `6px × 6px` (`border-radius: 50%`, 중앙 정렬)
* 라벨 간격: `gap: 8px`, 클릭 영역 높이: `24px`~`28px`

### 7.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **On 테두리 및 내부 Dot** | `var(--figma-color-icon)` | 선택된 원형 및 내부 6px 점 |
| **Off 테두리** | `var(--figma-color-border-strong)` | 미선택 외곽 테두리선 |
| **Focused 포커스 링** | `var(--figma-color-border-brand-strong, #0d99ff)` | 키보드 탐색 포커스 테두리 |
| **라벨 텍스트** | `var(--figma-color-text)` | 옵션 설명 텍스트 |
| **Disabled 불투명도** | `opacity: 0.35; cursor: not-allowed;` | 비활성화 상태 |

### 7.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **네이티브 접근성 마스킹**: 숨겨진 `<input type="radio">`를 두고 `:checked`, `:focus-visible` 가상 클래스를 통해 커스텀 UI를 제어합니다.
* **방향키 탐색**: 그룹 내부에서는 상/하/좌/우 화살표 키로 옵션을 이동 및 즉시 선택하도록 구성합니다.

---

## 8. Segmented Control (세그먼트 컨트롤)
> **Figma Node ID**: `2015-20818`

### 8.1 개요 및 규격
* 캡슐형 탭 그룹 내에서 상호 배타적인 뷰/속성 옵션을 전환하는 컨트롤입니다. (구 Option Strip)
* **표준 너비**: 패널 그리드에 맞춘 **88px** (2~3개 분할) 또는 **168px** (4~5개 분할)
* **높이 및 반경**: 높이 `24px` 또는 `28px`, 외곽 `border-radius: 6px`, 내부 세그먼트 `4px`~`5px`

### 8.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **컨테이너 배경** | `var(--figma-color-bg-secondary, rgba(0,0,0,0.06))` | 은은한 캡슐 바탕 배경 |
| **Default 비선택 탭** | 배경 `transparent`, 아이콘 `var(--figma-color-icon-secondary)` | 미선택 기본 탭 |
| **Hover 마우스 오버** | 배경 `var(--figma-color-bg-hover)` | 살짝 밝아진/어두워진 하이라이트 |
| **Selected 선택 탭 (Light)**| `background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);` | 흰색 입체 카드 배경 |
| **Selected 선택 탭 (Dark)** | `background: var(--figma-color-bg-selected, #383838);` | 고대비 다크 활성 배경 |
| **Selected 텍스트/아이콘** | `var(--figma-color-icon, var(--figma-color-text))` | 진한 활성 컬러 |
| **Focused 포커스 아웃라인** | `outline: 2px solid var(--figma-color-border-brand-strong)` | 피그마 블루 포커스 링 |
| **Default 수평 바 인디케이터**| `var(--figma-color-icon-tertiary)` | 미수정 기본값 표시선 |

### 8.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **선택 해제 불가 원칙**: 이미 선택된 세그먼트를 다시 클릭해도 선택이 해제되지 않아야 합니다 (항상 최소 1개 선택 유지).
* **슬라이딩 인디케이터 성능**: 탭 전환 애니메이션 적용 시 `left` 대신 CSS `transform: translateX(...)`를 사용하여 브라우저 리플로우를 방지합니다.

---

## 9. Slider (슬라이더 및 슬라이더 가이드라인)
> **Figma Node ID**: `2015-23026`

### 9.1 개요 및 배리언트
* 최소값(Min)과 최대값(Max) 사이의 연속적/불연속적 범위를 조절하는 컴포넌트입니다.
* 배리언트: Range(표준 0~100%), Delta(중앙 0점 기준 양방향 -100~+100%), Stepper(이산적 스냅 단계), Color(색상/불투명도 및 노브 프리뷰).

### 9.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **트랙 배경 (Track Unfilled)** | `var(--figma-color-bg-tertiary, rgba(0,0,0,0.1))` | 슬라이더 미채움 트랙 |
| **트랙 채움 (Track Filled)** | `var(--figma-color-bg-brand, #0d99ff)` | 값만큼 채워진 트랙 게이지 |
| **노브 기본 (Knob Default)** | `background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.2);` | 흰색 원형 핸들 노브 |
| **노브 수정됨 (Modified)** | `var(--figma-color-border-brand)` 테두리 또는 변형 노브 | 기본값 대비 변경 표시 |
| **노브 포커스 (Focused)** | `outline: 2px solid var(--figma-color-border-brand-strong)` | 피그마 블루 포커스 링 |
| **스텝 눈금 (Tick Marks)** | `var(--figma-color-border-strong)` | 불연속 스텝퍼 기준점 |
| **델타 기준 수직 바 (Zero Bar)**| `var(--figma-color-text-secondary)` | 중앙 0점 수직 기준선 |
| **값 라벨 (Numeric Value)** | `var(--figma-color-text)` (`font-size: 11px`) | 실시간 수치 표기 |

### 9.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **Delta 슬라이더 채움 계산**: 중앙(50%)을 기준으로 음수(`left: val%; width: 50 - val%;`)와 양수(`left: 50%; width: val - 50%;`)의 동적 좌표 계산.
* **포인터 캡처**: 노브 드래그 시 트랙 바깥으로 마우스가 나가도 끊기지 않도록 `setPointerCapture` 적용.
* **숫자 인풋 연동**: 슬라이더 드래그와 인풋 타이핑 간 1ms 오차 없는 양방향 동기화(Two-way binding).

---

## 10. Switch (스위치)
> **Figma Node ID**: `2015-24401`

### 10.1 개요 및 핵심 사용 원칙
* 물리적인 토글(Toggle) 스위치를 형상화한 컴포넌트로 설정을 즉각적으로 켜거나("On") 끌("Off") 때 사용합니다.
* **★ Checkbox와의 결정적 차이**: 스위치 조작은 별도 저장 버튼 없이 **즉시 시스템에 반영(Immediate Effect)**되어야 합니다. 저장 버튼이 필요하면 Checkbox를 사용해야 합니다.

### 10.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **On 상태 트랙 배경** | `var(--figma-color-bg-brand, #0d99ff)` | 활성화 트랙 |
| **Off 상태 트랙 배경** | `var(--figma-color-bg-tertiary, rgba(0,0,0,0.15))` | 비활성화 트랙 |
| **노브 (Knob)** | `background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.2);` | 원형 토글 노브 |
| **Focused 포커스 링** | `outline: 2px solid var(--figma-color-border-brand-strong)` | 키보드 포커스 링 |
| **라벨 텍스트** | `var(--figma-color-text)` | 우측 설정 라벨 |
| **설명 텍스트 (Description)**| `var(--figma-color-text-secondary)` | 하단 보조 설명문 |

### 10.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **웹 표준 시맨틱 접근성**: `<input type="checkbox" role="switch" aria-checked="true|false|mixed">` 구조 채택.
* **복합 비활성화 동기화**: 스위치가 Disabled 되면 인접 라벨과 설명문도 함께 `color: var(--figma-color-text-disabled)` 처리.

---

## 11. Tooltip (툴팁 및 링크 툴팁)
> **Figma Node ID**: `2015-32842`

### 11.1 개요 및 권장 텍스트 길이
* 텍스트 라벨이 없는 아이콘 버튼이나 도구의 기능을 명확히 설명하는 플로팅 힌트입니다.
* **3~20자 내외의 짧고 간결한 정보**만 담아야 하며, 긴 설명은 Callout을 사용해야 합니다.

### 11.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **툴팁 배경** | `var(--figma-color-bg-inverse, #2c2c2c)` | 고대비 다크 컨테이너 |
| **툴팁 텍스트** | `var(--figma-color-text-oninverse, #ffffff)` | 흰색 텍스트 11px/12px |
| **단축키 텍스트 (Hotkey)** | `rgba(255, 255, 255, 0.7)` | 우측 보조 단축키 안내 |
| **그림자 및 반경** | `border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);` | 툴팁 스타일 |

### 11.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **호버 인텐트 딜레이**: 마우스 오버 시 300~400ms 지연 표시(`setTimeout`), 마우스 이탈 시 즉시 취소(`clearTimeout`).
* **포인터 이벤트 분기**: 일반 툴팁은 `pointer-events: none`, 클릭 가능한 버튼이 포함된 링크 툴팁은 `pointer-events: auto`로 분기.

---

## 12. Checkboxes (체크박스)
> **Figma Node ID**: `2012-55102`

### 12.1 개요 및 핵심 사용 원칙
* 디자인 에디터 설정, 옵션 다중 선택, 관리자 테이블 행 선택 등 **이진 선택(Binary choices)** 및 복수 선택에 사용하는 표준 폼 컴포넌트입니다.
* **★ Switch와의 사용성 차이**: 체크박스는 옵션을 선택한 뒤 별도의 '저장/적용' 버튼이 존재하거나 폼 제출(Form Submit) 단계가 있는 경우에 주로 사용합니다. (즉각 반영되는 글로벌 환경설정은 `Switch` 권장)
* **하위 항목 혼합 선택 (Mixed / Indeterminate)**: 상위 그룹 체크박스 아래에 여러 하위 체크박스가 있을 때, 일부만 선택된 상태를 나타내기 위해 가로 마이너스(`-`) 대시 아이콘을 표시하는 `Mixed` 상태를 지원합니다.

### 12.2 규격 및 배리언트 구조
* **기본 아이콘 크기**: `16px × 16px`, 테두리 곡률 `border-radius: 4px`
* **변형(Variants)**:
  * `Checkbox Only`: 16px 단독 체크박스 (테이블 셀 및 인라인 압축 뷰용)
  * `Checkbox with Label`: 16px 체크박스 + 우측 텍스트 라벨 (`gap: 8px`)
  * `Checkbox with Description`: 체크박스 + 볼드 타이틀 + 하단 보조 설명문 복합 구조

### 12.3 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **On / Mixed 배경** | `var(--figma-color-bg-brand, #0d99ff)` | 피그마 시그니처 블루 채움 |
| **On 체크마크 / Mixed 대시** | `var(--figma-color-icon-onbrand, #ffffff)` | 흰색 체크/마이너스 SVG 아이콘 |
| **Off 테두리 (Default)** | `1px solid var(--figma-color-border-strong, rgba(0,0,0,0.3))` | 미선택 기본 테두리선 |
| **Off 배경** | `transparent` | 투명 바탕 |
| **Hover 상태 (Off)** | `var(--figma-color-bg-hover)` 및 짙어진 테두리 | 마우스 오버 반응 |
| **Focused 포커스 링** | `outline: 2px solid var(--figma-color-border-brand-strong)` | 키보드 탐색 포커스 링 (2px 외곽 여백) |
| **Disabled 비활성** | `opacity: 0.35; cursor: not-allowed;` | 클릭 불가 상태 (On/Off/Mixed 공통) |
| **라벨 텍스트** | `var(--figma-color-text)` | 옵션 설명 텍스트 (12px) |
| **보조 설명 텍스트** | `var(--figma-color-text-secondary)` | 11px 서브 디스크립션 |

### 12.4 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **HTML 네이티브 `indeterminate` 프로퍼티 바인딩**: HTML의 체크박스에서 mixed 상태는 HTML 속성(Attribute)이 아닌 자바스크립트의 DOM 프로퍼티(`checkboxEl.indeterminate = true`)로만 활성화할 수 있으므로, 상태 변경 시 JS 제어가 필수적입니다.
* **클릭 영역 확대(Click Target)**: 16px 크기는 모바일 또는 마우스 클릭 시 작을 수 있으므로 라벨 전체를 `<label>` 태그로 감싸고 상하 `padding: 4px 0`을 주어 최소 24px의 터치/클릭 영역을 보장합니다.

---

## 13. Comments (협업 댓글 및 스레드)
> **Figma Node ID**: `2012-56281`

### 13.1 개요 및 목적
* 디자인 캔버스 위에 직접 피드백 핀(Pin)을 꽂거나, 우측 댓글 사이드바 목록 및 팝업 스레드 창을 통해 디자이너와 협업자 간 커뮤니케이션을 수행하는 전용 UI 시스템입니다.

### 13.2 컴포넌트 구성 요소 및 계층 구조
1. **`Comments / Pin` (캔버스 핀)**:
   * 캔버스 좌표에 부착되는 원형 핀. 작성자 아바타(24px) 또는 파란 점(Dot), 댓글 개수 뱃지(`+2`)가 표시됩니다.
   * 상태: Unread(파란 점), Read(아바타), Hover(살짝 확대), Selected(피그마 블루 외곽 링).
2. **`Sidebar Row Comment` (사이드바 댓글 항목)**:
   * 헤더: 작성자 아바타 + 이름 + 작성 상대시간(예: `2h ago`)
   * 위치 표시: 클릭 시 해당 노드 위치로 캔버스 자동 이동(Pan & Zoom)
   * 본문: 멀티라인 텍스트 및 @멘션 하이라이트
   * 액션 레일: 호버 시 노출되는 옵션 메뉴(`...`) 및 해결 완료 체크마크(`✓ Resolved`)
3. **`Comment Thread Window` (스레드 팝업창)**:
   * **표준 너비**: **360px** (Figma 120px 그리드의 3배수 표준)
   * 상단 헤더(위치/해결 버튼), 본문 스크롤 영역, 하단 답글 작성기(Composer) 3단 구성
4. **`Comment Compose` (댓글/답글 작성창)**:
   * 리치 인풋: 텍스트 입력창 + 이모지 피커(`:`) + 팀원 멘션(`@`) + 첨부파일 클립
   * 게시 버튼: 텍스트 입력 시 활성화되는 상향 화살표(`↑`) 브랜드 블루 버튼

### 13.3 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 구성 요소 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **스레드 팝업 배경** | `var(--figma-color-bg)` | 360px 모달형 컨테이너 배경 |
| **스레드 외곽 테두리** | `var(--figma-color-border-menu, var(--figma-color-border))` | 1px 경계선 |
| **스레드 드롭 섀도우** | `box-shadow: 0 4px 20px rgba(0,0,0,0.18)` | 캔버스 위 플로팅 깊이감 |
| **Unread 읽지 않음 점** | `var(--figma-color-bg-brand, #0d99ff)` | 읽지 않은 새 댓글 파란색 인디케이터 |
| **Selected 핀 테두리** | `2px solid var(--figma-color-border-brand-strong)` | 활성화된 핀 강조 링 |
| **작성기(Compose) 배경**| `var(--figma-color-bg-secondary)` | 답글 입력 필드 배경 |
| **게시 버튼 (Active)** | `var(--figma-color-bg-brand)` / `var(--figma-color-icon-onbrand)` | 활성화된 전송 화살표 |

### 13.4 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **캔버스 줌 레벨 역보정(Inverse Scale)**: 캔버스를 20%로 축소하거나 1000%로 확대해도 핀(Pin)은 항상 사용자 모니터 기준 동일한 픽셀 크기(24px)로 보여야 하므로, 캔버스 Zoom 배수의 역수(`transform: scale(1 / zoom)`)를 매 프레임 적용합니다.
* **좌표 역투영(Canvas Projection)**: 스레드 팝업이 캔버스 경계 밖으로 벗어날 경우 핀의 좌/우/상/하로 자동 말풍선 꼬리 방향을 전환하는 지능형 오프셋 배치가 필요합니다.

---

## 14. Dropdowns (드롭다운 및 옵션 피커)
> **Figma Node ID**: 트리거 버튼 `18:2877` / 옵션 팝오버 `18:3076` (기존 공용: `2028-36479`)

### 14.1 개요 및 핵심 디자인 원칙
* 목록에서 단일 옵션을 선택하거나 프리셋을 변경하는 피그마 인스펙터 패널의 핵심 컴포넌트입니다.
* **트리거 버튼 규격 (`18:2877`)**:
  * 높이 `28px`, 모서리 곡률 `border-radius: var(--radius-sm, 6px)`.
  * 기본 상태: `background: var(--color-bg-secondary); border: 1px solid transparent;`
  * 호버 상태: `border-color: var(--color-border);`
  * 포커스/활성(`active`) 상태: `background: #ffffff; border-color: var(--color-brand); box-shadow: 0 0 0 1px var(--color-brand);`
  * 요소 배치: 좌측 옵션 아이콘(`24px` - 피그마 `icon.24` 원본 규격) + 중앙 옵션 라벨(`11px`) + 우측 Chevron Down(`16px`).
* **옵션 팝오버 메뉴 규격 (`18:3076` - Select Size Option 템플릿 컴포넌트)**:
  * 컨테이너: `width: 180px; background: #1e1e1e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 13px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); padding: 8px;`
  * 메뉴 행 규격: `width: 164px; height: 24px; border-radius: 5px; display: flex; align-items: center; gap: 4px; padding: 0 8px 0 0;`
  * **★ 3단 옵션 구성**:
    1. `Mixed`: `[20px 체크 슬롯] [24px 대시(Dash) 아이콘 슬롯] [Mixed 라벨(11px)]`
    2. `구분선 (Divider)`: `width: 164px; height: 1px; background: rgba(255, 255, 255, 0.15); margin: 4px 0;`
    3. `Fixed height`: `[20px 체크 슬롯] [24px 세로 구속 아이콘(constrain-vert)] [Fixed height 라벨] [우측 수치 칩(예: 250)]`
    4. `Hug contents`: `[20px 체크 슬롯] [24px Hug 화살표 아이콘(height-hug)] [Hug contents 라벨] [우측 수치 칩(예: 328)]`
  * **★ 선두 체크 슬롯 (Lead Checkmark Slot)**: 각 행의 맨 앞(`20px` 너비)에 체크 슬롯 배치. 선택된 항목(`selected`)인 경우 순백색 체크 아이콘(`✓`)이 노출되고, 미선택 항목은 투명 처리되어 전체 항목의 세로 정렬선이 엄격히 유지됩니다.
  * **★ 선택 상태 (`selected`)**: 피그마 시그니처 퍼플 컬러(`background: #8C4CF6 !important;`) 배경, `border-radius: 5px`, 텍스트 및 모든 아이콘/우측 수치 순백색(`#ffffff`).
  * **★ 호버 상태 (`:hover`)**: 미선택 항목에 마우스 오버 시 은은한 반투명 다크 호버 배경(`background: rgba(255, 255, 255, 0.08)`).
  * **★ 우측 수치 라벨**: `Fixed height`와 `Hug contents`의 우측 끝에 현재 계산된 높이 수치(예: `250`, `328`)를 `11px`, `rgba(255, 255, 255, 0.65)`(선택 시 `#ffffff`)로 우측 정렬 표기.

### 14.2 상태(States) 및 배리언트
* **Default**: 은은한 회색 인풋 배경 또는 테두리 없음, 선택값 텍스트, 우측 Chevron Down
* **Hover**: 은은한 외곽 테두리 표시 (`border: 1px solid var(--color-border)`)
* **Focus / Active**: 피그마 퍼플/블루 포커스 링 (`border-color: var(--color-brand); box-shadow: 0 0 0 1px var(--color-brand)`)
* **Disabled**: 텍스트 및 아이콘 40% 투과율, 커서 금지
* **배리언트 유형**:
  * `Text-only Dropdown`: 텍스트 값 + Chevron
  * `Icon + Text Dropdown`: 선두 아이콘(높이 모드, 정렬 등) + 텍스트 + Chevron
  * `Color / Paint Dropdown`: 컬러 스와치 + Hex 값 + Opacity + Chevron

### 14.3 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 속성 및 상태 | 공식 피그마 변수/토큰 | 설명 |
| :--- | :--- | :--- |
| **트리거 배경 (Default)** | `var(--color-bg-secondary)` | 인스펙터 입력필드 일체형 회색 |
| **트리거 호버** | `border-color: var(--color-border)` | 마우스 오버 시 1px 테두리 |
| **포커스 / 활성 링** | `border-color: var(--color-brand); box-shadow: 0 0 0 1px var(--color-brand)` | 드롭다운 열림/포커스 상태 |
| **팝오버 컨테이너 (`18:3076`)** | `#1e1e1e` (`border-radius: 13px; border: 1px solid rgba(255,255,255,0.1)`) | 피그마 팝오버 템플릿 다크 서피스 (180px) |
| **선두 체크 아이콘 (20px 슬롯)** | `#ffffff` (선택 시 활성화) | 선택된 항목 맨 앞 체크마크 |
| **행 선택 배경 (`selected`)** | `#8C4CF6` (`border-radius: 5px`) | **피그마 시그니처 퍼플 하이라이트** |
| **행 호버 배경** | `rgba(255, 255, 255, 0.08)` | 미선택 행 마우스 오버 배경 |
| **항목 텍스트 / 아이콘** | `#ffffff` (선택 시 및 기본) | 가독성을 위한 다크 서피스 순백색 텍스트 |
| **우측 수치 라벨 (Numeric Chip)** | `rgba(255, 255, 255, 0.65)` (선택 시 `#ffffff`) | 우측 정렬된 높이/크기 수치 라벨 (11px) |
| **디바이더 (Divider)** | `rgba(255, 255, 255, 0.15)` | 164px x 1px 옵션 간 구분선 |

### 14.4 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **텍스트 트래킹 금지 준수**: 사용자 시스템 전역 규칙에 따라 텍스트에 letter-spacing을 부여하지 않습니다 (`letter-spacing: 0 !important;`).
* **패널 내 텍스트 말줄임(Ellipsis)**: 좁은 컬럼 내에서 긴 옵션명이 표시될 때 드롭다운 화살표를 침범하지 않도록 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`을 부여합니다.
* **선두 체크 슬롯 고정 너비 유지**: 미선택 항목에서도 `width: 18px` 슬롯을 유지하여 아이콘 및 라벨의 정렬 흐트러짐을 방지합니다.

---

## 15. Inputs (인풋 시스템 - Numeric, Combo, Paint, Emphasized, Pill)
> **Figma Node ID**: `2028-75376`, `2028-23030`

### 15.1 개요 및 5대 핵심 인풋 배리언트
피그마 UI3의 입력 시스템은 툴의 성격에 맞춰 단순 텍스트 입력창부터 드래그 수치 조절, 컬러 팔레트, 디자인 변수(Variable) 바인딩 칩까지 고도로 세분화되어 있습니다.

1. **`Numeric Input` (수치 조절 인풋)**:
   * X, Y, W, H, 회전각도, 패딩, 라운딩 등 수치 입력 전용.
   * **스크러빙(Scrubbing)**: 인풋 라벨(X, Y, W 등) 또는 필드 위를 마우스로 좌우 드래그하면 값이 연속적으로 증감. (`Shift` 드래그 시 10배 증감)
   * 산술 연산자(`+`, `-`, `*`, `/`) 타이핑 계산 지원 (예: `100 + 24` 입력 후 Enter 치면 `124`로 자동 계산).
2. **`Combo Input` (콤보 인풋)**:
   * 프리셋 선택 드롭다운과 사용자 직접 타이핑이 결합된 하이브리드 인풋 (예: 폰트 크기 `12`, `14`, `16` 프리셋 목록 + 직접 `13.5` 입력).
3. **`Value / Paint Input` (컬러 및 채움 인풋)**:
   * 좌측 Paint Swatch(색상 사각형/원형 프리뷰) + 중앙 Hex/Color 값 + 우측 Opacity(%) 3단 구조.
   * 피그마 변수(Variable)가 바인딩되면 즉시 알약 모양의 **Pill** 상태로 전환.
4. **`Emphasized Text Input` (강조형 채움 인풋)**:
   * 일반 프로퍼티 인풋과 달리 **채워진 배경(`bg-secondary` 또는 `bg-tertiary`)**을 가진 인풋.
   * 사용처: 컴포넌트 이름 변경, 검색창(Search Input), 모달 다이얼로그 폼, 플러그인 URL 입력 등 시각적 포커스가 강해야 하는 영역.
   * 규격: Small(24px), Medium(32px), Large(40px).
5. **`Pills / Variable Chips` (변수 적용 알약 칩)**:
   * Hex 수치 대신 디자인 시스템 변수명(예: `Primary / 500`)이 바인딩되었음을 알리는 캡슐형 칩.
   * 다중 선택 시 일부만 일치하는 경우 `Partial Match` 하프 칩 스타일 지원. 분리(Detach) 아이콘 포함.

6. **`Position Matrix / Corner Position Controls` (위치 및 코너 매트릭스)**:
   * 스텝 배지 위치 및 앵커 코너 지정을 위한 4단 세그먼트 컨트롤.
   * 각 코너 버튼은 피그마 정식 **`icon.24.position.*`** 시리즈(24×24px)를 사용:
     * `Top-Left`: `icon.24.position.top.left.svg`
     * `Top-Right`: `icon.24.position.top.right.svg`
     * `Bottom-Left`: `icon.24.position.bottom.left.svg`
     * `Bottom-Right`: `icon.24.position.bottom.right.svg`
   * 코너 곡률(Radius) 인풋은 단일 코너 라운드 규격인 **`icon.24.radius.top.left.svg`** (`r` 형태, 24×24px)를 사용.

### 15.2 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 인풋 구성 요소 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **일반 인풋 배경 (Default)** | `transparent` (Borderless) | 인스펙터 패널 내 기본 인풋 |
| **강조형 인풋 배경 (Emphasized)**| `var(--figma-color-bg-secondary, rgba(0,0,0,0.06))` | 모달/검색용 회색 채움 배경 |
| **인풋 호버 테두리** | `var(--figma-color-border)` | 마우스 오버 시 1px 경계선 |
| **인풋 포커스 링** | `outline: 2px solid var(--figma-color-border-brand-strong)` | 활성화된 블루 포커스 링 |
| **인풋 텍스트 값** | `var(--figma-color-text)` | 입력 텍스트 (11px/12px) |
| **플레이스홀더 텍스트** | `var(--figma-color-text-secondary)` (불투명도 50%) | 안내 문구 |
| **스크러버 라벨 (X, Y 등)** | `var(--figma-color-text-secondary)` (호버 시 커서 `ew-resize`) | 좌우 드래그 핸들 |
| **Pill 변수 칩 배경** | `var(--figma-color-bg-tertiary, rgba(0,0,0,0.08))` | 변수 바인딩 알약 배경 |
| **Pill 변수 칩 텍스트** | `var(--figma-color-text)` (굵기 500) | 토큰 명칭 텍스트 |

### 15.3 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **수식 파서(Math Expression Evaluation)**: 값 입력 시 `eval()` 대신 안전한 사칙연산 정규식 파서를 적용하여 `width: 200 / 2 + 10` 같은 디자이너의 연산 입력을 안전하게 처리합니다.
* **스크러빙 중 포인터 락(Pointer Lock)**: 마우스 스크러빙 드래그 시 모니터 화면 끝에 닿아도 무한히 수치를 조절할 수 있도록 `requestPointerLock()` API 또는 `movementX` 델타 누적 로직을 적용합니다.

---

## 16. Tabs (탭 네비게이션)
> **Figma Node ID**: `2015-25519`

### 16.1 개요 및 핵심 디자인 규격
* 피그마 UI3 상단 바 및 인스펙터 헤더에서 두 개 이상의 연관된 뷰/패널을 상호 배타적으로 전환하는 탭 스트립 컨트롤입니다. (예: `Design` | `Prototype`, `Layers` | `Assets`)
* **표준 높이**: **24px** (Figma UI3 상단 헤더 슬림 그리드 표준)
* **간격**: 탭과 탭 사이 `gap: 4px`
* **선택 탭(Active Tab)**: 부드러운 캡슐 배경(`bg-secondary-fill`), 반경 `radius-medium` (4px~5px), 굵은 폰트(`body-medium-strong`), 텍스트 `text-default`
* **미선택 탭(Inactive Tab)**: 배경 없음(`transparent`), 레귤러 폰트(`body-medium`), 텍스트 `text-secondary`

### 16.2 특수 변형(Variants) 및 반응형 처리
1. **Single Tab (단일 탭 모드)**:
   * 전환할 다른 탭이 없고 1개만 존재하는 경우(예: 단독 `Inspect` 패널), 탭 캡슐 스타일이 사라지고 일반 패널 타이틀(`bg-default`, 볼드 헤더) 형태로 자동 변환됩니다.
2. **Counter Badge (카운터 결합형 탭)**:
   * 읽지 않은 알림, 검토 대기 항목 개수 등을 표기하는 뱃지(`❖ Badge`)가 탭 라벨 우측에 결합됩니다.
3. **Overflow Scroll & Gradient Mask (수평 스크롤 및 그라데이션 페이드)**:
   * 탭이 패널 가로 너비를 초과할 경우 가로 마우스 휠 스크롤이 활성화되며, 좌우 가장자리에 부드러운 페이드아웃 그라데이션 마스크(`linear-gradient(to right, transparent, var(--figma-color-bg))`)를 적용하여 텍스트가 잘리는 느낌을 방지합니다.

### 16.3 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 구성 요소 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **Active 탭 배경** | `var(--figma-color-bg-secondary, rgba(0,0,0,0.06))` | 활성 탭 캡슐 배경 |
| **Active 탭 텍스트** | `var(--figma-color-text)` (font-weight: 600) | 강조된 활성 라벨 |
| **Inactive 탭 배경** | `transparent` | 미선택 탭 배경 |
| **Inactive 탭 텍스트** | `var(--figma-color-text-secondary)` (font-weight: 400) | 은은한 보조 텍스트 |
| **Hover 마우스 오버** | `var(--figma-color-bg-hover)` | 미선택 탭에 마우스 올렸을 때 |
| **Focused 포커스 링** | `outline: 2px solid var(--figma-color-border-brand-strong)` | 키보드 이동 포커스 |
| **카운터 뱃지 (Unread)**| `var(--figma-color-bg-brand)` / `var(--figma-color-text-onbrand)` | 파란색 미확인 카운터 |

### 16.4 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **WAI-ARIA 탭 패턴**: `<div role="tablist">`, `<button role="tab" aria-selected="true|false">`, `<div role="tabpanel">`을 구성하고 좌/우 방향키(`ArrowLeft`, `ArrowRight`)로 탭을 순환할 수 있도록 키보드 내비게이션을 지원합니다.
* **패널 돔 보존(Keep-Alive)**: 탭 전환 시 매번 DOM을 언마운트하고 다시 그리면 폼 입력값이나 스크롤 위치가 유실되므로, CSS `display: none`을 토글하여 이전 탭 상태를 유지합니다.

---

## 17. Visual Bells (비주얼 벨 및 상태 바)
> **Figma Node ID**: `2015-40421`

### 17.1 개요 및 화면 배치
* 화면 중앙 하단에 플로팅 팝업되어 사용자 작업을 방해하지 않고 진행 상황, 작업 완료, 멀티플레이어 세션 상태를 전달하는 헤즈업(HUD) 알림 바 컴포넌트입니다.
* **배치 위치**: 뷰포트 하단 중앙 (`bottom: 16px; left: 50%; transform: translateX(-50%);`)
* **해부도(Anatomy) 2단 구조**:
  * **Label 구역**: 상태 메시지, 진행률, 아바타 등 정보 전달
  * **Button Rail 구역**: 액션 버튼(Undo, View 등) 및 닫기(`X`) 버튼
  * **간격 규격**: Label과 Button Rail 간격 **8px**, Button Rail 내 버튼 간 간격 **4px**

### 17.2 4대 배리언트(Variants)
1. **Heads-up Toast (일반 안내 알림)**:
   * 작업 완료 알림 (예: "Link copied to clipboard", "Component published")
   * 3~4초 후 자동으로 아래로 슬라이드되며 소멸.
2. **Tabular Numbers (진행률 및 카운터 토스트)**:
   * 파일 내보내기/동기화 등 수치 기반 진행 알림 (예: "Exporting 4 of 12 assets...")
   * 숫자 글꼴의 흔들림을 방지하기 위해 `font-variant-numeric: tabular-nums` 고정폭 폰트 적용.
3. **Multiplayer Bell (멀티플레이어 상태 바)**:
   * 공동 작업자의 화면 팔로우 및 스팟라이트 상태 알림 (예: "16 followers", "Spotlight on Alex")
   * 작업자의 고유 커서 컬러 및 20px 원형 아바타 결합.
4. **Error / Danger Bell (치명적 에러 및 손실 방지 알림)**:
   * 네트워크 단절, 저장 실패, 브랜치 충돌 등 복구가 필요한 위험 상태 알림.
   * **영구 지속 원칙**: 일반 토스트와 달리 자동 소멸되지 않으며, 사용자가 명시적으로 '재시도' 또는 '닫기(X)'를 클릭할 때까지 화면에 고정 유지됩니다.

### 17.3 피그마 공식 UI3 변수(Variables) 매핑 테이블
| 구성 요소 | 공식 피그마 변수 토큰 | 설명 |
| :--- | :--- | :--- |
| **토스트 바 배경 (Normal)** | `var(--figma-color-bg-inverse, #2c2c2c)` | 고대비 다크 플로팅 컨테이너 |
| **토스트 바 배경 (Danger)** | `var(--figma-color-bg-danger, #e03e3e)` | 위험/에러 경고용 레드 컨테이너 |
| **라벨 텍스트** | `var(--figma-color-text-oninverse, #ffffff)` | 흰색 안내 텍스트 (12px) |
| **액션 버튼 배경/텍스트** | 투명 배경 / `var(--figma-color-text-oninverse)` (굵기 600) | 실행 액션 텍스트 |
| **닫기(X) 아이콘** | `rgba(255, 255, 255, 0.7)` (호버 시 1.0) | 16px 닫기 버튼 |
| **드롭 섀도우** | `box-shadow: 0 4px 16px rgba(0,0,0,0.24)` | 플로팅 레이어 elevation |
| **테두리 반경** | `border-radius: 8px` | 부드러운 라운딩 |

### 17.4 💡 실제 구현 시 핵심 엔지니어링 고려사항
* **메시지 큐(Notification Queue) 싱글턴**: 동시에 여러 작업이 발생하더라도 토스트가 서로 겹치거나 화면을 가리지 않도록 FIFO(First-In-First-Out) 큐 매니저를 통해 하나씩 순차 재생되도록 설계합니다.
* **하단 툴바 회피 오프셋(Toolbar Collision Avoidance)**: UI3의 하단 플로팅 툴바가 활성화되어 있는 경우, 벨(Bell)의 바텀 오프셋을 툴바 높이 + 16px(약 `bottom: 72px`)로 자동 이동시켜 툴바를 가리지 않도록 계산합니다.

---

## 18. Section Layout System (표준 섹션 레이아웃 컴포넌트)
> **Figma Node ID**: `18:4721`, `18:4813`, `18:4657`

### 18.1 표준 3단 컴포넌트 계층 구조 (Anatomy)
피그마 UI3 패널 내부의 모든 섹션은 재사용성과 시각적 통일성을 위해 엄격히 규격화된 동일한 3단 컴포넌트 아키텍처를 준수합니다:

```
.section-block                                 /* [1. 루트 컨테이너] 기본 하단 패딩 12px */
  ├─ .section-header (.toggle-row)            /* [2. 공통 헤더] height: 40px 고정 */
  │    ├─ .section-title                      /* 좌측 타이틀 (11px / weight 500) */
  │    └─ .section-actions / .switch          /* 우측 24px 아이콘 버튼 그룹 또는 32×24px 스위치 */
  └─ .section-body                            /* [3. 본문 컨테이너] 내부 gap 8px */
       └─ (고유 폼 컨트롤 / 카드 / 칩 / 인풋)
```

### 18.2 2대 핵심 배리언트 (Variants)
1. **Action Section (일반 액션형 섹션)**:
   * Phase, Type, Description, Size, Style, Connect 등 항상 콘텐츠가 열려 있는 섹션.
   * `.section-header` 우측에 24×24px 아이콘 버튼(`.btn-action-icon`)들이 위치.
   * 섹션 본문 아래 항상 **`padding-bottom: 12px`** 유지.

2. **Toggle Section (접힘 가능한 스위치형 섹션)**:
   * Elevation, Status, Step Badges, Figma Screen Link, Label, Link 등.
   * `.section-header.toggle-row` 우측에 32×24px 스위치(`.switch`)가 위치.
   * **접힘(Collapsed) 시**: 스위치 OFF 상태에서는 하단 패딩이 **`0px`로 완전 소멸**하여 40px 헤더 바로 밑에 다음 구분선이 밀착.
   * **펼침(Expanded) 시**: 스위치 ON 상태에서는 본문 콘텐츠가 노출되며 하단에 **`12px` 패딩이 자동 복원**.

### 18.3 피그마 공식 변수 토큰 매핑 테이블
| 구성 요소 | 공식 규격 및 피그마 토큰 | CSS 스펙 |
| :--- | :--- | :--- |
| **섹션 헤더 높이** | `40px` 고정 | `height: 40px; display: flex; align-items: center; justify-content: space-between;` |
| **섹션 타이틀** | `11px` / `Inter Medium (450~500)` | `font-size: 11px; font-weight: 500; color: var(--figma-color-text); line-height: 16px;` |
| **헤더 아이콘 버튼** | `24×24px` 터치 타겟 (공통), 버튼 간격 `4px` | `width: 24px; height: 24px; padding: 0; gap: 4px;` |
| **헤더 아이콘 SVG** | 일반 액션 `24×24px` / More 버튼 `16×16px` (`icon.16.more`) | More: 버튼 24×24px 중앙에 `<svg width="16" height="16">` |
| **스위치 규격** | `32×18px` (UI3 Switch Component) | `width: 32px; height: 18px; border-radius: 9999px;` |
| **본문 그룹 패딩** | `padding: 4px 0;` (상하 4px 패딩) | `.section-body`, `.main-tabs-wrapper` 등에 상하 4px 패딩 적용 |
| **섹션 하단 여백** | `12px` (펼침 시) / `0px` (접힘 시) | `.section-block:has(.toggle-row input:not(:checked)) { padding-bottom: 0; }` |

---

## 19. Phase Dropdown & Popover Menu (Phase 드롭다운 및 선택 팝오버)
> **Figma Node ID**: 드롭다운 버튼 `18:848` ~ `18:855` / 선택 팝오버 `18:2325`

### 19.1 Phase 드롭다운 버튼 (Trigger Button: `18:848`)
* **크기 및 형태**: 가로 100% (`328px`), 높이 `32px`, 모서리 곡률 `border-radius: 5px`.
* **배경 및 테두리**: 배경 `#FFFFFF` (`var(--figma-color-bg)`), 테두리 `1px solid rgba(0, 0, 0, 0.1)` (호버 시 `rgba(0, 0, 0, 0.2)`).
* **좌측 아이콘 영역 (`18:850`)**: `24×24px` 컨테이너.
  - None 상태: `24×24px` 체커보드 사각형 (`border-radius: 5px`, `border: 1px solid rgba(0, 0, 0, 0.1)`).
  - Mixed 상태 (`icon-phase-mixed: 18:814 / 18:918`): `24×24px` 연회색 사각형(`background: #F5F5F5`, `border-radius: 5px`) 중앙에 `10×1.5px` 수평 대시(`color: #2C2C2C`).
  - Phase 선택 상태: `24×24px` 해당 Phase 컬러 칩 (`border-radius: 5px`).
* **중앙 텍스트 (`18:853`)**: `11px`, `fontWeight: 500 (Medium)`, `color: rgba(0, 0, 0, 0.9)`, `lineHeight: 16px`, `letter-spacing: 0`.
* **우측 드롭다운 화살표 (`18:855`)**: `24×24px` 컨테이너 내 Chevron Down 아이콘 (`color: rgba(0, 0, 0, 0.9)`).

### 19.2 Phase Select 팝오버 메뉴 (`18:2325`)
* **크기 및 형태**: 너비 `180px`, 모서리 곡률 `border-radius: 13px`, 패딩 상하좌우 `8px`.
* **서피스 및 그림자**: 배경 `#1E1E1E` (UI3 Dark Surface), 테두리 `1px solid rgba(255, 255, 255, 0.1)`, 그림자 `0 4px 16px rgba(0, 0, 0, 0.25)`.
* **행(Menu row) 규격**: 너비 `164px`, 높이 `24px`, 모서리 곡률 `border-radius: 5px`, `gap: 4px`.
  1. **체크 슬롯 (`20px`)**: 선택된 행에 흰색 체크마크(`✓`, `8×7px`) 표시.
  2. **아이콘 슬롯 (`24px`)**:
     - `Mixed`: `icon.16.mixed` / `14×14px` 반투명 라운드 칩 내 대시 또는 `8×1px` 대시(`—`, `opacity: 0.9`).
     - `None`: `14×14px` 체커보드 사각형 (`border-radius: 2px`).
     - `Phase`: `14×14px` 솔리드 컬러 칩 (`border-radius: 2px`, 예: `#EA2039`).
  3. **라벨 텍스트**: `11px`, `fontWeight: 500`, `color: #FFFFFF`, `lineHeight: 16px`, `letter-spacing: 0`.
* **선택 상태 하이라이트**: `background: #8C4CF6` (보라색 강조), 글자색 `#FFFFFF`, 모서리 곡률 `5px`.
* **미선택 호버 상태**: `background: rgba(255, 255, 255, 0.08)`.
* **구분선 (`Divider: 18:2337`)**: 너비 `164px`, 높이 `1px`, 상하 여백 `8px`, 색상 `rgba(255, 255, 255, 0.15)`.

---

## 20. Type Tabs (Node Type 탭 칩 컴포넌트)
> **Figma Node ID**: `18:865` ~ `18:874`

### 20.1 개요 및 인터랙션 원칙
* Node 탭 내에서 9종 노드 분류(Screen, Action, Decision, System, Database, Terminator, True, False, Error)를 선택하는 탭 컴포넌트입니다.
* **볼드 금지 원칙**: 선택 여부와 무관하게 `font-weight: 450 (Regular/Medium)`을 유지하며, 볼드(Bold) 처리를 절대 적용하지 않습니다.
* **상태별 시각적 피드백**:
  1. **기본 상태 (Default)**: 배경 없음 (`background: transparent;`), 텍스트 `rgba(0, 0, 0, 0.6)`.
  2. **호버 상태 (Hover)**: 부드러운 라이트 그레이 배경 (`background: #F5F5F5;`), 텍스트 `rgba(0, 0, 0, 0.9)`.
  3. **선택 상태 (Active / Selected)**: 피그잼 시그니처 퍼플 (`background: #8C4CF6;`), 텍스트 `#FFFFFF`.

### 20.2 레이아웃 및 규격 토큰 매핑
| 속성 및 상태 | 공식 피그마 규격 | CSS 스펙 |
| :--- | :--- | :--- |
| **탭 높이** | `24px` | `height: 24px;` |
| **탭 패딩 & 모서리** | 좌우 `8px`, `radius: 5px` | `padding: 0 8px; border-radius: 5px;` |
| **탭 간격 (Gap)** | `8px` flex-wrap | `gap: 8px;` |
| **타이포그래피** | `11px` / `Inter 450` | `font-size: 11px; font-weight: 450; line-height: 16px; letter-spacing: 0;` |
| **Default 배경** | 배경 없음 | `background: transparent;` |
| **Hover 배경** | 라이트 그레이 | `background: #F5F5F5;` |
| **Active 배경** | 피그잼 퍼플 | `background: #8C4CF6; color: #FFFFFF;` (bold 없음) |

---

## 21. Connector Gizmo (커넥터 기즈모 및 앵커 프리뷰 캔버스)
> **Figma Node ID**: `1027248:5061`

### 21.1 개요 및 구조
* Connection 탭에서 두 노드 간 연결선이 출발/도착할 앵커 포트(Top, Right, Bottom, Left)를 선택하는 인터랙티브 프리뷰 캔버스 컴포넌트입니다.
* 부드러운 배경 캔버스 위에 두 개의 노드 카드가 가로로 나란히 배치되고, 각 카드의 4면에 11×11px 크기의 사각형 마그넷 기즈모 핸들이 배치됩니다.

### 21.2 레이아웃 및 세부 규격 (Figma 1027248:5061 1:1 매핑)
| 구성 요소 | 공식 피그마 규격 | CSS 스펙 | 비고 |
| :--- | :--- | :--- | :--- |
| **캔버스 컨테이너** | 너비 `328px`, 높이 `128px`, 반경 `5px` | `width: 100%; height: 128px; border-radius: 5px; background: #F5F5F5; display: flex; align-items: center; justify-content: center; gap: 40px;` | 두 카드 사이 간격 정확히 `40px` |
| **노드 프리뷰 카드** | 너비 `116px`, 높이 `72px`, 반경 `0px` | `width: 116px; height: 72px; background: #FFFFFF; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 0px; box-shadow: none;` | 직각 플랫 카드 |
| **카드 내부 텍스트** | 텍스트 영역 `90×54px`, 중앙 정렬 | `font-size: 11px; font-weight: 400; color: rgba(0, 0, 0, 0.5); text-align: center; word-break: break-all;` | 선택된 노드 타이틀 표시 |
| **미선택 기즈모 핸들** | `11×11px`, 반경 `0px`, 흰색 채움, 1px 보더 | `width: 11px; height: 11px; background: #FFFFFF; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 0px;` | 사각형 미세 테두리 |
| **선택(Active) 기즈모 핸들** | `11×11px`, 반경 `0px`, 솔리드 바이올렛 채움 | `width: 11px; height: 11px; background: #8638E5 !important; border: 1px solid #8638E5 !important; box-shadow: none;` | 완전한 보라색 사각형 |
| **기즈모 배치 오프셋** | 상하좌우 중심축 -5.5px 돌출 | `top/bottom: -5.5px; left: calc(50% - 5.5px);` / `left/right: -5.5px; top: calc(50% - 5.5px);` | 카드 테두리에 반쯤 걸침 |
