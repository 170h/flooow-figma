import React, { useState, useEffect, useRef, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Switch } from "../shared/Switch";
import {
  normalizeNodeType,
  supportsOption,
  getMutationTargets,
  computeOptionSwitchState,
  type OptionSwitchState,
} from "../../../types";

/**
 * 프로토콜(http, https, figma 등)이 누락된 URL에 자동으로 https://를 붙여 유효한 링크로 정규화합니다.
 */
function normalizeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Figma Screen Link 섹션 - Node 탭, 토글(캐시 지원) + URL 입력 + X 삭제 버튼
 * Screen 노드만 지원하며, Shape/Bridge/FigmaObject 노드는 unsupported (비활성/접힘) 처리
 */
export function FigmaLinkSection() {
  const {
    autoResizeWindow,
    setLastNodeConfig,
    lastNodeConfig,
    selectedNodes,
    applyCurrentNodeState,
    uiState,
    multiDraft,
    updateMultiDraft,
  } = useApp();

  const [isOn, setIsOn] = useState(false);
  const [url, setUrl] = useState("");
  const cachedUrlRef = useRef<string>("");
  const userActionLockRef = useRef<number>(0);
  const prevSelectedNodeIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Option Capability Matrix 기반 스위치 상태 산출
  const rawOptionState = useMemo(() => {
    if (selectedNodes.length === 0) {
      const creationType = uiState.selectedNodeType || lastNodeConfig.nodeType || "Screen";
      const isAllowed = supportsOption({ flowNodeType: creationType, isFlowNode: true }, "figmaLink");
      if (!isAllowed) {
        return {
          state: "MIXED_DISABLED" as const,
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
      const on = Boolean(lastNodeConfig.singleLinkOn);
      return {
        state: (on ? "ON" : "OFF") as OptionSwitchState,
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
      "figmaLink",
      (n) => Boolean(n.figmaLink && n.figmaLink.trim())
    );
  }, [selectedNodes, uiState.selectedNodeType, lastNodeConfig.nodeType, lastNodeConfig.singleLinkOn]);

  // Multi Draft 상태 반영
  const isTypeDrafted = multiDraft.nodeType !== undefined;
  const isDraftAllowed = isTypeDrafted
    ? supportsOption({ flowNodeType: multiDraft.nodeType, isFlowNode: true }, "figmaLink")
    : true;

  const isLinkDrafted = multiDraft.figmaLink !== undefined;
  const effectiveIsOpen = !isDraftAllowed
    ? false
    : (isLinkDrafted ? Boolean(multiDraft.figmaLink) : (rawOptionState.disabled ? false : (rawOptionState.state === "MIXED_ACTIVE" ? true : isOn)));

  const effectiveState = useMemo(() => {
    if (!isDraftAllowed || rawOptionState.state === "MIXED_DISABLED") {
      return {
        state: "MIXED_DISABLED" as const,
        checked: false,
        isMixed: true,
        disabled: true,
        isOpen: false,
      };
    }
    if (isLinkDrafted) {
      const on = Boolean(multiDraft.figmaLink);
      return {
        state: (on ? "ON" : "OFF") as OptionSwitchState,
        checked: on,
        isMixed: false,
        disabled: false,
        isOpen: on,
      };
    }
    return {
      state: rawOptionState.state,
      checked: rawOptionState.checked,
      isMixed: rawOptionState.isMixed,
      disabled: rawOptionState.disabled,
      isOpen: effectiveIsOpen,
    };
  }, [isDraftAllowed, rawOptionState, isLinkDrafted, multiDraft.figmaLink, effectiveIsOpen]);

  // 노드 선택 대상이 실제로 변경되었을 때만 figmaLink / cachedLink 동기화 (사용자 조작 직후 600ms 동안은 중간 응답 덮어쓰기 방지)
  useEffect(() => {
    const isUserLocked = Date.now() - userActionLockRef.current < 600;
    const currentNodeId =
      selectedNodes.length === 1
        ? selectedNodes[0]?.id
        : selectedNodes.length > 1
          ? "MULTI"
          : null;
    const isDifferentNode = currentNodeId !== prevSelectedNodeIdRef.current;
    prevSelectedNodeIdRef.current = currentNodeId;

    if (!isUserLocked || isDifferentNode) {
      if (rawOptionState.supportedCount > 0) {
        const supported = rawOptionState.supportedNodes;
        if (supported.length === 1) {
          const node = supported[0];
          const activeLink = node.figmaLink || "";
          const cachedLink = node.cachedFigmaLink || activeLink || "";
          const enabled = Boolean(activeLink);
          setIsOn(enabled);
          const displayLink = activeLink || cachedLink;
          setUrl(displayLink);
          cachedUrlRef.current = displayLink;
          setLastNodeConfig({
            singleLinkOn: enabled,
            singleLinkUrl: displayLink,
          });
        } else {
          const onCount = supported.filter((n) => Boolean(n.figmaLink && n.figmaLink.trim())).length;
          setIsOn(onCount > 0);
          const firstLink = supported[0]?.figmaLink || "";
          const allSame = supported.every((n) => (n.figmaLink || "") === firstLink);
          if (allSame && firstLink) {
            setUrl(firstLink);
            cachedUrlRef.current = firstLink;
          } else {
            setUrl("");
          }
        }
      } else {
        setIsOn(false);
        setUrl("");
      }
    }
  }, [rawOptionState, selectedNodes, setLastNodeConfig]);

  // Mixed URL 여부: 지원 노드가 2개 이상이고 입력된 링크 URL이 서로 다른 경우
  const isLinkValueMixed = useMemo(() => {
    if (isLinkDrafted) return false;
    if (effectiveState.disabled) return false;
    const supported = rawOptionState.supportedNodes;
    if (supported.length <= 1) return false;
    const firstLink = supported[0]?.figmaLink || "";
    return supported.some((n) => (n.figmaLink || "") !== firstLink);
  }, [isLinkDrafted, effectiveState.disabled, rawOptionState.supportedNodes]);

  const displayUrl = isLinkDrafted ? (multiDraft.figmaLink || "") : (isLinkValueMixed ? "" : url);

  function commitUrl(currentRawUrl: string) {
    const trimmed = currentRawUrl.trim();
    if (!trimmed) {
      setUrl("");
      cachedUrlRef.current = "";
      if (selectedNodes.length >= 2) {
        updateMultiDraft({ figmaLink: "", clearLinkCache: true });
        return;
      }
      setLastNodeConfig({ singleLinkUrl: "" });
      setTimeout(() => {
        applyCurrentNodeState(undefined, undefined, {
          figmaLink: "",
          clearLinkCache: true,
        });
      }, 0);
      return;
    }
    const normalized = normalizeUrl(trimmed);
    setUrl(normalized);
    cachedUrlRef.current = normalized;
    if (selectedNodes.length >= 2) {
      updateMultiDraft({ figmaLink: normalized, clearLinkCache: false });
      return;
    }
    setLastNodeConfig({ singleLinkUrl: normalized });
    setTimeout(() => {
      applyCurrentNodeState(undefined, undefined, {
        figmaLink: normalized,
        clearLinkCache: false,
      });
    }, 0);
  }

  function handleToggle(checked: boolean) {
    if (effectiveState.disabled) return;
    userActionLockRef.current = Date.now();
    setIsOn(checked);

    if (selectedNodes.length >= 2) {
      if (!checked) {
        cachedUrlRef.current = displayUrl;
        updateMultiDraft({ figmaLink: "", clearLinkCache: false });
      } else {
        const restoreUrl = displayUrl || cachedUrlRef.current;
        if (restoreUrl.trim()) {
          commitUrl(restoreUrl);
        } else {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 60);
        }
      }
      requestAnimationFrame(() => {
        autoResizeWindow();
      });
      return;
    }

    if (!checked) {
      // 1. 토글을 껐을 때: URL은 캐시에 남겨두고 노드 캔버스의 링크 배지만 숨김
      cachedUrlRef.current = url;
      setLastNodeConfig({ singleLinkOn: false, singleLinkUrl: url });
      setTimeout(() => {
        applyCurrentNodeState(undefined, undefined, {
          figmaLink: "",
          clearLinkCache: false,
        });
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
    autoResizeWindow();
  }

  function handleUrlChange(value: string) {
    setUrl(value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commitUrl(displayUrl);
    }
  }

  function handleBlur() {
    commitUrl(displayUrl);
  }

  // X 버튼 클릭: URL 완전 삭제 및 노드 캐시 삭제
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setUrl("");
    cachedUrlRef.current = "";
    if (selectedNodes.length >= 2) {
      updateMultiDraft({
        figmaLink: "",
        clearLinkCache: true,
      });
      inputRef.current?.focus();
      return;
    }
    setLastNodeConfig({ singleLinkUrl: "" });
    applyCurrentNodeState(undefined, undefined, {
      figmaLink: "",
      clearLinkCache: true,
    });
    inputRef.current?.focus();
  }

  return (
    <div
      className="section-block figma-link-section"
      style={{ paddingBottom: effectiveState.isOpen ? "12px" : "0px" }}
    >
      <div className="section-header toggle-row">
        <span className={`section-title${effectiveState.disabled ? " disabled" : ""}`}>
          Figma Screen Link
          {!effectiveState.disabled && isLinkValueMixed && (
            <span className="section-mixed-label">(Mixed)</span>
          )}
        </span>
        <Switch
          id="toggle-single-figma-link"
          checked={effectiveState.checked}
          isMixed={effectiveState.isMixed}
          disabled={effectiveState.disabled}
          data-tooltip={
            effectiveState.disabled
              ? "Figma Screen Link is disabled for this shape"
              : undefined
          }
          onChange={handleToggle}
        />
      </div>
      {effectiveState.isOpen && (
        <div
          className="section-body collapsible-body"
          id="single-figma-link-group"
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              id="single-screen-url"
              className="form-input"
              style={{ width: "100%", paddingRight: displayUrl ? "28px" : "10px" }}
              placeholder={isLinkValueMixed ? "Mixed" : "Add a Figma Screen URL"}
              value={displayUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
            {displayUrl && (
              <button
                type="button"
                aria-label="Clear link URL"
                onClick={handleClear}
                style={{
                  position: "absolute",
                  right: "6px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  color: "#9ca3af",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#374151";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#9ca3af";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 3L3 9M3 3L9 9"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
