import React, { useCallback } from 'react';
import { useApp, SizePreset, NodeInfo } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { DropdownMixedItem } from '../shared/DropdownMixedItem';
import { MixedDashChip } from '../shared/icons';
import { normalizeNodeType } from '../../../types';

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
    lastNodeConfig,
    setLastNodeConfig,
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
  } = useApp();

  const summary = useSelectionSummary();

  // 스크린(Screen) 노드 타입일 때만 Size 편집 허용
  const currentRawType = summary.isMultiFlowNode
    ? (!summary.nodeType.isMixed ? summary.nodeType.value : undefined)
    : (selectedNodes.length === 1
        ? (selectedNodes[0]?.flowNodeType || (selectedNodes[0]?.nodeType === 'FRAME' ? 'Screen' : selectedNodes[0]?.nodeType) || uiState.selectedNodeType)
        : (uiState.selectedNodeType || lastNodeConfig.nodeType || 'Screen'));
  const isSizeAllowed = normalizeNodeType(currentRawType) === 'Screen' ||
    (selectedNodes.length === 1 && selectedNodes[0]?.nodeType === 'FRAME') ||
    (uiState.selectedNodeType === 'Screen');

  // 1. 파생 상태 선언 (핸들러 및 Effect보다 먼저 선언)
  const activePreset = sizePresets.find(
    (p) => p.w === lastNodeConfig.width && p.h === lastNodeConfig.height
  );

  const isMoreDisabled =
    !isSizeAllowed ||
    !activePreset ||
    Boolean(activePreset.isDefault) ||
    DEFAULT_PRESET_IDS.has(activePreset.id);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const lastSelectedNodeIdRef = React.useRef<string | null>(null);

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
    if (summary.isMultiFlowNode) {
      if (summary.sizeMode.isMixed) return 'mixed';
      return summary.sizeMode.value || lastNodeConfig.sizeMode || 'fixed';
    }
    if (summary.isSingleFlowNode) {
      return summary.sizeMode.value || lastNodeConfig.sizeMode || 'fixed';
    }
    return lastNodeConfig.sizeMode || 'fixed';
  })();

  const isWMixed = summary.isMultiFlowNode && summary.width.isMixed;
  const isHMixed = summary.isMultiFlowNode && summary.height.isMixed;
  const isRMixed = summary.isMultiFlowNode && summary.cornerRadius.isMixed;

  // 2. 선택된 노드 변경 시 W, H, Radius 인풋 필드 값 동기화
  React.useEffect(() => {
    const validNodes = (selectedNodes || []).filter((n): n is NodeInfo => Boolean(n));
    const currentNodeId = selectedNodes.length === 1
      ? selectedNodes[0]?.id
      : (selectedNodes.length > 1 ? 'MULTI' : 'NONE');
    const isDifferentNode = currentNodeId !== lastSelectedNodeIdRef.current;
    if (isDifferentNode) {
      lastSelectedNodeIdRef.current = currentNodeId;
    }

    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const activeEl = document.activeElement;

    if (validNodes.length > 0) {
      if (summary.isMultiFlowNode) {
        if (wEl && (isDifferentNode || activeEl !== wEl)) {
          wEl.value = isWMixed ? '' : (summary.width.value !== undefined ? String(summary.width.value) : '');
          wEl.placeholder = isWMixed ? 'Mixed' : '';
        }
        if (hEl && (isDifferentNode || activeEl !== hEl)) {
          hEl.value = isHMixed ? '' : (summary.height.value !== undefined ? String(summary.height.value) : '');
          hEl.placeholder = isHMixed ? 'Mixed' : '';
        }
        if (rEl && (isDifferentNode || activeEl !== rEl)) {
          rEl.value = isRMixed ? '' : (summary.cornerRadius.value !== undefined ? String(summary.cornerRadius.value) : '');
          rEl.placeholder = isRMixed ? 'Mixed' : '';
        }
      } else {
        const first = validNodes[0];
        if (wEl && (isDifferentNode || activeEl !== wEl)) {
          const targetW = isDifferentNode
            ? (typeof first?.width === 'number' ? first.width : (lastNodeConfig.width || 250))
            : (lastNodeConfig.width !== undefined ? lastNodeConfig.width : (typeof first?.width === 'number' ? first.width : 250));
          wEl.value = String(targetW);
          wEl.placeholder = '';
        }
        if (hEl && (isDifferentNode || activeEl !== hEl)) {
          const targetH = isDifferentNode
            ? (typeof first?.height === 'number' ? first.height : (lastNodeConfig.height || 90))
            : (lastNodeConfig.height !== undefined ? lastNodeConfig.height : (typeof first?.height === 'number' ? first.height : 90));
          hEl.value = String(targetH);
          hEl.placeholder = '';
        }
        if (rEl && (isDifferentNode || activeEl !== rEl)) {
          const targetR = isDifferentNode
            ? (typeof first?.cornerRadius === 'number' ? first.cornerRadius : (lastNodeConfig.cornerRadius ?? 0))
            : (lastNodeConfig.cornerRadius !== undefined ? lastNodeConfig.cornerRadius : (typeof first?.cornerRadius === 'number' ? first.cornerRadius : 0));
          rEl.value = String(targetR);
          rEl.placeholder = '';
        }
      }
    } else {
      // 선택된 노드가 없을 때 (생성 대기 모드): lastNodeConfig 디폴트값(250, 90, 0) 동기화
      if (wEl && (isDifferentNode || activeEl !== wEl)) {
        wEl.value = String(lastNodeConfig.width || 250);
        wEl.placeholder = '';
      }
      if (hEl && (isDifferentNode || activeEl !== hEl)) {
        hEl.value = String(lastNodeConfig.height || 90);
        hEl.placeholder = '';
      }
      if (rEl && (isDifferentNode || activeEl !== rEl)) {
        rEl.value = String(lastNodeConfig.cornerRadius ?? 0);
        rEl.placeholder = '';
      }
    }
  }, [summary.isMultiFlowNode, isWMixed, isHMixed, isRMixed, summary.width.value, summary.height.value, summary.cornerRadius.value, selectedNodes, lastNodeConfig.width, lastNodeConfig.height, lastNodeConfig.cornerRadius]);

  // 3. 이벤트 핸들러 함수들
  function handleWChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedSizePresetId(null);
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setLastNodeConfig({ width: val });
    }
  }

  function handleHChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedSizePresetId(null);
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setLastNodeConfig({ height: val });
    }
  }

  function handleRChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedSizePresetId(null);
    let val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      if (val > 999) {
        val = 999;
        e.target.value = '999';
        showToast('최대값은 999입니다.', 'warning');
      } else if (val < 0) {
        val = 0;
        e.target.value = '0';
      }
      setLastNodeConfig({ cornerRadius: val });
    }
  }

  function triggerApply() {
    if (!isSizeAllowed) return;
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const w = parseInt(wEl?.value || '250', 10) || 250;
    const h = parseInt(hEl?.value || '90', 10) || 90;
    let r = parseInt(rEl?.value || '0', 10) || 0;
    if (r > 999) {
      r = 999;
      if (rEl) rEl.value = '999';
      showToast('최대값은 999입니다.', 'warning');
    } else if (r < 0) {
      r = 0;
      if (rEl) rEl.value = '0';
    }
    // W, H 수동 수정 시 fixed 모드로 자동 전환하여 내용물 자동 크기 계산(hug/fit)에 의해 무시되지 않도록 보장
    const sizeModeEl = document.getElementById('select-size-mode') as HTMLInputElement | null;
    if (sizeModeEl) {
      sizeModeEl.value = 'fixed';
    }
    if (!isNaN(w)) setLastNodeConfig({ width: w, sizeMode: 'fixed' });
    if (!isNaN(h)) setLastNodeConfig({ height: h, sizeMode: 'fixed' });
    if (!isNaN(r)) setLastNodeConfig({ cornerRadius: r });
    applyCurrentNodeState('fixed', undefined, undefined, 'Screen', { width: w, height: h, cornerRadius: r });
  }

  function applySizePreset(p: SizePreset) {
    if (!isSizeAllowed) return;
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    if (wEl) wEl.value = String(p.w);
    if (hEl) hEl.value = String(p.h);
    if (rEl) rEl.value = String(p.radius ?? 0);
    setSelectedSizePresetId(p.id);
    setLastNodeConfig({
      width: p.w,
      height: p.h,
      cornerRadius: p.radius ?? 0,
      sizeMode: p.sizeMode || 'fixed',
    });
    applyCurrentNodeState(p.sizeMode || 'fixed', undefined, undefined, 'Screen', {
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
    if (mode !== 'mixed') {
      setLastNodeConfig({ sizeMode: mode });
    }
    const hiddenInput = document.getElementById('select-size-mode') as HTMLInputElement | null;
    if (hiddenInput) {
      hiddenInput.value = mode;
      hiddenInput.dispatchEvent(new Event('change'));
    }
    setSelectedSizePresetId(null);
    setDropdownOpen(false);
    setSizeModeDropdownOpen(false);
    applyCurrentNodeState(mode);
  }

  return (
    <div className={`section-block${!isSizeAllowed ? ' disabled' : ''}`}>
      <div className="section-header">
        <span className={`section-title${!isSizeAllowed ? ' disabled' : ''}`}>Size</span>
        <div className="section-actions">
          <button
            className={`btn-action-icon${!isSizeAllowed ? ' disabled' : ''}`}
            title={!isSizeAllowed ? 'Add size is disabled for this shape' : 'Add size'}
            disabled={!isSizeAllowed}
            onClick={() => isSizeAllowed && setActiveModal('add-size')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 6C12.2761 6 12.5 6.22386 12.5 6.5V11.5H17.5C17.7761 11.5 18 11.7239 18 12C18 12.2761 17.7761 12.5 17.5 12.5H12.5V17.5C12.5 17.7761 12.2761 18 12 18C11.7239 18 11.5 17.7761 11.5 17.5V12.5H6.5C6.22386 12.5 6 12.2761 6 12C6 11.7239 6.22386 11.5 6.5 11.5H11.5V6.5C11.5 6.22386 11.7239 6 12 6Z" fill="currentColor"/></svg>
          </button>
          <button
            id="btn-size-more"
            className={`btn-action-icon btn-more-icon${isMoreDisabled ? ' disabled' : ''}`}
            title={!isSizeAllowed ? 'Size options are disabled for this shape' : (isMoreDisabled ? '기본 프리셋은 수정 또는 삭제할 수 없습니다' : 'More options')}
            disabled={isMoreDisabled}
            onClick={toggleSizeMoreMenu}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
          </button>
        </div>
      </div>

      <div className="section-body">
        <div className="numeric-inputs-row">
          <div className={`input-scrubber-box${!isSizeAllowed ? ' disabled' : ''}`}>
            <span className="scrubber-label" data-tooltip="Width">W</span>
            <input type="number" id="input-size-w" defaultValue={250} min={50}
              placeholder={isWMixed ? 'Mixed' : undefined}
              disabled={!isSizeAllowed}
              onChange={handleWChange}
              onBlur={triggerApply}
              onKeyDown={e => { if (e.key === 'Enter') { triggerApply(); (e.target as HTMLInputElement).blur(); } }} />
          </div>
          <div className={`input-scrubber-box${!isSizeAllowed ? ' disabled' : ''}`}>
            <span className="scrubber-label" data-tooltip="Height">H</span>
            <input type="number" id="input-size-h" defaultValue={90} min={40}
              placeholder={isHMixed ? 'Mixed' : undefined}
              disabled={!isSizeAllowed}
              onChange={handleHChange}
              onBlur={triggerApply}
              onKeyDown={e => { if (e.key === 'Enter') { triggerApply(); (e.target as HTMLInputElement).blur(); } }} />
          </div>
          <div className={`input-scrubber-box${!isSizeAllowed ? ' disabled' : ''}`}>
            <svg data-tooltip="Corner radius" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15.5 8C15.7761 8 16 8.22386 16 8.5C16 8.77614 15.7761 9 15.5 9H12.5C11.7917 9 11.2902 9.00022 10.8984 9.03223C10.5126 9.06377 10.2769 9.12345 10.0918 9.21777C9.71554 9.40951 9.40951 9.71554 9.21777 10.0918C9.12345 10.2769 9.06377 10.5126 9.03223 10.8984C9.00022 11.2902 9 11.7917 9 12.5V15.5C9 15.7761 8.77614 16 8.5 16C8.22386 16 8 15.7761 8 15.5V12.5C8 11.8082 8.00003 11.2593 8.03613 10.8174C8.07272 10.3696 8.14901 9.98732 8.32715 9.6377C8.61472 9.07347 9.07347 8.61472 9.6377 8.32715C9.98732 8.14901 10.3696 8.07272 10.8174 8.03613C11.2593 8.00003 11.8082 8 12.5 8H15.5Z" fill="currentColor"/></svg>
            <input type="number" id="input-size-radius"
              defaultValue={typeof selectedNodes[0]?.cornerRadius === 'number' ? selectedNodes[0].cornerRadius : (lastNodeConfig.cornerRadius || 0)}
              min={0} max={999}
              placeholder={isRMixed ? 'Mixed' : undefined}
              disabled={!isSizeAllowed}
              onChange={handleRChange}
              onBlur={triggerApply}
              onKeyDown={e => { if (e.key === 'Enter') { triggerApply(); (e.target as HTMLInputElement).blur(); } }} />
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
              title={!isSizeAllowed ? 'Size mode cannot be changed for this shape' : 'Select height mode'}
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
            <input type="hidden" id="select-size-mode" defaultValue="fixed" />
          </div>
        </div>

        {/* 프리셋 칩 */}
        <div className="chip-group" style={{ marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
          {sizePresets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip-btn${selectedSizePresetId === p.id ? ' active' : ''}${!isSizeAllowed ? ' disabled' : ''}`}
              onClick={() => isSizeAllowed && applySizePreset(p)}
              disabled={!isSizeAllowed}
              title={!isSizeAllowed ? 'Size presets are disabled for this shape' : `${p.name} (${p.w}×${p.h})`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
