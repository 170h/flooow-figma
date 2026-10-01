import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { getPluginIdealHeight } from '../hooks/useAutoResize';
import type { ConnectorTerminalType, DiagramNodeType, WorkflowStatus, NodePatchPayload, UpdateNodePayload } from '../../types';
import { NODE_TYPE_SHAPE_SPECS, normalizeNodeType } from '../../types';

// ============================================================
// 타입 정의
// ============================================================

export type MultiNodeDraft = NodePatchPayload;

export interface UndoSnapshot {
  type: 'single' | 'batch' | 'connector';
  singlePayload?: UpdateNodePayload;
  batchItems?: Array<{
    nodeId: string;
    patch: NodePatchPayload;
  }>;
  connectorItems?: Array<{
    connectorId: string;
    payload: any;
  }>;
}

export interface SizePreset {
  id: string;
  name: string;
  w: number;
  h: number;
  radius?: number;
  sizeMode?: 'fixed' | 'hug' | 'fit';
  isDefault?: boolean;
}

export const DEFAULT_SIZE_PRESETS: SizePreset[] = [
  { id: 'default', name: 'Default', w: 250, h: 90, radius: 0, sizeMode: 'hug', isDefault: true },
  { id: 'square', name: 'Square', w: 180, h: 180, radius: 0, sizeMode: 'fixed', isDefault: true },
  { id: 'web', name: 'Web', w: 320, h: 180, radius: 0, sizeMode: 'fixed', isDefault: true },
  { id: 'mobile', name: 'Mobile', w: 160, h: 280, radius: 0, sizeMode: 'fixed', isDefault: true },
];

export interface StylePreset {
  id: string;
  name?: string;
  fillColor: string;
  strokeWeight: number;
  strokeColor: string;
  isDefault?: boolean;
}

export const DEFAULT_STYLE_PRESETS: StylePreset[] = [
  { id: 'style-white', name: 'White', fillColor: '#ffffff', strokeWeight: 1.5, strokeColor: '#000000', isDefault: true },
  { id: 'style-black', name: 'Black', fillColor: '#000000', strokeWeight: 0, strokeColor: '#000000', isDefault: true },
];

const DEFAULT_STYLE_PRESET_IDS = new Set(['style-white', 'style-black']);

const getCurrentUITheme = (): 'light' | 'dark' => {
  if (typeof document !== 'undefined' && (
    document.documentElement.classList.contains('figma-dark') ||
    document.body.classList.contains('figma-dark') ||
    document.querySelector('[data-theme="dark"]')
  )) {
    return 'dark';
  }
  return 'light';
};

export interface NodeInfo {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  nodeType?: string;
  flowNodeType?: string;
  status?: string;
  figmaLink?: string;
  theme?: 'light' | 'dark';
  isConnector?: boolean;
  isFlowNode?: boolean;
  connectorColorHex?: string;
  connectorStrokePattern?: string;
  connectorStrokeWeight?: number;
  connectorRoutingType?: string;
  connectorStartTerminal?: string;
  connectorEndTerminal?: string;
  connectorStartOffset?: number;
  connectorEndOffset?: number;
  connectorLabel?: string;
  connectorSourceNodeName?: string;
  connectorTargetNodeName?: string;
  connectorSourceMagnet?: string;
  connectorTargetMagnet?: string;
  stepNumber?: number;
  badgeCorner?: string;
  badgeShape?: string;
  badgeColorMode?: 'White' | 'Black' | 'Style';
  elevationOn?: boolean;
  elevation?: number;
  fillColorHex?: string;
  strokeColorHex?: string;
  strokeWeight?: number;
  sizeMode?: 'fixed' | 'hug' | string;
  hugHeight?: number;
  cachedFigmaLink?: string;
  connectorIsReversed?: boolean;
  connectedNodeNames?: string[];
  x?: number;
  y?: number;
}

export interface LastNodeConfig {
  nodeType: string;
  width: number;
  height: number;
  cornerRadius: number;
  sizeMode: string;
  color: string;
  strokeWeight?: number;
  strokeColor?: string;
  elevationOn: boolean;
  elevation: number;
  statusOn: boolean;
  status: string;
  stepBadgesOn: boolean;
  stepNumber: number;
  badgeCorner: string;
  badgeShape: string;
  badgeColorMode?: 'White' | 'Black' | 'Style';
  singleLinkOn: boolean;
  singleLinkUrl: string;
  descriptionOn?: boolean;
}

export interface LastConnectorConfig {
  labelOn: boolean;
  labelText: string;
  linkOn: boolean;
  linkUrl: string;
}

export interface UIState {
  selectedColor: string;
  selectedStrokeWeight?: number;
  selectedStrokeColor?: string;
  selectedStylePresetId?: string | null;
  selectedElevation: number;
  selectedStatus: string;
  selectedBadgeCorner: string;
  selectedBadgeShape: string;
  selectedBadgeColorMode: 'White' | 'Black' | 'Style';
  selectedLinePattern: string;
  selectedRoutingType: string;
  sourceMagnet: string;
  targetMagnet: string;
  selectedNodeType: string;
  selectedConnectorColor?: string;
}

import { DesignFrameItem, BadgePosition, BadgeShape, ConnectorStrokePattern, ConnectorRoutingType, MagnetPosition } from '../../types';

function normalizeTerminal(term?: string, fallback: string = 'NONE'): string {
  if (!term || term === 'BAR' || term === 'SQUARE') return fallback;
  return term;
}

// 모달 타입
export type ModalType = 'none' | 'add-size' | 'edit-size' | 'figma-design-picker' | 'add-style' | 'edit-style' | 'confirmation' | 'delete' | 'connector-color' | 'fill-color' | 'stroke-color';

// 어피어런스 탭 상호 배타적 토글 섹션 ('stepBadges' | 'status' | 'elevation' | null)
export type ExclusiveAppearanceSection = 'stepBadges' | 'status' | 'elevation' | null;

export interface AppContextValue {
  // 선택 상태
  selectedNodes: NodeInfo[];
  setSelectedNodes: (nodes: NodeInfo[]) => void;
  isConnectorSelected: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;

  // 어피어런스 독점 섹션 상태
  activeAppearanceSection: ExclusiveAppearanceSection;
  setActiveAppearanceSection: (section: ExclusiveAppearanceSection) => void;

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
  contextMenuOpen: boolean;
  setContextMenuOpen: (open: boolean) => void;
  sizeModeDropdownOpen: boolean;
  setSizeModeDropdownOpen: (open: boolean) => void;
  contextMenuPos: { top: number; left: number };
  setContextMenuPos: (pos: { top: number; left: number }) => void;
  contextMenuTarget: 'size' | 'style' | null;
  setContextMenuTarget: (target: 'size' | 'style' | null) => void;
  selectedSizePresetId: string | null;
  setSelectedSizePresetId: (id: string | null) => void;
  selectedStylePresetId: string | null;
  setSelectedStylePresetId: (id: string | null) => void;

  // 피그마 디자인 프레임 목록
  designFrames: DesignFrameItem[];
  setDesignFrames: React.Dispatch<React.SetStateAction<DesignFrameItem[]>>;
  loadDesignFrames: () => void;

  // 핵심 함수들
  sizePresets: SizePreset[];
  addSizePreset: (preset: Omit<SizePreset, 'id'>) => void;
  updateSizePreset: (id: string, preset: Partial<SizePreset>) => void;
  deleteSizePreset: (id: string) => void;
  stylePresets: StylePreset[];
  addStylePreset: (preset: Omit<StylePreset, 'id'>) => void;
  updateStylePreset: (id: string, preset: Partial<StylePreset>) => void;
  deleteStylePreset: (id: string) => void;
  applyCurrentNodeState: (
    overrideSizeMode?: string,
    styleOverrides?: {
      colorHex?: string;
      strokeWeight?: number;
      strokeColor?: string;
    },
    linkOverrides?: {
      figmaLink?: string;
      clearLinkCache?: boolean;
    },
    overrideNodeType?: DiagramNodeType,
    overrideSize?: {
      width?: number;
      height?: number;
      cornerRadius?: number;
    },
    overrideTitle?: string
  ) => void;
  applyStatusToNode: (status?: string) => void;
  applyElevationToNodes: (level: number | null) => void;
  applyStepBadges: (startNumber?: number, corner?: string, shape?: string, colorMode?: 'White' | 'Black' | 'Style') => void;
  removeStepBadgesFromNodes: () => void;
  applyCurrentConnectorState: (customStartOffset?: number, customEndOffset?: number) => void;
  connectSelectedNodes: () => void;
  handleMainAction: () => void;
  handleSelectionChange: (count: number, nodes: NodeInfo[], meta: {
    flowNodeCount?: number;
    otherObjectCount?: number;
    connectorCount?: number;
  }) => void;
  closeAllPopovers: () => void;
  showToast: (msg: string, level?: string) => void;
  autoResizeWindow: () => void;
  multiDraft: MultiNodeDraft;
  hasMultiDraft: boolean;
  updateMultiDraft: (partial: Partial<MultiNodeDraft>) => void;
  clearMultiDraft: () => void;
  clearMultiDraftKeys: (keys: (keyof MultiNodeDraft)[]) => void;
  isApplyingMultiDraft: boolean;
  hasSingleChanges: boolean;
  triggerFormChange: () => void;
  canUndo: boolean;
  handleUndo: () => void;
}

// ============================================================
// 기본값
// ============================================================

