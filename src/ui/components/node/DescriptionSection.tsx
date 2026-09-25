import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { IcCopy, IcCheckLarge } from '../shared/icons';

/**
 * Description 섹션 - 스위치 토글 + 복사 버튼 + collapsible textarea
 */
export function DescriptionSection() {
  const {
    applyCurrentNodeState,
    showToast,
    selectedNodes,
    lastNodeConfig,
    setLastNodeConfig,
    autoResizeWindow,
  } = useApp();
  const summary = useSelectionSummary();

  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastSelectedNodeIdRef = useRef<string | null | undefined>(undefined);

  // 토글 초기값: 단일 플로우 노드 선택 시 description 존재 여부, 그 외 lastNodeConfig 참조
  const [isOn, setIsOn] = useState(() => {
    if (selectedNodes.length === 1 && selectedNodes[0]?.isFlowNode) {
      return Boolean(selectedNodes[0]?.description && selectedNodes[0].description.trim());
    }
    return Boolean(lastNodeConfig.descriptionOn);
  });

  // 복사 버튼 활성화 여부 (입력된 텍스트 존재 여부 실시간 추적)
  const [hasText, setHasText] = useState(() => {
    if (selectedNodes.length === 1 && selectedNodes[0]?.isFlowNode) {
      return Boolean(selectedNodes[0]?.description && selectedNodes[0].description.trim());
    }
    return false;
  });

  const isDescMixed = summary.isMultiFlowNode && summary.description.isMixed;

  // 노드 선택 대상이 실제로 변경되었을 때만 토글 상태 동기화
  useEffect(() => {
    const currentNodeId = selectedNodes.length === 1
      ? selectedNodes[0].id
      : (selectedNodes.length > 1 ? 'MULTI' : null);

    if (currentNodeId !== lastSelectedNodeIdRef.current) {
      lastSelectedNodeIdRef.current = currentNodeId;

      if (selectedNodes.length === 1 && selectedNodes[0]?.isFlowNode) {
        const hasDesc = Boolean(selectedNodes[0]?.description && selectedNodes[0].description.trim());
        setIsOn(hasDesc);
        setHasText(hasDesc);
        setLastNodeConfig({ descriptionOn: hasDesc });
      } else if (selectedNodes.length === 0) {
        setIsOn(Boolean(lastNodeConfig.descriptionOn));
        setHasText(false);
      } else {
        const anyHasDesc = summary.hasDescription.hasValue;
        setIsOn(anyHasDesc);
        setHasText(anyHasDesc);
      }
    }
  }, [selectedNodes, lastNodeConfig.descriptionOn, summary.hasDescription.hasValue, setLastNodeConfig]);

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastNodeConfig({ descriptionOn: checked });

    if (!checked) {
      // 토글 OFF: textarea 내용 비우고 노드 반영 (디스크립션 텍스트 제거)
      setHasText(false);
      const ta = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
      if (ta) ta.value = '';
      setTimeout(() => applyCurrentNodeState(), 0);
    } else {
      // 토글 ON: textarea 포커스 및 노드 반영
      setTimeout(() => {
        const ta = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
        ta?.focus();
        setHasText(Boolean(ta?.value.trim()));
        applyCurrentNodeState();
      }, 50);
    }
    autoResizeWindow();
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const val = (e.target as HTMLTextAreaElement).value;
    setHasText(Boolean(val.trim()));
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => applyCurrentNodeState(), 400);
  }

  function copyDescription() {
    const val = (document.getElementById('node-description-input') as HTMLTextAreaElement)?.value ||
      (selectedNodes.length === 1 ? selectedNodes[0]?.description || '' : '');

    if (!val.trim()) {
      showToast('복사할 설명이 없습니다.', 'warning');
      return;
    }

    const handleSuccess = () => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
      showToast('Description copied to clipboard!');
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(val).then(handleSuccess).catch(() => {
        fallbackCopy(val);
        handleSuccess();
      });
    } else {
      fallbackCopy(val);
      handleSuccess();
    }
  }

  function fallbackCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
  }

  const defaultDescValue = summary.isMultiFlowNode
    ? (isDescMixed ? '' : (summary.description.value || ''))
    : (selectedNodes.length === 1 ? (selectedNodes[0]?.description || '') : '');

  const descPlaceholder = isDescMixed
    ? 'Mixed'
    : 'Add a description';

  return (
    <div className="section-block" style={{ paddingBottom: isOn ? '12px' : '0px' }}>
      <div className="section-header toggle-row">
        <span className="section-title">
          Description
          {isDescMixed && (
            <span style={{ fontSize: '11px', color: 'var(--figma-color-text-tertiary, #999)', marginLeft: '6px', fontWeight: 'normal' }}>
              (Mixed)
            </span>
          )}
        </span>
        <div className="section-actions">
          {/* 스위치가 켜진 상태에서만 복사 버튼 노출, 텍스트가 없으면 비활성 상태 */}
          {isOn && (
            <button
              id="btn-copy-desc"
              type="button"
              className={`btn-action-icon${copied ? ' copied' : ''}${!hasText ? ' disabled' : ''}`}
              title={copied ? '복사 완료' : (hasText ? 'Copy' : '입력된 설명이 없습니다')}
              disabled={!hasText}
              onClick={copyDescription}
            >
              {copied ? <IcCheckLarge /> : <IcCopy />}
            </button>
          )}
          <label className="switch">
            <input
              type="checkbox"
              id="toggle-description"
              checked={isOn}
              onChange={e => handleToggle(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </div>
      {isOn && (
        <div className="section-body collapsible-body">
          <textarea
            key={summary.isMultiFlowNode ? 'multi-desc' : (selectedNodes[0]?.id || 'none')}
            id="node-description-input"
            className="desc-textarea"
            placeholder={descPlaceholder}
            defaultValue={defaultDescValue}
            onInput={handleInput}
          />
        </div>
      )}
    </div>
  );
}
