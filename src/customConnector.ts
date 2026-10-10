// ============================================================================
// 커스텀 90도 칼각 직각 벡터 커넥터 엔진 (Custom Orthogonal Vector Connector)
// 피그잼 기본 커넥터의 라운딩 강제 문제를 해결하고 100% 순수 직각 Miter 선 생성
// ============================================================================

import {
  MagnetPosition,
  ConnectorRoutingType,
  ConnectorTerminalType,
  ConnectorStrokePattern,
  ConnectorLabelBoxStyle,
  ConnectorLabelAlign,
} from './types';

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 부모 로컬 좌표가 아니라 캔버스 절대 박스. 중첩된 Figma 오브젝트도 페이지 위 커넥터와 맞는다. */
export function sceneNodePageBox(node: SceneNode): Box {
  const bounds = node.absoluteBoundingBox;
  if (bounds) {
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  }
  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

export interface ConnectorOptions {
  strokeWeight?: number;
  strokeColor?: RGB;
  label?: string;
  labelBoxStyle?: ConnectorLabelBoxStyle;
  labelAlign?: ConnectorLabelAlign;
  labelFillColor?: string;
  labelStrokeColor?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  routingType?: ConnectorRoutingType;
  startTerminal?: ConnectorTerminalType;
  endTerminal?: ConnectorTerminalType;
  startOffset?: number;
  endOffset?: number;
  strokePattern?: ConnectorStrokePattern;
  labelOn?: boolean;
}

// 16진수 색상 코드를 RGB로 변환 (0~1 범위)
export function parseHexColor(hex?: string): RGB {
  if (!hex) return { r: 0.9, g: 0.1, b: 0.2 };
  const clean = hex.replace('#', '').trim();
  if (clean.length < 6) return { r: 0.9, g: 0.1, b: 0.2 };
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return {
    r: isNaN(r) ? 0 : r,
    g: isNaN(g) ? 0 : g,
    b: isNaN(b) ? 0 : b,
  };
}

// 배경색 밝기에 따른 텍스트 대비 색상 산출
export function getContrastTextColor(hex?: string): RGB {
  const rgb = parseHexColor(hex);
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 0.55 ? { r: 0.1, g: 0.1, b: 0.1 } : { r: 1, g: 1, b: 1 };
}

// 커넥터 라벨 디자인 스펙 (Figma UI3 1027448:1714~1732 — 5종 타입 × 한 줄/여러 줄)
export const LABEL_FONT_SIZE = 9;
const LABEL_LINE_HEIGHT_PERCENT = 140; // 라인하이트 140% (글자 크기 대비)
const LABEL_LINE_HEIGHT = (LABEL_FONT_SIZE * LABEL_LINE_HEIGHT_PERCENT) / 100; // 한 줄 높이 추정용 px 환산값 (9px → 12.6px)
const LABEL_STROKE_WEIGHT = 1.5;
const LABEL_PADDING_X = 12;
const LABEL_PADDING_Y = 7.5;
const LABEL_RADIUS_ROUNDED = 8;
const LABEL_RADIUS_CAPSULE = 999; // Figma가 높이의 1/2로 자동 클램프 (한 줄 16 / 여러 줄 32 모두 완전한 캡슐)
const LABEL_MULTILINE_TEXT_WIDTH = 82; // 텍스트가 이 폭을 넘으면 고정 폭으로 줄바꿈(여러 줄 라벨)

// 라벨 프레임에 저장하는 직전 방향 pluginData 키 ('1' 세로 / '0' 가로)
export const LABEL_IS_VERTICAL_KEY = 'connector_label_is_vertical';

// 라벨 프레임에 저장된 직전 방향 조회 (없으면 undefined)
export function readPrevLabelVertical(labelFrame: SceneNode | null | undefined): boolean | undefined {
  const v = safeGetPluginData(labelFrame, LABEL_IS_VERTICAL_KEY);
  return v === '1' ? true : v === '0' ? false : undefined;
}

// 라벨 박스 크기 힌트
// - 스타일이 한 번이라도 적용된 프레임이면 실제 크기를 반환
// - 신규 프레임(Figma 기본 100×100)이면 텍스트 길이로 추정 (높이: 라인하이트 + 상하 패딩 + 보더, 폭: 글자 수 × 평균 글자폭 + 좌우 패딩 + 보더, 여러 줄 폭 상한 적용)
export function getLabelSizeHint(
  labelFrame: SceneNode | null | undefined,
  labelText?: string
): { width: number; height: number } {
  if (labelFrame && readPrevLabelVertical(labelFrame) !== undefined && labelFrame.width > 0 && labelFrame.height > 0) {
    return { width: labelFrame.width, height: labelFrame.height };
  }
  const charCount = (labelText || '').length;
  const textWidth = Math.min(LABEL_MULTILINE_TEXT_WIDTH, Math.max(1, charCount) * LABEL_FONT_SIZE * 0.6);
  return {
    // 실측: 상하 패딩 8 → 높이 32px (라인하이트 12.6 + 패딩 16 + 보더 1.5×2 ≈ 31.6) 이므로 보더 두께도 크기에 포함
    width: textWidth + LABEL_PADDING_X * 2 + LABEL_STROKE_WEIGHT * 2,
    height: LABEL_LINE_HEIGHT + LABEL_PADDING_Y * 2 + LABEL_STROKE_WEIGHT * 2,
  };
}

// 라벨 컬러 None(배경 투명 / 보더 삭제) 값 판별
function isNoneColorValue(color?: string): boolean {
  const c = (color || '').trim().toLowerCase();
  return c === 'none' || c === 'transparent';
}

function rgbToHex(rgb: RGB): string {
  const toHex = (c: number) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// 커넥터 라벨 스타일 적용 헬퍼 (글자크기 9px, 트래킹 없음, 박스/캡슐/라운드박스/라인 스타일 적용)
export async function applyConnectorLabelStyle(
  labelFrame: FrameNode,
  textNode: TextNode,
  options: {
    labelText: string;
    boxStyle?: ConnectorLabelBoxStyle;
    textAlign?: ConnectorLabelAlign;
    fillColor?: string;
    strokeColor?: string;
    isVertical?: boolean;
    /** 연결된 커넥터 라인의 스트로크 두께 (라벨 보더 두께와 연동, 미지정/0 이하면 기본 1.5px) */
    connectorStrokeWeight?: number;
  }
): Promise<void> {
  const {
    labelText,
    boxStyle = 'BOX',
    textAlign = 'CENTER',
    fillColor = '#FFFFFF',
    strokeColor = '#000000',
    isVertical = false,
    connectorStrokeWeight,
  } = options;

  // 라벨 보더 두께는 커넥터 라인 스트로크 두께와 연동
  const labelStrokeWeight =
    typeof connectorStrokeWeight === 'number' && connectorStrokeWeight > 0
      ? connectorStrokeWeight
      : LABEL_STROKE_WEIGHT;

  // 1. 폰트 로드: Inter Regular(400)
  //    (FigJam 전용 플러그인이라 Variables API로 UI3 토큰 450 바인딩 불가 → 가장 가까운 이름 스타일 Regular 사용)
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  textNode.fontName = { family: 'Inter', style: 'Regular' };

  // 2. 텍스트 설정: 9px / 라인하이트 140%, 수평 정렬, tracking(letter-spacing) 절대 부여 금지 (규칙 준수)
  textNode.characters = labelText;
  textNode.fontSize = LABEL_FONT_SIZE;
  textNode.lineHeight = { value: LABEL_LINE_HEIGHT_PERCENT, unit: 'PERCENT' };
  textNode.textAlignHorizontal = textAlign;
  // 한 줄 라벨: 내용 폭에 맞춰 늘어남 / 여러 줄 라벨: 고정 폭(82px)으로 줄바꿈하고 높이만 늘어남
  textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
  if (textNode.width > LABEL_MULTILINE_TEXT_WIDTH) {
    textNode.textAutoResize = 'HEIGHT';
    textNode.resize(LABEL_MULTILINE_TEXT_WIDTH, textNode.height);
  }
  // 배경 None(투명)이면 대비 산출 기준이 없으므로 어두운 텍스트 색 사용
  const isFillNone = isNoneColorValue(fillColor);
  const isStrokeNone = isNoneColorValue(strokeColor);
  const textFill = isFillNone ? { r: 0.1, g: 0.1, b: 0.1 } : getContrastTextColor(fillColor);
  textNode.fills = [{ type: 'SOLID', color: textFill }];

  // 3. 라벨 프레임 오토레이아웃 및 패딩
  labelFrame.layoutMode = 'HORIZONTAL';
  labelFrame.primaryAxisSizingMode = 'AUTO';
  labelFrame.counterAxisSizingMode = 'AUTO';
  labelFrame.counterAxisAlignItems = 'CENTER';
  labelFrame.primaryAxisAlignItems = textAlign === 'LEFT' ? 'MIN' : textAlign === 'RIGHT' ? 'MAX' : 'CENTER';

  labelFrame.paddingTop = LABEL_PADDING_Y;
  labelFrame.paddingBottom = LABEL_PADDING_Y;
  labelFrame.paddingLeft = LABEL_PADDING_X;
  labelFrame.paddingRight = LABEL_PADDING_X;

  // 4. 배경 채움 (fills)
  // None이면 배경 투명(fills 비움)
  labelFrame.fills = isFillNone ? [] : [{ type: 'SOLID', color: parseHexColor(fillColor) }];

  // 직전 방향 기억 (다음 재배치 시 모호 구간 히스테리시스 기준)
  labelFrame.setPluginData(LABEL_IS_VERTICAL_KEY, isVertical ? '1' : '0');

  // 5. 보더(strokes) 및 코너 라운드 — None이면 보더 삭제(strokes 비움)
  labelFrame.strokes = isStrokeNone ? [] : [{ type: 'SOLID', color: parseHexColor(strokeColor) }];

  switch (boxStyle) {
    case 'BOX':
      labelFrame.cornerRadius = 0;
      labelFrame.strokeWeight = labelStrokeWeight;
      break;

    case 'CAPSULE':
      labelFrame.cornerRadius = LABEL_RADIUS_CAPSULE;
      labelFrame.strokeWeight = labelStrokeWeight;
      break;

    case 'ROUNDED_BOX':
      labelFrame.cornerRadius = LABEL_RADIUS_ROUNDED;
      labelFrame.strokeWeight = labelStrokeWeight;
      break;

    case 'LINE':
      labelFrame.cornerRadius = 0;
      // 세그먼트가 세로면 위/아래 라인(1718·1726), 가로면 좌/우 라인(1730)
      if (isVertical) {
        if ('strokeTopWeight' in labelFrame) {
          labelFrame.strokeTopWeight = labelStrokeWeight;
          labelFrame.strokeBottomWeight = labelStrokeWeight;
          labelFrame.strokeLeftWeight = 0;
          labelFrame.strokeRightWeight = 0;
        } else {
          (labelFrame as any).strokeWeight = labelStrokeWeight;
        }
      } else {
        if ('strokeLeftWeight' in labelFrame) {
          labelFrame.strokeLeftWeight = labelStrokeWeight;
          labelFrame.strokeRightWeight = labelStrokeWeight;
          labelFrame.strokeTopWeight = 0;
          labelFrame.strokeBottomWeight = 0;
        } else {
          (labelFrame as any).strokeWeight = labelStrokeWeight;
        }
      }
      break;
  }
}

// 안전한 플러그인 데이터 조회 헬퍼 (피그잼 네이티브 노드 중 getPluginData가 없거나 함수가 아닌 경우 TypeError 방지)
export function safeGetPluginData(node: any, key: string): string {
  if (node && typeof node.getPluginData === 'function') {
    try {
      return node.getPluginData(key) || '';
    } catch (_) {
      return '';
    }
  }
  return '';
}

// 터미널 타입을 피그마 VectorVertex의 StrokeCap으로 매핑
export function terminalToStrokeCap(terminal?: ConnectorTerminalType): StrokeCap {
  switch (terminal) {
    case 'ARROW':
    case 'REVERSED_TRIANGLE_ARROW':
      return 'ARROW_LINES';
    case 'TRIANGLE_ARROW':
      return 'ARROW_EQUILATERAL';
    case 'CIRCLE':
      return 'CIRCLE_FILLED';
    case 'DIAMOND':
      return 'DIAMOND_FILLED';
    case 'NONE':
    default:
      return 'NONE';
  }
}

// 마그넷 방향 벡터 반환
export function getMagnetDirectionVector(magnet: MagnetPosition): Point {
  switch (magnet) {
    case 'TOP': return { x: 0, y: -1 };
    case 'BOTTOM': return { x: 0, y: 1 };
    case 'LEFT': return { x: -1, y: 0 };
    case 'RIGHT': return { x: 1, y: 0 };
  }
}

// 3차 베지어 곡선 포인트 계산 (자유곡선 CURVED)
export function calculateCurvedPoints(
  srcPoint: Point,
  srcMagnet: MagnetPosition,
  tgtPoint: Point,
  tgtMagnet: MagnetPosition,
  steps: number = 28
): Point[] {
  const dirSrc = getMagnetDirectionVector(srcMagnet);
  const dirTgt = getMagnetDirectionVector(tgtMagnet);

  const dist = Math.hypot(tgtPoint.x - srcPoint.x, tgtPoint.y - srcPoint.y);
  const handleLen = Math.max(dist * 0.45, 25);

  const cp1: Point = {
    x: srcPoint.x + dirSrc.x * handleLen,
    y: srcPoint.y + dirSrc.y * handleLen,
  };
  const cp2: Point = {
    x: tgtPoint.x + dirTgt.x * handleLen,
    y: tgtPoint.y + dirTgt.y * handleLen,
  };

  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const invT = 1 - t;
    const x =
      invT * invT * invT * srcPoint.x +
      3 * invT * invT * t * cp1.x +
      3 * invT * t * t * cp2.x +
      t * t * t * tgtPoint.x;
    const y =
      invT * invT * invT * srcPoint.y +
      3 * invT * invT * t * cp1.y +
      3 * invT * t * t * cp2.y +
      t * t * t * tgtPoint.y;
    points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  return points;
}

// 직선 포인트 계산 (STRAIGHT)
export function calculateStraightPoints(srcPoint: Point, tgtPoint: Point): Point[] {
  return [srcPoint, tgtPoint];
}

// 라우팅 타입별 포인트 계산 종합 헬퍼 (노드로부터 떨어지는 간격 startOffset, endOffset 지원)
export function calculateRoutingPoints(
  srcPoint: Point,
  sourceMagnet: MagnetPosition,
  tgtPoint: Point,
  targetMagnet: MagnetPosition,
  srcBox: Box,
  tgtBox: Box,
  routingType: ConnectorRoutingType = 'ORTHOGONAL',
  startOffset: number = 0,
  endOffset: number = 0
): Point[] {
  // 시작점/끝점 노드 보더로부터의 마그넷 법선 방향 오프셋 적용
  const dirSrc = getMagnetDirectionVector(sourceMagnet);
  const dirTgt = getMagnetDirectionVector(targetMagnet);
  const adjustedSrcPoint: Point = {
    x: srcPoint.x + dirSrc.x * (startOffset || 0),
    y: srcPoint.y + dirSrc.y * (startOffset || 0),
  };
  const adjustedTgtPoint: Point = {
    x: tgtPoint.x + dirTgt.x * (endOffset || 0),
    y: tgtPoint.y + dirTgt.y * (endOffset || 0),
  };

  switch (routingType) {
    case 'STRAIGHT':
      return calculateStraightPoints(adjustedSrcPoint, adjustedTgtPoint);
    case 'CURVED':
      return calculateCurvedPoints(adjustedSrcPoint, sourceMagnet, adjustedTgtPoint, targetMagnet);
    case 'S_CURVE':
    case 'ORTHOGONAL':
    default:
      return calculateOrthogonalPoints(adjustedSrcPoint, sourceMagnet, adjustedTgtPoint, targetMagnet, srcBox, tgtBox);
  }
}

// 라우팅 타입별 및 단자 형태별 버텍스와 세그먼트 생성 (Circle, Diamond, Arrow는 피그마 네이티브 StrokeCap 지원)
export function buildVectorNetwork(
  localPoints: Point[],
  routingType: ConnectorRoutingType = 'ORTHOGONAL',
  startTerminal: ConnectorTerminalType = 'NONE',
  endTerminal: ConnectorTerminalType = 'ARROW',
  strokeWeight: number = 1.5,
  strokeColor: RGB = { r: 0, g: 0, b: 0 }
): { vertices: VectorVertex[]; segments: VectorSegment[]; regions: VectorRegion[] } {
  const len = localPoints.length;
  if (len === 0) return { vertices: [], segments: [], regions: [] };

  const startCap = terminalToStrokeCap(startTerminal);
  const endCap = terminalToStrokeCap(endTerminal);

  const vertices: VectorVertex[] = localPoints.map((pt, idx) => {
    const isLast = idx === len - 1;
    const isFirst = idx === 0;

    let cornerRadius = 0;
    let strokeJoin: StrokeJoin = 'MITER';

    if (routingType === 'S_CURVE') {
      strokeJoin = 'ROUND';
      // 중간 꺾임점 버텍스들에 코너 라운드니스(cornerRadius) 부드럽게 적용
      if (!isFirst && !isLast) {
        const prev = localPoints[idx - 1];
        const next = localPoints[idx + 1];
        const d1 = Math.hypot(pt.x - prev.x, pt.y - prev.y);
        const d2 = Math.hypot(next.x - pt.x, next.y - pt.y);
        const maxR = Math.min(d1, d2) / 2;
        cornerRadius = Math.min(14, Math.max(0, maxR));
      }
    } else if (routingType === 'CURVED') {
      strokeJoin = 'ROUND';
      cornerRadius = 0;
    } else if (routingType === 'STRAIGHT') {
      strokeJoin = 'MITER';
      cornerRadius = 0;
    } else {
      // ORTHOGONAL (칼각 직각)
      strokeJoin = 'MITER';
      cornerRadius = 0;
    }

    let strokeCap: StrokeCap = 'NONE';
    if (isFirst) {
      strokeCap = startCap;
    } else if (isLast) {
      strokeCap = endCap;
    }

    return {
      x: pt.x,
      y: pt.y,
      strokeCap,
      strokeJoin,
      cornerRadius,
    };
  });

  const segments: VectorSegment[] = [];
  for (let i = 0; i < len - 1; i++) {
    segments.push({ start: i, end: i + 1 });
  }

  const regions: VectorRegion[] = [];
  return { vertices, segments, regions };
}

// 하위 호환용 래퍼
export function buildVectorVertices(
  localPoints: Point[],
  routingType: ConnectorRoutingType = 'ORTHOGONAL',
  startTerminal: ConnectorTerminalType = 'NONE',
  endTerminal: ConnectorTerminalType = 'ARROW'
): VectorVertex[] {
  return buildVectorNetwork(localPoints, routingType, startTerminal, endTerminal).vertices;
}

// 세그먼트 방향(가로/세로) 판정 시 45° 부근의 모호 구간 비율 (±20%: 한쪽 축이 다른 축의 1.2배 이상이어야 확정)
const LABEL_DIRECTION_HYSTERESIS = 1.2;

/**
 * 세그먼트의 가로/세로 판정 (히스테리시스 적용)
 * - |dy| ≥ |dx|×1.2 → 세로 확정, |dx| ≥ |dy|×1.2 → 가로 확정
 * - 그 사이(대각선 45° 부근)는 직전 판정(prevIsVertical)을 유지하여 방향이 자주 뒤바뀌는 것을 방지
 * - 직전 판정이 없으면 기존 규칙(|dy| > |dx| 이면 세로)을 사용
 */
export function classifySegmentVertical(dx: number, dy: number, prevIsVertical?: boolean): boolean {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ay >= ax * LABEL_DIRECTION_HYSTERESIS && ay > 0) return true;
  if (ax >= ay * LABEL_DIRECTION_HYSTERESIS) return false;
  return prevIsVertical !== undefined ? prevIsVertical : ay > ax;
}

// 라우팅 타입별 라벨 중심점 및 세그먼트 방향 산출 헬퍼
// prevIsVertical: 직전 라벨 방향 (대각선·곡선의 모호 구간에서 방향 유지용)
// labelSize: 라벨 박스 크기 (직각 경로의 꺾임이 박스 안쪽 길이 이내면 흐름 방향 라인 스타일 유지)
export function getLabelPlacement(
  worldPoints: Point[],
  routingType: ConnectorRoutingType = 'ORTHOGONAL',
  prevIsVertical?: boolean,
  labelSize?: { width: number; height: number }
): { point: Point; isVertical: boolean } {
  if (worldPoints.length <= 2) {
    const p1 = worldPoints[0] || { x: 0, y: 0 };
    const p2 = worldPoints[worldPoints.length - 1] || p1;
    const isVertical = classifySegmentVertical(p2.x - p1.x, p2.y - p1.y, prevIsVertical);
    return {
      point: {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      },
      isVertical,
    };
  }

  if (routingType === 'CURVED') {
    const midIdx = Math.floor(worldPoints.length / 2);
    const pPrev = worldPoints[Math.max(0, midIdx - 1)];
    const pNext = worldPoints[Math.min(worldPoints.length - 1, midIdx + 1)];
    const isVertical = classifySegmentVertical(pNext.x - pPrev.x, pNext.y - pPrev.y, prevIsVertical);
    return {
      point: worldPoints[midIdx],
      isVertical,
    };
  }

  // 경로 전체 길이의 정확한 중간 지점 (Z자 직각 경로에서는 가운데 세로 구간 중앙)
  let totalLen = 0;
  for (let i = 0; i < worldPoints.length - 1; i++) {
    totalLen += Math.hypot(
      worldPoints[i + 1].x - worldPoints[i].x,
      worldPoints[i + 1].y - worldPoints[i].y
    );
  }

  const half = totalLen / 2;
  let walked = 0;
  for (let i = 0; i < worldPoints.length - 1; i++) {
    const p1 = worldPoints[i];
    const p2 = worldPoints[i + 1];
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (segLen > 0 && walked + segLen >= half) {
      // 꺾임(Jog) 보정: 양옆 구간이 같은 축(평행)인 짧은 중간 구간이 라벨 박스 안쪽 길이면
      // 흐름 방향(양옆 구간 축)의 라벨 방향을 유지하고, 라벨은 꺾임 구간 중앙에 배치
      //  - 상하 꺾임: 가로-세로-가로, 세로 구간 길이 ≤ 라벨 높이 → 가로 방향(좌우 세로선) 유지
      //  - 좌우 꺾임: 세로-가로-세로, 가로 구간 길이 ≤ 라벨 폭   → 세로 방향(상하 라인) 유지
      if (labelSize && i > 0 && i < worldPoints.length - 2) {
        const pBefore = worldPoints[i - 1];
        const pAfter = worldPoints[i + 2];
        const segIsVertical = Math.abs(p2.x - p1.x) < 0.5 && Math.abs(p2.y - p1.y) > 0.5;
        const segIsHorizontal = Math.abs(p2.y - p1.y) < 0.5 && Math.abs(p2.x - p1.x) > 0.5;
        const beforeIsHorizontal = Math.abs(p1.x - pBefore.x) > 0.5 && Math.abs(p1.y - pBefore.y) < 0.5;
        const afterIsHorizontal = Math.abs(pAfter.x - p2.x) > 0.5 && Math.abs(pAfter.y - p2.y) < 0.5;
        const beforeIsVertical = Math.abs(p1.y - pBefore.y) > 0.5 && Math.abs(p1.x - pBefore.x) < 0.5;
        const afterIsVertical = Math.abs(pAfter.y - p2.y) > 0.5 && Math.abs(pAfter.x - p2.x) < 0.5;

        const isShortVerticalJog =
          segIsVertical && beforeIsHorizontal && afterIsHorizontal && segLen <= labelSize.height;
        const isShortHorizontalJog =
          segIsHorizontal && beforeIsVertical && afterIsVertical && segLen <= labelSize.width;

        if (isShortVerticalJog || isShortHorizontalJog) {
          return {
            point: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
            isVertical: isShortHorizontalJog,
          };
        }
      }
      const t = (half - walked) / segLen;
      return {
        point: {
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        },
        isVertical: classifySegmentVertical(p2.x - p1.x, p2.y - p1.y, prevIsVertical),
      };
    }
    walked += segLen;
  }

  const last = worldPoints[worldPoints.length - 1];
  return { point: { x: last.x, y: last.y }, isVertical: false };
}

/** 부모(그룹) 로컬 좌표와 무관하게 노드의 페이지 절대 좌표를 설정한다. */
export function setNodeAbsoluteXY(node: SceneNode, absX: number, absY: number): void {
  const currentAbsX = node.absoluteTransform[0][2];
  const currentAbsY = node.absoluteTransform[1][2];
  node.x = node.x + (absX - currentAbsX);
  node.y = node.y + (absY - currentAbsY);
}

export function placeNodeAtWorldCenter(node: SceneNode, world: Point): void {
  setNodeAbsoluteXY(
    node,
    Math.round(world.x - node.width / 2),
    Math.round(world.y - node.height / 2)
  );
}

// 라우팅 타입별 라벨 중심점 산출 헬퍼
export function getLabelCenterPoint(worldPoints: Point[], routingType: ConnectorRoutingType = 'ORTHOGONAL'): Point {
  return getLabelPlacement(worldPoints, routingType).point;
}

// 1. 마그넷 위치에 따른 절대 좌표 계산
export function getMagnetPoint(box: Box, magnet: MagnetPosition): Point {
  switch (magnet) {
    case 'TOP':
      return { x: box.x + box.width / 2, y: box.y };
    case 'BOTTOM':
      return { x: box.x + box.width / 2, y: box.y + box.height };
    case 'LEFT':
      return { x: box.x, y: box.y + box.height / 2 };
    case 'RIGHT':
      return { x: box.x + box.width, y: box.y + box.height / 2 };
  }
}

// 2. 동선 최적화: 일직선 상에 있는 중복 중간 버텍스 제거 (Collinear Simplification)
export function simplifyOrthogonalPoints(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // 가로 일직선 상인 경우
    const isHorizontalCollinear =
      Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;
    // 세로 일직선 상인 경우
    const isVerticalCollinear =
      Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;

    // 점이 중복되거나 일직선상에 있지 않은 경우에만 꺾임점으로 보존
    if (!isHorizontalCollinear && !isVerticalCollinear) {
      // 아주 짧은 거리의 불필요한 미세 떨림 방지
      if (Math.abs(prev.x - curr.x) > 0.5 || Math.abs(prev.y - curr.y) > 0.5) {
        result.push(curr);
      }
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

// 3. 완벽한 90도 직각 경로 생성 알고리즘 (포트 방향성 100% 직교 진입 보장)
export function calculateOrthogonalPoints(
  srcPoint: Point,
  srcMagnet: MagnetPosition,
  tgtPoint: Point,
  tgtMagnet: MagnetPosition,
  srcBox: Box,
  tgtBox: Box
): Point[] {
  const points: Point[] = [srcPoint];
  const margin = 28; // 포트 탈출/진입 여백 거리 (px)

  // -------------------------------------------------------------------------
  // [대원칙]:
  // 1. 타겟이 TOP 또는 BOTTOM이면 마지막 선분은 무조건 X가 일치하는 수직선(Vertical)이어야 함!
  // 2. 타겟이 LEFT 또는 RIGHT이면 마지막 선분은 무조건 Y가 일치하는 수평선(Horizontal)이어야 함!
  // -------------------------------------------------------------------------

  // 1. 순수 세로 대향 연결 (BOTTOM ➔ TOP 또는 TOP ➔ BOTTOM)
  if (
    (srcMagnet === 'BOTTOM' && tgtMagnet === 'TOP') ||
    (srcMagnet === 'TOP' && tgtMagnet === 'BOTTOM')
  ) {
    const isDownward = srcMagnet === 'BOTTOM' && tgtMagnet === 'TOP';
    const isNormal = isDownward ? srcPoint.y + 10 < tgtPoint.y : srcPoint.y > tgtPoint.y + 10;

    if (isNormal) {
      if (Math.abs(srcPoint.x - tgtPoint.x) < 1) {
        // 완벽한 1자 수직선
        points.push(tgtPoint);
      } else {
        // 수직 ➔ 수평 ➔ 수직 (마지막은 무조건 수직으로 타겟에 꽂힘!)
        const midY = Math.round((srcPoint.y + tgtPoint.y) / 2);
        points.push({ x: srcPoint.x, y: midY });
        points.push({ x: tgtPoint.x, y: midY });
        points.push(tgtPoint);
      }
    } else {
      // 역방향 우회
      const detourX =
        tgtPoint.x >= srcPoint.x
          ? Math.max(srcBox.x + srcBox.width, tgtBox.x + tgtBox.width) + margin
          : Math.min(srcBox.x, tgtBox.x) - margin;

      const exitY = isDownward ? srcPoint.y + margin : srcPoint.y - margin;
      const enterY = isDownward ? tgtPoint.y - margin : tgtPoint.y + margin;

      points.push({ x: srcPoint.x, y: exitY });
      points.push({ x: detourX, y: exitY });
      points.push({ x: detourX, y: enterY });
      points.push({ x: tgtPoint.x, y: enterY });
      points.push(tgtPoint); // 마지막 선분은 완벽한 수직선!
    }
  }
  // 2. 순수 가로 대향 연결 (RIGHT ➔ LEFT 또는 LEFT ➔ RIGHT)
  else if (
    (srcMagnet === 'RIGHT' && tgtMagnet === 'LEFT') ||
    (srcMagnet === 'LEFT' && tgtMagnet === 'RIGHT')
  ) {
    const isRightward = srcMagnet === 'RIGHT' && tgtMagnet === 'LEFT';
    const isNormal = isRightward ? srcPoint.x + 10 < tgtPoint.x : srcPoint.x > tgtPoint.x + 10;

    if (isNormal) {
      if (Math.abs(srcPoint.y - tgtPoint.y) < 1) {
        // 완벽한 1자 가로선
        points.push(tgtPoint);
      } else {
        // 수평 ➔ 수직 ➔ 수평 (마지막은 무조건 수평으로 꽂힘!)
        const midX = Math.round((srcPoint.x + tgtPoint.x) / 2);
        points.push({ x: midX, y: srcPoint.y });
        points.push({ x: midX, y: tgtPoint.y });
        points.push(tgtPoint);
      }
    } else {
      // 역방향 우회: 타겟 박스를 안전하게 둘러서 우회
      const detourY =
        tgtPoint.y >= srcPoint.y
          ? Math.max(srcBox.y + srcBox.height, tgtBox.y + tgtBox.height) + margin
          : Math.min(srcBox.y, tgtBox.y) - margin;

      let exitX = isRightward ? srcPoint.x + margin : srcPoint.x - margin;
      const enterX = isRightward ? tgtPoint.x - margin : tgtPoint.x + margin;

      // 만약 exitX가 tgtBox의 X 범위 내에 있으면 관통하므로 안전한 바깥으로 보정
      if (exitX >= tgtBox.x - margin && exitX <= tgtBox.x + tgtBox.width + margin) {
        exitX = isRightward
          ? Math.max(srcBox.x + srcBox.width, tgtBox.x + tgtBox.width) + margin
          : Math.min(srcBox.x, tgtBox.x) - margin;
      }

      points.push({ x: exitX, y: srcPoint.y });
      points.push({ x: exitX, y: detourY });
      points.push({ x: enterX, y: detourY });
      points.push({ x: enterX, y: tgtPoint.y });
      points.push(tgtPoint); // 마지막 선분은 완벽한 수평선!
    }
  }
  // 3. 출발이 가로(RIGHT/LEFT)이고, 도착이 세로(TOP/BOTTOM)인 직교 연결 (마지막은 100% 수직선!)
  else if (
    (srcMagnet === 'RIGHT' || srcMagnet === 'LEFT') &&
    (tgtMagnet === 'TOP' || tgtMagnet === 'BOTTOM')
  ) {
    const exitDir = srcMagnet === 'RIGHT' ? 1 : -1;
    const isMovingForward = (tgtPoint.x - srcPoint.x) * exitDir > 0;

    if (isMovingForward) {
      // 1회 꺾임 직각 L자: (srcPoint.x, srcPoint.y) ➔ (tgtPoint.x, srcPoint.y) ➔ (tgtPoint.x, tgtPoint.y)
      points.push({ x: tgtPoint.x, y: srcPoint.y });
      points.push(tgtPoint);
    } else {
      // 뒤로 돌아야 할 때
      const exitX = srcPoint.x + exitDir * margin;
      const enterY = tgtMagnet === 'TOP' ? tgtPoint.y - margin : tgtPoint.y + margin;
      points.push({ x: exitX, y: srcPoint.y });
      points.push({ x: exitX, y: enterY });
      points.push({ x: tgtPoint.x, y: enterY });
      points.push(tgtPoint);
    }
  }
  // 4. 출발이 세로(TOP/BOTTOM)이고, 도착이 가로(LEFT/RIGHT)인 직교 연결 (마지막은 100% 수평선!)
  else if (
    (srcMagnet === 'TOP' || srcMagnet === 'BOTTOM') &&
    (tgtMagnet === 'LEFT' || tgtMagnet === 'RIGHT')
  ) {
    const exitDir = srcMagnet === 'BOTTOM' ? 1 : -1;
    const isMovingForward = (tgtPoint.y - srcPoint.y) * exitDir > 0;

    if (isMovingForward) {
      points.push({ x: srcPoint.x, y: tgtPoint.y });
      points.push(tgtPoint);
    } else {
      const exitY = srcPoint.y + exitDir * margin;
      const enterX = tgtMagnet === 'LEFT' ? tgtPoint.x - margin : tgtPoint.x + margin;
      points.push({ x: srcPoint.x, y: exitY });
      points.push({ x: enterX, y: exitY });
      points.push({ x: enterX, y: tgtPoint.y });
      points.push(tgtPoint);
    }
  }
  // 5. 동일 방향 포트 간 연결 (TOP ➔ TOP, BOTTOM ➔ BOTTOM, LEFT ➔ LEFT, RIGHT ➔ RIGHT)
  else if (srcMagnet === tgtMagnet) {
    if (srcMagnet === 'TOP') {
      const topDetourY = Math.min(srcBox.y, tgtBox.y) - margin;
      points.push({ x: srcPoint.x, y: topDetourY });
      points.push({ x: tgtPoint.x, y: topDetourY });
      points.push(tgtPoint);
    } else if (srcMagnet === 'BOTTOM') {
      const bottomDetourY = Math.max(srcBox.y + srcBox.height, tgtBox.y + tgtBox.height) + margin;
      points.push({ x: srcPoint.x, y: bottomDetourY });
      points.push({ x: tgtPoint.x, y: bottomDetourY });
      points.push(tgtPoint);
    } else if (srcMagnet === 'LEFT') {
      const leftDetourX = Math.min(srcBox.x, tgtBox.x) - margin;
      points.push({ x: leftDetourX, y: srcPoint.y });
      points.push({ x: leftDetourX, y: tgtPoint.y });
      points.push(tgtPoint);
    } else if (srcMagnet === 'RIGHT') {
      const rightDetourX = Math.max(srcBox.x + srcBox.width, tgtBox.x + tgtBox.width) + margin;
      points.push({ x: rightDetourX, y: srcPoint.y });
      points.push({ x: rightDetourX, y: tgtPoint.y });
      points.push(tgtPoint);
    }
  }
  // 6. 그 외 특수 조합의 범용 연결
  else {
    if (tgtMagnet === 'TOP' || tgtMagnet === 'BOTTOM') {
      // 타겟이 수직 포트이면 마지막 세그먼트를 무조건 수직으로 강제 진입
      const enterY = tgtMagnet === 'TOP' ? tgtPoint.y - margin : tgtPoint.y + margin;
      points.push({ x: srcPoint.x, y: enterY });
      points.push({ x: tgtPoint.x, y: enterY });
      points.push(tgtPoint); // 100% 수직 진입
    } else {
      // 타겟이 수평 포트이면 마지막 세그먼트를 무조건 수평으로 강제 진입
      const enterX = tgtMagnet === 'LEFT' ? tgtPoint.x - margin : tgtPoint.x + margin;
      points.push({ x: enterX, y: srcPoint.y });
      points.push({ x: enterX, y: tgtPoint.y });
      points.push(tgtPoint); // 100% 수평 진입
    }
  }

  return simplifyOrthogonalPoints(points);
}

// 선분이 박스 내부와 교차(관통)하는지 검사
export function lineSegmentIntersectsBox(
  p1: Point,
  p2: Point,
  box: Box,
  padding: number = 2
): boolean {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  const bLeft = box.x + padding;
  const bRight = box.x + box.width - padding;
  const bTop = box.y + padding;
  const bBottom = box.y + box.height - padding;

  if (bRight <= bLeft || bBottom <= bTop) return false;

  // 수평 선분 (y가 일정)
  if (Math.abs(p1.y - p2.y) < 0.5) {
    const y = p1.y;
    if (y > bTop && y < bBottom) {
      if (Math.max(minX, bLeft) < Math.min(maxX, bRight)) {
        return true;
      }
    }
  }
  // 수직 선분 (x가 일정)
  else if (Math.abs(p1.x - p2.x) < 0.5) {
    const x = p1.x;
    if (x > bLeft && x < bRight) {
      if (Math.max(minY, bTop) < Math.min(maxY, bBottom)) {
        return true;
      }
    }
  }

  return false;
}

// 경로가 소스 노드나 타겟 노드의 내부를 가로지르는지(관통하는지) 검사
export function doesPathCrossBoxes(
  points: Point[],
  srcBox: Box,
  tgtBox: Box
): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (lineSegmentIntersectsBox(p1, p2, srcBox)) return true;
    if (lineSegmentIntersectsBox(p1, p2, tgtBox)) return true;
  }
  return false;
}

// 4. 피그마 VectorNode로 90도 칼각 직각 커넥터 렌더링
export async function createOrthogonalVectorConnector(
  sourceNode: SceneNode,
  sourceMagnet: MagnetPosition,
  targetNode: SceneNode,
  targetMagnet: MagnetPosition,
  options: ConnectorOptions = {}
): Promise<VectorNode | GroupNode> {
  const srcBox = sceneNodePageBox(sourceNode);
  const tgtBox = sceneNodePageBox(targetNode);

  const pStart = getMagnetPoint(srcBox, sourceMagnet);
  const pEnd = getMagnetPoint(tgtBox, targetMagnet);

  const routingType: ConnectorRoutingType = options.routingType || 'ORTHOGONAL';

  // 라우팅 타입별 경로 포인트 계산 (직각, 라운드니스 S_CURVE, 자유곡선 CURVED, 직선 STRAIGHT, 시작/끝 오프셋)
  const worldPoints = calculateRoutingPoints(
    pStart,
    sourceMagnet,
    pEnd,
    targetMagnet,
    srcBox,
    tgtBox,
    routingType,
    options.startOffset || 0,
    options.endOffset || 0
  );

  // Bounding Box 및 로컬 좌표계 변환
  const allX = worldPoints.map((p) => p.x);
  const allY = worldPoints.map((p) => p.y);
  // 색상 및 두께 결정
  const strokeColor: RGB = options.strokeColor || { r: 0.18, g: 0.18, b: 0.22 };
  const strokeWeight: number = options.strokeWeight || 1.5;
  const startTerminal = options.startTerminal || 'NONE';
  const endTerminal = options.endTerminal || 'ARROW';
  const strokePattern = options.strokePattern || 'SOLID';

  const minX = Math.min(...allX);
  const minY = Math.min(...allY);
  const maxX = Math.max(...allX);
  const maxY = Math.max(...allY);

  // 최소 1px 크기 보장 (1자 직선일 때 width/height가 0이 되는 현상 방지)
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  const localPoints = worldPoints.map((p) => ({
    x: p.x - minX,
    y: p.y - minY,
  }));

  // 피그마 VectorNode 생성
  const vector = figma.createVector();
  vector.resize(width, height);
  setNodeAbsoluteXY(vector, minX, minY);

  // Circle, Diamond, Arrow 단자는 피그마 네이티브 StrokeCap으로 단일 VectorNode에 직접 렌더링
  const net = buildVectorNetwork(
    localPoints,
    routingType,
    startTerminal,
    endTerminal,
    strokeWeight,
    strokeColor
  );
  await vector.setVectorNetworkAsync(net);

  vector.strokes = [{ type: 'SOLID', color: strokeColor }];
  vector.strokeWeight = strokeWeight;
  vector.fills = [];
  if (strokePattern === 'DASHED') {
    vector.dashPattern = [4, 4];
  } else if (strokePattern === 'DOTTED') {
    vector.dashPattern = [1.5, 3];
  } else {
    vector.dashPattern = [];
  }
  vector.strokeJoin = routingType === 'S_CURVE' || routingType === 'CURVED' ? 'ROUND' : 'MITER';
  if (routingType === 'STRAIGHT') {
    vector.strokeCap = 'ROUND';
  }
  vector.strokeMiterLimit = 4;
  vector.name = `[Connector] ${sourceNode.name} → ${targetNode.name}`;

  // 플러그인 메타데이터 보존
  vector.setPluginData('is_flow_connector', 'true');
  vector.setPluginData('is_custom_connector', 'true');
  vector.setPluginData('connector_role', 'line');
  vector.setPluginData('source_node_id', sourceNode.id);
  vector.setPluginData('target_node_id', targetNode.id);
  vector.setPluginData('source_magnet', sourceMagnet);
  vector.setPluginData('target_magnet', targetMagnet);
  vector.setPluginData('connector_routing', routingType);
  vector.setPluginData('start_terminal', startTerminal);
  vector.setPluginData('end_terminal', endTerminal);
  vector.setPluginData('connector_pattern', strokePattern);
  vector.setPluginData('connector_weight', String(strokeWeight));

  // 5. 라벨 ON이거나 텍스트가 있으면 중앙 세그먼트에 태그 뱃지 생성
  let labelFrame: FrameNode | null = null;
  const labelText = options.label ? options.label.trim() : '';
  const shouldBuildLabel = options.labelOn === true || labelText !== '';
  if (shouldBuildLabel) {
    const boxStyle = options.labelBoxStyle || 'BOX';
    const align = options.labelAlign || 'CENTER';
    const lineHex = rgbToHex(strokeColor);
    const fillCol = options.labelFillColor || '#FFFFFF';
    const strokeCol = options.labelStrokeColor || lineHex;

    vector.setPluginData('connector_label_on', 'true');
    vector.setPluginData('connector_label', labelText);
    vector.setPluginData('connector_label_box_style', boxStyle);
    vector.setPluginData('connector_label_align', align);
    vector.setPluginData('connector_label_fill_color', fillCol);
    vector.setPluginData('connector_label_stroke_color', strokeCol);

    // 라우팅 타입별 라벨 중심점 및 세그먼트 방향 산출
    const { point: midSegmentPoint, isVertical } = getLabelPlacement(
      worldPoints,
      routingType,
      undefined,
      getLabelSizeHint(null, labelText)
    );

    // 라벨 태그 박스 생성
    labelFrame = figma.createFrame();
    labelFrame.name = 'ConnectorLabel';

    const textNode = figma.createText();
    textNode.name = 'LabelText';
    textNode.setPluginData('is_custom_connector', 'true');
    labelFrame.appendChild(textNode);

    await applyConnectorLabelStyle(labelFrame, textNode, {
      labelText,
      boxStyle,
      textAlign: align,
      fillColor: fillCol,
      strokeColor: strokeCol,
      isVertical,
      connectorStrokeWeight: strokeWeight,
    });

    placeNodeAtWorldCenter(labelFrame, midSegmentPoint);

    labelFrame.setPluginData('is_connector_label', 'true');
    labelFrame.setPluginData('is_custom_connector', 'true');
  }

  // vector 자체에 기본 메타데이터 저장
  vector.name = labelText
    ? `[Flow] ${sourceNode.name} → ${targetNode.name} ("${labelText}")`
    : `[Connector] ${sourceNode.name} → ${targetNode.name}`;
  vector.setPluginData('is_flow_connector', 'true');
  vector.setPluginData('is_custom_connector', 'true');
  vector.setPluginData('source_node_id', sourceNode.id);
  vector.setPluginData('target_node_id', targetNode.id);
  vector.setPluginData('source_magnet', sourceMagnet);
  vector.setPluginData('target_magnet', targetMagnet);
  vector.setPluginData('connector_routing', routingType);
  if (labelText) {
    vector.setPluginData('connector_label', labelText);
  }
  vector.setPluginData('start_terminal', startTerminal);
  vector.setPluginData('end_terminal', endTerminal);
  vector.setPluginData('connector_pattern', strokePattern);
  vector.setPluginData('connector_weight', String(strokeWeight));
  vector.setPluginData('start_offset', String(options.startOffset || 0));
  vector.setPluginData('end_offset', String(options.endOffset || 0));

  if (labelFrame) {
    const group = figma.group([vector, labelFrame], figma.currentPage);
    figma.currentPage.appendChild(group); // 최상위 레이어로 올려 노드 뒤에 가려짐 방지
    group.name = vector.name;
    copyConnectorData(vector, group);
    registerConnectorInRegistry(group);
    return group;
  }

  figma.currentPage.appendChild(vector);
  registerConnectorInRegistry(vector);
  return vector;
}

// ----------------------------------------------------------------------------
// 6. 노드 이동 시 커넥터 실시간 추적 및 패스 갱신 (Drag & Move Tracking Engine)
// ----------------------------------------------------------------------------

// nodeId -> Set<connectorNodeId> (O(1) 인메모리 빠른 매핑)
const nodeToConnectorsMap = new Map<string, Set<string>>();

export interface ConnectorDragSyncGate {
  running: boolean;
  pending: Set<string> | null;
}

export function createConnectorDragSyncGate(): ConnectorDragSyncGate {
  return { running: false, pending: null };
}

const connectorDragGate = createConnectorDragSyncGate();

// 이미 갱신 중이면 새 실행을 시작하지 않고 id만 모은다. true면 이 호출이 실행을 맡는다.
export function enqueueConnectorDrag(gate: ConnectorDragSyncGate, ids: Iterable<string>): boolean {
  if (gate.running) {
    if (!gate.pending) gate.pending = new Set();
    for (const id of ids) gate.pending.add(id);
    return false;
  }
  gate.running = true;
  return true;
}

export function takePendingConnectorDrag(gate: ConnectorDragSyncGate): Set<string> | null {
  const next = gate.pending;
  gate.pending = null;
  if (!next || next.size === 0) return null;
  return next;
}

export function finishConnectorDrag(gate: ConnectorDragSyncGate): void {
  gate.running = false;
}

// 커넥터 등록
export function registerConnectorInRegistry(connectorNode: SceneNode) {
  if (connectorNode.type === 'CONNECTOR') {
    const conn = connectorNode as ConnectorNode;
    const start = conn.connectorStart;
    const end = conn.connectorEnd;
    if ('endpointNodeId' in start && start.endpointNodeId) {
      if (!nodeToConnectorsMap.has(start.endpointNodeId)) {
        nodeToConnectorsMap.set(start.endpointNodeId, new Set());
      }
      nodeToConnectorsMap.get(start.endpointNodeId)!.add(connectorNode.id);
    }
    if ('endpointNodeId' in end && end.endpointNodeId) {
      if (!nodeToConnectorsMap.has(end.endpointNodeId)) {
        nodeToConnectorsMap.set(end.endpointNodeId, new Set());
      }
      nodeToConnectorsMap.get(end.endpointNodeId)!.add(connectorNode.id);
    }
    return;
  }

  const srcId = safeGetPluginData(connectorNode, 'source_node_id');
  const tgtId = safeGetPluginData(connectorNode, 'target_node_id');
  if (srcId) {
    if (!nodeToConnectorsMap.has(srcId)) nodeToConnectorsMap.set(srcId, new Set());
    nodeToConnectorsMap.get(srcId)!.add(connectorNode.id);
  }
  if (tgtId) {
    if (!nodeToConnectorsMap.has(tgtId)) nodeToConnectorsMap.set(tgtId, new Set());
    nodeToConnectorsMap.get(tgtId)!.add(connectorNode.id);
  }
}

// 캔버스 내 모든 커넥터(커스텀 및 네이티브) 스캔 및 레지스트리 초기화
export function refreshConnectorRegistry() {
  nodeToConnectorsMap.clear();
  try {
    const connectors = figma.currentPage.findAll((n) => {
      try {
        if (!n) return false;
        // 1. 피그마 네이티브 커넥터는 즉시 매칭 (가장 빠르고 안전)
        if (n.type === 'CONNECTOR') return true;
        // 2. 커스텀 커넥터는 오직 VECTOR 또는 GROUP 타입에만 존재하므로, 그 외 노드는 플러그인 데이터 조회를 건너뜀
        if (n.type === 'VECTOR' || n.type === 'GROUP') {
          return safeGetPluginData(n, 'is_custom_connector') === 'true';
        }
        return false;
      } catch (_) {
        return false;
      }
    });
    for (const conn of connectors) {
      registerConnectorInRegistry(conn);
    }
  } catch (err) {
    console.error('refreshConnectorRegistry 에러:', err);
  }
}

// 두 노드의 상대적 위치 및 노드 관통(가로지름) 배제 조건을 적용한 최단거리 최적 마그넷 포트 쌍 계산
export function getOptimalMagnetPair(
  srcBox: Box,
  tgtBox: Box
): { sourceMagnet: MagnetPosition; targetMagnet: MagnetPosition } {
  const MAGNETS: MagnetPosition[] = ['TOP', 'BOTTOM', 'LEFT', 'RIGHT'];

  // 두 노드의 중심점 간의 상대적 방향 벡터
  const centerSrcX = srcBox.x + srcBox.width / 2;
  const centerSrcY = srcBox.y + srcBox.height / 2;
  const centerTgtX = tgtBox.x + tgtBox.width / 2;
  const centerTgtY = tgtBox.y + tgtBox.height / 2;
  const dx = centerTgtX - centerSrcX;
  const dy = centerTgtY - centerSrcY;

  interface Candidate {
    srcMag: MagnetPosition;
    tgtMag: MagnetPosition;
    cost: number;
    crosses: boolean;
  }

  const candidates: Candidate[] = [];

  for (const srcMag of MAGNETS) {
    for (const tgtMag of MAGNETS) {
      const pStart = getMagnetPoint(srcBox, srcMag);
      const pEnd = getMagnetPoint(tgtBox, tgtMag);
      const points = calculateOrthogonalPoints(pStart, srcMag, pEnd, tgtMag, srcBox, tgtBox);
      const crosses = doesPathCrossBoxes(points, srcBox, tgtBox);

      // 경로 총 길이(유클리드 거리 합)
      let length = 0;
      for (let i = 0; i < points.length - 1; i++) {
        length += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      }

      // 기본 비용 = 길이 + 세그먼트 수 페널티(꺾임 횟수 최소화)
      let cost = length + points.length * 15;

      // 상대 방향과의 자연스러운 진행 방향 보너스
      if (srcMag === 'RIGHT' && dx > 0) cost -= 25;
      if (srcMag === 'LEFT' && dx < 0) cost -= 25;
      if (srcMag === 'BOTTOM' && dy > 0) cost -= 25;
      if (srcMag === 'TOP' && dy < 0) cost -= 25;

      if (tgtMag === 'LEFT' && dx > 0) cost -= 25;
      if (tgtMag === 'RIGHT' && dx < 0) cost -= 25;
      if (tgtMag === 'TOP' && dy > 0) cost -= 25;
      if (tgtMag === 'BOTTOM' && dy < 0) cost -= 25;

      candidates.push({ srcMag, tgtMag, cost, crosses });
    }
  }

  // 1. 노드를 가로지르지 않는(crosses === false) 후보들만 우선 선별 (노드 관통 원천 배제)
  const nonCrossingCandidates = candidates.filter((c) => !c.crosses);

  if (nonCrossingCandidates.length > 0) {
    nonCrossingCandidates.sort((a, b) => a.cost - b.cost);
    return {
      sourceMagnet: nonCrossingCandidates[0].srcMag,
      targetMagnet: nonCrossingCandidates[0].tgtMag,
    };
  }

  // 만약 모든 경로가 교차하는 불가피한 극단적 경우(두 노드가 완전히 포개진 경우): 최소 비용 후보 선택
  candidates.sort((a, b) => a.cost - b.cost);
  return {
    sourceMagnet: candidates[0].srcMag,
    targetMagnet: candidates[0].tgtMag,
  };
}

export function isFixedMagnetPosition(value: unknown): value is MagnetPosition {
  return value === 'TOP' || value === 'BOTTOM' || value === 'LEFT' || value === 'RIGHT';
}

// 중심 간격이 작은 쪽 변의 이 비율 안이면 방향이 확정되지 않은 것으로 본다.
const RELATIVE_DIRECTION_DEAD_ZONE_RATIO = 0.5;

// 다른 축이 이 배 이상이면 현재 magnet 축이 주축이 아니라고 본다.
const MAGNET_AXIS_DOMINANCE_RATIO = 1.2;

// 맞붙은 포트가 이 간격보다 가까우면 정방향 엘보가 아니라 바깥 우회가 된다.
const FACING_PORT_CLEARANCE = 10;

// 수동(manual) magnet용 완화 임계. 자동과 같은 잣대로 깨지면 수기 고정이 무의미해진다.
export const MANUAL_DEAD_ZONE_RATIO = 1.0;
export const MANUAL_MOVE_THRESHOLD = 120;
export const MANUAL_LENGTH_RATIO = 2.5;

// 수동 magnet 표시 및 앵커 pluginData 키
export const MANUAL_MAGNET_FLAG_KEY = 'is_manual_magnet';
export const MANUAL_BASE_DX_KEY = 'manual_base_dx';
export const MANUAL_BASE_DY_KEY = 'manual_base_dy';

function magnetLayoutAxis(magnet: MagnetPosition): 'x' | 'y' {
  return magnet === 'LEFT' || magnet === 'RIGHT' ? 'x' : 'y';
}

function magnetExpectedDeltaSign(
  magnet: MagnetPosition,
  role: 'source' | 'target'
): { axis: 'x' | 'y'; sign: 1 | -1 } {
  if (role === 'source') {
    if (magnet === 'RIGHT') return { axis: 'x', sign: 1 };
    if (magnet === 'LEFT') return { axis: 'x', sign: -1 };
    if (magnet === 'BOTTOM') return { axis: 'y', sign: 1 };
    return { axis: 'y', sign: -1 };
  }
  if (magnet === 'LEFT') return { axis: 'x', sign: 1 };
  if (magnet === 'RIGHT') return { axis: 'x', sign: -1 };
  if (magnet === 'TOP') return { axis: 'y', sign: 1 };
  return { axis: 'y', sign: -1 };
}

// 저장된 magnet이 기대한 상대 방향과 반대이고, 그 차이가 dead zone보다 크면 true.
export function isRelativeDirectionReversed(
  srcBox: Box,
  tgtBox: Box,
  sourceMagnet: MagnetPosition,
  targetMagnet: MagnetPosition
): boolean {
  const dx = (tgtBox.x + tgtBox.width / 2) - (srcBox.x + srcBox.width / 2);
  const dy = (tgtBox.y + tgtBox.height / 2) - (srcBox.y + srcBox.height / 2);
  const deadX = Math.min(srcBox.width, tgtBox.width) * RELATIVE_DIRECTION_DEAD_ZONE_RATIO;
  const deadY = Math.min(srcBox.height, tgtBox.height) * RELATIVE_DIRECTION_DEAD_ZONE_RATIO;
  const checks = [
    magnetExpectedDeltaSign(sourceMagnet, 'source'),
    magnetExpectedDeltaSign(targetMagnet, 'target'),
  ];
  for (const check of checks) {
    const delta = check.axis === 'x' ? dx : dy;
    const dead = check.axis === 'x' ? deadX : deadY;
    if (Math.abs(delta) <= dead) continue;
    if (Math.sign(delta) !== check.sign) return true;
  }
  return false;
}

function relativeCenterDelta(srcBox: Box, tgtBox: Box): { dx: number; dy: number } {
  return {
    dx: (tgtBox.x + tgtBox.width / 2) - (srcBox.x + srcBox.width / 2),
    dy: (tgtBox.y + tgtBox.height / 2) - (srcBox.y + srcBox.height / 2),
  };
}

// source 또는 target 중 하나라도 자기 축이 주축이 아니면 pair 전체를 다시 평가한다.
export function isRelativeAxisMismatched(
  srcBox: Box,
  tgtBox: Box,
  sourceMagnet: MagnetPosition,
  targetMagnet: MagnetPosition
): boolean {
  const { dx, dy } = relativeCenterDelta(srcBox, tgtBox);
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  for (const magnet of [sourceMagnet, targetMagnet]) {
    if (magnetLayoutAxis(magnet) === 'x') {
      if (ay >= ax * MAGNET_AXIS_DOMINANCE_RATIO) return true;
    } else if (ax >= ay * MAGNET_AXIS_DOMINANCE_RATIO) {
      return true;
    }
  }
  return false;
}

// 맞붙은 포트의 실제 좌표가 진행 방향과 반대면, 라우터는 노드 바깥을 크게 우회한다.
export function isFacingPortReversed(
  srcBox: Box,
  tgtBox: Box,
  sourceMagnet: MagnetPosition,
  targetMagnet: MagnetPosition
): boolean {
  const src = getMagnetPoint(srcBox, sourceMagnet);
  const tgt = getMagnetPoint(tgtBox, targetMagnet);
  if (sourceMagnet === 'RIGHT' && targetMagnet === 'LEFT') {
    return !(src.x + FACING_PORT_CLEARANCE < tgt.x);
  }
  if (sourceMagnet === 'LEFT' && targetMagnet === 'RIGHT') {
    return !(src.x > tgt.x + FACING_PORT_CLEARANCE);
  }
  if (sourceMagnet === 'BOTTOM' && targetMagnet === 'TOP') {
    return !(src.y + FACING_PORT_CLEARANCE < tgt.y);
  }
  if (sourceMagnet === 'TOP' && targetMagnet === 'BOTTOM') {
    return !(src.y > tgt.y + FACING_PORT_CLEARANCE);
  }
  return false;
}

// 현재 magnet으로 만든 경로가 연결 노드를 관통하지 않으면 유지할 수 있다.
// 포인트가 없거나 비정상 좌표이거나 doesPathCrossBoxes가 참이면 false.
export function canKeepMagnetPair(
  srcBox: Box,
  tgtBox: Box,
  sourceMagnet: MagnetPosition,
  targetMagnet: MagnetPosition,
  routingType: ConnectorRoutingType = 'ORTHOGONAL',
  startOffset: number = 0,
  endOffset: number = 0
): boolean {
  if (!isFixedMagnetPosition(sourceMagnet) || !isFixedMagnetPosition(targetMagnet)) return false;

  const boxes = [srcBox, tgtBox];
  for (const box of boxes) {
    if (![box.x, box.y, box.width, box.height].every((n) => Number.isFinite(n))) return false;
  }

  const points = calculateRoutingPoints(
    getMagnetPoint(srcBox, sourceMagnet),
    sourceMagnet,
    getMagnetPoint(tgtBox, targetMagnet),
    targetMagnet,
    srcBox,
    tgtBox,
    routingType,
    startOffset,
    endOffset
  );

  if (points.length < 2) return false;
  if (points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return false;
  return !doesPathCrossBoxes(points, srcBox, tgtBox);
}

export interface MagnetResolveInput {
  srcBox: Box;
  tgtBox: Box;
  sourceMagnet?: string;
  targetMagnet?: string;
  routingType?: ConnectorRoutingType;
  startOffset?: number;
  endOffset?: number;
  /** true면 저장된 magnet을 무시하고 최적 쌍을 고른다. 노드 드래그 갱신에서는 쓰지 않는다. */
  forceOptimal?: boolean;
  /** true면 수동(기즈모 지정) magnet으로 취급해 완화 임계로 유지한다. */
  isManual?: boolean;
  /** 수동 지정 시점의 중심 델타. 있으면 이동량으로 해제 여부를 판단한다. */
  manualBaseDx?: number;
  manualBaseDy?: number;
}

// 수동 magnet용 방향 반전 판정. dead zone을 넓혀 작은 이동에는 유지한다.
export function isManualDirectionReversed(
  srcBox: Box,
  tgtBox: Box,
  sourceMagnet: MagnetPosition,
  targetMagnet: MagnetPosition
): boolean {
  const dx = (tgtBox.x + tgtBox.width / 2) - (srcBox.x + srcBox.width / 2);
  const dy = (tgtBox.y + tgtBox.height / 2) - (srcBox.y + srcBox.height / 2);
  const deadX = Math.min(srcBox.width, tgtBox.width) * MANUAL_DEAD_ZONE_RATIO;
  const deadY = Math.min(srcBox.height, tgtBox.height) * MANUAL_DEAD_ZONE_RATIO;
  const checks = [
    magnetExpectedDeltaSign(sourceMagnet, 'source'),
    magnetExpectedDeltaSign(targetMagnet, 'target'),
  ];
  for (const check of checks) {
    const delta = check.axis === 'x' ? dx : dy;
    const dead = check.axis === 'x' ? deadX : deadY;
    if (Math.abs(delta) <= dead) continue;
    if (Math.sign(delta) !== check.sign) return true;
  }
  return false;
}

// 수동 지정 시점의 중심 델타 (앵커)
export function getManualBaseDelta(srcBox: Box, tgtBox: Box): { dx: number; dy: number } {
  return relativeCenterDelta(srcBox, tgtBox);
}

// 앵커 대비 현재 중심 델타 이동량 (px)
export function manualDisplacement(
  srcBox: Box,
  tgtBox: Box,
  baseDx: number,
  baseDy: number
): number {
  const cur = relativeCenterDelta(srcBox, tgtBox);
  return Math.hypot(cur.dx - baseDx, cur.dy - baseDy);
}

function pathLengthOf(points: Point[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
  }
  return length;
}

function keptPathLength(
  srcBox: Box,
  tgtBox: Box,
  sourceMagnet: MagnetPosition,
  targetMagnet: MagnetPosition,
  routingType: ConnectorRoutingType,
  startOffset: number,
  endOffset: number
): number {
  const points = calculateRoutingPoints(
    getMagnetPoint(srcBox, sourceMagnet),
    sourceMagnet,
    getMagnetPoint(tgtBox, targetMagnet),
    targetMagnet,
    srcBox,
    tgtBox,
    routingType,
    startOffset,
    endOffset
  );
  return pathLengthOf(points);
}

/**
 * 자동 magnet 유지 조건은 네 가지가 모두 참일 때다.
 * 수동 magnet(isManual)은 앵커 이동량이 임계를 넘거나 관통·방향 반전(완화)일 때만 해제한다.
 * forceOptimal일 때만 이 검사 없이 최적 쌍을 고른다.
 */
export function resolveMagnetPair(input: MagnetResolveInput): {
  sourceMagnet: MagnetPosition;
  targetMagnet: MagnetPosition;
  kept: boolean;
} {
  const routingType = input.routingType ?? 'ORTHOGONAL';
  const startOffset = input.startOffset ?? 0;
  const endOffset = input.endOffset ?? 0;
  const source = isFixedMagnetPosition(input.sourceMagnet) ? input.sourceMagnet : undefined;
  const target = isFixedMagnetPosition(input.targetMagnet) ? input.targetMagnet : undefined;

  if (!input.forceOptimal && source && target) {
    const pathOk = canKeepMagnetPair(input.srcBox, input.tgtBox, source, target, routingType, startOffset, endOffset);
    if (!pathOk) {
      const optimal = getOptimalMagnetPair(input.srcBox, input.tgtBox);
      return {
        sourceMagnet: optimal.sourceMagnet,
        targetMagnet: optimal.targetMagnet,
        kept: false,
      };
    }
    if (!input.isManual) {
      const directionReversed = isRelativeDirectionReversed(input.srcBox, input.tgtBox, source, target);
      const axisMismatched = isRelativeAxisMismatched(input.srcBox, input.tgtBox, source, target);
      const facingReversed = isFacingPortReversed(input.srcBox, input.tgtBox, source, target);
      if (!directionReversed && !axisMismatched && !facingReversed) {
        return { sourceMagnet: source, targetMagnet: target, kept: true };
      }
      const optimal = getOptimalMagnetPair(input.srcBox, input.tgtBox);
      return {
        sourceMagnet: optimal.sourceMagnet,
        targetMagnet: optimal.targetMagnet,
        kept: false,
      };
    }
    const hasBase =
      typeof input.manualBaseDx === 'number' &&
      Number.isFinite(input.manualBaseDx) &&
      typeof input.manualBaseDy === 'number' &&
      Number.isFinite(input.manualBaseDy);
    if (hasBase) {
      const moved = manualDisplacement(
        input.srcBox,
        input.tgtBox,
        input.manualBaseDx as number,
        input.manualBaseDy as number
      );
      if (moved > MANUAL_MOVE_THRESHOLD) {
        const optimal = getOptimalMagnetPair(input.srcBox, input.tgtBox);
        return {
          sourceMagnet: optimal.sourceMagnet,
          targetMagnet: optimal.targetMagnet,
          kept: false,
        };
      }
      if (isManualDirectionReversed(input.srcBox, input.tgtBox, source, target)) {
        const optimal = getOptimalMagnetPair(input.srcBox, input.tgtBox);
        return {
          sourceMagnet: optimal.sourceMagnet,
          targetMagnet: optimal.targetMagnet,
          kept: false,
        };
      }
      return { sourceMagnet: source, targetMagnet: target, kept: true };
    }
    if (isManualDirectionReversed(input.srcBox, input.tgtBox, source, target)) {
      const optimal = getOptimalMagnetPair(input.srcBox, input.tgtBox);
      return {
        sourceMagnet: optimal.sourceMagnet,
        targetMagnet: optimal.targetMagnet,
        kept: false,
      };
    }
    const optimal = getOptimalMagnetPair(input.srcBox, input.tgtBox);
    const keptLen = keptPathLength(input.srcBox, input.tgtBox, source, target, routingType, startOffset, endOffset);
    const optimalPoints = calculateRoutingPoints(
      getMagnetPoint(input.srcBox, optimal.sourceMagnet),
      optimal.sourceMagnet,
      getMagnetPoint(input.tgtBox, optimal.targetMagnet),
      optimal.targetMagnet,
      input.srcBox,
      input.tgtBox,
      routingType,
      startOffset,
      endOffset
    );
    const optimalLen = pathLengthOf(optimalPoints);
    if (keptLen > optimalLen * MANUAL_LENGTH_RATIO) {
      return {
        sourceMagnet: optimal.sourceMagnet,
        targetMagnet: optimal.targetMagnet,
        kept: false,
      };
    }
    return { sourceMagnet: source, targetMagnet: target, kept: true };
  }

  const optimal = getOptimalMagnetPair(input.srcBox, input.tgtBox);
  return {
    sourceMagnet: input.forceOptimal || !source ? optimal.sourceMagnet : source,
    targetMagnet: input.forceOptimal || !target ? optimal.targetMagnet : target,
    kept: false,
  };
}

function readNativeMagnet(endpoint: ConnectorEndpoint, pluginValue: string): string {
  if ('magnet' in endpoint && isFixedMagnetPosition(endpoint.magnet)) return endpoint.magnet;
  return pluginValue;
}

// 네이티브 ConnectorNode: 현재 magnet이 유효하면 엔드포인트를 다시 쓰지 않는다.
export function optimizeNativeConnector(conn: ConnectorNode) {
  try {
    const start = conn.connectorStart;
    const end = conn.connectorEnd;
    if (!('endpointNodeId' in start) || !('endpointNodeId' in end)) return;
    if (!start.endpointNodeId || !end.endpointNodeId) return;

    const sourceNode = figma.getNodeById(start.endpointNodeId) as SceneNode | null;
    const targetNode = figma.getNodeById(end.endpointNodeId) as SceneNode | null;
    if (!sourceNode || !targetNode) return;

    const srcBox = sceneNodePageBox(sourceNode);
    const tgtBox = sceneNodePageBox(targetNode);

    const routingType: ConnectorRoutingType = conn.connectorLineType === 'STRAIGHT' ? 'STRAIGHT' : 'ORTHOGONAL';
    const wasManual = safeGetPluginData(conn, MANUAL_MAGNET_FLAG_KEY) === 'true';
    const baseDxRaw = safeGetPluginData(conn, MANUAL_BASE_DX_KEY);
    const baseDyRaw = safeGetPluginData(conn, MANUAL_BASE_DY_KEY);
    const baseDx = baseDxRaw === '' ? NaN : parseFloat(baseDxRaw);
    const baseDy = baseDyRaw === '' ? NaN : parseFloat(baseDyRaw);
    const resolved = resolveMagnetPair({
      srcBox,
      tgtBox,
      sourceMagnet: readNativeMagnet(start, safeGetPluginData(conn, 'source_magnet')),
      targetMagnet: readNativeMagnet(end, safeGetPluginData(conn, 'target_magnet')),
      routingType,
      isManual: wasManual,
      manualBaseDx: baseDx,
      manualBaseDy: baseDy,
    });

    if (resolved.kept) return;

    if (wasManual) {
      try {
        conn.setPluginData(MANUAL_MAGNET_FLAG_KEY, '');
        conn.setPluginData(MANUAL_BASE_DX_KEY, '');
        conn.setPluginData(MANUAL_BASE_DY_KEY, '');
      } catch (_) {}
    }

    const startMagnet = 'magnet' in start ? start.magnet : undefined;
    const endMagnet = 'magnet' in end ? end.magnet : undefined;
    if (startMagnet !== resolved.sourceMagnet) {
      conn.connectorStart = {
        endpointNodeId: start.endpointNodeId,
        magnet: resolved.sourceMagnet,
      };
      conn.setPluginData('source_magnet', resolved.sourceMagnet);
    }
    if (endMagnet !== resolved.targetMagnet) {
      conn.connectorEnd = {
        endpointNodeId: end.endpointNodeId,
        magnet: resolved.targetMagnet,
      };
      conn.setPluginData('target_magnet', resolved.targetMagnet);
    }
  } catch (err) {
    console.error('네이티브 커넥터 최적화 실패:', err);
  }
}

// 드래그 틱 중복 재빌드 방지용 스냅샷. 직전 적용 입력과 동일하면 재생성을 건너뛴다.
// Apply(명시 magnet/오프셋/forceOptimal) 경로는 항상 재빌드한다.
const appliedConnectorSnapshots = new Map<string, string>();

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function connectorApplyKey(parts: Array<string | number>): string {
  return parts.map((p) => String(p)).join('|');
}

// 라벨 중심이 목표점에서 0.5px 이내면 이동 생략. 매 틱 place는 씬 변경·리페인트를 유발한다.
function labelNeedsMove(labelFrame: FrameNode, target: Point): boolean {
  try {
    const b = labelFrame.absoluteBoundingBox;
    if (!b) return true;
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    return Math.abs(cx - target.x) > 0.5 || Math.abs(cy - target.y) > 0.5;
  } catch (_) {
    return true;
  }
}

// 단일 커넥터의 직각 패스 및 라벨 좌표 실시간 재계산 (최단거리 자동 스냅 및 수동 마그넷 포트 지원)
export async function updateOrthogonalVectorConnector(
  connectorNode: SceneNode,
  explicitSourceMagnet?: MagnetPosition,
  explicitTargetMagnet?: MagnetPosition,
  forceOptimal: boolean = false,
  explicitStartOffset?: number,
  explicitEndOffset?: number
) {
  // 만약 선택된 노드가 커넥터 그룹 내부의 VectorNode라면, 최상위 그룹 노드로 승격하여 전체 구조 동기화
  let rootNode = connectorNode;
  if (
    connectorNode.parent &&
    connectorNode.parent.type === 'GROUP' &&
    safeGetPluginData(connectorNode.parent, 'is_custom_connector') === 'true'
  ) {
    rootNode = connectorNode.parent;
  }

  const srcId = safeGetPluginData(rootNode, 'source_node_id') || safeGetPluginData(connectorNode, 'source_node_id');
  const tgtId = safeGetPluginData(rootNode, 'target_node_id') || safeGetPluginData(connectorNode, 'target_node_id');

  if (!srcId || !tgtId) return;

  const sourceNode = figma.getNodeById(srcId) as SceneNode | null;
  const targetNode = figma.getNodeById(tgtId) as SceneNode | null;

  // 연결된 노드가 삭제되었거나 없으면 스킵
  if (!sourceNode || !targetNode) return;

  // VectorNode 및 라벨 탐색
  let vector: VectorNode | null = null;
  let termVector: VectorNode | null = null;
  let labelFrame: FrameNode | null = null;

  if (rootNode.type === 'GROUP') {
    const group = rootNode as GroupNode;
    const isTerm = (c: SceneNode) =>
      c.type === 'VECTOR' &&
      (safeGetPluginData(c, 'connector_role') === 'terminal' || c.name === 'ConnectorTerminals');
    vector = (group.children.find((c) => c.type === 'VECTOR' && !isTerm(c)) as VectorNode) ||
             (group.children.find((c) => c.type === 'VECTOR') as VectorNode) || null;
    termVector = (group.children.find(isTerm) as VectorNode) || null;
    labelFrame =
      (group.children.find(
        (c) => safeGetPluginData(c, 'is_connector_label') === 'true' || c.name === 'ConnectorLabel'
      ) as FrameNode) || null;
  } else if (rootNode.type === 'VECTOR') {
    vector = rootNode as VectorNode;
  }

  if (!vector) return;

  const srcBox = sceneNodePageBox(sourceNode);
  const tgtBox = sceneNodePageBox(targetNode);

  // 라우팅·오프셋을 먼저 읽는다. 드래그 시 magnet 유지 여부는 이 경로의 관통 여부로 판단한다.
  const routingType: ConnectorRoutingType =
    (safeGetPluginData(rootNode, 'connector_routing') as ConnectorRoutingType) ||
    (safeGetPluginData(vector, 'connector_routing') as ConnectorRoutingType) ||
    'ORTHOGONAL';

  const startOffset = typeof explicitStartOffset === 'number'
    ? explicitStartOffset
    : (parseFloat(
        safeGetPluginData(rootNode, 'start_offset') ||
        safeGetPluginData(vector, 'start_offset') ||
        '0'
      ) || 0);

  const endOffset = typeof explicitEndOffset === 'number'
    ? explicitEndOffset
    : (parseFloat(
        safeGetPluginData(rootNode, 'end_offset') ||
        safeGetPluginData(vector, 'end_offset') ||
        '0'
      ) || 0);

  // 저장된 magnet으로 관통 없는 경로가 나오면 유지한다.
  // forceOptimal은 명시적 재최적화 호출용이며, 노드 드래그는 이 값을 넘기지 않는다.
  // 수동 고정이면 앵커 대비 이동량이 임계를 넘을 때만 최적 쌍으로 해제한다.
  const hasExplicitMagnets =
    (explicitSourceMagnet && isFixedMagnetPosition(explicitSourceMagnet)) ||
    (explicitTargetMagnet && isFixedMagnetPosition(explicitTargetMagnet));
  const storedWasManual =
    safeGetPluginData(rootNode, MANUAL_MAGNET_FLAG_KEY) === 'true' ||
    safeGetPluginData(vector, MANUAL_MAGNET_FLAG_KEY) === 'true';
  const storedBaseDxRaw =
    safeGetPluginData(rootNode, MANUAL_BASE_DX_KEY) || safeGetPluginData(vector, MANUAL_BASE_DX_KEY);
  const storedBaseDyRaw =
    safeGetPluginData(rootNode, MANUAL_BASE_DY_KEY) || safeGetPluginData(vector, MANUAL_BASE_DY_KEY);
  const storedBaseDx = storedBaseDxRaw === '' ? NaN : parseFloat(storedBaseDxRaw);
  const storedBaseDy = storedBaseDyRaw === '' ? NaN : parseFloat(storedBaseDyRaw);
  const resolvedMagnets = resolveMagnetPair({
    srcBox,
    tgtBox,
    sourceMagnet: explicitSourceMagnet || safeGetPluginData(rootNode, 'source_magnet'),
    targetMagnet: explicitTargetMagnet || safeGetPluginData(rootNode, 'target_magnet'),
    routingType,
    startOffset,
    endOffset,
    forceOptimal,
    isManual: storedWasManual || Boolean(hasExplicitMagnets),
    manualBaseDx: storedBaseDx,
    manualBaseDy: storedBaseDy,
  });
  const sourceMagnet = resolvedMagnets.sourceMagnet;
  const targetMagnet = resolvedMagnets.targetMagnet;

  // 최신 마그넷 정보 동기화 저장
  rootNode.setPluginData('source_magnet', sourceMagnet);
  rootNode.setPluginData('target_magnet', targetMagnet);
  if (vector !== rootNode) {
    vector.setPluginData('source_magnet', sourceMagnet);
    vector.setPluginData('target_magnet', targetMagnet);
  }

  // 기즈모 Apply(명시 magnet)면 수동 고정 + 앵커를 현재 배치로 갱신한다.
  // 드래그로 수동 고정이 해제되면 앵커를 지워 이후에는 자동 최적을 따른다.
  const baseDelta = getManualBaseDelta(srcBox, tgtBox);
  if (hasExplicitMagnets) {
    rootNode.setPluginData(MANUAL_MAGNET_FLAG_KEY, 'true');
    rootNode.setPluginData(MANUAL_BASE_DX_KEY, String(baseDelta.dx));
    rootNode.setPluginData(MANUAL_BASE_DY_KEY, String(baseDelta.dy));
    if (vector !== rootNode) {
      vector.setPluginData(MANUAL_MAGNET_FLAG_KEY, 'true');
      vector.setPluginData(MANUAL_BASE_DX_KEY, String(baseDelta.dx));
      vector.setPluginData(MANUAL_BASE_DY_KEY, String(baseDelta.dy));
    }
  } else if (storedWasManual) {
    if (!resolvedMagnets.kept) {
      try {
        rootNode.setPluginData(MANUAL_MAGNET_FLAG_KEY, '');
        rootNode.setPluginData(MANUAL_BASE_DX_KEY, '');
        rootNode.setPluginData(MANUAL_BASE_DY_KEY, '');
      } catch (_) {}
      if (vector !== rootNode) {
        try {
          vector.setPluginData(MANUAL_MAGNET_FLAG_KEY, '');
          vector.setPluginData(MANUAL_BASE_DX_KEY, '');
          vector.setPluginData(MANUAL_BASE_DY_KEY, '');
        } catch (_) {}
      }
    } else if (Number.isNaN(storedBaseDx) || Number.isNaN(storedBaseDy)) {
      rootNode.setPluginData(MANUAL_BASE_DX_KEY, String(baseDelta.dx));
      rootNode.setPluginData(MANUAL_BASE_DY_KEY, String(baseDelta.dy));
      if (vector !== rootNode) {
        vector.setPluginData(MANUAL_BASE_DX_KEY, String(baseDelta.dx));
        vector.setPluginData(MANUAL_BASE_DY_KEY, String(baseDelta.dy));
      }
    }
  }

  const pStart = getMagnetPoint(srcBox, sourceMagnet);
  const pEnd = getMagnetPoint(tgtBox, targetMagnet);

  // 최신 오프셋 동기화 저장
  rootNode.setPluginData('start_offset', String(startOffset));
  rootNode.setPluginData('end_offset', String(endOffset));
  if (vector !== rootNode) {
    vector.setPluginData('start_offset', String(startOffset));
    vector.setPluginData('end_offset', String(endOffset));
  }

  // 라우팅 타입별 경로 재계산 (시작/끝 오프셋 반영)
  const worldPoints = calculateRoutingPoints(
    pStart,
    sourceMagnet,
    pEnd,
    targetMagnet,
    srcBox,
    tgtBox,
    routingType,
    startOffset,
    endOffset
  );

  const allX = worldPoints.map((p) => p.x);
  const allY = worldPoints.map((p) => p.y);

  const startTerminal =
    (safeGetPluginData(rootNode, 'start_terminal') as ConnectorTerminalType) ||
    (safeGetPluginData(vector, 'start_terminal') as ConnectorTerminalType) ||
    'NONE';
  const endTerminal =
    (safeGetPluginData(rootNode, 'end_terminal') as ConnectorTerminalType) ||
    (safeGetPluginData(vector, 'end_terminal') as ConnectorTerminalType) ||
    'ARROW';

  const strokeWeight = (typeof vector.strokeWeight === 'number' ? vector.strokeWeight : 1.5);
  let strokeColor: RGB = { r: 0.18, g: 0.18, b: 0.22 };
  if (Array.isArray(vector.strokes) && vector.strokes.length > 0 && vector.strokes[0].type === 'SOLID') {
    strokeColor = vector.strokes[0].color;
  }

  // 순수 드래그 갱신인데 직전 적용과 입력이 동일하면 resize·네트워크 재적용을 건너뛴다.
  const isDragRefresh =
    !forceOptimal &&
    !hasExplicitMagnets &&
    typeof explicitStartOffset !== 'number' &&
    typeof explicitEndOffset !== 'number';
  let dragCacheKey: string | null = null;
  if (isDragRefresh) {
    dragCacheKey = connectorApplyKey([
      round1(srcBox.x), round1(srcBox.y), round1(srcBox.width), round1(srcBox.height),
      round1(tgtBox.x), round1(tgtBox.y), round1(tgtBox.width), round1(tgtBox.height),
      routingType, startOffset, endOffset,
      sourceMagnet, targetMagnet, startTerminal, endTerminal,
    ]);
    if (appliedConnectorSnapshots.get(rootNode.id) === dragCacheKey) return;
  }

  const minX = Math.min(...allX);
  const minY = Math.min(...allY);
  const maxX = Math.max(...allX);
  const maxY = Math.max(...allY);

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  const localPoints = worldPoints.map((p) => ({
    x: p.x - minX,
    y: p.y - minY,
  }));

  if (Math.abs(vector.width - width) > 0.5 || Math.abs(vector.height - height) > 0.5) {
    vector.resize(width, height);
  }
  try {
    const absX = vector.absoluteTransform[0][2];
    const absY = vector.absoluteTransform[1][2];
    if (Math.abs(absX - minX) > 0.5 || Math.abs(absY - minY) > 0.5) {
      setNodeAbsoluteXY(vector, minX, minY);
    }
  } catch (_) {
    setNodeAbsoluteXY(vector, minX, minY);
  }
  vector.setPluginData('connector_role', 'line');

  // 과거 생성된 별도 단자 벡터(ConnectorTerminals)가 남아있다면 네이티브 Cap 통합에 따라 제거
  if (termVector) {
    try {
      termVector.remove();
    } catch (_) {}
    termVector = null;
  }

  // Circle, Diamond, Arrow 단자는 피그마 네이티브 StrokeCap으로 단일 VectorNode에 렌더링
  const { vertices, segments, regions } = buildVectorNetwork(
    localPoints,
    routingType,
    startTerminal,
    endTerminal,
    strokeWeight,
    strokeColor
  );

  await vector.setVectorNetworkAsync({ vertices, segments, regions });
  vector.fills = [];
  vector.strokeJoin = routingType === 'S_CURVE' || routingType === 'CURVED' ? 'ROUND' : 'MITER';
  if (routingType === 'STRAIGHT') {
    vector.strokeCap = 'ROUND';
  }

  // 기존 그룹 내에 남아있던 레거시 사각형 단자 마커가 있다면 깔끔하게 제거
  if (rootNode.type === 'GROUP') {
    const group = rootNode as GroupNode;
    try {
      const legacyMarkers = group.findAll((n) => {
        try {
          if (!n) return false;
          return (
            n.name === 'ConnectorStartTerminal' ||
            n.name === 'ConnectorEndTerminal' ||
            safeGetPluginData(n, 'is_terminal_marker') !== ''
          );
        } catch (_) {
          return false;
        }
      });
      for (const m of legacyMarkers) {
        m.remove();
      }
    } catch (_) {}
  }

  if (rootNode.parent) {
    // 커넥터가 노드 뒤에 깔리지 않도록 상위 레이어에 유지한다.
    // 이미 최상위면 생략한다. 매 틱 reorder는 씬 변경 이벤트·리페인트를 유발해 드래그 티어링을 키운다.
    const siblings = 'children' in rootNode.parent ? rootNode.parent.children : [];
    if (siblings.length === 0 || siblings[siblings.length - 1].id !== rootNode.id) {
      rootNode.parent.appendChild(rootNode);
    }
  }

  // 라벨 위치 및 스타일 갱신
  if (labelFrame) {
    const textNode = labelFrame.findOne((n) => n.type === 'TEXT') as TextNode | null;
    const labelText = safeGetPluginData(rootNode, 'connector_label') ||
                      safeGetPluginData(vector, 'connector_label') || '';
    const { point: midSegmentPoint, isVertical } = getLabelPlacement(
      worldPoints,
      routingType,
      readPrevLabelVertical(labelFrame),
      getLabelSizeHint(labelFrame, labelText)
    );
    const labelOn = safeGetPluginData(rootNode, 'connector_label_on') === 'true' ||
                    safeGetPluginData(vector, 'connector_label_on') === 'true' ||
                    Boolean(labelText);
    // 드래그 경로에서는 라벨 입력이 바뀔 수 없으므로 방향·텍스트가 같으면 고비용 restyle 생략.
    // Apply 경로는 항상 restyle한다.
    const prevVertical = readPrevLabelVertical(labelFrame);
    if (labelOn && textNode && (!isDragRefresh || prevVertical !== isVertical || textNode.characters !== labelText)) {
      const boxStyle = (safeGetPluginData(rootNode, 'connector_label_box_style') ||
                        safeGetPluginData(vector, 'connector_label_box_style') || 'BOX') as ConnectorLabelBoxStyle;
      const align = (safeGetPluginData(rootNode, 'connector_label_align') ||
                     safeGetPluginData(vector, 'connector_label_align') || 'CENTER') as ConnectorLabelAlign;
      const lineHex = rgbToHex(strokeColor);
      const fillCol = safeGetPluginData(rootNode, 'connector_label_fill_color') ||
                      safeGetPluginData(vector, 'connector_label_fill_color') || '#FFFFFF';
      const strokeCol = safeGetPluginData(rootNode, 'connector_label_stroke_color') ||
                        safeGetPluginData(vector, 'connector_label_stroke_color') || lineHex;

      await applyConnectorLabelStyle(labelFrame, textNode, {
        labelText,
        boxStyle,
        textAlign: align,
        fillColor: fillCol,
        strokeColor: strokeCol,
        isVertical,
        connectorStrokeWeight: strokeWeight,
      });
    }

    if (labelNeedsMove(labelFrame, midSegmentPoint)) {
      placeNodeAtWorldCenter(labelFrame, midSegmentPoint);
    }
  }

  if (dragCacheKey !== null) {
    appliedConnectorSnapshots.set(rootNode.id, dragCacheKey);
    if (appliedConnectorSnapshots.size > 500) {
      const oldest = appliedConnectorSnapshots.keys().next();
      if (!oldest.done && oldest.value) appliedConnectorSnapshots.delete(oldest.value);
    }
  }
}

// 커넥터 플러그인 메타데이터 일괄 복사 헬퍼
export function copyConnectorData(source: SceneNode, target: SceneNode) {
  const keys = [
    'is_flow_connector',
    'is_custom_connector',
    'source_node_id',
    'target_node_id',
    'source_magnet',
    'target_magnet',
    'connector_routing',
    'connector_label',
    'connector_label_on',
    'connector_label_box_style',
    'connector_label_align',
    'connector_label_fill_color',
    'connector_label_stroke_color',
    'start_terminal',
    'end_terminal',
    'connector_pattern',
    'connector_weight',
    'connector_color',
    'start_offset',
    'end_offset',
    'is_manual_magnet',
    'manual_base_dx',
    'manual_base_dy',
  ];
  for (const k of keys) {
    const v = safeGetPluginData(source, k);
    if (v && typeof target.setPluginData === 'function') {
      try {
        target.setPluginData(k, v);
      } catch (_) {}
    }
  }
}

// 특정 노드들이 드래그 이동되었을 때 연결된 커넥터 일괄 갱신.
// 자동은 관통·방향 반전·주축 불일치·포트 겹침 시 최적 쌍으로 떨어진다.
// 수동은 앵커 대비 이동량이 임계를 넘거나 관통·방향 반전(완화)일 때만 해제된다.
async function syncMovedNodeBatch(nodeIds: Set<string>) {
  try {
    const connIdsToUpdate = new Set<string>();

    for (const nid of nodeIds) {
      // 1. 직접 매핑된 커넥터 ID 탐색
      const conns = nodeToConnectorsMap.get(nid);
      if (conns) {
        for (const cid of conns) {
          connIdsToUpdate.add(cid);
        }
      }

      // 2. 이동한 노드가 부모 컨테이너(Section, Group, Frame 등)인 경우 자식들에 연결된 커넥터도 탐색
      const containerNode = figma.getNodeById(nid);
      if (containerNode && 'findAll' in containerNode) {
        for (const [mappedNodeId, mappedConnIds] of nodeToConnectorsMap.entries()) {
          const childNode = figma.getNodeById(mappedNodeId);
          if (childNode) {
            let cur: BaseNode | null = childNode.parent;
            while (cur && cur.type !== 'PAGE') {
              if (cur.id === nid) {
                for (const cid of mappedConnIds) {
                  connIdsToUpdate.add(cid);
                }
                break;
              }
              cur = cur.parent;
            }
          }
        }
      }
    }

    // 3. 만약 connIdsToUpdate가 비어있다면 레지스트리가 누락되었을 수 있으므로 캔버스 내 커넥터 재스캔 후 매칭
    if (connIdsToUpdate.size === 0) {
      refreshConnectorRegistry();
      for (const nid of nodeIds) {
        const conns = nodeToConnectorsMap.get(nid);
        if (conns) {
          for (const cid of conns) {
            connIdsToUpdate.add(cid);
          }
        }
      }
    }

    for (const connId of connIdsToUpdate) {
      const connNode = figma.getNodeById(connId) as SceneNode | null;
      if (!connNode) continue;

      if (connNode.type === 'CONNECTOR') {
        optimizeNativeConnector(connNode as ConnectorNode);
      } else {
        await updateOrthogonalVectorConnector(connNode);
      }
    }
  } catch (err) {
    console.error('커넥터 위치 동기화 실패:', err);
  }
}

// 갱신 중 들어온 이동은 병렬로 돌리지 않고, 현재 배치가 끝난 뒤 한 번에 다시 읽는다.
// 각 배치는 저장된 좌표가 아니라 그때의 노드 x/y를 읽으므로 마지막 배치가 최신 위치다.
export async function syncConnectorsForMovedNodes(nodeIds: Set<string>) {
  if (nodeIds.size === 0) return;
  if (!enqueueConnectorDrag(connectorDragGate, nodeIds)) return;

  try {
    let batch: Set<string> | null = nodeIds;
    while (batch && batch.size > 0) {
      await syncMovedNodeBatch(batch);
      batch = takePendingConnectorDrag(connectorDragGate);
    }
  } finally {
    finishConnectorDrag(connectorDragGate);
  }
}
