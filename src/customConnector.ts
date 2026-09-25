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

// 캔버스 내 모든 커넥터(커스텀 및 네이티브) 스캔 및 레지스트리 초기화
export function refreshConnectorRegistry() {
  nodeToConnectorsMap.clear();
  const connectors = figma.currentPage.findAll(
    (n) => n.getPluginData('is_custom_connector') === 'true' || n.type === 'CONNECTOR'
  );
  for (const conn of connectors) {
    registerConnectorInRegistry(conn);
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
  forceOptimal: boolean = false
) {
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

  // 수동 지정 마그넷이 있으면 우선 사용
  // forceOptimal이거나 마그넷 정보가 없는 경우 노드 상대 위치 기반 최적 마그넷 자동 판별
  let sourceMagnet = explicitSourceMagnet;
  let targetMagnet = explicitTargetMagnet;

  if (!sourceMagnet || !targetMagnet || forceOptimal) {
    const optimal = getOptimalMagnetPair(srcBox, tgtBox);
    if (!sourceMagnet) sourceMagnet = optimal.sourceMagnet;
    if (!targetMagnet) targetMagnet = optimal.targetMagnet;
  }

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

// 특정 노드들이 드래그 이동되었을 때 연결된 커넥터 일괄 갱신 (자동 최적화 라인 연결 적용)
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
