import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const LABEL_PRESETS = ['Text', 'Yes', 'No', 'Success', 'Error', 'Next', 'Back'] as const;

/**
 * Label 섹션 - 토글 + 프리셋 칩 + 텍스트 입력
 */
export function LabelSection() {
  const { setLastConnectorConfig, applyCurrentConnectorState, autoResizeWindow } = useApp();
  const [isOn, setIsOn] = useState(false);

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastConnectorConfig({ labelOn: checked });
    const el = document.getElementById('conn-label-group');
    if (el) el.classList.toggle('active', checked);
    autoResizeWindow();
  }

  function setLabelPreset(val: string, btn: HTMLElement) {
    const inputEl = document.getElementById('input-conn-label') as HTMLInputElement | null;
    if (inputEl) inputEl.value = val;
    setLastConnectorConfig({ labelText: val });
    document.querySelectorAll('#conn-label-group .chip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyCurrentConnectorState();
  }

  return (
    <div className="section-block">
      <div className="section-header toggle-row">
        <span className="section-title">Label</span>
        <label className="switch">
          <input type="checkbox" id="toggle-conn-label" checked={isOn}
            onChange={e => handleToggle(e.target.checked)} />
          <span className="slider" />
        </label>
      </div>
      <div className="section-body">
        <div className={`collapsible-content${isOn ? ' active' : ''}`} id="conn-label-group">
          <div className="chip-group" id="conn-label-group-chips">
            {LABEL_PRESETS.map(label => (
              <button key={label} className="chip-btn" data-label={label}
                onClick={e => setLabelPreset(label, e.currentTarget)}>
                {label}
              </button>
            ))}
          </div>
          <input type="text" id="input-conn-label" className="form-input" placeholder="Label text"
            style={{ marginTop: '6px' }}
            onChange={e => setLastConnectorConfig({ labelText: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
