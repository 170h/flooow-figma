export type WorkflowStatus =
  | 'draft'
  | 'wireframe'
  | 'in_progress'
  | 'in_review'
  | 'revision'
  | 'approved'
  | 'ready_for_dev'
  | 'done';

export interface StatusMeta {
  label: string;
  color: { r: number; g: number; b: number };
  textColor: { r: number; g: number; b: number };
  hex: string;
}

export const STATUS_CONFIG: Record<WorkflowStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    color: { r: 0.612, g: 0.639, b: 0.686 }, // #9CA3AF
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#9CA3AF',
  },
  wireframe: {
    label: 'Wireframe',
    color: { r: 0.42, g: 0.447, b: 0.502 }, // #6B7280
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#6B7280',
  },
  in_progress: {
    label: 'In Progress',
    color: { r: 0.231, g: 0.51, b: 0.965 }, // #3B82F6
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#3B82F6',
  },
  in_review: {
    label: 'In Review',
    color: { r: 1, g: 0.62, b: 0.259 }, // #FF9E42
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#FF9E42',
  },
  revision: {
    label: 'Revision',
    color: { r: 0.949, g: 0.282, b: 0.133 }, // #F24822
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#F24822',
  },
  approved: {
    label: 'Approved',
    color: { r: 0.545, g: 0.361, b: 0.965 }, // #8B5CF6
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#8B5CF6',
  },
  ready_for_dev: {
    label: 'Ready for Dev',
    color: { r: 0.086, g: 0.639, b: 0.29 }, // #16A34A
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#16A34A',
  },
  done: {
    label: 'Done',
    color: { r: 0.216, g: 0.255, b: 0.318 }, // #374151
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#374151',
  },
};

export interface FrameStatusItem {
  id: string;
  name: string;
  status: WorkflowStatus;
  x: number;
  y: number;
}

export type MagnetPosition = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';

// Figma UI3 6종 노드 분류 타입 및 레거시 호환 타입
export type DiagramNodeType =
  | 'Screen'
  | 'Process'
  | 'Circle'
  | 'Decision'
  | 'Terminator'
  | 'Branch'
  // 레거시 호환 및 특수 타입
  | 'Connector'
  | 'Square'
  | 'Rectangle'
  | 'Diamond'
  | 'Pill'
  | 'Action'
  | 'System'
  | 'Database'
  | 'True'
  | 'False'
  | 'Error'
  | 'Capsule'
  | 'Bridge';

/**
 * 다양한 노드 타입 및 레거시 타입을 6종 표준 타입으로 정규화합니다.
 */
export function normalizeNodeType(type?: string): DiagramNodeType {
  if (!type) return 'Screen';
  const clean = String(type).trim().toLowerCase();
  switch (clean) {
    case 'screen':
      return 'Screen';
    case 'process':
    case 'square':
    case 'rectangle':
    case 'action':
    case 'error':
    case 'true':
    case 'false':
      return 'Process';
    case 'circle':
    case 'connector':
    case 'system':
    case 'database':
      return 'Circle';
    case 'decision':
    case 'diamond':
      return 'Decision';
    case 'terminator':
    case 'pill':
    case 'capsule':
      return 'Terminator';
    case 'branch':
    case 'subflow':
      return 'Branch';
    case 'bridge':
      return 'Branch';
    default:
      return (type as DiagramNodeType) || 'Screen';
  }
}

/**
 * 노드 타입별 도형 규격 및 디스크립션 허용 여부 명세
 */
export interface NodeTypeShapeSpec {
  width: number;
  height: number;
  cornerRadius?: number;
  allowDescription: boolean;
  allowFigmaLink: boolean;
}

