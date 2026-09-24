import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IcCopy, IcCheckLarge } from '../shared/icons';

/**
 * Description 섹션 - textarea + 복사 버튼
 */
export function DescriptionSection() {
  const { applyCurrentNodeState, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyCurrentNodeState(), 400);
  }

  function copyDescription() {
    const val = (document.getElementById('node-description-input') as HTMLTextAreaElement)?.value || '';

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

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">Description</span>
        <div className="section-actions">
          <button
            id="btn-copy-desc"
            className={`btn-action-icon${copied ? ' copied' : ''}`}
            title={copied ? '복사 완료' : 'Copy'}
            onClick={copyDescription}
          >
            {copied ? <IcCheckLarge /> : <IcCopy />}
          </button>
        </div>
      </div>
      <div className="section-body">
        <textarea
          id="node-description-input"
          className="desc-textarea"
          placeholder="Add a description"
          onInput={handleInput}
        />
      </div>
    </div>
  );
}
