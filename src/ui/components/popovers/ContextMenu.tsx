import React from 'react';
import { useApp } from '../../context/AppContext';
import { t } from '../../../i18n';

interface ContextMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * 피그마 UI3 공식 규격 More 컨텍스트 메뉴 (피그마 노드 1027248-4796)
 * 너비 72px, R12 카드, 패딩 4px, 구분선 없음, Edit / Delete 항목 (호버/활성 시 보라색 #8C4CF6)
 */
export function ContextMenu({ onEdit, onDelete }: ContextMenuProps) {
  const {
    contextMenuOpen,
    contextMenuPos,
    contextMenuTarget,
    setContextMenuOpen,
    setActiveModal,
    selectedSizePresetId,
    deleteSizePreset,
    selectedStylePresetId,
    deleteStylePreset,
    showToast,
    nodeOptionState,
  } = useApp();

  if (!contextMenuOpen) return null;

  const DEFAULT_STYLE_PRESET_IDS = new Set(['style-white', 'style-black']);
  const DEFAULT_STYLE_COLORS = new Set(['#ffffff', '#000000']);

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setContextMenuOpen(false);
    if (contextMenuTarget === 'size') {
      setActiveModal('edit-size');
    } else if (contextMenuTarget === 'style') {
      const color = nodeOptionState.fillColor;
      if (
        (selectedStylePresetId && DEFAULT_STYLE_PRESET_IDS.has(selectedStylePresetId)) ||
        (!color || DEFAULT_STYLE_COLORS.has(color.toLowerCase()))
      ) {
        showToast(t('styleEditNoDefault'), 'warning');
        return;
      }
      setActiveModal('edit-style');
    } else {
      onEdit?.();
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setContextMenuOpen(false);
    if (contextMenuTarget === 'size') {
      const DEFAULT_PRESET_IDS = new Set(['default', 'square', 'web', 'mobile']);
      if (!selectedSizePresetId || DEFAULT_PRESET_IDS.has(selectedSizePresetId)) {
        showToast(t('presetDeleteNoDefault'), 'warning');
        return;
      }
      deleteSizePreset(selectedSizePresetId);
      showToast(t('sizePresetDeleted2'));
    } else if (contextMenuTarget === 'style') {
      const color = nodeOptionState.fillColor;
      if (
        (selectedStylePresetId && DEFAULT_STYLE_PRESET_IDS.has(selectedStylePresetId)) ||
        (!color || DEFAULT_STYLE_COLORS.has(color.toLowerCase()))
      ) {
        showToast(t('styleDefaultNoDelete'), 'warning');
        return;
      }
      if (selectedStylePresetId) {
        deleteStylePreset(selectedStylePresetId);
      } else {
        showToast(t('styleDeleted'));
      }
    } else {
      onDelete?.();
    }
  }

  return (
    <div
      id="popover-context"
      className="popover-context-menu active"
      style={{
        position: 'fixed',
        top: contextMenuPos.top,
        left: contextMenuPos.left,
        zIndex: 1050,
      }}
    >
      <div className="context-item" onClick={handleEdit}>
        Edit
      </div>
      <div className="context-item" onClick={handleDelete}>
        Delete
      </div>
    </div>
  );
}
