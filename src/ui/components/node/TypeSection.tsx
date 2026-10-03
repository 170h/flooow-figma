import React from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import {
  DiagramNodeType,
  normalizeNodeType,
  NODE_TYPE_SHAPE_SPECS,
  BranchVariant,
  BRANCH_VARIANT_ORDER,
  BRANCH_VARIANT_LABELS,
  normalizeBranchVariant,
  getBranchVariantSpec,
  getBranchVariantDefaultFill,
  branchVariantUsesStroke,
  branchVariantHasTitle,
} from '../../../types';

/**
 * 1. Screen 아이콘 (1027415-4991 공식 규격: 위 11, 왼쪽 7, 아래 13, 오른쪽 9 간격)
 */
function ScreenIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path transform="translate(7, 11)" d="M6 0V2H32V24H2V6H0V0H6ZM6 6H2.95996V23.04H31.04V2.95996H6V6ZM1 1V5H5V1H1Z" fill="currentColor" />
    </svg>
  );
}

/**
 * 2. Process 아이콘 (1027415-4988 공식 SVG)
 */
function ProcessIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 1V25H1V1H25ZM26 0H0V26H26V0Z" fill="currentColor" />
    </svg>
  );
}

/**
 * 3. Junction 아이콘 (1027415-4985 공식 SVG)
 */
function JunctionIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 1C21.17 1 27 6.83 27 14C27 21.17 21.17 27 14 27C6.83 27 1 21.17 1 14C1 6.83 6.83 1 14 1ZM14 0C6.27 0 0 6.27 0 14C0 21.73 6.27 28 14 28C21.73 28 28 21.73 28 14C28 6.27 21.73 0 14 0Z" fill="currentColor" />
    </svg>
  );
}

/**
 * 4. Decision 아이콘 (1027415-4982 공식 SVG)
 */
function DecisionIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 1.41L30.59 16L16 30.59L1.41 16L16 1.41ZM16 0L0 16L16 32L32 16L16 0Z" fill="currentColor" />
    </svg>
  );
}

/**
 * 5. Terminator 아이콘 (1027415-4979 공식 SVG)
 */
function TerminatorIcon() {
  return (
    <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.19 1C26.15 1 31 5.85 31 11.81V12.2C31 18.16 26.15 23.01 20.19 23.01H11.8C5.84 23.01 0.99 18.16 0.99 12.2V11.81C1 5.85 5.85 1 11.81 1H20.2H20.19ZM20.19 0H11.8C5.31 0 0 5.31 0 11.81V12.2C0 18.69 5.31 24.01 11.81 24.01H20.2C26.69 24.01 32.01 18.7 32.01 12.2V11.81C32.01 5.32 26.7 0 20.2 0H20.19Z" fill="currentColor" />
    </svg>
  );
}

/**
 * 6. Branch 아이콘 (1027415-4976 공식 SVG)
 */
function BranchIcon() {
  return (
    <svg width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4C24 1.79 22.21 0 20 0C17.79 0 16 1.79 16 4C16 6.04 17.53 7.7 19.5 7.95V14C19.5 18.14 16.14 21.5 12 21.5H7.95C7.72 19.7 6.31 18.28 4.5 18.05V7.95C6.47 7.7 8 6.04 8 4C8 1.79 6.21 0 4 0C1.79 0 0 1.79 0 4C0 6.04 1.53 7.7 3.5 7.95V18.05C1.53 18.3 0 19.96 0 22C0 24.21 1.79 26 4 26C6.04 26 7.7 24.47 7.95 22.5H12C16.69 22.5 20.5 18.69 20.5 14V7.95C22.47 7.7 24 6.04 24 4ZM1 4C1 2.35 2.35 1 4 1C5.65 1 7 2.35 7 4C7 5.65 5.65 7 4 7C2.35 7 1 5.65 1 4ZM4 25C2.35 25 1 23.65 1 22C1 20.35 2.35 19 4 19C5.65 19 7 20.35 7 22C7 23.65 5.65 25 4 25ZM20 7C18.35 7 17 5.65 17 4C17 2.35 18.35 1 20 1C21.65 1 23 2.35 23 4C23 5.65 21.65 7 20 7Z" fill="currentColor" />
    </svg>
  );
}

interface NodeTypeOption {
  type: DiagramNodeType;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
}

const NODE_TYPE_OPTIONS: NodeTypeOption[] = [
  { type: 'Screen', label: 'Screen', tooltip: 'Screen', icon: <ScreenIcon /> },
  { type: 'Process', label: 'Process', tooltip: 'Process', icon: <ProcessIcon /> },
  { type: 'Junction', label: 'Junction', tooltip: 'Junction', icon: <JunctionIcon /> },
  { type: 'Decision', label: 'Decision', tooltip: 'Decision', icon: <DecisionIcon /> },
  { type: 'Terminator', label: 'Terminator', tooltip: 'Terminator', icon: <TerminatorIcon /> },
  { type: 'Branch', label: 'Branch', tooltip: 'Branch', icon: <BranchIcon /> },
];

