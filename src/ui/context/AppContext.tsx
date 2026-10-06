import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { getPluginIdealHeight } from '../hooks/useAutoResize';
import type { ConnectorTerminalType, DiagramNodeType, WorkflowStatus, NodePatchPayload, UpdateNodePayload, ConnectorLabelBoxStyle, ConnectorLabelAlign, FlooowUsageState } from '../../types';
import {
  NODE_TYPE_SHAPE_SPECS,
  normalizeNodeType,
  normalizeBranchVariant,
  BRANCH_VARIANT_LABELS,
  isDefaultNodeTitle,
  getDefaultNodeTitle,
  supportsOption,
} from '../../domain/nodeDomain';
import {
  buildEndpointMagnetPatches,
  isGizmoDraftDirty,
  type ComputeGizmoMagnetsInput,
} from '../utils/gizmoState';
import { orderFlowNodesForChain } from '../../chainOrder';

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
  descriptionOn?: boolean;
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
  connectorLabelOn?: boolean;
  connectorLabelBoxStyle?: ConnectorLabelBoxStyle;
  connectorLabelAlign?: ConnectorLabelAlign;
  connectorLabelFillColor?: string;
  connectorLabelStrokeColor?: string;
  connectorSourceNodeName?: string;
  connectorTargetNodeName?: string;
  connectorSourceNodeType?: string;
  connectorTargetNodeType?: string;
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
  branchVariant?: string;
  hugHeight?: number;
  cachedFigmaLink?: string;
  connectorIsReversed?: boolean;
  connectedNodeNames?: string[];
  connectedNodeTypes?: string[];
  x?: number;
  y?: number;
}

export interface NodeOptionState {
  // Step 2 필드
  nodeType: string;
  fillColor: string;
  strokeWeight: number;
  strokeColor: string;
  // Step 3 필드
  elevation: number;
  status: string;
  badgeCorner: string;
  badgeShape: string;
  badgeColorMode?: 'White' | 'Black' | 'Style';
  // Step 1 필드
  width: number;
  height: number;
  cornerRadius: number;
  sizeMode: 'fixed' | 'hug' | 'fit' | string;
  elevationOn: boolean;
  statusOn: boolean;
  stepBadgesOn: boolean;
  descriptionOn: boolean;
  singleLinkOn: boolean;
  singleLinkUrl: string;
  stepNumber: number;
  branchVariant?: string;
}

/**
 * 미확정 입력 텍스트 (draft text) — 단일 소유권
 * controlled 숫자 입력(W/H/Radius, 스텝 번호)의 타이핑 중 텍스트를 보관한다.
 * 확정값은 NodeOptionState에 있으며, 이 state는 dirty 감지용으로만 읽는다.
 * NodeOptionState에 합치지 않고 별도 슬라이스로 유지한다.
 */
export interface FormTextDraftState {
  sizeW: string;
  sizeH: string;
  sizeR: string;
  stepNum: string;
  linkUrl: string;
}

export interface ConnectorLabelDraft {
  labelOn?: boolean;
  labelText?: string;
  labelFillColor?: string;
  labelStrokeColor?: string;
  labelAlign?: ConnectorLabelAlign;
  labelBoxStyle?: ConnectorLabelBoxStyle;
}

export interface LastConnectorConfig {
  labelOn: boolean;
  labelText: string;
  labelBoxStyle?: ConnectorLabelBoxStyle;
  labelAlign?: ConnectorLabelAlign;
  labelFillColor?: string;
  labelStrokeColor?: string;
  linkOn: boolean;
  linkUrl: string;
}

export interface UIState {
  selectedStylePresetId?: string | null;
  selectedLinePattern: string;
  selectedRoutingType: string;
  sourceMagnet: MagnetPosition | null;
  targetMagnet: MagnetPosition | null;
  selectedConnectorColor?: string;
  hasExistingConnection?: boolean;
  connectedConnectorIds?: string[];
  existingSourceMagnets?: MagnetPosition[];
  existingTargetMagnets?: MagnetPosition[];
  connectedConnectors?: ConnectedConnectorDetail[];
  orderedNodeIds?: string[];
  chainTotalPairs?: number;
  chainConnectedPairs?: number;
  chainMissingPairs?: number;
  multiNodeConnectors?: MultiNodeConnectorDetail[];
}

import { DesignFrameItem, BadgePosition, BadgeShape, ConnectorStrokePattern, ConnectorRoutingType, MagnetPosition, ConnectedConnectorDetail, MultiNodeConnectorDetail } from '../../types';

function normalizeTerminal(term?: string, fallback: string = 'NONE'): string {
  if (!term || term === 'BAR' || term === 'SQUARE') return fallback;
  return term;
}

// 모달 타입
export type ModalType = 'none' | 'add-size' | 'edit-size' | 'figma-design-picker' | 'add-style' | 'edit-style' | 'confirmation' | 'delete' | 'connector-color' | 'fill-color' | 'stroke-color' | 'label-fill-color' | 'label-stroke-color' | 'subscription';

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

  // 노드 옵션 상태 (통합 단일 소유권)
  nodeOptionState: NodeOptionState;
  setNodeOptionState: (state: Partial<NodeOptionState>) => void;

  // 미확정 입력 텍스트 (Size W/H/R, 스텝 번호 타이핑 중 텍스트, 단일 소유권)
  formTextDraft: FormTextDraftState;
  setFormTextDraft: (state: Partial<FormTextDraftState>) => void;

  // 커넥터 설정 기억
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

  // Flooow usage (Core live recount 기반, 표시용)
  flooowUsage: FlooowUsageState | null;
  setFlooowUsage: React.Dispatch<React.SetStateAction<FlooowUsageState | null>>;
  requestFlooowUsage: () => void;

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
  /** 선택된 커넥터(또는 기존 연결) 설정이 원본과 달라졌는지 */
  connectorDirty: boolean;
  markConnectorDirty: () => void;
  connectSelectedNodes: () => void;
  updateConnectedConnectorMagnets: (sourceMagnet?: MagnetPosition, targetMagnet?: MagnetPosition) => void;
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
  connectorLabelDraft: ConnectorLabelDraft;
  hasConnectorLabelDraft: boolean;
  updateConnectorLabelDraft: (partial: Partial<ConnectorLabelDraft>) => void;
  endpointDraft: EndpointMagnetDraft;
  endpointDirty: boolean;
  setEndpointMagnetDraft: (side: 'source' | 'target', magnet: MagnetPosition) => void;
  clearEndpointMagnetDraft: () => void;
  /** 단일 커넥터 기즈모 클릭 즉시 적용 (푸터 버튼 없이 Draft를 바로 전송) */
  applyEndpointMagnetDraft: () => void;
}

export interface EndpointMagnetDraft {
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
}

export function buildSelectionGizmoInput(
  nodes: NodeInfo[],
  ui: UIState,
  draft: EndpointMagnetDraft
): ComputeGizmoMagnetsInput {
  const allConnectors = nodes.length > 0 && nodes.every((n) => n && n.isConnector);
  return {
    isSingleConnector: allConnectors && nodes.length === 1,
    isMultiConnector: allConnectors && nodes.length >= 2,
    connectorNodes: nodes,
    hasExistingConnection: Boolean(ui.hasExistingConnection),
    connectedConnectors: ui.connectedConnectors,
    is3PlusNodes: nodes.length >= 3 && !allConnectors,
    startNodeId: nodes[0]?.id,
    multiNodeConnectors: ui.multiNodeConnectors,
    userPendingSourceMagnet: draft.sourceMagnet ?? null,
    userPendingTargetMagnet: draft.targetMagnet ?? null,
  };
}

// ============================================================
// 기본값
// ============================================================

export const DEFAULT_NODE_OPTION_STATE: NodeOptionState = {
  nodeType: 'Screen',
  fillColor: '#ffffff',
  strokeWeight: 1.5,
  strokeColor: '#000000',
  elevation: 0,
  status: 'draft',
  badgeCorner: 'TOP_LEFT',
  badgeShape: 'Square',
  badgeColorMode: 'Style',
  width: 250,
  height: 90,
  cornerRadius: 0,
  sizeMode: 'hug',
  elevationOn: false,
  statusOn: false,
  stepBadgesOn: false,
  descriptionOn: true,
  singleLinkOn: false,
  singleLinkUrl: '',
  stepNumber: 1,
  branchVariant: 'CIRCLE',
};

const DEFAULT_FORM_TEXT_DRAFT: FormTextDraftState = {
  sizeW: '',
  sizeH: '',
  sizeR: '',
  stepNum: '1',
  linkUrl: '',
};

const DEFAULT_CONNECTOR_COLOR = '#000000';
const DEFAULT_LABEL_FILL = '#FFFFFF';
const LEGACY_LABEL_COLOR = '#EA2039';

