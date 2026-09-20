export type WorkflowStatus =
  | 'draft'
  | 'wireframe'
  | 'in_progress'
  | 'in_review'
  | 'approved'
  | 'ready_for_dev';

export interface StatusMeta {
  label: string;
  color: { r: number; g: number; b: number };
  textColor: { r: number; g: number; b: number };
  hex: string;
}

export const STATUS_CONFIG: Record<WorkflowStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    color: { r: 0.55, g: 0.58, b: 0.63 }, // #8C94A0
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#8C94A0',
  },
  wireframe: {
    label: 'Wireframe',
    color: { r: 0.85, g: 0.85, b: 0.85 }, // #D9D9D9
    textColor: { r: 0.2, g: 0.2, b: 0.2 },
    hex: '#D9D9D9',
  },
  in_progress: {
    label: 'In Progress',
    color: { r: 0.16, g: 0.5, b: 0.98 }, // #2980FA
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#2980FA',
  },
  in_review: {
    label: 'In Review',
    color: { r: 0.96, g: 0.62, b: 0.05 }, // #F59E0B
    textColor: { r: 0.1, g: 0.1, b: 0.1 },
    hex: '#F59E0B',
  },
  approved: {
    label: 'Approved',
    color: { r: 0.55, g: 0.36, b: 0.96 }, // #8C5CF6
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#8C5CF6',
  },
  ready_for_dev: {
    label: 'Ready for Dev',
    color: { r: 0.06, g: 0.72, b: 0.51 }, // #10B981
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#10B981',
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
export type ConnectorRoutingType = 'ORTHOGONAL' | 'S_CURVE' | 'CURVED' | 'STRAIGHT';
export type ConnectorStrokePattern = 'SOLID' | 'DASHED' | 'DOTTED';
export type ConnectorTerminalType = 'NONE' | 'ARROW' | 'DIAMOND' | 'CIRCLE';

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
  | { type: 'ADD_STEP_BADGES'; startNumber?: number }
  | { type: 'REMOVE_STEP_BADGES' }
  | { type: 'SET_STATUS'; status: WorkflowStatus }
  | { type: 'GET_STATUS_LIST' }
  | { type: 'FOCUS_FRAME'; nodeId: string }
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
  | { type: 'RESIZE_WINDOW'; width?: number; height: number }
  | { type: 'INIT' };

export interface SelectedNodeInfo {
  id: string;
  name: string;
  isFlowNode: boolean;
  isConnector?: boolean;
  nodeType?: string;
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
  width?: number;
  height?: number;
}

export type CoreToUIMessage =
  | {
      type: 'SELECTION_CHANGED';
      count: number;
      nodes: SelectedNodeInfo[];
      currentStatus?: WorkflowStatus;
      nextSuggestedTag?: string;
    }
  | {
      type: 'STATUS_LIST_UPDATED';
      items: FrameStatusItem[];
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



