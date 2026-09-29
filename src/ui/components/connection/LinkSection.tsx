import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Switch } from '../shared/Switch';

/**
 * Link 섹션 - 토글 + URL 입력
 */
export function LinkSection() {
  const { lastConnectorConfig, setLastConnectorConfig, autoResizeWindow } = useApp();
  const [isOn, setIsOn] = useState(lastConnectorConfig.linkOn || false);
  const [url, setUrl] = useState(lastConnectorConfig.linkUrl || '');

  useEffect(() => {
    const nextOn = lastConnectorConfig.linkOn || false;
    const nextUrl = lastConnectorConfig.linkUrl || '';
    setIsOn(nextOn);
    setUrl(nextUrl);

    const toggleEl = document.getElementById('toggle-conn-link') as HTMLInputElement | null;
    if (toggleEl && toggleEl.checked !== nextOn) {
      toggleEl.checked = nextOn;
    }
    const urlEl = document.getElementById('input-conn-link-url') as HTMLInputElement | null;
    if (urlEl && urlEl.value !== nextUrl) {
      urlEl.value = nextUrl;
    }
    const groupEl = document.getElementById('conn-link-group');
    if (groupEl) {
      groupEl.classList.toggle('active', nextOn);
    }
  }, [lastConnectorConfig.linkOn, lastConnectorConfig.linkUrl]);

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastConnectorConfig({ linkOn: checked });
    const el = document.getElementById('conn-link-group');
    if (el) el.classList.toggle('active', checked);
    autoResizeWindow();
  }

  function handleUrlChange(val: string) {
    setUrl(val);
    setLastConnectorConfig({ linkUrl: val.trim() });
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
          <input
            type="text"
            id="input-conn-link-url"
            className="form-input"
            placeholder="Add a URL"
            value={url}
            onChange={e => handleUrlChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
