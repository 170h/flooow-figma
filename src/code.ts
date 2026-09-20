import {
  WorkflowStatus,
  STATUS_CONFIG,
  FrameStatusItem,
  PluginAction,
  CoreToUIMessage,
  FlowNodePayload,
  UpdateNodePayload,
  ConnectPointsPayload,
  SelectedNodeInfo,
  MagnetPosition,
  ConnectorStrokePattern,
  ConnectorRoutingType,
  ConnectorTerminalType,
} from './types';
import {
  createOrthogonalVectorConnector,
  refreshConnectorRegistry,
  syncConnectorsForMovedNodes,
} from './customConnector';

// RGB 객체를 6자리 HEX 문자열로 변환하는 헬퍼
function rgbToHexColor(rgb: RGB): string {
  const toHex = (c: number) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// 플러그인 UI 창 열기 (Figma 신규 디자인 규격 360px 폭 및 라이트 테마 대응)
figma.showUI(__html__, {
  width: 360,
  height: 486,
  themeColors: true,
  title: 'UI Flow Diagram',
});


// 필수 폰트 사전 로드
async function loadRequiredFonts() {
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
  ]);
}

// UI로 메시지 전송 헬퍼
function postToUI(msg: CoreToUIMessage) {
  figma.ui.postMessage(msg);
}

// 토스트 알림 전송
function notify(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  figma.notify(message, { error: level === 'error' });
  postToUI({ type: 'TOAST', message, level });
}

// 선택된 요소 또는 조상 중 커넥터(Figma 네이티브 CONNECTOR 또는 커스텀 벡터 직각 커넥터) 탐색
function findConnectorNode(node: BaseNode | null): SceneNode | null {
  if (!node) return null;
  let curr: BaseNode | null = node;

  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    if (
      curr.type === 'CONNECTOR' ||
      curr.getPluginData('is_custom_connector') === 'true' ||
      curr.getPluginData('is_flow_connector') === 'true'
    ) {
      // 만약 부모가 커스텀 커넥터 그룹이라면 최상위 커넥터 그룹을 반환
      let topConnector: SceneNode = curr as SceneNode;
      let parentScan: BaseNode | null = curr.parent;
      while (parentScan && parentScan.type !== 'PAGE' && parentScan.type !== 'DOCUMENT') {
        if (
          parentScan.getPluginData('is_custom_connector') === 'true' ||
          parentScan.getPluginData('is_flow_connector') === 'true'
        ) {
          topConnector = parentScan as SceneNode;
        }
        parentScan = parentScan.parent;
      }
      return topConnector;
    }
    curr = curr.parent;
  }
  return null;
}

// 선택된 요소의 조상 중 Flow Node 탐색 (FrameNode 및 ShapeWithTextNode 모두 완벽 지원)
function findFlowNode(node: BaseNode | null): (FrameNode | ShapeWithTextNode) | null {
  if (!node) return null;

  // 커넥터 또는 커넥터 내부 자식이면 플로우 노드로 매핑하지 않음
  if (findConnectorNode(node)) return null;

  let curr: BaseNode | null = node;
  let topCandidate: (FrameNode | ShapeWithTextNode) | null = null;

  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    if (curr.getPluginData('is_flow_node') === 'true') {
      return curr as FrameNode | ShapeWithTextNode;
    }
    if (curr.type === 'FRAME' || curr.type === 'SHAPE_WITH_TEXT') {
      if (curr.getPluginData('is_connector_label') !== 'true' && curr.name !== 'ConnectorLabel') {
        topCandidate = curr as FrameNode | ShapeWithTextNode;
      }
    }
    curr = curr.parent;
  }
  return topCandidate;
}

// 캔버스 내 플로우 노드 개수 확인 (태그 자동 넘버링: p1, p2, p3...)
function getNextFlowTag(): string {
  const flowNodes = figma.currentPage.findAll(
    (node) => node.getPluginData('is_flow_node') === 'true'
  );
  return `p${flowNodes.length + 1}`;
}

