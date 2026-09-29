# 주요 데이터 타입 (Data Types)

> 출처: https://developers.figma.com/docs/plugins/api/data-types/
> TypeScript 타이핑 파일: `@figma/plugin-typings`

---

## 색상 (Color / Paint)

### RGBA Color

```typescript
interface RGB {
  r: number;  // 0~1
  g: number;  // 0~1
  b: number;  // 0~1
}

interface RGBA extends RGB {
  a: number;  // 0~1 (alpha)
}
```

### Paint (채움/선 정의)

```typescript
// 단색
type SolidPaint = {
  type: 'SOLID';
  color: RGB;
  opacity?: number;   // 0~1, 기본 1
  visible?: boolean;
  blendMode?: BlendMode;
};

// 선형 그라디언트
type GradientPaint = {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  gradientTransform: Transform;
  gradientStops: ColorStop[];
  opacity?: number;
  visible?: boolean;
};

// 이미지
type ImagePaint = {
  type: 'IMAGE';
  imageHash: string | null;
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageTransform?: Transform;
  scalingFactor?: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
};

// ColorStop (그라디언트 정지점)
interface ColorStop {
  position: number;  // 0~1
  color: RGBA;
}
```

---

## 이펙트 (Effect)

```typescript
// 그림자
type DropShadowEffect = {
  type: 'DROP_SHADOW';
  color: RGBA;
  offset: Vector;          // { x, y }
  radius: number;          // 블러 반경
  spread?: number;
  visible: boolean;
  blendMode: BlendMode;
  showShadowBehindNode?: boolean;
};

// 내부 그림자
type InnerShadowEffect = {
  type: 'INNER_SHADOW';
  color: RGBA;
  offset: Vector;
  radius: number;
  spread?: number;
  visible: boolean;
  blendMode: BlendMode;
};

// 레이어 블러
type LayerBlurEffect = {
  type: 'LAYER_BLUR';
  radius: number;
  visible: boolean;
};

// 배경 블러
type BackgroundBlurEffect = {
  type: 'BACKGROUND_BLUR';
  radius: number;
  visible: boolean;
};

type Effect = DropShadowEffect | InnerShadowEffect | LayerBlurEffect | BackgroundBlurEffect;
```

---

## 변환 행렬 (Transform)

2D 아핀 변환 행렬입니다.

```typescript
type Transform = [
  [number, number, number],  // [cos, -sin, tx]
  [number, number, number]   // [sin,  cos, ty]
];
```

---

## 벡터 / 좌표

```typescript
interface Vector {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}
```

---

## BlendMode

```typescript
type BlendMode =
  'PASS_THROUGH' | 'NORMAL' |
  'DARKEN' | 'MULTIPLY' | 'LINEAR_BURN' | 'COLOR_BURN' |
  'LIGHTEN' | 'SCREEN' | 'LINEAR_DODGE' | 'COLOR_DODGE' |
  'OVERLAY' | 'SOFT_LIGHT' | 'HARD_LIGHT' |
  'DIFFERENCE' | 'EXCLUSION' |
  'HUE' | 'SATURATION' | 'COLOR' | 'LUMINOSITY';
```

---

## 폰트 관련

```typescript
interface FontName {
  family: string;    // "Inter", "Noto Sans KR"
  style: string;     // "Regular", "Bold", "Italic"
}

type LetterSpacing =
  | { value: number; unit: 'PIXELS' }
  | { value: number; unit: 'PERCENT' };

type LineHeight =
  | { value: number; unit: 'PIXELS' }
  | { value: number; unit: 'PERCENT' }
  | { unit: 'AUTO' };

type TextDecoration = 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';

type TextCase =
  'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
```

---

## 제약 (Constraints)

```typescript
interface Constraints {
  horizontal: ConstraintType;
  vertical: ConstraintType;
}

type ConstraintType =
  'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
```

---

## 내보내기 설정 (ExportSettings)

```typescript
type ExportSettingsImage = {
  format: 'PNG' | 'JPG' | 'WEBP';
  constraint?: ExportSettingsConstraints;
  contentsOnly?: boolean;
  colorProfile?: 'DOCUMENT' | 'SRGB' | 'DISPLAY_P3_V4';
  suffix?: string;
};

type ExportSettingsSVG = {
  format: 'SVG';
  contentsOnly?: boolean;
  svgIdAttribute?: boolean;
  svgSimplifyStroke?: boolean;
  svgOutlineText?: boolean;
  suffix?: string;
};

type ExportSettingsPDF = {
  format: 'PDF';
  constraint?: ExportSettingsConstraints;
  suffix?: string;
};

type ExportSettingsConstraints =
  | { type: 'SCALE'; value: number }
  | { type: 'WIDTH'; value: number }
  | { type: 'HEIGHT'; value: number };
```

---

## 그리드 (LayoutGrid)

```typescript
// 행/열 그리드
type RowsColsLayoutGrid = {
  pattern: 'ROWS' | 'COLUMNS';
  alignment: 'MIN' | 'MAX' | 'STRETCH' | 'CENTER';
  gutterSize: number;
  count: number;
  sectionSize?: number;
  offset?: number;
  visible?: boolean;
  color?: RGBA;
};

// 격자 그리드
type GridLayoutGrid = {
  pattern: 'GRID';
  sectionSize: number;
  visible?: boolean;
  color?: RGBA;
};
```
