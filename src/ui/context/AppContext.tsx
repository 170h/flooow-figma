import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { getPluginIdealHeight } from '../hooks/useAutoResize';
import type { ConnectorTerminalType } from '../../types';
import type { PhaseData } from '../components/modals/PhaseModal';

// ============================================================
// 타입 정의
// ============================================================

export interface SizePreset {
  id: string;
  name: string;
  w: number;
  h: number;
  radius?: number;
  sizeMode?: 'fixed' | 'hug';
  isDefault?: boolean;
}

export const DEFAULT_SIZE_PRESETS: SizePreset[] = [
  { id: 'default', name: 'Default', w: 250, h: 90, radius: 0, sizeMode: 'fixed', isDefault: true },
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
  { id: 'style-red-1', name: 'Red 1', fillColor: '#EA2039', strokeWeight: 0, strokeColor: '#000000' },
  { id: 'style-red-2', name: 'Red 2', fillColor: '#EB4C46', strokeWeight: 0, strokeColor: '#000000' },
  { id: 'style-coral-1', name: 'Coral 1', fillColor: '#E03E3E', strokeWeight: 0, strokeColor: '#000000' },
  { id: 'style-coral-2', name: 'Coral 2', fillColor: '#E05638', strokeWeight: 0, strokeColor: '#000000' },
  { id: 'style-orange', name: 'Orange', fillColor: '#DF6246', strokeWeight: 0, strokeColor: '#000000' },
  { id: 'style-pink', name: 'Pink', fillColor: '#EB5757', strokeWeight: 0, strokeColor: '#000000' },
  { id: 'style-purple', name: 'Purple', fillColor: '#8638E5', strokeWeight: 0, strokeColor: '#000000' },
];

export interface NodeInfo {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  flowNodeType?: string;
  status?: string;
  figmaLink?: string;
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
  selectedPhase: string;
  selectedNodeType: string;
  selectedConnectorColor?: string;
}

import { DesignFrameItem } from '../../types';