// 선택 영역 변경 감지 시 UI 갱신 (바탕화면 클릭 ➔ 빈 폼 / 노드 클릭 ➔ 상세 수정 폼)
function handleSelectionChange() {
  const rawSelection = figma.currentPage.selection;

  // 1. 커넥터 및 플로우 노드 정확 매핑 (자식/선/라벨 클릭 시에도 정확한 최상위 엔티티로 매핑)
  const resolvedNodesMap = new Map<string, SceneNode>();
  for (const node of rawSelection) {
    const connNode = findConnectorNode(node);
    if (connNode) {
      resolvedNodesMap.set(connNode.id, connNode);
      continue;
    }

    const flowParent = findFlowNode(node);
    if (flowParent) {
      resolvedNodesMap.set(flowParent.id, flowParent);
    } else {
      resolvedNodesMap.set(node.id, node);
    }
  }

  const uniqueNodes = Array.from(resolvedNodesMap.values());

  const nodes: SelectedNodeInfo[] = uniqueNodes.map((node) => {
    const isFlowNode = node.getPluginData('is_flow_node') === 'true';

    // 캔버스 기즈모로 사이즈 조절이 되지 않도록 min/max 치수를 현재 크기로 완전 잠금
    if (isFlowNode && node.type === 'FRAME') {
      const frame = node as FrameNode;
      const w = Math.round(frame.width);
      const h = Math.round(frame.height);
      if (frame.minWidth !== w || frame.maxWidth !== w || frame.minHeight !== h || frame.maxHeight !== h) {
        frame.minWidth = w;
        frame.maxWidth = w;
        frame.minHeight = h;
        frame.maxHeight = h;
      }
      if (!frame.getPluginData('node_width')) {
        frame.setPluginData('node_width', `${w}`);
        frame.setPluginData('node_height', `${h}`);
      }

      // 기존 우상단에 있던 상태 뱃지를 하단 오른쪽 박스 안쪽으로 자동 이동
      const statusBadge = frame.children.find(
        (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;
      if (statusBadge && statusBadge.y <= 0) {
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = w - statusBadge.width - 10;
        statusBadge.y = h - statusBadge.height - 10;
      }
    }

    let title = node.getPluginData('node_title') || node.name;
    let description = node.getPluginData('node_desc') || '';
    let tag = node.getPluginData('node_tag') || '';
    let connectorLabel: string | undefined;
    let connectorLineType: 'ELBOWED' | 'STRAIGHT' | 'CURVED' | undefined;
    let connectorColorHex: string | undefined;
    let connectorStrokeWeight: number | undefined;
    let connectorStrokePattern: ConnectorStrokePattern | undefined;
    let connectorRoutingType: ConnectorRoutingType | undefined;
    let connectorStartTerminal: ConnectorTerminalType | undefined;
    let connectorEndTerminal: ConnectorTerminalType | undefined;

    const isCustomConnector =
      node.getPluginData('is_custom_connector') === 'true' ||
      node.getPluginData('is_flow_connector') === 'true';
    const isFigmaConnector = node.type === 'CONNECTOR';
    const isConnector = isFigmaConnector || isCustomConnector;

    if (isConnector) {
      if (isFigmaConnector) {
        const conn = node as ConnectorNode;
        connectorLabel = conn.text ? conn.text.characters : '';
        connectorLineType = conn.connectorLineType;
        connectorRoutingType = conn.connectorLineType === 'STRAIGHT' ? 'STRAIGHT' : 'ORTHOGONAL';
        connectorStrokeWeight = typeof conn.strokeWeight === 'number' ? conn.strokeWeight : 1.5;

        if (Array.isArray(conn.strokes) && conn.strokes.length > 0 && conn.strokes[0].type === 'SOLID') {
          connectorColorHex = rgbToHexColor(conn.strokes[0].color);
        }

        if (Array.isArray(conn.dashPattern) && conn.dashPattern.length > 0) {
          connectorStrokePattern = conn.dashPattern[0] <= 2 ? 'DOTTED' : 'DASHED';
        } else {
          connectorStrokePattern = 'SOLID';
        }

        const mapCapToTerm = (cap: string): ConnectorTerminalType => {
          if (cap.includes('ARROW')) return 'ARROW';
          if (cap.includes('DIAMOND')) return 'DIAMOND';
          if (cap.includes('CIRCLE')) return 'CIRCLE';
          return 'NONE';
        };
        connectorStartTerminal = mapCapToTerm(String(conn.connectorStartStrokeCap || 'NONE'));
        connectorEndTerminal = mapCapToTerm(String(conn.connectorEndStrokeCap || 'NONE'));
      } else {
        // 커스텀 벡터 직각 커넥터 (그룹 또는 벡터 노드)
        connectorLabel = node.getPluginData('connector_label') || '';
        connectorLineType = 'ELBOWED';
        connectorRoutingType = (node.getPluginData('connector_routing') as ConnectorRoutingType) || 'ORTHOGONAL';
        connectorColorHex = node.getPluginData('connector_color');
        const savedWeight = node.getPluginData('connector_weight');
        connectorStrokeWeight = savedWeight ? parseFloat(savedWeight) : undefined;
        connectorStrokePattern = (node.getPluginData('connector_pattern') as ConnectorStrokePattern) || 'SOLID';
        connectorStartTerminal = (node.getPluginData('start_terminal') as ConnectorTerminalType) || 'NONE';
        connectorEndTerminal = (node.getPluginData('end_terminal') as ConnectorTerminalType) || 'ARROW';

        let vectorChild: VectorNode | null = null;
        if (node.type === 'VECTOR') {
          vectorChild = node as VectorNode;
        } else if ('findOne' in node) {
          vectorChild = (node as GroupNode).findOne((n) => n.type === 'VECTOR') as VectorNode | null;
        }

        if (vectorChild) {
          if (!connectorColorHex && Array.isArray(vectorChild.strokes) && vectorChild.strokes.length > 0) {
            const first = vectorChild.strokes[0];
            if (first.type === 'SOLID') connectorColorHex = rgbToHexColor(first.color);
          }
          if (connectorStrokeWeight === undefined && typeof vectorChild.strokeWeight === 'number') {
            connectorStrokeWeight = vectorChild.strokeWeight;
          }
        }
      }
      title = connectorLabel ? `커넥터: "${connectorLabel}"` : '연결선 (Connector)';
    }

    // 플러그인 데이터가 없는 경우 실제 자식 텍스트에서 스마트 추출
    if (!node.getPluginData('node_title') && 'findAll' in node) {
      const texts = (node as FrameNode).findAll((n) => n.type === 'TEXT') as TextNode[];
      if (texts.length > 0) title = texts[0].characters;
      if (texts.length > 1) {
        if (texts[1].characters.length <= 8) tag = texts[1].characters;
        else description = texts[1].characters;
      }
      if (texts.length > 2 && !description) description = texts[2].characters;
    } else if (!node.getPluginData('node_title') && node.type === 'SHAPE_WITH_TEXT') {
      const lines = (node as ShapeWithTextNode).text.characters.split('\n');
      if (lines.length > 0) title = lines[0];
      if (lines.length > 1) description = lines.slice(1).join('\n');
    }

    return {
      id: node.id,
      name: node.name,
      isFlowNode,
      isConnector,
      nodeType: node.type,
      title,
      description,
      tag,
      theme: (node.getPluginData('node_theme') as 'light' | 'dark') || 'light',
      figmaLink: node.getPluginData('figma_link'),
      connectorLabel,
      connectorLineType,
      connectorColorHex,
      connectorStrokeWeight,
      connectorStrokePattern,
      connectorRoutingType,
      connectorStartTerminal,
      connectorEndTerminal,
      width: Math.round(node.width),
      height: Math.round(node.height),
    };
  });

  let currentStatus: WorkflowStatus | undefined;
  if (uniqueNodes.length === 1) {
    const saved = uniqueNodes[0].getPluginData('workflow_status') as WorkflowStatus;
    if (saved) currentStatus = saved;
  }

  postToUI({
    type: 'SELECTION_CHANGED',
    count: uniqueNodes.length,
    nodes,
    currentStatus,
    nextSuggestedTag: getNextFlowTag(),
  });
}

figma.on('selectionchange', handleSelectionChange);

// ----------------------------------------------------
// 1. 안전한 폰트 로드 및 텍스트 변경 헬퍼
// ----------------------------------------------------
async function safeSetCharacters(textNode: TextNode, newText: string) {
  if (!textNode) return;
  const len = textNode.characters.length;
  try {
    if (len > 0) {
      const fontNames = textNode.getRangeAllFontNames(0, len);
      for (const fn of fontNames) {
        await figma.loadFontAsync(fn);
      }
    } else {
      if ('fontName' in textNode && textNode.fontName !== figma.mixed) {
        await figma.loadFontAsync(textNode.fontName as FontName);
      } else {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      }
    }
  } catch (e) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  }
  textNode.characters = newText;
}

// ----------------------------------------------------
// 2. 쉐이프로 생성되었던 구형 노드를 완벽한 직각 프레임 카드로 마이그레이션
// ----------------------------------------------------
async function convertShapeToFrameNode(shape: ShapeWithTextNode): Promise<FrameNode> {
  await loadRequiredFonts();

  const title = shape.getPluginData('node_title') || shape.name || 'Untitled';
  const desc = shape.getPluginData('node_desc') || '';
  const theme = (shape.getPluginData('node_theme') as 'light' | 'dark') || 'light';
  const status = (shape.getPluginData('workflow_status') as WorkflowStatus) || undefined;
  const stepStr = shape.getPluginData('step_number');
  const stepNumber = stepStr ? parseInt(stepStr, 10) : undefined;
  const width = Math.max(120, Math.round(shape.width));
  const height = Math.max(50, Math.round(shape.height));
  const x = shape.x;
  const y = shape.y;
  const parent = shape.parent || figma.currentPage;

  const isDark = theme === 'dark';
  const bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
  const borderColor: RGB = isDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
  const titleColor: RGB = isDark ? { r: 0.98, g: 0.98, b: 1 } : { r: 0.1, g: 0.1, b: 0.12 };
  const descColor: RGB = isDark ? { r: 0.65, g: 0.68, b: 0.72 } : { r: 0.42, g: 0.45, b: 0.5 };

  const card = figma.createFrame();
  card.name = title;
  card.x = x;
  card.y = y;
  card.resize(width, height);
  card.cornerRadius = 0; // 완전 직각
  card.strokeWeight = 1.5;
  card.strokes = [{ type: 'SOLID', color: borderColor }];
  card.fills = [{ type: 'SOLID', color: bgColor }];
  card.clipsContent = false;

  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'FIXED';
  card.counterAxisSizingMode = 'FIXED';
  card.paddingTop = 14;
  card.paddingBottom = 16;
  card.paddingLeft = 16;
  card.paddingRight = 16;
  card.itemSpacing = 8;
  card.primaryAxisAlignItems = 'MIN';
  card.counterAxisAlignItems = 'MIN';

  // 캔버스 기즈모 리사이즈 원천 차단 (현재 크기로 min/max 완전 고정)
  card.minWidth = width;
  card.maxWidth = width;
  card.minHeight = height;
  card.maxHeight = height;
  card.setPluginData('node_width', `${width}`);
  card.setPluginData('node_height', `${height}`);

  // 헤더 행 (타이틀 + 상태 뱃지 수용 공간)
  const headerRow = figma.createFrame();
  headerRow.name = 'Header';
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.layoutAlign = 'STRETCH';
  headerRow.primaryAxisAlignItems = 'CENTER';
  headerRow.counterAxisAlignItems = 'CENTER';
  headerRow.itemSpacing = 8;
  headerRow.fills = [];

  const titleText = figma.createText();
  titleText.name = 'TitleText';
  titleText.fontName = { family: 'Inter', style: 'Bold' };
  titleText.fontSize = 13;
  titleText.characters = title;
  titleText.fills = [{ type: 'SOLID', color: titleColor }];
  titleText.layoutGrow = 1;
  titleText.textAutoResize = 'HEIGHT';
  titleText.setPluginData('node_role', 'title');
  headerRow.appendChild(titleText);

  card.appendChild(headerRow);

  // 상태 뱃지 복원 (타이틀과 독립하여 카드 우상단에 위치)
  if (status && STATUS_CONFIG[status]) {
    const cfg = STATUS_CONFIG[status];
    const statusBadge = figma.createFrame();
    statusBadge.name = 'StatusBadge';
    statusBadge.layoutMode = 'HORIZONTAL';
    statusBadge.primaryAxisSizingMode = 'AUTO';
    statusBadge.counterAxisSizingMode = 'AUTO';
    statusBadge.primaryAxisAlignItems = 'CENTER';
    statusBadge.counterAxisAlignItems = 'CENTER';
    statusBadge.paddingLeft = 7;
    statusBadge.paddingRight = 7;
    statusBadge.paddingTop = 3;
    statusBadge.paddingBottom = 3;
    statusBadge.cornerRadius = 0; // 완전 직각 알약
    statusBadge.fills = [{ type: 'SOLID', color: cfg.color }];
    statusBadge.setPluginData('is_status_badge', 'true');

    const badgeText = figma.createText();
    badgeText.name = 'StatusText';
    badgeText.fontName = { family: 'Inter', style: 'Bold' };
    badgeText.fontSize = 9;
    badgeText.characters = cfg.label.toUpperCase();
    badgeText.textAutoResize = 'WIDTH_AND_HEIGHT';
    badgeText.fills = [{ type: 'SOLID', color: cfg.textColor }];
    statusBadge.appendChild(badgeText);

    card.appendChild(statusBadge);
    statusBadge.layoutPositioning = 'ABSOLUTE';
    statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
    statusBadge.x = card.width - statusBadge.width - 10;
    statusBadge.y = card.height - statusBadge.height - 10;
  }

  // 설명 텍스트
  const descText = figma.createText();
  descText.name = 'DescText';
  descText.fontName = { family: 'Inter', style: 'Regular' };
  descText.fontSize = 11;
  descText.characters = desc;
  descText.fills = [{ type: 'SOLID', color: descColor }];
  descText.layoutAlign = 'STRETCH';
  descText.textAutoResize = 'HEIGHT';
  descText.setPluginData('node_role', 'desc');
  card.appendChild(descText);

  // 스텝 번호 뱃지 복원
  if (stepNumber) {
    const stepBadge = figma.createFrame();
    stepBadge.name = `[Step] ${stepNumber}`;
    card.appendChild(stepBadge);
    stepBadge.layoutPositioning = 'ABSOLUTE';
    stepBadge.x = -8;
    stepBadge.y = -8;
    stepBadge.resize(24, 24);
    stepBadge.primaryAxisSizingMode = 'FIXED';
    stepBadge.counterAxisSizingMode = 'FIXED';
    stepBadge.cornerRadius = 0; // 완전 직각
    stepBadge.layoutMode = 'HORIZONTAL';
    stepBadge.primaryAxisAlignItems = 'CENTER';
    stepBadge.counterAxisAlignItems = 'CENTER';
    stepBadge.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.14 } }];
    stepBadge.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    stepBadge.strokeWeight = 1.5;
    stepBadge.setPluginData('is_step_badge', 'true');

    const numText = figma.createText();
    numText.name = 'NumText';
    numText.fontName = { family: 'Inter', style: 'Bold' };
    numText.fontSize = 11;
    numText.characters = `${stepNumber}`;
    numText.textAutoResize = 'WIDTH_AND_HEIGHT';
    numText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    stepBadge.appendChild(numText);
  }

  card.setPluginData('is_flow_node', 'true');
  card.setPluginData('node_title', title);
  card.setPluginData('node_desc', desc);
  card.setPluginData('node_tag', '');
  card.setPluginData('node_theme', theme);
  if (status) card.setPluginData('workflow_status', status);
  if (stepNumber) card.setPluginData('step_number', `${stepNumber}`);

  parent.appendChild(card);

  // 커넥터 연결선 안전 인계
  const oldId = shape.id;
  const connectors = figma.currentPage.findAll((n) => n.type === 'CONNECTOR') as ConnectorNode[];
  for (const conn of connectors) {
    if (conn.connectorStart && 'endpointNodeId' in conn.connectorStart && conn.connectorStart.endpointNodeId === oldId) {
      const magnet = 'magnet' in conn.connectorStart ? conn.connectorStart.magnet : 'AUTO';
      conn.connectorStart = { endpointNodeId: card.id, magnet };
    }
    if (conn.connectorEnd && 'endpointNodeId' in conn.connectorEnd && conn.connectorEnd.endpointNodeId === oldId) {
      const magnet = 'magnet' in conn.connectorEnd ? conn.connectorEnd.magnet : 'AUTO';
      conn.connectorEnd = { endpointNodeId: card.id, magnet };
    }
  }

  shape.remove();
  return card;
}

