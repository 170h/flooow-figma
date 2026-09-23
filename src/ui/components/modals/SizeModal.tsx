import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const CLOSE_SVG = `<path d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z" fill="currentColor"/>`;

interface SizePreset {
  name: string;
  w: number;
  h: number;
  radius: number;
  sizeMode: string;
}

interface SizeModalProps {
  mode: 'add' | 'edit';
  editingPreset?: SizePreset | null;
  onSave: (preset: SizePreset) => void;
  onClose: () => void;
}

/**
 * Add/Edit Size 모달 - 사이즈 프리셋 추가/편집
 */
export function SizeModal({ mode, editingPreset, onSave, onClose }: SizeModalProps) {
  const { activeModal } = useApp();
  const isOpen = mode === 'add' ? activeModal === 'add-size' : activeModal === 'edit-size';

  const [name, setName] = useState(editingPreset?.name || '');
  const [w, setW] = useState(editingPreset?.w ?? 375);
  const [h, setH] = useState(editingPreset?.h ?? 812);
  const [radius, setRadius] = useState(editingPreset?.radius ?? 0);
  const [sizeMode, setSizeMode] = useState(editingPreset?.sizeMode || 'fixed');

  if (!isOpen) return null;

  function handleSave() {
    onSave({ name: name.trim() || 'Custom', w, h, radius, sizeMode });
    onClose();
  }

  const title = mode === 'add' ? 'Add Size' : 'Edit Size';

  return (
    <div id="modal-backdrop" className="popover-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div id={`modal-${mode}-size`} className="size-modal-card" style={{ display: 'block' }}>
        <div className="size-modal-header">
          <span className="size-modal-title">{title}</span>
          <button className="size-modal-close-btn" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: CLOSE_SVG }} />
          </button>
        </div>

        <div className="size-modal-body">
          {/* Name */}
          <div className="phase-field-group">
            <div className="phase-field-label-row">
              <span className="phase-field-label">Name</span>
            </div>
            <div className="phase-input-row-wrapper">
              <input type="text" className="phase-text-input" placeholder="Custom"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>

          {/* Size */}
          <div className="phase-field-group" style={{ paddingBottom: 0 }}>
            <div className="phase-field-label-row">
              <span className="phase-field-label">Size</span>
            </div>
            <div className="phase-input-row-wrapper" style={{ gap: '6px' }}>
              <div className="prefix-input-box">
                <span className="prefix-label">W</span>
                <input type="number" className="prefix-input" value={w} min={20}
                  onChange={e => setW(parseInt(e.target.value, 10) || 375)} />
              </div>
              <div className="prefix-input-box">
                <span className="prefix-label">H</span>
                <input type="number" className="prefix-input" value={h} min={20}
                  onChange={e => setH(parseInt(e.target.value, 10) || 812)} />
              </div>
            </div>

            {/* Corner Radius */}
            <div className="phase-input-row-wrapper">
              <div className="icon-input-box">
                <span className="icon-input-slot">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 12V6C4 4.89543 4.89543 4 6 4H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input type="number" className="prefix-input" value={radius} min={0} max={100}
                  onChange={e => setRadius(parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>

            {/* Size Mode */}
            <div className="phase-input-row-wrapper">
              <div className="size-dropdown-box" onClick={() => setSizeMode(sizeMode === 'fixed' ? 'hug' : 'fixed')}>
                <div className="size-dropdown-left">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M5 3H11M8 3V13M5 13H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span>{sizeMode === 'fixed' ? 'Fixed height' : 'Hug contents'}</span>
                </div>
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1.5 2L4 4.5L6.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="size-modal-footer">
          <button className="btn-phase-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-phase-modal-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