// 모달 타입
export type ModalType = 'none' | 'phase' | 'add-size' | 'edit-size' | 'figma-design-picker' | 'add-style' | 'confirmation' | 'delete' | 'connector-color';

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
  contextMenuTarget: 'phase' | 'size' | 'style' | null;
  setContextMenuTarget: (target: 'phase' | 'size' | 'style' | null) => void;
  selectedSizePresetId: string | null;
  setSelectedSizePresetId: (id: string | null) => void;
  selectedStylePresetId: string | null;
  setSelectedStylePresetId: (id: string | null) => void;

  // Phase 목록 및 편집 상태
  phases: PhaseData[];
  setPhases: React.Dispatch<React.SetStateAction<PhaseData[]>>;
  editingPhase: PhaseData | null;
  setEditingPhase: (phase: PhaseData | null) => void;
  phaseModalEditingId: string | null;
  setPhaseModalEditingId: (id: string | null) => void;

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
    }
  ) => void;
  applyStatusToNode: (status?: string) => void;
  applyElevationToNodes: (level: number | null) => void;
  applyStepBadges: (startNumber?: number, corner?: string, shape?: string, colorMode?: 'White' | 'Black' | 'Style') => void;
  removeStepBadgesFromNodes: () => void;
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
  selectedStatus: 'in_progress',
  selectedBadgeCorner: 'TOP_LEFT',
  selectedBadgeShape: 'Square',
  selectedBadgeColorMode: 'Style',
  selectedLinePattern: 'SOLID',
  selectedRoutingType: 'ORTHOGONAL',
  sourceMagnet: 'RIGHT',
  targetMagnet: 'LEFT',
  selectedPhase: 'none',
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
  const [uiState, setUIStateRaw] = useState<UIState>(DEFAULT_UI_STATE);
  const [lastNodeConfig, setLastNodeConfigRaw] = useState<LastNodeConfig>(DEFAULT_LAST_NODE_CONFIG);
  const [lastConnectorConfig, setLastConnectorConfigRaw] = useState<LastConnectorConfig>(DEFAULT_LAST_CONNECTOR_CONFIG);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [phasePopoverOpen, setPhasePopoverOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [sizeModeDropdownOpen, setSizeModeDropdownOpen] = useState(false);
  const [phasePopoverPos, setPhasePopoverPos] = useState({ top: 0, left: 0 });
  const [contextMenuPos, setContextMenuPos] = useState({ top: 0, left: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState<'phase' | 'size' | 'style' | null>(null);
  const [selectedSizePresetId, setSelectedSizePresetId] = useState<string | null>('default');
  const [selectedStylePresetId, setSelectedStylePresetId] = useState<string | null>('style-white');
  const [phaseModalEditingId, setPhaseModalEditingId] = useState<string | null>(null);
  const [phases, setPhases] = useState<PhaseData[]>([
    { id: 'phase-1', name: 'Phase 1', color: '#EA2039' },
    { id: 'phase-2', name: 'Phase 2', color: '#8638E5' },
  ]);
  const [editingPhase, setEditingPhase] = useState<PhaseData | null>(null);
  const [designFrames, setDesignFrames] = useState<DesignFrameItem[]>([]);

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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

  const showToast = useCallback((msg: string, level = 'info') => {
    if (!msg) return;
    parent.postMessage({ pluginMessage: { type: 'NOTIFY', message: msg, level } }, '*');
  }, []);

  const autoResizeWindow = useCallback(() => {
    requestAnimationFrame(() => {
      const root = document.getElementById('plugin-root');
      if (!root) return;
      const idealHeight = getPluginIdealHeight(root);
      if (idealHeight > 100) {
        parent.postMessage({
          pluginMessage: { type: 'RESIZE_WINDOW', width: 360, height: idealHeight }
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
    closeAllPopovers();
    setCurrentTabState(tab);
    currentTabRef.current = tab;
    // 일반 노드가 선택된 상태에서 탭을 변경한 경우 마지막 탭으로 기억
    if (selectedNodesRef.current.length > 0 && !isConnectorSelectedRef.current) {
      lastNodeTabRef.current = tab;
    }
  }, [closeAllPopovers]);

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
    }
  ) => {
    const nodes = selectedNodesRef.current;
    if (!nodes || nodes.length === 0) return;

    const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
    const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const urlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
    const singleLinkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
    const sizeModeEl = document.getElementById('select-size-mode') as HTMLInputElement | null;

    const title = titleEl?.value.trim() || 'Untitled';
    const isDescOn = descToggleEl ? descToggleEl.checked : (lastNodeConfigRef.current.descriptionOn ?? false);
    const desc = isDescOn ? (descEl?.value.trim() || '') : '';
    const w = parseInt(wEl?.value || '250', 10) || 250;
    const h = parseInt(hEl?.value || '90', 10) || 90;
    const radius = parseInt(rEl?.value || '0', 10) || 0;
    const isLinkOn = singleLinkToggleEl ? singleLinkToggleEl.checked : lastNodeConfigRef.current.singleLinkOn;
    const rawFigmaUrl = linkOverrides?.figmaLink !== undefined
      ? linkOverrides.figmaLink
      : ((isLinkOn && urlEl) ? urlEl.value.trim() : '');
    const figmaUrl = rawFigmaUrl ? (
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawFigmaUrl) ? rawFigmaUrl : `https://${rawFigmaUrl}`
    ) : '';

    const { selectedColor, selectedElevation, selectedNodeType } = uiStateRef.current;
    const elevToggleEl = document.getElementById('toggle-elevation') as HTMLInputElement | null;
    const isElevOn = elevToggleEl ? elevToggleEl.checked : Boolean(lastNodeConfigRef.current.elevationOn);
    const finalElevation = isElevOn ? selectedElevation : null;
    const finalColor = styleOverrides?.colorHex ?? selectedColor;
    const finalStrokeWeight = styleOverrides?.strokeWeight;
    const finalStrokeColor = styleOverrides?.strokeColor;

    const sizeMode = overrideSizeMode || sizeModeEl?.value || lastNodeConfigRef.current.sizeMode || 'fixed';

    setLastNodeConfig({ width: w, height: h, cornerRadius: radius, nodeType: selectedNodeType, color: finalColor, elevationOn: isElevOn, elevation: selectedElevation, singleLinkUrl: figmaUrl, sizeMode });

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
            clearLinkCache: linkOverrides?.clearLinkCache,
            nodeType: selectedNodeType,
            colorHex: finalColor,
            strokeWeight: finalStrokeWeight,
            strokeColor: finalStrokeColor,
            elevation: finalElevation,
            sizeMode,
          }
        }
      }, '*');
    });
  }, [setLastNodeConfig]);

  const addSizePreset = useCallback((preset: Omit<SizePreset, 'id'>) => {
    const newId = `size-${Date.now()}`;
    const newPreset: SizePreset = {
      ...preset,
      id: newId,
    };
    const next = [...sizePresets, newPreset];
    savePresets(next);
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
  }, [sizePresets, savePresets, setLastNodeConfig, applyCurrentNodeState, showToast]);

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
    const newId = `style-${Date.now()}`;
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
    if (target?.isDefault || target?.id === 'style-white' || target?.id === 'style-black') {
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

  const applyCurrentConnectorState = useCallback(() => {
    const nodes = selectedNodesRef.current;
    if (!isConnectorSelectedRef.current || !nodes || nodes.length === 0) return;

    const connNodes = nodes.filter(n => n && n.isConnector);
    if (connNodes.length === 0) return;

    const labelToggleEl = document.getElementById('toggle-conn-label') as HTMLInputElement | null;
    const labelInputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
    const colorEl = document.getElementById('conn-line-color') as HTMLSelectElement | null;
    const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
    const startTermEl = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
    const endTermEl = document.getElementById('select-end-terminal') as HTMLSelectElement | null;

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

    const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
    const title = titleEl?.value.trim() || 'Untitled';
    const isDescOn = descToggleEl ? descToggleEl.checked : (lastNodeConfigRef.current.descriptionOn ?? false);
    const desc = isDescOn ? (descEl?.value.trim() || '') : '';
    const w = parseInt(wEl?.value || '250', 10) || 250;
    const h = parseInt(hEl?.value || '90', 10) || 90;
    let radius = parseInt(rEl?.value || '0', 10) || 0;
    if (radius > 20) {
      radius = 20;
      if (rEl) rEl.value = '20';
      showToast('최대값은 20입니다.', 'warning');
    }
    const rawFigmaUrl = (singleLinkToggleEl?.checked && urlEl) ? urlEl.value.trim() : '';
    const figmaUrl = rawFigmaUrl ? (
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawFigmaUrl) ? rawFigmaUrl : `https://${rawFigmaUrl}`
    ) : '';
    const { selectedColor, selectedElevation, selectedNodeType, selectedStatus, selectedBadgeCorner, selectedBadgeShape } = uiStateRef.current;

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
      elevationOn: isElevOn, elevation: selectedElevation,
      statusOn: statusToggleEl?.checked || false, status: selectedStatus,
      stepBadgesOn: isStepOn,
      stepNumber: targetStepNum,
      badgeCorner: selectedBadgeCorner,
      badgeShape: selectedBadgeShape,
      badgeColorMode: uiStateRef.current.selectedBadgeColorMode,
      singleLinkOn: singleLinkToggleEl?.checked || false, singleLinkUrl: figmaUrl,
      descriptionOn: isDescOn,
    };
    setLastNodeConfig(newConfig);

    if (nodes.length === 1) {
      parent.postMessage({
        pluginMessage: {
          type: 'UPDATE_FLOW_NODE',
          payload: { nodeId: nodes[0].id, title, description: desc, width: w, height: h, cornerRadius: radius, theme: 'light', figmaLink: figmaUrl, nodeType: selectedNodeType, colorHex: selectedColor, elevation: finalElevation }
        }
      }, '*');
    } else if (nodes.length >= 2) {
      nodes.forEach(node => {
        parent.postMessage({
          pluginMessage: {
            type: 'UPDATE_FLOW_NODE',
            payload: { nodeId: node.id, title: node.title || title, description: desc, width: w, height: h, cornerRadius: radius, theme: 'light', figmaLink: figmaUrl, nodeType: selectedNodeType, colorHex: selectedColor, elevation: finalElevation }
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
          payload: {
            title,
            description: desc,
            width: w,
            height: h,
            cornerRadius: radius,
            theme: 'light',
            figmaLink: figmaUrl,
            nodeType: selectedNodeType,
            colorHex: selectedColor,
            elevation: isElevOn ? selectedElevation : undefined,
            status: statusToggleEl?.checked ? selectedStatus : undefined,
            badgeNumber: isStepOn ? targetStepNum : undefined,
            badgePosition: isStepOn ? (selectedBadgeCorner as any) : undefined,
            badgeShape: isStepOn ? (selectedBadgeShape as any) : undefined,
            badgeColorMode: isStepOn ? (uiStateRef.current.selectedBadgeColorMode as any) : undefined,
          }
        }
      }, '*');
    }
  }, [applyCurrentConnectorState, setLastNodeConfig, showToast]);

  const handleSelectionChange = useCallback((
    count: number,
    nodes: NodeInfo[],
    meta: { flowNodeCount?: number; otherObjectCount?: number; connectorCount?: number; }
  ) => {
    // 실제 선택 노드 대상이 변경되었을 때만 열려있는 모든 드롭다운 및 팝오버를 닫음
    const prevIds = (selectedNodesRef.current || []).map(n => n?.id).filter(Boolean);
    const newIds = (nodes || []).map(n => n?.id).filter(Boolean);
    const isSelectionChanged =
      prevIds.length !== newIds.length ||
      prevIds.some((id, idx) => id !== newIds[idx]);

    if (isSelectionChanged) {
      closeAllPopovers();
    }

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
      // 바탕화면 클릭 (신규 생성 모드): 항상 node 탭이 기본 (플러그인 노드의 이전 스타일 캐시는 유지)
      setCurrentTab('node');
    } else {
      // 일반 노드 선택: 이전 노드에서 마지막으로 선택했던 탭으로 복원
      const targetTab = lastNodeTabRef.current || 'node';
      setCurrentTab(targetTab);

      // 플러그인으로 생성된 플로우 노드(isFlowNode === true)인 경우에만 스타일(색상, 보더) 캐시 동기화
      const flowNodes = nodes.filter(n => n && n.isFlowNode);
      if (flowNodes.length > 0) {
        const first = flowNodes[0];
        const eOn = Boolean(first.elevationOn);
        const eLevel = typeof first.elevation === 'number' ? first.elevation : 0;
        const colorUpdates: Partial<UIState> = { selectedElevation: eLevel };
        const nodeRadius = typeof first.cornerRadius === 'number' ? first.cornerRadius : 0;
        const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
        if (rEl) rEl.value = String(nodeRadius);

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

          setLastNodeConfig({
            elevationOn: eOn,
            elevation: eLevel,
            color: first.fillColorHex,
            strokeWeight: first.strokeWeight,
            strokeColor: first.strokeColorHex,
            cornerRadius: nodeRadius,
            ...stepConfigUpdates,
          });
        } else {
          setLastNodeConfig({
            elevationOn: eOn,
            elevation: eLevel,
            cornerRadius: nodeRadius,
            ...stepConfigUpdates,
          });
        }
        setUIState(colorUpdates);
      }
    }
  }, [closeAllPopovers, setCurrentTab, setLastNodeConfig, setUIState]);

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
    contextMenuTarget,
    setContextMenuTarget,
    selectedSizePresetId,
    setSelectedSizePresetId,
    selectedStylePresetId,
    setSelectedStylePresetId,
    phaseModalEditingId,
    setPhaseModalEditingId,
    phases,
    setPhases,
    editingPhase,
    setEditingPhase,
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
    handleMainAction,
    handleSelectionChange,
    closeAllPopovers,
    showToast,
    autoResizeWindow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
