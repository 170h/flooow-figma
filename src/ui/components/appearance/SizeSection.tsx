import React, { useCallback } from 'react';
import { useApp, SizePreset, NodeInfo } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { DropdownMixedItem } from '../shared/DropdownMixedItem';
import { MixedDashChip } from '../shared/icons';
import { useDisabledNotice, DisabledNoticeChip } from '../shared/DisabledNotice';
import { t } from '../../../i18n';
import {
  getNodeCategory,
  normalizeNodeType,
  getOptionCapability,
  SCREEN_NODE_CONSTRAINTS,
  clampScreenWidth,
  clampScreenHeight,
  clampScreenCornerRadius,
} from '../../../domain/nodeDomain';

const FIXED_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M14 6C14.2761 6 14.5 6.22386 14.5 6.5C14.5 6.77614 14.2761 7 14 7H12V16H14C14.2761 16 14.5 16.2239 14.5 16.5C14.5 16.7761 14.2761 17 14 17H9C8.72386 17 8.5 16.7761 8.5 16.5C8.5 16.2239 8.72386 16 9 16H11V7H9C8.72386 7 8.5 6.77614 8.5 6.5C8.5 6.22386 8.72386 6 9 6H14Z" fill="currentColor"/>
  </svg>
);

const HUG_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M11.4999 13C11.6325 13 11.7597 13.0527 11.8535 13.1464L14.8535 16.1464C15.0487 16.3417 15.0487 16.6582 14.8535 16.8535C14.6582 17.0487 14.3417 17.0487 14.1464 16.8535L11.4999 14.207L8.85346 16.8535C8.6582 17.0487 8.34169 17.0487 8.14643 16.8535C7.95119 16.6582 7.95119 16.3417 8.14643 16.1464L11.1464 13.1464C11.2402 13.0527 11.3674 13 11.4999 13ZM14.1464 7.14644C14.3417 6.95119 14.6582 6.95118 14.8535 7.14644C15.0487 7.3417 15.0487 7.65821 14.8535 7.85347L11.8535 10.8535C11.7597 10.9472 11.6325 10.9999 11.4999 11C11.3674 10.9999 11.2402 10.9472 11.1464 10.8535L8.14643 7.85347C7.95119 7.65821 7.95119 7.3417 8.14643 7.14644C8.34169 6.9512 8.6582 6.9512 8.85346 7.14644L11.4999 9.79292L14.1464 7.14644Z" fill="currentColor"/>
  </svg>
);

const FIT_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M9.5 14C9.77614 14 10 14.2239 10 14.5V17.5C10 17.7761 9.77614 18 9.5 18C9.22386 18 9 17.7761 9 17.5V15.707L6.85352 17.8535C6.65825 18.0488 6.34175 18.0488 6.14648 17.8535C5.95122 17.6583 5.95122 17.3417 6.14648 17.1465L8.29297 15H6.5C6.22386 15 6 14.7761 6 14.5C6 14.2239 6.22386 14 6.5 14H9.5ZM17.5 14C17.7761 14 18 14.2239 18 14.5C18 14.7761 17.7761 15 17.5 15H15.707L17.8535 17.1465C18.0488 17.3417 18.0488 17.6583 17.8535 17.8535C17.6583 18.0488 17.3417 18.0488 17.1465 17.8535L15 15.707V17.5C15 17.7761 14.7761 18 14.5 18C14.2239 18 14 17.7761 14 17.5V14.5C14 14.2239 14.2239 14 14.5 14H17.5ZM9.5 6C9.77614 6 10 6.22386 10 6.5V9.5C10 9.77614 9.77614 10 9.5 10H6.5C6.22386 10 6 9.77614 6 9.5C6 9.22386 6.22386 9 6.5 9H8.29297L6.14648 6.85352C5.95122 6.65825 5.95122 6.34175 6.14648 6.14648C6.34175 5.95122 6.65825 5.95122 6.85352 6.14648L9 8.29297V6.5C9 6.22386 9.22386 6 9.5 6ZM17.1465 6.14648C17.3417 5.95122 17.6583 5.95122 17.8535 6.14648C18.0488 6.34175 18.0488 6.65825 17.8535 6.85352L15.707 9H17.5C17.7761 9 18 9.22386 18 9.5C18 9.77614 17.7761 10 17.5 10H14.5C14.2239 10 14 9.77614 14 9.5V6.5C14 6.22386 14.2239 6 14.5 6C14.7761 6 15 6.22386 15 6.5V8.29297L17.1465 6.14648Z"
      fill="currentColor"
    />
  </svg>
);

const CHEVRON_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z"
      fill="currentColor"
    />
  </svg>
);