export const NODE_TYPE_SHAPE_SPECS: Record<string, NodeTypeShapeSpec> = {
  Screen: { width: 250, height: 90, cornerRadius: 0, allowDescription: true, allowFigmaLink: true },
  Process: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Circle: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
  Decision: { width: 140, height: 140, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Terminator: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
  Branch: { width: 180, height: 90, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  // 레거시 별칭 호환
  Connector: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
  Square: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Rectangle: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Diamond: { width: 140, height: 140, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Pill: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
  Action: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  System: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
  Database: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
  Capsule: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
  Bridge: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
};

/**
 * 노드 분류 4대 범주 (Option Capability Matrix 기준)
 * - Screen: 화면 카드
 * - Shape: 도형 노드 (Process, Decision, Terminator)
 * - Bridge: 연결/분기 노드 (Connector, Branch, Bridge)
 * - FigmaObject: 플로우 노드가 아닌 일반 Figma 객체
 */
export type NodeCategory = 'Screen' | 'Shape' | 'Bridge' | 'FigmaObject';

/**
 * 플러그인에서 제공하는 제어 옵션 종류
 */
export type PluginOption =
  | 'title'
  | 'description'
  | 'status'
  | 'stepBadge'
  | 'elevation'
  | 'size'
  | 'figmaLink'
  | 'style';

/**
 * Option Capability Matrix
 * 각 노드 범주별 옵션 지원 여부 단일 소스 오브 트루스
 */
export const OPTION_CAPABILITY_MATRIX: Record<NodeCategory, Record<PluginOption, boolean>> = {
  Screen: {
    title: true,
    description: true,
    status: true,
    stepBadge: true,
    elevation: true,
    size: true,
    figmaLink: true,
    style: true,
  },
  Shape: {
    title: true,
    description: false,
    status: false,
    stepBadge: true,
    elevation: true,
    size: false,
    figmaLink: false,
    style: true,
  },
  Bridge: {
    title: true,
    description: false,
    status: false,
    stepBadge: false,
    elevation: false,
    size: false,
    figmaLink: false,
    style: true,
  },
  FigmaObject: {
    title: false,
    description: false,
    status: false,
    stepBadge: false,
    elevation: false,
    size: false,
    figmaLink: false,
    style: false,
  },
};

/**
 * 노드 객체(UI NodeInfo 또는 Core SceneNode)의 최종 타입을 기반으로
 * 4대 범주('Screen' | 'Shape' | 'Bridge' | 'FigmaObject') 중 하나를 판별합니다.
 */
export function getNodeCategory(node: any): NodeCategory {
  if (!node) return 'FigmaObject';

  // 피그마 커넥터(연결선)인 경우
  if (node.isConnector || node.type === 'CONNECTOR') {
    return 'FigmaObject';
  }

  // 플로우 노드 여부 검사
  const hasPluginDataFn = typeof node.getPluginData === 'function';
  const isFlowNode = Boolean(
    node.isFlowNode ||
    (hasPluginDataFn && node.getPluginData('is_flow_node') === 'true') ||
    (node.type === 'FRAME' && hasPluginDataFn && Boolean(
      node.getPluginData('node_type') ||
      node.children?.some?.((c: any) => c.name === 'Header' || c.name === 'TitleText' || (typeof c.getPluginData === 'function' && c.getPluginData('node_role') === 'title'))
    ))
  );

  // 플로우 노드가 아니고 구형 쉐이프(SHAPE_WITH_TEXT)도 아닌 경우 일반 Figma 객체
  if (!isFlowNode && node.type !== 'SHAPE_WITH_TEXT') {
    if (!node.flowNodeType) {
      return 'FigmaObject';
    }
  }

  // 현재 최종 노드 타입 추출 및 정규화
  let rawType: string | undefined = node.flowNodeType;
  if (!rawType && hasPluginDataFn) {
    rawType = node.getPluginData('node_type');
  }
  if (!rawType && node.nodeType && node.nodeType !== 'FRAME') {
    rawType = node.nodeType;
  }
  const normType = normalizeNodeType(rawType);

  switch (normType) {
    case 'Screen':
      return 'Screen';
    case 'Process':
    case 'Circle':
    case 'Connector':
    case 'Decision':
    case 'Terminator':
      return 'Shape';
    case 'Branch':
    case 'Bridge':
      return 'Bridge';
    default:
      return 'Shape';
  }
}

/**
 * 노드가 특정 옵션(Capability)을 현재 지원하는지 판별합니다.
 */
export function supportsOption(node: any, option: PluginOption): boolean {
  const category = getNodeCategory(node);
  return OPTION_CAPABILITY_MATRIX[category]?.[option] ?? false;
}

/**
 * 주어진 노드 목록에서 특정 옵션을 지원하는 노드만 필터링합니다. (실제 데이터 변경 대상 추출)
 */
export function getMutationTargets<T = any>(nodes: T[], option: PluginOption): T[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.filter((n) => supportsOption(n, option));
}

/**
 * 토글 스위치 최종 상태 4종
 * - ON: 켜짐 (보라색 배경, ON 아이콘, 섹션 펼침)
 * - OFF: 꺼짐 (회색 배경, OFF 아이콘, 섹션 접힘)
 * - MIXED_ACTIVE: 혼합 활성 (보라색 배경, '-' 아이콘, 섹션 펼침)
 * - MIXED_DISABLED: 혼합 비활성 (밝은 회색 배경, '-' 아이콘, 섹션 접힘)
 */
export type OptionSwitchState = 'ON' | 'OFF' | 'MIXED_ACTIVE' | 'MIXED_DISABLED';

export interface OptionStateResult {
  state: OptionSwitchState;
  supportedCount: number;
  unsupportedCount: number;
  supportedNodes: any[];
  unsupportedNodes: any[];
  checked: boolean;
  isMixed: boolean;
  disabled: boolean;
  isOpen: boolean;
}

/**
 * 선택된 노드 목록 전체를 분석하여 해당 옵션의 스위치 상태를 결정합니다.
 */
export function computeOptionSwitchState(
  nodes: any[],
  option: PluginOption,
  isNodeOnFn: (node: any) => boolean
): OptionStateResult {
  const validNodes = (nodes || []).filter(Boolean);
  const supportedNodes = validNodes.filter((n) => supportsOption(n, option));
  const unsupportedNodes = validNodes.filter((n) => !supportsOption(n, option));

  if (supportedNodes.length === 0) {
    return {
      state: 'OFF',
      supportedCount: 0,
      unsupportedCount: unsupportedNodes.length,
      supportedNodes: [],
      unsupportedNodes,
      checked: false,
      isMixed: false,
      disabled: true,
      isOpen: false,
    };
  }

  const onCount = supportedNodes.filter((n) => isNodeOnFn(n)).length;
  const offCount = supportedNodes.length - onCount;

  if (onCount === supportedNodes.length) {
    return {
      state: 'ON',
      supportedCount: supportedNodes.length,
      unsupportedCount: unsupportedNodes.length,
      supportedNodes,
      unsupportedNodes,
      checked: true,
      isMixed: false,
      disabled: false,
      isOpen: true,
    };
  }

  if (offCount === supportedNodes.length) {
    return {
      state: 'OFF',
      supportedCount: supportedNodes.length,
      unsupportedCount: unsupportedNodes.length,
      supportedNodes,
      unsupportedNodes,
      checked: false,
      isMixed: false,
      disabled: false,
      isOpen: false,
    };
  }

  return {
    state: 'MIXED_ACTIVE',
    supportedCount: supportedNodes.length,
    unsupportedCount: unsupportedNodes.length,
    supportedNodes,
    unsupportedNodes,
    checked: true,
    isMixed: true,
    disabled: false,
    isOpen: true,
  };
}

/**
 * 스크린(Screen) 노드 치수 및 코너 라운드 제약 상수
 * - 최소 크기: 49 x 49
 * - 최대 크기: 800 x 600
 * - 코너 라운드: 0 ~ 20
 */
export const SCREEN_NODE_CONSTRAINTS = {
  MIN_WIDTH: 49,
  MAX_WIDTH: 800,
  MIN_HEIGHT: 49,
  MAX_HEIGHT: 600,
  MIN_CORNER_RADIUS: 0,
  MAX_CORNER_RADIUS: 20,
  MIN_STROKE_WEIGHT: 0,
  MAX_STROKE_WEIGHT: 10,
} as const;

export const {
  MIN_WIDTH: SCREEN_MIN_WIDTH,
  MAX_WIDTH: SCREEN_MAX_WIDTH,
  MIN_HEIGHT: SCREEN_MIN_HEIGHT,
  MAX_HEIGHT: SCREEN_MAX_HEIGHT,
  MIN_CORNER_RADIUS: SCREEN_MIN_CORNER_RADIUS,
  MAX_CORNER_RADIUS: SCREEN_MAX_CORNER_RADIUS,
  MIN_STROKE_WEIGHT: SCREEN_MIN_STROKE_WEIGHT,
  MAX_STROKE_WEIGHT: SCREEN_MAX_STROKE_WEIGHT,
} = SCREEN_NODE_CONSTRAINTS;

/**
 * Screen 노드의 너비를 [49, 800] 범위로 클램핑합니다.
 */
export function clampScreenWidth(w: number): number {
  return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_WIDTH, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, w));
}

/**
 * Screen 노드의 높이를 [49, 600] 범위로 클램핑합니다.
 */
export function clampScreenHeight(h: number): number {
  return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, h));
}

