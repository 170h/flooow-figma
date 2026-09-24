import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';

// ============================================================
// 타입 정의
// ============================================================

export interface NodeInfo {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  flowNodeType?: string;
  status?: string;
  isConnector?: boolean;
  isFlowNode?: boolean;
  connectorColorHex?: string;
  connectorStrokePattern?: string;
  connectorStrokeWeight?: number;
  connectorRoutingType?: string;
  connectorStartTerminal?: string;
  connectorEndTerminal?: string;
  connectorLabel?: string;
  connectorSourceNodeName?: string;
  connectorTargetNodeName?: string;
  connectorSourceMagnet?: string;
  connectorTargetMagnet?: string;
}

export interface LastNodeConfig {
  phase: string;
  phaseName: string;
  phaseColor: string;
  nodeType: string;
  width: number;
  height: number;
  cornerRadius: number;
  sizeMode: string;
  color: string;
  elevationOn: boolean;
  elevation: number;
  statusOn: boolean;
  status: string;
  stepBadgesOn: boolean;
  stepNumber: number;
  badgeCorner: string;
  badgeShape: string;
  singleLinkOn: boolean;
  singleLinkUrl: string;
}

export interface LastConnectorConfig {
  labelOn: boolean;
  labelText: string;
  linkOn: boolean;
  linkUrl: string;
}

export interface UIState {
  selectedColor: string;
  selectedElevation: number;
  selectedStatus: string;
  selectedBadgeCorner: string;
  selectedBadgeShape: string;
  selectedLinePattern: string;
  selectedRoutingType: string;
  sourceMagnet: string;
  targetMagnet: string;
  selectedPhase: string;
  selectedNodeType: string;
}

// 모달 타입
export type ModalType = 'none' | 'phase' | 'add-size' | 'edit-size' | 'add-style' | 'confirmation' | 'delete';

export interface AppContextValue {
  // 선택 상태
  selectedNodes: NodeInfo[];
  setSelectedNodes: (nodes: NodeInfo[]) => void;
  isConnectorSelected: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;

  // UI 상태
  uiState: UIState;
  setUIState: (state: Partial<UIState>) => void;

  // 설정 기억
  lastNodeConfig: LastNodeConfig;
  setLastNodeConfig: (cfg: Partial<LastNodeConfig>) => void;
  lastConnectorConfig: LastConnectorConfig;
  setLastConnectorConfig: (cfg: Partial<LastConnectorConfig>) => void;

  // 모달 상태
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;

  // 팝오버 상태
  phasePopoverOpen: boolean;
  setPhasePopoverOpen: (open: boolean) => void;
  contextMenuOpen: boolean;
  setContextMenuOpen: (open: boolean) => void;
  sizeModeDropdownOpen: boolean;
  setSizeModeDropdownOpen: (open: boolean) => void;
  phasePopoverPos: { top: number; left: number };
  setPhasePopoverPos: (pos: { top: number; left: number }) => void;
  contextMenuPos: { top: number; left: number };
  setContextMenuPos: (pos: { top: number; left: number }) => void;

  // Phase 편집 상태
  phaseModalEditingId: string | null;
  setPhaseModalEditingId: (id: string | null) => void;

  // 핵심 함수들
  applyCurrentNodeState: () => void;
  applyCurrentConnectorState: () => void;
  handleMainAction: () => void;
  handleSelectionChange: (count: number, nodes: NodeInfo[], meta: {
    flowNodeCount?: number;
    otherObjectCount?: number;
    connectorCount?: number;
  }) => void;
  closeAllPopovers: () => void;
  showToast: (msg: string, level?: string) => void;
  autoResizeWindow: () => void;
}

// ============================================================
// 기본값
// ============================================================

const DEFAULT_LAST_NODE_CONFIG: LastNodeConfig = {
  phase: 'none',
  phaseName: 'None',
  phaseColor: '#EA2039',
  nodeType: 'Screen',
  width: 250,
  height: 90,
  cornerRadius: 0,
  sizeMode: 'fixed',
  color: '#ffffff',
  elevationOn: false,
  elevation: 0,
  statusOn: false,
  status: 'in_progress',
  stepBadgesOn: false,
  stepNumber: 1,
  badgeCorner: 'TOP_LEFT',
  badgeShape: 'Square',
  singleLinkOn: false,
  singleLinkUrl: '',
};

