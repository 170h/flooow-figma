import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Switch } from '../shared/Switch';

/**
 * Link 섹션 - 토글 + URL 입력
 */
export function LinkSection() {
  const { setLastConnectorConfig, autoResizeWindow } = useApp();
  const [isOn, setIsOn] = useState(false);

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastConnectorConfig({ linkOn: checked });
    const el = document.getElementById('conn-link-group');
    if (el) el.classList.toggle('active', checked);
    autoResizeWindow();
  }

  return (
    <div className="section-block" id="conn-link-section-block">
      <div className="section-header toggle-row">
        <span className="section-title">Link</span>
        <Switch
          id="toggle-conn-link"
          checked={isOn}
          onChange={handleToggle}
        />
      </div>
      <div className="section-body">
        <div className={`collapsible-content${isOn ? ' active' : ''}`} id="conn-link-group">
          <input type="text" id="input-conn-link-url" className="form-input"
            placeholder="Add a URL"
            onChange={e => setLastConnectorConfig({ linkUrl: e.target.value.trim() })} />
        </div>
      </div>
    </div>
  );
}
