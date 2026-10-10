import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useSelectionSummary } from "../../hooks/useSelectionSummary";
import { Switch } from "../shared/Switch";
import { useDisabledNotice, DisabledNoticeChip } from "../shared/DisabledNotice";
import { t } from "../../../i18n";
import {
  type BadgePosition,
  type BadgeShape,
  type OptionSwitchState,
} from "../../../types";
import {
  supportsOption,
  getMutationTargets,
  computeOptionSwitchState,
} from "../../../domain/nodeDomain";

type BadgeColorMode = "White" | "Black" | "Style";

/**
 * ⚠️ [CRITICAL RULE - DO NOT MODIFY ICONS]
 * Step Badges 섹션의 모든 공식 아이콘(BADGE_CORNERS 4개 코너 아이콘, step-number-icon)은
 * 원본 규격 24x24 (width=24, height=24, viewBox="0 0 24 24") 고정이며,
 * 어떤 경우에도 임의로 SVG 패스를 새로 만들거나 크기/모양을 수정/교체해서는 안 됩니다.
 */
const BADGE_CORNERS = [
  {
    pos: "TOP_LEFT",
    title: "Top-Left",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M15.98 7.5H9.93C9.71 6.64 8.93 6 8 6C6.9 6 6 6.9 6 8C6 8.92 6.63 9.69 7.48 9.92V16C7.48 16.28 7.7 16.5 7.98 16.5H15.98C16.26 16.5 16.48 16.28 16.48 16V8C16.48 7.72 16.26 7.5 15.98 7.5ZM7 8C7 7.45 7.45 7 8 7C8.55 7 9 7.45 9 8C9 8.55 8.55 9 8 9C7.45 9 7 8.55 7 8ZM15.48 15.5H8.48V9.94C9.19 9.76 9.75 9.21 9.93 8.5H15.48V15.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    pos: "TOP_RIGHT",
    title: "Top-Right",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 8C18 6.9 17.1 6 16 6C15.07 6 14.29 6.64 14.07 7.5H8C7.72 7.5 7.5 7.72 7.5 8V16C7.5 16.28 7.72 16.5 8 16.5H16C16.28 16.5 16.5 16.28 16.5 16V9.93C17.36 9.71 18 8.93 18 8ZM8.5 15.5V8.5H14.07C14.25 9.2 14.8 9.75 15.5 9.93V15.5H8.5ZM16 9C15.45 9 15 8.55 15 8C15 7.45 15.45 7 16 7C16.55 7 17 7.45 17 8C17 8.55 16.55 9 16 9Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    pos: "BOTTOM_LEFT",
    title: "Bottom-Left",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M15.98 7.5H7.98C7.7 7.5 7.48 7.72 7.48 8V14.08C6.63 14.31 6 15.08 6 16C6 17.1 6.9 18 8 18C8.93 18 9.71 17.36 9.93 16.5H15.98C16.26 16.5 16.48 16.28 16.48 16V8C16.48 7.72 16.26 7.5 15.98 7.5ZM8 17C7.45 17 7 16.55 7 16C7 15.45 7.45 15 8 15C8.55 15 9 15.45 9 16C9 16.55 8.55 17 8 17ZM15.48 15.5H9.93C9.75 14.79 9.19 14.24 8.48 14.06V8.5H15.48V15.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    pos: "BOTTOM_RIGHT",
    title: "Bottom-Right",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M16.5 14.07V8C16.5 7.72 16.28 7.5 16 7.5H8C7.72 7.5 7.5 7.72 7.5 8V16C7.5 16.28 7.72 16.5 8 16.5H14.07C14.29 17.36 15.07 18 16 18C17.1 18 18 17.1 18 16C18 15.07 17.36 14.29 16.5 14.07ZM14.07 15.5H8.5V8.5H15.5V14.07C14.8 14.25 14.25 14.8 14.07 15.5ZM16 17C15.45 17 15 16.55 15 16C15 15.45 15.45 15 16 15C16.55 15 17 15.45 17 16C17 16.55 16.55 17 16 17Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
] as const;

const BADGE_SHAPES = [
  { id: "Square", label: "Square" },
  { id: "Circle", label: "Circle" },
  { id: "RoundBox", label: "Round" },
] as const;

const COLOR_OPTIONS: { id: BadgeColorMode; label: string }[] = [
  { id: "Style", label: "Style" },
  { id: "White", label: "White" },
  { id: "Black", label: "Black" },
];

/**
 * Step Badges 섹션 - 피그마 UI3 공식 사양
 * 싱글 노드: 1027248:4148 (실시간 반영, 2행)
 * 복수 노드: 1027377:2473 (번호는 선택 노드의 최솟값, 3행 Add Step Badges 버튼)
 */
export function StepBadgesSection() {
  const {
    nodeOptionState,
    setNodeOptionState,
    applyStepBadges,
    removeStepBadgesFromNodes,
    selectedNodes,
    autoResizeWindow,
    multiDraft,
    updateMultiDraft,
    clearMultiDraftKeys,
    formTextDraft,
    setFormTextDraft,
  } = useApp();

  const summary = useSelectionSummary();
  const isMultiMode = summary.isMultiFlowNode;

  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  const userActionLockRef = useRef<number>(0);
  const prevSelectedNodeIdRef = useRef<string | null>(null);
  // Enter 직후 blur 중복 커밋 방지: 마지막 커밋 키 (동일 값 재커밋 스킵)
  const badgeCommitRef = useRef<string | null>(null);

  // 비활성 사유 칩 (클릭 시 잠시 표시)
  const disabledNotice = useDisabledNotice();

  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  // 미확정 입력 텍스트는 AppContext 단일 소유(formTextDraft).
  // controlled input 표시값이자 dirty 감지 원천이다.
  const stepNumText = formTextDraft.stepNum;
  const setStepNumText = (v: string) => setFormTextDraft({ stepNum: v });
  const [isMixed, setIsMixed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isCornerMixed = multiDraft.badgeCorner !== undefined
    ? false
    : (isMultiMode && summary.badgeCorner.isMixed);
  const isShapeMixed = multiDraft.badgeShape !== undefined
    ? false
    : (isMultiMode && summary.badgeShape.isMixed);
  const isColorModeMixed = multiDraft.badgeColorMode !== undefined
    ? false
    : (isMultiMode && summary.badgeColorMode.isMixed);

  const displayStepNum = multiDraft.badgeNumber !== undefined
    ? String(multiDraft.badgeNumber)
    : stepNumText;
  const effectiveIsMixed = multiDraft.badgeNumber !== undefined ? false : isMixed;

  // start number가 정의되어 있는지 여부 (빈 값이 아니고 유효한 숫자)
  const isStartNumberDefined =
    multiDraft.badgeNumber !== undefined
      ? multiDraft.badgeNumber > 0
      : (!effectiveIsMixed && displayStepNum.trim() !== "" && !isNaN(parseInt(displayStepNum, 10)));
  const selectedBadgeCorner = multiDraft.badgeCorner || (isCornerMixed
    ? undefined
    : summary.isMultiFlowNode && summary.badgeCorner.value
      ? summary.badgeCorner.value
      : nodeOptionState.badgeCorner || "TOP_LEFT");
  const selectedBadgeShape = multiDraft.badgeShape || (isShapeMixed
    ? undefined
    : summary.isMultiFlowNode && summary.badgeShape.value
      ? summary.badgeShape.value
      : nodeOptionState.badgeShape || "Square");
  const selectedBadgeColorMode: BadgeColorMode | undefined = multiDraft.badgeColorMode
    ? multiDraft.badgeColorMode
    : isColorModeMixed
      ? undefined
      : summary.isMultiFlowNode && summary.badgeColorMode.value
        ? (summary.badgeColorMode.value as BadgeColorMode)
        : (nodeOptionState.badgeColorMode || "Style");

  // 현재 노드의 배경색 및 보더색 추출 (Style / White 모드 스와치 표시용)
  const firstNode = selectedNodes[0];
  const nodeBgColorHex = firstNode?.fillColorHex || nodeOptionState.fillColor || "#FFFFFF";
  const styleFills = selectedNodes
    .filter((n) => n.isFlowNode && n.fillColorHex)
    .map((n) => n.fillColorHex!.toLowerCase());
  const isStyleColorMixed = isMultiMode && new Set(styleFills).size > 1;
  const hasNodeStroke =
    (firstNode?.strokeWeight || 0) > 0 && !!firstNode?.strokeColorHex;

  // Option Capability Matrix 기반 스위치 상태 산출
  const rawOptionState = React.useMemo(() => {
    if (selectedNodes.length === 0) {
      const creationType = nodeOptionState.nodeType || 'Screen';
      const isAllowed = supportsOption({ flowNodeType: creationType, isFlowNode: true }, 'stepBadge');
      if (!isAllowed) {
        return {
          state: 'OFF' as const,
          supportedCount: 0,
          unsupportedCount: 1,
          supportedNodes: [],
          unsupportedNodes: [],
          checked: false,
          isMixed: false,
          disabled: true,
          isOpen: false,
        };
      }
      const on = Boolean(nodeOptionState.stepBadgesOn);
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
      'stepBadge',
      (n) => n.stepNumber !== undefined && n.stepNumber !== null
    );
  }, [selectedNodes, nodeOptionState.nodeType, nodeOptionState.stepBadgesOn]);

  // Multi Draft 상태 반영
  const isTypeDrafted = multiDraft.nodeType !== undefined;
  const isDraftAllowed = isTypeDrafted
    ? supportsOption({ flowNodeType: multiDraft.nodeType, isFlowNode: true }, 'stepBadge')
    : true;

  const isBadgeOnDrafted = multiDraft.badgeOn !== undefined;
  const effectiveIsOpen = !isDraftAllowed || rawOptionState.disabled
    ? false
    : (isBadgeOnDrafted ? Boolean(multiDraft.badgeOn) : (isOpen !== null ? isOpen : rawOptionState.isOpen));

  const effectiveState = React.useMemo(() => {
    if (selectedNodes.length < 2 && (!isDraftAllowed || rawOptionState.disabled || rawOptionState.state === 'MIXED_DISABLED')) {
      return {
        state: 'OFF' as const,
        checked: false,
        isMixed: false,
        disabled: true,
        isOpen: false,
      };
    }
    if (!isDraftAllowed || rawOptionState.state === 'MIXED_DISABLED') {
      return {
        state: 'MIXED_DISABLED' as const,
        checked: false,
        isMixed: true,
        disabled: true,
        isOpen: false,
      };
    }
    if (isBadgeOnDrafted) {
      const on = Boolean(multiDraft.badgeOn);
      return {
        state: (on ? 'ON' : 'OFF') as OptionSwitchState,
        checked: on,
        isMixed: false,
        disabled: false,
        isOpen: on,
      };
    }
    if (isOpen !== null) {
      return {
        state: (isOpen ? 'ON' : 'OFF') as OptionSwitchState,
        checked: isOpen,
        isMixed: false,
        disabled: rawOptionState.disabled,
        isOpen: isOpen,
      };
    }
    return {
      state: rawOptionState.state,
      checked: rawOptionState.checked,
      isMixed: rawOptionState.isMixed,
      disabled: rawOptionState.disabled,
      isOpen: effectiveIsOpen,
    };
  }, [selectedNodes.length, isDraftAllowed, rawOptionState, isBadgeOnDrafted, multiDraft.badgeOn, effectiveIsOpen]);

  const isSectionOpen = effectiveState.isOpen;

  // 선택된 노드의 상태 동기화 (사용자 조작 직후 600ms 동안은 중간 응답 덮어쓰기 방지)
  useEffect(() => {
    const currentNodeId =
      selectedNodes.length === 1
        ? selectedNodes[0]?.id
        : selectedNodes.length > 1
          ? "MULTI"
          : null;
    const isDifferentNode = currentNodeId !== prevSelectedNodeIdRef.current;
    prevSelectedNodeIdRef.current = currentNodeId;

    if (isDifferentNode) {
      setIsOpen(null);
      badgeCommitRef.current = null; // 선택 변경 시 커밋 가드 리셋
    }

    if (selectedNodes.length === 0) {
      setIsMixed(false);
      const cachedStep = nodeOptionState.stepNumber;
      setStepNumText(
        typeof cachedStep === "number" && cachedStep > 0 && !isNaN(cachedStep)
          ? String(cachedStep)
          : "1"
      );
    } else if (isDifferentNode) {
      if (rawOptionState.supportedCount > 0) {
        const supported = rawOptionState.supportedNodes;
        if (supported.length === 1) {
          setIsMixed(false);
          const node = supported[0];
          if (typeof node.stepNumber === "number" && !isNaN(node.stepNumber)) {
            setStepNumText(String(node.stepNumber));
          } else {
            setStepNumText("1");
          }
        } else if (supported.length > 1) {
          const validNums = supported
            .map((n) => n.stepNumber)
            .filter((n): n is number => typeof n === "number" && !isNaN(n) && n > 0);

          if (validNums.length === 0) {
            setIsMixed(false);
            setStepNumText("1");
          } else {
            // 서로 달라도 Mixed 대신 최솟값. 한 번만 있는 번호도 포함한다.
            setIsMixed(false);
            setStepNumText(String(Math.min(...validNums)));
          }
        }
      } else {
        setIsMixed(false);
      }
    }
  }, [
    rawOptionState,
    selectedNodes,
    nodeOptionState.stepNumber,
  ]);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setColorDropdownOpen(false);
      }
    }
    if (colorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [colorDropdownOpen]);

  function getNumberValue(): number {
    const raw = multiDraft.badgeNumber !== undefined
      ? String(multiDraft.badgeNumber)
      : (displayStepNum || stepNumText);
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }

  function handleToggle(checked: boolean) {
    if (effectiveState.disabled) return;
    userActionLockRef.current = Date.now();
    setIsOpen(checked);

    if (selectedNodes.length >= 2) {
      updateMultiDraft({
        badgeOn: checked,
        badgeNumber: checked ? getNumberValue() : undefined,
        badgeCorner: checked ? (selectedBadgeCorner as BadgePosition) : undefined,
        badgeShape: checked ? (selectedBadgeShape as BadgeShape) : undefined,
        badgeColorMode: checked ? selectedBadgeColorMode : undefined,
      });
      requestAnimationFrame(() => {
        autoResizeWindow();
      });
      return;
    }

    if (selectedNodes.length === 1 && !supportsOption(selectedNodes[0], 'stepBadge')) {
      return;
    }

    setNodeOptionState({ stepBadgesOn: checked });
    if (checked) {
      applyStepBadges(
        getNumberValue(),
        selectedBadgeCorner,
        selectedBadgeShape,
        selectedBadgeColorMode,
      );
    } else {
      removeStepBadgesFromNodes();
    }
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }

  function handleCornerSelect(pos: string) {
    setNodeOptionState({ badgeCorner: pos });
    if (selectedNodes.length >= 2) {
      updateMultiDraft({ badgeCorner: pos as BadgePosition });
      return;
    }
    if (isSectionOpen && !isMultiMode) {
      applyStepBadges(
        getNumberValue(),
        pos,
        selectedBadgeShape,
        selectedBadgeColorMode,
      );
    }
  }

  function handleShapeSelect(shape: string) {
    setNodeOptionState({ badgeShape: shape });
    if (selectedNodes.length >= 2) {
      updateMultiDraft({ badgeShape: shape as BadgeShape });
      return;
    }
    if (isSectionOpen && !isMultiMode) {
      applyStepBadges(
        getNumberValue(),
        selectedBadgeCorner,
        shape,
        selectedBadgeColorMode,
      );
    }
  }

  function handleColorSelect(mode: BadgeColorMode) {
    setNodeOptionState({ badgeColorMode: mode });
    setColorDropdownOpen(false);
    if (selectedNodes.length >= 2) {
      updateMultiDraft({ badgeColorMode: mode });
      return;
    }
    if (isSectionOpen && !isMultiMode) {
      applyStepBadges(
        getNumberValue(),
        selectedBadgeCorner,
        selectedBadgeShape,
        mode,
      );
    }
  }

  function handleNumberBlurOrEnter() {
    userActionLockRef.current = Date.now();
    if (selectedNodes.length >= 2) {
      if (stepNumText === "") {
        clearMultiDraftKeys(["badgeNumber"]);
        const supported = rawOptionState.supportedNodes;
        const validNums = supported
          .map((n) => n.stepNumber)
          .filter((n): n is number => typeof n === "number" && !isNaN(n) && n > 0);
        if (validNums.length === 0) {
          setStepNumText("1");
          setIsMixed(false);
        } else {
          setStepNumText(String(Math.min(...validNums)));
          setIsMixed(false);
        }
        return;
      }
      const parsed = parseInt(stepNumText, 10);
      const val = isNaN(parsed) || parsed < 1 ? 1 : parsed;
      const badgeKey = `MULTI:${val}:${selectedBadgeCorner}:${selectedBadgeShape}:${selectedBadgeColorMode}`;
      if (badgeCommitRef.current === badgeKey) return; // Enter 직후 blur 중복 방지
      badgeCommitRef.current = badgeKey;
      setIsMixed(false);
      setStepNumText(String(val));
      updateMultiDraft({ badgeNumber: val });
      return;
    }
    setIsMixed(false);
    const val = getNumberValue();
    const singleId = selectedNodes[0]?.id || "NONE";
    const singleKey = `${singleId}:${val}:${selectedBadgeCorner}:${selectedBadgeShape}:${selectedBadgeColorMode}`;
    if (badgeCommitRef.current === singleKey) return; // Enter 직후 blur 중복 방지
    badgeCommitRef.current = singleKey;
    setStepNumText(String(val));
    setNodeOptionState({ stepNumber: val });
    if (isSectionOpen && !isMultiMode) {
      applyStepBadges(
        val,
        selectedBadgeCorner,
        selectedBadgeShape,
        selectedBadgeColorMode,
      );
    }
  }

  // 스텝 배지 기본값(1) 리셋 핸들러
  function handleResetNumber() {
    setIsMixed(false);
    setStepNumText("1");
    if (selectedNodes.length >= 2) {
      updateMultiDraft({ badgeNumber: 1 });
      const input = document.getElementById(
        "input-step-number",
      ) as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }
    setNodeOptionState({ stepNumber: 1 });
    if (isSectionOpen && !isMultiMode) {
      applyStepBadges(
        1,
        selectedBadgeCorner,
        selectedBadgeShape,
        selectedBadgeColorMode,
      );
    }
    const input = document.getElementById(
      "input-step-number",
    ) as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  }

  // 복수 선택 시 하단 보라색 버튼 클릭: 순차 부여 (Step Badge 전용 즉시 실행 shortcut)
  function handleAddStepBadgesMulti() {
    const start = getNumberValue();
    const corner = (selectedBadgeCorner || 'TOP_LEFT') as BadgePosition;
    const shape = (selectedBadgeShape || 'Square') as BadgeShape;
    // Mixed면 색을 보내지 않아 노드마다 기존 컬러를 유지한다. 고른 색만 공통 적용한다.
    const colorMode = selectedBadgeColorMode;

    applyStepBadges(start, corner, shape, colorMode);

    setIsOpen(true);
    setNodeOptionState({
      stepBadgesOn: true,
      stepNumber: start,
      badgeCorner: corner,
      badgeShape: shape,
      ...(colorMode ? { badgeColorMode: colorMode } : {}),
    });

    // 3. multiDraft에서 step badge 관련 키만 정리하여 향후 'Apply to All' 실행 시 타 속성과 엉키지 않도록 함
    clearMultiDraftKeys(['badgeOn', 'badgeNumber', 'badgeCorner', 'badgeShape', 'badgeColorMode']);
  }

  // Mixed 컬러칩: 다른 옵션과 같은 14px 칩 안에 '-'만 표시
  function renderMixedColorChip(size = 14) {
    return (
      <span
        className="figma-color-chip"
        style={{
          width: size,
          height: size,
          borderRadius: 2,
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "inset 0 0 0 1px var(--color-chip-border)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            width: Math.max(6, size - 6),
            height: 1.5,
            borderRadius: 1,
            backgroundColor: "currentColor",
            flexShrink: 0,
          }}
        />
      </span>
    );
  }

  // 컬러 스와치 렌더러 (피그마 UI3 공식 표준 컬러칩 규격: 14x14, R:2px)
  function renderColorSwatch(mode: BadgeColorMode, size = 14) {
    if (mode === "White") {
      return (
        <span
          className="figma-color-chip"
          style={{
            width: size,
            height: size,
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
            border: "none",
            boxShadow: "inset 0 0 0 1px var(--color-chip-border)",
            display: "inline-block",
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        />
      );
    }
    if (mode === "Black") {
      return (
        <span
          className="figma-color-chip"
          style={{
            width: size,
            height: size,
            borderRadius: 2,
            backgroundColor: "#18181B",
            border: "none",
            boxShadow: "inset 0 0 0 1px var(--color-chip-border)",
            display: "inline-block",
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        />
      );
    }
    // Style: 노드마다 스타일 색이 다르면 한 색으로 통일되는 것처럼 보이지 않게 '-'만 표시
    if (isStyleColorMixed || isColorModeMixed) {
      return renderMixedColorChip(size);
    }
    // 스타일 색이 하나일 때만 그 색을 칩에 반영
    return (
      <span
        className="figma-color-chip"
        style={{
          width: size,
          height: size,
          borderRadius: 2,
          backgroundColor: nodeBgColorHex,
          border: hasNodeStroke
            ? `${Math.min(firstNode?.strokeWeight || 1, 2)}px solid ${firstNode?.strokeColorHex}`
            : "none",
          boxShadow: hasNodeStroke
            ? undefined
            : "inset 0 0 0 1px var(--color-chip-border)",
          display: "inline-block",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      />
    );
  }

  return (
    <div
      className="section-block step-badges-section"
      style={{ paddingBottom: effectiveState.isOpen ? "12px" : "0px" }}
      onClick={effectiveState.disabled ? () => disabledNotice.flash() : undefined}
    >
      {/* 상단 헤더: Step Badges + 보라색 토글 스위치 */}
      <div className="section-header toggle-row">
        <span className={`section-title${effectiveState.disabled ? " disabled" : ""}`}>
          Step Badges
          {effectiveState.disabled && disabledNotice.phase !== 'hidden' && (
            <DisabledNoticeChip
              text={t(effectiveState.isMixed ? 'noticeMixed' : 'noticeStepUnsupported')}
              fading={disabledNotice.phase === 'fading'}
            />
          )}
        </span>
        <Switch
          id="toggle-step-badges"
          checked={effectiveState.checked}
          isMixed={effectiveState.isMixed}
          disabled={effectiveState.disabled}
          onChange={handleToggle}
        />
      </div>

      {effectiveState.isOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "10px",
          }}
        >
          {/* Row 1: [#] [숫자 or Mixed] (w: 100) + 코너 위치 4버튼 (w: 220) */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* 좌측 Numeric Input */}
            <div
              data-tooltip={
                isMultiMode ? t('tipStepStartNumber') : t('tipStepNumber')
              }
              style={{
                width: "100px",
                height: "28px",
                backgroundColor: "var(--color-bg-secondary)",
                borderRadius: "6px",
                padding: "0 6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexShrink: 0,
                boxSizing: "border-box",
              }}
            >
              <svg
                id="step-number-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "var(--color-text-primary, #111827)", flexShrink: 0, cursor: "pointer" }}
                onClick={handleResetNumber}
              >
                <path
                  d="M16 18C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16ZM8 17C7.44772 17 7 16.5523 7 16V8C7 7.44772 7.44772 7 8 7H16C16.5523 7 17 7.44772 17 8V16C17 16.5523 16.5523 17 16 17H8ZM10.4502 14.9971C10.7249 15.0245 10.9695 14.8245 10.9971 14.5498L11.0518 14H12.5479L12.5029 14.4502C12.4755 14.7249 12.6755 14.9695 12.9502 14.9971C13.2249 15.0245 13.4695 14.8245 13.4971 14.5498L13.5518 14H14.5C14.7761 14 15 13.7761 15 13.5C15 13.2239 14.7761 13 14.5 13H13.6523L13.8525 11H14.5C14.7761 11 15 10.7761 15 10.5C15 10.2239 14.7761 10 14.5 10H13.9521L13.9971 9.5498C14.0245 9.27507 13.8245 9.03045 13.5498 9.00293C13.2751 8.97546 13.0305 9.17547 13.0029 9.4502L12.9482 10H11.4521L11.4971 9.5498C11.5245 9.27507 11.3245 9.03045 11.0498 9.00293C10.7751 8.97546 10.5305 9.17547 10.5029 9.4502L10.4482 10H9.5C9.22386 10 9 10.2239 9 10.5C9 10.7761 9.22386 11 9.5 11H10.3477L10.1475 13H9.5C9.22386 13 9 13.2239 9 13.5C9 13.7761 9.22386 14 9.5 14H10.0479L10.0029 14.4502C9.97546 14.7249 10.1755 14.9695 10.4502 14.9971ZM11.1523 13L11.3525 11H12.8477L12.6475 13H11.1523Z"
                  fill="currentColor"
                />
              </svg>
              <input
                type="text"
                id="input-step-number"
                value={effectiveIsMixed ? "" : displayStepNum}
                placeholder={effectiveIsMixed ? "Mixed" : "1"}
                onChange={(e) => {
                  userActionLockRef.current = Date.now();
                  const clean = e.target.value.replace(/[^0-9]/g, "");
                  setStepNumText(clean);
                  if (selectedNodes.length >= 2) {
                    if (clean !== "") {
                      const parsed = parseInt(clean, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        setIsMixed(false);
                        updateMultiDraft({ badgeNumber: parsed });
                      }
                    } else {
                      clearMultiDraftKeys(["badgeNumber"]);
                    }
                  } else {
                    setIsMixed(false);
                    if (clean !== "") {
                      const parsed = parseInt(clean, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        setNodeOptionState({ stepNumber: parsed });
                      }
                    }
                  }
                }}
                onBlur={handleNumberBlurOrEnter}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNumberBlurOrEnter();
                  }
                }}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "11px",
                  fontWeight: "var(--font-weight-default, 450)",
                  color: "var(--color-text-primary, #111827)",
                  padding: 0,
                }}
              />
            </div>

            {/* 우측 Corner Position Controls (4버튼) */}
            <div className="corner-position-group">
              {BADGE_CORNERS.map((c) => {
                const active = selectedBadgeCorner === c.pos;
                return (
                  <button
                    key={c.pos}
                    type="button"
                    data-tooltip={t(c.pos === 'TOP_LEFT' ? 'tipCornerTL' : c.pos === 'TOP_RIGHT' ? 'tipCornerTR' : c.pos === 'BOTTOM_LEFT' ? 'tipCornerBL' : 'tipCornerBR')}
                    onClick={() => handleCornerSelect(c.pos)}
                    className={`corner-btn${active ? " active" : ""}`}
                  >
                    {c.svg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: 컬러 드롭다운 (w: 100) + 셰이프 선택 (Square, Circle, Round) */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* 좌측 Color Dropdown (피그마 기본 표준 드롭다운 컴포넌트) */}
            <div
              ref={dropdownRef}
              className="figma-dropdown-wrapper"
              style={{ width: "100px", flexShrink: 0 }}
            >
              <button
                type="button"
                className={`figma-dropdown-btn${colorDropdownOpen ? " active" : ""}`}
                onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
              >
                <div className="figma-dropdown-btn-content">
                  <span className="figma-dropdown-current-icon">
                    {selectedBadgeColorMode ? (
                      renderColorSwatch(selectedBadgeColorMode, 14)
                    ) : (
                      renderMixedColorChip(14)
                    )}
                  </span>
                  <span className="figma-dropdown-current-text">
                    {selectedBadgeColorMode === "Style" && isStyleColorMixed
                      ? "Mixed"
                      : (selectedBadgeColorMode || "Mixed")}
                  </span>
                </div>
                <svg
                  className="figma-dropdown-chevron-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: colorDropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <path
                    d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {/* 피그마 기본 스타일의 드롭다운 메뉴 */}
              {colorDropdownOpen && (
                <div
                  className="figma-dropdown-menu active"
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 4px)",
                    top: "auto",
                    left: 0,
                    right: "auto",
                    width: 180,
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 1050,
                  }}
                >
                  {COLOR_OPTIONS.map((opt) => {
                    const active = selectedBadgeColorMode === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`figma-dropdown-item${active ? " selected" : ""}`}
                        style={{ width: "100%", cursor: "pointer" }}
                        onClick={() => handleColorSelect(opt.id)}
                      >
                        {/* 선두 체크 슬롯 (선택된 항목일 때 체크 아이콘 16x16) */}
                        <span className="figma-dropdown-check-slot">
                          {active && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </span>
                        {/* 스와치 (24x24 슬롯 내 14px 표준 칩 중앙 정렬) */}
                        <span className="figma-dropdown-icon-slot">
                          {renderColorSwatch(opt.id, 14)}
                        </span>
                        {/* 라벨 */}
                        <span
                          className="figma-dropdown-label"
                          style={{
                            fontSize: "11px",
                            fontWeight: active ? 600 : 500,
                          }}
                        >
                          {opt.id === "Style" && (isStyleColorMixed || isColorModeMixed) ? "Mixed" : opt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 우측 Shape Segmented Controls (Square, Circle, Round) */}
            <div className="shape-segment-group">
              {BADGE_SHAPES.map((s) => {
                const active = selectedBadgeShape === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleShapeSelect(s.id)}
                    className={`shape-btn${active ? " active" : ""}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3 (복수 노드 선택 시 표시): 좌측 설명 문구 + 우측 24px 디폴트 버튼 사이즈 [✨ Add Step Badges] */}
          {isMultiMode && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginTop: "4px",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  lineHeight: "1.3",
                  color: "var(--color-text-secondary, #6B7280)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={t('stepDescStartsFromNumber')}
              >
                {t('stepDescStartsFromNumber')}
              </span>
              <button
                type="button"
                className="btn-add-step-badges"
                disabled={!isStartNumberDefined}
                onClick={handleAddStepBadgesMulti}
                title={
                  !isStartNumberDefined
                    ? t('stepTipEnterStartNumber')
                    : t('stepTipAddStepBadges')
                }
              >
                {/* 반짝이/별 아이콘 */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12.5 11L13.25 12.5L14.75 13.25L13.25 14L12.5 15.5L11.75 14L10.25 13.25L11.75 12.5L12.5 11Z"
                    fill="currentColor"
                  />
                </svg>
                <span>Add Step Badges</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