// ----------------------------------------------------
// 3. UI Flow Node 카드 생성 (직각 모서리 + 고정 폰트 + 세련된 레이아웃)
// ----------------------------------------------------
async function createFlowNode(payload: FlowNodePayload) {
  try {
    await loadRequiredFonts();

    const title = (payload.title || '').trim() || 'Welcome';
    const description = (payload.description || '').trim() || 'Entry point of the flow.';
    const theme = payload.theme || 'light';
    const width = payload.width ? Math.max(120, payload.width) : 250;
    const height = payload.height ? Math.max(50, payload.height) : 90;

    const isDark = theme === 'dark';
    const bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
    const borderColor: RGB = isDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
    const titleColor: RGB = isDark ? { r: 0.98, g: 0.98, b: 1 } : { r: 0.1, g: 0.1, b: 0.12 };
    const descColor: RGB = isDark ? { r: 0.65, g: 0.68, b: 0.72 } : { r: 0.42, g: 0.45, b: 0.5 };

    // 1. 메인 카드 프레임
    const card = figma.createFrame();
    card.name = title;
    card.cornerRadius = 0; // 완전 직각
    card.strokeWeight = 1.5;
    card.strokes = [{ type: 'SOLID', color: borderColor }];
    card.fills = [{ type: 'SOLID', color: bgColor }];
    card.clipsContent = false;

    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'FIXED';
    card.paddingTop = 14;
    card.paddingBottom = 16;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.resize(width, height);

    // 캔버스 기즈모 리사이즈 원천 차단 (현재 크기로 min/max 완전 고정)
    card.minWidth = width;
    card.maxWidth = width;
    card.minHeight = height;
    card.maxHeight = height;
    card.setPluginData('node_width', `${width}`);
    card.setPluginData('node_height', `${height}`);

    // 2. 헤더 행 (타이틀 + 상태 뱃지 배치용)
    const headerRow = figma.createFrame();
    headerRow.name = 'Header';
    headerRow.layoutMode = 'HORIZONTAL';
    headerRow.layoutAlign = 'STRETCH';
    headerRow.primaryAxisAlignItems = 'CENTER';
    headerRow.counterAxisAlignItems = 'CENTER';
    headerRow.itemSpacing = 8;
    headerRow.fills = [];

    // 3. 타이틀 텍스트 (13px Bold 고정)
    const titleText = figma.createText();
    titleText.name = 'TitleText';
    titleText.fontName = { family: 'Inter', style: 'Bold' };
    titleText.fontSize = 13;
    titleText.characters = title;
    titleText.fills = [{ type: 'SOLID', color: titleColor }];
    titleText.layoutGrow = 1;
    titleText.textAutoResize = 'HEIGHT';
    titleText.setPluginData('node_role', 'title');
    headerRow.appendChild(titleText);

    card.appendChild(headerRow);

    // 4. 설명 텍스트 (11px Regular 고정)
    const descText = figma.createText();
    descText.name = 'DescText';
    descText.fontName = { family: 'Inter', style: 'Regular' };
    descText.fontSize = 11;
    descText.characters = description;
    descText.fills = [{ type: 'SOLID', color: descColor }];
    descText.layoutAlign = 'STRETCH';
    descText.textAutoResize = 'HEIGHT';
    descText.setPluginData('node_role', 'desc');
    card.appendChild(descText);

    // 메타데이터 보관
    card.setPluginData('is_flow_node', 'true');
    card.setPluginData('node_title', title);
    card.setPluginData('node_desc', description);
    card.setPluginData('node_tag', '');
    card.setPluginData('node_theme', theme);

    // 위치 지정
    const selection = figma.currentPage.selection;
    if (selection.length > 0) {
      const last = selection[selection.length - 1];
      card.x = last.x + last.width + 60;
      card.y = last.y;
    } else {
      const center = figma.viewport.center;
      card.x = center.x - Math.round(width / 2);
      card.y = center.y - Math.round(height / 2);
    }

    figma.currentPage.appendChild(card);
    figma.currentPage.selection = [card];
    figma.viewport.scrollAndZoomIntoView([card]);

    handleSelectionChange();
    notify(`[${title}] 노드가 생성되었습니다!`, 'success');
  } catch (err) {
    notify(`노드 생성 실패: ${String(err)}`, 'error');
  }
}