const DEFAULT_LAST_NODE_CONFIG: LastNodeConfig = {
  nodeType: 'Screen',
  width: 250,
  height: 90,
  cornerRadius: 0,
  sizeMode: 'hug',
  color: '#ffffff',
  elevationOn: false,
  elevation: 0,
  statusOn: false,
  status: 'draft',
  stepBadgesOn: false,
  stepNumber: 1,
  badgeCorner: 'TOP_LEFT',
  badgeShape: 'Square',
  badgeColorMode: 'Style',
  singleLinkOn: false,
  singleLinkUrl: '',
  descriptionOn: false,
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
  selectedStatus: 'draft',
  selectedBadgeCorner: 'TOP_LEFT',
  selectedBadgeShape: 'Square',
  selectedBadgeColorMode: 'Style',
  selectedLinePattern: 'SOLID',
  selectedRoutingType: 'ORTHOGONAL',
  sourceMagnet: 'RIGHT',
  targetMagnet: 'LEFT',
  selectedNodeType: 'Screen',
  selectedConnectorColor: '#000000',
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
  const [activeAppearanceSection, setActiveAppearanceSection] = useState<ExclusiveAppearanceSection>(null);
  const userActionLockRef = useRef<number>(0);
  const prevSelectedNodeIdRef = useRef<string | null>(null);

  const setActiveAppearanceSectionWithLock = useCallback((section: ExclusiveAppearanceSection) => {
    userActionLockRef.current = Date.now();
    setActiveAppearanceSection(section);
  }, []);

  const [uiState, setUIStateRaw] = useState<UIState>(DEFAULT_UI_STATE);
  const [lastNodeConfig, setLastNodeConfigRaw] = useState<LastNodeConfig>(DEFAULT_LAST_NODE_CONFIG);
  const [lastConnectorConfig, setLastConnectorConfigRaw] = useState<LastConnectorConfig>(DEFAULT_LAST_CONNECTOR_CONFIG);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [sizeModeDropdownOpen, setSizeModeDropdownOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ top: 0, left: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState<'size' | 'style' | null>(null);
  const [selectedSizePresetId, setSelectedSizePresetId] = useState<string | null>('default');
  const [selectedStylePresetId, setSelectedStylePresetId] = useState<string | null>('style-white');
  const [designFrames, setDesignFrames] = useState<DesignFrameItem[]>([]);

  // 다중 선택 편집용 임시 저장소 (Multi Node Draft)
  const [multiDraft, setMultiDraftRaw] = useState<MultiNodeDraft>({});
  const multiDraftRef = useRef<MultiNodeDraft>({});
  const multiDraftSelectionRef = useRef<string[]>([]);

  const updateMultiDraft = useCallback((partial: Partial<MultiNodeDraft>) => {
    setMultiDraftRaw(prev => {
      const next = { ...prev, ...partial };
      multiDraftRef.current = next;
      return next;
    });
  }, []);

  const clearMultiDraft = useCallback(() => {
    multiDraftRef.current = {};
    setMultiDraftRaw({});
  }, []);

  const clearMultiDraftKeys = useCallback((keys: (keyof MultiNodeDraft)[]) => {
    setMultiDraftRaw(prev => {
      const next = { ...prev };
      keys.forEach(k => {
        delete next[k];
      });
      multiDraftRef.current = next;
      return next;
    });
  }, []);

  const hasMultiDraft = Object.keys(multiDraft).length > 0;

  // 다중 노드 일괄 부분 적용(Apply to All) 진행 상태
  const [isApplyingMultiDraft, setIsApplyingMultiDraft] = useState(false);
  const isApplyingMultiDraftRef = useRef(false);
  const applyTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string, level = 'info') => {
    if (!msg) return;
    parent.postMessage({ pluginMessage: { type: 'NOTIFY', message: msg, level } }, '*');
  }, []);

  // 단일 선택 원본 노드 스냅샷 및 적용 상태 관리
  const originalSelectedNodeRef = useRef<NodeInfo | null>(null);
  const isApplyingSingleRef = useRef(false);
  const [formChangeTick, setFormChangeTick] = useState(0);
  const triggerFormChange = useCallback(() => {
    setFormChangeTick(t => t + 1);
  }, []);

  // 1회성 Undo 스냅샷 상태 관리 (가장 최근의 Apply 또는 Apply to All 1회만 되돌림)
  const [lastAppliedSnapshot, setLastAppliedSnapshot] = useState<UndoSnapshot | null>(null);
  const lastAppliedSnapshotRef = useRef<UndoSnapshot | null>(null);
  const canUndo = Boolean(lastAppliedSnapshot) || (selectedNodes.length >= 2 && hasMultiDraft);


  const applyMultiDraft = useCallback(() => {
    const nodes = selectedNodesRef.current;
    if (isApplyingMultiDraftRef.current) return;
    if (!nodes || nodes.length < 2) return;
    if (!hasMultiDraft) return;

    // 현재 선택 노드 집합과 Draft 대상 노드 집합 일치 검증
    const currentSortedIds = nodes.map(n => n?.id).filter(Boolean).sort();
    const draftSortedIds = multiDraftSelectionRef.current;
    const isIdSetMatch =
      currentSortedIds.length === draftSortedIds.length &&
      currentSortedIds.every((id, idx) => id === draftSortedIds[idx]);
    if (!isIdSetMatch) return;

    // Partial Patch 생성: undefined 필드를 제외하고 실제 사용자가 변경한 필드만 전송
    const rawDraft = multiDraftRef.current;
    const patch: NodePatchPayload = {};
    let hasField = false;
    (Object.keys(rawDraft) as Array<keyof NodePatchPayload>).forEach((key) => {
      if (rawDraft[key] !== undefined) {
        (patch as any)[key] = rawDraft[key];
        hasField = true;
      }
    });

    if (!hasField) return;

    // 다중 노드 Apply to All 실행 전 원래 상태 스냅샷 캡처
    const targetNodes = nodes.filter(n => n && draftSortedIds.includes(n.id));
    const batchItems: Array<{ nodeId: string; patch: NodePatchPayload }> = targetNodes.map(node => {
      const origPatch: NodePatchPayload = {};
      (Object.keys(patch) as Array<keyof NodePatchPayload>).forEach(k => {
        if (k === 'nodeType') origPatch.nodeType = (node.flowNodeType || (node.nodeType === 'FRAME' ? 'Screen' : node.nodeType)) as DiagramNodeType;
        else if (k === 'colorHex') origPatch.colorHex = node.fillColorHex || '#FFFFFF';
        else if (k === 'strokeColor') origPatch.strokeColor = node.strokeColorHex;
        else if (k === 'strokeWeight') origPatch.strokeWeight = node.strokeWeight;
        else if (k === 'width') origPatch.width = node.width;
        else if (k === 'height') origPatch.height = node.height;
        else if (k === 'cornerRadius') origPatch.cornerRadius = node.cornerRadius;
        else if (k === 'elevation') origPatch.elevation = node.elevation !== undefined && node.elevation !== null ? node.elevation : null;
        else if (k === 'status') origPatch.status = (node.status as WorkflowStatus) || '';
        else if (k === 'description') origPatch.description = node.description || '';
        else if (k === 'figmaLink') origPatch.figmaLink = node.figmaLink || '';
        else if (k === 'badgeOn') origPatch.badgeOn = node.stepNumber !== undefined;
        else if (k === 'badgeNumber') origPatch.badgeNumber = node.stepNumber;
        else if (k === 'badgeCorner') origPatch.badgeCorner = node.badgeCorner as BadgePosition | undefined;
        else if (k === 'badgeShape') origPatch.badgeShape = node.badgeShape as BadgeShape | undefined;
        else if (k === 'badgeColorMode') origPatch.badgeColorMode = node.badgeColorMode as 'White' | 'Black' | 'Style' | undefined;
      });
      return { nodeId: node.id, patch: origPatch };
    });

    const newSnapshot: UndoSnapshot = {
      type: 'batch',
      batchItems,
    };
    setLastAppliedSnapshot(newSnapshot);
    lastAppliedSnapshotRef.current = newSnapshot;

    isApplyingMultiDraftRef.current = true;
    setIsApplyingMultiDraft(true);

    parent.postMessage({
      pluginMessage: {
        type: 'BATCH_UPDATE_FLOW_NODES',
        payload: {
          nodeIds: [...draftSortedIds],
          patch,
        }
      }
    }, '*');

    // 안전 타임아웃 (Core 응답 지연 시 5초 후 잠금 자동 해제)
    if (applyTimeoutRef.current !== null) {
      window.clearTimeout(applyTimeoutRef.current);
    }
    applyTimeoutRef.current = window.setTimeout(() => {
      if (isApplyingMultiDraftRef.current) {
        isApplyingMultiDraftRef.current = false;
        setIsApplyingMultiDraft(false);
      }
    }, 5000);
  }, [hasMultiDraft, showToast]);

  const loadDesignFrames = useCallback(() => {
    parent.postMessage({ pluginMessage: { type: 'GET_DESIGN_FRAMES' } }, '*');
  }, []);

  // 사이즈 프리셋 상태 관리 (기본값 및 로컬스토리지 영속화)
  const [sizePresets, setSizePresets] = useState<SizePreset[]>(() => {
    try {
      const saved = localStorage.getItem('ui_flow_size_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_SIZE_PRESETS;
  });

  const savePresets = useCallback((next: SizePreset[]) => {
    setSizePresets(next);
    try {
      localStorage.setItem('ui_flow_size_presets', JSON.stringify(next));
    } catch (_) {}
  }, []);

  // 스타일 프리셋 상태 관리 (보더 두께, 보더 컬러, 채움 컬러 영속화)
  const [stylePresets, setStylePresets] = useState<StylePreset[]>(() => {
    try {
      const saved = localStorage.getItem('ui_flow_style_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const legacyRemoved = new Set([
            'style-red-1', 'style-red-2', 'style-coral-1', 'style-coral-2',
            'style-orange', 'style-pink', 'style-purple'
          ]);
          const filtered = parsed.filter((p: StylePreset) => !legacyRemoved.has(p.id));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (_) {}
    return DEFAULT_STYLE_PRESETS;
  });

  const saveStylePresets = useCallback((next: StylePreset[]) => {
    setStylePresets(next);
    try {
      localStorage.setItem('ui_flow_style_presets', JSON.stringify(next));
    } catch (_) {}
  }, []);

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
    uiStateRef.current = { ...uiStateRef.current, ...partial };
    setUIStateRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const setLastNodeConfig = useCallback((partial: Partial<LastNodeConfig>) => {
    lastNodeConfigRef.current = { ...lastNodeConfigRef.current, ...partial };
    setLastNodeConfigRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const setLastConnectorConfig = useCallback((partial: Partial<LastConnectorConfig>) => {
    lastConnectorConfigRef.current = { ...lastConnectorConfigRef.current, ...partial };
    setLastConnectorConfigRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const checkHasSingleChanges = useCallback((): boolean => {
    const nodes = selectedNodesRef.current;
    if (!nodes || nodes.length !== 1) return false;
    const actualNode = nodes[0];
    const origNode = originalSelectedNodeRef.current || actualNode;
    if (!origNode || !actualNode) return false;

    const isConn = Boolean(origNode.isConnector || origNode.nodeType === 'CONNECTOR');
    if (isConn) {
      // 1. Label
      const labelToggleEl = document.getElementById('toggle-conn-label') as HTMLInputElement | null;
      const labelInputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
      const currentHasLabel = labelToggleEl ? labelToggleEl.checked : Boolean(lastConnectorConfigRef.current.labelOn);
      const currentLabel = currentHasLabel ? (labelInputEl ? labelInputEl.value.trim() : (lastConnectorConfigRef.current.labelText || 'Text').trim()) : '';
      const origHasLabel = Boolean(origNode.connectorLabel);
      const origLabel = (origNode.connectorLabel || '').trim();
      if (currentHasLabel !== origHasLabel) return true;
      if (currentHasLabel && currentLabel !== origLabel) return true;

      // 2. Color
      const colorEl = document.getElementById('conn-line-color') as HTMLSelectElement | null;
      const currentColor = (colorEl?.value || uiStateRef.current.selectedConnectorColor || '#000000').toUpperCase();
      const origColor = (origNode.connectorColorHex || '#000000').toUpperCase();
      if (currentColor !== origColor) return true;

      // 3. Weight
      const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
      const currentWeight = weightEl?.value ? parseFloat(weightEl.value) : 1.5;
      const origWeight = origNode.connectorStrokeWeight ?? 1.5;
      if (Math.abs(currentWeight - origWeight) > 0.01) return true;

      // 4. Terminals
      const startTermEl = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
      const endTermEl = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
      const currentStartTerm = startTermEl?.value || 'NONE';
      const origStartTerm = normalizeTerminal(origNode.connectorStartTerminal, 'NONE');
      if (currentStartTerm !== origStartTerm) return true;
      const currentEndTerm = endTermEl?.value || 'ARROW';
      const origEndTerm = normalizeTerminal(origNode.connectorEndTerminal, 'ARROW');
      if (currentEndTerm !== origEndTerm) return true;

      // 5. Offsets
      const startOffEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
      const endOffEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
      const currentStartOff = startOffEl?.value ? parseFloat(startOffEl.value) : 0;
      const origStartOff = origNode.connectorStartOffset ?? 0;
      if (Math.abs(currentStartOff - origStartOff) > 0.01) return true;
      const currentEndOff = endOffEl?.value ? parseFloat(endOffEl.value) : 0;
      const origEndOff = origNode.connectorEndOffset ?? 0;
      if (Math.abs(currentEndOff - origEndOff) > 0.01) return true;

      // 6. Routing / Pattern / Magnets
      const currentRouting = uiStateRef.current.selectedRoutingType || 'ORTHOGONAL';
      const origRouting = origNode.connectorRoutingType || 'ORTHOGONAL';
      if (currentRouting !== origRouting) return true;

      const currentPattern = uiStateRef.current.selectedLinePattern || 'SOLID';
      const origPattern = origNode.connectorStrokePattern || 'SOLID';
      if (currentPattern !== origPattern) return true;

      const currentSourceMag = uiStateRef.current.sourceMagnet || 'RIGHT';
      const origSourceMag = origNode.connectorSourceMagnet || 'RIGHT';
      if (currentSourceMag !== origSourceMag) return true;

      const currentTargetMag = uiStateRef.current.targetMagnet || 'LEFT';
      const origTargetMag = origNode.connectorTargetMagnet || 'LEFT';
      if (currentTargetMag !== origTargetMag) return true;

      return false;
    }

    const nodeActualType = origNode.flowNodeType || (origNode.nodeType === 'FRAME' ? 'Screen' : origNode.nodeType) || 'Screen';
    const effectiveNodeType = normalizeNodeType(uiStateRef.current.selectedNodeType || lastNodeConfigRef.current.nodeType || nodeActualType);
    const originalNodeType = normalizeNodeType(nodeActualType);

    // 1. Node Type
    if (effectiveNodeType !== originalNodeType) return true;

    const spec = NODE_TYPE_SHAPE_SPECS[effectiveNodeType];
    const isDescAllowed = spec?.allowDescription ?? false;
    const isScreen = effectiveNodeType === 'Screen';

    // 2. Title
    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const currentTitle = titleEl ? titleEl.value.trim() : (origNode.title || origNode.name || (isScreen ? 'Screen' : originalNodeType)).trim();
    const originalTitle = (origNode.title || origNode.name || (isScreen ? 'Screen' : originalNodeType)).trim();
    if (currentTitle !== originalTitle) return true;

    // 3. Description
    if (isDescAllowed) {
      const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
      const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
      const isDescOn = descToggleEl ? descToggleEl.checked : Boolean(lastNodeConfigRef.current.descriptionOn);
      const currentDesc = isDescOn ? (descEl ? descEl.value.trim() : (origNode.description || '').trim()) : '';
      const originalDesc = (origNode.description || '').trim();
      if (currentDesc !== originalDesc) return true;
    }

    // 4. Status
    if (isDescAllowed) {
      const statusToggleEl = document.getElementById('toggle-status') as HTMLInputElement | null;
      const isStatusOn = statusToggleEl ? statusToggleEl.checked : Boolean(lastNodeConfigRef.current.statusOn);
      const currentStatus = isStatusOn ? (uiStateRef.current.selectedStatus || lastNodeConfigRef.current.status || 'draft') : '';
      const originalStatus = origNode.status || '';
      if (currentStatus !== originalStatus) return true;
    }

    // 5. Figma Link
    if (isDescAllowed) {
      const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
      const linkUrlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
      const isLinkOn = linkToggleEl ? linkToggleEl.checked : Boolean(lastNodeConfigRef.current.singleLinkOn);
      const rawCurrentLink = isLinkOn ? (linkUrlEl ? linkUrlEl.value.trim() : (origNode.figmaLink || '').trim()) : '';
      const currentLink = rawCurrentLink ? (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawCurrentLink) ? rawCurrentLink : `https://${rawCurrentLink}`) : '';
      const originalLink = (origNode.figmaLink || '').trim();
      if (currentLink !== originalLink) return true;
    }

    // 6. Step Badges
    const stepToggleEl = document.getElementById('toggle-step-badges') as HTMLInputElement | null;
    const isStepOn = stepToggleEl ? stepToggleEl.checked : Boolean(lastNodeConfigRef.current.stepBadgesOn);
    const originalStepOn = origNode.stepNumber !== undefined;
    if (isStepOn !== originalStepOn) return true;
    if (isStepOn) {
      const stepNumEl = document.getElementById('input-step-number') as HTMLInputElement | null;
      const currentStepNum = stepNumEl ? parseInt(stepNumEl.value, 10) || 1 : (origNode.stepNumber || 1);
      const originalStepNum = origNode.stepNumber || 1;
      if (currentStepNum !== originalStepNum) return true;

      const currentBadgeCorner = uiStateRef.current.selectedBadgeCorner || lastNodeConfigRef.current.badgeCorner || 'TOP_LEFT';
      const originalBadgeCorner = origNode.badgeCorner || 'TOP_LEFT';
      if (currentBadgeCorner !== originalBadgeCorner) return true;

      const currentBadgeShape = uiStateRef.current.selectedBadgeShape || lastNodeConfigRef.current.badgeShape || 'Square';
      const originalBadgeShape = origNode.badgeShape || 'Square';
      if (currentBadgeShape !== originalBadgeShape) return true;

      const currentBadgeColorMode = uiStateRef.current.selectedBadgeColorMode || lastNodeConfigRef.current.badgeColorMode || 'Style';
      const originalBadgeColorMode = origNode.badgeColorMode || 'Style';
      if (currentBadgeColorMode !== originalBadgeColorMode) return true;
    }

    // 7. Elevation
    const elevToggleEl = document.getElementById('toggle-elevation') as HTMLInputElement | null;
    const isElevOn = elevToggleEl ? elevToggleEl.checked : Boolean(lastNodeConfigRef.current.elevationOn);
    const currentElevation = isElevOn ? (uiStateRef.current.selectedElevation ?? lastNodeConfigRef.current.elevation ?? 0) : null;
    const originalElevation = (origNode.elevation !== undefined && origNode.elevation !== null) ? origNode.elevation : null;
    if (currentElevation !== originalElevation) return true;

    // 8. Color (Fill)
    const currentColor = (uiStateRef.current.selectedColor || lastNodeConfigRef.current.color || '#ffffff').toLowerCase();
    const actualColor = (actualNode.fillColorHex || origNode.fillColorHex || '#ffffff').toLowerCase();
    if (currentColor !== actualColor) return true;

    // 9. Stroke
    const currentStrokeWeight = uiStateRef.current.selectedStrokeWeight !== undefined ? uiStateRef.current.selectedStrokeWeight : (lastNodeConfigRef.current.strokeWeight ?? 1.5);
    const actualStrokeWeight = actualNode.strokeWeight !== undefined ? actualNode.strokeWeight : (origNode.strokeWeight ?? 1.5);
    if (Math.abs(currentStrokeWeight - actualStrokeWeight) > 0.01) return true;

    if (currentStrokeWeight > 0) {
      const currentStrokeColor = (uiStateRef.current.selectedStrokeColor || lastNodeConfigRef.current.strokeColor || '#000000').toLowerCase();
      const actualStrokeColor = (actualNode.strokeColorHex || origNode.strokeColorHex || '#000000').toLowerCase();
      if (currentStrokeColor !== actualStrokeColor) return true;
    }

    // 10. Size (Screen 타입)
    if (isScreen) {
      const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
      const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
      const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;

      if (wEl && wEl.value !== '') {
        const parsedW = parseInt(wEl.value, 10);
        if (!isNaN(parsedW) && typeof origNode.width === 'number' && parsedW !== origNode.width) return true;
      }
      if (hEl && hEl.value !== '') {
        const parsedH = parseInt(hEl.value, 10);
        if (!isNaN(parsedH) && typeof origNode.height === 'number' && parsedH !== origNode.height) return true;
      }
      if (rEl && rEl.value !== '') {
        const parsedR = parseInt(rEl.value, 10);
        const origR = origNode.cornerRadius ?? 0;
        if (!isNaN(parsedR) && parsedR !== origR) return true;
      }

      const currentSizeMode = lastNodeConfigRef.current.sizeMode || 'fixed';
      const originalSizeMode = origNode.sizeMode || 'fixed';
      if (currentSizeMode !== originalSizeMode) return true;
    }

    return false;
  }, []);

  const revertSingleNodeForm = useCallback((orig: NodeInfo) => {
    const isConn = Boolean(orig.isConnector || orig.nodeType === 'CONNECTOR');
    if (isConn) {
      const labelToggleEl = document.getElementById('toggle-conn-label') as HTMLInputElement | null;
      const labelInputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
      const hasLabel = Boolean(orig.connectorLabel);
      if (labelToggleEl) labelToggleEl.checked = hasLabel;
      if (labelInputEl) labelInputEl.value = orig.connectorLabel || '';

      const colorEl = document.getElementById('conn-line-color') as HTMLInputElement | null;
      if (colorEl && orig.connectorColorHex) colorEl.value = orig.connectorColorHex;

      const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
      if (weightEl) weightEl.value = String(orig.connectorStrokeWeight ?? 1.5);

      const startTermEl = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
      if (startTermEl) startTermEl.value = normalizeTerminal(orig.connectorStartTerminal, 'NONE');

      const endTermEl = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
      if (endTermEl) endTermEl.value = normalizeTerminal(orig.connectorEndTerminal, 'ARROW');

      const startOffEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
      if (startOffEl) startOffEl.value = String(orig.connectorStartOffset ?? 0);

      const endOffEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
      if (endOffEl) endOffEl.value = String(orig.connectorEndOffset ?? 0);

      setUIState({
        selectedConnectorColor: orig.connectorColorHex || '#000000',
        selectedRoutingType: orig.connectorRoutingType || 'ORTHOGONAL',
        selectedLinePattern: orig.connectorStrokePattern || 'SOLID',
        sourceMagnet: orig.connectorSourceMagnet || 'RIGHT',
        targetMagnet: orig.connectorTargetMagnet || 'LEFT',
      });

      setLastConnectorConfig({
        labelOn: hasLabel,
        labelText: orig.connectorLabel || '',
      });

      triggerFormChange();
      return;
    }

    const origType = normalizeNodeType(orig.flowNodeType || (orig.nodeType === 'FRAME' ? 'Screen' : orig.nodeType) || 'Screen');
    const isScreen = origType === 'Screen';
    const spec = NODE_TYPE_SHAPE_SPECS[origType];
    const isDescAllowed = spec?.allowDescription ?? false;

    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    if (titleEl) titleEl.value = orig.title || orig.name || (isScreen ? 'Screen' : origType);

    const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
    const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
    const hasDesc = Boolean(orig.description && orig.description.trim());
    if (descToggleEl) descToggleEl.checked = hasDesc;
    if (descEl) descEl.value = orig.description || '';

    const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
    const linkUrlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
    const hasLink = Boolean(orig.figmaLink);
    if (linkToggleEl) linkToggleEl.checked = hasLink;
    if (linkUrlEl) linkUrlEl.value = orig.figmaLink || '';

    const statusToggleEl = document.getElementById('toggle-status') as HTMLInputElement | null;
    if (statusToggleEl) statusToggleEl.checked = Boolean(orig.status);

    const stepToggleEl = document.getElementById('toggle-step-badges') as HTMLInputElement | null;
    const stepNumEl = document.getElementById('input-step-number') as HTMLInputElement | null;
    const hasStep = orig.stepNumber !== undefined;
    if (stepToggleEl) stepToggleEl.checked = hasStep;
    if (stepNumEl && hasStep) stepNumEl.value = String(orig.stepNumber);

    const elevToggleEl = document.getElementById('toggle-elevation') as HTMLInputElement | null;
    const hasElev = orig.elevation !== undefined && orig.elevation !== null;
    if (elevToggleEl) elevToggleEl.checked = hasElev;

    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    if (wEl && orig.width) wEl.value = String(orig.width);
    if (hEl && orig.height) hEl.value = String(orig.height);
    if (rEl) rEl.value = String(orig.cornerRadius ?? 0);

    const colorUpdates: Partial<UIState> = {
      selectedNodeType: origType,
      selectedColor: orig.fillColorHex || '#ffffff',
      selectedStrokeWeight: orig.strokeWeight,
      selectedStrokeColor: orig.strokeColorHex,
      selectedElevation: hasElev ? orig.elevation : 0,
      selectedStatus: orig.status || 'draft',
      selectedBadgeCorner: orig.badgeCorner || 'TOP_LEFT',
      selectedBadgeShape: orig.badgeShape || 'Square',
      selectedBadgeColorMode: orig.badgeColorMode || 'Style',
    };
    setUIState(colorUpdates);

    setLastNodeConfig({
      nodeType: origType,
      width: orig.width || (isScreen ? 250 : spec?.width || 250),
      height: orig.height || (isScreen ? 90 : spec?.height || 90),
      cornerRadius: orig.cornerRadius ?? 0,
      color: orig.fillColorHex || '#ffffff',
      strokeWeight: orig.strokeWeight,
      strokeColor: orig.strokeColorHex,
      sizeMode: orig.sizeMode || 'fixed',
      elevationOn: hasElev,
      elevation: orig.elevation ?? 0,
      statusOn: Boolean(orig.status),
      status: orig.status || 'draft',
      stepBadgesOn: hasStep,
      stepNumber: orig.stepNumber || 1,
      badgeCorner: orig.badgeCorner || 'TOP_LEFT',
      badgeShape: orig.badgeShape || 'Square',
      badgeColorMode: orig.badgeColorMode || 'Style',
      descriptionOn: isDescAllowed ? hasDesc : false,
      singleLinkOn: isDescAllowed ? hasLink : false,
      singleLinkUrl: orig.figmaLink || '',
    });

    triggerFormChange();
  }, [setUIState, setLastNodeConfig, setLastConnectorConfig, triggerFormChange]);

  const hasSingleChanges = selectedNodes.length === 1 ? checkHasSingleChanges() : false;

  const handleUndo = useCallback(() => {
    if (selectedNodesRef.current.length >= 2 && Object.keys(multiDraftRef.current).length > 0) {
      clearMultiDraft();
      showToast('변경사항이 취소되었습니다.', 'info');
      return;
    }
    const snapshot = lastAppliedSnapshotRef.current;
    if (snapshot) {
      if (snapshot.type === 'single' && snapshot.singlePayload) {
        parent.postMessage({
          pluginMessage: {
            type: 'UPDATE_FLOW_NODE',
            payload: snapshot.singlePayload,
          }
        }, '*');
        showToast('작업이 되돌려졌습니다.', 'info');
      } else if (snapshot.type === 'batch' && snapshot.batchItems && snapshot.batchItems.length > 0) {
        const patchGroups = new Map<string, { nodeIds: string[]; patch: NodePatchPayload }>();
        snapshot.batchItems.forEach(item => {
          const key = JSON.stringify(item.patch);
          const existing = patchGroups.get(key);
          if (existing) {
            existing.nodeIds.push(item.nodeId);
          } else {
            patchGroups.set(key, { nodeIds: [item.nodeId], patch: item.patch });
          }
        });
        patchGroups.forEach(({ nodeIds, patch }) => {
          parent.postMessage({
            pluginMessage: {
              type: 'BATCH_UPDATE_FLOW_NODES',
              payload: { nodeIds, patch }
            }
          }, '*');
        });
        showToast('작업이 되돌려졌습니다.', 'info');
      } else if (snapshot.type === 'connector' && snapshot.connectorItems && snapshot.connectorItems.length > 0) {
        snapshot.connectorItems.forEach(item => {
          parent.postMessage({
            pluginMessage: {
              type: 'UPDATE_CONNECTOR_PROPERTIES',
              payload: item.payload,
            }
          }, '*');
        });
        showToast('작업이 되돌려졌습니다.', 'info');
      }
      setLastAppliedSnapshot(null);
      lastAppliedSnapshotRef.current = null;
    } else if (originalSelectedNodeRef.current && selectedNodesRef.current.length === 1) {
      revertSingleNodeForm(originalSelectedNodeRef.current);
      showToast('변경사항이 취소되었습니다.', 'info');
    }
  }, [showToast, revertSingleNodeForm]);

  const lastResizeHeightRef = useRef(0);
  const resizeTimerRef = useRef<number | null>(null);

  const autoResizeWindow = useCallback(() => {
    if (resizeTimerRef.current !== null) {
      clearTimeout(resizeTimerRef.current);
    }
    resizeTimerRef.current = window.setTimeout(() => {
      const root = document.getElementById('plugin-root');
      if (!root) return;
      const idealHeight = getPluginIdealHeight(root);
      if (idealHeight > 100 && Math.abs(idealHeight - lastResizeHeightRef.current) >= 2) {
        lastResizeHeightRef.current = idealHeight;
        parent.postMessage({
          pluginMessage: { type: 'RESIZE_WINDOW', width: 360, height: idealHeight }
        }, '*');
      }
    }, 35);
  }, []);

  const closeAllPopovers = useCallback(() => {
    setContextMenuOpen(false);
    setSizeModeDropdownOpen(false);
  }, []);

  const lastNodeTabRef = useRef<string>('node');

  const setCurrentTab = useCallback((tab: string) => {
    if (currentTabRef.current === tab) return;
    closeAllPopovers();
    setCurrentTabState(tab);
    currentTabRef.current = tab;
    // 일반 노드가 선택된 상태에서 탭을 변경한 경우 마지막 탭으로 기억
    if (selectedNodesRef.current.length > 0 && !isConnectorSelectedRef.current) {
      lastNodeTabRef.current = tab;
    }
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }, [closeAllPopovers, autoResizeWindow]);

  // ---- 핵심 피그마 통신 함수들 ----

  const applyCurrentNodeState = useCallback((
    overrideSizeMode?: string,
    styleOverrides?: {
      colorHex?: string;
      strokeWeight?: number;
      strokeColor?: string;
    },
    linkOverrides?: {
      figmaLink?: string;
      clearLinkCache?: boolean;
    },
    overrideNodeType?: DiagramNodeType,
    overrideSize?: {
      width?: number;
      height?: number;
      cornerRadius?: number;
    },
    overrideTitle?: string
  ) => {
    const nodes = selectedNodesRef.current;
    if (!nodes || nodes.length === 0) return;

    if (nodes.length === 1) {
      isApplyingSingleRef.current = true;
    }

    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
    const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const urlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
    const singleLinkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
    const sizeModeEl = document.getElementById('select-size-mode') as HTMLInputElement | null;

    const { selectedColor, selectedElevation, selectedNodeType } = uiStateRef.current;
    const firstNode = nodes[0];
    const nodeActualType = firstNode?.flowNodeType || (firstNode?.nodeType === 'FRAME' ? 'Screen' : firstNode?.nodeType);
    const activeTypeBtn = document.querySelector('#node-type-icons .type-icon-btn.active') as HTMLElement | null;
    const domNodeType = (activeTypeBtn?.dataset.type as DiagramNodeType) || undefined;
    const rawNodeType = overrideNodeType || domNodeType || nodeActualType || selectedNodeType;
    const effectiveNodeType = normalizeNodeType(rawNodeType);
    const spec = NODE_TYPE_SHAPE_SPECS[effectiveNodeType];
    const isDescAllowed = spec?.allowDescription ?? false;
    const isScreen = effectiveNodeType === 'Screen';

    const currentTitleVal = titleEl?.value.trim();
    const rawTitle = overrideTitle !== undefined
      ? overrideTitle
      : (currentTitleVal || (isScreen ? 'Screen' : effectiveNodeType));
    if (rawTitle.length > 32) {
      showToast('제목은 최대 32자까지 입력할 수 있습니다.', 'warning');
    }
    const title = rawTitle.slice(0, 32);
    const rawDesc = descEl?.value !== undefined ? descEl.value.trim() : '';
    const isDescOn = descToggleEl ? descToggleEl.checked : (lastNodeConfigRef.current.descriptionOn ?? false);
    // 비활성화(숨김) 시에도 기존 description 데이터를 보존하여 전달 (스위치가 꺼져도 데이터 자체는 유지)
    const currentDesc = rawDesc || firstNode?.description || '';
    const desc = isDescOn ? rawDesc : currentDesc;
    const w = overrideSize?.width !== undefined
      ? overrideSize.width
      : (isScreen
          ? (parseInt(wEl?.value || '', 10) || firstNode?.width || lastNodeConfigRef.current.width || 250)
          : (!isDescAllowed && spec ? spec.width : (parseInt(wEl?.value || '250', 10) || 250)));
    const h = overrideSize?.height !== undefined
      ? overrideSize.height
      : (isScreen
          ? (parseInt(hEl?.value || '', 10) || firstNode?.height || lastNodeConfigRef.current.height || 90)
          : (!isDescAllowed && spec ? spec.height : (parseInt(hEl?.value || '90', 10) || 90)));
    const radius = overrideSize?.cornerRadius !== undefined
      ? overrideSize.cornerRadius
      : (isScreen
          ? (rEl?.value !== undefined && rEl?.value !== '' && !isNaN(parseInt(rEl.value, 10)) ? Math.max(0, parseInt(rEl.value, 10)) : (firstNode?.cornerRadius ?? (lastNodeConfigRef.current.cornerRadius ?? 0)))
          : (!isDescAllowed && spec ? (spec.cornerRadius ?? 0) : (parseInt(rEl?.value || '0', 10) || 0)));
    const isLinkOn = singleLinkToggleEl ? singleLinkToggleEl.checked : lastNodeConfigRef.current.singleLinkOn;
    const rawFigmaUrl = linkOverrides?.figmaLink !== undefined
      ? linkOverrides.figmaLink
      : (urlEl ? urlEl.value.trim() : '');
    const figmaUrl = rawFigmaUrl ? (
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawFigmaUrl) ? rawFigmaUrl : `https://${rawFigmaUrl}`
    ) : '';

    const elevToggleEl = document.getElementById('toggle-elevation') as HTMLInputElement | null;
    const isElevOn = elevToggleEl ? elevToggleEl.checked : Boolean(lastNodeConfigRef.current.elevationOn);
    const finalElevation = isElevOn ? selectedElevation : null;
    const statusToggleEl = document.getElementById('toggle-status') as HTMLInputElement | null;
    const isStatusOn = statusToggleEl ? statusToggleEl.checked : Boolean(lastNodeConfigRef.current.statusOn);
    const finalStatus = isStatusOn ? ((uiStateRef.current.selectedStatus || lastNodeConfigRef.current.status) as WorkflowStatus) : undefined;
    const finalColor = styleOverrides?.colorHex ?? selectedColor;
    const finalStrokeWeight = styleOverrides?.strokeWeight !== undefined
      ? styleOverrides.strokeWeight
      : (uiStateRef.current.selectedStrokeWeight !== undefined ? uiStateRef.current.selectedStrokeWeight : lastNodeConfigRef.current.strokeWeight);
    const finalStrokeColor = styleOverrides?.strokeColor !== undefined
      ? styleOverrides.strokeColor
      : (uiStateRef.current.selectedStrokeColor || lastNodeConfigRef.current.strokeColor);

    const sizeMode = overrideSizeMode || sizeModeEl?.value || lastNodeConfigRef.current.sizeMode || 'fixed';

    setLastNodeConfig({
      width: w,
      height: h,
      cornerRadius: radius,
      nodeType: effectiveNodeType,
      color: finalColor,
      strokeWeight: finalStrokeWeight,
      strokeColor: finalStrokeColor,
      elevationOn: isElevOn,
      elevation: selectedElevation,
      statusOn: isStatusOn,
      status: finalStatus || '',
      singleLinkOn: isLinkOn,
      singleLinkUrl: figmaUrl,
      sizeMode,
      descriptionOn: isDescOn,
    });

    nodes.forEach(node => {
      parent.postMessage({
        pluginMessage: {
          type: 'UPDATE_FLOW_NODE',
          payload: {
            nodeId: node.id,
            title: nodes.length === 1 ? title : (node.title || title),
            description: desc,
            descriptionOn: isDescOn,
            width: w, height: h, cornerRadius: radius,
            theme: node.theme || getCurrentUITheme(),
            figmaLink: figmaUrl,
            clearLinkCache: linkOverrides?.clearLinkCache,
            nodeType: effectiveNodeType,
            colorHex: finalColor,
            strokeWeight: finalStrokeWeight !== undefined ? finalStrokeWeight : node.strokeWeight,
            strokeColor: finalStrokeColor !== undefined ? finalStrokeColor : node.strokeColorHex,
            elevation: finalElevation,
            status: finalStatus,
            sizeMode,
          }
        }
      }, '*');
    });
  }, [setLastNodeConfig]);

  const addSizePreset = useCallback((preset: Omit<SizePreset, 'id'>) => {
    const newId = `size-${typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
    const newPreset: SizePreset = {
      ...preset,
      id: newId,
    };
    const next = [...sizePresets, newPreset];
    savePresets(next);
    // 새로 추가된 프리셋을 선택 상태로 설정
    setSelectedSizePresetId(newId);
    setLastNodeConfig({
      width: preset.w,
      height: preset.h,
      cornerRadius: preset.radius ?? 0,
      sizeMode: preset.sizeMode || 'fixed',
    });
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    if (wEl) wEl.value = String(preset.w);
    if (hEl) hEl.value = String(preset.h);
    if (rEl) rEl.value = String(preset.radius ?? 0);
    applyCurrentNodeState(preset.sizeMode);
    showToast(`"${preset.name}" 사이즈가 추가되었습니다.`, 'success');
  }, [sizePresets, savePresets, setSelectedSizePresetId, setLastNodeConfig, applyCurrentNodeState, showToast]);

  const updateSizePreset = useCallback((id: string, partial: Partial<SizePreset>) => {
    const next = sizePresets.map((p) => (p.id === id ? { ...p, ...partial } : p));
    savePresets(next);
    if (partial.w !== undefined || partial.h !== undefined) {
      setLastNodeConfig({
        width: partial.w,
        height: partial.h,
        cornerRadius: partial.radius,
        sizeMode: partial.sizeMode,
      });
      const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
      const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
      if (wEl && partial.w !== undefined) wEl.value = String(partial.w);
      if (hEl && partial.h !== undefined) hEl.value = String(partial.h);
      applyCurrentNodeState(partial.sizeMode);
    }
    showToast('사이즈가 업데이트되었습니다.', 'success');
  }, [sizePresets, savePresets, setLastNodeConfig, applyCurrentNodeState, showToast]);

  const deleteSizePreset = useCallback((id: string) => {
    const target = sizePresets.find((p) => p.id === id);
    const next = sizePresets.filter((p) => p.id !== id);
    savePresets(next);
    showToast(`"${target?.name || '사이즈'}" 프리셋이 삭제되었습니다.`, 'info');
  }, [sizePresets, savePresets, showToast]);

  const addStylePreset = useCallback((preset: Omit<StylePreset, 'id'>) => {
    const newId = `style-${typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
    const newPreset: StylePreset = {
      ...preset,
      id: newId,
    };
    const next = [...stylePresets, newPreset];
    saveStylePresets(next);
    setSelectedStylePresetId(newId);
    setUIState({
      selectedColor: preset.fillColor,
      selectedStrokeWeight: preset.strokeWeight,
      selectedStrokeColor: preset.strokeColor,
      selectedStylePresetId: newId,
    });
    setLastNodeConfig({
      color: preset.fillColor,
      strokeWeight: preset.strokeWeight,
      strokeColor: preset.strokeColor,
    });
    applyCurrentNodeState(undefined, {
      colorHex: preset.fillColor,
      strokeWeight: preset.strokeWeight,
      strokeColor: preset.strokeColor,
    });
    showToast(`스타일이 추가되었습니다.`, 'success');
  }, [stylePresets, saveStylePresets, setUIState, setLastNodeConfig, applyCurrentNodeState, showToast]);

  const updateStylePreset = useCallback((id: string, partial: Partial<StylePreset>) => {
    const next = stylePresets.map((p) => (p.id === id ? { ...p, ...partial } : p));
    saveStylePresets(next);
    showToast('스타일이 업데이트되었습니다.', 'success');
  }, [stylePresets, saveStylePresets, showToast]);

  const deleteStylePreset = useCallback((id: string) => {
    const target = stylePresets.find((p) => p.id === id);
    if (target?.isDefault || DEFAULT_STYLE_PRESET_IDS.has(target?.id || '')) {
      showToast('기본 스타일은 삭제할 수 없습니다.', 'warning');
      return;
    }
    const next = stylePresets.filter((p) => p.id !== id);
    saveStylePresets(next);
    showToast('스타일이 삭제되었습니다.', 'info');
  }, [stylePresets, saveStylePresets, showToast]);

  const applyStatusToNode = useCallback((status?: string) => {
    const nodes = selectedNodesRef.current;
    if (!nodes || nodes.length === 0) return;
    parent.postMessage({ pluginMessage: { type: 'SET_STATUS', status: status || '' } }, '*');
  }, []);

  const applyElevationToNodes = useCallback((level: number | null) => {
    setLastNodeConfig({
      elevationOn: level !== null,
      elevation: level ?? 0,
    });
    setUIState({
      selectedElevation: level ?? 0,
    });
    parent.postMessage({
      pluginMessage: {
        type: 'SET_ELEVATION',
        level,
      }
    }, '*');
  }, [setLastNodeConfig, setUIState]);

  const applyStepBadges = useCallback((startNumber: number = 1, corner?: string, shape?: string, colorMode?: 'White' | 'Black' | 'Style') => {
    const nodes = selectedNodesRef.current;
    if (!nodes || nodes.length === 0) return;
    parent.postMessage({
      pluginMessage: {
        type: 'ADD_STEP_BADGES',
        startNumber,
        corner: corner || uiStateRef.current.selectedBadgeCorner || 'TOP_LEFT',
        shape: shape || uiStateRef.current.selectedBadgeShape || 'Square',
        colorMode: colorMode || uiStateRef.current.selectedBadgeColorMode || 'Style',
      }
    }, '*');
  }, []);

  const removeStepBadgesFromNodes = useCallback(() => {
    const nodes = selectedNodesRef.current;
    if (!nodes || nodes.length === 0) return;
    parent.postMessage({
      pluginMessage: {
        type: 'REMOVE_STEP_BADGES',
      }
    }, '*');
  }, []);

  const applyCurrentConnectorState = useCallback((customStartOffset?: number, customEndOffset?: number) => {
    const nodes = selectedNodesRef.current;
    if (!isConnectorSelectedRef.current || !nodes || nodes.length === 0) return;

    const connNodes = nodes.filter(n => n && n.isConnector);
    if (connNodes.length === 0) return;

    if (connNodes.length === 1) {
      isApplyingSingleRef.current = true;
    }

    const snapshotItems = connNodes.map(node => ({
      connectorId: node.id,
      payload: {
        connectorId: node.id,
        colorHex: node.connectorColorHex,
        strokeWeight: node.connectorStrokeWeight,
        strokePattern: (node.connectorStrokePattern as ConnectorStrokePattern) || 'SOLID',
        routingType: (node.connectorRoutingType as ConnectorRoutingType) || 'ORTHOGONAL',
        startTerminal: normalizeTerminal(node.connectorStartTerminal, 'NONE') as ConnectorTerminalType,
        endTerminal: normalizeTerminal(node.connectorEndTerminal, 'ARROW') as ConnectorTerminalType,
        startOffset: node.connectorStartOffset ?? 0,
        endOffset: node.connectorEndOffset ?? 0,
        sourceMagnet: (node.connectorSourceMagnet as MagnetPosition) || 'RIGHT',
        targetMagnet: (node.connectorTargetMagnet as MagnetPosition) || 'LEFT',
        label: node.connectorLabel || '',
        hasLabel: Boolean(node.connectorLabel),
        isReversed: node.connectorIsReversed || false,
      }
    }));
    const newSnapshot: UndoSnapshot = {
      type: 'connector',
      connectorItems: snapshotItems,
    };
    setLastAppliedSnapshot(newSnapshot);
    lastAppliedSnapshotRef.current = newSnapshot;

    const labelToggleEl = document.getElementById('toggle-conn-label') as HTMLInputElement | null;
    const labelInputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
    const colorEl = document.getElementById('conn-line-color') as HTMLSelectElement | null;
    const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
    const startTermEl = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
    const endTermEl = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
    const startOffEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
    const endOffEl = document.getElementById('input-end-offset') as HTMLInputElement | null;

    const hasLabel = labelToggleEl?.checked || false;
    const label = hasLabel ? (labelInputEl?.value.trim() || '') : '';
    const colorRaw = colorEl?.value;
    const color = colorRaw && colorRaw.trim() ? colorRaw : undefined;
    const weightStr = weightEl?.value;
    const weight = weightStr && weightStr.trim() !== '' ? parseFloat(weightStr) : undefined;
    const startTermRaw = startTermEl?.value;
    const startTerm = startTermRaw && startTermRaw !== 'MIXED' ? (startTermRaw as ConnectorTerminalType) : undefined;
    const endTermRaw = endTermEl?.value;
    const endTerm = endTermRaw && endTermRaw !== 'MIXED' ? (endTermRaw as ConnectorTerminalType) : undefined;

    const startOffStr = startOffEl?.value;
    const startOffset = typeof customStartOffset === 'number'
      ? customStartOffset
      : (startOffStr !== undefined && startOffStr !== null && startOffStr.trim() !== '' ? parseFloat(startOffStr) : undefined);

    const endOffStr = endOffEl?.value;
    const endOffset = typeof customEndOffset === 'number'
      ? customEndOffset
      : (endOffStr !== undefined && endOffStr !== null && endOffStr.trim() !== '' ? parseFloat(endOffStr) : undefined);

    const { selectedLinePattern, selectedRoutingType, sourceMagnet, targetMagnet } = uiStateRef.current;

    connNodes.forEach(node => {
      parent.postMessage({
        pluginMessage: {
          type: 'UPDATE_CONNECTOR_PROPERTIES',
          payload: {
            connectorId: node.id,
            colorHex: color,
            strokeWeight: weight,
            strokePattern: selectedLinePattern,
            routingType: selectedRoutingType,
            startTerminal: startTerm,
            endTerminal: endTerm,
            startOffset,
            endOffset,
            sourceMagnet,
            targetMagnet,
            label,
            hasLabel,
            isReversed: node?.connectorIsReversed || false,
          }
        }
      }, '*');
    });
  }, []);

  const connectSelectedNodes = useCallback(() => {
    const nodes = selectedNodesRef.current;
    const isConn = isConnectorSelectedRef.current || (nodes.length > 0 && nodes.every(n => n && n.isConnector));

    if (isConn && nodes.length >= 1 && nodes.every(n => n && n.isConnector)) {
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
    const color = colorEl?.value?.trim() || uiStateRef.current.selectedConnectorColor || '#000000';
    const weight = parseFloat(weightEl?.value || '1.5') || 1.5;
    const startTerm = startTermEl?.value || 'NONE';
    const endTerm = endTermEl?.value || 'ARROW';
    const startOff = parseFloat(startOffEl?.value || '0') || 0;
    const endOff = parseFloat(endOffEl?.value || '0') || 0;
    const isLinkOn = linkToggleEl ? linkToggleEl.checked : (lastConnectorConfigRef.current.linkOn || false);
    const rawLinkUrl = linkUrlEl ? linkUrlEl.value.trim() : (lastConnectorConfigRef.current.linkUrl || '');
    const figmaLink = isLinkOn ? rawLinkUrl : '';
    const { selectedLinePattern, selectedRoutingType, sourceMagnet, targetMagnet } = uiStateRef.current;

    if (nodes.length === 2) {
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
    } else {
      // 3개 이상 다중 노드 선택: 순차 체인 연결 (1 -> 2 -> ... -> N)
      for (let i = 0; i < nodes.length - 1; i++) {
        const src = nodes[i];
        const tgt = nodes[i + 1];

        let pairSourceMag = sourceMagnet;
        let pairTargetMag = targetMagnet;

        if (typeof src.x === 'number' && typeof tgt.x === 'number' && typeof src.y === 'number' && typeof tgt.y === 'number') {
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          if (Math.abs(dx) >= Math.abs(dy)) {
            pairSourceMag = dx >= 0 ? 'RIGHT' : 'LEFT';
            pairTargetMag = dx >= 0 ? 'LEFT' : 'RIGHT';
          } else {
            pairSourceMag = dy >= 0 ? 'BOTTOM' : 'TOP';
            pairTargetMag = dy >= 0 ? 'TOP' : 'BOTTOM';
          }
        }

        parent.postMessage({
          pluginMessage: {
            type: 'CONNECT_POINTS',
            payload: {
              sourceNodeId: src.id,
              sourceMagnet: i === 0 ? sourceMagnet : pairSourceMag,
              targetNodeId: tgt.id,
              targetMagnet: i === nodes.length - 2 ? targetMagnet : pairTargetMag,
              label: i === 0 ? label : '',
              colorHex: color,
              strokeWeight: weight,
              routingType: selectedRoutingType,
              strokePattern: selectedLinePattern,
              startTerminal: i === 0 ? startTerm : 'NONE',
              endTerminal: endTerm,
              startOffset: startOff,
              endOffset: endOff,
              figmaLink: i === 0 ? figmaLink : '',
            }
          }
        }, '*');
      }
    }
  }, [applyCurrentConnectorState, showToast]);

  const handleMainAction = useCallback(() => {
    const nodes = selectedNodesRef.current;
    const isConn = isConnectorSelectedRef.current || (nodes.length > 0 && nodes.every(n => n && n.isConnector));

    if (isConn && nodes.length >= 1 && nodes.every(n => n && n.isConnector)) {
      applyCurrentConnectorState();
      return;
    }

    // 다중 플로우 노드 선택 시: Apply to All 실행 (DOM 전체를 읽거나 Creation Cache를 수정하지 않고 오직 multiDraft만 사용하여 Batch 전송)
    if (nodes.length >= 2) {
      applyMultiDraft();
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

    const { selectedColor, selectedElevation, selectedStatus, selectedBadgeCorner, selectedBadgeShape } = uiStateRef.current;
    const activeTypeBtn = document.querySelector('#node-type-icons .type-icon-btn.active') as HTMLElement | null;
    const domNodeType = (activeTypeBtn?.dataset.type as DiagramNodeType) || undefined;
    const selectedNodeType = domNodeType || lastNodeConfigRef.current.nodeType || uiStateRef.current.selectedNodeType || 'Screen';
    const spec = NODE_TYPE_SHAPE_SPECS[selectedNodeType];
    const isDescAllowed = spec?.allowDescription ?? false;

    const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
    const defaultTitle = selectedNodeType === 'Screen' ? 'Screen' : selectedNodeType;
    const rawTitle = titleEl?.value.trim() || defaultTitle;
    if (rawTitle.length > 32) {
      showToast('제목은 최대 32자까지 입력할 수 있습니다.', 'warning');
    }
    const title = rawTitle.slice(0, 32); // 타이틀 글자 수 제한 (입력필드 너비 최적화)
    const isDescOn = descToggleEl ? descToggleEl.checked : (lastNodeConfigRef.current.descriptionOn ?? false);
    const desc = isDescOn ? (descEl?.value.trim() || '') : '';
    const effectiveDesc = isDescAllowed ? desc : '';

    const w = !isDescAllowed && spec ? spec.width : (parseInt(wEl?.value || '250', 10) || 250);
    const h = !isDescAllowed && spec ? spec.height : (parseInt(hEl?.value || '90', 10) || 90);
    let radius = !isDescAllowed && spec ? (spec.cornerRadius ?? 0) : (parseInt(rEl?.value || '0', 10) || 0);
    if (radius > 999) {
      radius = 999;
      if (rEl) rEl.value = '999';
      showToast('최대값은 999입니다.', 'warning');
    } else if (radius < 0) {
      radius = 0;
      if (rEl) rEl.value = '0';
    }

    const rawFigmaUrl = (isDescAllowed && singleLinkToggleEl?.checked && urlEl) ? urlEl.value.trim() : '';
    const figmaUrl = rawFigmaUrl ? (
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawFigmaUrl) ? rawFigmaUrl : `https://${rawFigmaUrl}`
    ) : '';

    const isElevOn = elevToggleEl ? elevToggleEl.checked : Boolean(lastNodeConfigRef.current.elevationOn);
    const finalElevation = isElevOn ? selectedElevation : null;

    const isStepOn = stepToggleEl ? stepToggleEl.checked : Boolean(lastNodeConfigRef.current.stepBadgesOn);
    const inputStepVal = stepNumEl ? parseInt(stepNumEl.value, 10) : NaN;
    const prevStepNum = lastNodeConfigRef.current.stepNumber;
    let targetStepNum: number;
    if (!isNaN(inputStepVal) && inputStepVal > 0) {
      targetStepNum = inputStepVal;
    } else if (typeof prevStepNum === 'number' && prevStepNum > 0) {
      targetStepNum = prevStepNum + 1;
    } else {
      targetStepNum = 1;
    }

    const newConfig: Partial<LastNodeConfig> = {
      width: w, height: h, cornerRadius: radius,
      nodeType: selectedNodeType, color: selectedColor,
      strokeWeight: lastNodeConfigRef.current.strokeWeight,
      strokeColor: lastNodeConfigRef.current.strokeColor,
      sizeMode: lastNodeConfigRef.current.sizeMode || (selectedNodeType === 'Screen' ? 'hug' : 'fixed'),
      elevationOn: isElevOn, elevation: selectedElevation,
      statusOn: statusToggleEl?.checked || false, status: selectedStatus,
      stepBadgesOn: isStepOn,
      stepNumber: isStepOn ? targetStepNum + 1 : targetStepNum,
      badgeCorner: selectedBadgeCorner,
      badgeShape: selectedBadgeShape,
      badgeColorMode: uiStateRef.current.selectedBadgeColorMode,
      singleLinkOn: (isDescAllowed && singleLinkToggleEl?.checked) || false,
      singleLinkUrl: figmaUrl,
      descriptionOn: isDescAllowed ? isDescOn : false,
    };
    setLastNodeConfig(newConfig);

    if (nodes.length === 1) {
      isApplyingSingleRef.current = true;
      const targetNode = nodes[0];
      const prevSinglePayload: UpdateNodePayload = {
        nodeId: targetNode.id,
        title: targetNode.title || targetNode.name || '',
        description: targetNode.description || '',
        width: targetNode.width,
        height: targetNode.height,
        cornerRadius: targetNode.cornerRadius,
        theme: targetNode.theme || 'light',
        figmaLink: targetNode.figmaLink || '',
        nodeType: (targetNode.flowNodeType || (targetNode.nodeType === 'FRAME' ? 'Screen' : targetNode.nodeType)) as DiagramNodeType,
        colorHex: targetNode.fillColorHex,
        elevation: targetNode.elevation !== undefined && targetNode.elevation !== null ? targetNode.elevation : null,
      };
      const newSnapshot: UndoSnapshot = {
        type: 'single',
        singlePayload: prevSinglePayload,
      };
      setLastAppliedSnapshot(newSnapshot);
      lastAppliedSnapshotRef.current = newSnapshot;

      parent.postMessage({
        pluginMessage: {
          type: 'UPDATE_FLOW_NODE',
          payload: { nodeId: nodes[0].id, title, description: effectiveDesc, width: w, height: h, cornerRadius: radius, theme: nodes[0]?.theme || getCurrentUITheme(), figmaLink: figmaUrl, nodeType: selectedNodeType, colorHex: selectedColor, elevation: finalElevation }
        }
      }, '*');
    } else if (nodes.length >= 2) {
      // Step 2: 다중 선택 시 기존의 전체 덮어쓰기 loop를 차단 (Apply 실행은 Step 3에서 구현)
      return;
    } else {
      parent.postMessage({
        pluginMessage: {
          type: 'CREATE_FLOW_NODE',
          payload: {
            title,
            description: effectiveDesc,
            width: w,
            height: h,
            cornerRadius: radius,
            theme: getCurrentUITheme(),
            figmaLink: figmaUrl,
            nodeType: selectedNodeType,
            colorHex: selectedColor,
            strokeWeight: lastNodeConfigRef.current.strokeWeight !== undefined ? lastNodeConfigRef.current.strokeWeight : 1.5,
            strokeColor: lastNodeConfigRef.current.strokeColor,
            sizeMode: (lastNodeConfigRef.current.sizeMode as ('fixed' | 'hug' | 'fit')) || (selectedNodeType === 'Screen' ? 'hug' : 'fixed'),
            elevation: isElevOn ? selectedElevation : undefined,
            status: (!isDescAllowed || !statusToggleEl?.checked) ? undefined : selectedStatus,
            badgeNumber: isStepOn ? targetStepNum : undefined,
            badgePosition: isStepOn ? (selectedBadgeCorner as BadgePosition) : undefined,
            badgeShape: isStepOn ? (selectedBadgeShape as BadgeShape) : undefined,
            badgeColorMode: isStepOn ? uiStateRef.current.selectedBadgeColorMode : undefined,
          }
        }
      }, '*');
    }
  }, [applyCurrentConnectorState, applyMultiDraft, setLastNodeConfig, showToast]);

  const handleSelectionChange = useCallback((
    count: number,
    nodes: NodeInfo[],
    meta: { flowNodeCount?: number; otherObjectCount?: number; connectorCount?: number; }
  ) => {
    // 다중 선택 Apply to All 완료 처리:
    // Core에서 batchUpdateFlowNodes 완료 후 handleSelectionChange가 호출되어 UI로 전달됨
    if (isApplyingMultiDraftRef.current) {
      if (applyTimeoutRef.current !== null) {
        window.clearTimeout(applyTimeoutRef.current);
        applyTimeoutRef.current = null;
      }
      clearMultiDraft();
      isApplyingMultiDraftRef.current = false;
      setIsApplyingMultiDraft(false);
    }

    // 실제 선택 노드 대상이 변경되었을 때만 열려있는 모든 드롭다운 및 팝오버를 닫음
    const prevIds = (selectedNodesRef.current || []).map(n => n?.id).filter(Boolean);
    const newIds = (nodes || []).map(n => n?.id).filter(Boolean);
    const isSelectionChanged =
      prevIds.length !== newIds.length ||
      prevIds.some((id, idx) => id !== newIds[idx]);

    if (isSelectionChanged) {
      closeAllPopovers();
    }

    // 다중 선택 Draft 폐기 로직: 선택 노드 집합(Set)이 변경되었을 때만 폐기
    // 동일한 노드 집합에 대한 단순 SELECTION_CHANGED 재발생 시에는 Draft 유지
    const sortedNewIds = [...newIds].sort();
    const sortedPrevDraftIds = multiDraftSelectionRef.current;
    const isDraftSelectionChanged =
      sortedNewIds.length !== sortedPrevDraftIds.length ||
      sortedNewIds.some((id, idx) => id !== sortedPrevDraftIds[idx]);

    if (isDraftSelectionChanged) {
      clearMultiDraft();
      multiDraftSelectionRef.current = sortedNewIds;
    }

    setSelectedNodes(nodes);
    selectedNodesRef.current = nodes;

    if (nodes && nodes.length === 1) {
      if (isSelectionChanged || isApplyingSingleRef.current || !originalSelectedNodeRef.current || originalSelectedNodeRef.current.id !== nodes[0].id) {
        originalSelectedNodeRef.current = { ...nodes[0] };
        isApplyingSingleRef.current = false;
        setLastAppliedSnapshot(null);
        lastAppliedSnapshotRef.current = null;
        triggerFormChange();
      }
    } else {
      originalSelectedNodeRef.current = null;
      isApplyingSingleRef.current = false;
    }

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
      if (nodes.length === 1 && nodes[0]) {
        const firstConn = nodes[0];
        setLastConnectorConfig({
          labelOn: Boolean(firstConn.connectorLabel),
          labelText: firstConn.connectorLabel || 'Text',
        });
        setUIState({
          selectedConnectorColor: firstConn.connectorColorHex || '#000000',
          selectedRoutingType: firstConn.connectorRoutingType || 'ORTHOGONAL',
          selectedLinePattern: firstConn.connectorStrokePattern || 'SOLID',
          sourceMagnet: firstConn.connectorSourceMagnet || 'RIGHT',
          targetMagnet: firstConn.connectorTargetMagnet || 'LEFT',
        });
      }
    } else if (count === 0) {
      // 바탕화면 클릭 (신규 생성 모드): 항상 node 탭이 기본 (플러그인 노드의 이전 속성 캐시를 유지하여 UI 동기화)
      setCurrentTab('node');
      setUIState({
        selectedNodeType: lastNodeConfigRef.current.nodeType || 'Screen',
        selectedColor: lastNodeConfigRef.current.color || '#ffffff',
        selectedStrokeWeight: lastNodeConfigRef.current.strokeWeight,
        selectedStrokeColor: lastNodeConfigRef.current.strokeColor,
        selectedElevation: lastNodeConfigRef.current.elevation ?? 0,
        selectedStatus: lastNodeConfigRef.current.status || 'draft',
        selectedBadgeCorner: lastNodeConfigRef.current.badgeCorner || 'TOP_LEFT',
        selectedBadgeShape: lastNodeConfigRef.current.badgeShape || 'Square',
        selectedBadgeColorMode: lastNodeConfigRef.current.badgeColorMode || 'Style',
      });
    } else {
      // 일반 노드 선택: 이전 노드에서 마지막으로 선택했던 탭으로 복원
      const targetTab = lastNodeTabRef.current || 'node';
      setCurrentTab(targetTab);

      // 플러그인으로 생성된 플로우 노드(isFlowNode === true) 및 Figma Screen 프레임에 대해 스타일 및 속성 캐시 동기화
      const flowNodes = nodes.filter(n => n && (n.isFlowNode || (!n.isConnector && (n.flowNodeType || n.nodeType === 'FRAME'))));
      if (flowNodes.length > 0) {
        const first = flowNodes[0];
        const eOn = Boolean(first.elevationOn);
        const eLevel = typeof first.elevation === 'number' ? first.elevation : 0;
        const nodeRadius = typeof first.cornerRadius === 'number' ? first.cornerRadius : 0;

        const nodeTypeVal = first.flowNodeType || (first.nodeType === 'FRAME' ? 'Screen' : first.nodeType) || 'Screen';
        const hasStatus = Boolean(first.status);
        const hasDesc = Boolean(first.description && first.description.trim());
        const linkVal = first.figmaLink || first.cachedFigmaLink || '';
        const hasLink = Boolean(linkVal);

        const colorUpdates: Partial<UIState> = {
          selectedElevation: eLevel,
          selectedNodeType: nodeTypeVal,
        };
        if (first.status) colorUpdates.selectedStatus = first.status;

        const hasStep = first.stepNumber !== undefined;
        const stepConfigUpdates: Partial<LastNodeConfig> = {};
        if (hasStep && typeof first.stepNumber === 'number') {
          stepConfigUpdates.stepBadgesOn = true;
          stepConfigUpdates.stepNumber = first.stepNumber;
          if (first.badgeCorner) stepConfigUpdates.badgeCorner = first.badgeCorner;
          if (first.badgeShape) stepConfigUpdates.badgeShape = first.badgeShape;
          if (first.badgeColorMode) stepConfigUpdates.badgeColorMode = first.badgeColorMode;

          colorUpdates.selectedBadgeCorner = first.badgeCorner || lastNodeConfigRef.current.badgeCorner || 'TOP_LEFT';
          colorUpdates.selectedBadgeShape = first.badgeShape || lastNodeConfigRef.current.badgeShape || 'Square';
          colorUpdates.selectedBadgeColorMode = first.badgeColorMode || lastNodeConfigRef.current.badgeColorMode || 'Style';
        }

        const baseConfigUpdates: Partial<LastNodeConfig> = {
          nodeType: nodeTypeVal,
          width: first.width,
          height: first.height,
          cornerRadius: nodeRadius,
          sizeMode: first.sizeMode || 'fixed',
          elevationOn: eOn,
          elevation: eLevel,
          statusOn: hasStatus,
          status: first.status || lastNodeConfigRef.current.status || 'draft',
          descriptionOn: hasDesc,
          singleLinkOn: hasLink,
          singleLinkUrl: linkVal,
          ...stepConfigUpdates,
        };

        if (first.fillColorHex) {
          colorUpdates.selectedColor = first.fillColorHex;
          colorUpdates.selectedStrokeWeight = first.strokeWeight;
          colorUpdates.selectedStrokeColor = first.strokeColorHex;

          // 등록된 스타일 프리셋 중 정확히 일치하는 것이 있는지 탐색
          const matchedPreset = stylePresets.find((p) => {
            const matchFill = p.fillColor.toLowerCase() === first.fillColorHex!.toLowerCase();
            if (!matchFill) return false;
            const currentWeight = first.strokeWeight !== undefined ? first.strokeWeight : 1.5;
            if (p.strokeWeight !== currentWeight) return false;
            if (p.strokeWeight > 0 && first.strokeColorHex) {
              if (p.strokeColor.toLowerCase() !== first.strokeColorHex.toLowerCase()) return false;
            }
            return true;
          });
          const matchedId = matchedPreset ? matchedPreset.id : null;
          colorUpdates.selectedStylePresetId = matchedId;
          setSelectedStylePresetId(matchedId);

          if (nodes.length === 1) {
            setLastNodeConfig({
              ...baseConfigUpdates,
              color: first.fillColorHex,
              strokeWeight: first.strokeWeight,
              strokeColor: first.strokeColorHex,
            });
          }
        } else if (nodes.length === 1) {
          setLastNodeConfig(baseConfigUpdates);
        }
        setUIState(colorUpdates);
      }
    }

    // 어피어런스 탭 독점 섹션 동기화 (한 번에 하나만 열리도록 유지)
    // 사용자가 UI에서 스위치를 조작한 직후 600ms 동안은 피그마의 중간 비동기 응답으로 덮어쓰지 않음
    const isUserLocked = Date.now() - userActionLockRef.current < 600;
    const currentNodeId = nodes.length === 1 ? nodes[0]?.id : (nodes.length > 1 ? 'MULTI' : null);
    const isDifferentNode = currentNodeId !== prevSelectedNodeIdRef.current;
    prevSelectedNodeIdRef.current = currentNodeId;

    if (!isUserLocked || isDifferentNode) {
      if (nodes.length > 0) {
        const flowNodes = nodes.filter(n => n && n.isFlowNode);
        const hasAnyElevation = flowNodes.some(n =>
          n.elevation !== undefined && n.elevation !== null
            ? n.elevation >= 0
            : Boolean(n.elevationOn)
        );
        if (hasAnyElevation) {
          setActiveAppearanceSection('elevation');
        } else {
          setActiveAppearanceSection(null);
        }
      } else {
        const hasElevation = Boolean(lastNodeConfigRef.current.elevationOn);
        if (hasElevation) {
          setActiveAppearanceSection('elevation');
        } else {
          setActiveAppearanceSection(null);
        }
      }
    }
  }, [closeAllPopovers, setCurrentTab, setLastNodeConfig, setUIState, clearMultiDraft]);

  const value: AppContextValue = {
    selectedNodes,
    setSelectedNodes,
    isConnectorSelected,
    currentTab,
    setCurrentTab,
    activeAppearanceSection,
    setActiveAppearanceSection: setActiveAppearanceSectionWithLock,
    uiState,
    setUIState,
    lastNodeConfig,
    setLastNodeConfig,
    lastConnectorConfig,
    setLastConnectorConfig,
    activeModal,
    setActiveModal,
    contextMenuOpen,
    setContextMenuOpen,
    sizeModeDropdownOpen,
    setSizeModeDropdownOpen,
    contextMenuPos,
    setContextMenuPos,
    contextMenuTarget,
    setContextMenuTarget,
    selectedSizePresetId,
    setSelectedSizePresetId,
    selectedStylePresetId,
    setSelectedStylePresetId,
    designFrames,
    setDesignFrames,
    loadDesignFrames,
    sizePresets,
    addSizePreset,
    updateSizePreset,
    deleteSizePreset,
    stylePresets,
    addStylePreset,
    updateStylePreset,
    deleteStylePreset,
    applyCurrentNodeState,
    applyStatusToNode,
    applyElevationToNodes,
    applyStepBadges,
    removeStepBadgesFromNodes,
    applyCurrentConnectorState,
    connectSelectedNodes,
    handleMainAction,
    handleSelectionChange,
    closeAllPopovers,
    showToast,
    autoResizeWindow,
    multiDraft,
    hasMultiDraft,
    updateMultiDraft,
    clearMultiDraft,
    clearMultiDraftKeys,
    isApplyingMultiDraft,
    hasSingleChanges,
    triggerFormChange,
    canUndo,
    handleUndo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