function normalizeHexColor(color?: string): string {
  const raw = (color || '').trim();
  const lower = raw.toLowerCase();
  if (!raw || lower === 'none' || lower === 'transparent') return '';
  const body = raw.replace('#', '').toUpperCase();
  return body ? `#${body}` : '';
}

function isExplicitNoneColor(color?: string): boolean {
  const lower = (color || '').trim().toLowerCase();
  return lower === 'none' || lower === 'transparent';
}

/** 라벨 배경이 아직 기본값(흰색, 또는 선 색을 따라가던 이전 기본)인지 */
export function labelFillIsDefault(fill?: string, connector?: string): boolean {
  if (isExplicitNoneColor(fill)) return false;
  const f = normalizeHexColor(fill);
  if (!f || f === DEFAULT_LABEL_FILL) return true;
  const line = normalizeHexColor(connector) || DEFAULT_CONNECTOR_COLOR;
  if (f === line || f === LEGACY_LABEL_COLOR) return true;
  return false;
}

/** 라벨 보더색이 아직 커넥터 선 색(또는 예전 기본 빨강)을 따르는지 */
export function labelStrokeFollowsConnector(stroke?: string, connector?: string): boolean {
  if (isExplicitNoneColor(stroke)) return false;
  const s = normalizeHexColor(stroke);
  const line = normalizeHexColor(connector) || DEFAULT_CONNECTOR_COLOR;
  if (!s || s === line || s === LEGACY_LABEL_COLOR) return true;
  return false;
}

const DEFAULT_LAST_CONNECTOR_CONFIG: LastConnectorConfig = {
  labelOn: false,
  labelText: '',
  labelBoxStyle: 'BOX',
  labelAlign: 'CENTER',
  labelFillColor: DEFAULT_LABEL_FILL,
  labelStrokeColor: DEFAULT_CONNECTOR_COLOR,
  linkOn: false,
  linkUrl: '',
};

