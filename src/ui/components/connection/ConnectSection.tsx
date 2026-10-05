import React, { useEffect, useState, useRef } from 'react';
import { useApp, StylePreset, NodeInfo } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import {
  ConnectorTerminalType,
  MagnetPosition,
} from '../../../types';
import {
  BRANCH_VARIANT_LABELS,
  normalizeBranchVariant,
  normalizeNodeType,
} from '../../../domain/nodeDomain';
import { IcPalette, COLOR_MIXED_ICON } from '../shared/icons';
import { DropdownMixedItem } from '../shared/DropdownMixedItem';
import { computeGizmoMagnets } from '../../utils/gizmoState';

// ============================================================
// Figma UI3 공식 킷 기반 커넥터 터미널 옵션 및 SVG
// - 드롭다운 버튼: -short가 빠진 기본(52x16) 아이콘
// - 드롭다운 메뉴: -short(36x16) 아이콘 (Figma 1027261:5984, 6029, 6009, 6054)
// ============================================================

export type TerminalOption = 'NONE' | 'ARROW' | 'CIRCLE' | 'DIAMOND';

const TERMINAL_OPTIONS: TerminalOption[] = [
  'NONE',
  'ARROW',
  'CIRCLE',
  'DIAMOND',
];

// 1. 드롭다운 버튼용 아이콘 (52x16 - "-short"가 빠진 기본 아이콘)
const TERMINAL_SVGS_BTN: Record<'start' | 'end', Record<TerminalOption, string>> = {
  start: {
    NONE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>`,
    ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1"/><path d="M7 3.5L2 8L7 12.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    CIRCLE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M9 8H50" stroke="currentColor" stroke-width="1"/><circle cx="5.5" cy="8" r="3.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>`,
    DIAMOND: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M10 8H50" stroke="currentColor" stroke-width="1"/><path d="M5.5 3.5L1 8L5.5 12.5L10 8Z" stroke="currentColor" stroke-width="1" fill="none" stroke-linejoin="round"/></svg>`,
  },
  end: {
    NONE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>`,
    ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1"/><path d="M45 3.5L50 8L45 12.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    CIRCLE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H43" stroke="currentColor" stroke-width="1"/><circle cx="46.5" cy="8" r="3.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>`,
    DIAMOND: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H42" stroke="currentColor" stroke-width="1"/><path d="M46.5 3.5L42 8L46.5 12.5L51 8Z" stroke="currentColor" stroke-width="1" fill="none" stroke-linejoin="round"/></svg>`,
  },
};

// 2. 드롭다운 메뉴용 아이콘 (36x16 - "-short" 아이콘)
const TERMINAL_SVGS_SHORT: Record<'start' | 'end', Record<TerminalOption, string>> = {
  start: {
    NONE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>`,
    ARROW: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1"/><path d="M8 4L4 8L8 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    CIRCLE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M8 8H32" stroke="currentColor" stroke-width="1"/><circle cx="5" cy="8" r="2.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>`,
    DIAMOND: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M8.5 8H32" stroke="currentColor" stroke-width="1"/><path d="M5 4.5L1.5 8L5 11.5L8.5 8Z" stroke="currentColor" stroke-width="1" fill="none" stroke-linejoin="round"/></svg>`,
  },
  end: {
    NONE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>`,
    ARROW: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1"/><path d="M28 4L32 8L28 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    CIRCLE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H28" stroke="currentColor" stroke-width="1"/><circle cx="31" cy="8" r="2.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>`,
    DIAMOND: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H27.5" stroke="currentColor" stroke-width="1"/><path d="M31 4.5L27.5 8L31 11.5L34.5 8Z" stroke="currentColor" stroke-width="1" fill="none" stroke-linejoin="round"/></svg>`,
  },
};



// 피그마 UI3 공식 16x16 체크마크 SVG
const CHECK_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z"
      fill="currentColor"
    />
  </svg>
);

// 피그마 표준 16x16 셰브론 SVG
const CHEVRON_SVG = (
  <svg className="figma-dropdown-chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z"
      fill="currentColor"
    />
  </svg>
);



/**
 * Connect 섹션 - 피그마 UI3 키트 공식 디자인 완벽 반영
 * (Figma 1027261:5984, 6029, 6009, 6054)
 * - 드롭다운 메뉴: -short 아이콘 사용
 * - 드롭다운 버튼: -short가 빠진 기본(52x16) 아이콘 사용
 */
