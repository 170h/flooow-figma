import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';

const COPY_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 6C14.3284 6 15 6.67157 15 7.5V9H16.5C17.3284 9 18 9.67157 18 10.5V16.5C18 17.3284 17.3284 18 16.5 18H10.5C9.67157 18 9 17.3284 9 16.5V15H7.5C6.67157 15 6 14.3284 6 13.5V7.5C6 6.67157 6.67157 6 7.5 6H13.5ZM15 13.5C15 14.3284 14.3284 15 13.5 15H10V16.5C10 16.7761 10.2239 17 10.5 17H16.5C16.7761 17 17 16.7761 17 16.5V10.5C17 10.2239 16.7761 10 16.5 10H15V13.5ZM7.5 7C7.22386 7 7 7.22386 7 7.5V13.5C7 13.7761 7.22386 14 7.5 14H13.5C13.7761 14 14 13.7761 14 13.5V7.5C14 7.22386 13.7761 7 13.5 7H7.5Z" fill="currentColor"/></svg>`;
const CHECK_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12.5L10 16.5L18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
            dangerouslySetInnerHTML={{ __html: copied ? CHECK_SVG : COPY_SVG }}
          />
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