// ----------------------------------------------------
// 4. 노드 상세정보 실시간 수정 기능
// ----------------------------------------------------
async function updateFlowNode(payload: UpdateNodePayload) {
  try {
    let rawNode = figma.getNodeById(payload.nodeId);
    if (!rawNode) {
      const selection = figma.currentPage.selection;
      if (selection.length > 0) rawNode = selection[0];
    }

    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode | null);
    if (!flowNode) {
      notify('수정할 노드를 찾을 수 없습니다. 캔버스에서 노드를 선택해 주세요.', 'warning');
      return;
    }

    // 쉐이프 노드인 경우 프레임 노드로 마이그레이션
    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }

    await loadRequiredFonts();

    const title = payload.title.trim() || 'Untitled';
    const description = payload.description.trim() || '';
    const isDark = payload.theme === 'dark';

    const bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
    const borderColor: RGB = isDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
    const titleColor: RGB = isDark ? { r: 0.98, g: 0.98, b: 1 } : { r: 0.1, g: 0.1, b: 0.12 };
    const descColor: RGB = isDark ? { r: 0.65, g: 0.68, b: 0.72 } : { r: 0.42, g: 0.45, b: 0.5 };

    const card = flowNode as FrameNode;
    card.name = title;
    card.cornerRadius = 0;
    card.clipsContent = false;
    card.fills = [{ type: 'SOLID', color: bgColor }];
    card.strokes = [{ type: 'SOLID', color: borderColor }];

    // 크기 조정 (min/max 일시 해제 -> resize -> min/max 재잠금)
    if (payload.width && payload.height) {
      const w = Math.max(120, payload.width);
      const h = Math.max(50, payload.height);
      card.minWidth = null;
      card.maxWidth = null;
      card.minHeight = null;
      card.maxHeight = null;

      card.resize(w, h);
      card.primaryAxisSizingMode = 'FIXED';
      card.counterAxisSizingMode = 'FIXED';

      card.minWidth = w;
      card.maxWidth = w;
      card.minHeight = h;
      card.maxHeight = h;
      card.setPluginData('node_width', `${w}`);
      card.setPluginData('node_height', `${h}`);

      // 리사이즈 시 하단 오른쪽 박스 안쪽 상태 뱃지 위치 동기화
      const statusBadge = card.children.find(
        (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;
      if (statusBadge) {
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = w - statusBadge.width - 10;
        statusBadge.y = h - statusBadge.height - 10;
      }
    }

    // 헤더 행 및 타이틀 텍스트 갱신
    let headerRow = card.children.find(
      (c) => c.name === 'Header' || (c.type === 'FRAME' && (c as FrameNode).layoutMode === 'HORIZONTAL')
    ) as FrameNode | undefined;

    if (!headerRow) {
      headerRow = figma.createFrame();
      headerRow.name = 'Header';
      headerRow.layoutMode = 'HORIZONTAL';
      headerRow.layoutAlign = 'STRETCH';
      headerRow.primaryAxisAlignItems = 'CENTER';
      headerRow.counterAxisAlignItems = 'CENTER';
      headerRow.itemSpacing = 8;
      headerRow.fills = [];
      card.insertChild(0, headerRow);
    }

    let titleText = headerRow.children.find(
      (c) => c.name === 'TitleText' || c.getPluginData('node_role') === 'title'
    ) as TextNode | undefined;

    if (!titleText) {
      titleText = figma.createText();
      titleText.name = 'TitleText';
      titleText.fontName = { family: 'Inter', style: 'Bold' };
      titleText.fontSize = 13;
      titleText.layoutGrow = 1;
      titleText.textAutoResize = 'HEIGHT';
      titleText.setPluginData('node_role', 'title');
      headerRow.insertChild(0, titleText);
    }

    await safeSetCharacters(titleText, title);
    titleText.fills = [{ type: 'SOLID', color: titleColor }];

    // 설명 텍스트 갱신
    let descText = card.children.find(
      (c) => c.name === 'DescText' || c.getPluginData('node_role') === 'desc'
    ) as TextNode | undefined;

    if (!descText) {
      descText = figma.createText();
      descText.name = 'DescText';
      descText.fontName = { family: 'Inter', style: 'Regular' };
      descText.fontSize = 11;
      descText.layoutAlign = 'STRETCH';
      descText.textAutoResize = 'HEIGHT';
      descText.setPluginData('node_role', 'desc');
      card.appendChild(descText);
    }

    await safeSetCharacters(descText, description);
    descText.fills = [{ type: 'SOLID', color: descColor }];

    // 메타데이터 갱신
    card.setPluginData('is_flow_node', 'true');
    card.setPluginData('node_title', title);
    card.setPluginData('node_desc', description);
    card.setPluginData('node_tag', '');
    card.setPluginData('node_theme', payload.theme);

    figma.currentPage.selection = [card];
    handleSelectionChange();
    notify(`[${title}] 노드가 업데이트되었습니다!`, 'success');
  } catch (err) {
    notify(`노드 수정 실패: ${String(err)}`, 'error');
  }
}

// ----------------------------------------------------
// 5. 노드 박스 면적(Width / Height) 실시간 독립 조절 기능
// 폰트 크기나 내부 뱃지는 절대 스케일되지 않고 오직 박스 크기만 리사이즈됨
// ----------------------------------------------------
async function resizeNode(nodeId: string, width: number, height: number) {
  try {
    let rawNode = figma.getNodeById(nodeId);
    if (!rawNode) {
      const selection = figma.currentPage.selection;
      if (selection.length > 0) rawNode = selection[0];
    }

    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode | null);
    if (!flowNode || !('resize' in flowNode)) return;

    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }

    const w = Math.max(120, width);
    const h = Math.max(50, height);

    const frame = flowNode as FrameNode;
    frame.minWidth = null;
    frame.maxWidth = null;
    frame.minHeight = null;
    frame.maxHeight = null;

    frame.resize(w, h);
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'FIXED';

    frame.minWidth = w;
    frame.maxWidth = w;
    frame.minHeight = h;
    frame.maxHeight = h;

    frame.setPluginData('node_width', `${w}`);
    frame.setPluginData('node_height', `${h}`);

    // 리사이즈 시 하단 오른쪽 박스 안쪽 상태 뱃지 위치 동기화
    const statusBadge = frame.children.find(
      (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
    ) as FrameNode | undefined;
    if (statusBadge) {
      statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
      statusBadge.x = w - statusBadge.width - 10;
      statusBadge.y = h - statusBadge.height - 10;
    }

    handleSelectionChange();
  } catch (err) {
    console.error('Resize failed', err);
  }
}


// ----------------------------------------------------
// 3. 피그잼 네이티브 커넥터(ELBOWED) 연결 (직각 & 보더 두께 일치)
// ----------------------------------------------------
function hexToRgbColor(hex: string): RGB {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return {
    r: isNaN(r) ? 0.18 : r,
    g: isNaN(g) ? 0.18 : g,
    b: isNaN(b) ? 0.22 : b,
  };
}

async function connectPoints(payload: ConnectPointsPayload) {
  try {
    let sourceNode = figma.getNodeById(payload.sourceNodeId) as SceneNode | null;
    let targetNode = figma.getNodeById(payload.targetNodeId) as SceneNode | null;

    if (!sourceNode || !targetNode) {
      notify('연결할 노드를 찾을 수 없습니다.', 'warning');
      return;
    }

    const sourceFlow = findFlowNode(sourceNode);
    if (sourceFlow) sourceNode = sourceFlow;

    const targetFlow = findFlowNode(targetNode);
    if (targetFlow) targetNode = targetFlow;

    if (sourceNode.id === targetNode.id) {
      notify('서로 다른 두 노드를 선택하여 연결해 주세요.', 'warning');
      return;
    }

    await loadRequiredFonts();

    const connector = await createSingleConnector(
      sourceNode,
      payload.sourceMagnet,
      targetNode,
      payload.targetMagnet,
      payload.label,
      payload.colorHex,
      payload.strokeWeight
    );

    figma.currentPage.selection = [connector];
    handleSelectionChange();
    notify(`연결 완료${payload.label ? ` (라벨: "${payload.label}")` : ''}`, 'success');
  } catch (err) {
    notify(`연결선 생성 실패: ${String(err)}`, 'error');
  }
}

// 단일 90도 칼각 직각 벡터 커넥터 생성 함수 (피그잼 기본 라운딩 제거)
async function createSingleConnector(
  sourceNode: SceneNode,
  sourceMagnet: MagnetPosition,
  targetNode: SceneNode,
  targetMagnet: MagnetPosition,
  label?: string,
  colorHex?: string,
  strokeWeight?: number
): Promise<VectorNode | GroupNode> {
  let connectorStrokeWeight = strokeWeight || 1.5;
  let connectorStrokeColor: RGB = colorHex ? hexToRgbColor(colorHex) : { r: 0.18, g: 0.18, b: 0.22 };

  if (!colorHex && 'strokes' in sourceNode && Array.isArray(sourceNode.strokes) && sourceNode.strokes.length > 0) {
    const firstStroke = sourceNode.strokes[0];
    if (firstStroke.type === 'SOLID') {
      connectorStrokeColor = firstStroke.color;
    }
  }

  // 커스텀 90도 직각 벡터 커넥터 생성
  return await createOrthogonalVectorConnector(
    sourceNode,
    sourceMagnet,
    targetNode,
    targetMagnet,
    {
      strokeWeight: connectorStrokeWeight,
      strokeColor: connectorStrokeColor,
      label,
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
    }
  );
}