const CHECK_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z"
      fill="currentColor"
    />
  </svg>
);

const DEFAULT_PRESET_IDS = new Set(['default', 'square', 'web', 'mobile']);

/**
 * Size 섹션 - W/H/Radius 입력 + 사이즈 모드 드롭다운 + 프리셋 칩
 */
export function SizeSection() {
  const {
    nodeOptionState,
    setNodeOptionState,
    selectedNodes,
    uiState,
    sizePresets,
    selectedSizePresetId,
    setActiveModal,
    contextMenuOpen,
    setContextMenuOpen,
    setContextMenuPos,
    contextMenuTarget,
    setContextMenuTarget,
    setSelectedSizePresetId,
    sizeModeDropdownOpen,
    setSizeModeDropdownOpen,
    closeAllPopovers,
    applyCurrentNodeState,
    autoResizeWindow,
    showToast,
    multiDraft,
    updateMultiDraft,
    formTextDraft,
    setFormTextDraft,
    canUndo,
  } = useApp();

  const summary = useSelectionSummary();

  // 스크린(Screen) 노드 타입일 때만 Size 편집 허용 (Multi-selection Capability Rule)
  // 우선순위:
  // 1. 다중 노드 타입 변경 드래프트 중인 경우 해당 타입 기준으로 판별
  // 2. 선택된 노드 대상 평가:
  //    - SUPPORTED -> Allowed (Enabled / Mixed+Editable)
  //    - PARTIAL / UNSUPPORTED -> Not allowed (Disabled)
  // 3. 미선택 (신규 생성 대기 모드): 현재 선택된 생성 대상 타입의 지원 여부 판별
  const isSizeAllowed = (() => {
    if (multiDraft.nodeType !== undefined) {
      return getOptionCapability([{ flowNodeType: multiDraft.nodeType, isFlowNode: true }], 'size') === 'SUPPORTED';
    }
    if (selectedNodes.length > 0) {
      return getOptionCapability(selectedNodes, 'size') === 'SUPPORTED';
    }
    const creationType = nodeOptionState.nodeType || 'Screen';
    return getOptionCapability([{ flowNodeType: creationType, isFlowNode: true }], 'size') === 'SUPPORTED';
  })();

  // 비활성 사유 칩 (클릭 시 잠시 표시)
  const disabledNotice = useDisabledNotice();

  // 1. 파생 상태 선언 (핸들러 및 Effect보다 먼저 선언)
  const activePreset = sizePresets.find(
    (p) => p.w === nodeOptionState.width && p.h === nodeOptionState.height
  );

  const isMoreDisabled =
    !isSizeAllowed ||
    !activePreset ||
    Boolean(activePreset.isDefault) ||
    DEFAULT_PRESET_IDS.has(activePreset.id);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const lastSelectedNodeIdRef = React.useRef<string | null>(null);
  const userActionLockRef = React.useRef<number>(0);
  const isFocusedRef = React.useRef<{ w: boolean; h: boolean; r: boolean }>({
    w: false,
    h: false,
    r: false,
  });
  const pendingSizeRef = React.useRef<{
    nodeId: string;
    width?: number;
    height?: number;
    cornerRadius?: number;
  } | null>(null);

  // Enter 직후 blur 중복 커밋 방지: 마지막 커밋 payload 키 (동일 값 재커밋 스킵)
  const sizeCommitRef = React.useRef<string | null>(null);
  function alreadyCommittedSize(key: string) {
    if (sizeCommitRef.current === key) return true;
    sizeCommitRef.current = key;
    return false;
  }

  // Undo 등으로 적용 스냅샷이 소진되면 stale pending/가드를 해제해 복원 에코를 받아들인다
  const prevCanUndoRef = React.useRef(canUndo);
  React.useEffect(() => {
    if (prevCanUndoRef.current && !canUndo) {
      pendingSizeRef.current = null;
      sizeCommitRef.current = null;
    }
    prevCanUndoRef.current = canUndo;
  }, [canUndo]);

  // 미확정 입력 텍스트는 AppContext 단일 소유(formTextDraft).
  // controlled input 표시값이자 dirty 감지 원천이다.
  const widthInput = formTextDraft.sizeW;
  const heightInput = formTextDraft.sizeH;
  const radiusInput = formTextDraft.sizeR;
  const setWidthInput = (v: string) => setFormTextDraft({ sizeW: v });
  const setHeightInput = (v: string) => setFormTextDraft({ sizeH: v });
  const setRadiusInput = (v: string) => setFormTextDraft({ sizeR: v });

  // 드롭다운 외부 클릭 시에만 안전하게 닫기 (mousedown 기준)
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSizeModeDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, setSizeModeDropdownOpen]);

  // Size가 비활성화되면 열려있는 드롭다운 즉시 닫기
  React.useEffect(() => {
    if (!isSizeAllowed && dropdownOpen) {
      setDropdownOpen(false);
      setSizeModeDropdownOpen(false);
    }
  }, [isSizeAllowed, dropdownOpen, setSizeModeDropdownOpen]);

  const currentSizeMode = (() => {
    if (multiDraft.sizeMode) return multiDraft.sizeMode;
    if (summary.isMultiFlowNode) {
      if (summary.sizeMode.isMixed) return 'mixed';
      return summary.sizeMode.value || nodeOptionState.sizeMode || 'hug';
    }
    if (summary.isSingleFlowNode) {
      return summary.sizeMode.value || nodeOptionState.sizeMode || 'hug';
    }
    return nodeOptionState.sizeMode || 'hug';
  })();

  React.useEffect(() => {
    if (currentSizeMode === 'mixed') return;
    const el = document.getElementById('select-size-mode') as HTMLInputElement | null;
    if (el && el.value !== currentSizeMode) el.value = currentSizeMode;
  }, [currentSizeMode]);

  const isWMixed = multiDraft.width !== undefined ? false : (summary.isMultiFlowNode && summary.width.isMixed);
  const isHMixed = multiDraft.height !== undefined ? false : (summary.isMultiFlowNode && summary.height.isMixed);
  const isRMixed = multiDraft.cornerRadius !== undefined ? false : (summary.isMultiFlowNode && summary.cornerRadius.isMixed);

  const isSizeDrafted = multiDraft.width !== undefined || multiDraft.height !== undefined;
  const isSizeMixed = !isSizeDrafted && summary.isMultiFlowNode && (isWMixed || isHMixed);

  // 다중 선택 시 Mixed 상태에서 각 프리셋별 노드 수 산출
  const sizePresetCounts = React.useMemo(() => {
    if (!isSizeMixed) return {};
    const counts: Record<string, number> = {};
    const flowNodes = selectedNodes.filter((n) => n && getNodeCategory(n) !== 'FigmaObject');
    for (const n of flowNodes) {
      const matched = sizePresets.find((p) => p.w === n.width && p.h === n.height);
      if (matched) {
        counts[matched.id] = (counts[matched.id] || 0) + 1;
      }
    }
    return counts;
  }, [isSizeMixed, selectedNodes, sizePresets]);

  // 2. 선택된 노드 변경 시 W, H, Radius 인풋 필드 값 동기화
  React.useEffect(() => {
    const validNodes = (selectedNodes || []).filter((n): n is NodeInfo => Boolean(n));
    const currentNodeId = selectedNodes.length === 1
      ? selectedNodes[0]?.id
      : (selectedNodes.length > 1 ? 'MULTI' : 'NONE');
    const isDifferentNode = currentNodeId !== lastSelectedNodeIdRef.current;
    if (isDifferentNode) {
      lastSelectedNodeIdRef.current = currentNodeId;
      pendingSizeRef.current = null; // 다른 노드로 선택 변경 시 pending 클리어
      sizeCommitRef.current = null; // 선택 변경 시 커밋 가드 리셋
    }

    // 사용자 조작 직후 600ms 이내에는 동일 노드에 대해 비동기 selection sync로 로컬 입력이 되돌려지거나 깜박이지 않도록 차단
    if (!isDifferentNode && Date.now() - userActionLockRef.current < 600) {
      return;
    }

    if (validNodes.length > 0) {
      if (summary.isMultiFlowNode) {
        if (!isFocusedRef.current.w) {
          setWidthInput(multiDraft.width !== undefined ? String(multiDraft.width) : (isWMixed ? '' : (summary.width.value !== undefined ? String(summary.width.value) : '')));
        }
        if (!isFocusedRef.current.h) {
          setHeightInput(multiDraft.height !== undefined ? String(multiDraft.height) : (isHMixed ? '' : (summary.height.value !== undefined ? String(summary.height.value) : '')));
        }
        if (!isFocusedRef.current.r) {
          setRadiusInput(multiDraft.cornerRadius !== undefined ? String(multiDraft.cornerRadius) : (isRMixed ? '' : (summary.cornerRadius.value !== undefined ? String(summary.cornerRadius.value) : '')));
        }
        if (isDifferentNode) {
          if (isSizeMixed) {
            setSelectedSizePresetId(null);
          } else {
            const matched = sizePresets.find((p) => p.w === summary.width.value && p.h === summary.height.value);
            setSelectedSizePresetId(matched ? matched.id : null);
          }
        }
      } else {
        const first = validNodes[0];
        const echoedW = typeof first?.width === 'number' ? first.width : (nodeOptionState.width || 250);
        const echoedH = typeof first?.height === 'number' ? first.height : (nodeOptionState.height || 90);
        const echoedR = typeof first?.cornerRadius === 'number' ? first.cornerRadius : (nodeOptionState.cornerRadius ?? 0);
        let nodeW = echoedW;
        let nodeH = echoedH;
        let nodeR = echoedR;

        // 같은 노드의 selection 재수신은 NodeOptionState를 표시한다.
        // 다른 노드를 선택한 경우에만 노드 치수를 입력값으로 가져온다.
        if (!isDifferentNode) {
          nodeW = nodeOptionState.width || 250;
          nodeH = nodeOptionState.height || 90;
          nodeR = nodeOptionState.cornerRadius ?? 0;
        }

        // 동일 노드 수정 중 pending 요청이 남아있는 경우:
        // Core가 보낸 치수가 최신 요청값과 일치하는지 검증하여 stale 응답 롤백 차단
        if (!isDifferentNode && pendingSizeRef.current && pendingSizeRef.current.nodeId === currentNodeId) {
          const pending = pendingSizeRef.current;
          const isWMatched = pending.width === undefined || pending.width === echoedW;
          const isHMatched = pending.height === undefined || pending.height === echoedH;
          const isRMatched = pending.cornerRadius === undefined || pending.cornerRadius === echoedR;

          if (isWMatched && isHMatched && isRMatched) {
            // Core에 최신 요청이 완전히 반영되었으므로 pending 해제
            pendingSizeRef.current = null;
          } else {
            // 아직 지연된 과거(stale) 치수 응답이 도착한 경우: 요청했던 최신 값을 유지하여 롤백 방지
            if (pending.width !== undefined) nodeW = pending.width;
            if (pending.height !== undefined) nodeH = pending.height;
            if (pending.cornerRadius !== undefined) nodeR = pending.cornerRadius;
          }
        }

        if (!isFocusedRef.current.w) {
          setWidthInput(String(nodeW));
        }
        if (!isFocusedRef.current.h) {
          setHeightInput(String(nodeH));
        }
        if (!isFocusedRef.current.r) {
          setRadiusInput(String(nodeR));
        }

        if (isDifferentNode) {
          const matched = sizePresets.find((p) => p.w === nodeW && p.h === nodeH);
          setSelectedSizePresetId(matched ? matched.id : null);
        }
      }
    } else {
      // 선택된 노드가 없을 때 (생성 대기 모드): nodeOptionState 디폴트값 동기화
      const defW = nodeOptionState.width || 250;
      const defH = nodeOptionState.height || 90;
      const defR = nodeOptionState.cornerRadius ?? 0;

      if (!isFocusedRef.current.w) setWidthInput(String(defW));
      if (!isFocusedRef.current.h) setHeightInput(String(defH));
      if (!isFocusedRef.current.r) setRadiusInput(String(defR));

      if (isDifferentNode) {
        const matched = sizePresets.find((p) => p.w === defW && p.h === defH);
        setSelectedSizePresetId(matched ? matched.id : null);
      }
    }
  }, [
    selectedNodes,
    summary.isMultiFlowNode,
    isWMixed,
    isHMixed,
    isRMixed,
    summary.width.value,
    summary.height.value,
    summary.cornerRadius.value,
    nodeOptionState.width,
    nodeOptionState.height,
    nodeOptionState.cornerRadius,
    sizePresets,
    setSelectedSizePresetId,
  ]);

  // 3. 이벤트 핸들러 및 커밋 함수들
  function handleWChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedSizePresetId(null);
    setWidthInput(e.target.value);
  }

  function commitW(explicitVal?: string) {
    if (!isSizeAllowed) return;
    const raw = explicitVal !== undefined ? explicitVal : widthInput;
    const parsed = parseInt(raw, 10);
    let validW = isNaN(parsed) ? (nodeOptionState.width || 250) : parsed;
    if (validW < SCREEN_NODE_CONSTRAINTS.MIN_WIDTH) {
      validW = SCREEN_NODE_CONSTRAINTS.MIN_WIDTH;
      showToast(t('sizeMinW', { px: SCREEN_NODE_CONSTRAINTS.MIN_WIDTH }), 'warning');
    } else if (validW > SCREEN_NODE_CONSTRAINTS.MAX_WIDTH) {
      validW = SCREEN_NODE_CONSTRAINTS.MAX_WIDTH;
      showToast(t('sizeMaxW', { px: SCREEN_NODE_CONSTRAINTS.MAX_WIDTH }), 'warning');
    }
    setWidthInput(String(validW));
    userActionLockRef.current = Date.now();
    setSelectedSizePresetId(null);

    if (selectedNodes.length >= 2) {
      if (alreadyCommittedSize(`MULTI:W:${validW}`)) return;
      updateMultiDraft({ width: validW, sizeMode: 'fixed' });
      return;
    }

    const curH = parseInt(heightInput, 10) || nodeOptionState.height || 90;
    const curR = parseInt(radiusInput, 10) || (nodeOptionState.cornerRadius ?? 0);
    const targetNodeId = selectedNodes[0]?.id || 'NONE';
    if (alreadyCommittedSize(`${targetNodeId}:${validW}:${curH}:${curR}:fixed`)) return;

    pendingSizeRef.current = {
      nodeId: targetNodeId,
      width: validW,
      height: curH,
      cornerRadius: curR,
    };

    const sizeModeEl = document.getElementById('select-size-mode') as HTMLInputElement | null;
    if (sizeModeEl) {
      sizeModeEl.value = 'fixed';
    }
    setNodeOptionState({ width: validW, sizeMode: 'fixed' });
    applyCurrentNodeState('fixed', undefined, undefined, 'Screen', {
      width: validW,
      height: curH,
      cornerRadius: curR,
    });
  }

  function handleWKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitW();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseInt(widthInput, 10) || (nodeOptionState.width || 250);
      const step = e.shiftKey ? 10 : 1;
      const next = Math.min(SCREEN_NODE_CONSTRAINTS.MAX_WIDTH, current + step);
      commitW(String(next));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseInt(widthInput, 10) || (nodeOptionState.width || 250);
      const step = e.shiftKey ? 10 : 1;
      const next = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, current - step);
      commitW(String(next));
    }
  }

  function handleHChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedSizePresetId(null);
    setHeightInput(e.target.value);
  }

  function commitH(explicitVal?: string) {
    if (!isSizeAllowed) return;
    const raw = explicitVal !== undefined ? explicitVal : heightInput;
    const parsed = parseInt(raw, 10);
    let validH = isNaN(parsed) ? (nodeOptionState.height || 90) : parsed;
    if (validH < SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT) {
      validH = SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT;
      showToast(t('sizeMinH', { px: SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT }), 'warning');
    } else if (validH > SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT) {
      validH = SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT;
      showToast(t('sizeMaxH', { px: SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT }), 'warning');
    }
    setHeightInput(String(validH));
    userActionLockRef.current = Date.now();
    setSelectedSizePresetId(null);

    if (selectedNodes.length >= 2) {
      if (alreadyCommittedSize(`MULTI:H:${validH}`)) return;
      updateMultiDraft({ height: validH, sizeMode: 'fixed' });
      return;
    }

    const curW = parseInt(widthInput, 10) || nodeOptionState.width || 250;
    const curR = parseInt(radiusInput, 10) || (nodeOptionState.cornerRadius ?? 0);
    const targetNodeId = selectedNodes[0]?.id || 'NONE';
    if (alreadyCommittedSize(`${targetNodeId}:${curW}:${validH}:${curR}:fixed`)) return;

    pendingSizeRef.current = {
      nodeId: targetNodeId,
      width: curW,
      height: validH,
      cornerRadius: curR,
    };

    const sizeModeEl = document.getElementById('select-size-mode') as HTMLInputElement | null;
    if (sizeModeEl) {
      sizeModeEl.value = 'fixed';
    }
    setNodeOptionState({ height: validH, sizeMode: 'fixed' });
    applyCurrentNodeState('fixed', undefined, undefined, 'Screen', {
      width: curW,
      height: validH,
      cornerRadius: curR,
    });
  }

  function handleHKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitH();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseInt(heightInput, 10) || (nodeOptionState.height || 90);
      const step = e.shiftKey ? 10 : 1;
      const next = Math.min(SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT, current + step);
      commitH(String(next));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseInt(heightInput, 10) || (nodeOptionState.height || 90);
      const step = e.shiftKey ? 10 : 1;
      const next = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, current - step);
      commitH(String(next));
    }
  }

  function handleRChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedSizePresetId(null);
    setRadiusInput(e.target.value);
  }

  function commitR(explicitVal?: string) {
    if (!isSizeAllowed) return;
    const raw = explicitVal !== undefined ? explicitVal : radiusInput;
    const parsed = parseInt(raw, 10);
    let validR = isNaN(parsed) ? (nodeOptionState.cornerRadius ?? 0) : parsed;
    if (validR < SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS) {
      validR = SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS;
    } else if (validR > SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS) {
      validR = SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS;
      showToast(t('sizeMaxCorner', { px: SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS }), 'warning');
    }
    setRadiusInput(String(validR));
    userActionLockRef.current = Date.now();
    setSelectedSizePresetId(null);

    if (selectedNodes.length >= 2) {
      if (alreadyCommittedSize(`MULTI:R:${validR}`)) return;
      updateMultiDraft({ cornerRadius: validR });
      return;
    }

    const curW = parseInt(widthInput, 10) || nodeOptionState.width || 250;
    const curH = parseInt(heightInput, 10) || nodeOptionState.height || 90;
    const targetNodeId = selectedNodes[0]?.id || 'NONE';
    const modeArg = currentSizeMode === 'mixed' ? 'mixed' : currentSizeMode;
    if (alreadyCommittedSize(`${targetNodeId}:${curW}:${curH}:${validR}:${modeArg}`)) return;

    pendingSizeRef.current = {
      nodeId: targetNodeId,
      width: curW,
      height: curH,
      cornerRadius: validR,
    };

    setNodeOptionState({ cornerRadius: validR });
    applyCurrentNodeState(currentSizeMode === 'mixed' ? undefined : currentSizeMode, undefined, undefined, 'Screen', {
      width: curW,
      height: curH,
      cornerRadius: validR,
    });
  }

  function handleRKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitR();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseInt(radiusInput, 10) || 0;
      const step = e.shiftKey ? 10 : 1;
      const next = Math.min(SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS, current + step);
      commitR(String(next));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseInt(radiusInput, 10) || 0;
      const step = e.shiftKey ? 10 : 1;
      const next = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS, current - step);
      commitR(String(next));
    }
  }

  function applySizePreset(p: SizePreset) {
    if (!isSizeAllowed) return;
    setSelectedSizePresetId(p.id);
    setWidthInput(String(p.w));
    setHeightInput(String(p.h));
    setRadiusInput(String(p.radius ?? 0));
    userActionLockRef.current = Date.now();

    if (selectedNodes.length >= 2) {
      updateMultiDraft({
        width: p.w,
        height: p.h,
        cornerRadius: p.radius ?? 0,
        sizeMode: (p.sizeMode || 'fixed') as 'fixed' | 'hug' | 'fit',
      });
      return;
    }

    const targetNodeId = selectedNodes[0]?.id || 'NONE';
    pendingSizeRef.current = {
      nodeId: targetNodeId,
      width: p.w,
      height: p.h,
      cornerRadius: p.radius ?? 0,
    };

    const targetSizeMode = p.sizeMode || 'fixed';
    setNodeOptionState({
      width: p.w,
      height: p.h,
      cornerRadius: p.radius ?? 0,
      sizeMode: targetSizeMode,
    });
    applyCurrentNodeState(targetSizeMode, undefined, undefined, 'Screen', {
      width: p.w,
      height: p.h,
      cornerRadius: p.radius ?? 0,
    });
  }

  function toggleSizeMoreMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (isMoreDisabled) return;
    if (contextMenuOpen && contextMenuTarget === 'size') {
      setContextMenuOpen(false);
      return;
    }
    closeAllPopovers();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popoverHeight = 58;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= popoverHeight + 8 ? rect.bottom + 4 : Math.max(8, rect.top - popoverHeight - 4);
    const left = Math.max(8, rect.right - 72);

    setContextMenuPos({ top, left });
    setContextMenuTarget('size');
    if (activePreset) {
      setSelectedSizePresetId(activePreset.id);
    }
    setContextMenuOpen(true);
  }

  function toggleSizeModeDropdown(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isSizeAllowed) return;
    const nextState = !dropdownOpen;
    setDropdownOpen(nextState);
    setSizeModeDropdownOpen(nextState);
  }

  function selectSizeMode(mode: string) {
    if (!isSizeAllowed) return;
    pendingSizeRef.current = null;
    if (selectedNodes.length >= 2) {
      if (mode !== 'mixed') {
        updateMultiDraft({ sizeMode: mode as 'fixed' | 'hug' | 'fit' });
      }
      setSelectedSizePresetId(null);
      setDropdownOpen(false);
      setSizeModeDropdownOpen(false);
      return;
    }
    if (mode !== 'mixed') {
      setNodeOptionState({ sizeMode: mode });
    }
    // hidden input은 currentSizeMode 동기화 effect에서 React state로 갱신되므로 합성 change 이벤트 불필요
    setSelectedSizePresetId(null);
    setDropdownOpen(false);
    setSizeModeDropdownOpen(false);
    applyCurrentNodeState(mode);
  }

  return (
    <div
      className={`section-block${!isSizeAllowed ? ' disabled' : ''}`}
      onClick={!isSizeAllowed ? () => disabledNotice.flash() : undefined}
    >
      <div className="section-header">
        <span className={`section-title${!isSizeAllowed ? ' disabled' : ''}`}>Size{!isSizeAllowed && disabledNotice.phase !== 'hidden' && (
          <DisabledNoticeChip text={t('noticeSizeOnlyScreen')} fading={disabledNotice.phase === 'fading'} />
        )}</span>
        <div className="section-actions">
          <button
            className={`btn-action-icon${!isSizeAllowed ? ' disabled' : ''}`}
            data-tooltip={!isSizeAllowed ? t('tipAddSizeDisabled') : t('tipAddSize')}
            disabled={!isSizeAllowed}
            onClick={() => isSizeAllowed && setActiveModal('add-size')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 6C12.2761 6 12.5 6.22386 12.5 6.5V11.5H17.5C17.7761 11.5 18 11.7239 18 12C18 12.2761 17.7761 12.5 17.5 12.5H12.5V17.5C12.5 17.7761 12.2761 18 12 18C11.7239 18 11.5 17.7761 11.5 17.5V12.5H6.5C6.22386 12.5 6 12.2761 6 12C6 11.7239 6.22386 11.5 6.5 11.5H11.5V6.5C11.5 6.22386 11.7239 6 12 6Z" fill="currentColor"/></svg>
          </button>
          <button
            id="btn-size-more"
            className={`btn-action-icon btn-more-icon${isMoreDisabled ? ' disabled' : ''}`}
            data-tooltip={!isSizeAllowed ? t('tipSizeMoreDisabled') : (isMoreDisabled ? t('tipDefaultPresetLocked') : t('tipSizeMore'))}
            disabled={isMoreDisabled}
            onClick={toggleSizeMoreMenu}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
          </button>
        </div>
      </div>

      <div className="section-body">
        <div className="numeric-inputs-row">
          <div className={`input-scrubber-box${!isSizeAllowed ? ' disabled' : ''}`} data-tooltip={t('tipWidth')}>
            <span className="scrubber-label">W</span>
            <input
              type="number"
              id="input-size-w"
              value={widthInput}
              min={SCREEN_NODE_CONSTRAINTS.MIN_WIDTH}
              max={SCREEN_NODE_CONSTRAINTS.MAX_WIDTH}
              placeholder={isWMixed ? 'Mixed' : undefined}
              disabled={!isSizeAllowed}
              onFocus={() => { isFocusedRef.current.w = true; }}
              onChange={handleWChange}
              onBlur={() => { isFocusedRef.current.w = false; commitW(); }}
              onKeyDown={handleWKeyDown}
            />
          </div>
          <div className={`input-scrubber-box${!isSizeAllowed ? ' disabled' : ''}`} data-tooltip={t('tipHeight')}>
            <span className="scrubber-label">H</span>
            <input
              type="number"
              id="input-size-h"
              value={heightInput}
              min={SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT}
              max={SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT}
              placeholder={isHMixed ? 'Mixed' : undefined}
              disabled={!isSizeAllowed}
              onFocus={() => { isFocusedRef.current.h = true; }}
              onChange={handleHChange}
              onBlur={() => { isFocusedRef.current.h = false; commitH(); }}
              onKeyDown={handleHKeyDown}
            />
          </div>
          <div className={`input-scrubber-box${!isSizeAllowed ? ' disabled' : ''}`} data-tooltip={t('tipCornerRadius')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15.5 8C15.7761 8 16 8.22386 16 8.5C16 8.77614 15.7761 9 15.5 9H12.5C11.7917 9 11.2902 9.00022 10.8984 9.03223C10.5126 9.06377 10.2769 9.12345 10.0918 9.21777C9.71554 9.40951 9.40951 9.71554 9.21777 10.0918C9.12345 10.2769 9.06377 10.5126 9.03223 10.8984C9.00022 11.2902 9 11.7917 9 12.5V15.5C9 15.7761 8.77614 16 8.5 16C8.22386 16 8 15.7761 8 15.5V12.5C8 11.8082 8.00003 11.2593 8.03613 10.8174C8.07272 10.3696 8.14901 9.98732 8.32715 9.6377C8.61472 9.07347 9.07347 8.61472 9.6377 8.32715C9.98732 8.14901 10.3696 8.07272 10.8174 8.03613C11.2593 8.00003 11.8082 8 12.5 8H15.5Z" fill="currentColor"/></svg>
            <input
              type="number"
              id="input-size-radius"
              value={radiusInput}
              min={SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS}
              max={SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS}
              placeholder={isRMixed ? 'Mixed' : undefined}
              disabled={!isSizeAllowed}
              onFocus={() => { isFocusedRef.current.r = true; }}
              onChange={handleRChange}
              onBlur={() => { isFocusedRef.current.r = false; commitR(); }}
              onKeyDown={handleRKeyDown}
            />
          </div>

          {/* 사이즈 모드 드롭다운 */}
          <div
            ref={dropdownRef}
            className="size-mode-dropdown-wrapper figma-dropdown-wrapper"
            id="size-mode-dropdown-wrapper"
          >
            <button
              type="button"
              id="btn-size-mode-dropdown"
              className={`size-mode-dropdown-btn figma-dropdown-btn${dropdownOpen ? ' active' : ''}${!isSizeAllowed ? ' disabled' : ''}`}
              data-tooltip={!isSizeAllowed ? t('tipSizeModeDisabled') : t('tipSizeMode')}
              disabled={!isSizeAllowed}
              onClick={toggleSizeModeDropdown}
            >
              <div className="size-mode-btn-content figma-dropdown-btn-content">
                <span className="size-mode-current-icon figma-dropdown-current-icon" id="size-mode-current-icon">
                  {currentSizeMode === 'hug'
                    ? HUG_SVG
                    : currentSizeMode === 'fit'
                    ? FIT_SVG
                    : currentSizeMode === 'mixed'
                    ? <MixedDashChip size={16} />
                    : FIXED_SVG}
                </span>
                <span className="size-mode-current-text figma-dropdown-current-text" id="size-mode-current-text">
                  {currentSizeMode === 'hug'
                    ? 'Hug contents'
                    : currentSizeMode === 'fit'
                    ? 'Fit contents'
                    : currentSizeMode === 'mixed'
                    ? 'Mixed'
                    : 'Fixed height'}
                </span>
              </div>
              <span
                className="size-mode-chevron-icon figma-dropdown-chevron-icon"
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {CHEVRON_SVG}
              </span>
            </button>

            {dropdownOpen && isSizeAllowed && (
              <div
                className="size-mode-menu-popover figma-dropdown-menu active"
                id="popover-size-mode"
                style={{ display: 'flex' }}
                onClick={(e) => e.stopPropagation()}
              >
                {currentSizeMode === 'mixed' && (
                  <DropdownMixedItem
                    variant="icon"
                    onClick={() => selectSizeMode('mixed')}
                  />
                )}
                <div className={`size-mode-menu-item figma-dropdown-item${currentSizeMode === 'fixed' ? ' selected' : ''}`} data-value="fixed" onClick={() => selectSizeMode('fixed')}>
                  <span className="size-mode-menu-item-check figma-dropdown-check-slot">{CHECK_SVG}</span>
                  <span className="size-mode-menu-item-icon figma-dropdown-icon-slot">{FIXED_SVG}</span>
                  <span className="size-mode-menu-item-label figma-dropdown-label">Fixed height</span>
                </div>
                <div className={`size-mode-menu-item figma-dropdown-item${currentSizeMode === 'hug' ? ' selected' : ''}`} data-value="hug" onClick={() => selectSizeMode('hug')}>
                  <span className="size-mode-menu-item-check figma-dropdown-check-slot">{CHECK_SVG}</span>
                  <span className="size-mode-menu-item-icon figma-dropdown-icon-slot">{HUG_SVG}</span>
                  <span className="size-mode-menu-item-label figma-dropdown-label">Hug contents</span>
                </div>
                <div className={`size-mode-menu-item figma-dropdown-item${currentSizeMode === 'fit' ? ' selected' : ''}`} data-value="fit" onClick={() => selectSizeMode('fit')}>
                  <span className="size-mode-menu-item-check figma-dropdown-check-slot">{CHECK_SVG}</span>
                  <span className="size-mode-menu-item-icon figma-dropdown-icon-slot">{FIT_SVG}</span>
                  <span className="size-mode-menu-item-label figma-dropdown-label">Fit contents</span>
                </div>
              </div>
            )}
            <input type="hidden" id="select-size-mode" defaultValue="hug" />
          </div>
        </div>

        {/* 프리셋 칩 */}
        <div className="chip-group" style={{ marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
          {sizePresets.map((p) => {
            const count = sizePresetCounts[p.id] || 0;
            const isPresetActive = !isSizeMixed && selectedSizePresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`chip-btn${isPresetActive ? ' active' : ''}${!isSizeAllowed ? ' disabled' : ''}`}
                onClick={() => isSizeAllowed && applySizePreset(p)}
                disabled={!isSizeAllowed}
                data-tooltip={!isSizeAllowed ? t('tipPresetDisabledShape') : t('tipPresetDims', { name: p.name, w: p.w, h: p.h })}
              >
                <span className="tab-label">{p.name}</span>
                {count > 0 && <span className="tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
