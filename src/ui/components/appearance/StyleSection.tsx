import React, { useRef } from 'react';
import { useApp, StylePreset } from '../../context/AppContext';

/**
 * 기본 스타일 프리셋 ID 목록 (첫 번째: 흰색 + 1.5px 블랙 보더, 두 번째: 블랙 + 0px 보더)
 * 기본 스타일은 수정 및 삭제가 불가능하여 More(···) 버튼이 비활성화됩니다.
 */
const DEFAULT_STYLE_PRESET_IDS = new Set(['style-white', 'style-black']);

/**
 * Style 섹션 - 컬러/보더 스타일 카드 그리드 + Add / More 액션 버튼
 * 각 선택 카드에 설정값(배경 컬러, 보더 두께/사이즈, 보더 컬러)이 그대로 시각적으로 반영됩니다.
 */
export function StyleSection() {
  const {
    uiState,
    setUIState,
    setLastNodeConfig,
    applyCurrentNodeState,
    stylePresets,
    selectedStylePresetId,
    setSelectedStylePresetId,
    setActiveModal,
    contextMenuOpen,
    setContextMenuOpen,
    contextMenuTarget,
    setContextMenuTarget,
    setContextMenuPos,
    closeAllPopovers,
  } = useApp();
  const { selectedColor } = uiState;
  const btnMoreRef = useRef<HTMLButtonElement>(null);

  // 현재 선택된 컬러 및 보더 두께와 일치하는 프리셋 탐색
  const activeStylePreset = stylePresets.find((p) => {
    if (selectedStylePresetId && p.id === selectedStylePresetId) return true;
    const matchFill = p.fillColor.toLowerCase() === selectedColor.toLowerCase();
    const matchStroke = uiState.selectedStrokeWeight !== undefined
      ? p.strokeWeight === uiState.selectedStrokeWeight
      : true;
    return matchFill && matchStroke;
  }) || stylePresets.find((p) => p.fillColor.toLowerCase() === selectedColor.toLowerCase());

  // 기본 스타일이거나 일치하는 프리셋이 없으면 수정/삭제 불가 (모어 버튼 비활성화)
  const isMoreDisabled = !activeStylePreset ||
    Boolean(activeStylePreset.isDefault) ||
    DEFAULT_STYLE_PRESET_IDS.has(activeStylePreset.id);

  function selectStylePreset(preset: StylePreset) {
    setSelectedStylePresetId(preset.id);
    const connectorColor = preset.fillColor.toLowerCase() === '#ffffff' && preset.strokeWeight > 0
      ? preset.strokeColor
      : preset.fillColor;
    setUIState({
      selectedColor: preset.fillColor,
      selectedStrokeWeight: preset.strokeWeight,
      selectedStrokeColor: preset.strokeColor,
      selectedStylePresetId: preset.id,
      selectedConnectorColor: connectorColor,
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
  }

  function toggleStyleMoreMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (isMoreDisabled) return;
    if (contextMenuOpen && contextMenuTarget === 'style') {
      setContextMenuOpen(false);
      return;
    }
    closeAllPopovers();
    const rect = btnMoreRef.current?.getBoundingClientRect();
    if (rect) {
      const popoverHeight = 58;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= popoverHeight + 8 ? rect.bottom + 4 : Math.max(8, rect.top - popoverHeight - 4);
      const left = Math.max(8, rect.right - 72);
      setContextMenuPos({ top, left });
    }
    setContextMenuTarget('style');
    if (activeStylePreset) {
      setSelectedStylePresetId(activeStylePreset.id);
    }
    setContextMenuOpen(true);
  }

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">Style</span>
        <div className="section-actions">
          <button className="btn-action-icon" title="Add style" onClick={() => setActiveModal('add-style')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 6C12.2761 6 12.5 6.22386 12.5 6.5V11.5H17.5C17.7761 11.5 18 11.7239 18 12C18 12.2761 17.7761 12.5 17.5 12.5H12.5V17.5C12.5 17.7761 12.2761 18 12 18C11.7239 18 11.5 17.7761 11.5 17.5V12.5H6.5C6.22386 12.5 6 12.2761 6 12C6 11.7239 6.22386 11.5 6.5 11.5H11.5V6.5C11.5 6.22386 11.7239 6 12 6Z" fill="currentColor"/></svg>
          </button>
          <button
            id="btn-style-more"
            ref={btnMoreRef}
            className={`btn-action-icon btn-more-icon${isMoreDisabled ? ' disabled' : ''}${contextMenuOpen && contextMenuTarget === 'style' ? ' active' : ''}`}
            title={isMoreDisabled ? '기본 스타일은 수정 또는 삭제할 수 없습니다' : 'More options'}
            disabled={isMoreDisabled}
            onClick={toggleStyleMoreMenu}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="8" r="1" fill="currentColor" />
              <circle cx="8" cy="8" r="1" fill="currentColor" />
              <circle cx="12" cy="8" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
      <div className="section-body">
        <div className="swatches-grid" id="style-swatches">
          {stylePresets.map((preset) => {
            const isSelected = activeStylePreset?.id === preset.id ||
              (selectedColor.toLowerCase() === preset.fillColor.toLowerCase() &&
               (uiState.selectedStrokeWeight === undefined || uiState.selectedStrokeWeight === preset.strokeWeight));

            const hasBorder = preset.strokeWeight > 0;
            return (
              <div
                key={preset.id}
                className={`swatch-item${isSelected ? ' selected' : ''}`}
                style={{
                  backgroundColor: preset.fillColor,
                  border: hasBorder ? `${preset.strokeWeight}px solid ${preset.strokeColor}` : 'none',
                  boxSizing: 'border-box',
                  // 보더가 있는 카드는 기본 inset shadow가 겹치지 않도록 방지
                  boxShadow: hasBorder && !isSelected ? 'none' : undefined,
                }}
                data-color={preset.fillColor}
                data-style-id={preset.id}
                title={`배경: ${preset.fillColor}${hasBorder ? `, 보더: ${preset.strokeWeight}px ${preset.strokeColor}` : ', 보더: 없음'}`}
                onClick={() => selectStylePreset(preset)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
