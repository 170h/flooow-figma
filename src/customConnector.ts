// ============================================================================
// 커스텀 90도 칼각 직각 벡터 커넥터 엔진 (Custom Orthogonal Vector Connector)
// 피그잼 기본 커넥터의 라운딩 강제 문제를 해결하고 100% 순수 직각 Miter 선 생성
// ============================================================================

import { MagnetPosition } from './types';

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
  sourceNodeId?: string;
  targetNodeId?: string;
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
      // 역방향 우회
      const detourY =
        tgtPoint.y >= srcPoint.y
          ? Math.max(srcBox.y + srcBox.height, tgtBox.y + tgtBox.height) + margin
          : Math.min(srcBox.y, tgtBox.y) - margin;

      const exitX = isRightward ? srcPoint.x + margin : srcPoint.x - margin;
      const enterX = isRightward ? tgtPoint.x - margin : tgtPoint.x + margin;

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
  // 5. 그 외 동일 방향이거나 특수 조합의 범용 연결
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

  // 90도 직각 경로 포인트 계산
  const worldPoints = calculateOrthogonalPoints(
    pStart,
    sourceMagnet,
    pEnd,
    targetMagnet,
    srcBox,
    tgtBox
  );

  // Bounding Box 및 로컬 좌표계 변환
  const allX = worldPoints.map((p) => p.x);
  const allY = worldPoints.map((p) => p.y);
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

  // 색상 및 두께 결정
  const strokeColor: RGB = options.strokeColor || { r: 0.18, g: 0.18, b: 0.22 };
  const strokeWeight: number = options.strokeWeight || 1.5;

  // 피그마 VectorNode 생성
  const vector = figma.createVector();
  vector.x = minX;
  vector.y = minY;
  vector.resize(width, height);

  // 버텍스 및 세그먼트 구성 (마지막 버텍스에만 정확한 ARROW_EQUILATERAL 화살표 촉 부여)
  const vertices: VectorVertex[] = localPoints.map((pt, idx) => ({
    x: pt.x,
    y: pt.y,
    strokeCap: idx === localPoints.length - 1 ? 'ARROW_EQUILATERAL' : 'NONE',
    strokeJoin: 'MITER',
    cornerRadius: 0, // 완전한 90도 직각 보장 (라운딩 0)
  }));

  const segments: VectorSegment[] = [];
  for (let i = 0; i < localPoints.length - 1; i++) {
    segments.push({
      start: i,
      end: i + 1,
    });
  }

  await vector.setVectorNetworkAsync({ vertices, segments });

  vector.strokes = [{ type: 'SOLID', color: strokeColor }];
  vector.strokeWeight = strokeWeight;
  vector.strokeJoin = 'MITER';
  vector.strokeMiterLimit = 4;
  vector.name = `[Connector] ${sourceNode.name} → ${targetNode.name}`;

  // 플러그인 메타데이터 보존
  vector.setPluginData('is_flow_connector', 'true');
  vector.setPluginData('is_custom_connector', 'true');
  vector.setPluginData('source_node_id', sourceNode.id);
  vector.setPluginData('target_node_id', targetNode.id);
  vector.setPluginData('source_magnet', sourceMagnet);
  vector.setPluginData('target_magnet', targetMagnet);

  // 5. 라벨(텍스트)이 존재하는 경우 중앙 세그먼트에 단정한 태그 뱃지 생성
  if (options.label && options.label.trim() !== '') {
    const labelText = options.label.trim();
    vector.setPluginData('connector_label', labelText);

    // 폰트 로드
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    } catch {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    }

    // 가장 긴 세그먼트의 중심점 탐색
    let longestDist = -1;
    let midSegmentPoint: Point = {
      x: (worldPoints[0].x + worldPoints[1].x) / 2,
      y: (worldPoints[0].y + worldPoints[1].y) / 2,
    };

    for (let i = 0; i < worldPoints.length - 1; i++) {
      const p1 = worldPoints[i];
      const p2 = worldPoints[i + 1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist > longestDist) {
        longestDist = dist;
        midSegmentPoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
      }
    }

    // 라벨 태그 박스 생성 (흰색 배경 + 얇은 테두리 + 패딩)
    const labelFrame = figma.createFrame();
    labelFrame.name = 'ConnectorLabel';
    labelFrame.layoutMode = 'HORIZONTAL';
    labelFrame.primaryAxisSizingMode = 'AUTO';
    labelFrame.counterAxisSizingMode = 'AUTO';
    labelFrame.paddingLeft = 6;
    labelFrame.paddingRight = 6;
    labelFrame.paddingTop = 2;
    labelFrame.paddingBottom = 2;
    labelFrame.cornerRadius = 3;
    labelFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    labelFrame.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.88 } }];
    labelFrame.strokeWeight = 1;

    const textNode = figma.createText();
    textNode.characters = labelText;
    textNode.fontSize = 10;
    textNode.fontName = { family: 'Inter', style: 'Medium' };
    textNode.fills = [{ type: 'SOLID', color: strokeColor }];
    textNode.setPluginData('is_custom_connector', 'true');
    labelFrame.appendChild(textNode);

    // 라벨 중심 맞춤
    labelFrame.x = Math.round(midSegmentPoint.x - labelFrame.width / 2);
    labelFrame.y = Math.round(midSegmentPoint.y - labelFrame.height / 2);

    labelFrame.setPluginData('is_connector_label', 'true');
    labelFrame.setPluginData('is_custom_connector', 'true');

    // 라인과 라벨을 단일 커넥터 그룹으로 묶음
    const group = figma.group([vector, labelFrame], figma.currentPage);
    group.name = `[Flow] ${sourceNode.name} → ${targetNode.name} ("${labelText}")`;
    group.setPluginData('is_flow_connector', 'true');
    group.setPluginData('is_custom_connector', 'true');
    group.setPluginData('source_node_id', sourceNode.id);
    group.setPluginData('target_node_id', targetNode.id);
    group.setPluginData('source_magnet', sourceMagnet);
    group.setPluginData('target_magnet', targetMagnet);
    group.setPluginData('connector_label', labelText);

    registerConnectorInRegistry(group);
    return group;
  }

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
  const srcId = connectorNode.getPluginData('source_node_id');
  const tgtId = connectorNode.getPluginData('target_node_id');
  if (srcId) {
    if (!nodeToConnectorsMap.has(srcId)) nodeToConnectorsMap.set(srcId, new Set());
    nodeToConnectorsMap.get(srcId)!.add(connectorNode.id);
  }
  if (tgtId) {
    if (!nodeToConnectorsMap.has(tgtId)) nodeToConnectorsMap.set(tgtId, new Set());
    nodeToConnectorsMap.get(tgtId)!.add(connectorNode.id);
  }
}

