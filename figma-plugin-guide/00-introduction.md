# Figma Plugin 소개 (Introduction)

> 출처: https://developers.figma.com/docs/plugins/

---

## Figma 플러그인이란?

플러그인은 **커뮤니티가 만든 프로그램**으로, Figma 에디터의 기능을 확장합니다.
파일 내에서 실행되며 하나 이상의 작업을 수행합니다.

- 사용자와 조직이 워크플로우를 커스터마이징하고 효율화하는 데 활용
- **JavaScript**로 기능을 작성, **HTML**로 UI를 구성
- [Figma Plugin API](https://developers.figma.com/docs/plugins/api/api-reference/)를 통해 Figma 에디터와 상호작용

---

## Plugin API 접근 범위

Plugin API는 **읽기(Read)** 및 **쓰기(Write)** 모두 지원합니다.

### 접근 가능한 것들
- 파일의 레이어 패널에 있는 모든 콘텐츠
- 레이어/노드의 색상, 위치, 계층, 텍스트 등 속성
- `figma` 글로벌 객체를 통해 대부분의 API 접근 가능

### 접근 제한 사항
| 제한 항목 | 대안 |
|-----------|------|
| 팀/조직 라이브러리의 스타일·컴포넌트 | `importComponentByKeyAsync()` 등으로 파일에 임포트 후 접근 |
| URL 기반 외부 폰트 | `loadFontAsync()`로 에디터 폰트만 로드 가능 |
| 파일 팀/위치, 권한, 댓글, 버전 이력 | [Figma REST API](https://developers.figma.com/docs/rest-api/) 사용 |

> 📝 **파일 동적 로딩**: Figma 파일은 필요에 따라 동적으로 로드됩니다.
> 현재 보기 중인 페이지 외부에 접근할 때는 **비동기 API**를 사용해야 합니다.

---

## 문서 구조 (Document Structure)

```
DocumentNode (파일 루트)
  └── PageNode (각 페이지)
       └── FrameNode / RectangleNode / TextNode / ... (레이어/오브젝트)
```

- **DocumentNode**: 모든 파일의 루트. 파일 탐색의 시작점
- **PageNode**: Figma Design·FigJam은 여러 페이지, Slides·Buzz는 1개 페이지
- **하위 노드**: 캔버스의 레이어와 오브젝트를 표현
- **노드 속성**: 전역 속성(모든 노드 공통) + 타입별 속성

---

## 사용자 액션 (User Actions)

- 사용자는 **한 번에 하나의 플러그인**만 실행 가능
- **백그라운드에서 실행되는 플러그인 불가**
- 즉시 실행하거나 [파라미터 입력](https://developers.figma.com/docs/plugins/plugin-parameters/) 방식 선택 가능

### Plugin UI (모달)
- `<iframe>` 형태의 모달로 HTML/CSS/JavaScript 자유롭게 사용
- Figma 디자인 시스템과 유사한 컴포넌트 라이브러리: [figma-plugins-on-github](https://github.com/thomas-lowry/figma-plugins-on-github)

### Plugin Parameters (파라미터)
- 퀵 액션 메뉴(`Cmd+/` 또는 `Ctrl+/`)에서 파라미터를 통해 입력받기 가능
- 커스텀 UI 없이 플러그인을 실행하는 스트림라인드 방식

### Relaunch Buttons (재실행 버튼)
- `setRelaunchData()` 함수로 Figma UI에 재실행 버튼 추가 가능
- 여러 번 실행이 필요하거나 협업자가 동일 파일에서 재실행할 때 유용

```json
// manifest.json
"relaunchButtons": [
  { "command": "edit", "name": "Edit shape" },
  { "command": "open", "name": "Open Shaper", "multipleSelection": true }
]
```

> **Figma Design**: Properties 패널에 표시
> **Dev Mode**: Inspect 패널에 표시
> **FigJam**: 노드의 프로퍼티 메뉴에 표시 (페이지/문서 노드에는 불가)

---

## 플러그인 관리 (Plugin Management)

### 지원 (Support)
- Figma는 서드파티 플러그인을 직접 지원하지 않음
- 개발자가 사용자 지원 책임 — 제출 시 **Support contact** 필수 입력

### 버전 관리 (Versioning)
- 최초 승인 후 추가 심사 없이 즉시 업데이트 게시 가능
- 모든 사용자에게 자동 업데이트 적용
- 사용자가 이전 버전으로 롤백 불가 (개발자가 이전 버전 재게시 필요)

### 애널리틱스 (Analytics)
- Figma는 플러그인 사용량 애널리틱스 미제공
- 자체 애널리틱스/크래시 리포팅 서비스 직접 구성 권장
- Figma Community 참여 수치는 주 1회 이메일로 통보