// 스마트 자동 직각 연결 (2개: 최단 방향 직각 연결 / 3개 이상: 캔버스 흐름에 따른 순차 연속 체인 연결 1->2->3...)
async function autoConnectSelected(label?: string) {
  try {
    const rawSelection = [...figma.currentPage.selection];
    if (rawSelection.length < 2) {
      notify('연결할 노드를 2개 이상 선택해 주세요.', 'warning');
      return;
    }

    // 중복 제거 및 플로우 노드 매핑
    const nodesMap = new Map<string, SceneNode>();
    for (const n of rawSelection) {
      const flow = findFlowNode(n) || n;
      nodesMap.set(flow.id, flow);
    }
    const nodes = Array.from(nodesMap.values());
    if (nodes.length < 2) {
      notify('서로 다른 노드를 2개 이상 선택해 주세요.', 'warning');
      return;
    }

    await loadRequiredFonts();

    // 1. 2개 선택인 경우: 기존과 동일하게 최단 방향으로 직각 연결
    if (nodes.length === 2) {
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;

      let sourceMagnet: MagnetPosition = 'RIGHT';
      let targetMagnet: MagnetPosition = 'LEFT';

      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx >= 0) {
          sourceMagnet = 'RIGHT';
          targetMagnet = 'LEFT';
        } else {
          sourceMagnet = 'LEFT';
          targetMagnet = 'RIGHT';
        }
      } else {
        if (dy >= 0) {
          sourceMagnet = 'BOTTOM';
          targetMagnet = 'TOP';
        } else {
          sourceMagnet = 'TOP';
          targetMagnet = 'BOTTOM';
        }
      }

      const conn = await createSingleConnector(sourceNode, sourceMagnet, targetNode, targetMagnet, label);
      figma.currentPage.selection = [conn];
      handleSelectionChange();
      notify(`칼각 직각 연결 완료${label ? ` (라벨: "${label}")` : ''}`, 'success');
      return;
    }

    // 2. 3개 이상 선택인 경우: 캔버스 배치 좌표(가로 흐름 vs 세로 흐름)에 따라 순차 정렬 후 연속 체인 연결 (1->2->3...)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }

    const spanX = maxX - minX;
    const spanY = maxY - minY;

    if (spanX >= spanY) {
      // 주로 가로 방향 배치: 좌->우 X좌표 오름차순 정렬
      nodes.sort((a, b) => a.x - b.x);
    } else {
      // 주로 세로 방향 배치: 상->하 Y좌표 오름차순 정렬
      nodes.sort((a, b) => a.y - b.y);
    }

    const createdConnectors: (VectorNode | GroupNode)[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const src = nodes[i];
      const tgt = nodes[i + 1];

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;

      let srcMagnet: MagnetPosition = 'RIGHT';
      let tgtMagnet: MagnetPosition = 'LEFT';

      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx >= 0) {
          srcMagnet = 'RIGHT';
          tgtMagnet = 'LEFT';
        } else {
          srcMagnet = 'LEFT';
          tgtMagnet = 'RIGHT';
        }
      } else {
        if (dy >= 0) {
          srcMagnet = 'BOTTOM';
          tgtMagnet = 'TOP';
        } else {
          srcMagnet = 'TOP';
          tgtMagnet = 'BOTTOM';
        }
      }

      // 라벨이 입력된 경우 첫 번째 연결선에 표시
      const lineLabel = (i === 0 && label) ? label : undefined;
      const conn = await createSingleConnector(src, srcMagnet, tgt, tgtMagnet, lineLabel);
      createdConnectors.push(conn);
    }

    figma.currentPage.selection = createdConnectors;
    handleSelectionChange();
    notify(`⚡ 총 ${nodes.length}개 노드가 칼각 직각 순차 연결되었습니다 (${createdConnectors.length}개 연결선).`, 'success');
  } catch (err) {
    notify(`순차 자동 연결 실패: ${String(err)}`, 'error');
  }
}

// 커넥터(선) 중앙 텍스트 수정 기능
async function updateConnectorLabel(connectorId: string, label: string) {
  try {
    let node = figma.getNodeById(connectorId);
    if (!node || node.type !== 'CONNECTOR') {
      const selection = figma.currentPage.selection;
      if (selection.length > 0 && selection[0].type === 'CONNECTOR') {
        node = selection[0];
      }
    }

    if (!node || node.type !== 'CONNECTOR') {
      notify('수정할 연결선(커넥터)을 캔버스에서 선택해 주세요.', 'warning');
      return;
    }

    const conn = node as ConnectorNode;
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
      conn.text.fontName = { family: 'Inter', style: 'Medium' };
    } catch {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      conn.text.fontName = { family: 'Inter', style: 'Regular' };
    }

    conn.text.characters = label.trim();
    conn.text.fontSize = 11;

    notify(
      label.trim() ? `선 중앙 텍스트가 "${label.trim()}"(으)로 반영되었습니다!` : '선 중앙 텍스트가 지워졌습니다.',
      'success'
    );
    handleSelectionChange();
  } catch (err) {
    notify(`선 텍스트 수정 실패: ${String(err)}`, 'error');
  }
}

// 커넥터 종합 속성 업데이트 (색상, 두께, 패턴, 라우팅, 단자, 라벨)
async function updateConnectorProperties(payload: {
  connectorId: string;
  colorHex?: string;
  strokeWeight?: number;
  strokePattern?: ConnectorStrokePattern;
  routingType?: ConnectorRoutingType;
  startTerminal?: ConnectorTerminalType;
  endTerminal?: ConnectorTerminalType;
  label?: string;
  hasLabel?: boolean;
}) {
  try {
    let node = figma.getNodeById(payload.connectorId);
    if (!node) {
      const selection = figma.currentPage.selection;
      if (selection.length > 0) node = selection[0];
    }

    if (!node) {
      notify('수정할 커넥터를 찾을 수 없습니다.', 'warning');
      return;
    }

    await loadRequiredFonts();

    if (node.type === 'CONNECTOR') {
      const conn = node as ConnectorNode;

      // 1. 색상
      if (payload.colorHex) {
        conn.strokes = [{ type: 'SOLID', color: hexToRgbColor(payload.colorHex) }];
      }

      // 2. 두께
      if (typeof payload.strokeWeight === 'number') {
        conn.strokeWeight = payload.strokeWeight;
      }

      // 3. 선 스타일
      if (payload.strokePattern === 'DASHED') {
        conn.dashPattern = [4, 4];
      } else if (payload.strokePattern === 'DOTTED') {
        conn.dashPattern = [1.5, 3];
      } else {
        conn.dashPattern = [];
      }

      // 4. 라우팅
      if (payload.routingType === 'STRAIGHT') {
        conn.connectorLineType = 'STRAIGHT';
      } else {
        conn.connectorLineType = 'ELBOWED';
      }

      // 5. 단자 Cap
      const mapCap = (term?: ConnectorTerminalType): ConnectorStrokeCap => {
        switch (term) {
          case 'ARROW':
            return 'ARROW_EQUILATERAL';
          case 'DIAMOND':
            return 'DIAMOND_FILLED';
          case 'CIRCLE':
            return 'CIRCLE_FILLED';
          default:
            return 'NONE';
        }
      };
      conn.connectorStartStrokeCap = mapCap(payload.startTerminal);
      conn.connectorEndStrokeCap = mapCap(payload.endTerminal);

      // 6. 라벨
      if (payload.hasLabel && payload.label !== undefined) {
        if (conn.text) {
          await safeSetCharacters(conn.text, payload.label.trim());
        }
      } else if (payload.hasLabel === false && conn.text) {
        await safeSetCharacters(conn.text, '');
      }
    } else {
      // 커스텀 직각 벡터 커넥터 (그룹 또는 벡터)
      let vectorNode: VectorNode | null = null;
      if (node.type === 'VECTOR') {
        vectorNode = node as VectorNode;
      } else if ('findOne' in node) {
        vectorNode = (node as GroupNode).findOne((n) => n.type === 'VECTOR') as VectorNode | null;
      }

      const rgb = payload.colorHex ? hexToRgbColor(payload.colorHex) : undefined;

      if (vectorNode) {
        if (rgb) {
          vectorNode.strokes = [{ type: 'SOLID', color: rgb }];
        }
        if (typeof payload.strokeWeight === 'number') {
          vectorNode.strokeWeight = payload.strokeWeight;
        }
        if (payload.strokePattern === 'DASHED') {
          vectorNode.dashPattern = [4, 4];
        } else if (payload.strokePattern === 'DOTTED') {
          vectorNode.dashPattern = [1.5, 3];
        } else {
          vectorNode.dashPattern = [];
        }
        if (payload.endTerminal === 'ARROW') {
          vectorNode.strokeCap = 'ARROW_EQUILATERAL';
        } else {
          vectorNode.strokeCap = 'NONE';
        }
      }

      // 라벨 처리
      let labelFrame: FrameNode | null = null;
      if (node.type === 'GROUP') {
        labelFrame = (node as GroupNode).findOne(
          (n) => n.name === 'ConnectorLabel' || n.getPluginData('is_connector_label') === 'true'
        ) as FrameNode | null;
      }

      if (payload.hasLabel && payload.label) {
        node.setPluginData('connector_label', payload.label.trim());
        if (labelFrame) {
          labelFrame.visible = true;
          const textNode = labelFrame.findOne((n) => n.type === 'TEXT') as TextNode | null;
          if (textNode) {
            await safeSetCharacters(textNode, payload.label.trim());
            if (rgb) textNode.fills = [{ type: 'SOLID', color: rgb }];
          }
        }
      } else if (payload.hasLabel === false) {
        node.setPluginData('connector_label', '');
        if (labelFrame) {
          labelFrame.visible = false;
        }
      }

      if (payload.colorHex) node.setPluginData('connector_color', payload.colorHex);
      if (payload.strokeWeight) node.setPluginData('connector_weight', String(payload.strokeWeight));
      if (payload.strokePattern) node.setPluginData('connector_pattern', payload.strokePattern);
      if (payload.routingType) node.setPluginData('connector_routing', payload.routingType);
      if (payload.startTerminal) node.setPluginData('start_terminal', payload.startTerminal);
      if (payload.endTerminal) node.setPluginData('end_terminal', payload.endTerminal);
    }

    notify('커넥터 옵션이 성공적으로 수정되었습니다.', 'success');
    handleSelectionChange();
  } catch (err) {
    notify(`커넥터 수정 실패: ${String(err)}`, 'error');
  }
}

