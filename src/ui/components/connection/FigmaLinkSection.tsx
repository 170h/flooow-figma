import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Figma Screen Link 섹션 - 단일 노드 모드, 토글 + URL 입력
 * ※ conn-single-mode 래퍼 div는 ConnectionPanel에서 관리
 */
export function FigmaLinkSection() {
  const { autoResizeWindow, setLastNodeConfig } = useApp();
  const [isOn, setIsOn] = useState(false);

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastNodeConfig({ singleLinkOn: checked });
    autoResizeWindow();
  }

  return (
    <>
      <div className="section-header toggle-row">
        <span className="section-title">Figma Screen Link</span>
        <label className="switch">
          <input
            type="checkbox"
            id="toggle-single-figma-link"
            checked={isOn}
            onChange={e => handleToggle(e.target.checked)}
          />
          <span className="slider" />
        </label>
      </div>
      {isOn && (
        <div className="section-body collapsible-body" id="single-figma-link-group">
          <input
            type="text"
            id="single-screen-url"
            className="form-input"
            placeholder="Add a Figma Screen URL"
            onChange={e => setLastNodeConfig({ singleLinkUrl: e.target.value.trim() })}
          />
        </div>
      )}
    </>
  );
}