/**
 * Screen 노드의 코너 라운드를 [0, 20] 범위로 클램핑합니다.
 */
export function clampScreenCornerRadius(r: number): number {
  return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS, r));
}

/**
 * 노드의 스트로크 두께를 [0, 10] 범위로 클램핑합니다.
 */
export function clampStrokeWeight(sw: number): number {
  return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_STROKE_WEIGHT, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_STROKE_WEIGHT, sw));
}


// 스텝 배지 코너 위치 및 형태
export type BadgePosition = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
export type BadgeShape = 'Square' | 'Circle' | 'RoundBox';

// 연결선 라우팅 및 단자 타입
export type ConnectorStrokePattern = 'SOLID' | 'DASHED' | 'DOTTED';
export type ConnectorRoutingType = 'ORTHOGONAL' | 'S_CURVE' | 'CURVED' | 'STRAIGHT';
export type ConnectorTerminalType =
  | 'NONE'
  | 'ARROW'
  | 'CIRCLE'
  | 'DIAMOND'
  | 'TRIANGLE_ARROW'
  | 'REVERSED_TRIANGLE_ARROW'
  | 'MIXED';

// 커넥터 라벨 박스 스타일 및 텍스트 정렬
export type ConnectorLabelBoxStyle = 'BOX' | 'CAPSULE' | 'ROUNDED_BOX' | 'LINE';
export type ConnectorLabelAlign = 'LEFT' | 'CENTER' | 'RIGHT';

