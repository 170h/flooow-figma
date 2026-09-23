import React from 'react';
import { useApp } from '../../context/AppContext';

interface ContextMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 더보기 컨텍스트 메뉴 (Phase 편집/삭제)
 */
export function ContextMenu({ onEdit, onDelete }: ContextMenuProps) {
  const { contextMenuOpen, contextMenuPos, setContextMenuOpen } = useApp();

  if (!contextMenuOpen) return null;

  function handleEdit() {
    setContextMenuOpen(false);
    onEdit();
  }

  function handleDelete() {
    setContextMenuOpen(false);
    onDelete();
  }

  return (
    <div
      id="popover-context"
      className="popover-context-menu active"
      style={{ position: 'fixed', top: contextMenuPos.top, left: contextMenuPos.left, zIndex: 999 }}
    >
      <div className="context-menu-item" onClick={handleEdit}>Edit Phase</div>
      <div className="context-menu-item danger" onClick={handleDelete}>Delete Phase</div>
    </div>
  );
}