export function ConnectSection() {
  const {
    uiState,
    setUIState,
    setActiveModal,
    connectorDirty,
    markConnectorDirty,
    connectSelectedNodes,
    handleMainAction,
    selectedNodes,
    stylePresets,
    selectedStylePresetId,
    setSelectedStylePresetId,
    nodeOptionState,
    flooowUsage,
  } = useApp();
  const summary = useSelectionSummary();
  const { selectedLinePattern, selectedRoutingType, sourceMagnet, targetMagnet, selectedConnectorColor } = uiState;

  // 현재 활성화된 스타일 프리셋 탐색 (배경색 및 보더 동기화용)
  const activeStylePreset = stylePresets.find((p) => {
    const matchFill = p.fillColor.toLowerCase() === (nodeOptionState.fillColor || '').toLowerCase();
    if (!matchFill) return false;
    const currentWeight = nodeOptionState.strokeWeight !== undefined ? nodeOptionState.strokeWeight : 1.5;
    if (p.strokeWeight !== currentWeight) return false;
    if (p.strokeWeight > 0 && nodeOptionState.strokeColor) {
      if (p.strokeColor.toLowerCase() !== nodeOptionState.strokeColor.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  // 드롭다운 열림 상태
  const [startTermPopupOpen, setStartTermPopupOpen] = useState(false);
  const [endTermPopupOpen, setEndTermPopupOpen] = useState(false);

  // 드롭다운 선택 값 상태
  const [startTermVal, setStartTermVal] = useState<ConnectorTerminalType>('NONE');
  const [endTermVal, setEndTermVal] = useState<ConnectorTerminalType>('ARROW');

  // 다중 선택 시 Mixed 상태
  const [isColorMixed, setIsColorMixed] = useState(false);
  const [isWeightMixed, setIsWeightMixed] = useState(false);
  const [weightInput, setWeightInput] = useState<string>('1.5');

  // 오프셋 상태
  const [startOffsetInput, setStartOffsetInput] = useState<string>('0');
  const [endOffsetInput, setEndOffsetInput] = useState<string>('0');
  const [isStartOffsetMixed, setIsStartOffsetMixed] = useState(false);
  const [isEndOffsetMixed, setIsEndOffsetMixed] = useState(false);

  // 사용자가 기즈모에서 명시적으로 선택한 pending 마그넷 (상태 C)
  const [userPendingSourceMagnet, setUserPendingSourceMagnet] = useState<MagnetPosition | null>(null);
  const [userPendingTargetMagnet, setUserPendingTargetMagnet] = useState<MagnetPosition | null>(null);
  const userActionTimestampRef = useRef<number>(0);
  const prevSelectionKeyRef = useRef<string>('');
  const lastSyncedSelectionColorRef = useRef<string | null>(null);

  // 오프셋 실시간 입력 디바운스 타이머
  const offsetDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (offsetDebounceRef.current) {
        clearTimeout(offsetDebounceRef.current);
      }
    };
  }, []);

  const debouncedApplyOffset = (customStart?: number, customEnd?: number) => {
    if (offsetDebounceRef.current) {
      clearTimeout(offsetDebounceRef.current);
    }
    offsetDebounceRef.current = setTimeout(() => {
      markConnectorDirty();
    }, 200);
  };

  // 라우팅 및 선 스타일 Mixed 상태
  const isRoutingMixed = summary.isMultiConnector && summary.connectorRoutingType.isMixed;
  const isLinePatternMixed = summary.isMultiConnector && summary.connectorStrokePattern.isMixed;

  // 스타일 프리셋 중 보더컬러가 있는 것은 보더 컬러만, 없는 것은 배경 컬러 반환 (커넥터 라인 컬러)
  const getPresetLineColor = (preset: StylePreset): string => {
    const hasBorder = (preset.strokeWeight ?? 0) > 0 && !!preset.strokeColor;
    return (hasBorder ? preset.strokeColor : preset.fillColor).toUpperCase();
  };

  const [selectedColor, setSelectedColor] = useState<string>(() => {
    if (selectedConnectorColor) return selectedConnectorColor.toUpperCase();
    if (activeStylePreset) {
      return getPresetLineColor(activeStylePreset);
    }
    return '#000000';
  });
  const [hexInput, setHexInput] = useState<string>(() => {
    if (selectedConnectorColor) return selectedConnectorColor.replace('#', '').toUpperCase();
    if (activeStylePreset) {
      return getPresetLineColor(activeStylePreset).replace('#', '');
    }
    return '000000';
  });

  const hexInputRef = useRef<HTMLInputElement>(null);
  // 스타일 섹션의 컬러 및 프리셋 변경 시 커넥터 라인 컬러 동기화 (보더컬러 우선, 없을 시 배경컬러)
  useEffect(() => {
    if (activeStylePreset) {
      const connectorColor = getPresetLineColor(activeStylePreset);
      setSelectedColor(connectorColor);
      setHexInput(connectorColor.replace('#', ''));
      const colSel = document.getElementById('conn-line-color') as HTMLInputElement | null;
      if (colSel) colSel.value = connectorColor;
    }
  }, [nodeOptionState.fillColor, nodeOptionState.strokeWeight, nodeOptionState.strokeColor, selectedStylePresetId]);

  // selectedConnectorColor 변경 시 로컬 입력필드 및 컬러칩 동기화 (모달 실시간 어플라이 연동)
  useEffect(() => {
    if (selectedConnectorColor) {
      const formatted = selectedConnectorColor.toUpperCase();
      setSelectedColor(formatted);
      setHexInput(formatted.replace('#', ''));
      const colSel = document.getElementById('conn-line-color') as HTMLInputElement | null;
      if (colSel) colSel.value = formatted;
    }
  }, [selectedConnectorColor]);

  // 외부 클릭 시 모든 커넥션 드롭다운 닫기
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('#wrap-start-terminal')) {
        setStartTermPopupOpen(false);
      }
      if (!target.closest('#wrap-end-terminal')) {
        setEndTermPopupOpen(false);
      }

    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // 선택된 노드 변경 시 터미널, 컬러 및 수치 상태 동기화
  useEffect(() => {
    const currentSelectionKey = selectedNodes.map((n) => n.id).sort().join(',');
    const isDifferentSelection = currentSelectionKey !== prevSelectionKeyRef.current;
    if (isDifferentSelection) {
      prevSelectionKeyRef.current = currentSelectionKey;
      setUserPendingSourceMagnet(null);
      setUserPendingTargetMagnet(null);
      // 선택 변경에 의해 동기화되는 노드의 색상을 기록하여, 선택만 했을 때 applyCurrentConnectorState가 자동 격발되는 것을 방지
      const firstConn = selectedNodes.find(n => n && n.isConnector);
      lastSyncedSelectionColorRef.current = firstConn?.connectorColorHex ? firstConn.connectorColorHex.toUpperCase() : null;
    }

    const isUserActionRecent = Date.now() - userActionTimestampRef.current < 800;

    if (summary.isSingleConnector) {
      // 커넥터 단일 선택
      const node = selectedNodes[0];
      setIsColorMixed(false);
      setIsWeightMixed(false);

      const startT = (node?.connectorStartTerminal as ConnectorTerminalType) || 'NONE';
      setStartTermVal(startT);
      const startSel = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
      if (startSel) startSel.value = startT;

      const endT = (node?.connectorEndTerminal as ConnectorTerminalType) || 'ARROW';
      setEndTermVal(endT);
      const endSel = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
      if (endSel) endSel.value = endT;
      if (node?.connectorColorHex) {
        const hex = node.connectorColorHex.toUpperCase();
        setSelectedColor(hex);
        setHexInput(hex.replace('#', ''));
        const colSel = document.getElementById('conn-line-color') as HTMLInputElement | null;
        if (colSel) colSel.value = hex;
      }
      const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
      if (typeof node?.connectorStrokeWeight === 'number') {
        const wStr = String(node.connectorStrokeWeight);
        setWeightInput(wStr);
        if (weightEl) {
          weightEl.value = wStr;
          weightEl.placeholder = '';
        }
      } else {
        setWeightInput('1.5');
        if (weightEl) {
          weightEl.value = '1.5';
          weightEl.placeholder = '';
        }
      }
      if (node?.connectorRoutingType) {
        setUIState({ selectedRoutingType: node.connectorRoutingType });
      }
      if (node?.connectorStrokePattern) {
        setUIState({ selectedLinePattern: node.connectorStrokePattern });
      }
      if (!isUserActionRecent && node?.connectorSourceMagnet && node?.connectorTargetMagnet) {
        setUIState({
          sourceMagnet: node.connectorSourceMagnet as MagnetPosition,
          targetMagnet: node.connectorTargetMagnet as MagnetPosition,
        });
      }

      // 시작/끝 오프셋 동기화
      const startOff = typeof node?.connectorStartOffset === 'number' ? node.connectorStartOffset : 0;
      setStartOffsetInput(String(startOff));
      setIsStartOffsetMixed(false);
      const startOffEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
      if (startOffEl) {
        startOffEl.value = String(startOff);
        startOffEl.placeholder = '';
      }

      const endOff = typeof node?.connectorEndOffset === 'number' ? node.connectorEndOffset : 0;
      setEndOffsetInput(String(endOff));
      setIsEndOffsetMixed(false);
      const endOffEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
      if (endOffEl) {
        endOffEl.value = String(endOff);
        endOffEl.placeholder = '';
      }
    } else if (summary.isMultiConnector) {
      // 커넥터 복수 선택
      // 1. 단자
      const startVal = summary.connectorStartTerminal.isMixed
        ? 'MIXED'
        : (summary.connectorStartTerminal.value || 'NONE');
      setStartTermVal(startVal);
      const startSel = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
      if (startSel) startSel.value = startVal;

      const endVal = summary.connectorEndTerminal.isMixed
        ? 'MIXED'
        : (summary.connectorEndTerminal.value || 'ARROW');
      setEndTermVal(endVal);
      const endSel = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
      if (endSel) endSel.value = endVal;

      // 2. 컬러
      setIsColorMixed(summary.connectorColor.isMixed);
      if (!summary.connectorColor.isMixed && summary.connectorColor.value) {
        const hex = summary.connectorColor.value.toUpperCase();
        setSelectedColor(hex);
        setHexInput(hex.replace('#', ''));
        const colSel = document.getElementById('conn-line-color') as HTMLInputElement | null;
        if (colSel) colSel.value = hex;
      } else if (summary.connectorColor.isMixed) {
        setHexInput('');
      }

      // 3. 선 굵기 (커넥터 복수 선택 시)
      const isConnWeightMixed = Boolean(summary.connectorStrokeWeight.isMixed);
      const connWeightVal = summary.connectorStrokeWeight.value;
      setIsWeightMixed(isConnWeightMixed);
      const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
      if (isConnWeightMixed) {
        setWeightInput('');
        if (weightEl) {
          weightEl.value = '';
          weightEl.placeholder = 'Mixed';
        }
      } else if (connWeightVal !== undefined) {
        const wVal = String(connWeightVal);
        setWeightInput(wVal);
        if (weightEl) {
          weightEl.value = wVal;
          weightEl.placeholder = '';
        }
      }

      // 4. 라우팅
      if (!summary.connectorRoutingType.isMixed && summary.connectorRoutingType.value) {
        setUIState({ selectedRoutingType: summary.connectorRoutingType.value });
      }

      // 5. 선 스타일
      if (!summary.connectorStrokePattern.isMixed && summary.connectorStrokePattern.value) {
        setUIState({ selectedLinePattern: summary.connectorStrokePattern.value });
      }

      // 6. 마그넷 위치
      if (!isUserActionRecent) {
        if (!summary.connectorSourceMagnet.isMixed && summary.connectorSourceMagnet.value) {
          setUIState({ sourceMagnet: summary.connectorSourceMagnet.value as MagnetPosition });
        }
        if (!summary.connectorTargetMagnet.isMixed && summary.connectorTargetMagnet.value) {
          setUIState({ targetMagnet: summary.connectorTargetMagnet.value as MagnetPosition });
        }
      }

      // 7. 시작/끝 오프셋 (커넥터 복수 선택 시)
      const isStartOffMixed = Boolean(summary.connectorStartOffset.isMixed);
      const startOffVal = summary.connectorStartOffset.value;
      setIsStartOffsetMixed(isStartOffMixed);
      const startOffEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
      if (isStartOffMixed) {
        setStartOffsetInput('');
        if (startOffEl) {
          startOffEl.value = '';
          startOffEl.placeholder = 'Mixed';
        }
      } else {
        const valStr = String(startOffVal !== undefined ? startOffVal : 0);
        setStartOffsetInput(valStr);
        if (startOffEl) {
          startOffEl.value = valStr;
          startOffEl.placeholder = '';
        }
      }

      const isEndOffMixed = Boolean(summary.connectorEndOffset.isMixed);
      const endOffVal = summary.connectorEndOffset.value;
      setIsEndOffsetMixed(isEndOffMixed);
      const endOffEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
      if (isEndOffMixed) {
        setEndOffsetInput('');
        if (endOffEl) {
          endOffEl.value = '';
          endOffEl.placeholder = 'Mixed';
        }
      } else {
        const valStr = String(endOffVal !== undefined ? endOffVal : 0);
        setEndOffsetInput(valStr);
        if (endOffEl) {
          endOffEl.value = valStr;
          endOffEl.placeholder = '';
        }
      }
    } else {
      // 커넥터가 선택되지 않은 경우 (단일/복수 플로우 노드 선택 또는 빈 캔버스):
      // 커넥터 섹션은 연결 생성을 위한 기본/현재 설정값을 유지하며 Mixed 상태를 표시하지 않습니다.
      setIsColorMixed(false);
      setIsWeightMixed(false);
      setIsStartOffsetMixed(false);
      setIsEndOffsetMixed(false);

      // 단자 드롭다운이 MIXED로 남아있지 않도록 기본값(시작: NONE, 끝: ARROW)으로 복원
      if (startTermVal === 'MIXED') {
        setStartTermVal('NONE');
        const startSel = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
        if (startSel) startSel.value = 'NONE';
      }
      if (endTermVal === 'MIXED') {
        setEndTermVal('ARROW');
        const endSel = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
        if (endSel) endSel.value = 'ARROW';
      }

      const weightEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
      if (weightEl && weightEl.placeholder === 'Mixed') {
        weightEl.placeholder = '';
        if (!weightInput) {
          setWeightInput('1.5');
          weightEl.value = '1.5';
        }
      }

      const startOffEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
      if (startOffEl && startOffEl.placeholder === 'Mixed') {
        startOffEl.placeholder = '';
        if (!startOffsetInput) {
          setStartOffsetInput('0');
          startOffEl.value = '0';
        }
      }

      const endOffEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
      if (endOffEl && endOffEl.placeholder === 'Mixed') {
        endOffEl.placeholder = '';
        if (!endOffsetInput) {
          setEndOffsetInput('0');
          endOffEl.value = '0';
        }
      }
    }
  }, [
    summary.isSingleConnector,
    summary.isMultiConnector,
    summary.isMultiFlowNode,
    summary.connectorColor.isMixed,
    summary.connectorColor.value,
    summary.connectorStrokeWeight.isMixed,
    summary.connectorStrokeWeight.value,
    summary.strokeWeight.isMixed,
    summary.strokeWeight.value,
    summary.connectorRoutingType.isMixed,
    summary.connectorRoutingType.value,
    summary.connectorStrokePattern.isMixed,
    summary.connectorStrokePattern.value,
    summary.connectorStartTerminal.isMixed,
    summary.connectorStartTerminal.value,
    summary.connectorEndTerminal.isMixed,
    summary.connectorEndTerminal.value,
    summary.color.isMixed,
    summary.color.value,
    selectedNodes,
    setUIState
  ]);

  // AppContext의 selectedConnectorColor가 변경되면(모달에서 Save 등) 동기화
  useEffect(() => {
    if (selectedConnectorColor) {
      const formatted = selectedConnectorColor.toUpperCase();
      setSelectedColor(formatted);
      setHexInput(formatted.replace('#', ''));
      const selectEl = document.getElementById('conn-line-color') as HTMLInputElement | null;
      if (selectEl) selectEl.value = formatted;

      // 선택 변경으로 인한 UI 상태 동기화인 경우 Core 재적용 스킵 (사용자가 모달 등에서 명시적으로 변경했을 때만 실행)
      if (lastSyncedSelectionColorRef.current === formatted) {
        return;
      }
      lastSyncedSelectionColorRef.current = formatted;
      const selectedHex = selectedNodes.find((n) => n?.isConnector)?.connectorColorHex?.toUpperCase();
      if (selectedHex && selectedHex === formatted) {
        return;
      }
      markConnectorDirty();
    }
  }, [selectedConnectorColor]);

  function selectLinePattern(pattern: string, el: HTMLElement | null = null) {
    setUIState({ selectedLinePattern: pattern });
    document.querySelectorAll('.line-style-btn').forEach(b => b.classList.remove('active'));
    if (!el) {
      document.querySelectorAll('.line-style-btn').forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        if (onclick.includes(`'${pattern}'`)) b.classList.add('active');
      });
    } else {
      el.classList.add('active');
    }
    markConnectorDirty();
  }

  function selectRoutingType(type: string) {
    setUIState({ selectedRoutingType: type });
    markConnectorDirty();
  }

  function selectAnchor(nodeIndex: 1 | 2, pos: MagnetPosition) {
    userActionTimestampRef.current = Date.now();
    const isConn = summary.isSingleConnector || summary.isMultiConnector;
    const hasExisting = Boolean(uiState.hasExistingConnection && uiState.connectedConnectorIds && uiState.connectedConnectorIds.length > 0);

    if (nodeIndex === 1) {
      setUserPendingSourceMagnet(pos);
      if (isConn) {
        setUIState({ sourceMagnet: pos });
        markConnectorDirty();
      } else if (hasExisting) {
        setUIState({ sourceMagnet: pos });
        markConnectorDirty();
      } else {
        // 신규 연결: Node 2(End)가 미선택 상태이면 동일 방향(pos)으로 자동 대응 (문제 B 해결)
        const autoTarget = (!userPendingTargetMagnet && !uiState.targetMagnet) ? pos : (userPendingTargetMagnet ?? uiState.targetMagnet);
        if (!userPendingTargetMagnet && !uiState.targetMagnet) {
          setUserPendingTargetMagnet(pos);
        }
        setUIState({ sourceMagnet: pos, targetMagnet: autoTarget ?? null });
      }
    } else {
      setUserPendingTargetMagnet(pos);
      if (isConn) {
        setUIState({ targetMagnet: pos });
        markConnectorDirty();
      } else if (hasExisting) {
        setUIState({ targetMagnet: pos });
        markConnectorDirty();
      } else {
        // 신규 연결: Node 1(Start)이 미선택 상태이면 동일 방향(pos)으로 자동 대응
        const autoSource = (!userPendingSourceMagnet && !uiState.sourceMagnet) ? pos : (userPendingSourceMagnet ?? uiState.sourceMagnet);
        if (!userPendingSourceMagnet && !uiState.sourceMagnet) {
          setUserPendingSourceMagnet(pos);
        }
        setUIState({ targetMagnet: pos, sourceMagnet: autoSource ?? null });
      }
    }
  }

  function selectTerminal(side: 'start' | 'end', value: ConnectorTerminalType) {
    const selectEl = document.getElementById(`select-${side}-terminal`) as HTMLSelectElement | null;
    if (selectEl) selectEl.value = value;

    if (side === 'start') {
      setStartTermVal(value);
      setStartTermPopupOpen(false);
    } else {
      setEndTermVal(value);
      setEndTermPopupOpen(false);
    }
    if (value !== 'MIXED') setTimeout(() => markConnectorDirty(), 0);
  }

  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace('#', '').toUpperCase().replace(/[^0-9A-F]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    setHexInput(val);

    if (val.length === 6) {
      const fullHex = `#${val}`;
      setSelectedColor(fullHex);
      const colSel = document.getElementById('conn-line-color') as HTMLInputElement | null;
      if (colSel) colSel.value = fullHex;
      setUIState({ selectedConnectorColor: fullHex });
      setTimeout(() => markConnectorDirty(), 0);
    }
  }

  function handleHexBlur() {
    let clean = hexInput.replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('').toUpperCase();
    }
    if (clean.length === 6 && /^[0-9A-F]{6}$/i.test(clean)) {
      const fullHex = `#${clean.toUpperCase()}`;
      setSelectedColor(fullHex);
      setHexInput(clean.toUpperCase());
      const colSel = document.getElementById('conn-line-color') as HTMLInputElement | null;
      if (colSel) colSel.value = fullHex;
      setUIState({ selectedConnectorColor: fullHex });
      setTimeout(() => markConnectorDirty(), 0);
    } else {
      setHexInput(selectedColor.replace('#', '').toUpperCase());
    }
  }

  function selectColor(colorHex: string) {
    setIsColorMixed(false);
    const formatted = colorHex.toUpperCase();
    setSelectedColor(formatted);
    setHexInput(formatted.replace('#', ''));
    setUIState({ selectedConnectorColor: formatted });

    const selectEl = document.getElementById('conn-line-color') as HTMLInputElement | null;
    if (selectEl) selectEl.value = formatted;
    setTimeout(() => markConnectorDirty(), 0);
  }

  // 두께 입력값 clamp 및 동기화 헬퍼 (C-25)
  const clampAndSyncStrokeWeight = () => {
    if (!isWeightMixed && weightInput.trim() !== '') {
      const parsed = parseFloat(weightInput);
      if (!isNaN(parsed)) {
        const clamped = Math.max(0.5, Math.min(10, parsed));
        setWeightInput(String(clamped));
        const inputEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
        if (inputEl) inputEl.value = String(clamped);
      }
    }
  };

  // 두께 기본값(1.5) 리셋 핸들러
  const handleResetStrokeWeight = () => {
    setIsWeightMixed(false);
    setWeightInput('1.5');
    const input = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
    if (input) {
      input.value = '1.5';
      input.placeholder = '';
      markConnectorDirty();
      input.focus();
      input.select();
    }
  };

  // 시작 오프셋 기본값(0) 리셋 핸들러
  const handleResetStartOffset = () => {
    if (offsetDebounceRef.current) clearTimeout(offsetDebounceRef.current);
    setIsStartOffsetMixed(false);
    setStartOffsetInput('0');
    const input = document.getElementById('input-start-offset') as HTMLInputElement | null;
    if (input) {
      input.value = '0';
      input.placeholder = '';
      markConnectorDirty();
      input.focus();
      input.select();
    } else {
      markConnectorDirty();
    }
  };

  // 끝 오프셋 기본값(0) 리셋 핸들러
  const handleResetEndOffset = () => {
    if (offsetDebounceRef.current) clearTimeout(offsetDebounceRef.current);
    setIsEndOffsetMixed(false);
    setEndOffsetInput('0');
    const input = document.getElementById('input-end-offset') as HTMLInputElement | null;
    if (input) {
      input.value = '0';
      input.placeholder = '';
      markConnectorDirty();
      input.focus();
      input.select();
    } else {
      markConnectorDirty();
    }
  };

  // 드롭다운 버튼 전용 그래픽: "-short"가 빠진 기본(52x16) 아이콘 사용
  function renderTerminalButtonGraphic(side: 'start' | 'end', val: ConnectorTerminalType) {
    if (val === 'MIXED') {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 400,
            color: 'inherit',
            lineHeight: '16px',
            display: 'inline-block',
          }}
        >
          Mixed
        </span>
      );
    }
    const opt: TerminalOption = (val as TerminalOption) in TERMINAL_SVGS_BTN[side]
      ? (val as TerminalOption)
      : (side === 'start' ? 'NONE' : 'ARROW');
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '52px',
          height: '16px',
        }}
        dangerouslySetInnerHTML={{ __html: TERMINAL_SVGS_BTN[side][opt] }}
      />
    );
  }

  const gizmoTypeLabel = (node?: NodeInfo | null): string => {
    if (!node) return '';
    if (!node.isFlowNode) return 'FigJam object';
    const flowType = normalizeNodeType(node.flowNodeType || node.nodeType);
    if (flowType === 'Branch') {
      return BRANCH_VARIANT_LABELS[normalizeBranchVariant(node.branchVariant)];
    }
    return flowType;
  };

  // 앵커 기즈모 카드 1 및 카드 2에 표시할 노드 이름 산출
  let node1DisplayName = 'Node 1';
  let node2DisplayName = 'Node 2';
  let node1TypeLabel = '';
  let node2TypeLabel = '';

  if (summary.isSingleConnector) {
    node1DisplayName = selectedNodes[0]?.connectorSourceNodeName || 'Source Node';
    node2DisplayName = selectedNodes[0]?.connectorTargetNodeName || 'Target Node';
    node1TypeLabel = selectedNodes[0]?.connectorSourceNodeType || '';
    node2TypeLabel = selectedNodes[0]?.connectorTargetNodeType || '';
  } else if (summary.isMultiConnector) {
    const connNodeNames = Array.from(new Set(selectedNodes.flatMap((n) => n?.connectedNodeNames || [])));
    const connNodeTypes = selectedNodes[0]?.connectedNodeTypes || [];
    if (connNodeNames.length > 0) {
      node1DisplayName = connNodeNames[0] || 'Node 1';
      node1TypeLabel = connNodeTypes[0] || '';
      if (connNodeNames.length >= 3) {
        const moreCount = connNodeNames.length - 1;
        node2DisplayName = `${moreCount} more ${moreCount === 1 ? 'node' : 'nodes'}`;
        node2TypeLabel = 'Mixed';
      } else if (connNodeNames.length === 2) {
        node2DisplayName = connNodeNames[1] || 'Node 2';
        node2TypeLabel = connNodeTypes[1] || '';
      } else {
        node2DisplayName = 'Node 2';
      }
    } else {
      const uniqueNames: string[] = [];
      const uniqueTypes: string[] = [];
      const pushEndpoint = (name?: string, typeLabel?: string) => {
        if (!name || uniqueNames.includes(name)) return;
        uniqueNames.push(name);
        uniqueTypes.push(typeLabel || '');
      };
      selectedNodes.forEach((n) => {
        pushEndpoint(n?.connectorSourceNodeName, n?.connectorSourceNodeType);
        pushEndpoint(n?.connectorTargetNodeName, n?.connectorTargetNodeType);
      });
      if (uniqueNames.length > 0) {
        node1DisplayName = uniqueNames[0] || 'Node 1';
        node1TypeLabel = uniqueTypes[0] || '';
        if (uniqueNames.length >= 3) {
          const moreCount = uniqueNames.length - 1;
          node2DisplayName = `${moreCount} more ${moreCount === 1 ? 'node' : 'nodes'}`;
          node2TypeLabel = 'Mixed';
        } else if (uniqueNames.length === 2) {
          node2DisplayName = uniqueNames[1] || 'Node 2';
          node2TypeLabel = uniqueTypes[1] || '';
        } else {
          node2DisplayName = 'Node 2';
        }
      }
    }
  } else {
    node1DisplayName = selectedNodes[0]?.title || selectedNodes[0]?.name || 'Node 1';
    node1TypeLabel = gizmoTypeLabel(selectedNodes[0]);
    if (selectedNodes.length >= 3) {
      const moreCount = selectedNodes.length - 1;
      node2DisplayName = `${moreCount} more ${moreCount === 1 ? 'node' : 'nodes'}`;
      node2TypeLabel = 'Mixed';
    } else {
      node2DisplayName = selectedNodes[1]?.title || selectedNodes[1]?.name || 'Node 2';
      node2TypeLabel = gizmoTypeLabel(selectedNodes[1]);
    }
  }

  // 커넥터 기즈모 마그넷 상태 계산 (0개: Default, 1개: Active, 2개 이상: Mixed)
  // Connector Color와 Gizmo Color를 분리하고, isReversed를 올바르게 반영
  const hasExisting = Boolean(uiState.hasExistingConnection);
  const is3PlusNodes = selectedNodes.length >= 3 && !summary.isSingleConnector && !summary.isMultiConnector;
  const gizmoResult = computeGizmoMagnets({
    isMultiConnector: summary.isMultiConnector,
    isSingleConnector: summary.isSingleConnector,
    connectorNodes: selectedNodes,
    hasExistingConnection: hasExisting,
    connectedConnectors: uiState.connectedConnectors,
    userPendingSourceMagnet,
    userPendingTargetMagnet,
    is3PlusNodes,
    startNodeId: selectedNodes[0]?.id,
    multiNodeConnectors: uiState.multiNodeConnectors,
  });

  const ROUTING_TYPES = [
    { type: 'ORTHOGONAL', title: '직각 (Orthogonal)', svg: '<g clip-path="url(#clip_orth)"><path d="M11.4999 18.1H5.8999V17.1H10.9999V6.40002C10.9999 6.12002 11.2199 5.90002 11.4999 5.90002H17.0999V6.90002H11.9999V17.6C11.9999 17.88 11.7799 18.1 11.4999 18.1Z" fill="currentColor"/></g><defs><clipPath id="clip_orth"><rect width="11.2" height="12.2" fill="white" transform="translate(5.8999 5.90002)"/></clipPath></defs>' },
    { type: 'S_CURVE', title: 'S자 곡선 (S-curve)', svg: '<g clip-path="url(#clip_sc)"><path d="M9.1999 18.1H6.3999C6.1199 18.1 5.8999 17.88 5.8999 17.6C5.8999 17.32 6.1199 17.1 6.3999 17.1H9.1999C10.4699 17.1 11.4999 16.07 11.4999 14.8V9.20002C11.4999 7.38002 12.9799 5.90002 14.7999 5.90002H17.5999C17.8799 5.90002 18.0999 6.12002 18.0999 6.40002C18.0999 6.68002 17.8799 6.90002 17.5999 6.90002H14.7999C13.5299 6.90002 12.4999 7.93002 12.4999 9.20002V14.8C12.4999 16.62 11.0199 18.1 9.1999 18.1Z" fill="currentColor"/></g><defs><clipPath id="clip_sc"><rect width="12.2" height="12.2" fill="white" transform="translate(5.8999 5.90002)"/></clipPath></defs>' },
    { type: 'CURVED', title: '부드러운 곡선 (Curve)', svg: '<g clip-path="url(#clip_cv)"><path d="M6.3999 18.1C6.1299 18.1 5.8999 17.88 5.8999 17.61C5.8999 17.33 6.1199 17.11 6.3999 17.1C10.4799 17.06 10.9599 14.69 11.5099 11.94C12.0699 9.17002 12.7099 6.02002 17.5899 5.90002H17.5999C17.8699 5.90002 18.0899 6.12002 18.0999 6.39002C18.0999 6.67002 17.8899 6.90002 17.6099 6.90002C13.5299 7.00002 13.0399 9.38002 12.4899 12.14C11.9299 14.91 11.2899 18.05 6.4099 18.1H6.3999Z" fill="currentColor"/></g><defs><clipPath id="clip_cv"><rect width="12.2" height="12.2" fill="white" transform="translate(5.8999 5.90002)"/></clipPath></defs>' },
    { type: 'STRAIGHT', title: '직선 (Straight)', svg: '<path d="M17.2714 6.02145C17.4667 5.82618 17.7832 5.82618 17.9785 6.02145C18.1737 6.21671 18.1737 6.53322 17.9785 6.72848L6.72848 17.9785C6.53322 18.1737 6.21671 18.1737 6.02145 17.9785C5.82618 17.7832 5.82618 17.4667 6.02145 17.2714L17.2714 6.02145Z" fill="currentColor"/>' },
  ];

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">
          Connect
          {summary.isMultiConnector && (
            isColorMixed || isWeightMixed || isRoutingMixed || isLinePatternMixed || summary.connectorStartTerminal.isMixed || summary.connectorEndTerminal.isMixed
          ) && (
            <span style={{ fontSize: '11px', color: 'var(--figma-color-text-tertiary, #999)', marginLeft: '6px', fontWeight: 'normal' }}>
              (Mixed)
            </span>
          )}
        </span>
      </div>
      <div className="section-body">
        {/* 색상 + 선 패턴 (Figma UI3 1027385:6998) */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* 표준 피그마 컬러 컨트롤 (입력 필드 + 컬러 아이콘) */}
          <div className="conn-color-input-wrapper" id="wrap-conn-color">
            <div
              className="conn-color-input-box"
              onClick={() => {
                hexInputRef.current?.focus();
                hexInputRef.current?.select();
              }}
            >
              {/* 컬러 칩 (피그마 UI3 표준 인풋 내 컬러 인디케이터 스와치) */}
              <span
                className="conn-color-chip"
                style={{
                  backgroundColor: isColorMixed ? 'transparent' : selectedColor,
                }}
                onClick={(e) => {
                  // 컬러칩은 색상 표시 전용 (클릭 시 컬러피커/입력 포커스 등 어떤 반응도 없음)
                  e.stopPropagation();
                }}
                title={isColorMixed ? 'Mixed' : `Color: ${selectedColor}`}
              >
                {isColorMixed && COLOR_MIXED_ICON}
              </span>

              {/* Hex 입력 필드 (예: EA2039) */}
              <input
                ref={hexInputRef}
                type="text"
                id="input-conn-color-hex"
                className="conn-color-hex-input"
                value={isColorMixed ? '' : hexInput}
                maxLength={7}
                placeholder={isColorMixed ? 'Mixed' : '000000'}
                onChange={(e) => {
                  setIsColorMixed(false);
                  handleHexChange(e);
                }}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                onBlur={handleHexBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                spellCheck={false}
                autoComplete="off"
              />

              {/* 피그마 UI3 컬러 팔레트 아이콘 버튼 (클릭 시 피그마 공식 컬러 휠 모달 열기) */}
              <button
                type="button"
                id="btn-conn-color-palette"
                className="conn-color-palette-btn"
                title="Color wheel modal"
                onClick={(e) => {
                  e.stopPropagation();
                  setStartTermPopupOpen(false);
                  setEndTermPopupOpen(false);
                  setUIState({ selectedConnectorColor: selectedColor });
                  setActiveModal('connector-color');
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.04976 7.04976C9.78343 4.31609 14.2165 4.31609 16.9502 7.04976C18.1125 8.2121 18.7807 9.685 18.9541 11.2011C19.1539 12.9507 17.5939 14 16.2246 14H15C14.4477 14 14 14.4477 14 15V16.2246C14 17.594 12.9499 19.1542 11.2002 18.9541C9.68423 18.7806 8.21195 18.1123 7.04976 16.9502C4.31609 14.2165 4.31609 9.78343 7.04976 7.04976ZM16.2421 7.75777C13.899 5.41463 10.1009 5.41463 7.75777 7.75777C5.41463 10.1009 5.41463 13.899 7.75777 16.2421C8.75465 17.239 10.0147 17.8122 11.3144 17.9609C12.2846 18.0718 13 17.2011 13 16.2246V15C13 13.8954 13.8954 13 15 13H16.2246C17.2011 13 18.0718 12.2846 17.9609 11.3144C17.8123 10.0147 17.239 8.75467 16.2421 7.75777ZM13 8.00003C13 8.55232 12.5523 9.00003 12 9.00003C11.4477 9.00003 11 8.55232 11 8.00003C11 7.44775 11.4477 7.00003 12 7.00003C12.5523 7.00003 13 7.44775 13 8.00003ZM9.86617 10.5002C10.1423 10.0219 9.97843 9.41032 9.50014 9.13417C9.02185 8.85803 8.41026 9.02191 8.13411 9.5002C7.85797 9.97849 8.02185 10.5901 8.50014 10.8662C8.97843 11.1424 9.59002 10.9785 9.86617 10.5002ZM15.5001 10.8662C15.0218 11.1424 14.4103 10.9785 14.1341 10.5002C13.858 10.0219 14.0218 9.41032 14.5001 9.13417C14.9784 8.85803 15.59 9.02191 15.8662 9.5002C16.1423 9.97849 15.9784 10.5901 15.5001 10.8662ZM8.13411 14.5002C8.41026 14.9785 9.02185 15.1424 9.50014 14.8662C9.97843 14.5901 10.1423 13.9785 9.86617 13.5002C9.59002 13.0219 8.97843 12.858 8.50014 13.1342C8.02185 13.4103 7.85797 14.0219 8.13411 14.5002Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            {/* 외부 스크립트 및 AppContext.applyCurrentConnectorState 호환용 숨겨진 input */}
            <input
              type="hidden"
              id="conn-line-color"
              value={selectedColor}
              onChange={() => {}}
            />
          </div>

          {/* 컬러 드롭박스 우측: 커넥터 모양 (ROUTING_TYPES 4개) */}
          <div className="routing-types-grid" style={{ flex: 1 }}>
            {ROUTING_TYPES.map(r => {
              const isActive = !isRoutingMixed && selectedRoutingType === r.type;
              return (
                <button key={r.type}
                  className={`routing-btn${isActive ? ' active' : ''}`}
                  title={r.title}
                  onClick={() => selectRoutingType(r.type)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: r.svg }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* 앵커 연결 캔버스 (Figma 공식 UI3 1027248:5061) */}
        <div
          className="connect-canvas-box"
          id="conn-anchor-preview-box"
        >
          <div className="node-preview-card" id="preview-node-1">
            {(['TOP', 'RIGHT', 'BOTTOM', 'LEFT'] as const).map(pos => {
              const state = gizmoResult.start.magnetStates[pos];
              const isActive = state === 'active';
              const isMixed = state === 'mixed';
              return (
                <div
                  key={pos}
                  className={`anchor-handle anchor-${pos.toLowerCase()}${isActive ? ' active' : ''}${isMixed ? ' mixed' : ''}`}
                  data-node="1"
                  data-pos={pos}
                  title={isMixed ? `Source ${pos} (Mixed)` : (isActive ? `Source ${pos} (Active)` : `Source ${pos}`)}
                  onClick={() => selectAnchor(1, pos)}
                />
              );
            })}
            <span className="node-preview-copy" id="preview-node-1-text">
              <span className="node-preview-title">{node1DisplayName}</span>
              {node1TypeLabel ? <span className="node-preview-type">{node1TypeLabel}</span> : null}
            </span>
          </div>
          <div className="node-preview-card" id="preview-node-2">
            {(['TOP', 'RIGHT', 'BOTTOM', 'LEFT'] as const).map(pos => {
              const state = gizmoResult.end.magnetStates[pos];
              const isActive = state === 'active';
              const isMixed = state === 'mixed';
              return (
                <div
                  key={pos}
                  className={`anchor-handle anchor-${pos.toLowerCase()}${isActive ? ' active' : ''}${isMixed ? ' mixed' : ''}`}
                  data-node="2"
                  data-pos={pos}
                  title={isMixed ? `Target ${pos} (Mixed)` : (isActive ? `Target ${pos} (Active)` : `Target ${pos}`)}
                  onClick={() => selectAnchor(2, pos)}
                />
              );
            })}
            <span className="node-preview-copy" id="preview-node-2-text">
              <span className="node-preview-title">{node2DisplayName}</span>
              {node2TypeLabel ? <span className="node-preview-type">{node2TypeLabel}</span> : null}
            </span>
          </div>
        </div>

        {/* 두께 + 선 모양 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <div className="input-scrubber-box" style={{ width: '70px' }}>
            <svg
              data-tooltip="Stroke width (Reset: 1.5)"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ cursor: 'pointer' }}
              onClick={handleResetStrokeWeight}
            >
              <path d="M17.25 14C17.6642 14 18 14.3358 18 14.75V17.25C18 17.6642 17.6642 18 17.25 18H6.75C6.33579 18 6 17.6642 6 17.25V14.75C6 14.3358 6.33579 14 6.75 14H17.25ZM7 17H17V15H7V17ZM17.25 9C17.6642 9 18 9.33579 18 9.75V11.25C18 11.6642 17.6642 12 17.25 12H6.75C6.33579 12 6 11.6642 6 11.25V9.75C6 9.33579 6.33579 9 6.75 9H17.25ZM7 11H17V10H7V11ZM17.5 6C17.7761 6 18 6.22386 18 6.5C18 6.77614 17.7761 7 17.5 7H6.5C6.22386 7 6 6.77614 6 6.5C6 6.22386 6.22386 6 6.5 6H17.5Z" fill="currentColor"/>
            </svg>
            <input
              type="text"
              inputMode="decimal"
              id="input-stroke-weight"
              value={isWeightMixed ? '' : weightInput}
              placeholder={isWeightMixed ? 'Mixed' : '1.5'}
              onChange={(e) => {
                setIsWeightMixed(false);
                setWeightInput(e.target.value);
                const inputEl = document.getElementById('input-stroke-weight') as HTMLInputElement | null;
                if (inputEl) inputEl.value = e.target.value;
              }}
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              onBlur={() => {
                clampAndSyncStrokeWeight();
                markConnectorDirty();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  clampAndSyncStrokeWeight();
                  markConnectorDirty();
                }
              }}
            />
          </div>
          <div className="line-style-segment" style={{ flex: 1 }}>
            {[
              { pattern: 'SOLID', title: 'Solid', path: 'M18.5 11C18.7761 11 19 11.2239 19 11.5C19 11.7761 18.7761 12 18.5 12H5.5C5.22386 12 5 11.7761 5 11.5C5 11.2239 5.22386 11 5.5 11H18.5Z' },
              { pattern: 'DASHED', title: 'Dashed', path: 'M7.5 12C7.77614 12 8 12.2239 8 12.5C8 12.7761 7.77614 13 7.5 13H5.5C5.22386 13 5 12.7761 5 12.5C5 12.2239 5.22386 12 5.5 12H7.5ZM13 12C13.2761 12 13.5 12.2239 13.5 12.5C13.5 12.7761 13.2761 13 13 13H11C10.7239 13 10.5 12.7761 10.5 12.5C10.5 12.2239 10.7239 12 11 12H13ZM18.5 12C18.7761 12 19 12.2239 19 12.5C19 12.7761 18.7761 13 18.5 13H16.5C16.2239 13 16 12.7761 16 12.5C16 12.2239 16.2239 12 16.5 12H18.5Z' },
            ].map(({ pattern, title, path }) => {
              const isActive = !isLinePatternMixed && selectedLinePattern === pattern;
              return (
                <button key={pattern}
                  className={`line-style-btn${isActive ? ' active' : ''}`}
                  title={title}
                  onClick={e => selectLinePattern(pattern, e.currentTarget)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d={path} fill="currentColor"/></svg>
                </button>
              );
            })}
            <button
              className={`line-style-btn${!isLinePatternMixed && selectedLinePattern === 'DOTTED' ? ' active' : ''}`}
              title="Dotted"
              onClick={e => selectLinePattern('DOTTED', e.currentTarget)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g transform="translate(5, 11.3)">
                  <path d="M0.7 0C0.31 0 0 0.31 0 0.7C0 1.09 0.31 1.4 0.7 1.4C1.09 1.4 1.4 1.09 1.4 0.7C1.4 0.31 1.09 0 0.7 0Z" fill="currentColor"/>
                  <path d="M3.8499 0C3.4599 0 3.1499 0.31 3.1499 0.7C3.1499 1.09 3.4599 1.4 3.8499 1.4C4.2399 1.4 4.5499 1.09 4.5499 0.7C4.5499 0.31 4.2399 0 3.8499 0Z" fill="currentColor"/>
                  <path d="M7.00005 0C6.61005 0 6.30005 0.31 6.30005 0.7C6.30005 1.09 6.61005 1.4 7.00005 1.4C7.39005 1.4 7.70005 1.09 7.70005 0.7C7.70005 0.31 7.39005 0 7.00005 0Z" fill="currentColor"/>
                  <path d="M10.15 0C9.75995 0 9.44995 0.31 9.44995 0.7C9.44995 1.09 9.75995 1.4 10.15 1.4C10.54 1.4 10.85 1.09 10.85 0.7C10.85 0.31 10.54 0 10.15 0Z" fill="currentColor"/>
                  <path d="M13.3001 0C12.9101 0 12.6001 0.31 12.6001 0.7C12.6001 1.09 12.9101 1.4 13.3001 1.4C13.6901 1.4 14.0001 1.09 14.0001 0.7C14.0001 0.31 13.6901 0 13.3001 0Z" fill="currentColor"/>
                </g>
              </svg>
            </button>
          </div>
        </div>

        {/* 단자 + 오프셋 */}
        <div className="terminal-offset-row">
          {/* 시작 오프셋 */}
          <div className="input-scrubber-box offset-start-box" style={{ width: '70px' }}>
            <svg
              data-tooltip="Start offset (Reset: 0)"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ cursor: 'pointer' }}
              onClick={handleResetStartOffset}
            >
              <path d="M12 18V6M17.7333 9.63637L20.0001 11.8182L17.7333 14M20.0001 11.8182H14.4045" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="number"
              id="input-start-offset"
              placeholder={isStartOffsetMixed ? 'Mixed' : 'Offset'}
              value={isStartOffsetMixed ? '' : startOffsetInput}
              onChange={(e) => {
                const val = e.target.value;
                setIsStartOffsetMixed(false);
                setStartOffsetInput(val);
                const inputEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
                if (inputEl) inputEl.value = val;

                if (val.trim() !== '') {
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed)) {
                    debouncedApplyOffset(parsed, undefined);
                  }
                }
              }}
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              onBlur={() => {
                if (offsetDebounceRef.current) clearTimeout(offsetDebounceRef.current);
                let finalVal: number | undefined = undefined;
                if (!isStartOffsetMixed && startOffsetInput.trim() !== '') {
                  const parsed = parseFloat(startOffsetInput);
                  if (!isNaN(parsed)) {
                    finalVal = parsed;
                    setStartOffsetInput(String(parsed));
                    const inputEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
                    if (inputEl) inputEl.value = String(parsed);
                  }
                }
                markConnectorDirty();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (offsetDebounceRef.current) clearTimeout(offsetDebounceRef.current);
                  let finalVal: number | undefined = undefined;
                  if (!isStartOffsetMixed && startOffsetInput.trim() !== '') {
                    const parsed = parseFloat(startOffsetInput);
                    if (!isNaN(parsed)) {
                      finalVal = parsed;
                      setStartOffsetInput(String(parsed));
                      const inputEl = document.getElementById('input-start-offset') as HTMLInputElement | null;
                      if (inputEl) inputEl.value = String(parsed);
                    }
                  }
                  markConnectorDirty();
                }
              }}
            />
          </div>

          {/* 시작 단자 (Start Terminal) */}
          <div className="figma-dropdown-wrapper" id="wrap-start-terminal" style={{ width: '100%' }}>
            {/* 드롭다운 버튼: -short가 빠진 기본(52x16) 아이콘 사용 */}
            <button
              type="button"
              id="btn-start-terminal"
              className={`figma-dropdown-btn${startTermPopupOpen ? ' active' : ''}`}
              title="Start terminal"
              style={{ padding: '0 4px 0 6px' }}
              onClick={(e) => {
                e.stopPropagation();
                setStartTermPopupOpen(!startTermPopupOpen);
                setEndTermPopupOpen(false);
              }}
            >
              <div className="figma-dropdown-btn-content" style={{ justifyContent: 'center' }}>
                <span id="icon-start-terminal" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  {renderTerminalButtonGraphic('start', startTermVal)}
                </span>
              </div>
              <span
                style={{
                  transform: startTermPopupOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {CHEVRON_SVG}
              </span>
            </button>

            {/* 외부 스크립트 호환용 숨겨진 select */}
            <select id="select-start-terminal" style={{ display: 'none' }} value={startTermVal} onChange={() => {}}>
              {['MIXED', 'NONE', 'ARROW', 'CIRCLE', 'DIAMOND'].map((v) => (
                <option key={v} value={v}>
                  {v === 'MIXED' ? 'Mixed' : v}
                </option>
              ))}
            </select>

            {/* 드롭다운 메뉴: -short(36x16) 아이콘 사용 (Figma 1027261:5984 / 6009) */}
            {startTermPopupOpen && (
              <div
                className="terminal-ui3-menu"
                id="popup-start-terminal"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 4px)',
                  top: 'auto',
                  left: 0,
                  right: 0,
                  width: '100%',
                  background: '#1e1e1e',
                  borderRadius: '13px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                  padding: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 1050,
                  boxSizing: 'border-box',
                }}
              >
                {/* Mixed 상태: 아이콘만으로 구성된 옵션이므로 16x16 체크 아이콘 + Mixed 텍스트 표시 */}
                {startTermVal === 'MIXED' && (
                  <DropdownMixedItem variant="icon-only" />
                )}

                {/* 6개 단자 옵션: -short 아이콘 사용 */}
                {TERMINAL_OPTIONS.map((opt) => {
                  const isSelected = startTermVal !== 'MIXED' && startTermVal === opt;
                  return (
                    <div
                      key={opt}
                      className={`terminal-ui3-item${isSelected ? ' selected' : ''}`}
                      style={{
                        width: '100%',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 4px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#ffffff',
                        userSelect: 'none',
                        boxSizing: 'border-box',
                        transition: 'background 0.12s',
                      }}
                      onClick={() => selectTerminal('start', opt)}
                    >
                      {/* 선택 체크마크 슬롯 (20x24 규격, 16x16 체크 아이콘) */}
                      <span style={{ width: '20px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: isSelected ? 1 : 0 }}>
                        {CHECK_SVG}
                      </span>
                      {/* 중앙 단자 그래픽: -short(36x16) 아이콘 */}
                      <span
                        className="td-icon-graphic"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: '16px' }}
                        dangerouslySetInnerHTML={{ __html: TERMINAL_SVGS_SHORT.start[opt] }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 끝 단자 (End Terminal) */}
          <div className="figma-dropdown-wrapper" id="wrap-end-terminal" style={{ width: '100%' }}>
            {/* 드롭다운 버튼: -short가 빠진 기본(52x16) 아이콘 사용 */}
            <button
              type="button"
              id="btn-end-terminal"
              className={`figma-dropdown-btn${endTermPopupOpen ? ' active' : ''}`}
              title="End terminal"
              style={{ padding: '0 4px 0 6px' }}
              onClick={(e) => {
                e.stopPropagation();
                setEndTermPopupOpen(!endTermPopupOpen);
                setStartTermPopupOpen(false);
              }}
            >
              <div className="figma-dropdown-btn-content" style={{ justifyContent: 'center' }}>
                <span id="icon-end-terminal" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  {renderTerminalButtonGraphic('end', endTermVal)}
                </span>
              </div>
              <span
                style={{
                  transform: endTermPopupOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {CHEVRON_SVG}
              </span>
            </button>

            {/* 외부 스크립트 호환용 숨겨진 select */}
            <select id="select-end-terminal" style={{ display: 'none' }} value={endTermVal} onChange={() => {}}>
              {['MIXED', 'NONE', 'ARROW', 'CIRCLE', 'DIAMOND'].map((v) => (
                <option key={v} value={v}>
                  {v === 'MIXED' ? 'Mixed' : v}
                </option>
              ))}
            </select>

            {/* 드롭다운 메뉴: -short(36x16) 아이콘 사용 (Figma 1027261:6029 / 6054) */}
            {endTermPopupOpen && (
              <div
                className="terminal-ui3-menu"
                id="popup-end-terminal"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 4px)',
                  top: 'auto',
                  left: 0,
                  right: 0,
                  width: '100%',
                  background: '#1e1e1e',
                  borderRadius: '13px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                  padding: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 1050,
                  boxSizing: 'border-box',
                }}
              >
                {/* Mixed 상태: 아이콘만으로 구성된 옵션이므로 16x16 체크 아이콘 + Mixed 텍스트 표시 */}
                {endTermVal === 'MIXED' && (
                  <DropdownMixedItem variant="icon-only" />
                )}

                {/* 6개 단자 옵션: -short 아이콘 사용 */}
                {TERMINAL_OPTIONS.map((opt) => {
                  const isSelected = endTermVal !== 'MIXED' && endTermVal === opt;
                  return (
                    <div
                      key={opt}
                      className={`terminal-ui3-item${isSelected ? ' selected' : ''}`}
                      style={{
                        width: '100%',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 4px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#ffffff',
                        userSelect: 'none',
                        boxSizing: 'border-box',
                        transition: 'background 0.12s',
                      }}
                      onClick={() => selectTerminal('end', opt)}
                    >
                      {/* 선택 체크마크 슬롯 (20x24 규격, 16x16 체크 아이콘) */}
                      <span style={{ width: '20px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: isSelected ? 1 : 0 }}>
                        {CHECK_SVG}
                      </span>
                      {/* 중앙 단자 그래픽: -short(36x16) 아이콘 */}
                      <span
                        className="td-icon-graphic"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: '16px' }}
                        dangerouslySetInnerHTML={{ __html: TERMINAL_SVGS_SHORT.end[opt] }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 끝 오프셋 */}
          <div className="input-scrubber-box offset-end-box" style={{ width: '70px' }}>
            <input
              type="number"
              id="input-end-offset"
              placeholder={isEndOffsetMixed ? 'Mixed' : 'Offset'}
              value={isEndOffsetMixed ? '' : endOffsetInput}
              onChange={(e) => {
                const val = e.target.value;
                setIsEndOffsetMixed(false);
                setEndOffsetInput(val);
                const inputEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
                if (inputEl) inputEl.value = val;

                if (val.trim() !== '') {
                  const parsed = parseFloat(val);
                  if (!isNaN(parsed)) {
                    debouncedApplyOffset(undefined, parsed);
                  }
                }
              }}
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              onBlur={() => {
                if (offsetDebounceRef.current) clearTimeout(offsetDebounceRef.current);
                let finalVal: number | undefined = undefined;
                if (!isEndOffsetMixed && endOffsetInput.trim() !== '') {
                  const parsed = parseFloat(endOffsetInput);
                  if (!isNaN(parsed)) {
                    finalVal = parsed;
                    setEndOffsetInput(String(parsed));
                    const inputEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
                    if (inputEl) inputEl.value = String(parsed);
                  }
                }
                markConnectorDirty();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (offsetDebounceRef.current) clearTimeout(offsetDebounceRef.current);
                  let finalVal: number | undefined = undefined;
                  if (!isEndOffsetMixed && endOffsetInput.trim() !== '') {
                    const parsed = parseFloat(endOffsetInput);
                    if (!isNaN(parsed)) {
                      finalVal = parsed;
                      setEndOffsetInput(String(parsed));
                      const inputEl = document.getElementById('input-end-offset') as HTMLInputElement | null;
                      if (inputEl) inputEl.value = String(parsed);
                    }
                  }
                  markConnectorDirty();
                }
              }}
            />
            <svg
              data-tooltip="End offset (Reset: 0)"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ cursor: 'pointer' }}
              onClick={handleResetEndOffset}
            >
              <g transform="translate(3.5, 5.5)">
                <path d="M8.49992 12.5V0.5M2.76672 8.5L0.5 6.31817L2.76672 4.13637M0.5 6.31817H6.09557" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
        </div>

        {/* 하단 연결 버튼 행 (설정 행들과 동일한 간격으로 배치) */}
        {(() => {
          const isAllConnectors = selectedNodes.length > 0 && selectedNodes.every(n => n && n.isConnector);
          const hasExisting = Boolean(uiState.hasExistingConnection);
          const effectiveSource = userPendingSourceMagnet ?? sourceMagnet;
          const effectiveTarget = userPendingTargetMagnet ?? targetMagnet;

          // 커넥터만 선택한 경우와 이미 연결된 노드 2개는 섹션 버튼을 두지 않는다.
          // 커넥터 1개는 즉시 반영되고, 커넥터 복수는 푸터 Undo / Apply to All을 쓴다.
          const twoNodesConnected = selectedNodes.length === 2 && hasExisting && !isAllConnectors;
          if (isAllConnectors || twoNodesConnected) return null;

          const showUpdate = isAllConnectors || hasExisting;

          // Quota UI 표시 전용: 신규 연결 생성이 막힌 상태 (업데이트는 제한하지 않음)
          const usageBlocked = flooowUsage !== null && !flooowUsage.canCreate;

          let isConnectDisabled = false;
          if (showUpdate) {
            // 기존 커넥터/연결은 설정이 바뀔 때만 Update
            isConnectDisabled = !connectorDirty;
          } else if (selectedNodes.length < 2) {
            isConnectDisabled = true;
          } else if (selectedNodes.length === 2) {
            // 2개 노드: 기즈모 없이도 거리 기준 최적 단자로 연결 가능
            isConnectDisabled = usageBlocked;
          } else {
            // 3개 이상: Start와 End anchor가 모두 선택 완료되어야 활성화
            const hasStart = Boolean(effectiveSource);
            const hasEnd = Boolean(effectiveTarget);
            isConnectDisabled = (!hasStart || !hasEnd) || usageBlocked;
          }

          let statusText = 'Select 2+ nodes to connect';
          if (isAllConnectors) {
            statusText = connectorDirty ? 'Changes ready to update' : 'No changes';
          } else if (hasExisting) {
            statusText = connectorDirty ? 'Changes ready to update' : 'Connected';
          } else if (selectedNodes.length === 2) {
            const hasStart = Boolean(effectiveSource);
            const hasEnd = Boolean(effectiveTarget);
            statusText = hasStart && hasEnd
              ? '2 nodes ready to connect'
              : 'Ready — anchors follow node distance';
          } else if (selectedNodes.length > 2) {
            const hasStart = Boolean(effectiveSource);
            const hasEnd = Boolean(effectiveTarget);
            if (!hasStart && !hasEnd) {
              statusText = 'Select Start & End anchors';
            } else if (!hasStart) {
              statusText = 'Select Start anchor';
            } else if (!hasEnd) {
              statusText = 'Select End anchor';
            } else {
              statusText = `${selectedNodes.length} nodes ready to connect`;
            }
          }

          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  lineHeight: '1.3',
                  color: 'var(--color-text-secondary, #6B7280)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={statusText}
              >
                {statusText}
              </span>
              <button
                type="button"
                id="btn-section-connect"
                className="btn-add-step-badges"
                disabled={isConnectDisabled}
                onClick={connectSelectedNodes}
                title={
                  showUpdate
                    ? (isConnectDisabled ? 'No changes to update' : 'Apply connector changes')
                    : isConnectDisabled
                    ? (usageBlocked ? 'Free limit reached (20 elements). Upgrade to create more.' : statusText)
                    : 'Connect selected nodes'
                }
              >
                {/* 커넥터 연결 아이콘 */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.6464 2.64645C10.8417 2.45118 11.1583 2.45118 11.3536 2.64645L12.8536 4.14645C13.0488 4.34171 13.0488 4.65829 12.8536 4.85355L11.3536 6.35355C11.1583 6.54882 10.8417 6.54882 10.6464 6.35355C10.4512 6.15829 10.4512 5.84171 10.6464 5.64645L11.2929 5H10.5C9.67157 5 9 5.67157 9 6.5V9.5C9 10.8807 7.88071 12 6.5 12H6C5.97174 12 5.94403 11.9977 5.91705 11.9932C5.71308 12.5793 5.15567 13 4.5 13C3.67157 13 3 12.3284 3 11.5C3 10.6716 3.67157 10 4.5 10C5.15567 10 5.71308 10.4207 5.91705 11.0068C5.94403 11.0023 5.97174 11 6 11H6.5C7.32843 11 8 10.3284 8 9.5V6.5C8 5.11929 9.11929 4 10.5 4H11.2929L10.6464 3.35355C10.4512 3.15829 10.4512 2.84171 10.6464 2.64645ZM4.5 12C4.77614 12 5 11.7761 5 11.5C5 11.2239 4.77614 11 4.5 11C4.22386 11 4 11.2239 4 11.5C4 11.7761 4.22386 12 4.5 12Z"
                    fill="currentColor"
                  />
                </svg>
                <span>
                  {showUpdate
                    ? (selectedNodes.length > 1 && isAllConnectors ? 'Update Connectors' : 'Update')
                    : 'Connect'}
                </span>
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
