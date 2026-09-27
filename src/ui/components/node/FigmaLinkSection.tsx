import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { Switch } from '../shared/Switch';
import { normalizeNodeType } from '../../../types';

/**
 * 프로토콜(http, https, figma 등)이 누락된 URL에 자동으로 https://를 붙여 유효한 링크로 정규화합니다.
 */
function normalizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Figma Screen Link 섹션 - Node 탭, 토글(캐시 지원) + URL 입력 + X 삭제 버튼
 */
export function FigmaLinkSection() {
  const { autoResizeWindow, setLastNodeConfig, lastNodeConfig, selectedNodes, applyCurrentNodeState, uiState } = useApp();
  const summary = useSelectionSummary();

  // 스크린(Screen) 노드 타입일 때만 피그마 스크린 링크 허용
  const isLinkAllowed = summary.isMultiFlowNode
    ? (!summary.nodeType.isMixed && normalizeNodeType(summary.nodeType.value) === 'Screen')
    : (selectedNodes.length === 1
        ? normalizeNodeType(selectedNodes[0]?.flowNodeType) === 'Screen'
        : normalizeNodeType(uiState.selectedNodeType) === 'Screen');

  const [isOn, setIsOn] = useState(false);
  const [url, setUrl] = useState('');
  const cachedUrlRef = useRef<string>('');
  const lastSelectedNodeIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isLinkMixed = summary.isMultiFlowNode && summary.figmaLink.isMixed;

  // 노드 선택 대상이 실제로 변경되었을 때만 figmaLink / cachedLink 동기화
  useEffect(() => {
    const currentNodeId = selectedNodes.length === 1
      ? selectedNodes[0].id
      : (selectedNodes.length > 1 ? 'MULTI' : null);

    if (currentNodeId !== lastSelectedNodeIdRef.current) {
      lastSelectedNodeIdRef.current = currentNodeId;

      if (selectedNodes.length === 1) {
        const node = selectedNodes[0];
        const activeLink = node.figmaLink || '';
        const cachedLink = node.cachedFigmaLink || activeLink || '';
        const enabled = Boolean(activeLink);
        setIsOn(enabled);
        const displayLink = activeLink || cachedLink;
        setUrl(displayLink);
        cachedUrlRef.current = displayLink;
        setLastNodeConfig({ singleLinkOn: enabled, singleLinkUrl: displayLink });
      } else if (selectedNodes.length === 0) {
        setIsOn(lastNodeConfig.singleLinkOn || false);
        const link = lastNodeConfig.singleLinkUrl || '';
        setUrl(link);
        cachedUrlRef.current = link;
      } else {
        const anyHasLink = summary.hasFigmaLink.hasValue;
        setIsOn(anyHasLink);
        if (summary.figmaLink.isMixed) {
          setUrl('');
        } else {
          const commonLink = summary.figmaLink.value || '';
          setUrl(commonLink);
          cachedUrlRef.current = commonLink;
        }
      }
    }
  }, [selectedNodes, lastNodeConfig.singleLinkOn, lastNodeConfig.singleLinkUrl, summary.hasFigmaLink.hasValue, summary.figmaLink.isMixed, summary.figmaLink.value, setLastNodeConfig]);

  function commitUrl(currentRawUrl: string) {
    const trimmed = currentRawUrl.trim();
    if (!trimmed) {
      setUrl('');
      cachedUrlRef.current = '';
      setLastNodeConfig({ singleLinkUrl: '' });
      setTimeout(() => {
        applyCurrentNodeState(undefined, undefined, { figmaLink: '', clearLinkCache: true });
      }, 0);
      return;
    }
    const normalized = normalizeUrl(trimmed);
    setUrl(normalized);
    cachedUrlRef.current = normalized;
    setLastNodeConfig({ singleLinkUrl: normalized });
    setTimeout(() => {
      applyCurrentNodeState(undefined, undefined, { figmaLink: normalized, clearLinkCache: false });
    }, 0);
  }

  function handleToggle(checked: boolean) {
    if (!isLinkAllowed) return;
    setIsOn(checked);
    autoResizeWindow();

    if (!checked) {
      // 1. 토글을 껐을 때: URL은 캐시에 남겨두고 노드 캔버스의 링크 배지만 숨김
      cachedUrlRef.current = url;
      setLastNodeConfig({ singleLinkOn: false, singleLinkUrl: url });
      setTimeout(() => {
        applyCurrentNodeState(undefined, undefined, { figmaLink: '', clearLinkCache: false });
      }, 0);
    } else {
      // 2. 토글을 켰을 때: 캐시된 URL이 있으면 즉시 노드에 복원, 없으면 입력창 포커스
      const restoreUrl = url || cachedUrlRef.current;
      setLastNodeConfig({ singleLinkOn: true, singleLinkUrl: restoreUrl });
      if (restoreUrl.trim()) {
        commitUrl(restoreUrl);
      } else {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 60);
      }
    }
  }

  function handleUrlChange(value: string) {
    setUrl(value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitUrl(url);
      inputRef.current?.blur();
    }
  }

  function handleBlur() {
    commitUrl(url);
  }

  // X 버튼 클릭: URL 완전 삭제 및 노드 캐시 삭제
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setUrl('');
    cachedUrlRef.current = '';
    setLastNodeConfig({ singleLinkUrl: '' });
    applyCurrentNodeState(undefined, undefined, { figmaLink: '', clearLinkCache: true });
    inputRef.current?.focus();
  }

  const effectiveIsOn = isLinkAllowed && isOn;

  return (
    <div className="section-block figma-link-section" style={{ paddingBottom: effectiveIsOn ? '12px' : '0px' }}>
      <div className="section-header toggle-row">
        <span className={`section-title${!isLinkAllowed ? ' disabled' : ''}`}>
          Figma Screen Link
          {isLinkAllowed && isLinkMixed && (
            <span className="section-mixed-label">
              (Mixed)
            </span>
          )}
        </span>
        <Switch
          id="toggle-single-figma-link"
          checked={effectiveIsOn}
          isMixed={isLinkAllowed && isLinkMixed}
          disabled={!isLinkAllowed}
          data-tooltip={!isLinkAllowed ? 'Figma Screen Link is disabled for this shape' : undefined}
          onChange={handleToggle}
        />
      </div>
      {effectiveIsOn && (
        <div className="section-body collapsible-body" id="single-figma-link-group">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <input
              ref={inputRef}
              type="text"
              id="single-screen-url"
              className="form-input"
              style={{ width: '100%', paddingRight: url ? '28px' : '10px' }}
              placeholder={isLinkMixed ? 'Mixed' : 'Add a Figma Screen URL'}
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
            {url && (
              <button
                type="button"
                aria-label="Clear link URL"
                onClick={handleClear}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  color: '#9ca3af',
                  outline: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = '#374151';
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = '#9ca3af';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
