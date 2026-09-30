import React from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { Switch } from '../shared/Switch';
import {
  supportsOption,
  getMutationTargets,
  computeOptionSwitchState,
  type OptionSwitchState,
} from '../../../types';

/**
 * Elevation 섹션 - 토글 스위치 + 5단계 엘리베이션 카드 (토글형)
 * Screen 및 Shape 노드에 실시간으로 그림자(Drop Shadow) 효과를 적용 및 동기화합니다.
 * Bridge 및 일반 Figma Object는 unsupported 처리됩니다.
 */
const ELEVATION_LEVELS = [
  { level: 0, label: 'E100', desc: 'Shapes' },
  { level: 1, label: 'E200', desc: 'Stickies, Comments' },
  { level: 2, label: 'E300', desc: 'Tooltips' },
  { level: 3, label: 'E400', desc: 'Menus, Panels' },
  { level: 4, label: 'E500', desc: 'Modals, Dialogs' },
];

export function ElevationSection() {
  const {
    uiState,
    lastNodeConfig,
    setLastNodeConfig,
    applyElevationToNodes,
    activeAppearanceSection,
    setActiveAppearanceSection,
    autoResizeWindow,
    selectedNodes,
    multiDraft,
    updateMultiDraft,
  } = useApp();
  const summary = useSelectionSummary();

  const [isOpen, setIsOpen] = React.useState<boolean | null>(null);
  const prevSelectedNodeIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const currentNodeId = selectedNodes.length === 1 ? selectedNodes[0]?.id : (selectedNodes.length > 1 ? 'MULTI' : null);
    const isDifferentNode = currentNodeId !== prevSelectedNodeIdRef.current;
    prevSelectedNodeIdRef.current = currentNodeId;

    if (isDifferentNode) {
      setIsOpen(null);
    }
  }, [selectedNodes]);

  // Option Capability Matrix 기반 스위치 상태 산출
  const rawOptionState = React.useMemo(() => {
    if (selectedNodes.length === 0) {
      const creationType = uiState.selectedNodeType || 'Screen';
      const isAllowed = supportsOption({ flowNodeType: creationType, isFlowNode: true }, 'elevation');
      if (!isAllowed) {
        return {
          state: 'MIXED_DISABLED' as const,
          supportedCount: 0,
          unsupportedCount: 1,
          supportedNodes: [],
          unsupportedNodes: [],
          checked: false,
          isMixed: true,
          disabled: true,
          isOpen: false,
        };
      }
      const on = Boolean(uiState.selectedElevation !== undefined && uiState.selectedElevation !== null ? uiState.selectedElevation >= 0 : lastNodeConfig.elevationOn);
      return {
        state: (on ? 'ON' : 'OFF') as OptionSwitchState,
        supportedCount: 1,
        unsupportedCount: 0,
        supportedNodes: [],
        unsupportedNodes: [],
        checked: on,
        isMixed: false,
        disabled: false,
        isOpen: on,
      };
    }
    return computeOptionSwitchState(
      selectedNodes,
      'elevation',
      (n) => Boolean(n.elevation !== undefined && n.elevation !== null ? n.elevation >= 0 : n.elevationOn)
    );
  }, [selectedNodes, uiState.selectedNodeType, uiState.selectedElevation, lastNodeConfig.elevationOn]);

  const isTypeDrafted = multiDraft.nodeType !== undefined;
  const isDraftAllowed = isTypeDrafted
    ? supportsOption({ flowNodeType: multiDraft.nodeType, isFlowNode: true }, 'elevation')
    : true;

  const isElevationDrafted = multiDraft.elevation !== undefined;
  const effectiveIsOpen = !isDraftAllowed || rawOptionState.disabled
    ? false
    : (isElevationDrafted
        ? (typeof multiDraft.elevation === 'number')
        : (isOpen !== null ? isOpen : rawOptionState.isOpen));

  const effectiveState = React.useMemo(() => {
    if (!isDraftAllowed || rawOptionState.state === 'MIXED_DISABLED') {
      return {
        state: 'MIXED_DISABLED' as const,
        checked: false,
        isMixed: true,
        disabled: true,
        isOpen: false,
      };
    }
    if (isElevationDrafted) {
      const on = typeof multiDraft.elevation === 'number';
      return {
        state: (on ? 'ON' : 'OFF') as OptionSwitchState,
        checked: on,
        isMixed: false,
        disabled: false,
        isOpen: on,
      };
    }
    return {
      state: rawOptionState.state,
      checked: rawOptionState.checked,
      isMixed: rawOptionState.isMixed,
      disabled: rawOptionState.disabled,
      isOpen: effectiveIsOpen,
    };
  }, [isDraftAllowed, rawOptionState, isElevationDrafted, multiDraft.elevation, effectiveIsOpen]);

  // 선택된 레벨 (Mixed 상태인 경우 선택 하이라이트 해제)
  const isElevationMixed = React.useMemo(() => {
    if (isElevationDrafted) return false;
    if (effectiveState.disabled) return false;
    const supported = rawOptionState.supportedNodes;
    if (supported.length <= 1) return false;
    const firstLevel = supported[0]?.elevation;
    return supported.some((n) => n.elevation !== firstLevel);
  }, [isElevationDrafted, effectiveState.disabled, rawOptionState.supportedNodes]);

  const currentLevel = isElevationDrafted
    ? (typeof multiDraft.elevation === 'number' ? multiDraft.elevation : undefined)
    : (isElevationMixed
        ? undefined
        : (rawOptionState.supportedNodes.length === 1
            ? (typeof rawOptionState.supportedNodes[0]?.elevation === 'number' ? rawOptionState.supportedNodes[0].elevation : (uiState.selectedElevation ?? 0))
            : (summary.isMultiFlowNode
                ? summary.elevation.value
                : (typeof uiState.selectedElevation === 'number' ? uiState.selectedElevation : 0))));

  function handleToggle(checked: boolean) {
    if (effectiveState.disabled) return;
    setIsOpen(checked);
    if (selectedNodes.length >= 2) {
      if (checked) {
        setActiveAppearanceSection('elevation');
        const targetLevel = typeof currentLevel === 'number' ? currentLevel : 0;
        updateMultiDraft({ elevation: targetLevel });
      } else {
        setActiveAppearanceSection(null);
        updateMultiDraft({ elevation: null });
      }
      requestAnimationFrame(() => {
        autoResizeWindow();
      });
      return;
    }

    if (selectedNodes.length === 1 && !supportsOption(selectedNodes[0], 'elevation')) {
      return;
    }

    if (checked) {
      setActiveAppearanceSection('elevation');
      setLastNodeConfig({ elevationOn: true });
      const targetLevel = typeof currentLevel === 'number' ? currentLevel : 0;
      applyElevationToNodes(targetLevel);
    } else {
      setActiveAppearanceSection(null);
      setLastNodeConfig({ elevationOn: false });
      applyElevationToNodes(null);
    }
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }

  function selectElevation(level: number) {
    if (effectiveState.disabled) return;
    setIsOpen(true);
    setActiveAppearanceSection('elevation');

    if (selectedNodes.length >= 2) {
      updateMultiDraft({ elevation: level });
      requestAnimationFrame(() => {
        autoResizeWindow();
      });
      return;
    }

    if (selectedNodes.length === 1 && !supportsOption(selectedNodes[0], 'elevation')) {
      return;
    }

    setLastNodeConfig({ elevationOn: true, elevation: level });
    applyElevationToNodes(level);
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }

  return (
    <div
      className="section-block"
      style={{ paddingBottom: effectiveState.isOpen ? '12px' : '0px' }}
    >
      <div className="section-header toggle-row">
        <span className={`section-title${effectiveState.disabled ? ' disabled' : ''}`}>
          Elevation
        </span>
        <Switch
          id="toggle-elevation"
          checked={effectiveState.checked}
          isMixed={effectiveState.isMixed}
          disabled={effectiveState.disabled}
          onChange={handleToggle}
        />
      </div>
      {effectiveState.isOpen && (
        <div className="section-body" style={{ display: 'flex' }}>
          <div className="elevation-cards-container active" id="elevation-options">
            {ELEVATION_LEVELS.map(({ level, label, desc }) => {
              const isSelected = !isElevationMixed && currentLevel === level;
              return (
                <div
                  key={level}
                  className={`elevation-card elev-${level}${isSelected ? ' selected' : ''}`}
                  title={`${label} (${desc})`}
                  aria-label={`${label} (${desc})`}
                  onClick={() => selectElevation(level)}
                >
                  <div className="elevation-inner-box" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