// 캔버스 내 모든 커스텀 커넥터 스캔 및 레지스트리 초기화
export function refreshConnectorRegistry() {
  nodeToConnectorsMap.clear();
  const connectors = figma.currentPage.findAll(
    (n) => n.getPluginData('is_custom_connector') === 'true'
  );
  for (const conn of connectors) {
    registerConnectorInRegistry(conn);
  }
}

// 두 노드의 상대적 위치에 따라 최단거리 마그넷 포트 쌍을 실시간 동적 판별
export function getOptimalMagnetPair(
  srcBox: Box,
  tgtBox: Box
): { sourceMagnet: MagnetPosition; targetMagnet: MagnetPosition } {
  // A. 완전히 분리된 구역 판별
  const isRight = tgtBox.x >= srcBox.x + srcBox.width;
  const isLeft = tgtBox.x + tgtBox.width <= srcBox.x;
  const isBelow = tgtBox.y >= srcBox.y + srcBox.height;
  const isAbove = tgtBox.y + tgtBox.height <= srcBox.y;

  // 순수 가로 분리
  if (isRight && !isBelow && !isAbove) return { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' };
  if (isLeft && !isBelow && !isAbove) return { sourceMagnet: 'LEFT', targetMagnet: 'RIGHT' };
  // 순수 세로 분리
  if (isBelow && !isRight && !isLeft) return { sourceMagnet: 'BOTTOM', targetMagnet: 'TOP' };
  if (isAbove && !isRight && !isLeft) return { sourceMagnet: 'TOP', targetMagnet: 'BOTTOM' };

  // B. 대각선 영역 또는 겹치는 경우: 중심점 벡터(dx, dy) 비교
  const centerSrcX = srcBox.x + srcBox.width / 2;
  const centerSrcY = srcBox.y + srcBox.height / 2;
  const centerTgtX = tgtBox.x + tgtBox.width / 2;
  const centerTgtY = tgtBox.y + tgtBox.height / 2;

  const dx = centerTgtX - centerSrcX;
  const dy = centerTgtY - centerSrcY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceMagnet: 'RIGHT', targetMagnet: 'LEFT' }
      : { sourceMagnet: 'LEFT', targetMagnet: 'RIGHT' };
  } else {
    return dy >= 0
      ? { sourceMagnet: 'BOTTOM', targetMagnet: 'TOP' }
      : { sourceMagnet: 'TOP', targetMagnet: 'BOTTOM' };
  }
}