export interface FlowNodePayload {
  title: string;
  description: string;
  tag?: string;
  theme?: 'light' | 'dark';
  figmaLink?: string;
  figmaFrameId?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  nodeType?: DiagramNodeType;
  elevation?: number | null;
  status?: WorkflowStatus;
  badgeNumber?: number;
  badgePosition?: BadgePosition;
  badgeShape?: BadgeShape;
  badgeColorMode?: 'White' | 'Black' | 'Style';
  colorHex?: string;
  strokeWeight?: number;
  strokeColor?: string;
  sizeMode?: 'fixed' | 'hug' | 'fit';
}

export interface ConnectPointsPayload {
  sourceNodeId: string;
  sourceMagnet: MagnetPosition;
  targetNodeId: string;
  targetMagnet: MagnetPosition;
  label?: string;
  colorHex?: string;
  strokePattern?: ConnectorStrokePattern;
  strokeWeight?: number;
  routingType?: ConnectorRoutingType;
  startTerminal?: ConnectorTerminalType;
  endTerminal?: ConnectorTerminalType;
  startOffset?: number;
  endOffset?: number;
  labelBoxStyle?: ConnectorLabelBoxStyle;
  labelAlign?: ConnectorLabelAlign;
  labelFillColor?: string;
  labelStrokeColor?: string;
  figmaLink?: string;
}

export interface ConnectChainPayload {
  orderedNodeIds: string[];
  label?: string;
  colorHex?: string;
  strokePattern?: ConnectorStrokePattern;
  strokeWeight?: number;
  routingType?: ConnectorRoutingType;
  startTerminal?: ConnectorTerminalType;
  endTerminal?: ConnectorTerminalType;
  startOffset?: number;
  endOffset?: number;
  labelBoxStyle?: ConnectorLabelBoxStyle;
  labelAlign?: ConnectorLabelAlign;
  labelFillColor?: string;
  labelStrokeColor?: string;
  figmaLink?: string;
}

export interface FigmaFrameMeta {
  id: string;
  name: string;
}

export interface FigmaPageMeta {
  id: string;
  name: string;
  frames: FigmaFrameMeta[];
}

export interface FigmaFileMeta {
  fileKey: string;
  fileName: string;
  pages: FigmaPageMeta[];
}

