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
    color: { r: 0.792, g: 0.541, b: 0.016 }, // #CA8A04
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#CA8A04',
  },
  revision: {
    label: 'Revision',
    color: { r: 0.918, g: 0.345, b: 0.047 }, // #EA580C
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#EA580C',
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

// 피그마 신규 디자인 9종 노드 분류 타입
export type DiagramNodeType =
  | 'Screen'
  | 'Action'
  | 'Decision'
  | 'System'
  | 'Database'
  | 'Terminator'
  | 'True'
  | 'False'
  | 'Error';

// 스텝 배지 코너 위치 및 형태
export type BadgePosition = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
export type BadgeShape = 'Square' | 'Circle' | 'RoundBox';

// 연결선 라우팅 및 단자 타입
export type ConnectorStrokePattern = 'SOLID' | 'DASHED' | 'DOTTED';
export type ConnectorRoutingType = 'ORTHOGONAL' | 'S_CURVE' | 'CURVED' | 'STRAIGHT';
export type ConnectorTerminalType =
  | 'NONE'
  | 'ARROW'
  | 'TRIANGLE_ARROW'
  | 'REVERSED_TRIANGLE_ARROW'
  | 'CIRCLE'
  | 'DIAMOND'
  | 'MIXED';

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
  phaseId?: string;
  elevation?: number;
  status?: WorkflowStatus;
  badgeNumber?: number;
  badgePosition?: BadgePosition;
  badgeShape?: BadgeShape;
  colorHex?: string;
  strokeWeight?: number;
  strokeColor?: string;
  sizeMode?: 'fixed' | 'hug';
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
  tag?: string;
  theme: 'light' | 'dark';
  figmaLink?: string;
  figmaFrameId?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  nodeType?: DiagramNodeType;
  phaseId?: string;
  elevation?: number;
  status?: WorkflowStatus;
  badgeNumber?: number;
  badgePosition?: BadgePosition;
  badgeShape?: BadgeShape;
  colorHex?: string;
  strokeWeight?: number;
  strokeColor?: string;
  sizeMode?: 'fixed' | 'hug';
}

// 피그마 디자인 프레임 정보
export interface DesignFrameItem {
  id: string;
  name: string;
  width: number;
  height: number;
  cornerRadius: number;
}

// 메시지 액션 타입
export type PluginAction =
  | { type: 'CREATE_FLOW_NODE'; payload: FlowNodePayload }
  | { type: 'UPDATE_FLOW_NODE'; payload: UpdateNodePayload }
  | { type: 'CONNECT_POINTS'; payload: ConnectPointsPayload }
  | { type: 'AUTO_CONNECT_SELECTED'; label?: string }
  | { type: 'UPDATE_CONNECTOR_LABEL'; connectorId: string; label: string }
  | { type: 'TOGGLE_NODE_THEME'; nodeId: string }
  | { type: 'CREATE_CONNECTORS'; label?: string; lineStyle?: 'solid' | 'dashed' }
  | { type: 'ADD_STEP_BADGES'; startNumber?: number; corner?: string; shape?: string }
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
        sourceMagnet?: MagnetPosition;
        targetMagnet?: MagnetPosition;
        label?: string;
        hasLabel?: boolean;
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

export interface SelectedNodeInfo {
  id: string;
  name: string;
  isFlowNode: boolean;
  isConnector?: boolean;
  nodeType?: string;
  flowNodeType?: DiagramNodeType;
  title?: string;
  description?: string;
  tag?: string;
  theme?: 'light' | 'dark';
  figmaLink?: string;
  connectorLabel?: string;
  connectorLineType?: 'ELBOWED' | 'STRAIGHT' | 'CURVED';
  connectorColorHex?: string;
  connectorStrokeWeight?: number;
  connectorStrokePattern?: ConnectorStrokePattern;
  connectorRoutingType?: ConnectorRoutingType;
  connectorStartTerminal?: ConnectorTerminalType;
  connectorEndTerminal?: ConnectorTerminalType;
  connectorSourceNodeName?: string;
  connectorTargetNodeName?: string;
  connectorSourceMagnet?: MagnetPosition;
  connectorTargetMagnet?: MagnetPosition;
  width?: number;
  height?: number;
  hugHeight?: number;
  sizeMode?: 'fixed' | 'hug';
  status?: WorkflowStatus;
  stepNumber?: number;
  badgeCorner?: string;
  badgeShape?: string;
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