// 단일 커넥터의 직각 패스 및 라벨 좌표 실시간 재계산 (최단거리 자동 스냅 지원)
export async function updateOrthogonalVectorConnector(connectorNode: SceneNode) {
  const srcId = connectorNode.getPluginData('source_node_id');
  const tgtId = connectorNode.getPluginData('target_node_id');

  if (!srcId || !tgtId) return;

  const sourceNode = figma.getNodeById(srcId) as SceneNode | null;
  const targetNode = figma.getNodeById(tgtId) as SceneNode | null;

  // 연결된 노드가 삭제되었거나 없으면 스킵
  if (!sourceNode || !targetNode) return;

  // VectorNode 및 라벨 탐색
  let vector: VectorNode | null = null;
  let labelFrame: FrameNode | null = null;

  if (connectorNode.type === 'GROUP') {
    const group = connectorNode as GroupNode;
    vector = (group.children.find((c) => c.type === 'VECTOR') as VectorNode) || null;
    labelFrame =
      (group.children.find(
        (c) => c.getPluginData('is_connector_label') === 'true' || c.name === 'ConnectorLabel'
      ) as FrameNode) || null;
  } else if (connectorNode.type === 'VECTOR') {
    vector = connectorNode as VectorNode;
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

  // 🔥 핵심: 두 노드의 현재 위치에 따라 최단거리 마그넷 포트 실시간 자동 판별
  const { sourceMagnet, targetMagnet } = getOptimalMagnetPair(srcBox, tgtBox);

  // 최신 마그넷 정보 동기화 저장
  connectorNode.setPluginData('source_magnet', sourceMagnet);
  connectorNode.setPluginData('target_magnet', targetMagnet);
  if (vector !== connectorNode) {
    vector.setPluginData('source_magnet', sourceMagnet);
    vector.setPluginData('target_magnet', targetMagnet);
  }

  const pStart = getMagnetPoint(srcBox, sourceMagnet);
  const pEnd = getMagnetPoint(tgtBox, targetMagnet);

  // 새로운 최단거리 90도 직각 경로 재계산
  const worldPoints = calculateOrthogonalPoints(
    pStart,
    sourceMagnet,
    pEnd,
    targetMagnet,
    srcBox,
    tgtBox
  );

  const allX = worldPoints.map((p) => p.x);
  const allY = worldPoints.map((p) => p.y);
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

  vector.x = minX;
  vector.y = minY;
  vector.resize(width, height);

  const vertices: VectorVertex[] = localPoints.map((pt, idx) => ({
    x: pt.x,
    y: pt.y,
    strokeCap: idx === localPoints.length - 1 ? 'ARROW_EQUILATERAL' : 'NONE',
    strokeJoin: 'MITER',
    cornerRadius: 0,
  }));

  const segments: VectorSegment[] = [];
  for (let i = 0; i < localPoints.length - 1; i++) {
    segments.push({
      start: i,
      end: i + 1,
    });
  }

  await vector.setVectorNetworkAsync({ vertices, segments });

  // 라벨 위치 갱신
  if (labelFrame) {
    let longestDist = -1;
    let midSegmentPoint: Point = {
      x: (worldPoints[0].x + worldPoints[1].x) / 2,
      y: (worldPoints[0].y + worldPoints[1].y) / 2,
    };

    for (let i = 0; i < worldPoints.length - 1; i++) {
      const p1 = worldPoints[i];
      const p2 = worldPoints[i + 1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist > longestDist) {
        longestDist = dist;
        midSegmentPoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
      }
    }

    labelFrame.x = Math.round(midSegmentPoint.x - labelFrame.width / 2);
    labelFrame.y = Math.round(midSegmentPoint.y - labelFrame.height / 2);
  }
}

// 특정 노드들이 드래그 이동되었을 때 연결된 커넥터 일괄 갱신
export async function syncConnectorsForMovedNodes(nodeIds: Set<string>) {
  if (isUpdatingConnectors || nodeIds.size === 0) return;
  isUpdatingConnectors = true;

  try {
    const connIdsToUpdate = new Set<string>();
    for (const nid of nodeIds) {
      const conns = nodeToConnectorsMap.get(nid);
      if (conns) {
        for (const cid of conns) {
          connIdsToUpdate.add(cid);
        }
      }
    }

    for (const connId of connIdsToUpdate) {
      const connNode = figma.getNodeById(connId) as SceneNode | null;
      if (connNode) {
        await updateOrthogonalVectorConnector(connNode);
      }
    }
  } catch (err) {
    console.error('커넥터 위치 동기화 실패:', err);
  } finally {
    isUpdatingConnectors = false;
  }
}