const DEFAULT_UI_STATE: UIState = {
  selectedLinePattern: 'SOLID',
  selectedRoutingType: 'ORTHOGONAL',
  sourceMagnet: null,
  targetMagnet: null,
  selectedConnectorColor: '#000000',
  hasExistingConnection: false,
  connectedConnectorIds: [],
  connectedConnectors: [],
  existingSourceMagnets: [],
  existingTargetMagnets: [],
  multiNodeConnectors: [],
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
  const [nodeOptionState, setNodeOptionStateRaw] = useState<NodeOptionState>(DEFAULT_NODE_OPTION_STATE);
  const [formTextDraft, setFormTextDraftRaw] = useState<FormTextDraftState>(DEFAULT_FORM_TEXT_DRAFT);
  const [lastConnectorConfig, setLastConnectorConfigRaw] = useState<LastConnectorConfig>(DEFAULT_LAST_CONNECTOR_CONFIG);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [sizeModeDropdownOpen, setSizeModeDropdownOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ top: 0, left: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState<'size' | 'style' | null>(null);
  const [selectedSizePresetId, setSelectedSizePresetId] = useState<string | null>('default');
  const [selectedStylePresetId, setSelectedStylePresetId] = useState<string | null>('style-white');
  const [designFrames, setDesignFrames] = useState<DesignFrameItem[]>([]);

  // Flooow usage (Core live recount 기반, 표시용 — 저장 카운터 아님)
  const [flooowUsage, setFlooowUsage] = useState<FlooowUsageState | null>(null);

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

  const [connectorLabelDraft, setConnectorLabelDraftRaw] = useState<ConnectorLabelDraft>({});
  const connectorLabelDraftRef = useRef<ConnectorLabelDraft>({});
  const updateConnectorLabelDraft = useCallback((partial: Partial<ConnectorLabelDraft>) => {
    setConnectorLabelDraftRaw((prev) => {
      const next = { ...prev, ...partial };
      connectorLabelDraftRef.current = next;
      return next;
    });
  }, []);
  const clearConnectorLabelDraft = useCallback(() => {
    connectorLabelDraftRef.current = {};
    setConnectorLabelDraftRaw({});
  }, []);
  const hasConnectorLabelDraft = Object.keys(connectorLabelDraft).length > 0;

  const [endpointDraft, setEndpointDraftRaw] = useState<EndpointMagnetDraft>({});
  const endpointDraftRef = useRef<EndpointMagnetDraft>({});
  const setEndpointMagnetDraft = useCallback((side: 'source' | 'target', magnet: MagnetPosition) => {
    // ref를 동기적으로 갱신한다. 단일 커넥터는 클릭 직후 applyEndpointMagnetDraft를 호출하므로
    // updater 내부 갱신(비동기 실행)으로는 늦다.
    const next = side === 'source'
      ? { ...endpointDraftRef.current, sourceMagnet: magnet }
      : { ...endpointDraftRef.current, targetMagnet: magnet };
    endpointDraftRef.current = next;
    setEndpointDraftRaw(next);
  }, []);
  const clearEndpointMagnetDraft = useCallback(() => {
    endpointDraftRef.current = {};
    setEndpointDraftRaw({});
  }, []);

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
  const [connectorDirty, setConnectorDirty] = useState(false);
  const liveApplyConnectorRef = useRef<((customStartOffset?: number, customEndOffset?: number) => void) | null>(null);
  const markConnectorDirty = useCallback((customStartOffset?: number, customEndOffset?: number) => {
    setConnectorDirty(true);
    const nodes = selectedNodesRef.current;
    const singleConnector = nodes.length === 1 && Boolean(nodes[0]?.isConnector);
    const twoConnectedNodes = nodes.length === 2
      && nodes.every((n) => n && !n.isConnector)
      && Boolean(uiStateRef.current.hasExistingConnection);
    if (!singleConnector && !twoConnectedNodes) return;
    queueMicrotask(() => {
      liveApplyConnectorRef.current?.(customStartOffset, customEndOffset);
    });
  }, []);
  const [formChangeTick, setFormChangeTick] = useState(0);
  const triggerFormChange = useCallback(() => {
    setFormChangeTick(t => t + 1);
  }, []);

  // 1회성 Undo 스냅샷 상태 관리 (가장 최근의 Apply 또는 Apply to All 1회만 되돌림)
  const [lastAppliedSnapshot, setLastAppliedSnapshot] = useState<UndoSnapshot | null>(null);
  const lastAppliedSnapshotRef = useRef<UndoSnapshot | null>(null);
  const endpointDirty = isGizmoDraftDirty(buildSelectionGizmoInput(selectedNodes, uiState, endpointDraft));
  const canUndo = Boolean(lastAppliedSnapshot)
    || (selectedNodes.length >= 2 && (hasMultiDraft || hasConnectorLabelDraft))
    || endpointDirty;


  const applyMultiDraft = useCallback(() => {
    const nodes = selectedNodesRef.current;
    if (isApplyingMultiDraftRef.current) return;
    if (!nodes || nodes.length < 2) return;
    if (!hasMultiDraft) return;
    // 노드와 FigJam 오브젝트가 섞인 선택은 Connection 전용이다
    if (nodes.some((n) => n && !n.isFlowNode)) return;

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

  const requestFlooowUsage = useCallback(() => {
    parent.postMessage({ pluginMessage: { type: 'GET_FLOOOW_USAGE' } }, '*');
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
  const nodeOptionStateRef = useRef(nodeOptionState);
  const formTextDraftRef = useRef(formTextDraft);
  const lastConnectorConfigRef = useRef(lastConnectorConfig);

  useEffect(() => { selectedNodesRef.current = selectedNodes; }, [selectedNodes]);
  useEffect(() => { isConnectorSelectedRef.current = isConnectorSelected; }, [isConnectorSelected]);
  useEffect(() => { currentTabRef.current = currentTab; }, [currentTab]);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);
  useEffect(() => { nodeOptionStateRef.current = nodeOptionState; }, [nodeOptionState]);
  useEffect(() => { formTextDraftRef.current = formTextDraft; }, [formTextDraft]);
  useEffect(() => { lastConnectorConfigRef.current = lastConnectorConfig; }, [lastConnectorConfig]);

  const setUIState = useCallback((partial: Partial<UIState>) => {
    if (partial.selectedConnectorColor) {
      const prevLine = uiStateRef.current.selectedConnectorColor || DEFAULT_CONNECTOR_COLOR;
      const nextLine = normalizeHexColor(partial.selectedConnectorColor) || DEFAULT_CONNECTOR_COLOR;
      const cfg = lastConnectorConfigRef.current;
      if (nextLine !== normalizeHexColor(prevLine)) {
        const nextCfg = { ...cfg };
        let changed = false;
        if (labelFillIsDefault(cfg.labelFillColor, prevLine)) {
          nextCfg.labelFillColor = DEFAULT_LABEL_FILL;
          changed = true;
        }
        if (labelStrokeFollowsConnector(cfg.labelStrokeColor, prevLine)) {
          nextCfg.labelStrokeColor = nextLine;
          changed = true;
        }
        if (changed) {
          lastConnectorConfigRef.current = nextCfg;
          setLastConnectorConfigRaw(nextCfg);
        }
      }
    }
    uiStateRef.current = { ...uiStateRef.current, ...partial };
    setUIStateRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const setNodeOptionState = useCallback((partial: Partial<NodeOptionState>) => {
    nodeOptionStateRef.current = { ...nodeOptionStateRef.current, ...partial };
    setNodeOptionStateRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const setFormTextDraft = useCallback((partial: Partial<FormTextDraftState>) => {
    formTextDraftRef.current = { ...formTextDraftRef.current, ...partial };
    setFormTextDraftRaw(prev => ({ ...prev, ...partial }));
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
      const currentLabel = currentHasLabel ? (labelInputEl ? labelInputEl.value.trim() : (lastConnectorConfigRef.current.labelText || '').trim()) : '';
      const origHasLabel = origNode.connectorLabelOn !== undefined ? origNode.connectorLabelOn : Boolean(origNode.connectorLabel);
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
    const effectiveNodeType = normalizeNodeType(nodeOptionStateRef.current.nodeType || nodeActualType);
    const originalNodeType = normalizeNodeType(nodeActualType);

    // 1. Node Type
    if (effectiveNodeType !== originalNodeType) return true;

    const isScreen = effectiveNodeType === 'Screen';
    const targetNode = { flowNodeType: effectiveNodeType, isFlowNode: true };
    const canHaveDescription = supportsOption(targetNode, 'description');
    const canHaveStatus = supportsOption(targetNode, 'status');
    const canHaveFigmaLink = supportsOption(targetNode, 'figmaLink');

    // 2. Title
    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const currentTitle = titleEl ? titleEl.value.trim() : (origNode.title || origNode.name || (isScreen ? 'Screen' : originalNodeType)).trim();
    const originalTitle = (origNode.title || origNode.name || (isScreen ? 'Screen' : originalNodeType)).trim();
    if (currentTitle !== originalTitle) return true;

    // 3. Description
    // truth: NodeOptionState.descriptionOn (DOM 토글은 렌더 동기화용, 상태 우선)
    if (canHaveDescription) {
      const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
      const isDescOn = Boolean(nodeOptionStateRef.current.descriptionOn);
      const currentDesc = isDescOn ? (descEl ? descEl.value.trim() : (origNode.description || '').trim()) : '';
      const originalDesc = (origNode.description || '').trim();
      if (currentDesc !== originalDesc) return true;
    }

    // 4. Status
    // truth: NodeOptionState.statusOn/status (DOM 토글은 렌더 동기화용)
    if (canHaveStatus) {
      const isStatusOn = Boolean(nodeOptionStateRef.current.statusOn);
      const currentStatus = isStatusOn ? (nodeOptionStateRef.current.status || 'draft') : '';
      const originalStatus = origNode.status || '';
      if (currentStatus !== originalStatus) return true;
    }

    // 5. Figma Link
    // truth: NodeOptionState.singleLinkOn (URL 텍스트는 formTextDraft.linkUrl에서 읽음 — controlled input 미러)
    if (canHaveFigmaLink) {
      const isLinkOn = Boolean(nodeOptionStateRef.current.singleLinkOn);
      const rawCurrentLink = isLinkOn ? formTextDraftRef.current.linkUrl.trim() : '';
      const currentLink = rawCurrentLink ? (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawCurrentLink) ? rawCurrentLink : `https://${rawCurrentLink}`) : '';
      const originalLink = (origNode.figmaLink || '').trim();
      if (currentLink !== originalLink) return true;
    }

    // 6. Step Badges
    // truth: NodeOptionState.stepBadgesOn (번호 텍스트는 formTextDraft.stepNum에서 읽음 — controlled input 미러)
    const isStepOn = Boolean(nodeOptionStateRef.current.stepBadgesOn);
    const originalStepOn = origNode.stepNumber !== undefined;
    if (isStepOn !== originalStepOn) return true;
    if (isStepOn) {
      // controlled input 미러이므로 DOM 값과 항상 동일 — 마운트 해제 시에는 구값으로 폴백 불가하므로 파싱 우선
      const currentStepNum = parseInt(formTextDraftRef.current.stepNum, 10) || 1;
      const originalStepNum = origNode.stepNumber || 1;
      if (currentStepNum !== originalStepNum) return true;

      const currentBadgeCorner = nodeOptionStateRef.current.badgeCorner || 'TOP_LEFT';
      const originalBadgeCorner = origNode.badgeCorner || 'TOP_LEFT';
      if (currentBadgeCorner !== originalBadgeCorner) return true;

      const currentBadgeShape = nodeOptionStateRef.current.badgeShape || 'Square';
      const originalBadgeShape = origNode.badgeShape || 'Square';
      if (currentBadgeShape !== originalBadgeShape) return true;

      const currentBadgeColorMode = nodeOptionStateRef.current.badgeColorMode || 'Style';
      const originalBadgeColorMode = origNode.badgeColorMode || 'Style';
      if (currentBadgeColorMode !== originalBadgeColorMode) return true;
    }

    // 7. Elevation
    // truth: NodeOptionState.elevationOn/elevation (DOM 토글은 렌더 동기화용)
    const isElevOn = Boolean(nodeOptionStateRef.current.elevationOn);
    const currentElevation = isElevOn ? (nodeOptionStateRef.current.elevation ?? 0) : null;
    const originalElevation = (origNode.elevation !== undefined && origNode.elevation !== null) ? origNode.elevation : null;
    if (currentElevation !== originalElevation) return true;

    // 8. Color (Fill)
    const currentColor = (nodeOptionStateRef.current.fillColor || '#ffffff').toLowerCase();
    const actualColor = (actualNode.fillColorHex || origNode.fillColorHex || '#ffffff').toLowerCase();
    if (currentColor !== actualColor) return true;

    // 9. Stroke
    const currentStrokeWeight = nodeOptionStateRef.current.strokeWeight !== undefined ? nodeOptionStateRef.current.strokeWeight : 1.5;
    const actualStrokeWeight = actualNode.strokeWeight !== undefined ? actualNode.strokeWeight : (origNode.strokeWeight ?? 1.5);
    if (Math.abs(currentStrokeWeight - actualStrokeWeight) > 0.01) return true;

    if (currentStrokeWeight > 0) {
      const currentStrokeColor = (nodeOptionStateRef.current.strokeColor || '#000000').toLowerCase();
      const actualStrokeColor = (actualNode.strokeColorHex || origNode.strokeColorHex || '#000000').toLowerCase();
      if (currentStrokeColor !== actualStrokeColor) return true;
    }

    // 10. Size (Screen 타입)
    // controlled input 미러(formTextDraft)에서 읽음 — DOM 값과 항상 동일, 미확정 타이핑 포함
    if (isScreen) {
      const wText = formTextDraftRef.current.sizeW;
      const hText = formTextDraftRef.current.sizeH;
      const rText = formTextDraftRef.current.sizeR;

      if (wText !== '') {
        const parsedW = parseInt(wText, 10);
        if (!isNaN(parsedW) && typeof origNode.width === 'number' && parsedW !== origNode.width) return true;
      }
      if (hText !== '') {
        const parsedH = parseInt(hText, 10);
        if (!isNaN(parsedH) && typeof origNode.height === 'number' && parsedH !== origNode.height) return true;
      }
      if (rText !== '') {
        const parsedR = parseInt(rText, 10);
        const origR = origNode.cornerRadius ?? 0;
        if (!isNaN(parsedR) && parsedR !== origR) return true;
      }

      const currentSizeMode = nodeOptionStateRef.current.sizeMode || 'fixed';
      const originalSizeMode = origNode.sizeMode || 'fixed';
      if (currentSizeMode !== originalSizeMode) return true;
    }

    return false;
  }, []);

  const revertSingleNodeForm = useCallback((orig: NodeInfo) => {
    // NOTE(ownership): 옵션 truth는 NodeOptionState이며, 아래 DOM 쓰기는
    // 비제어 입력(title/desc/link/size 숫자)의 렌더 동기화용이다.
    const isConn = Boolean(orig.isConnector || orig.nodeType === 'CONNECTOR');
    if (isConn) {
      const labelToggleEl = document.getElementById('toggle-conn-label') as HTMLInputElement | null;
      const labelInputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
      const hasLabel = orig.connectorLabelOn !== undefined ? orig.connectorLabelOn : Boolean(orig.connectorLabel);
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
        sourceMagnet: (orig.connectorSourceMagnet as MagnetPosition) || 'RIGHT',
        targetMagnet: (orig.connectorTargetMagnet as MagnetPosition) || 'LEFT',
      });

      setLastConnectorConfig({
        labelOn: hasLabel,
        labelText: orig.connectorLabel || '',
        labelBoxStyle: orig.connectorLabelBoxStyle || 'BOX',
        labelAlign: orig.connectorLabelAlign || 'CENTER',
        labelFillColor: labelFillIsDefault(orig.connectorLabelFillColor, orig.connectorColorHex)
          ? DEFAULT_LABEL_FILL
          : (orig.connectorLabelFillColor || DEFAULT_LABEL_FILL),
        labelStrokeColor: labelStrokeFollowsConnector(orig.connectorLabelStrokeColor, orig.connectorColorHex)
          ? (orig.connectorColorHex || DEFAULT_CONNECTOR_COLOR)
          : (orig.connectorLabelStrokeColor || orig.connectorColorHex || DEFAULT_CONNECTOR_COLOR),
      });

      triggerFormChange();
      return;
    }

    const origType = normalizeNodeType(orig.flowNodeType || (orig.nodeType === 'FRAME' ? 'Screen' : orig.nodeType) || 'Screen');
    const isScreen = origType === 'Screen';
    const spec = NODE_TYPE_SHAPE_SPECS[origType];
    const origTargetNode = { flowNodeType: origType, isFlowNode: true };
    const canHaveDescription = supportsOption(origTargetNode, 'description');
    const canHaveFigmaLink = supportsOption(origTargetNode, 'figmaLink');

    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    if (titleEl) titleEl.value = orig.title || orig.name || (isScreen ? 'Screen' : origType);

    const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
    const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
    const hasDesc = Boolean(orig.description && orig.description.trim());
    if (descToggleEl) descToggleEl.checked = hasDesc;
    if (descEl) descEl.value = orig.description || '';

    const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
    const hasLink = Boolean(orig.figmaLink);
    if (linkToggleEl) linkToggleEl.checked = hasLink;
    // URL 텍스트는 controlled input이므로 텍스트 state로 복원 (DOM 직접 쓰기 금지)
    setFormTextDraft({ linkUrl: orig.figmaLink || '' });

    const statusToggleEl = document.getElementById('toggle-status') as HTMLInputElement | null;
    if (statusToggleEl) statusToggleEl.checked = Boolean(orig.status);

    const stepToggleEl = document.getElementById('toggle-step-badges') as HTMLInputElement | null;
    const hasStep = orig.stepNumber !== undefined;
    if (stepToggleEl) stepToggleEl.checked = hasStep;
    // 스텝 번호는 controlled input이므로 텍스트 state로 복원 (DOM 직접 쓰기 금지)
    if (hasStep) setFormTextDraft({ stepNum: String(orig.stepNumber) });

    const elevToggleEl = document.getElementById('toggle-elevation') as HTMLInputElement | null;
    const hasElev = orig.elevation !== undefined && orig.elevation !== null;
    if (elevToggleEl) elevToggleEl.checked = hasElev;

    // Size 입력은 controlled이므로 텍스트 state로 복원 (DOM 직접 쓰기 금지)
    if (orig.width) setFormTextDraft({ sizeW: String(orig.width) });
    if (orig.height) setFormTextDraft({ sizeH: String(orig.height) });
    setFormTextDraft({ sizeR: String(orig.cornerRadius ?? 0) });

    setNodeOptionState({
      nodeType: origType,
      fillColor: orig.fillColorHex || '#ffffff',
      strokeWeight: orig.strokeWeight !== undefined ? orig.strokeWeight : 1.5,
      strokeColor: orig.strokeColorHex || '#000000',
      width: orig.width || (isScreen ? 250 : spec?.width || 250),
      height: orig.height || (isScreen ? 90 : spec?.height || 90),
      cornerRadius: orig.cornerRadius ?? 0,
      sizeMode: orig.sizeMode || 'fixed',
      elevationOn: hasElev,
      elevation: hasElev ? orig.elevation : 0,
      statusOn: Boolean(orig.status),
      status: orig.status || 'draft',
      stepBadgesOn: hasStep,
      stepNumber: orig.stepNumber || 1,
      badgeCorner: orig.badgeCorner || 'TOP_LEFT',
      badgeShape: orig.badgeShape || 'Square',
      badgeColorMode: orig.badgeColorMode || 'Style',
      descriptionOn: canHaveDescription ? hasDesc : false,
      singleLinkOn: canHaveFigmaLink ? hasLink : false,
      singleLinkUrl: orig.figmaLink || '',
      branchVariant: origType === 'Branch'
        ? normalizeBranchVariant(orig.branchVariant)
        : nodeOptionStateRef.current.branchVariant,
    });

    triggerFormChange();
  }, [setNodeOptionState, setLastConnectorConfig, setFormTextDraft, triggerFormChange]);

  const hasSingleChanges = selectedNodes.length === 1 ? checkHasSingleChanges() : false;

  const handleUndo = useCallback(() => {
    if (selectedNodesRef.current.length >= 2 && Object.keys(multiDraftRef.current).length > 0) {
      clearMultiDraft();
      showToast('변경사항이 취소되었습니다.', 'info');
      return;
    }
    if (Object.keys(connectorLabelDraftRef.current).length > 0) {
      clearConnectorLabelDraft();
      showToast('변경사항이 취소되었습니다.', 'info');
      return;
    }
    if (isGizmoDraftDirty(buildSelectionGizmoInput(selectedNodesRef.current, uiStateRef.current, endpointDraftRef.current))) {
      clearEndpointMagnetDraft();
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
  }, [showToast, revertSingleNodeForm, clearMultiDraft, clearConnectorLabelDraft, clearEndpointMagnetDraft]);

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
    // 플로우 노드만 선택된 상태에서 탭을 변경한 경우 마지막 탭으로 기억
    // (노드+FigJam 혼합, FigJam 전용 선택은 Connection 고정이라 기억하지 않음)
    const tabNodes = selectedNodesRef.current;
    const pureFlowSelection = tabNodes.length > 0
      && !isConnectorSelectedRef.current
      && tabNodes.every((n) => n && n.isFlowNode);
    if (pureFlowSelection) {
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

    // NOTE(ownership): title/desc 텍스트는 비제어 입력이므로 DOM에서 읽는다.
    // 나머지 옵션(토글/색상/배지/elevation/size/mode/link)은 NodeOptionState가 truth다.
    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;

    const opts = nodeOptionStateRef.current;
    const firstNode = nodes[0];
    const effectiveNodeType = normalizeNodeType(overrideNodeType || opts.nodeType);
    const branchVariant = effectiveNodeType === 'Branch'
      ? normalizeBranchVariant(opts.branchVariant)
      : opts.branchVariant;
    const isScreen = effectiveNodeType === 'Screen';

    const currentTitleVal = titleEl?.value.trim();
    let rawTitle = overrideTitle !== undefined
      ? overrideTitle
      : (currentTitleVal || '');
    if (effectiveNodeType === 'Branch') {
      const branchLabel = BRANCH_VARIANT_LABELS[normalizeBranchVariant(branchVariant)];
      if (
        isDefaultNodeTitle(rawTitle)
        && (!rawTitle || rawTitle === 'Branch' || rawTitle === 'Screen' || overrideTitle !== undefined)
      ) {
        rawTitle = branchLabel;
        if (titleEl) titleEl.value = rawTitle;
      }
    } else if (!rawTitle) {
      rawTitle = isScreen ? 'Screen' : effectiveNodeType;
    }
    if (rawTitle.length > 32) {
      showToast('제목은 최대 32자까지 입력할 수 있습니다.', 'warning');
    }
    const title = rawTitle.slice(0, 32);
    const rawDesc = descEl?.value !== undefined ? descEl.value.trim() : '';
    const isDescOn = Boolean(opts.descriptionOn);
    // 비활성화(숨김) 시에도 기존 description 데이터를 보존하여 전달 (스위치가 꺼져도 데이터 자체는 유지)
    const currentDesc = rawDesc || firstNode?.description || '';
    const desc = isDescOn ? rawDesc : currentDesc;
    const w = overrideSize?.width !== undefined ? overrideSize.width : (opts.width || 250);
    const h = overrideSize?.height !== undefined ? overrideSize.height : (opts.height || 90);
    const radius = overrideSize?.cornerRadius !== undefined
      ? overrideSize.cornerRadius
      : (opts.cornerRadius ?? 0);
    const isLinkOn = Boolean(opts.singleLinkOn);
    const rawFigmaUrl = linkOverrides?.figmaLink !== undefined
      ? linkOverrides.figmaLink
      : (isLinkOn ? (opts.singleLinkUrl || '') : '');
    const figmaUrl = rawFigmaUrl ? (
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawFigmaUrl) ? rawFigmaUrl : `https://${rawFigmaUrl}`
    ) : '';

    const isElevOn = Boolean(opts.elevationOn);
    const finalElevation = isElevOn ? opts.elevation : null;
    const isStatusOn = Boolean(opts.statusOn);
    const finalStatus = isStatusOn ? (opts.status as WorkflowStatus) : undefined;
    const finalColor = styleOverrides?.colorHex ?? opts.fillColor;
    const finalStrokeWeight = styleOverrides?.strokeWeight !== undefined
      ? styleOverrides.strokeWeight
      : (opts.strokeWeight !== undefined ? opts.strokeWeight : 1.5);
    const finalStrokeColor = styleOverrides?.strokeColor !== undefined
      ? styleOverrides.strokeColor
      : (opts.strokeColor || '#000000');

    const sizeMode = overrideSizeMode || opts.sizeMode || 'hug';

    const nextNodeOptions: Partial<NodeOptionState> = {
      nodeType: effectiveNodeType,
      fillColor: finalColor,
      strokeWeight: finalStrokeWeight,
      strokeColor: finalStrokeColor,
      width: w,
      height: h,
      cornerRadius: radius,
      elevationOn: isElevOn,
      elevation: opts.elevation,
      statusOn: isStatusOn,
      singleLinkOn: isLinkOn,
      singleLinkUrl: linkOverrides?.figmaLink !== undefined ? figmaUrl : opts.singleLinkUrl,
      sizeMode,
      descriptionOn: isDescOn,
    };
    if (effectiveNodeType === 'Branch') {
      nextNodeOptions.branchVariant = branchVariant;
    }
    setNodeOptionState(nextNodeOptions);

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
            theme: node.theme || 'light',
            figmaLink: figmaUrl,
            clearLinkCache: linkOverrides?.clearLinkCache,
            nodeType: effectiveNodeType,
            branchVariant: effectiveNodeType === 'Branch' ? branchVariant : undefined,
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
  }, [setNodeOptionState]);

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
    setNodeOptionState({
      width: preset.w,
      height: preset.h,
      cornerRadius: preset.radius ?? 0,
      sizeMode: preset.sizeMode || 'fixed',
    });
    // controlled input이므로 텍스트 state로 즉시 반영 (DOM 직접 쓰기 금지)
    setFormTextDraft({
      sizeW: String(preset.w),
      sizeH: String(preset.h),
      sizeR: String(preset.radius ?? 0),
    });
    applyCurrentNodeState(preset.sizeMode);
    showToast(`"${preset.name}" 사이즈가 추가되었습니다.`, 'success');
  }, [sizePresets, savePresets, setSelectedSizePresetId, setNodeOptionState, setFormTextDraft, applyCurrentNodeState, showToast]);

  const updateSizePreset = useCallback((id: string, partial: Partial<SizePreset>) => {
    const next = sizePresets.map((p) => (p.id === id ? { ...p, ...partial } : p));
    savePresets(next);
    if (partial.w !== undefined || partial.h !== undefined) {
      setNodeOptionState({
        width: partial.w,
        height: partial.h,
        cornerRadius: partial.radius,
        sizeMode: partial.sizeMode,
      });
      // controlled input이므로 텍스트 state로 즉시 반영 (DOM 직접 쓰기 금지)
      if (partial.w !== undefined) setFormTextDraft({ sizeW: String(partial.w) });
      if (partial.h !== undefined) setFormTextDraft({ sizeH: String(partial.h) });
      applyCurrentNodeState(partial.sizeMode);
    }
    showToast('사이즈가 업데이트되었습니다.', 'success');
  }, [sizePresets, savePresets, setNodeOptionState, setFormTextDraft, applyCurrentNodeState, showToast]);

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
      selectedStylePresetId: newId,
    });
    setNodeOptionState({
      fillColor: preset.fillColor,
      strokeWeight: preset.strokeWeight,
      strokeColor: preset.strokeColor,
    });
    applyCurrentNodeState(undefined, {
      colorHex: preset.fillColor,
      strokeWeight: preset.strokeWeight,
      strokeColor: preset.strokeColor,
    });
    showToast(`스타일이 추가되었습니다.`, 'success');
  }, [stylePresets, saveStylePresets, setUIState, setNodeOptionState, applyCurrentNodeState, showToast]);

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
    setNodeOptionState({
      elevationOn: level !== null,
      elevation: level ?? 0,
    });
    parent.postMessage({
      pluginMessage: {
        type: 'SET_ELEVATION',
        level,
      }
    }, '*');
  }, [setNodeOptionState]);

  const applyStepBadges = useCallback((startNumber: number = 1, corner?: string, shape?: string, colorMode?: 'White' | 'Black' | 'Style') => {
    const nodes = selectedNodesRef.current;
    if (!nodes || nodes.length === 0) return;
    parent.postMessage({
      pluginMessage: {
        type: 'ADD_STEP_BADGES',
        startNumber,
        corner: corner || nodeOptionStateRef.current.badgeCorner || 'TOP_LEFT',
        shape: shape || nodeOptionStateRef.current.badgeShape || 'Square',
        colorMode: colorMode || nodeOptionStateRef.current.badgeColorMode || 'Style',
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

  const applyCurrentConnectorState = useCallback((customStartOffset?: number, customEndOffset?: number, includeMagnets: boolean = true) => {
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
        hasLabel: node.connectorLabelOn !== undefined ? node.connectorLabelOn : Boolean(node.connectorLabel),
        labelBoxStyle: node.connectorLabelBoxStyle,
        labelAlign: node.connectorLabelAlign,
        labelFillColor: node.connectorLabelFillColor,
        labelStrokeColor: node.connectorLabelStrokeColor,
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

    const hasLabel = labelToggleEl ? labelToggleEl.checked : Boolean(lastConnectorConfigRef.current.labelOn);
    const label = hasLabel ? (labelInputEl ? labelInputEl.value.trim() : (lastConnectorConfigRef.current.labelText || '').trim()) : '';
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
    // BUG-1: liveApply(즉시 적용) 경로에서는 endpointDraft magnet을 전송하지 않는다.
    // Gizmo magnet mutation은 footer Apply(handleMainAction) 경로(includeMagnets=true)에서만 수행한다.
    const endpointDraftNow = includeMagnets ? endpointDraftRef.current : {};
    const magnetPatches = includeMagnets ? buildEndpointMagnetPatches(
      buildSelectionGizmoInput(nodes, uiStateRef.current, endpointDraftNow)
    ) : [];
    const magnetPatchById = new Map(magnetPatches.map((patch) => [patch.id, patch]));
    const hasEndpointDraft = Boolean(endpointDraftNow.sourceMagnet || endpointDraftNow.targetMagnet);
    const labelDraft = connectorLabelDraftRef.current;
    const isMultiConnector = connNodes.length > 1;
    const labelBoxStyle = lastConnectorConfigRef.current.labelBoxStyle || 'BOX';
    const labelAlign = lastConnectorConfigRef.current.labelAlign || 'CENTER';
    const labelFillColor = lastConnectorConfigRef.current.labelFillColor || DEFAULT_LABEL_FILL;
    const labelStrokeColor = lastConnectorConfigRef.current.labelStrokeColor || uiStateRef.current.selectedConnectorColor || DEFAULT_CONNECTOR_COLOR;

    connNodes.forEach(node => {
      const magnetPatch = magnetPatchById.get(node.id);
      const labelPatch = isMultiConnector
        ? {
            ...(labelDraft.labelOn !== undefined ? { hasLabel: labelDraft.labelOn } : {}),
            ...(labelDraft.labelText !== undefined ? { label: labelDraft.labelText, hasLabel: labelDraft.labelOn !== false } : {}),
            ...(labelDraft.labelOn === false ? { hasLabel: false, label: '' } : {}),
            ...(labelDraft.labelBoxStyle ? { labelBoxStyle: labelDraft.labelBoxStyle } : {}),
            ...(labelDraft.labelAlign ? { labelAlign: labelDraft.labelAlign } : {}),
            ...(labelDraft.labelFillColor ? { labelFillColor: labelDraft.labelFillColor } : {}),
            ...(labelDraft.labelStrokeColor ? { labelStrokeColor: labelDraft.labelStrokeColor } : {}),
          }
        : {
            label,
            hasLabel,
            labelBoxStyle,
            labelAlign,
            labelFillColor,
            labelStrokeColor,
          };
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
            sourceMagnet: includeMagnets ? (magnetPatch?.sourceMagnet ?? (hasEndpointDraft ? undefined : (sourceMagnet || undefined))) : undefined,
            targetMagnet: includeMagnets ? (magnetPatch?.targetMagnet ?? (hasEndpointDraft ? undefined : (targetMagnet || undefined))) : undefined,
            ...labelPatch,
            isReversed: node?.connectorIsReversed || false,
          }
        }
      }, '*');
    });
    if (isMultiConnector) clearConnectorLabelDraft();
    if (includeMagnets) clearEndpointMagnetDraft();
    setConnectorDirty(false);
  }, [clearConnectorLabelDraft, clearEndpointMagnetDraft]);

  const applyExistingConnectionState = useCallback((customStartOffset?: number, customEndOffset?: number, includeMagnets: boolean = true) => {
    const conns = uiStateRef.current.connectedConnectors || [];
    if (conns.length === 0) return;

    // BUG-2: Draft가 있으면 stale uiState magnet으로 덮어쓰지 않는다.
    // Draft가 있는 endpoint만 buildEndpointMagnetPatches() 결과를 사용하고,
    // Draft가 없는 endpoint는 undefined(기존값 유지)로 전송한다.
    // liveApply(즉시 적용) 경로(includeMagnets=false)에서는 magnet을 전송하지 않고 Draft를 보존한다.
    const nodes = selectedNodesRef.current;
    const endpointDraftNow = includeMagnets ? endpointDraftRef.current : {};
    const magnetPatches = includeMagnets ? buildEndpointMagnetPatches(
      buildSelectionGizmoInput(nodes, uiStateRef.current, endpointDraftNow)
    ) : [];
    const magnetPatchById = new Map(magnetPatches.map((patch) => [patch.id, patch]));
    const hasEndpointDraft = Boolean(includeMagnets && (endpointDraftNow.sourceMagnet || endpointDraftNow.targetMagnet));

    const labelToggleEl = document.getElementById('toggle-conn-label') as HTMLInputElement | null;
    const labelInputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
    const colorEl = document.getElementById('conn-line-color') as HTMLInputElement | null;
    const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
    const startTermEl = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
    const endTermEl = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
    const startOffEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
    const endOffEl = document.getElementById('input-end-offset') as HTMLInputElement | null;

    const hasLabel = labelToggleEl ? labelToggleEl.checked : Boolean(lastConnectorConfigRef.current.labelOn);
    const label = hasLabel ? (labelInputEl ? labelInputEl.value.trim() : (lastConnectorConfigRef.current.labelText || '').trim()) : '';
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
      : (startOffStr && startOffStr.trim() !== '' ? parseFloat(startOffStr) : undefined);
    const endOffStr = endOffEl?.value;
    const endOffset = typeof customEndOffset === 'number'
      ? customEndOffset
      : (endOffStr && endOffStr.trim() !== '' ? parseFloat(endOffStr) : undefined);
    const { selectedLinePattern, selectedRoutingType, sourceMagnet, targetMagnet } = uiStateRef.current;

    conns.forEach((conn) => {
      const magnetPatch = magnetPatchById.get(conn.id);
      parent.postMessage({
        pluginMessage: {
          type: 'UPDATE_CONNECTOR_PROPERTIES',
          payload: {
            connectorId: conn.id,
            isReversed: conn.isReversed,
            colorHex: color,
            strokeWeight: weight,
            strokePattern: selectedLinePattern,
            routingType: selectedRoutingType,
            startTerminal: startTerm,
            endTerminal: endTerm,
            startOffset,
            endOffset,
            sourceMagnet: includeMagnets ? (magnetPatch?.sourceMagnet ?? (hasEndpointDraft ? undefined : (sourceMagnet || undefined))) : undefined,
            targetMagnet: includeMagnets ? (magnetPatch?.targetMagnet ?? (hasEndpointDraft ? undefined : (targetMagnet || undefined))) : undefined,
            label,
            hasLabel,
            labelBoxStyle: lastConnectorConfigRef.current.labelBoxStyle || 'BOX',
            labelAlign: lastConnectorConfigRef.current.labelAlign || 'CENTER',
            labelFillColor: lastConnectorConfigRef.current.labelFillColor || DEFAULT_LABEL_FILL,
            labelStrokeColor: lastConnectorConfigRef.current.labelStrokeColor || uiStateRef.current.selectedConnectorColor || DEFAULT_CONNECTOR_COLOR,
          }
        }
      }, '*');
    });
    if (includeMagnets) clearEndpointMagnetDraft();
    setConnectorDirty(false);
  }, [clearEndpointMagnetDraft]);

  useEffect(() => {
    liveApplyConnectorRef.current = (customStartOffset?: number, customEndOffset?: number) => {
      const nodes = selectedNodesRef.current;
      if (nodes.length === 1 && nodes[0]?.isConnector) {
        // BUG-1/BUG-2: 즉시 적용 경로에서는 magnet을 전송하지 않고 Draft를 보존한다.
        applyCurrentConnectorState(customStartOffset, customEndOffset, false);
        return;
      }
      if (
        nodes.length === 2
        && nodes.every((n) => n && !n.isConnector)
        && uiStateRef.current.hasExistingConnection
      ) {
        applyExistingConnectionState(customStartOffset, customEndOffset, false);
      }
    };
  }, [applyCurrentConnectorState, applyExistingConnectionState]);

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

    const label = labelToggleEl?.checked
      ? (labelInputEl ? labelInputEl.value.trim() : (lastConnectorConfigRef.current.labelText || '').trim())
      : '';
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
    // BUG-3: 신규 생성 시 endpointDraft를 신규 connector magnet으로 사용한다 (Draft 우선, 없으면 uiState).
    const createDraft = endpointDraftRef.current;
    // 라벨 스타일 설정값 (lastConnectorConfigRef에서 일관되게 읽음)
    const labelBoxStyle = lastConnectorConfigRef.current.labelBoxStyle || 'BOX';
    const labelAlign = lastConnectorConfigRef.current.labelAlign || 'CENTER';
    const labelFillColor = lastConnectorConfigRef.current.labelFillColor || DEFAULT_LABEL_FILL;
    const labelStrokeColor = lastConnectorConfigRef.current.labelStrokeColor || uiStateRef.current.selectedConnectorColor || DEFAULT_CONNECTOR_COLOR;

    // 이미 연결된 쌍은 새로 만들지 않고 기존 커넥터에 반영한다
    if (uiStateRef.current.hasExistingConnection) {
      applyExistingConnectionState();
      return;
    }

    if (nodes.length === 2) {
      parent.postMessage({
        pluginMessage: {
          type: 'CONNECT_POINTS',
          payload: {
            sourceNodeId: nodes[0].id,
            sourceMagnet: createDraft.sourceMagnet ?? sourceMagnet ?? undefined,
            targetNodeId: nodes[1].id,
            targetMagnet: createDraft.targetMagnet ?? targetMagnet ?? undefined,
            label,
            colorHex: color,
            strokeWeight: weight,
            routingType: selectedRoutingType,
            strokePattern: selectedLinePattern,
            startTerminal: startTerm,
            endTerminal: endTerm,
            startOffset: startOff,
            endOffset: endOff,
            labelBoxStyle,
            labelAlign,
            labelFillColor,
            labelStrokeColor,
            figmaLink,
          }
        }
      }, '*');
    } else {
      // 3개 이상: CONNECT_CHAIN 대상은 Flow Node만. 필터 후 공간 정렬한다.
      // Flow Node만 선택된 경우는 Core가 이미 정렬한 orderedNodeIds를 그대로 쓴다.
      const flowNodes = nodes.filter((n) => n && n.isFlowNode);
      const selectionIsFlowOnly = flowNodes.length === nodes.length;
      const orderedIds = selectionIsFlowOnly && uiStateRef.current.orderedNodeIds && uiStateRef.current.orderedNodeIds.length === nodes.length
        ? uiStateRef.current.orderedNodeIds
        : selectionIsFlowOnly
          ? nodes.map((n) => n.id)
          : orderFlowNodesForChain(flowNodes.map((n) => ({
              id: n.id,
              x: n.x ?? 0,
              y: n.y ?? 0,
              width: n.width ?? 0,
              height: n.height ?? 0,
              isFlowNode: true,
            }))).map((n) => n.id);

      parent.postMessage({
        pluginMessage: {
          type: 'CONNECT_CHAIN',
          payload: {
            orderedNodeIds: orderedIds,
            sourceMagnet: createDraft.sourceMagnet ?? sourceMagnet ?? undefined,
            targetMagnet: createDraft.targetMagnet ?? targetMagnet ?? undefined,
            label,
            colorHex: color,
            strokeWeight: weight,
            routingType: selectedRoutingType,
            strokePattern: selectedLinePattern,
            startTerminal: startTerm,
            endTerminal: endTerm,
            startOffset: startOff,
            endOffset: endOff,
            labelBoxStyle,
            labelAlign,
            labelFillColor,
            labelStrokeColor,
            figmaLink,
          }
        }
      }, '*');
    }
    // BUG-3: Draft를 payload에 담은 뒤 clear — 동일 selection 재push 시 stale Draft로 dirty가 true가 되지 않는다.
    clearEndpointMagnetDraft();
  }, [applyCurrentConnectorState, applyExistingConnectionState, showToast, clearEndpointMagnetDraft]);

  const updateConnectedConnectorMagnets = useCallback((sourceMagnet?: MagnetPosition, targetMagnet?: MagnetPosition) => {
    const connectedConnectors = uiStateRef.current.connectedConnectors || [];
    const connIds = uiStateRef.current.connectedConnectorIds || [];

    if (connectedConnectors.length > 0) {
      connectedConnectors.forEach((conn) => {
        // UI의 Node 1 마그넷과 Node 2 마그넷을 각각 결정 (누락 시 기존 커넥터 마그넷 보존)
        const node1Mag = sourceMagnet || (conn.isReversed ? conn.targetMagnet : conn.sourceMagnet) || uiStateRef.current.sourceMagnet || undefined;
        const node2Mag = targetMagnet || (conn.isReversed ? conn.sourceMagnet : conn.targetMagnet) || uiStateRef.current.targetMagnet || undefined;

        parent.postMessage({
          pluginMessage: {
            type: 'UPDATE_CONNECTOR_PROPERTIES',
            payload: {
              connectorId: conn.id,
              isReversed: conn.isReversed,
              sourceMagnet: node1Mag,
              targetMagnet: node2Mag,
            }
          }
        }, '*');
      });
    } else {
      connIds.forEach((connId) => {
        parent.postMessage({
          pluginMessage: {
            type: 'UPDATE_CONNECTOR_PROPERTIES',
            payload: {
              connectorId: connId,
              sourceMagnet: sourceMagnet || uiStateRef.current.sourceMagnet || undefined,
              targetMagnet: targetMagnet || uiStateRef.current.targetMagnet || undefined,
            }
          }
        }, '*');
      });
    }
  }, []);

  const applyEndpointMagnetDraft = useCallback(() => {
    const nodes = selectedNodesRef.current;
    const draft = endpointDraftRef.current;
    const input = buildSelectionGizmoInput(nodes, uiStateRef.current, draft);
    const patches = buildEndpointMagnetPatches(input);
    if (patches.length === 0) return;

    const previousById = new Map<string, { sourceMagnet?: MagnetPosition; targetMagnet?: MagnetPosition; isReversed?: boolean }>();
    if (input.isSingleConnector || input.isMultiConnector) {
      nodes.forEach((node) => {
        if (!node?.isConnector) return;
        previousById.set(node.id, {
          sourceMagnet: node.connectorSourceMagnet as MagnetPosition | undefined,
          targetMagnet: node.connectorTargetMagnet as MagnetPosition | undefined,
          isReversed: Boolean(node.connectorIsReversed),
        });
      });
    } else if (input.is3PlusNodes) {
      (uiStateRef.current.multiNodeConnectors || []).forEach((conn) => {
        previousById.set(conn.id, {
          sourceMagnet: conn.sourceMagnet,
          targetMagnet: conn.targetMagnet,
        });
      });
    } else {
      (uiStateRef.current.connectedConnectors || []).forEach((conn) => {
        const uiStart = conn.isReversed ? conn.targetMagnet : conn.sourceMagnet;
        const uiEnd = conn.isReversed ? conn.sourceMagnet : conn.targetMagnet;
        previousById.set(conn.id, {
          sourceMagnet: uiStart,
          targetMagnet: uiEnd,
          isReversed: Boolean(conn.isReversed),
        });
      });
    }

    const snapshot: UndoSnapshot = {
      type: 'connector',
      connectorItems: patches.map((patch) => {
        const previous = previousById.get(patch.id);
        return {
          connectorId: patch.id,
          payload: {
            connectorId: patch.id,
            sourceMagnet: previous?.sourceMagnet,
            targetMagnet: previous?.targetMagnet,
            isReversed: previous?.isReversed || false,
          },
        };
      }),
    };
    setLastAppliedSnapshot(snapshot);
    lastAppliedSnapshotRef.current = snapshot;

    patches.forEach((patch) => {
      parent.postMessage({
        pluginMessage: {
          type: 'UPDATE_CONNECTOR_PROPERTIES',
          payload: {
            connectorId: patch.id,
            sourceMagnet: patch.sourceMagnet,
            targetMagnet: patch.targetMagnet,
            isReversed: patch.isReversed || false,
          },
        },
      }, '*');
    });
    clearEndpointMagnetDraft();
  }, [clearEndpointMagnetDraft]);

  const handleMainAction = useCallback(() => {
    const nodes = selectedNodesRef.current;
    const isConn = isConnectorSelectedRef.current || (nodes.length > 0 && nodes.every(n => n && n.isConnector));

    if (isConn && nodes.length >= 1 && nodes.every(n => n && n.isConnector)) {
      applyCurrentConnectorState();
      return;
    }

    // 다중 플로우 노드 선택 시: endpoint Draft와 노드 multiDraft를 각각 반영한다.
    if (nodes.length >= 2) {
      if (isGizmoDraftDirty(buildSelectionGizmoInput(nodes, uiStateRef.current, endpointDraftRef.current))) {
        applyEndpointMagnetDraft();
      }
      applyMultiDraft();
      return;
    }

    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;

    const opts = nodeOptionStateRef.current;
    const targetNodeType = normalizeNodeType(opts.nodeType || 'Screen');
    const storedBranchVariant = opts.branchVariant
      ? normalizeBranchVariant(opts.branchVariant)
      : undefined;
    const optionTarget = { flowNodeType: targetNodeType, isFlowNode: true };
    const canHaveDescription = supportsOption(optionTarget, 'description');
    const canHaveFigmaLink = supportsOption(optionTarget, 'figmaLink');
    const canHaveStatus = supportsOption(optionTarget, 'status');
    const canHaveStep = supportsOption(optionTarget, 'stepBadge');
    const canHaveElevation = supportsOption(optionTarget, 'elevation');

    const defaultTitle = getDefaultNodeTitle(targetNodeType, storedBranchVariant);
    let rawTitle = titleEl?.value.trim() || '';
    if (targetNodeType === 'Branch' && storedBranchVariant && isDefaultNodeTitle(rawTitle)) {
      rawTitle = BRANCH_VARIANT_LABELS[storedBranchVariant];
      if (titleEl) titleEl.value = rawTitle;
    } else if (!rawTitle) {
      rawTitle = defaultTitle;
    }
    if (rawTitle.length > 32) {
      showToast('제목은 최대 32자까지 입력할 수 있습니다.', 'warning');
    }
    const title = rawTitle.slice(0, 32);
    const isDescOn = Boolean(opts.descriptionOn);
    const desc = isDescOn ? (descEl?.value.trim() || '') : '';
    const effectiveDesc = canHaveDescription ? desc : '';

    const w = opts.width || 250;
    const h = opts.height || 90;
    let radius = opts.cornerRadius ?? 0;
    if (radius > 999) {
      radius = 999;
      showToast('최대값은 999입니다.', 'warning');
    } else if (radius < 0) {
      radius = 0;
    }

    const isLinkOn = Boolean(opts.singleLinkOn) && canHaveFigmaLink;
    const rawFigmaUrl = isLinkOn ? (opts.singleLinkUrl || '').trim() : '';
    const figmaUrl = rawFigmaUrl ? (
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawFigmaUrl) ? rawFigmaUrl : `https://${rawFigmaUrl}`
    ) : '';

    const isElevOn = Boolean(opts.elevationOn) && canHaveElevation;
    const finalElevation = isElevOn ? opts.elevation : null;
    const isStatusOn = Boolean(opts.statusOn) && canHaveStatus;
    const isStepOn = Boolean(opts.stepBadgesOn) && canHaveStep;
    const targetStepNum = typeof opts.stepNumber === 'number' && opts.stepNumber > 0
      ? opts.stepNumber
      : 1;

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
          payload: { nodeId: nodes[0].id, title, description: effectiveDesc, width: w, height: h, cornerRadius: radius, theme: nodes[0]?.theme || 'light', figmaLink: figmaUrl, nodeType: targetNodeType, colorHex: nodeOptionStateRef.current.fillColor, elevation: finalElevation }
        }
      }, '*');
    } else if (nodes.length >= 2) {
      // Step 2: 다중 선택 시 기존의 전체 덮어쓰기 loop를 차단 (Apply 실행은 Step 3에서 구현)
      return;
    } else {
      if (radius !== opts.cornerRadius) {
        setNodeOptionState({ cornerRadius: radius });
      }
      parent.postMessage({
        pluginMessage: {
          type: 'CREATE_FLOW_NODE',
          payload: {
            title,
            description: effectiveDesc,
            descriptionOn: canHaveDescription ? isDescOn : false,
            width: w,
            height: h,
            cornerRadius: radius,
            theme: 'light',
            figmaLink: figmaUrl,
            nodeType: targetNodeType,
            branchVariant: targetNodeType === 'Branch' ? storedBranchVariant : undefined,
            colorHex: opts.fillColor,
            strokeWeight: opts.strokeWeight !== undefined ? opts.strokeWeight : 1.5,
            strokeColor: opts.strokeColor,
            sizeMode: (opts.sizeMode as ('fixed' | 'hug' | 'fit')) || (targetNodeType === 'Screen' ? 'hug' : 'fixed'),
            elevation: isElevOn ? opts.elevation : undefined,
            status: isStatusOn ? (opts.status as WorkflowStatus) : undefined,
            badgeNumber: isStepOn ? targetStepNum : undefined,
            badgePosition: isStepOn ? (opts.badgeCorner as BadgePosition) : undefined,
            badgeShape: isStepOn ? (opts.badgeShape as BadgeShape) : undefined,
            badgeColorMode: isStepOn ? opts.badgeColorMode : undefined,
          }
        }
      }, '*');
    }
  }, [applyCurrentConnectorState, applyEndpointMagnetDraft, applyMultiDraft, setNodeOptionState, showToast]);

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
      clearConnectorLabelDraft();
      clearEndpointMagnetDraft();
      multiDraftSelectionRef.current = sortedNewIds;
    }

    const prevSelectionKey = selectedNodesRef.current.map((n) => n.id).sort().join(',');
    const nextSelectionKey = nodes.map((n) => n.id).sort().join(',');
    if (prevSelectionKey !== nextSelectionKey) {
      setConnectorDirty(false);
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
      : nodes.filter(n => n && Boolean(n.isFlowNode)).length;
    const otherObjectCount = typeof meta?.otherObjectCount === 'number'
      ? meta.otherObjectCount
      : Math.max(0, count - flowNodeCount - (meta?.connectorCount || 0));
    const connectorCount = typeof meta?.connectorCount === 'number'
      ? meta.connectorCount
      : nodes.filter(n => n && n.isConnector).length;

    const flooowInSelection = nodes.filter((n) => n && n.isFlowNode).length;
    const figjamInSelection = nodes.filter((n) => n && !n.isFlowNode && !n.isConnector).length;
    const isMixedNodeAndFigjam = flooowInSelection > 0 && figjamInSelection > 0 && connectorCount === 0;

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
        const isLabelOn = firstConn.connectorLabelOn !== undefined
          ? firstConn.connectorLabelOn
          : Boolean(firstConn.connectorLabel);
        const labelInputEl = typeof document !== 'undefined'
          ? document.getElementById('input-conn-label') as HTMLInputElement | null
          : null;
        const labelFocused = Boolean(
          labelInputEl && typeof document !== 'undefined' && document.activeElement === labelInputEl
        );
        setLastConnectorConfig({
          labelOn: labelFocused ? lastConnectorConfigRef.current.labelOn : isLabelOn,
          labelText: labelFocused
            ? (labelInputEl ? labelInputEl.value : lastConnectorConfigRef.current.labelText)
            : (firstConn.connectorLabel || ''),
          labelBoxStyle: firstConn.connectorLabelBoxStyle || 'BOX',
          labelAlign: firstConn.connectorLabelAlign || 'CENTER',
          labelFillColor: labelFillIsDefault(firstConn.connectorLabelFillColor, firstConn.connectorColorHex)
            ? DEFAULT_LABEL_FILL
            : (firstConn.connectorLabelFillColor || DEFAULT_LABEL_FILL),
          labelStrokeColor: labelStrokeFollowsConnector(firstConn.connectorLabelStrokeColor, firstConn.connectorColorHex)
            ? (firstConn.connectorColorHex || DEFAULT_CONNECTOR_COLOR)
            : (firstConn.connectorLabelStrokeColor || firstConn.connectorColorHex || DEFAULT_CONNECTOR_COLOR),
        });
        setUIState({
          selectedConnectorColor: firstConn.connectorColorHex || '#000000',
          selectedRoutingType: firstConn.connectorRoutingType || 'ORTHOGONAL',
          selectedLinePattern: firstConn.connectorStrokePattern || 'SOLID',
          sourceMagnet: (firstConn.connectorSourceMagnet as MagnetPosition) || 'RIGHT',
          targetMagnet: (firstConn.connectorTargetMagnet as MagnetPosition) || 'LEFT',
        });
      }
    } else if (isMixedNodeAndFigjam) {
      // 노드 + FigJam 오브젝트: Connection만 사용
      setCurrentTab('connection');
    } else if (count === 0) {
      // 바탕화면 클릭 (신규 생성 모드): Screen / Hug / White / Elevation off
      setCurrentTab('node');
    } else {
      // 일반 노드 선택: 이전 노드에서 마지막으로 선택했던 탭으로 복원
      const targetTab = lastNodeTabRef.current || 'node';
      setCurrentTab(targetTab);

      // 다른 단일 플로우 노드를 선택한 경우에만 NodeOptionState를 노드 값으로 로드한다.
      // 같은 노드의 SELECTION_CHANGED 재수신은 편집 중인 옵션을 덮지 않는다.
      const flowNodes = nodes.filter(n => n && Boolean(n.isFlowNode));
      if (isSelectionChanged && nodes.length === 1 && flowNodes.length === 1) {
        const first = flowNodes[0];
        const hasElev = typeof first.elevation === 'number';
        const nodeTypeVal = normalizeNodeType(
          first.flowNodeType || (first.nodeType === 'FRAME' ? 'Screen' : first.nodeType) || 'Screen'
        );
        const hasStep = typeof first.stepNumber === 'number' && !isNaN(first.stepNumber);
        const activeLink = (first.figmaLink || '').trim();
        const cachedLink = (first.cachedFigmaLink || '').trim();
        const fillColor = first.fillColorHex || '#ffffff';
        const strokeWeight = first.strokeWeight !== undefined ? first.strokeWeight : 1.5;
        const strokeColor = first.strokeColorHex || '#000000';

        const nodeOptionsUpdates: Partial<NodeOptionState> = {
          nodeType: nodeTypeVal,
          fillColor,
          strokeWeight,
          strokeColor,
          width: typeof first.width === 'number' ? first.width : 250,
          height: typeof first.height === 'number' ? first.height : 90,
          cornerRadius: typeof first.cornerRadius === 'number' ? first.cornerRadius : 0,
          sizeMode: first.sizeMode || 'fixed',
          elevationOn: hasElev || Boolean(first.elevationOn),
          elevation: hasElev ? first.elevation : 0,
          statusOn: Boolean(first.status),
          status: first.status || 'draft',
          badgeCorner: first.badgeCorner || 'TOP_LEFT',
          badgeShape: first.badgeShape || 'Square',
          badgeColorMode: first.badgeColorMode || 'Style',
          stepBadgesOn: hasStep,
          stepNumber: hasStep && (first.stepNumber as number) > 0 ? (first.stepNumber as number) : 1,
          descriptionOn: Boolean(first.descriptionOn ?? (first.description && first.description.trim())),
          singleLinkOn: Boolean(activeLink),
          singleLinkUrl: activeLink || cachedLink,
          branchVariant: nodeTypeVal === 'Branch'
            ? normalizeBranchVariant(first.branchVariant)
            : nodeOptionStateRef.current.branchVariant,
        };
        setNodeOptionState(nodeOptionsUpdates);

        const matchedPreset = stylePresets.find((p) => {
          const matchFill = p.fillColor.toLowerCase() === fillColor.toLowerCase();
          if (!matchFill) return false;
          if (p.strokeWeight !== strokeWeight) return false;
          if (p.strokeWeight > 0 && strokeColor) {
            if (p.strokeColor.toLowerCase() !== strokeColor.toLowerCase()) return false;
          }
          return true;
        });
        const matchedId = matchedPreset ? matchedPreset.id : null;
        setSelectedStylePresetId(matchedId);
        setUIState({ selectedStylePresetId: matchedId });
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
        const hasElevation = Boolean(nodeOptionStateRef.current.elevationOn);
        if (hasElevation) {
          setActiveAppearanceSection('elevation');
        } else {
          setActiveAppearanceSection(null);
        }
      }
    }
  }, [closeAllPopovers, setCurrentTab, setNodeOptionState, setUIState, clearMultiDraft, clearConnectorLabelDraft, clearEndpointMagnetDraft]);

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
    nodeOptionState,
    setNodeOptionState,
    formTextDraft,
    setFormTextDraft,
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
    flooowUsage,
    setFlooowUsage,
    requestFlooowUsage,
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
    connectorDirty,
    markConnectorDirty,
    connectSelectedNodes,
    updateConnectedConnectorMagnets,
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
    connectorLabelDraft,
    hasConnectorLabelDraft,
    updateConnectorLabelDraft,
    endpointDraft,
    endpointDirty,
    setEndpointMagnetDraft,
    clearEndpointMagnetDraft,
    applyEndpointMagnetDraft,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