/**
 * Type 섹션 - Figma UI3 6종 노드 타입 아이콘 세그먼트 그룹
 * (Figma 1027415-4690 기반)
 */
export function TypeSection() {
  const {
    nodeOptionState,
    setNodeOptionState,
    applyCurrentNodeState,
    selectedNodes,
    multiDraft,
    updateMultiDraft,
  } = useApp();
  const summary = useSelectionSummary();
  const currentNodeType = nodeOptionState.nodeType;

  // 복수 노드 선택 시 혼합(Mixed) 여부 판별 (Draft가 있으면 Draft 우선이므로 Mixed 해제)
  const isTypeMixed = multiDraft.nodeType !== undefined
    ? false
    : (summary.isMultiFlowNode && summary.nodeType.isMixed);
  // 클릭 직후 currentNodeType이 먼저 바뀌므로, 선택된 노드의 늦은 동기화보다 클릭 값을 우선한다
  const currentRawType = multiDraft.nodeType !== undefined
    ? multiDraft.nodeType
    : (isTypeMixed
        ? undefined
        : (currentNodeType || summary.nodeType.value));
  const activeType = currentRawType ? normalizeNodeType(currentRawType) : undefined;

  const DEFAULT_TYPE_TITLES = new Set([
    'Screen', 'Decision', 'Process', 'Connector', 'Terminator', 'Branch',
    'Action', 'System', 'Database', 'Square', 'Junction', 'Diamond', 'Pill', 'Capsule',
    'Check', 'Cross', 'Yes', 'No', 'True', 'False', 'Circle',
  ]);

  const activeBranchVariant = normalizeBranchVariant(
    multiDraft.branchVariant
      ?? (selectedNodes.length === 1 ? selectedNodes[0]?.branchVariant : undefined)
      ?? nodeOptionState.branchVariant
  );
  const showBranchVariants =
    activeType === 'Branch' ||
    normalizeNodeType(currentNodeType) === 'Branch' ||
    normalizeNodeType(multiDraft.nodeType) === 'Branch';

  function selectNodeType(type: DiagramNodeType) {
    // 다중 선택 시 실제 Figma 노드를 변경하지 않고 Draft에만 기록
    // Type 변경 시 dimensions(W/H/R)를 자동으로 Draft에 넣지 않고 nodeType만 기록
    if (selectedNodes.length >= 2) {
      updateMultiDraft({ nodeType: type });
      return;
    }

    const nextVariant = type === 'Branch'
      ? normalizeBranchVariant(nodeOptionState.branchVariant)
      : undefined;
    const spec = type === 'Branch' && nextVariant
      ? getBranchVariantSpec(nextVariant)
      : NODE_TYPE_SHAPE_SPECS[type];
    const titleInputEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
    const descInputEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
    const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
    const linkInputEl = document.getElementById('single-screen-url') as HTMLInputElement | null;

    const sourceNode = selectedNodes.length === 1 ? selectedNodes[0] : undefined;
    const sourceBranch = sourceNode?.branchVariant
      ? normalizeBranchVariant(sourceNode.branchVariant)
      : undefined;
    const fromUntitledBridge = Boolean(
      sourceNode
      && normalizeNodeType(sourceNode.flowNodeType || sourceNode.nodeType) === 'Branch'
      && sourceBranch
      && !branchVariantHasTitle(sourceBranch)
    );

    let targetTitle: string | undefined = undefined;
    if (fromUntitledBridge && type !== 'Branch') {
      const currentTitle = titleInputEl?.value.trim() || '';
      const variantLabel = sourceBranch ? BRANCH_VARIANT_LABELS[sourceBranch] : '';
      if (!currentTitle || currentTitle === variantLabel || DEFAULT_TYPE_TITLES.has(currentTitle)) {
        targetTitle = type;
        if (titleInputEl) titleInputEl.value = targetTitle;
      } else {
        targetTitle = currentTitle;
      }
    } else if (titleInputEl) {
      const currentTitle = titleInputEl.value.trim();
      if (!currentTitle || DEFAULT_TYPE_TITLES.has(currentTitle)) {
        targetTitle = nextVariant ? BRANCH_VARIANT_LABELS[nextVariant] : type;
        titleInputEl.value = targetTitle;
      } else {
        targetTitle = currentTitle;
      }
    }

    if (spec) {
      if (wEl) wEl.value = String(spec.width);
      if (hEl) hEl.value = String(spec.height);
      if (rEl) rEl.value = String(spec.cornerRadius ?? 0);
    }

    const targetSize = spec ? {
      width: spec.width,
      height: spec.height,
      cornerRadius: spec.cornerRadius ?? 0,
    } : undefined;

    const nextFill = type === 'Branch' && nextVariant
      ? getBranchVariantDefaultFill(nextVariant)
      : undefined;
    const nextStrokeWeight = nextVariant && !branchVariantUsesStroke(nextVariant) ? 0 : (nextVariant ? 1.5 : undefined);
    const nextStrokeColor = nextVariant && branchVariantUsesStroke(nextVariant) ? '#1E1E1E' : undefined;

    setNodeOptionState({
      nodeType: type,
      branchVariant: nextVariant,
      ...(nextFill ? { fillColor: nextFill } : {}),
      ...(nextStrokeWeight !== undefined ? { strokeWeight: nextStrokeWeight } : {}),
      ...(nextStrokeColor !== undefined ? { strokeColor: nextStrokeColor } : {}),
      ...(spec ? {
        width: spec.width,
        height: spec.height,
        cornerRadius: spec.cornerRadius ?? 0,
      } : {}),
    });

    // 디폴트 규격(크기, 모서리 곡률, 타이틀)을 명시적으로 전달하여 레이스 컨디션 없이 즉시 적용
    applyCurrentNodeState(
      undefined,
      nextFill
        ? {
            colorHex: nextFill,
            strokeWeight: nextVariant && !branchVariantUsesStroke(nextVariant) ? 0 : 1.5,
            strokeColor: nextVariant && branchVariantUsesStroke(nextVariant) ? '#1E1E1E' : undefined,
          }
        : undefined,
      undefined,
      type,
      targetSize,
      targetTitle
    );
  }

  function selectBranchVariant(variant: BranchVariant) {
    if (selectedNodes.length >= 2) {
      updateMultiDraft({
        nodeType: 'Branch',
        branchVariant: variant,
        width: getBranchVariantSpec(variant).width,
        height: getBranchVariantSpec(variant).height,
        cornerRadius: getBranchVariantSpec(variant).cornerRadius ?? 0,
        colorHex: getBranchVariantDefaultFill(variant),
        strokeWeight: branchVariantUsesStroke(variant) ? 1.5 : 0,
        strokeColor: branchVariantUsesStroke(variant) ? '#1E1E1E' : undefined,
      });
      setNodeOptionState({ branchVariant: variant });
      return;
    }

    const spec = getBranchVariantSpec(variant);
    const titleInputEl = document.getElementById('node-title-input') as HTMLInputElement | null;
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const label = BRANCH_VARIANT_LABELS[variant];
    let targetTitle: string | undefined;
    if (titleInputEl) {
      const currentTitle = titleInputEl.value.trim();
      if (!currentTitle || DEFAULT_TYPE_TITLES.has(currentTitle)) {
        targetTitle = label;
        titleInputEl.value = label;
      } else {
        targetTitle = currentTitle;
      }
    }
    if (wEl) wEl.value = String(spec.width);
    if (hEl) hEl.value = String(spec.height);
    if (rEl) rEl.value = String(spec.cornerRadius ?? 0);

    const fill = getBranchVariantDefaultFill(variant);
    const strokeW = branchVariantUsesStroke(variant) ? 1.5 : 0;
    const strokeC = branchVariantUsesStroke(variant) ? '#1E1E1E' : undefined;

    setNodeOptionState({
      nodeType: 'Branch',
      fillColor: fill,
      strokeWeight: strokeW,
      ...(strokeC ? { strokeColor: strokeC } : {}),
      branchVariant: variant,
      width: spec.width,
      height: spec.height,
      cornerRadius: spec.cornerRadius ?? 0,
    });
    applyCurrentNodeState(
      undefined,
      {
        colorHex: fill,
        strokeWeight: branchVariantUsesStroke(variant) ? 1.5 : 0,
        strokeColor: branchVariantUsesStroke(variant) ? '#1E1E1E' : undefined,
      },
      undefined,
      'Branch',
      { width: spec.width, height: spec.height, cornerRadius: spec.cornerRadius ?? 0 },
      targetTitle
    );
  }

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">Type</span>
      </div>
      <div className="section-body">
        <div className="type-icon-group" id="node-type-icons">
          {NODE_TYPE_OPTIONS.map(({ type, label, tooltip, icon }) => {
            const isActive = !isTypeMixed && activeType === type;
            return (
              <button
                key={type}
                type="button"
                className={`type-icon-btn${isActive ? ' active' : ''}`}
                data-type={type}
                data-tooltip={tooltip}
                aria-label={label}
                onClick={() => selectNodeType(type)}
              >
                {icon}
              </button>
            );
          })}
        </div>
        {showBranchVariants && (
          <div className="chip-group" style={{ marginTop: '8px', gap: '8px' }}>
            {BRANCH_VARIANT_ORDER.map((variant) => {
              const isActive = !isTypeMixed && activeBranchVariant === variant;
              return (
                <button
                  key={variant}
                  type="button"
                  className={`chip-btn${isActive ? ' active' : ''}`}
                  onClick={() => selectBranchVariant(variant)}
                >
                  {BRANCH_VARIANT_LABELS[variant]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