export interface UpdateNodePayload {
  nodeId: string;
  title: string;
  description: string;
  descriptionOn?: boolean;
  tag?: string;
  theme: 'light' | 'dark';
  figmaLink?: string;
  clearLinkCache?: boolean;
  figmaFrameId?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  nodeType?: DiagramNodeType;
  elevation?: number | null;
  status?: WorkflowStatus;
  badgeNumber?: number;
  badgePosition?: BadgePosition;
  badgeShape?: BadgeShape;
  badgeColorMode?: 'White' | 'Black' | 'Style';
  colorHex?: string;
  strokeWeight?: number;
  strokeColor?: string;
  sizeMode?: 'fixed' | 'hug' | 'fit';
}

// 피그마 디자인 프레임 정보
export interface DesignFrameItem {
  id: string;
  name: string;
  width: number;
  height: number;
  cornerRadius: number;
}

// 다중 선택(Multi Selection) 일괄 부분 업데이트 페이로드
export interface NodePatchPayload {
  nodeType?: DiagramNodeType;
  width?: number;
  height?: number;
  cornerRadius?: number;
  sizeMode?: 'fixed' | 'hug' | 'fit';
  colorHex?: string;
  strokeWeight?: number;
  strokeColor?: string;
  elevation?: number | null;
  status?: WorkflowStatus | '';
  description?: string;
  descriptionOn?: boolean;
  figmaLink?: string;
  clearLinkCache?: boolean;
  badgeNumber?: number;
  badgeCorner?: BadgePosition;
  badgeShape?: BadgeShape;
  badgeColorMode?: 'White' | 'Black' | 'Style';
  badgeOn?: boolean;
}

