import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Switch } from '../shared/Switch';

const LABEL_PRESETS = ['Text', 'Yes', 'No', 'Success', 'Error', 'Next', 'Back'] as const;

/**
 * Label 섹션 - 토글 + 프리셋 칩 + 텍스트 입력
 */
export function LabelSection() {
  const { lastConnectorConfig, setLastConnectorConfig, applyCurrentConnectorState, autoResizeWindow } = useApp();
  const [isOn, setIsOn] = useState(lastConnectorConfig.labelOn || false);
  const [labelText, setLabelText] = useState(lastConnectorConfig.labelText || 'Text');

  useEffect(() => {
    setIsOn(lastConnectorConfig.labelOn || false);
    if (lastConnectorConfig.labelText !== undefined) {
      setLabelText(lastConnectorConfig.labelText);
    }
  }, [lastConnectorConfig.labelOn, lastConnectorConfig.labelText]);

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastConnectorConfig({ labelOn: checked });
    autoResizeWindow();
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function handlePresetClick(val: string) {
    setLabelText(val);
    setLastConnectorConfig({ labelText: val });
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function handleTextChange(val: string) {
    setLabelText(val);
    setLastConnectorConfig({ labelText: val });
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  return (
    <div className="section-block" style={{ paddingBottom: isOn ? '12px' : '0px' }}>
      <div className="section-header toggle-row">
        <span className="section-title">Label</span>
        <Switch
          id="toggle-conn-label"
          checked={isOn}
          onChange={handleToggle}
        />
      </div>
      {isOn && (
        <div className="section-body">
          <div className="collapsible-content active" id="conn-label-group">
            <div className="chip-group" id="conn-label-group-chips">
              {LABEL_PRESETS.map(label => {
                const isActive = labelText === label;
                return (
                  <button
                    key={label}
                    type="button"
                    className={`chip-btn${isActive ? ' active' : ''}`}
                    data-label={label}
                    onClick={() => handlePresetClick(label)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              id="input-conn-label"
              className="form-input"
              placeholder="Label text"
              value={labelText}
              style={{ marginTop: '6px' }}
              onChange={e => handleTextChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