// 커넥터 선 형태(직각 ELBOWED / 직선 STRAIGHT) 변경 기능
async function setConnectorLineType(connectorId?: string, lineType: 'ELBOWED' | 'STRAIGHT' = 'ELBOWED') {
  try {
    let node: SceneNode | null = null;
    if (connectorId) {
      node = figma.getNodeById(connectorId) as SceneNode | null;
    }
    if (!node || node.type !== 'CONNECTOR') {
      const selection = figma.currentPage.selection;
      if (selection.length > 0 && selection[0].type === 'CONNECTOR') {
        node = selection[0];
      }
    }

    if (!node || node.type !== 'CONNECTOR') {
      notify('변경할 연결선(커넥터)을 캔버스에서 선택해 주세요.', 'warning');
      return;
    }

    const conn = node as ConnectorNode;
    conn.connectorLineType = lineType;
    notify(
      lineType === 'ELBOWED' ? '📐 연결선이 [직각(Elbowed)]으로 변경되었습니다.' : '📏 연결선이 [직선(Straight)]으로 변경되었습니다.',
      'success'
    );
    handleSelectionChange();
  } catch (err) {
    notify(`연결선 형태 변경 실패: ${String(err)}`, 'error');
  }
}

// 캔버스 내 모든 연결선을 직각(ELBOWED)으로 일괄 변환하는 기능
async function convertAllConnectorsToElbowed() {
  try {
    const connectors = figma.currentPage.findAll((n) => n.type === 'CONNECTOR') as ConnectorNode[];
    if (connectors.length === 0) {
      notify('캔버스에 변환할 연결선이 없습니다.', 'info');
      return;
    }

    let convertedCount = 0;
    for (const conn of connectors) {
      if (conn.connectorLineType !== 'ELBOWED') {
        conn.connectorLineType = 'ELBOWED';
        convertedCount++;
      }
    }

    if (convertedCount > 0) {
      notify(`⚡ 총 ${convertedCount}개의 연결선을 모두 [직각(Elbowed)]으로 일괄 변환했습니다!`, 'success');
    } else {
      notify(`이미 모든 연결선(${connectors.length}개)이 [직각(Elbowed)] 상태입니다.`, 'info');
    }
    handleSelectionChange();
  } catch (err) {
    notify(`연결선 일괄 변환 실패: ${String(err)}`, 'error');
  }
}

// ----------------------------------------------------
// 4. 노드 테마 전환 토글 (Light <-> Dark)
// ----------------------------------------------------
async function toggleNodeTheme(nodeId: string) {
  let target = figma.getNodeById(nodeId);
  const flowParent = findFlowNode(target);
  const node = flowParent || (target as FrameNode | null);

  if (!node || node.getPluginData('is_flow_node') !== 'true') return;

  const currentTheme = node.getPluginData('node_theme') === 'dark' ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  await updateFlowNode({
    nodeId: node.id,
    title: node.getPluginData('node_title') || node.name,
    description: node.getPluginData('node_desc') || '',
    tag: node.getPluginData('node_tag') || 'p1',
    theme: newTheme,
    figmaLink: node.getPluginData('figma_link'),
    figmaFrameId: node.getPluginData('figma_frame_id'),
  });
}