// 메시지 액션 타입
export type PluginAction =
  | { type: 'CREATE_FLOW_NODE'; payload: FlowNodePayload }
  | { type: 'UPDATE_FLOW_NODE'; payload: UpdateNodePayload }
  | {
      type: 'BATCH_UPDATE_FLOW_NODES';
      payload: {
        nodeIds: string[];
        patch: NodePatchPayload;
      };
    }
  | { type: 'CONNECT_POINTS'; payload: ConnectPointsPayload }
  | { type: 'CONNECT_CHAIN'; payload: ConnectChainPayload }
  | { type: 'AUTO_CONNECT_SELECTED'; label?: string }
  | { type: 'UPDATE_CONNECTOR_LABEL'; connectorId: string; label: string }
  | { type: 'TOGGLE_NODE_THEME'; nodeId: string }
  | { type: 'CREATE_CONNECTORS'; label?: string; lineStyle?: 'solid' | 'dashed' }
  | { type: 'ADD_STEP_BADGES'; startNumber?: number; corner?: string; shape?: string; colorMode?: 'White' | 'Black' | 'Style' }
  | { type: 'REMOVE_STEP_BADGES' }
  | { type: 'SET_STATUS'; status: WorkflowStatus }
  | { type: 'SET_ELEVATION'; level: number | null }
  | { type: 'GET_STATUS_LIST' }
  | { type: 'FOCUS_FRAME'; nodeId: string }
  | { type: 'GET_DESIGN_FRAMES' }
  | { type: 'CREATE_TEMPLATE'; templateType: 'user_flow' | 'screen_spec' | 'feature_roadmap' }
  | { type: 'RESIZE_NODE'; nodeId: string; width: number; height: number }
  | {
      type: 'UPDATE_CONNECTOR_PROPERTIES';
      payload: {
        connectorId: string;
        colorHex?: string;
        strokeWeight?: number;
        strokePattern?: ConnectorStrokePattern;
        routingType?: ConnectorRoutingType;
        startTerminal?: ConnectorTerminalType;
        endTerminal?: ConnectorTerminalType;
        startOffset?: number;
        endOffset?: number;
        sourceMagnet?: MagnetPosition;
        targetMagnet?: MagnetPosition;
        label?: string;
        hasLabel?: boolean;
        labelBoxStyle?: ConnectorLabelBoxStyle;
        labelAlign?: ConnectorLabelAlign;
        labelFillColor?: string;
        labelStrokeColor?: string;
        isReversed?: boolean;
      };
    }
  | { type: 'SET_CONNECTOR_LINE_TYPE'; connectorId?: string; lineType: 'ELBOWED' | 'STRAIGHT' }
  | { type: 'CONVERT_ALL_CONNECTORS_TO_ELBOWED' }
  | { type: 'EXTRACT_UI3_VARIABLES' }
  | { type: 'SAVE_SETTINGS'; token: string; fileUrl: string }
  | { type: 'LOAD_SETTINGS' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLOSE_PLUGIN' }
  | { type: 'NOTIFY'; message: string; level?: 'info' | 'success' | 'warning' | 'error' }
  | { type: 'RESIZE_WINDOW'; width?: number; height: number }
  | { type: 'INIT' };

// 연결된 커넥터 세부 정보 (방향 역전 여부 및 각 엔드포인트 마그넷)
export interface ConnectedConnectorDetail {
  id: string;
  isReversed: boolean;
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
}

// 3+ 노드 선택 시 선택 노드 간 커넥터 세부 정보
export interface MultiNodeConnectorDetail {
  id: string;
  sourceId: string;
  targetId: string;
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
}

export interface SelectedNodeInfo {
  id: string;
  name: string;
  isFlowNode: boolean;
  isConnector?: boolean;
  nodeType?: string;
  flowNodeType?: DiagramNodeType;
  title?: string;
  description?: string;
  descriptionOn?: boolean;
  tag?: string;
  theme?: 'light' | 'dark';
  figmaLink?: string;
  cachedFigmaLink?: string;
  connectorLabel?: string;
  connectorLabelOn?: boolean;
  connectorLabelBoxStyle?: ConnectorLabelBoxStyle;
  connectorLabelAlign?: ConnectorLabelAlign;
  connectorLabelFillColor?: string;
  connectorLabelStrokeColor?: string;
  connectorLineType?: 'ELBOWED' | 'STRAIGHT' | 'CURVED';
  connectorColorHex?: string;
  connectorStrokeWeight?: number;
  connectorStrokePattern?: ConnectorStrokePattern;
  x?: number;
  y?: number;
  connectorRoutingType?: ConnectorRoutingType;
  connectorStartTerminal?: ConnectorTerminalType;
  connectorEndTerminal?: ConnectorTerminalType;
  connectorStartOffset?: number;
  connectorEndOffset?: number;
  connectorSourceNodeName?: string;
  connectorTargetNodeName?: string;
  connectorSourceMagnet?: MagnetPosition;
  connectorTargetMagnet?: MagnetPosition;
  connectorIsReversed?: boolean;
  connectedNodeNames?: string[];
  width?: number;
  height?: number;
  hugHeight?: number;
  sizeMode?: 'fixed' | 'hug' | 'fit';
  status?: WorkflowStatus;
  stepNumber?: number;
  badgeCorner?: string;
  badgeShape?: string;
  badgeColorMode?: 'White' | 'Black' | 'Style';
  elevationOn?: boolean;
  elevation?: number;
  fillColorHex?: string;
  strokeColorHex?: string;
  strokeWeight?: number;
}

export type CoreToUIMessage =
  | {
      type: 'SELECTION_CHANGED';
      count: number;
      nodes: SelectedNodeInfo[];
      currentStatus?: WorkflowStatus;
      nextSuggestedTag?: string;
      flowNodeCount?: number;
      otherObjectCount?: number;
      connectorCount?: number;
      suggestedSourceMagnet?: MagnetPosition;
      suggestedTargetMagnet?: MagnetPosition;
      existingSourceMagnets?: MagnetPosition[];
      existingTargetMagnets?: MagnetPosition[];
      connectedConnectorCount?: number;
      hasExistingConnection?: boolean;
      connectedConnectorIds?: string[];
      connectedConnectors?: ConnectedConnectorDetail[];
      orderedNodeIds?: string[];
      chainTotalPairs?: number;
      chainConnectedPairs?: number;
      chainMissingPairs?: number;
      multiNodeConnectors?: MultiNodeConnectorDetail[];
    }
  | {
      type: 'STATUS_LIST_UPDATED';
      items: FrameStatusItem[];
    }
  | {
      type: 'DESIGN_FRAMES_LOADED';
      frames: DesignFrameItem[];
    }
  | {
      type: 'UI3_VARIABLES_EXTRACTED';
      css: string;
      count: number;
      collections: string[];
    }
  | {
      type: 'SETTINGS_LOADED';
      token: string;
      fileUrl: string;
    }
  | {
      type: 'TOAST';
      message: string;
      level: 'info' | 'success' | 'warning' | 'error';
    };



