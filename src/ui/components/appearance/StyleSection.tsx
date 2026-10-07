import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp, StylePreset } from "../../context/AppContext";
import { useSelectionSummary } from "../../hooks/useSelectionSummary";
import { StrokeColorIcon, FillColorIcon } from "../shared/icons";
import { t } from "../../../i18n";
import { normalizeNodeType, normalizeBranchVariant, branchVariantUsesStroke } from "../../../domain/nodeDomain";

/**
 * 기본 스타일 프리셋 ID 목록 (첫 번째: 흰색 + 1.5px 블랙 보더, 두 번째: 블랙 + 0px 보더)
 * 기본 스타일은 수정 및 삭제가 불가능하여 More(···) 버튼이 비활성화됩니다.
 */
const DEFAULT_STYLE_PRESET_IDS = new Set(["style-white", "style-black"]);

/**
 * 색상 HEX 문자열 정규화 (소문자, 3자리 확장)
 */
function normalizeColorHex(hex?: string): string {
  if (!hex) return "";
  const clean = hex.trim().toLowerCase();
  if (clean.length === 4 && clean.startsWith("#")) {
    return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return clean;
}

/**
 * 피그마 UI3 공식 24×24px 컬러 팔레트 SVG 아이콘
 */
const PALETTE_ICON_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.04976 7.04976C9.78343 4.31609 14.2165 4.31609 16.9502 7.04976C18.1125 8.2121 18.7807 9.685 18.9541 11.2011C19.1539 12.9507 17.5939 14 16.2246 14H15C14.4477 14 14 14.4477 14 15V16.2246C14 17.594 12.9499 19.1542 11.2002 18.9541C9.68423 18.7806 8.21195 18.1123 7.04976 16.9502C4.31609 14.2165 4.31609 9.78343 7.04976 7.04976ZM16.2421 7.75777C13.899 5.41463 10.1009 5.41463 7.75777 7.75777C5.41463 10.1009 5.41463 13.899 7.75777 16.2421C8.75465 17.239 10.0147 17.8122 11.3144 17.9609C12.2846 18.0718 13 17.2011 13 16.2246V15C13 13.8954 13.8954 13 15 13H16.2246C17.2011 13 18.0718 12.2846 17.9609 11.3144C17.8123 10.0147 17.239 8.75467 16.2421 7.75777ZM13 8.00003C13 8.55232 12.5523 9.00003 12 9.00003C11.4477 9.00003 11 8.55232 11 8.00003C11 7.44775 11.4477 7.00003 12 7.00003C12.5523 7.00003 13 7.44775 13 8.00003ZM9.86617 10.5002C10.1423 10.0219 9.97843 9.41032 9.50014 9.13417C9.02185 8.85803 8.41026 9.02191 8.13411 9.5002C7.85797 9.97849 8.02185 10.5901 8.50014 10.8662C8.97843 11.1424 9.59002 10.9785 9.86617 10.5002ZM15.5001 10.8662C15.0218 11.1424 14.4103 10.9785 14.1341 10.5002C13.858 10.0219 14.0218 9.41032 14.5001 9.13417C14.9784 8.85803 15.59 9.02191 15.8662 9.5002C16.1423 9.97849 15.9784 10.5901 15.5001 10.8662ZM8.13411 14.5002C8.41026 14.9785 9.02185 15.1424 9.50014 14.8662C9.97843 14.5901 10.1423 13.9785 9.86617 13.5002C9.59002 13.0219 8.97843 12.858 8.50014 13.1342C8.02185 13.4103 7.85797 14.0219 8.13411 14.5002Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * 피그마 UI3 공식 24×24px 3선 스트로크 두께 SVG 아이콘
 */
const STROKE_WEIGHT_ICON_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M17.25 14C17.6642 14 18 14.3358 18 14.75V17.25C18 17.6642 17.6642 18 17.25 18H6.75C6.33579 18 6 17.6642 6 17.25V14.75C6 14.3358 6.33579 14 6.75 14H17.25ZM7 17H17V15H7V17ZM17.25 9C17.6642 9 18 9.33579 18 9.75V11.25C18 11.6642 17.6642 12 17.25 12H6.75C6.33579 12 6 11.6642 6 11.25V9.75C6 9.33579 6.33579 9 6.75 9H17.25ZM7 11H17V10H7V11ZM17.5 6C17.7761 6 18 6.22386 18 6.5C18 6.77614 17.7761 7 17.5 7H6.5C6.22386 7 6 6.77614 6 6.5C6 6.22386 6.22386 6 6.5 6H17.5Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Style 섹션 - UI3 디자인 시스템 기준 컨트롤 행 + 컬러/보더 스타일 카드 그리드
 * 상단: Fill Color 인풋박스 + Stroke Color 인풋박스 + Stroke Weight 인풋박스
 * 하단: 스타일 스와치 그리드
 */
export function StyleSection() {
  const {
    uiState,
    setUIState,
    nodeOptionState,
    setNodeOptionState,
    applyCurrentNodeState,
    stylePresets,
    selectedStylePresetId,
    setSelectedStylePresetId,
    setActiveModal,
    contextMenuOpen,
    setContextMenuOpen,
    contextMenuTarget,
    setContextMenuTarget,
    setContextMenuPos,
    closeAllPopovers,
    selectedNodes,
    multiDraft,
    updateMultiDraft,
  } = useApp();

  const summary = useSelectionSummary();
  const btnMoreRef = useRef<HTMLButtonElement>(null);

  // Mixed 상태 판별 (Draft가 있으면 Draft 우선이므로 Mixed 해제)
  // 노드+커넥터 혼합 선택도 플로우 노드 기준으로 판정한다
  const isMultiForStyle = summary.isMultiFlowNode || summary.isMixedWithConnectors;
  const isFillMixed = multiDraft.colorHex !== undefined
    ? false
    : (isMultiForStyle ? summary.color.isMixed : false);
  const isStrokeMixed = multiDraft.strokeColor !== undefined
    ? false
    : (isMultiForStyle ? summary.strokeColor.isMixed : false);
  const isWeightMixed = multiDraft.strokeWeight !== undefined
    ? false
    : (isMultiForStyle ? summary.strokeWeight.isMixed : false);

  // 유효한 현재 색상 및 두께 계산
  const effectiveFillColor =
    multiDraft.colorHex !== undefined
      ? multiDraft.colorHex
      : ((isMultiForStyle
          ? summary.color.value
          : summary.isSingleFlowNode
            ? (nodeOptionState.fillColor || summary.color.value)
            : nodeOptionState.fillColor) ||
        nodeOptionState.fillColor ||
        "#FFFFFF");

  const effectiveStrokeColor =
    multiDraft.strokeColor !== undefined
      ? multiDraft.strokeColor
      : ((isMultiForStyle
          ? summary.strokeColor.value
          : summary.isSingleFlowNode
            ? (nodeOptionState.strokeColor || summary.strokeColor.value)
            : nodeOptionState.strokeColor) ||
        nodeOptionState.strokeColor ||
        "#000000");

  const rawWeight = isMultiForStyle
    ? summary.strokeWeight.value
    : summary.isSingleFlowNode
      ? (typeof nodeOptionState.strokeWeight === "number"
          ? nodeOptionState.strokeWeight
          : summary.strokeWeight.value)
      : nodeOptionState.strokeWeight;
  const effectiveStrokeWeight =
    multiDraft.strokeWeight !== undefined
      ? multiDraft.strokeWeight
      : (typeof rawWeight === "number"
          ? rawWeight
          : typeof nodeOptionState.strokeWeight === "number"
            ? nodeOptionState.strokeWeight
            : 1.5);

  // 보더 미적용(None) 상태 판별 (두께가 0이거나 색상이 비어있는 경우)
  const isStrokeNone =
    !isStrokeMixed &&
    (effectiveStrokeWeight === 0 ||
      !effectiveStrokeColor ||
      effectiveStrokeColor.toLowerCase() === "none");

  // 배경 미적용(None/투명) 상태 판별
  const isFillNone =
    !isFillMixed &&
    (effectiveFillColor.toLowerCase() === "none" ||
      effectiveFillColor.toLowerCase() === "transparent");

  // 직전 유효 컬러 기억 (투명 해제 시 복원용)
  const lastValidFillRef = useRef<string>("#FFFFFF");
  useEffect(() => {
    if (
      effectiveFillColor &&
      !["none", "transparent"].includes(effectiveFillColor.toLowerCase())
    ) {
      lastValidFillRef.current = effectiveFillColor;
    }
  }, [effectiveFillColor]);

  // 로컬 텍스트 입력 상태
  const [fillInput, setFillInput] = useState("");
  const [strokeInput, setStrokeInput] = useState("");
  const [weightInput, setWeightInput] = useState("");

  // Enter 직후 blur 중복 적용 방지: 마지막 적용 키 (동일 값 재적용 스킵)
  const styleCommitRef = useRef<string | null>(null);
  const styleScopeId =
    selectedNodes.length === 1
      ? selectedNodes[0]?.id || "NONE"
      : selectedNodes.length > 1
        ? "MULTI"
        : "NONE";
  const prevStyleScopeRef = useRef(styleScopeId);
  // 선택 변경 시 커밋 가드 리셋 (동일 값이라도 새 선택에는 적용되어야 함)
  useEffect(() => {
    if (prevStyleScopeRef.current !== styleScopeId) {
      prevStyleScopeRef.current = styleScopeId;
      styleCommitRef.current = null;
    }
  }, [styleScopeId]);

  // 외부 선택 변경 또는 상태 변경 시 로컬 인풋 동기화
  useEffect(() => {
    if (isFillMixed) {
      setFillInput("");
    } else if (isFillNone) {
      setFillInput("None");
    } else {
      setFillInput(effectiveFillColor.replace("#", "").toUpperCase());
    }
  }, [isFillMixed, isFillNone, effectiveFillColor]);

  useEffect(() => {
    if (isStrokeMixed) {
      setStrokeInput("");
    } else if (isStrokeNone) {
      setStrokeInput("None");
    } else {
      setStrokeInput(effectiveStrokeColor.replace("#", "").toUpperCase());
    }
  }, [isStrokeMixed, isStrokeNone, effectiveStrokeColor]);

  useEffect(() => {
    if (isWeightMixed) {
      setWeightInput("");
    } else {
      setWeightInput(String(effectiveStrokeWeight));
    }
  }, [isWeightMixed, effectiveStrokeWeight]);

  // 드래프트 상태 판별 (복수 선택 시 사용자가 새 스타일을 선택했는지 여부)
  const isStyleDrafted =
    multiDraft.colorHex !== undefined ||
    multiDraft.strokeWeight !== undefined ||
    multiDraft.strokeColor !== undefined;

  // 선택된 노드 중 Shape 노드(Screen이 아닌 도형) 포함 여부 판별
  const hasShapeNode = selectedNodes.some(
    (n) =>
      normalizeNodeType(
        n?.flowNodeType ||
          (n?.nodeType === "FRAME" ? "Screen" : n?.nodeType),
      ) !== "Screen",
  );

  // Branch CHECK/CROSS 등 보더 미사용 변형만 선택된 경우 스트로크 컨트롤 비활성.
  // 하나라도 보더 사용 노드가 섞여 있으면 활성 유지한다.
  const isStrokeApplicable = (() => {
    const flows = selectedNodes.filter((n) => n && n.isFlowNode);
    if (flows.length === 0) return true;
    return flows.some((n) => {
      const nodeType = normalizeNodeType(
        n?.flowNodeType || (n?.nodeType === "FRAME" ? "Screen" : n?.nodeType),
      );
      if (nodeType !== "Branch") return true;
      return branchVariantUsesStroke(normalizeBranchVariant(n?.branchVariant));
    });
  })();

  // 다중 노드 선택 시 전체 스타일 Mixed 여부 판별
  // 사용자가 새 스타일을 드래프트 선택한 경우에는 Mixed가 해제됨
  const isNodeColorMixed =
    !isStyleDrafted &&
    (summary.isMultiFlowNode || summary.isMixedWithConnectors) &&
    (summary.color.isMixed ||
      (!hasShapeNode &&
        (summary.strokeWeight.isMixed || summary.strokeColor.isMixed)));

  // 현재 선택된 컬러 및 보더와 일치하는 프리셋 탐색
  const activeStylePreset = isNodeColorMixed
    ? undefined
    : stylePresets.find((p) => {
        const pFill = normalizeColorHex(p.fillColor);
        const effFill = normalizeColorHex(effectiveFillColor);
        if (pFill !== effFill) return false;

        // Shape 노드가 포함되어 있거나 단일 Shape 노드인 경우
        if (hasShapeNode) {
          if (p.strokeWeight === effectiveStrokeWeight) return true;
          // 검은색/흰색 등 기본 프리셋은 Shape의 stroke 차이와 무관하게 Fill 색상 일치 시 매칭
          if (pFill === "#000000" || pFill === "#ffffff") {
            return true;
          }
        }

        if (p.strokeWeight !== effectiveStrokeWeight) return false;
        if (p.strokeWeight > 0) {
          if (
            normalizeColorHex(p.strokeColor) !==
            normalizeColorHex(effectiveStrokeColor)
          ) {
            return false;
          }
        }
        return true;
      });

  // 기본 스타일이거나 일치하는 프리셋이 없으면 수정/삭제 불가 (모어 버튼 비활성화)
  const isMoreDisabled =
    !activeStylePreset ||
    Boolean(activeStylePreset.isDefault) ||
    DEFAULT_STYLE_PRESET_IDS.has(activeStylePreset.id);

  // ---- 색상 및 두께 변경 액션 ----

  const applyFillColor = useCallback(
    (newColorHex: string) => {
      const formatted = newColorHex.startsWith("#")
        ? newColorHex
        : `#${newColorHex}`;
      const styleKey = `${styleScopeId}:fill:${formatted.toUpperCase()}`;
      if (styleCommitRef.current === styleKey) return;
      styleCommitRef.current = styleKey;
      setSelectedStylePresetId(null);
      if (selectedNodes.length >= 2) {
        updateMultiDraft({ colorHex: formatted });
        return;
      }
      setNodeOptionState({ fillColor: formatted });
      applyCurrentNodeState(undefined, { colorHex: formatted });
    },
    [selectedNodes, updateMultiDraft, setSelectedStylePresetId, setNodeOptionState, applyCurrentNodeState],
  );

  const applyFillNone = useCallback(() => {
    const styleKey = `${styleScopeId}:fill:None`;
    if (styleCommitRef.current === styleKey) return;
    styleCommitRef.current = styleKey;
    setSelectedStylePresetId(null);
    if (selectedNodes.length >= 2) {
      updateMultiDraft({ colorHex: "None" });
      return;
    }
    setNodeOptionState({ fillColor: "None" });
    applyCurrentNodeState(undefined, { colorHex: "None" });
  }, [selectedNodes, updateMultiDraft, setSelectedStylePresetId, setNodeOptionState, applyCurrentNodeState]);

  // Fill 칩 클릭 핸들러 (클릭 시 배경 끄기/None 토글)
  const handleFillChipClick = () => {
    if (isFillNone) {
      const restoreColor =
        lastValidFillRef.current &&
        !["none", "transparent"].includes(
          lastValidFillRef.current.toLowerCase(),
        )
          ? lastValidFillRef.current
          : "#FFFFFF";
      applyFillColor(restoreColor);
    } else {
      applyFillNone();
    }
  };

  const applyStrokeNone = useCallback(() => {
    const styleKey = `${styleScopeId}:stroke:none`;
    if (styleCommitRef.current === styleKey) return;
    styleCommitRef.current = styleKey;
    setSelectedStylePresetId(null);
    if (selectedNodes.length >= 2) {
      // 복수 선택: 색상 draft도 함께 'None'으로 기록한다.
      // weight만 기록하면 strokeColor Mixed가 남아 isStrokeMixed=true가 되어
      // isStrokeNone이 false로 막히고 칩이 / 아이콘으로 바뀌지 않는다.
      updateMultiDraft({ strokeColor: "None", strokeWeight: 0 });
      return;
    }
    setNodeOptionState({ strokeWeight: 0 });
    applyCurrentNodeState(undefined, { strokeWeight: 0 });
  }, [selectedNodes, updateMultiDraft, setSelectedStylePresetId, setNodeOptionState, applyCurrentNodeState]);

  const applyStrokeColor = useCallback(
    (newStrokeHex: string, explicitWeight?: number) => {
      const formatted = newStrokeHex.startsWith("#")
        ? newStrokeHex
        : `#${newStrokeHex}`;
      const targetWeight =
        explicitWeight !== undefined
          ? explicitWeight
          : effectiveStrokeWeight > 0
            ? effectiveStrokeWeight
            : 1.5;
      const styleKey = `${styleScopeId}:stroke:${formatted.toUpperCase()}:${targetWeight}`;
      if (styleCommitRef.current === styleKey) return;
      styleCommitRef.current = styleKey;
      setSelectedStylePresetId(null);
      if (selectedNodes.length >= 2) {
        updateMultiDraft({ strokeColor: formatted, strokeWeight: targetWeight });
        return;
      }
      setNodeOptionState({
        strokeColor: formatted,
        strokeWeight: targetWeight,
      });
      applyCurrentNodeState(undefined, {
        strokeColor: formatted,
        strokeWeight: targetWeight,
      });
    },
    [
      selectedNodes,
      updateMultiDraft,
      setSelectedStylePresetId,
      effectiveStrokeWeight,
      setNodeOptionState,
      applyCurrentNodeState,
    ],
  );

  const applyStrokeWeight = useCallback(
    (newWeight: number) => {
      const validWeight = Math.max(0, Math.round(newWeight * 10) / 10);
      const styleKey = `${styleScopeId}:strokeWeight:${validWeight}`;
      if (styleCommitRef.current === styleKey) return;
      styleCommitRef.current = styleKey;
      setSelectedStylePresetId(null);
      if (selectedNodes.length >= 2) {
        updateMultiDraft({ strokeWeight: validWeight });
        return;
      }
      setNodeOptionState({ strokeWeight: validWeight });
      applyCurrentNodeState(undefined, { strokeWeight: validWeight });
    },
    [selectedNodes, updateMultiDraft, setSelectedStylePresetId, setNodeOptionState, applyCurrentNodeState],
  );

  // 보더 아이콘 클릭 핸들러 (클릭 시 보더 끄기/None 토글)
  const handleStrokeIconClick = () => {
    if (isStrokeNone) {
      const restoreColor =
        effectiveStrokeColor && effectiveStrokeColor.toLowerCase() !== "none"
          ? effectiveStrokeColor
          : "#000000";
      applyStrokeColor(restoreColor, 1.5);
    } else {
      applyStrokeNone();
    }
  };

  // Fill 인풋 핸들러
  const handleFillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal.toLowerCase() === "none") {
      setFillInput("None");
      applyFillNone();
      return;
    }
    const val = rawVal
      .replace(/[^0-9A-Fa-f]/g, "")
      .slice(0, 6)
      .toUpperCase();
    setFillInput(val);
    if (val.length === 6) {
      applyFillColor(`#${val}`);
    }
  };

  const handleFillCommit = () => {
    if (fillInput.trim().toLowerCase() === "none" || fillInput.trim() === "") {
      applyFillNone();
    } else if (fillInput.length === 6 || fillInput.length === 3) {
      const fullHex =
        fillInput.length === 3
          ? fillInput
              .split("")
              .map((c) => c + c)
              .join("")
          : fillInput;
      applyFillColor(`#${fullHex.toUpperCase()}`);
    } else {
      if (isFillNone) {
        setFillInput("None");
      } else {
        setFillInput(effectiveFillColor.replace("#", "").toUpperCase());
      }
    }
  };

  // Stroke 인풋 핸들러
  const handleStrokeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal.toLowerCase() === "none") {
      setStrokeInput("None");
      applyStrokeNone();
      return;
    }
    const val = rawVal
      .replace(/[^0-9A-Fa-f]/g, "")
      .slice(0, 6)
      .toUpperCase();
    setStrokeInput(val);
    if (val.length === 6) {
      applyStrokeColor(
        `#${val}`,
        effectiveStrokeWeight > 0 ? effectiveStrokeWeight : 1.5,
      );
    }
  };

  const handleStrokeCommit = () => {
    if (
      strokeInput.trim().toLowerCase() === "none" ||
      strokeInput.trim() === ""
    ) {
      applyStrokeNone();
    } else if (strokeInput.length === 6 || strokeInput.length === 3) {
      const fullHex =
        strokeInput.length === 3
          ? strokeInput
              .split("")
              .map((c) => c + c)
              .join("")
          : strokeInput;
      applyStrokeColor(
        `#${fullHex.toUpperCase()}`,
        effectiveStrokeWeight > 0 ? effectiveStrokeWeight : 1.5,
      );
    } else {
      if (isStrokeNone) {
        setStrokeInput("None");
      } else {
        setStrokeInput(effectiveStrokeColor.replace("#", "").toUpperCase());
      }
    }
  };

  // Stroke Weight 인풋 핸들러
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeightInput(e.target.value);
  };

  const handleWeightCommit = () => {
    const parsed = parseFloat(weightInput);
    const validWeight = isNaN(parsed)
      ? 0
      : Math.max(0, Math.round(parsed * 10) / 10);
    setWeightInput(String(validWeight));
    applyStrokeWeight(validWeight);
  };

  const handleWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleWeightCommit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = parseFloat(weightInput) || 0;
      const step = e.shiftKey ? 5 : 1;
      const next = Math.max(0, current + step);
      setWeightInput(String(next));
      applyStrokeWeight(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFloat(weightInput) || 0;
      const step = e.shiftKey ? 5 : 1;
      const next = Math.max(0, current - step);
      setWeightInput(String(next));
      applyStrokeWeight(next);
    }
  };

  const toggleStrokeWeight = () => {
    setWeightInput("1.5");
    applyStrokeWeight(1.5);
  };

  // 하단 스와치 프리셋 선택
  function selectStylePreset(preset: StylePreset) {
    setSelectedStylePresetId(preset.id);
    if (selectedNodes.length >= 2) {
      updateMultiDraft({
        colorHex: preset.fillColor,
        strokeWeight: preset.strokeWeight,
        strokeColor: preset.strokeColor,
      });
      return;
    }
    const isPresetFillNone =
      preset.fillColor.toLowerCase() === "none" ||
      preset.fillColor.toLowerCase() === "transparent";
    const connectorColor = isPresetFillNone
      ? preset.strokeWeight > 0
        ? preset.strokeColor
        : "#000000"
      : preset.fillColor.toLowerCase() === "#ffffff" && preset.strokeWeight > 0
        ? preset.strokeColor
        : preset.fillColor;
    setUIState({
      selectedStylePresetId: preset.id,
      selectedConnectorColor: connectorColor,
    });
    setNodeOptionState({
      fillColor: preset.fillColor,
      strokeWeight: preset.strokeWeight,
      strokeColor: preset.strokeColor,
    });
    applyCurrentNodeState(undefined, {
      colorHex: preset.fillColor,
      strokeWeight: preset.strokeWeight,
      strokeColor: preset.strokeColor,
    });
  }

  function toggleStyleMoreMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (isMoreDisabled) return;
    if (contextMenuOpen && contextMenuTarget === "style") {
      setContextMenuOpen(false);
      return;
    }
    closeAllPopovers();
    const rect = btnMoreRef.current?.getBoundingClientRect();
    if (rect) {
      const popoverHeight = 58;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow >= popoverHeight + 8
          ? rect.bottom + 4
          : Math.max(8, rect.top - popoverHeight - 4);
      const left = Math.max(8, rect.right - 72);
      setContextMenuPos({ top, left });
    }
    setContextMenuTarget("style");
    if (activeStylePreset) {
      setSelectedStylePresetId(activeStylePreset.id);
    }
    setContextMenuOpen(true);
  }

  return (
    <div className="section-block">
      {/* 1. 상단 섹션 헤더 */}
      <div className="section-header">
        <span className="section-title">Style</span>
        <div className="section-actions">
          <button
            className="btn-action-icon"
            data-tooltip={t('tipAddStyle')}
            onClick={() => setActiveModal("add-style")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 6C12.2761 6 12.5 6.22386 12.5 6.5V11.5H17.5C17.7761 11.5 18 11.7239 18 12C18 12.2761 17.7761 12.5 17.5 12.5H12.5V17.5C12.5 17.7761 12.2761 18 12 18C11.7239 18 11.5 17.7761 11.5 17.5V12.5H6.5C6.22386 12.5 6 12.2761 6 12C6 11.7239 6.22386 11.5 6.5 11.5H11.5V6.5C11.5 6.22386 11.7239 6 12 6Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            id="btn-style-more"
            ref={btnMoreRef}
            className={`btn-action-icon btn-more-icon${isMoreDisabled ? " disabled" : ""}${contextMenuOpen && contextMenuTarget === "style" ? " active" : ""}`}
            data-tooltip={
              isMoreDisabled
                ? t('tipStyleMoreLocked')
                : t('tipStyleMore')
            }
            disabled={isMoreDisabled}
            onClick={toggleStyleMoreMenu}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="8" r="1" fill="currentColor" />
              <circle cx="8" cy="8" r="1" fill="currentColor" />
              <circle cx="12" cy="8" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <div className="section-body">
        {/* 2. 피그마 UI3 공식 컨트롤 행 (Fill Color, Stroke Color, Stroke Weight) */}
        <div className="style-inputs-row">
          {/* (1) Fill Color 컨트롤 박스 */}
          <div className="style-input-box style-color-input-box" data-tooltip={t('tipFillColor')}>
            {/* 컬러 칩 (클릭 시 배경 끄기/None 토글) */}
            <FillColorIcon
              color={effectiveFillColor}
              isNone={isFillNone}
              isMixed={isFillMixed}
              onClick={handleFillChipClick}
            />

            {/* Hex 인풋 (None일 때 None 표시) */}
            <input
              type="text"
              className={`style-text-input${isFillNone ? " is-none" : ""}`}
              value={isFillMixed ? "" : isFillNone ? "None" : fillInput}
              placeholder={
                isFillMixed ? "Mixed" : isFillNone ? "None" : "FFFFFF"
              }
              onChange={handleFillChange}
              onFocus={(e) => {
                if (isFillNone || e.target.value === "None") {
                  e.target.select();
                }
              }}
              onBlur={handleFillCommit}
              onKeyDown={(e) => e.key === "Enter" && handleFillCommit()}
              spellCheck={false}
              autoComplete="off"
            />

            {/* 팔레트 아이콘 버튼 (Fill 컬러 선택 다이얼로그 오픈) */}
            <button
              type="button"
              className="style-palette-action-btn"
              onClick={() => setActiveModal("fill-color")}
            >
              {PALETTE_ICON_SVG}
            </button>
          </div>

          {/* (2) Stroke Color 컨트롤 박스 */}
          <div className={`style-input-box style-color-input-box${!isStrokeApplicable ? ' disabled' : ''}`} data-tooltip={t('tipStrokeColor')}>
            {/* 사용자 제공 공식 Stroke SVG 아이콘 버튼 (None 상태 시 대각선 표시 및 클릭 시 토글) */}
            <button
              type="button"
              className="style-stroke-btn"
              disabled={!isStrokeApplicable}
              onClick={handleStrokeIconClick}
            >
              <StrokeColorIcon
                color={effectiveStrokeColor}
                isNone={isStrokeNone}
                isMixed={isStrokeMixed}
                size={14}
              />
            </button>

            {/* Hex 인풋 (None일 때 None 표시) */}
            <input
              type="text"
              className={`style-text-input${isStrokeNone ? " is-none" : ""}`}
              value={isStrokeMixed ? "" : isStrokeNone ? "None" : strokeInput}
              placeholder={
                isStrokeMixed ? "Mixed" : isStrokeNone ? "None" : "000000"
              }
              disabled={!isStrokeApplicable}
              onChange={handleStrokeChange}
              onFocus={(e) => {
                if (isStrokeNone || e.target.value === "None") {
                  e.target.select();
                }
              }}
              onBlur={handleStrokeCommit}
              onKeyDown={(e) => e.key === "Enter" && handleStrokeCommit()}
              spellCheck={false}
              autoComplete="off"
            />

            {/* 팔레트 아이콘 버튼 (Stroke 컬러 선택 다이얼로그 오픈) */}
            <button
              type="button"
              className="style-palette-action-btn"
              onClick={() => setActiveModal("stroke-color")}
            >
              {PALETTE_ICON_SVG}
            </button>
          </div>

          {/* (3) Stroke Weight 컨트롤 박스 */}
          <div className={`style-input-box style-weight-input-box${!isStrokeApplicable ? ' disabled' : ''}`} data-tooltip={t('tipStrokeWeight')}>
            {/* 3선 스트로크 아이콘 버튼 */}
            <button
              type="button"
              className="style-weight-action-btn"
              disabled={!isStrokeApplicable}
              onClick={toggleStrokeWeight}
            >
              {STROKE_WEIGHT_ICON_SVG}
            </button>

            {/* 두께 숫자 인풋 */}
            <input
              type="text"
              inputMode="decimal"
              className="style-weight-num-input"
              disabled={!isStrokeApplicable}
              value={isWeightMixed ? "" : weightInput}
              placeholder={isWeightMixed ? "Mixed" : "0"}
              onChange={handleWeightChange}
              onBlur={handleWeightCommit}
              onKeyDown={handleWeightKeyDown}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        {/* 3. 하단 스타일 스와치 그리드 */}
        <div className="swatches-grid" id="style-swatches">
          {stylePresets.map((preset) => {
            const isSelected = Boolean(
              (activeStylePreset && activeStylePreset.id === preset.id) ||
                (isStyleDrafted &&
                  selectedStylePresetId === preset.id &&
                  normalizeColorHex(preset.fillColor) ===
                    normalizeColorHex(effectiveFillColor)),
            );
            const hasBorder = preset.strokeWeight > 0;
            const isPresetFillNone =
              preset.fillColor.toLowerCase() === "none" ||
              preset.fillColor.toLowerCase() === "transparent";
            return (
              <div
                key={preset.id}
                className={`swatch-item${isSelected ? " selected" : ""}${isPresetFillNone ? " is-none" : ""}`}
                style={{
                  backgroundColor: isPresetFillNone
                    ? "transparent"
                    : preset.fillColor,
                  backgroundImage: isPresetFillNone
                    ? "repeating-conic-gradient(var(--checker-light, #e1e1e1) 0% 25%, var(--checker-dark, #ffffff) 0% 50%) 50% / 6px 6px"
                    : undefined,
                  border: hasBorder
                    ? `${preset.strokeWeight}px solid ${preset.strokeColor}`
                    : "none",
                  boxSizing: "border-box",
                  // 보더가 있는 카드는 기본 inset shadow가 겹치지 않도록 방지
                  boxShadow: hasBorder && !isSelected ? "none" : undefined,
                  position: "relative",
                  overflow: "hidden",
                }}
                data-color={preset.fillColor}
                data-style-id={preset.id}
                onClick={() => selectStylePreset(preset)}
              >
                {isPresetFillNone && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{ position: "absolute", top: 0, left: 0 }}
                  >
                    <line
                      x1="18.5"
                      y1="1.5"
                      x2="1.5"
                      y2="18.5"
                      stroke="#F24822"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