const DEFAULT_LAST_CONNECTOR_CONFIG: LastConnectorConfig = {
  labelOn: false,
  labelText: 'Text',
  linkOn: false,
  linkUrl: '',
};

const DEFAULT_UI_STATE: UIState = {
  selectedColor: '#ffffff',
  selectedElevation: 0,
  selectedStatus: 'in_progress',
  selectedBadgeCorner: 'TOP_LEFT',
  selectedBadgeShape: 'Square',
  selectedLinePattern: 'SOLID',
  selectedRoutingType: 'ORTHOGONAL',
  sourceMagnet: 'RIGHT',
  targetMagnet: 'LEFT',
  selectedPhase: 'none',
  selectedNodeType: 'Screen',
};

// ============================================================
// Context 생성
// ============================================================

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ============================================================
// AppProvider
// ============================================================

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedNodes, setSelectedNodes] = useState<NodeInfo[]>([]);
  const [isConnectorSelected, setIsConnectorSelected] = useState(false);
  const [currentTab, setCurrentTabState] = useState('node');
  const [uiState, setUIStateRaw] = useState<UIState>(DEFAULT_UI_STATE);
  const [lastNodeConfig, setLastNodeConfigRaw] = useState<LastNodeConfig>(DEFAULT_LAST_NODE_CONFIG);
  const [lastConnectorConfig, setLastConnectorConfigRaw] = useState<LastConnectorConfig>(DEFAULT_LAST_CONNECTOR_CONFIG);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [phasePopoverOpen, setPhasePopoverOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [sizeModeDropdownOpen, setSizeModeDropdownOpen] = useState(false);
  const [phasePopoverPos, setPhasePopoverPos] = useState({ top: 0, left: 0 });
  const [contextMenuPos, setContextMenuPos] = useState({ top: 0, left: 0 });
  const [phaseModalEditingId, setPhaseModalEditingId] = useState<string | null>(null);

  // ref로 최신 상태 참조 (콜백에서 stale closure 방지)
  const selectedNodesRef = useRef(selectedNodes);
  const isConnectorSelectedRef = useRef(isConnectorSelected);
  const currentTabRef = useRef(currentTab);
  const uiStateRef = useRef(uiState);
  const lastNodeConfigRef = useRef(lastNodeConfig);
  const lastConnectorConfigRef = useRef(lastConnectorConfig);

  useEffect(() => { selectedNodesRef.current = selectedNodes; }, [selectedNodes]);
  useEffect(() => { isConnectorSelectedRef.current = isConnectorSelected; }, [isConnectorSelected]);
  useEffect(() => { currentTabRef.current = currentTab; }, [currentTab]);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);
  useEffect(() => { lastNodeConfigRef.current = lastNodeConfig; }, [lastNodeConfig]);
  useEffect(() => { lastConnectorConfigRef.current = lastConnectorConfig; }, [lastConnectorConfig]);

  const setUIState = useCallback((partial: Partial<UIState>) => {
    setUIStateRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const setLastNodeConfig = useCallback((partial: Partial<LastNodeConfig>) => {
    setLastNodeConfigRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const setLastConnectorConfig = useCallback((partial: Partial<LastConnectorConfig>) => {
    setLastConnectorConfigRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const showToast = useCallback((msg: string, level = 'info') => {
    if (!msg) return;
    parent.postMessage({ pluginMessage: { type: 'NOTIFY', message: msg, level } }, '*');
  }, []);

  const autoResizeWindow = useCallback(() => {
    requestAnimationFrame(() => {
      const root = document.getElementById('plugin-root');
      if (!root) return;
      const totalHeight = Math.ceil(root.offsetHeight || root.getBoundingClientRect().height);
      if (totalHeight > 100) {
        parent.postMessage({
          pluginMessage: { type: 'RESIZE_WINDOW', width: 360, height: totalHeight }
        }, '*');
      }
    });
  }, []);

  const closeAllPopovers = useCallback(() => {
    setPhasePopoverOpen(false);
    setContextMenuOpen(false);
    setSizeModeDropdownOpen(false);
  }, []);

  const lastNodeTabRef = useRef<string>('node');

  const setCurrentTab = useCallback((tab: string) => {
    setCurrentTabState(tab);
    currentTabRef.current = tab;
    // 일반 노드가 선택된 상태에서 탭을 변경한 경우 마지막 탭으로 기억
    if (selectedNodesRef.current.length > 0 && !isConnectorSelectedRef.current) {
      lastNodeTabRef.current = tab;
    }
  }, []);

  // ---- 핵심 피그마 통신 함수들 ----

  const applyCurrentNodeState = useCallback(() => {
    const nodes = selectedNodesRef.current;
    if (!nodes || nodes.length === 0) return;

    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const urlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;

    const title = titleEl?.value.trim() || 'Untitled';
    const desc = descEl?.value.trim() || '';
    const w = parseInt(wEl?.value || '250', 10) || 250;
    const h = parseInt(hEl?.value || '90', 10) || 90;
    const radius = parseInt(rEl?.value || '0', 10) || 0;
    const figmaUrl = urlEl?.value.trim() || '';

    const { selectedColor, selectedElevation, selectedNodeType } = uiStateRef.current;

    setLastNodeConfig({ width: w, height: h, cornerRadius: radius, nodeType: selectedNodeType, color: selectedColor, elevation: selectedElevation, singleLinkUrl: figmaUrl });

    const cfg = lastNodeConfigRef.current;
    const sizeMode = cfg.sizeMode || 'fixed';

    nodes.forEach(node => {
      parent.postMessage({
        pluginMessage: {
          type: 'UPDATE_FLOW_NODE',
          payload: {
            nodeId: node.id,
            title: nodes.length === 1 ? title : (node.title || title),
            description: desc,
            width: w, height: h, cornerRadius: radius,
            theme: 'light',
            figmaLink: figmaUrl,
            nodeType: selectedNodeType,
            colorHex: selectedColor,
            elevation: selectedElevation,
            sizeMode,
          }
        }
      }, '*');
    });

    const statusToggleEl = document.getElementById('toggle-status') as HTMLInputElement | null;
    const isStatusOn = statusToggleEl?.checked || false;
    const { selectedStatus } = uiStateRef.current;
    if (isStatusOn && selectedStatus && nodes.length > 0) {
      parent.postMessage({ pluginMessage: { type: 'SET_STATUS', status: selectedStatus } }, '*');
    }
  }, [setLastNodeConfig]);

  const applyCurrentConnectorState = useCallback(() => {
    const nodes = selectedNodesRef.current;
    if (!isConnectorSelectedRef.current || !nodes || nodes.length !== 1) return;

    const labelToggleEl = document.getElementById('toggle-conn-label') as HTMLInputElement | null;
    const labelInputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
    const colorEl = document.getElementById('conn-line-color') as HTMLSelectElement | null;
    const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
    const startTermEl = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
    const endTermEl = document.getElementById('select-end-terminal') as HTMLSelectElement | null;

    const hasLabel = labelToggleEl?.checked || false;
    const label = hasLabel ? (labelInputEl?.value.trim() || '') : '';
    const color = colorEl?.value || '#000000';
    const weight = parseFloat(weightEl?.value || '1.5') || 1.5;
    const startTerm = startTermEl?.value || 'NONE';
    const endTerm = endTermEl?.value || 'ARROW';

    const { selectedLinePattern, selectedRoutingType, sourceMagnet, targetMagnet } = uiStateRef.current;

    parent.postMessage({
      pluginMessage: {
        type: 'UPDATE_CONNECTOR_PROPERTIES',
        payload: {
          connectorId: nodes[0].id,
          colorHex: color, strokeWeight: weight,
          strokePattern: selectedLinePattern,
          routingType: selectedRoutingType,
          startTerminal: startTerm, endTerminal: endTerm,
          sourceMagnet, targetMagnet,
          label, hasLabel,
        }
      }
    }, '*');
  }, []);

  const handleMainAction = useCallback(() => {
    const nodes = selectedNodesRef.current;
    const isConn = isConnectorSelectedRef.current || (nodes.length === 1 && nodes[0]?.isConnector);

    if (isConn || currentTabRef.current === 'connection') {
      // 커넥터 수정 또는 연결
      if (isConn && nodes.length === 1) {
        applyCurrentConnectorState();
        return;
      }
      if (nodes.length < 2) {
        showToast('Select 2 or more nodes to connect.');
        return;
      }
      const labelToggleEl = document.getElementById('toggle-conn-label') as HTMLInputElement | null;
      const labelInputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
      const colorEl = document.getElementById('conn-line-color') as HTMLSelectElement | null;
      const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
      const startTermEl = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
      const endTermEl = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
      const startOffEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
      const endOffEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
      const linkToggleEl = document.getElementById('toggle-conn-link') as HTMLInputElement | null;
      const linkUrlEl = document.getElementById('input-conn-link-url') as HTMLInputElement | null;

      const label = labelToggleEl?.checked ? (labelInputEl?.value.trim() || '') : '';
      const color = colorEl?.value || '#000000';
      const weight = parseFloat(weightEl?.value || '1.5') || 1.5;
      const startTerm = startTermEl?.value || 'NONE';
      const endTerm = endTermEl?.value || 'ARROW';
      const startOff = parseFloat(startOffEl?.value || '0') || 0;
      const endOff = parseFloat(endOffEl?.value || '0') || 0;
      const figmaLink = (linkToggleEl?.checked && linkUrlEl) ? linkUrlEl.value.trim() : '';
      const { selectedLinePattern, selectedRoutingType, sourceMagnet, targetMagnet } = uiStateRef.current;

      parent.postMessage({
        pluginMessage: {
          type: 'CONNECT_POINTS',
          payload: {
            sourceNodeId: nodes[0].id, sourceMagnet,
            targetNodeId: nodes[1].id, targetMagnet,
            label, colorHex: color, strokeWeight: weight,
            routingType: selectedRoutingType, strokePattern: selectedLinePattern,
            startTerminal: startTerm, endTerminal: endTerm,
            startOffset: startOff, endOffset: endOff, figmaLink,
          }
        }
      }, '*');
      return;
    }

    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const urlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
    const elevToggleEl = document.getElementById('toggle-elevation') as HTMLInputElement | null;
    const statusToggleEl = document.getElementById('toggle-status') as HTMLInputElement | null;
    const stepToggleEl = document.getElementById('toggle-step-badges') as HTMLInputElement | null;
    const stepNumEl = document.getElementById('input-step-number') as HTMLInputElement | null;
    const singleLinkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;

    const title = titleEl?.value.trim() || 'Welcome';
    const desc = descEl?.value.trim() || '';
    const w = parseInt(wEl?.value || '250', 10) || 250;
    const h = parseInt(hEl?.value || '90', 10) || 90;
    const radius = parseInt(rEl?.value || '0', 10) || 0;
    const figmaUrl = urlEl?.value.trim() || '';
    const { selectedColor, selectedElevation, selectedNodeType, selectedStatus, selectedBadgeCorner, selectedBadgeShape } = uiStateRef.current;

    const newConfig: Partial<LastNodeConfig> = {
      width: w, height: h, cornerRadius: radius,
      nodeType: selectedNodeType, color: selectedColor,
      elevationOn: elevToggleEl?.checked || false, elevation: selectedElevation,
      statusOn: statusToggleEl?.checked || false, status: selectedStatus,
      stepBadgesOn: stepToggleEl?.checked || false,
      stepNumber: parseInt(stepNumEl?.value || '1', 10) || 1,
      badgeCorner: selectedBadgeCorner, badgeShape: selectedBadgeShape,
      singleLinkOn: singleLinkToggleEl?.checked || false, singleLinkUrl: figmaUrl,
    };
    setLastNodeConfig(newConfig);

    if (nodes.length === 1) {
      parent.postMessage({
        pluginMessage: {
          type: 'UPDATE_FLOW_NODE',
          payload: { nodeId: nodes[0].id, title, description: desc, width: w, height: h, cornerRadius: radius, theme: 'light', figmaLink: figmaUrl, nodeType: selectedNodeType, colorHex: selectedColor, elevation: selectedElevation }
        }
      }, '*');
    } else if (nodes.length >= 2) {
      nodes.forEach(node => {
        parent.postMessage({
          pluginMessage: {
            type: 'UPDATE_FLOW_NODE',
            payload: { nodeId: node.id, title: node.title || title, description: desc, width: w, height: h, cornerRadius: radius, theme: 'light', figmaLink: figmaUrl, nodeType: selectedNodeType, colorHex: selectedColor, elevation: selectedElevation }
          }
        }, '*');
      });
      if (statusToggleEl?.checked && selectedStatus) {
        parent.postMessage({ pluginMessage: { type: 'SET_STATUS', status: selectedStatus } }, '*');
      }
      showToast(`${nodes.length}개 노드가 업데이트되었습니다.`);
    } else {
      parent.postMessage({
        pluginMessage: {
          type: 'CREATE_FLOW_NODE',
          payload: { title, description: desc, width: w, height: h, cornerRadius: radius, theme: 'light', figmaLink: figmaUrl, nodeType: selectedNodeType, colorHex: selectedColor, elevation: selectedElevation, status: statusToggleEl?.checked ? selectedStatus : undefined }
        }
      }, '*');
    }
  }, [applyCurrentConnectorState, setLastNodeConfig, showToast]);

  const handleSelectionChange = useCallback((
    count: number,
    nodes: NodeInfo[],
    meta: { flowNodeCount?: number; otherObjectCount?: number; connectorCount?: number; }
  ) => {
    setSelectedNodes(nodes);
    selectedNodesRef.current = nodes;

    const flowNodeCount = typeof meta?.flowNodeCount === 'number'
      ? meta.flowNodeCount
      : nodes.filter(n => n && (n.isFlowNode || (!n.isConnector && n.flowNodeType))).length;
    const otherObjectCount = typeof meta?.otherObjectCount === 'number'
      ? meta.otherObjectCount
      : Math.max(0, count - flowNodeCount - (meta?.connectorCount || 0));
    const connectorCount = typeof meta?.connectorCount === 'number'
      ? meta.connectorCount
      : nodes.filter(n => n && n.isConnector).length;

    const allConnectors = (connectorCount > 0 && flowNodeCount === 0 && otherObjectCount === 0) ||
      (count > 0 && nodes.length > 0 && nodes.every(n => n && n.isConnector));
    const isSingleConn = count === 1 && allConnectors;
    const isMultiConn = count >= 2 && allConnectors;
    const newIsConnSel = isSingleConn || isMultiConn;
    setIsConnectorSelected(newIsConnSel);
    isConnectorSelectedRef.current = newIsConnSel;

    if (newIsConnSel) {
      setCurrentTab('connection');
    } else if (count === 0) {
      // 바탕화면 클릭 (신규 생성 모드): 항상 node 탭이 기본
      setCurrentTab('node');
    } else {
      // 일반 노드 선택: 이전 노드에서 마지막으로 선택했던 탭으로 복원
      const targetTab = lastNodeTabRef.current || 'node';
      setCurrentTab(targetTab);
    }
  }, [setCurrentTab]);

  const value: AppContextValue = {
    selectedNodes,
    setSelectedNodes,
    isConnectorSelected,
    currentTab,
    setCurrentTab,
    uiState,
    setUIState,
    lastNodeConfig,
    setLastNodeConfig,
    lastConnectorConfig,
    setLastConnectorConfig,
    activeModal,
    setActiveModal,
    phasePopoverOpen,
    setPhasePopoverOpen,
    contextMenuOpen,
    setContextMenuOpen,
    sizeModeDropdownOpen,
    setSizeModeDropdownOpen,
    phasePopoverPos,
    setPhasePopoverPos,
    contextMenuPos,
    setContextMenuPos,
    phaseModalEditingId,
    setPhaseModalEditingId,
    applyCurrentNodeState,
    applyCurrentConnectorState,
    handleMainAction,
    handleSelectionChange,
    closeAllPopovers,
    showToast,
    autoResizeWindow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
