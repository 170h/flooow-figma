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

// 커넥터 라벨 스타일 적용 헬퍼 (글자크기 9px 고정, 트래킹 없음, 박스/캡슐/라운드박스/라인 스타일 적용)
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
  }
): Promise<void> {
  const {
    labelText,
    boxStyle = 'BOX',
    textAlign = 'CENTER',
    fillColor = '#EA2039',
    strokeColor = '#EA2039',
    isVertical = false,
  } = options;

  // 1. 폰트 로드 (기본 Regular 및 Medium 안전 로드 후 fontName 명시적 지정)
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    textNode.fontName = { family: 'Inter', style: 'Medium' };
  } catch {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    textNode.fontName = { family: 'Inter', style: 'Regular' };
  }

  // 2. 텍스트 설정: 9px 고정, 수평 정렬, tracking(letter-spacing) 절대 부여 금지 (규칙 준수)
  textNode.characters = labelText;
  textNode.fontSize = 9;
  textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
  textNode.textAlignHorizontal = textAlign;
  const textFill = getContrastTextColor(fillColor);
  textNode.fills = [{ type: 'SOLID', color: textFill }];

  // 3. 라벨 프레임 오토레이아웃 및 패딩
  labelFrame.layoutMode = 'HORIZONTAL';
  labelFrame.primaryAxisSizingMode = 'AUTO';
  labelFrame.counterAxisSizingMode = 'AUTO';
  labelFrame.counterAxisAlignItems = 'CENTER';
  labelFrame.primaryAxisAlignItems = textAlign === 'LEFT' ? 'MIN' : textAlign === 'RIGHT' ? 'MAX' : 'CENTER';

  labelFrame.paddingTop = 2;
  labelFrame.paddingBottom = 2;
  labelFrame.paddingLeft = boxStyle === 'CAPSULE' ? 8 : 6;
  labelFrame.paddingRight = boxStyle === 'CAPSULE' ? 8 : 6;

  // 4. 배경 채움 (fills)
  const fillRgb = parseHexColor(fillColor);
  labelFrame.fills = [{ type: 'SOLID', color: fillRgb }];

  // 5. 보더(strokes) 및 코너 라운드
  const strokeRgb = parseHexColor(strokeColor);
  labelFrame.strokes = [{ type: 'SOLID', color: strokeRgb }];

  switch (boxStyle) {
    case 'BOX':
      labelFrame.cornerRadius = 0;
      labelFrame.strokeWeight = 1;
      break;

    case 'CAPSULE':
      labelFrame.cornerRadius = 999;
      labelFrame.strokeWeight = 1;
      break;

    case 'ROUNDED_BOX':
      labelFrame.cornerRadius = 4;
      labelFrame.strokeWeight = 1;
      break;

    case 'LINE':
      labelFrame.cornerRadius = 0;
      if (isVertical) {
        if ('strokeTopWeight' in labelFrame) {
          labelFrame.strokeTopWeight = 1;
          labelFrame.strokeBottomWeight = 1;
          labelFrame.strokeLeftWeight = 0;
          labelFrame.strokeRightWeight = 0;
        } else {
          (labelFrame as any).strokeWeight = 1;
        }
      } else {
        if ('strokeLeftWeight' in labelFrame) {
          labelFrame.strokeLeftWeight = 1;
          labelFrame.strokeRightWeight = 1;
          labelFrame.strokeTopWeight = 0;
          labelFrame.strokeBottomWeight = 0;
        } else {
          (labelFrame as any).strokeWeight = 1;
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
    case 'TRIANGLE_ARROW':
    case 'REVERSED_TRIANGLE_ARROW':
      return 'ARROW_LINES';
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

// 라우팅 타입별 라벨 중심점 및 세그먼트 방향 산출 헬퍼
export function getLabelPlacement(
  worldPoints: Point[],
  routingType: ConnectorRoutingType = 'ORTHOGONAL'
): { point: Point; isVertical: boolean } {
  if (worldPoints.length <= 2) {
    const p1 = worldPoints[0] || { x: 0, y: 0 };
    const p2 = worldPoints[worldPoints.length - 1] || p1;
    const isVertical = Math.abs(p2.y - p1.y) > Math.abs(p2.x - p1.x);
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
    const isVertical = Math.abs(pNext.y - pPrev.y) > Math.abs(pNext.x - pPrev.x);
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
      const t = (half - walked) / segLen;
      return {
        point: {
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        },
        isVertical: Math.abs(p2.y - p1.y) > Math.abs(p2.x - p1.x),
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
  const srcBox: Box = {
    x: sourceNode.x,
    y: sourceNode.y,
    width: sourceNode.width,
    height: sourceNode.height,
  };
  const tgtBox: Box = {
    x: targetNode.x,
    y: targetNode.y,
    width: targetNode.width,
    height: targetNode.height,
  };

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
  vector.x = minX;
  vector.y = minY;
  vector.resize(width, height);

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
    const fillCol = options.labelFillColor || '#EA2039';
    const strokeCol = options.labelStrokeColor || '#EA2039';

    vector.setPluginData('connector_label_on', 'true');
    vector.setPluginData('connector_label', labelText);
    vector.setPluginData('connector_label_box_style', boxStyle);
    vector.setPluginData('connector_label_align', align);
    vector.setPluginData('connector_label_fill_color', fillCol);
    vector.setPluginData('connector_label_stroke_color', strokeCol);

    // 라우팅 타입별 라벨 중심점 및 세그먼트 방향 산출
    const { point: midSegmentPoint, isVertical } = getLabelPlacement(worldPoints, routingType);

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
let isUpdatingConnectors = false;

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

// 캔버스 내 고스트 마커(기존 버그로 인해 잔상처럼 남겨진 사각형 노드들) 일괄 자동 청소
export function cleanupGhostTerminalMarkers(): number {
  let count = 0;
  try {
    const ghosts = figma.currentPage.findAll((n) => {
      try {
        if (!n || n.type !== 'RECTANGLE') return false;
        const name = n.name;
        if (name === 'ConnectorStartTerminal' || name === 'ConnectorEndTerminal') return true;
        const isTerm = safeGetPluginData(n, 'is_terminal_marker');
        if (isTerm === 'start' || isTerm === 'end') return true;
        return false;
      } catch (_) {
        return false;
      }
    });
    for (const g of ghosts) {
      g.remove();
      count++;
    }
    if (count > 0) {
      console.log(`[Flow] 잔상 고스트 마커 ${count}개를 깨끗하게 청소했습니다.`);
    }
  } catch (err) {
    console.error('고스트 마커 정리 중 에러:', err);
  }
  return count;
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

// 피그마 네이티브 ConnectorNode의 최적 마그넷 자동 최적화
export function optimizeNativeConnector(conn: ConnectorNode) {
  try {
    const start = conn.connectorStart;
    const end = conn.connectorEnd;
    if (!('endpointNodeId' in start) || !('endpointNodeId' in end)) return;
    if (!start.endpointNodeId || !end.endpointNodeId) return;

    const sourceNode = figma.getNodeById(start.endpointNodeId) as SceneNode | null;
    const targetNode = figma.getNodeById(end.endpointNodeId) as SceneNode | null;
    if (!sourceNode || !targetNode) return;

    const srcBox: Box = {
      x: sourceNode.x,
      y: sourceNode.y,
      width: sourceNode.width,
      height: sourceNode.height,
    };
    const tgtBox: Box = {
      x: targetNode.x,
      y: targetNode.y,
      width: targetNode.width,
      height: targetNode.height,
    };

    const optimal = getOptimalMagnetPair(srcBox, tgtBox);
    conn.connectorStart = {
      endpointNodeId: start.endpointNodeId,
      magnet: optimal.sourceMagnet,
    };
    conn.connectorEnd = {
      endpointNodeId: end.endpointNodeId,
      magnet: optimal.targetMagnet,
    };
  } catch (err) {
    console.error('네이티브 커넥터 최적화 실패:', err);
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

  const srcBox: Box = {
    x: sourceNode.x,
    y: sourceNode.y,
    width: sourceNode.width,
    height: sourceNode.height,
  };
  const tgtBox: Box = {
    x: targetNode.x,
    y: targetNode.y,
    width: targetNode.width,
    height: targetNode.height,
  };

  // 수동 지정 마그넷이 있으면 우선 사용
  // explicit 인자가 없으면 기존 저장된 플러그인데이터 마그넷을 유지하고,
  // forceOptimal이거나 마그넷 정보가 아예 없는 경우에만 노드 상대 위치 기반 최적 마그넷 자동 판별
  let sourceMagnet = explicitSourceMagnet || (safeGetPluginData(rootNode, 'source_magnet') as MagnetPosition) || undefined;
  let targetMagnet = explicitTargetMagnet || (safeGetPluginData(rootNode, 'target_magnet') as MagnetPosition) || undefined;

  if (!sourceMagnet || !targetMagnet || forceOptimal) {
    const optimal = getOptimalMagnetPair(srcBox, tgtBox);
    if (!sourceMagnet || forceOptimal) sourceMagnet = optimal.sourceMagnet;
    if (!targetMagnet || forceOptimal) targetMagnet = optimal.targetMagnet;
  }

  // 최신 마그넷 정보 동기화 저장
  rootNode.setPluginData('source_magnet', sourceMagnet);
  rootNode.setPluginData('target_magnet', targetMagnet);
  if (vector !== rootNode) {
    vector.setPluginData('source_magnet', sourceMagnet);
    vector.setPluginData('target_magnet', targetMagnet);
  }

  // 라우팅 타입 조회 (직각, 라운드니스 S_CURVE, 자유곡선 CURVED, 직선 STRAIGHT)
  const routingType: ConnectorRoutingType =
    (safeGetPluginData(rootNode, 'connector_routing') as ConnectorRoutingType) ||
    (safeGetPluginData(vector, 'connector_routing') as ConnectorRoutingType) ||
    'ORTHOGONAL';

  const pStart = getMagnetPoint(srcBox, sourceMagnet);
  const pEnd = getMagnetPoint(tgtBox, targetMagnet);

  // 명시적으로 인자로 넘어온 오프셋이 있다면 우선 적용, 없다면 저장된 플러그인 데이터 활용
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

  vector.resize(width, height);
  setNodeAbsoluteXY(vector, minX, minY);
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
    // 커넥터가 노드 뒤에 깔리지 않도록 항상 상위 레이어에 유지
    rootNode.parent.appendChild(rootNode);
  }

  // 라벨 위치 및 스타일 갱신
  if (labelFrame) {
    const { point: midSegmentPoint, isVertical } = getLabelPlacement(worldPoints, routingType);

    const textNode = labelFrame.findOne((n) => n.type === 'TEXT') as TextNode | null;
    const labelText = safeGetPluginData(rootNode, 'connector_label') ||
                      safeGetPluginData(vector, 'connector_label') || '';
    const labelOn = safeGetPluginData(rootNode, 'connector_label_on') === 'true' ||
                    safeGetPluginData(vector, 'connector_label_on') === 'true' ||
                    Boolean(labelText);
    if (labelOn && textNode) {
      const boxStyle = (safeGetPluginData(rootNode, 'connector_label_box_style') ||
                        safeGetPluginData(vector, 'connector_label_box_style') || 'BOX') as ConnectorLabelBoxStyle;
      const align = (safeGetPluginData(rootNode, 'connector_label_align') ||
                     safeGetPluginData(vector, 'connector_label_align') || 'CENTER') as ConnectorLabelAlign;
      const fillCol = safeGetPluginData(rootNode, 'connector_label_fill_color') ||
                      safeGetPluginData(vector, 'connector_label_fill_color') || '#EA2039';
      const strokeCol = safeGetPluginData(rootNode, 'connector_label_stroke_color') ||
                        safeGetPluginData(vector, 'connector_label_stroke_color') || '#EA2039';

      await applyConnectorLabelStyle(labelFrame, textNode, {
        labelText,
        boxStyle,
        textAlign: align,
        fillColor: fillCol,
        strokeColor: strokeCol,
        isVertical,
      });
    }

    placeNodeAtWorldCenter(labelFrame, midSegmentPoint);
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

// 특정 노드들이 드래그 이동되었을 때 연결된 커넥터 일괄 갱신 (자동 최적화 라인 연결 적용)
export async function syncConnectorsForMovedNodes(nodeIds: Set<string>) {
  if (isUpdatingConnectors || nodeIds.size === 0) return;
  isUpdatingConnectors = true;

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
        await updateOrthogonalVectorConnector(connNode, undefined, undefined, true);
      }
    }
  } catch (err) {
    console.error('커넥터 위치 동기화 실패:', err);
  } finally {
    isUpdatingConnectors = false;
  }
}
