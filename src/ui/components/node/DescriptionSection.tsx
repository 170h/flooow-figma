import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IcCopy, IcCheckLarge } from '../shared/icons';
import { Switch } from '../shared/Switch';
import {
  normalizeNodeType,
  supportsOption,
  getMutationTargets,
  computeOptionSwitchState,
  type OptionSwitchState,
} from '../../../types';

/**
 * Description 섹션 - 스위치 토글 + 복사 버튼 + collapsible textarea
 * Screen 노드만 지원하며, Shape/Bridge/FigmaObject 노드는 unsupported (비활성/접힘) 처리
 */
export function DescriptionSection() {
  const {
    applyCurrentNodeState,
    showToast,
    selectedNodes,
    lastNodeConfig,
    setLastNodeConfig,
    autoResizeWindow,
    uiState,
    multiDraft,
    updateMultiDraft,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isOn, setIsOn] = useState<boolean | null>(null);

  // 복사 버튼 활성화 여부 (입력된 텍스트 존재 여부 실시간 추적)
  const [hasText, setHasText] = useState(() => {
    if (selectedNodes.length === 1 && supportsOption(selectedNodes[0], 'description')) {
      return Boolean(selectedNodes[0]?.description && selectedNodes[0].description.trim());
    }
    return false;
  });

  const userActionLockRef = useRef<number>(0);
  const prevSelectedNodeIdRef = useRef<string | null>(null);

  // Option Capability Matrix 기반 스위치 상태 산출
  const rawOptionState = useMemo(() => {
    if (selectedNodes.length === 0) {
      const creationType = uiState.selectedNodeType || lastNodeConfig.nodeType || 'Screen';
      const isAllowed = supportsOption({ flowNodeType: creationType, isFlowNode: true }, 'description');
      if (!isAllowed) {
        return {
          state: 'MIXED_DISABLED' as const,
          supportedCount: 0,
          unsupportedCount: 1,
          supportedNodes: [],
          unsupportedNodes: [],
          checked: false,
          isMixed: true,
          disabled: true,
          isOpen: false,
        };
      }
      const on = Boolean(lastNodeConfig.descriptionOn);
      return {
        state: (on ? 'ON' : 'OFF') as OptionSwitchState,
        supportedCount: 1,
        unsupportedCount: 0,
        supportedNodes: [],
        unsupportedNodes: [],
        checked: on,
        isMixed: false,
        disabled: false,
        isOpen: on,
      };
    }
    return computeOptionSwitchState(
      selectedNodes,
      'description',
      (n) => Boolean(n.descriptionOn ?? (n.description && n.description.trim()))
    );
  }, [selectedNodes, uiState.selectedNodeType, lastNodeConfig.nodeType, lastNodeConfig.descriptionOn]);

  // Multi Draft 상태 반영
  const isTypeDrafted = multiDraft.nodeType !== undefined;
  const isDraftAllowed = isTypeDrafted
    ? supportsOption({ flowNodeType: multiDraft.nodeType, isFlowNode: true }, 'description')
    : true;

  const isDescDrafted = multiDraft.description !== undefined || multiDraft.descriptionOn !== undefined;
  const effectiveIsOpen = !isDraftAllowed || rawOptionState.disabled
    ? false
    : (isDescDrafted
        ? Boolean(multiDraft.descriptionOn !== undefined ? multiDraft.descriptionOn : multiDraft.description)
        : (isOn !== null ? isOn : rawOptionState.isOpen));

  const effectiveState = useMemo(() => {
    if (!isDraftAllowed || rawOptionState.state === 'MIXED_DISABLED') {
      return {
        state: 'MIXED_DISABLED' as const,
        checked: false,
        isMixed: true,
        disabled: true,
        isOpen: false,
      };
    }
    if (isDescDrafted) {
      const on = Boolean(multiDraft.descriptionOn !== undefined ? multiDraft.descriptionOn : multiDraft.description);
      return {
        state: (on ? 'ON' : 'OFF') as OptionSwitchState,
        checked: on,
        isMixed: false,
        disabled: false,
        isOpen: on,
      };
    }
    if (isOn !== null) {
      return {
        state: (isOn ? 'ON' : 'OFF') as OptionSwitchState,
        checked: isOn,
        isMixed: false,
        disabled: rawOptionState.disabled,
        isOpen: isOn,
      };
    }
    return {
      state: rawOptionState.state,
      checked: rawOptionState.checked,
      isMixed: rawOptionState.isMixed,
      disabled: rawOptionState.disabled,
      isOpen: effectiveIsOpen,
    };
  }, [isDraftAllowed, rawOptionState, isDescDrafted, multiDraft.descriptionOn, multiDraft.description, effectiveIsOpen, isOn]);

  // 노드 선택 대상이 실제로 변경되었을 때만 토글 상태 동기화 (사용자 조작 직후 600ms 동안은 중간 응답 덮어쓰기 방지)
  useEffect(() => {
    const isUserLocked = Date.now() - userActionLockRef.current < 600;
    const currentNodeId = selectedNodes.length === 1
      ? selectedNodes[0]?.id
      : (selectedNodes.length > 1 ? 'MULTI' : null);
    const isDifferentNode = currentNodeId !== prevSelectedNodeIdRef.current;
    prevSelectedNodeIdRef.current = currentNodeId;

    if (isDifferentNode) {
      setIsOn(null);
    }

    if (!isUserLocked || isDifferentNode) {
      if (rawOptionState.supportedCount > 0) {
        const supported = rawOptionState.supportedNodes;
        if (supported.length === 1) {
          const node = supported[0];
          const isDescActive = Boolean(node && (node.descriptionOn ?? (node.description && node.description.trim())));
          const hasDescText = Boolean(node && node.description && node.description.trim());
          setHasText(hasDescText);
          setLastNodeConfig({ descriptionOn: isDescActive });
        } else {
          const onCount = supported.filter((n) => Boolean(n.descriptionOn ?? (n.description && n.description.trim()))).length;
          const hasTextCount = supported.filter((n) => Boolean(n.description && n.description.trim())).length;
          setHasText(hasTextCount > 0);
        }
      } else {
        setHasText(false);
      }
    }
  }, [rawOptionState, selectedNodes, setLastNodeConfig]);

  // Mixed 텍스트 여부: 지원 노드가 2개 이상이고 입력된 설명 텍스트가 서로 다른 경우
  const isDescValueMixed = useMemo(() => {
    if (isDescDrafted) return false;
    if (effectiveState.disabled) return false;
    const supported = rawOptionState.supportedNodes;
    if (supported.length <= 1) return false;
    const firstDesc = supported[0]?.description || '';
    return supported.some((n) => (n.description || '') !== firstDesc);
  }, [isDescDrafted, effectiveState.disabled, rawOptionState.supportedNodes]);

  const isDescSectionOpen = effectiveState.isOpen;

  const effectiveHasText = isDescDrafted
    ? Boolean(multiDraft.description?.trim())
    : (rawOptionState.supportedNodes.length >= 2
        ? (!isDescValueMixed && Boolean(rawOptionState.supportedNodes[0]?.description?.trim()))
        : hasText);

  function handleToggle(checked: boolean) {
    if (effectiveState.disabled) return;
    userActionLockRef.current = Date.now();
    setIsOn(checked);

    if (selectedNodes.length >= 2) {
      if (!checked) {
        updateMultiDraft({ descriptionOn: false });
      } else {
        const ta = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
        const val = ta?.value.trim() || '';
        setHasText(Boolean(val));
        updateMultiDraft({ descriptionOn: true, ...(val ? { description: val } : {}) });
      }
      requestAnimationFrame(() => {
        autoResizeWindow();
      });
      return;
    }

    setLastNodeConfig({ descriptionOn: checked });

    if (!checked) {
      // 토글 OFF: textarea 내용은 그대로 보존하고 노드 캔버스에서만 설명 텍스트 숨김 (BUG-DESCRIPTION-02 해결)
      setTimeout(() => applyCurrentNodeState(), 0);
    } else {
      // 토글 ON: textarea 포커스 및 노드에 설명 텍스트 복원
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
    if (selectedNodes.length >= 2) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        updateMultiDraft({ description: val });
      }, 300);
      return;
    }
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => applyCurrentNodeState(), 400);
  }

  function copyDescription() {
    const val = (document.getElementById('node-description-input') as HTMLTextAreaElement)?.value ||
      (rawOptionState.supportedNodes.length === 1 ? rawOptionState.supportedNodes[0]?.description || '' : '');

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

  // Clipboard API 미지원 또는 iframe 권한 제한 환경을 위한 레거시 복사 폴백 유지 (C-34)
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

  const defaultDescValue = (isDescDrafted && multiDraft.description !== undefined)
    ? (multiDraft.description || '')
    : (rawOptionState.supportedNodes.length >= 2
        ? (isDescValueMixed ? '' : (rawOptionState.supportedNodes[0]?.description || ''))
        : (rawOptionState.supportedNodes.length === 1 ? (rawOptionState.supportedNodes[0]?.description || '') : ''));

  const descPlaceholder = isDescValueMixed
    ? 'Mixed'
    : 'Add a description';

  return (
    <div className="section-block" style={{ paddingBottom: isDescSectionOpen ? '12px' : '0px' }}>
      <div className="section-header toggle-row">
        <span className={`section-title${effectiveState.disabled ? ' disabled' : ''}`}>
          Description
          {!effectiveState.disabled && isDescValueMixed && (
            <span className="section-mixed-label">
              (Mixed)
            </span>
          )}
        </span>
        <div className="section-actions">
          {/* 스위치가 켜진 상태(isDescSectionOpen)에서만 복사 버튼 노출, 텍스트가 없으면 비활성 상태 */}
          {isDescSectionOpen && (
            <button
              id="btn-copy-desc"
              type="button"
              className={`btn-action-icon${copied ? ' copied' : ''}${!effectiveHasText ? ' disabled' : ''}`}
              title={copied ? '복사 완료' : (effectiveHasText ? 'Copy' : '입력된 설명이 없습니다')}
              disabled={!effectiveHasText}
              onClick={copyDescription}
            >
              {copied ? <IcCheckLarge /> : <IcCopy />}
            </button>
          )}
          <Switch
            id="toggle-description"
            checked={effectiveState.checked}
            isMixed={effectiveState.isMixed}
            disabled={effectiveState.disabled}
            data-tooltip={effectiveState.disabled ? 'Description is disabled for this shape' : undefined}
            onChange={handleToggle}
          />
        </div>
      </div>
      {isDescSectionOpen && (
        <div className="section-body collapsible-body">
          <textarea
            key={selectedNodes.length >= 2 ? 'multi-desc' : (rawOptionState.supportedNodes[0]?.id || 'none')}
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
