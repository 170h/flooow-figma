import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

const CLOSE_SVG = `<path d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z" fill="currentColor"/>`;

export interface PhaseData {
  id: string;
  name: string;
  color: string;
}

interface PhaseModalProps {
  editingPhase?: PhaseData | null;
  onSave: (phase: PhaseData) => void;
  onClose: () => void;
}

/**
 * Add/Edit Phase 모달
 */
export function PhaseModal({ editingPhase, onSave, onClose }: PhaseModalProps) {
  const { activeModal } = useApp();
  const isOpen = activeModal === 'phase';

  const [name, setName] = useState(editingPhase?.name || '');
  const [color, setColor] = useState(editingPhase?.color || '#EA2039');
  const [hexInput, setHexInput] = useState((editingPhase?.color || '#EA2039').replace('#', ''));
  const [colorPanelOpen, setColorPanelOpen] = useState(false);

  const HUE_COLORS = [
    '#EA2039', '#EB4C46', '#E05638', '#DF6246', '#EB5757',
    '#F5A623', '#F7CA00', '#27AE60', '#16A34A', '#2F80ED',
    '#5F92F3', '#8638E5', '#000000', '#6B7280', '#ffffff',
  ];

  if (!isOpen) return null;

  function handleHexInput(val: string) {
    const cleaned = val.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setHexInput(cleaned);
    if (cleaned.length === 6) {
      const newColor = `#${cleaned}`;
      setColor(newColor);
    }
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: editingPhase?.id || `phase-${Date.now()}`,
      name: name.trim(),
      color,
    });
    onClose();
  }

  return (
    <div id="modal-backdrop" className="popover-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div id="modal-phase" className="phase-modal-card" style={{ display: 'block' }}>
        <div className="phase-modal-header">
          <span id="phase-modal-title-text" className="phase-modal-title">
            {editingPhase ? 'Edit Phase' : 'Add Phase'}
          </span>
          <button className="phase-modal-close-btn" onClick={onClose} title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: CLOSE_SVG }} />
          </button>
        </div>
        <div className="phase-modal-body">
          {/* Name 필드 */}
          <div className="phase-field-group">
            <div className="phase-field-label-row">
              <span className="phase-field-label">Name</span>
            </div>
            <div className="phase-input-row-wrapper">
              <input
                type="text"
                id="input-phase-modal-name"
                className="phase-text-input"
                placeholder="Phase Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Background Color 필드 */}
          <div className="phase-field-group">
            <div className="phase-field-label-row">
              <span className="phase-field-label">Background Color</span>
            </div>
            <div className="phase-input-row-wrapper">
              <div
                className="phase-color-picker-box"
                id="phase-color-box-trigger"
                onClick={() => setColorPanelOpen(!colorPanelOpen)}
              >
                <div className="phase-color-preview-wrap">
                  <div id="phase-modal-color-chip" className="phase-color-preview-chip" style={{ background: color }} />
                </div>
                <input
                  type="text"
                  id="input-phase-modal-hex"
                  className="phase-color-hex-input"
                  value={hexInput}
                  maxLength={7}
                  onClick={e => e.stopPropagation()}
                  onChange={e => handleHexInput(e.target.value)}
                />
                <div className="phase-color-chevron-wrap">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1.5 2L4 4.5L6.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 컬러 팔레트 패널 */}
            {colorPanelOpen && (
              <div id="phase-color-picker-panel" className="phase-color-dropdown-panel" style={{ display: 'block' }}>
                <div className="phase-color-palette-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px' }}>
                  {HUE_COLORS.map(c => (
                    <div
                      key={c}
                      style={{
                        width: '18px', height: '18px',
                        borderRadius: '50%',
                        background: c,
                        border: color === c ? '2px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                        outline: color === c ? '2px solid var(--figma-color-bg-selected)' : 'none',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setColor(c);
                        setHexInput(c.replace('#', ''));
                        setColorPanelOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="phase-modal-footer">
          <button className="btn-phase-modal-cancel" onClick={onClose}>Cancel</button>
          <button
            id="btn-save-phase"
            className="btn-phase-modal-save"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