// ----------------------------------------------------
// 5. 상태 뱃지 및 설정 저장
// ----------------------------------------------------
function collectStatusItems(): FrameStatusItem[] {
  const nodes = figma.currentPage.findAll((node) => {
    return Boolean(node.getPluginData('workflow_status'));
  });

  return nodes.map((node) => {
    const status = node.getPluginData('workflow_status') as WorkflowStatus;
    if (node.type === 'FRAME' && node.getPluginData('is_flow_node') === 'true') {
      const frame = node as FrameNode;
      const statusBadge = frame.children.find(
        (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;
      if (statusBadge && statusBadge.y <= 0) {
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = frame.width - statusBadge.width - 10;
        statusBadge.y = frame.height - statusBadge.height - 10;
      }
    }
    return {
      id: node.id,
      name: node.name,
      status: status || 'draft',
      x: Math.round(node.x),
      y: Math.round(node.y),
    };
  });
}

function syncStatusList() {
  const items = collectStatusItems();
  postToUI({ type: 'STATUS_LIST_UPDATED', items });
}

// 상태 뱃지 적용 (노드 카드 내부 헤더에 일체형 직각 알약으로 부착)
async function applyStatusToSelected(status: WorkflowStatus) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    notify('상태를 지정할 요소를 1개 이상 선택해 주세요.', 'warning');
    return;
  }

  await loadRequiredFonts();
  const cfg = STATUS_CONFIG[status];

  for (const rawNode of selection) {
    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode);

    // 구형 쉐이프 노드인 경우 직각 프레임 카드로 자동 마이그레이션
    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }

    if (flowNode.type === 'FRAME') {
      const card = flowNode as FrameNode;
      card.clipsContent = false;
      card.setPluginData('workflow_status', status);

      // 1. 기존 Header 행 안에 남아있던 구형 상태 뱃지가 있다면 탐색하여 card로 분리
      const headerRow = card.children.find(
        (c) => c.name === 'Header' || (c.type === 'FRAME' && (c as FrameNode).layoutMode === 'HORIZONTAL')
      ) as FrameNode | undefined;

      let oldBadgeInHeader: FrameNode | undefined;
      if (headerRow) {
        oldBadgeInHeader = headerRow.children.find(
          (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
        ) as FrameNode | undefined;
      }

      // 2. card 직속 상태 뱃지 탐색 또는 신규 생성
      let statusBadge = card.children.find(
        (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;

      if (!statusBadge && oldBadgeInHeader) {
        statusBadge = oldBadgeInHeader;
        card.appendChild(statusBadge);
      }

      if (!statusBadge) {
        statusBadge = figma.createFrame();
        statusBadge.name = 'StatusBadge';
        statusBadge.layoutMode = 'HORIZONTAL';
        statusBadge.primaryAxisSizingMode = 'AUTO';
        statusBadge.counterAxisSizingMode = 'AUTO';
        statusBadge.primaryAxisAlignItems = 'CENTER';
        statusBadge.counterAxisAlignItems = 'CENTER';
        statusBadge.paddingLeft = 7;
        statusBadge.paddingRight = 7;
        statusBadge.paddingTop = 3;
        statusBadge.paddingBottom = 3;
        statusBadge.cornerRadius = 0; // 완전 직각 알약
        statusBadge.setPluginData('is_status_badge', 'true');

        const badgeText = figma.createText();
        badgeText.name = 'StatusText';
        badgeText.fontName = { family: 'Inter', style: 'Bold' };
        badgeText.fontSize = 9;
        badgeText.textAutoResize = 'WIDTH_AND_HEIGHT';
        statusBadge.appendChild(badgeText);

        card.appendChild(statusBadge);
      }

      statusBadge.fills = [{ type: 'SOLID', color: cfg.color }];
      const textNode = statusBadge.children.find((c) => c.type === 'TEXT') as TextNode;
      if (textNode) {
        await safeSetCharacters(textNode, cfg.label.toUpperCase());
        textNode.fills = [{ type: 'SOLID', color: cfg.textColor }];
      }

      // 3. 하단 오른쪽 박스 안쪽에 절대 위치 배치
      if (card.layoutMode !== 'NONE') {
        statusBadge.layoutPositioning = 'ABSOLUTE';
      }
      statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
      statusBadge.x = card.width - statusBadge.width - 10;
      statusBadge.y = card.height - statusBadge.height - 10;
      statusBadge.visible = true;
    }
  }

  syncStatusList();
  notify(`${selection.length}개 노드에 [${cfg.label}] 상태 뱃지가 부착되었습니다.`, 'success');
}

// 스텝 번호 부여 (노드 카드 좌상단에 일체형 직각 뱃지로 부착)
async function addStepBadges(startNumber: number = 1) {
  const rawSelection = [...figma.currentPage.selection];
  if (rawSelection.length === 0) {
    notify('스텝 번호를 매길 요소를 캔버스에서 선택해 주세요.', 'warning');
    return;
  }

  // 중복 제거 및 플로우 노드 매핑
  const nodesMap = new Map<string, FrameNode>();
  for (const n of rawSelection) {
    let flow = findFlowNode(n) || n;
    if (flow.type === 'SHAPE_WITH_TEXT') {
      flow = await convertShapeToFrameNode(flow as ShapeWithTextNode);
    }
    if (flow.type === 'FRAME') {
      nodesMap.set(flow.id, flow as FrameNode);
    }
  }

  const selection = Array.from(nodesMap.values());
  selection.sort((a, b) => a.x - b.x);
  await loadRequiredFonts();

  let currentNum = startNumber;
  for (const card of selection) {
    card.clipsContent = false;
    card.setPluginData('step_number', `${currentNum}`);

    let stepBadge = card.children.find(
      (c) => c.getPluginData('is_step_badge') === 'true' || c.name.startsWith('[Step]')
    ) as FrameNode | undefined;

    if (!stepBadge) {
      stepBadge = figma.createFrame();
      stepBadge.name = `[Step] ${currentNum}`;
      card.appendChild(stepBadge);

      if (card.layoutMode !== 'NONE') {
        stepBadge.layoutPositioning = 'ABSOLUTE';
      }
      stepBadge.x = -8;
      stepBadge.y = -8;
      stepBadge.resize(24, 24);
      stepBadge.primaryAxisSizingMode = 'FIXED';
      stepBadge.counterAxisSizingMode = 'FIXED';
      stepBadge.cornerRadius = 0; // 완전 직각
      stepBadge.layoutMode = 'HORIZONTAL';
      stepBadge.primaryAxisAlignItems = 'CENTER';
      stepBadge.counterAxisAlignItems = 'CENTER';
      stepBadge.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.14 } }];
      stepBadge.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      stepBadge.strokeWeight = 1.5;
      stepBadge.setPluginData('is_step_badge', 'true');
      stepBadge.visible = true;

      const numText = figma.createText();
      numText.name = 'NumText';
      numText.fontName = { family: 'Inter', style: 'Bold' };
      numText.fontSize = 11;
      numText.textAutoResize = 'WIDTH_AND_HEIGHT';
      numText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      stepBadge.appendChild(numText);
    } else {
      card.appendChild(stepBadge);
      if (card.layoutMode !== 'NONE') {
        stepBadge.layoutPositioning = 'ABSOLUTE';
      }
      stepBadge.x = -8;
      stepBadge.y = -8;
      stepBadge.visible = true;
    }

    stepBadge.name = `[Step] ${currentNum}`;
    const numText = stepBadge.children.find((c) => c.type === 'TEXT') as TextNode;
    if (numText) {
      await safeSetCharacters(numText, `${currentNum}`);
    }

    currentNum++;
  }

  notify(`${selection.length}개 노드에 일체형 스텝 번호가 부여되었습니다.`, 'success');
}

// 스텝 번호 제거 기능
async function removeStepBadges() {
  const rawSelection = [...figma.currentPage.selection];
  if (rawSelection.length === 0) {
    notify('스텝 번호를 제거할 요소를 캔버스에서 선택해 주세요.', 'warning');
    return;
  }

  let removedCount = 0;
  for (const n of rawSelection) {
    let flow = findFlowNode(n) || n;
    if (flow.type === 'SHAPE_WITH_TEXT') {
      flow = await convertShapeToFrameNode(flow as ShapeWithTextNode);
    }
    if (flow.type === 'FRAME') {
      const card = flow as FrameNode;
      card.setPluginData('step_number', '');
      const stepBadges = card.children.filter((c) => c.getPluginData('is_step_badge') === 'true');
      for (const badge of stepBadges) {
        badge.remove();
        removedCount++;
      }
    }
  }

  if (removedCount > 0) {
    notify(`${removedCount}개 노드의 스텝 번호가 제거되었습니다.`, 'info');
  } else {
    notify('선택한 노드에 스텝 번호가 존재하지 않습니다.', 'info');
  }
}

function focusFrame(nodeId: string) {
  const node = figma.getNodeById(nodeId);
  if (!node || !('x' in node)) {
    notify('해당 노드를 찾을 수 없습니다.', 'warning');
    return;
  }

  const sceneNode = node as SceneNode;
  figma.currentPage.selection = [sceneNode];
  figma.viewport.scrollAndZoomIntoView([sceneNode]);
}

async function loadSavedSettings() {
  const token = (await figma.clientStorage.getAsync('figma_token')) || '';
  const fileUrl = (await figma.clientStorage.getAsync('figma_file_url')) || '';
  postToUI({
    type: 'SETTINGS_LOADED',
    token,
    fileUrl,
  });
}

async function saveSettings(token: string, fileUrl: string) {
  await figma.clientStorage.setAsync('figma_token', token);
  await figma.clientStorage.setAsync('figma_file_url', fileUrl);
  notify('피그마 연동 설정이 안전하게 저장되었습니다.', 'success');
}

