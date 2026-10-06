import type { FlooowUsageState } from './entitlementGate';

export type { FlooowUsageState };

export type AppLocale = 'ko' | 'en';

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

// NOTE: 런타임 값(STATUS_CONFIG)은 src/domain/nodeDomain.ts로 이동.
// 프로토콜 계약(타입)은 이 파일에 유지한다 (INV-07).

export type MagnetPosition = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';
// Figma UI3 6종 노드 분류 타입 및 레거시 호환 타입
export type DiagramNodeType =
  | 'Screen'
  | 'Process'
  | 'Junction'
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
 * 노드 타입별 도형 규격 및 디스크립션 허용 여부 명세
 */
export interface NodeTypeShapeSpec {
  width: number;
  height: number;
  cornerRadius?: number;
  allowDescription: boolean;
  allowFigmaLink: boolean;
}

// NOTE: NODE_TYPE_SHAPE_SPECS 값은 src/domain/nodeDomain.ts로 이동.

/** Branch(Type Bridge) 하위 형태 (Type 칩 → 캔버스 노드) */
export type BranchVariant =
  | 'CHECK'
  | 'CROSS'
  | 'TAG'
  | 'SQUARE'
  | 'DIAMOND'
  | 'CIRCLE';

// NOTE: BRANCH_VARIANT_* 값과 normalize/get*BranchVariant* 함수는
// src/domain/nodeDomain.ts로 이동.

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

// NOTE: OPTION_CAPABILITY_MATRIX 값과 getNodeCategory/supportsOption/
// getMutationTargets 함수는 src/domain/nodeDomain.ts로 이동.

export type OptionCapability =
  | 'SUPPORTED'
  | 'PARTIAL'
  | 'UNSUPPORTED';

/**
 * 플로우 노드 Capability 검사 대상 객체 규격
 * Core(SceneNode)와 UI(SelectedNodeInfo, NodeInfo) 양측에서 전달되는 노드 객체를 타입 안전하게 수용
 */
export interface CapabilityNodeTarget {
  id?: string;
  isFlowNode?: boolean;
  isConnector?: boolean;
  flowNodeType?: DiagramNodeType | string;
  nodeType?: string;
  type?: string;
  getPluginData?: (key: string) => string;
  [key: string]: any;
}

// NOTE: getOptionCapability 함수는 src/domain/nodeDomain.ts로 이동.


/**
 * 토글 스위치 최종 상태 4종
 * - ON: 켜짐
 * - OFF: 꺼짐
 * - MIXED_ACTIVE: 복수 선택의 값이 섞인 상태. '-' 표시, 섹션 펼침
 * - MIXED_DISABLED: 복수 선택에서만 쓰는 혼합 비활성. '-' 표시
 * 한 개 노드에서 옵션을 지원하지 않으면 OFF + disabled 이며 '-'를 쓰지 않는다.
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
  capability?: OptionCapability;
}

// NOTE: computeOptionSwitchState 함수는 src/domain/nodeDomain.ts로 이동.

// NOTE: SCREEN_NODE_CONSTRAINTS 값과 clamp* 함수는
// src/domain/nodeDomain.ts로 이동.


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
  descriptionOn?: boolean;
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
  branchVariant?: BranchVariant;
}

export interface ConnectPointsPayload {
  sourceNodeId: string;
  /** 미지정이면 Core가 두 노드 거리 기준 최적 마그넷을 계산한다 */
  sourceMagnet?: MagnetPosition;
  targetNodeId: string;
  /** 미지정이면 Core가 두 노드 거리 기준 최적 마그넷을 계산한다 */
  targetMagnet?: MagnetPosition;
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
  /** Start 카드 Draft — 신규 생성 pair 중 첫 pair의 source magnet. 미지정이면 Core 최적값 */
  sourceMagnet?: MagnetPosition;
  /** End 카드 Draft — 첫 신규 pair의 target, 이후 신규 pair의 source/target. 미지정이면 Core 최적값 */
  targetMagnet?: MagnetPosition;
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
  branchVariant?: BranchVariant;
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
  branchVariant?: BranchVariant;
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
  | { type: 'ADD_STEP_BADGES'; startNumber?: number; corner?: string; shape?: string; colorMode?: 'White' | 'Black' | 'Style' }
  | { type: 'REMOVE_STEP_BADGES' }
  | { type: 'SET_STATUS'; status: WorkflowStatus }
  | { type: 'SET_ELEVATION'; level: number | null }
  | { type: 'GET_STATUS_LIST' }
  | { type: 'FOCUS_FRAME'; nodeId: string }
  | { type: 'GET_DESIGN_FRAMES' }
  | { type: 'GET_FLOOOW_USAGE' }
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
  | { type: 'EXTRACT_UI3_VARIABLES' }
  | { type: 'SAVE_SETTINGS'; token: string; fileUrl: string }
  | { type: 'LOAD_SETTINGS' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLOSE_PLUGIN' }
  | { type: 'NOTIFY'; message: string; level?: 'info' | 'success' | 'warning' | 'error' }
  | { type: 'RESIZE_WINDOW'; width?: number; height: number }
  | { type: 'INIT'; locale?: AppLocale };

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
  connectorSourceNodeType?: string;
  connectorTargetNodeType?: string;
  connectorSourceMagnet?: MagnetPosition;
  connectorTargetMagnet?: MagnetPosition;
  connectorIsReversed?: boolean;
  connectedNodeNames?: string[];
  connectedNodeTypes?: string[];
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
      type: 'DESIGN_FRAMES_LOADED';
      frames: DesignFrameItem[];
    }
  | {
      type: 'FLOOOW_USAGE';
      usage: FlooowUsageState;
    };



