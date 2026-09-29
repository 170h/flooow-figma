# API Reference 인덱스

> 출처: https://developers.figma.com/docs/plugins/api/api-reference/

---

## Overview (개요)

| 파일 | 내용 |
|------|------|
| [manifest.md](./manifest.md) | manifest.json 전체 필드 레퍼런스 |
| [typings-and-errors.md](./typings-and-errors.md) | TypeScript 타입 파일 설정 + API 에러 목록 |

---

## Global Objects (글로벌 객체)

| 파일 | 내용 |
|------|------|
| [figma-ui.md](./figma-ui.md) | `figma.ui` — UI iframe 통신 (postMessage, show/hide/resize) |
| [figma-viewport.md](./figma-viewport.md) | `figma.viewport` — 뷰포트 중심·줌·scrollAndZoomIntoView |
| [figma-clientStorage.md](./figma-clientStorage.md) | `figma.clientStorage` — 로컬 영속 데이터 저장 |
| [figma-variables.md](./figma-variables.md) | `figma.variables` — 디자인 토큰(변수) 읽기/생성 |
| [figma-util.md](./figma-util.md) | `figma.util` — solidPaint, fetchAsync 편의 함수 |

> `figma` 글로벌 객체 전체 목록(프로퍼티·메서드)은 [../07-api-reference.md](../07-api-reference.md) 참조

---

## Node Types (노드 타입)

### 주요 노드 (Figma Design)

| 파일 | 노드 | 설명 |
|------|------|------|
| [nodes/FrameNode.md](./nodes/FrameNode.md) | `FrameNode` | 프레임, Auto Layout 컨테이너 |
| [nodes/TextNode.md](./nodes/TextNode.md) | `TextNode` | 텍스트, 폰트, 범위 지정 서식 |
| [nodes/RectangleNode.md](./nodes/RectangleNode.md) | `RectangleNode` | 사각형, 개별 모서리 반경 |
| [nodes/ComponentNode.md](./nodes/ComponentNode.md) | `ComponentNode` & `ComponentSetNode` | 컴포넌트 마스터 & 배리언트 |
| [nodes/InstanceNode.md](./nodes/InstanceNode.md) | `InstanceNode` | 컴포넌트 인스턴스, 배리언트 제어 |
| [nodes/ShapeNodes.md](./nodes/ShapeNodes.md) | `EllipseNode`, `LineNode`, `PolygonNode`, `StarNode`, `VectorNode`, `BooleanOperationNode`, `GroupNode`, `SliceNode` | 기본 도형 모음 |
| [nodes/DocumentNode-PageNode.md](./nodes/DocumentNode-PageNode.md) | `DocumentNode` & `PageNode` | 문서 루트와 페이지 |

### FigJam 노드

| 파일 | 노드 | 설명 |
|------|------|------|
| [nodes/FigJamNodes.md](./nodes/FigJamNodes.md) | `StickyNode`, `ShapeWithTextNode`, `ConnectorNode`, `CodeBlockNode`, `TableNode`, `SectionNode` | FigJam 전용 노드 모음 |

---

## Shared Node Properties (공유 속성)

| 파일 | 내용 |
|------|------|
| [node-properties.md](./node-properties.md) | BaseNodeMixin, LayoutMixin, GeometryMixin, CornerMixin, ChildrenMixin, AutoLayoutMixin, PluginDataMixin, ExportMixin |

---

## Data Types (데이터 타입)

| 파일 | 내용 |
|------|------|
| [data-types.md](./data-types.md) | Paint, Effect, Transform, Vector, BlendMode, FontName, LetterSpacing, LineHeight, ExportSettings, LayoutGrid 등 |