// ----------------------------------------------------
// 현재 피그마 파일의 모든 Variables(UI3 디자인 토큰) 자동 추출
// ----------------------------------------------------
async function extractUI3Variables() {
  try {
    if (!('variables' in figma) || !figma.variables) {
      notify('이 피그마 버전에서는 Variables API를 지원하지 않습니다.', 'warning');
      return;
    }

    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();

    if (variables.length === 0) {
      notify('현재 열린 파일에 등록된 로컬 변수(Variables)가 없습니다. UI3 Kit 파일 탭에서 실행해 주세요.', 'warning');
      return;
    }

    // 변수 맵 구성
    const varMap = new Map<string, Variable>();
    for (const v of variables) {
      varMap.set(v.id, v);
    }

    let cssLight = `/* ========================================================\n   Figma UI3 Variables (Total: ${variables.length})\n   Collections: ${collections.map((c) => c.name).join(', ')}\n   ======================================================== */\n:root {\n`;
    let cssDark = `\n/* Dark Mode Overrides */\n.figma-dark, [data-theme="dark"] {\n`;

    let lightCount = 0;
    let darkCount = 0;

    for (const v of variables) {
      const col = collections.find((c) => c.id === v.variableCollectionId);
      const colName = col ? col.name : 'Tokens';

      // CSS 변수명 정규화 (예: "bg/default" -> "--figma-bg-default")
      const rawName = v.name.replace(/[\/\s_]+/g, '-').toLowerCase();
      const cssVarName = rawName.startsWith('--') ? rawName : `--figma-${rawName}`;

      if (!col || col.modes.length === 0) continue;

      // 모드 찾기 (Light/Default 모드 vs Dark 모드)
      const defaultMode = col.modes[0];
      const darkModes = col.modes.filter((m) =>
        m.name.toLowerCase().includes('dark') || m.name.toLowerCase().includes('night')
      );
      const darkMode = darkModes.length > 0 ? darkModes[0] : (col.modes.length > 1 ? col.modes[1] : null);

      // 값 추출 헬퍼 (Alias 재귀 해결)
      const resolveVal = (modeId: string, depth = 0): any => {
        if (depth > 5) return null;
        const raw = v.valuesByMode[modeId];
        if (raw && typeof raw === 'object' && 'type' in raw && raw.type === 'VARIABLE_ALIAS') {
          const targetVar = varMap.get(raw.id);
          if (targetVar) {
            return resolveValFromVar(targetVar, modeId, depth + 1);
          }
        }
        return raw;
      };

      const resolveValFromVar = (targetVar: Variable, modeId: string, depth: number): any => {
        const raw = targetVar.valuesByMode[modeId] || Object.values(targetVar.valuesByMode)[0];
        if (raw && typeof raw === 'object' && 'type' in raw && raw.type === 'VARIABLE_ALIAS') {
          const next = varMap.get(raw.id);
          if (next) return resolveValFromVar(next, modeId, depth + 1);
        }
        return raw;
      };

      const formatVal = (val: any, type: VariableResolvedDataType): string | null => {
        if (type === 'COLOR') {
          if (val && typeof val === 'object' && 'r' in val) {
            const r = Math.round(val.r * 255);
            const g = Math.round(val.g * 255);
            const b = Math.round(val.b * 255);
            const a = typeof val.a === 'number' ? val.a : 1;
            return a < 1 ? `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(2))})` : `rgb(${r}, ${g}, ${b})`;
          }
        } else if (type === 'FLOAT' && typeof val === 'number') {
          return `${val}px`;
        } else if (type === 'STRING' && typeof val === 'string') {
          return `"${val}"`;
        } else if (type === 'BOOLEAN') {
          return val ? '1' : '0';
        }
        return null;
      };

      // 1. 라이트 / 기본 모드 값
      const defaultValRaw = resolveVal(defaultMode.modeId);
      const defaultFormatted = formatVal(defaultValRaw, v.resolvedType);
      if (defaultFormatted) {
        cssLight += `  ${cssVarName}: ${defaultFormatted}; /* [${colName}] */\n`;
        lightCount++;
      }

      // 2. 다크 모드 값 (다른 경우에만)
      if (darkMode) {
        const darkValRaw = resolveVal(darkMode.modeId);
        const darkFormatted = formatVal(darkValRaw, v.resolvedType);
        if (darkFormatted && darkFormatted !== defaultFormatted) {
          cssDark += `  ${cssVarName}: ${darkFormatted};\n`;
          darkCount++;
        }
      }
    }

    cssLight += `}\n`;
    cssDark += `}\n`;

    const fullCss = `${cssLight}${darkCount > 0 ? cssDark : ''}`;

    postToUI({
      type: 'UI3_VARIABLES_EXTRACTED',
      css: fullCss,
      count: lightCount,
      collections: collections.map((c) => c.name),
    });

    notify(`🎨 총 ${lightCount}개의 UI3 디자인 토큰이 추출되었습니다!`, 'success');
  } catch (err) {
    notify(`UI3 변수 추출 실패: ${String(err)}`, 'error');
  }
}

// ----------------------------------------------------
// UI 메시지 수신 라우터
// ----------------------------------------------------
figma.ui.onmessage = async (msg: PluginAction) => {
  switch (msg.type) {
    case 'CREATE_FLOW_NODE':
      await createFlowNode(msg.payload);
      break;
    case 'UPDATE_FLOW_NODE':
      await updateFlowNode(msg.payload);
      break;
    case 'CONNECT_POINTS':
      await connectPoints(msg.payload);
      break;
    case 'AUTO_CONNECT_SELECTED':
      await autoConnectSelected(msg.label);
      break;
    case 'UPDATE_CONNECTOR_LABEL':
      await updateConnectorLabel(msg.connectorId, msg.label);
      break;
    case 'UPDATE_CONNECTOR_PROPERTIES':
      await updateConnectorProperties(msg.payload);
      break;
    case 'SET_CONNECTOR_LINE_TYPE':
      await setConnectorLineType(msg.connectorId, msg.lineType);
      break;
    case 'CONVERT_ALL_CONNECTORS_TO_ELBOWED':
      await convertAllConnectorsToElbowed();
      break;
    case 'EXTRACT_UI3_VARIABLES':
      await extractUI3Variables();
      break;
    case 'TOGGLE_NODE_THEME':
      await toggleNodeTheme(msg.nodeId);
      break;
    case 'SET_STATUS':
      await applyStatusToSelected(msg.status);
      break;
    case 'ADD_STEP_BADGES':
      await addStepBadges(msg.startNumber || 1);
      break;
    case 'REMOVE_STEP_BADGES':
      await removeStepBadges();
      break;
    case 'GET_STATUS_LIST':
      syncStatusList();
      break;
    case 'FOCUS_FRAME':
      focusFrame(msg.nodeId);
      break;
    case 'RESIZE_NODE':
      await resizeNode(msg.nodeId, msg.width, msg.height);
      break;
    case 'SAVE_SETTINGS':
      await saveSettings(msg.token, msg.fileUrl);
      break;
    case 'LOAD_SETTINGS':
      await loadSavedSettings();
      break;
    case 'CLOSE_PLUGIN':
      figma.closePlugin();
      break;
    case 'UNDO':
      notify('캔버스에서 Cmd+Z (Mac) 또는 Ctrl+Z (Windows)로 작업을 되돌릴 수 있습니다.', 'info');
      break;
    case 'REDO':
      notify('캔버스에서 Cmd+Shift+Z (Mac) 또는 Ctrl+Y (Windows)로 다시 실행할 수 있습니다.', 'info');
      break;
    case 'RESIZE_WINDOW': {
      const targetW = msg.width || 360;
      const targetH = Math.max(200, Math.min(1200, Math.round(msg.height)));
      figma.ui.resize(targetW, targetH);
      break;
    }
    case 'INIT':
      handleSelectionChange();
      syncStatusList();
      await loadSavedSettings();
      break;
  }
};


// 캔버스 변경 감지: 신규 커넥터 직각 포맷팅, 노드 이동 시 커넥터 실시간 추적, 기즈모 조작 차단
figma.on('documentchange', async (event) => {
  const movedNodeIds = new Set<string>();

  for (const change of event.documentChanges) {
    if (change.type === 'CREATE') {
      const node = figma.getNodeById(change.id);
      if (node && node.type === 'CONNECTOR') {
        const conn = node as ConnectorNode;
        if (conn.connectorLineType !== 'ELBOWED') {
          conn.connectorLineType = 'ELBOWED';
        }
        conn.strokeWeight = 1.5;
        conn.connectorEndStrokeCap = 'ARROW_EQUILATERAL';
      }
    } else if (change.type === 'PROPERTY_CHANGE') {
      // 1. 노드 이동(x, y) 또는 크기 변경(width, height) 감지 ➔ 연결된 커스텀 직각 커넥터 실시간 추적 갱신
      if (
        change.properties.includes('x') ||
        change.properties.includes('y') ||
        change.properties.includes('width') ||
        change.properties.includes('height')
      ) {
        movedNodeIds.add(change.id);
      }

      // 2. 캔버스에서 기즈모 드래그로 사이즈 변경이 시도될 경우 고정된 규격으로 즉시 원복 (기즈모 조작 완전 차단)
      if (change.properties.includes('width') || change.properties.includes('height')) {
        const node = figma.getNodeById(change.id);
        if (!node) continue;
        const flowNode = findFlowNode(node);
        if (flowNode && flowNode.type === 'FRAME' && flowNode.getPluginData('is_flow_node') === 'true') {
          const frame = flowNode as FrameNode;
          const savedW = parseInt(frame.getPluginData('node_width'), 10);
          const savedH = parseInt(frame.getPluginData('node_height'), 10);
          if (savedW && savedH && (Math.round(frame.width) !== savedW || Math.round(frame.height) !== savedH)) {
            frame.minWidth = null;
            frame.maxWidth = null;
            frame.minHeight = null;
            frame.maxHeight = null;

            frame.resize(savedW, savedH);
            frame.primaryAxisSizingMode = 'FIXED';
            frame.counterAxisSizingMode = 'FIXED';

            frame.minWidth = savedW;
            frame.maxWidth = savedW;
            frame.minHeight = savedH;
            frame.maxHeight = savedH;
          }
        }
      }
    }
  }

  // 연결된 커스텀 직각 커넥터들 실시간 동기화
  if (movedNodeIds.size > 0) {
    await syncConnectorsForMovedNodes(movedNodeIds);
  }
});

// 최초 실행 시 현재 상태 동기화, 커넥터 레지스트리 캐시 구축 및 설정 로드
refreshConnectorRegistry();
handleSelectionChange();
syncStatusList();
loadSavedSettings();
