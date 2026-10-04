// ============================================================
// Node 도메인 런타임 (Core/UI 공용, 샌드박스 중립)
// - Figma API를 import하지 않는다 (INV-01/06).
// - 프로토콜 계약(타입)은 src/types.ts에 유지하고,
//   값(const)과 함수(도메인 로직)만 이 파일에 둔다 (INV-07 분리).
// - 타입은 `import type`으로만 참조하므로 런타임 사이클이 없다.
// ============================================================
import type {
  WorkflowStatus,
  StatusMeta,
  DiagramNodeType,
  NodeTypeShapeSpec,
  BranchVariant,
  SelectedNodeInfo,
  NodeCategory,
  PluginOption,
  CapabilityNodeTarget,
  OptionCapability,
  OptionStateResult,
} from '../types';

export const STATUS_CONFIG: Record<WorkflowStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    color: { r: 0.612, g: 0.639, b: 0.686 }, // #9CA3AF
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#9CA3AF',
  },
  wireframe: {
    label: 'Wireframe',
    color: { r: 0.42, g: 0.447, b: 0.502 }, // #6B7280
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#6B7280',
  },
  in_progress: {
    label: 'In Progress',
    color: { r: 0.231, g: 0.51, b: 0.965 }, // #3B82F6
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#3B82F6',
  },
  in_review: {
    label: 'In Review',
    color: { r: 1, g: 0.62, b: 0.259 }, // #FF9E42
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#FF9E42',
  },
  revision: {
    label: 'Revision',
    color: { r: 0.949, g: 0.282, b: 0.133 }, // #F24822
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#F24822',
  },
  approved: {
    label: 'Approved',
    color: { r: 0.545, g: 0.361, b: 0.965 }, // #8B5CF6
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#8B5CF6',
  },
  ready_for_dev: {
    label: 'Ready for Dev',
    color: { r: 0.086, g: 0.639, b: 0.29 }, // #16A34A
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#16A34A',
  },
  done: {
    label: 'Done',
    color: { r: 0.216, g: 0.255, b: 0.318 }, // #374151
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#374151',
  },
};

/**
 * 다양한 노드 타입 및 레거시 타입을 6종 표준 타입으로 정규화합니다.
 */
export function normalizeNodeType(type?: string): DiagramNodeType {
  if (!type) return 'Screen';
  const clean = String(type).trim().toLowerCase();
  switch (clean) {
    case 'screen':
      return 'Screen';
    case 'process':
    case 'square':
    case 'rectangle':
    case 'action':
    case 'error':
    case 'true':
    case 'false':
      return 'Process';
    case 'junction':
    case 'connector':
    case 'system':
    case 'database':
      return 'Junction';
    case 'decision':
    case 'diamond':
      return 'Decision';
    case 'terminator':
    case 'pill':
    case 'capsule':
      return 'Terminator';
    case 'branch':
    case 'subflow':
      return 'Branch';
    case 'bridge':
      return 'Branch';
    default:
      return (type as DiagramNodeType) || 'Screen';
  }
}

export const NODE_TYPE_SHAPE_SPECS: Record<string, NodeTypeShapeSpec> = {
  Screen: { width: 250, height: 90, cornerRadius: 0, allowDescription: true, allowFigmaLink: true },
  Process: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Junction: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
  Decision: { width: 140, height: 140, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Terminator: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
  Branch: { width: 180, height: 90, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  // 레거시 별칭 호환
  Connector: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
  Square: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Rectangle: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Diamond: { width: 140, height: 140, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  Pill: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
  Action: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
  System: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
  Database: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
  Capsule: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
  Bridge: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
};

export const BRANCH_VARIANT_ORDER: BranchVariant[] = [
  'CHECK', 'CROSS', 'TAG', 'SQUARE', 'DIAMOND', 'CIRCLE',
];

export const BRANCH_VARIANT_LABELS: Record<BranchVariant, string> = {
  CHECK: 'Check',
  CROSS: 'Cross',
  TAG: 'Tag',
  SQUARE: 'Square',
  DIAMOND: 'Diamond',
  CIRCLE: 'Circle',
};

export function normalizeBranchVariant(value?: string | null): BranchVariant {
  const key = String(value || '').trim().toUpperCase();
  // 예전 Yes/No/True/False 칩은 텍스트만 다르므로 Tag로 읽는다.
  if (key === 'YES' || key === 'NO' || key === 'TRUE' || key === 'FALSE' || key === 'TAG') {
    return 'TAG';
  }
  if (
    key === 'CHECK' || key === 'CROSS' || key === 'SQUARE' || key === 'DIAMOND' || key === 'CIRCLE'
  ) {
    return key;
  }
  const byLabel = String(value || '').trim();
  const found = (Object.keys(BRANCH_VARIANT_LABELS) as BranchVariant[]).find(
    (k) => BRANCH_VARIANT_LABELS[k] === byLabel
  );
  return found || 'CIRCLE';
}

export function getBranchVariantSpec(variant: BranchVariant): NodeTypeShapeSpec {
  switch (variant) {
    case 'DIAMOND':
      return { width: 40, height: 40, cornerRadius: 0, allowDescription: false, allowFigmaLink: false };
    case 'TAG':
      return { width: 64, height: 32, cornerRadius: 16, allowDescription: false, allowFigmaLink: false };
    case 'CHECK':
    case 'CROSS':
    case 'SQUARE':
    case 'CIRCLE':
    default:
      return { width: 32, height: 32, cornerRadius: 16, allowDescription: false, allowFigmaLink: false };
  }
}

export function branchVariantHasTitle(variant: BranchVariant): boolean {
  return variant === 'TAG';
}

export function getBranchVariantDefaultFill(variant: BranchVariant): string {
  if (variant === 'CHECK') return '#14AE5C';
  if (variant === 'CROSS') return '#F24822';
  return '#FFFFFF';
}

export function branchVariantUsesStroke(variant: BranchVariant): boolean {
  return variant !== 'CHECK' && variant !== 'CROSS';
}

const DEFAULT_NODE_TITLE_NAMES = new Set([
  'Screen', 'Decision', 'Process', 'Connector', 'Terminator', 'Branch',
  'Action', 'System', 'Database', 'Square', 'Junction', 'Diamond', 'Pill', 'Capsule',
  'Check', 'Cross', 'Yes', 'No', 'True', 'False', 'Tag', 'Circle', 'Untitled',
]);

/** 사용자가 직접 쓰지 않은 타입/변형 기본 이름인지 */
export function isDefaultNodeTitle(title?: string | null): boolean {
  const value = String(title || '').trim();
  return value.length === 0 || DEFAULT_NODE_TITLE_NAMES.has(value);
}

/** 타입과 브랜치 변형에 대응하는 기본 타이틀 */
export function getDefaultNodeTitle(nodeType?: string | null, branchVariant?: string | null): string {
  const type = normalizeNodeType(nodeType || 'Screen');
  if (type === 'Branch') {
    return BRANCH_VARIANT_LABELS[normalizeBranchVariant(branchVariant)];
  }
  return type === 'Screen' ? 'Screen' : type;
}

/**
 * Option Capability Matrix
 * 각 노드 범주별 옵션 지원 여부 단일 소스 오브 트루스
 */
export const OPTION_CAPABILITY_MATRIX: Record<NodeCategory, Record<PluginOption, boolean>> = {
  Screen: {
    title: true,
    description: true,
    status: true,
    stepBadge: true,
    elevation: true,
    size: true,
    figmaLink: true,
    style: true,
  },
  Shape: {
    title: true,
    description: false,
    status: false,
    stepBadge: true,
    elevation: true,
    size: false,
    figmaLink: false,
    style: true,
  },
  Bridge: {
    title: true,
    description: false,
    status: false,
    stepBadge: false,
    elevation: false,
    size: false,
    figmaLink: false,
    style: true,
  },
  FigmaObject: {
    title: false,
    description: false,
    status: false,
    stepBadge: false,
    elevation: false,
    size: false,
    figmaLink: false,
    style: false,
  },
};

/**
 * 노드 객체(UI NodeInfo 또는 Core SceneNode)의 최종 타입을 기반으로
 * 4대 범주('Screen' | 'Shape' | 'Bridge' | 'FigmaObject') 중 하나를 판별합니다.
 */
export function getNodeCategory(node: any): NodeCategory {
  if (!node) return 'FigmaObject';

  // 피그마 커넥터(연결선)인 경우
  if (node.isConnector || node.type === 'CONNECTOR') {
    return 'FigmaObject';
  }

  // 플로우 노드 여부 검사
  const hasPluginDataFn = typeof node.getPluginData === 'function';
  const isFlowNode = Boolean(
    node.isFlowNode ||
    (hasPluginDataFn && (node.getPluginData('is_flow_node') === 'true' || Boolean(node.getPluginData('node_type'))))
  );

  // 플로우 노드가 아니고 구형 쉐이프(SHAPE_WITH_TEXT)도 아닌 경우 일반 Figma 객체
  if (!isFlowNode && node.type !== 'SHAPE_WITH_TEXT') {
    return 'FigmaObject';
  }

  // 현재 최종 노드 타입 추출 및 정규화
  let rawType: string | undefined = node.flowNodeType;
  if (!rawType && hasPluginDataFn) {
    rawType = node.getPluginData('node_type');
  }
  if (!rawType && node.nodeType && node.nodeType !== 'FRAME') {
    rawType = node.nodeType;
  }
  const normType = normalizeNodeType(rawType);

  switch (normType) {
    case 'Screen':
      return 'Screen';
    case 'Process':
    case 'Junction':
    case 'Connector':
    case 'Decision':
    case 'Terminator':
      return 'Shape';
    case 'Branch':
    case 'Bridge':
      return 'Bridge';
    default:
      return 'Shape';
  }
}

/**
 * 노드가 특정 옵션(Capability)을 현재 지원하는지 판별합니다.
 */
export function supportsOption(node: any, option: PluginOption): boolean {
  const category = getNodeCategory(node);
  return OPTION_CAPABILITY_MATRIX[category]?.[option] ?? false;
}

/**
 * 주어진 노드 목록에서 특정 옵션을 지원하는 노드만 필터링합니다. (실제 데이터 변경 대상 추출)
 */
export function getMutationTargets<T = any>(nodes: T[], option: PluginOption): T[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.filter((n) => supportsOption(n, option));
}

/**
 * 선택된 노드 집합 전체에 대한 특정 옵션의 지원 상태(Capability)를 단일하게 산출합니다.
 *
 * - SUPPORTED: 선택된 모든 관련 플로우 노드가 해당 옵션을 지원함
 * - PARTIAL: 선택된 관련 플로우 노드 중 일부만 해당 옵션을 지원함
 * - UNSUPPORTED: 선택된 관련 플로우 노드가 없거나, 어떤 노드도 해당 옵션을 지원하지 않음
 */
export function getOptionCapability<T extends CapabilityNodeTarget = SelectedNodeInfo>(
  nodes: (T | null | undefined)[] | null | undefined,
  option: PluginOption
): OptionCapability {
  if (!nodes || nodes.length === 0) return 'UNSUPPORTED';

  const validNodes = nodes.filter((n): n is T => Boolean(n));
  const relevantNodes = validNodes.filter((n) => getNodeCategory(n) !== 'FigmaObject');
  if (relevantNodes.length === 0) return 'UNSUPPORTED';

  const supportedCount = relevantNodes.filter((n) => supportsOption(n, option)).length;
  if (supportedCount === relevantNodes.length) return 'SUPPORTED';
  if (supportedCount > 0) return 'PARTIAL';
  return 'UNSUPPORTED';
}

/**
 * 선택된 노드 목록 전체를 분석하여 해당 옵션의 스위치 상태를 결정합니다.
 */
export function computeOptionSwitchState(
  nodes: any[],
  option: PluginOption,
  isNodeOnFn: (node: any) => boolean
): OptionStateResult {
  const capability = getOptionCapability(nodes, option);

  const validNodes = (nodes || []).filter(Boolean);
  const supportedNodes = validNodes.filter((n) => supportsOption(n, option));
  const unsupportedNodes = validNodes.filter((n) => !supportsOption(n, option));

  if (capability === 'UNSUPPORTED') {
    return {
      state: 'OFF',
      supportedCount: 0,
      unsupportedCount: unsupportedNodes.length,
      supportedNodes: [],
      unsupportedNodes,
      checked: false,
      isMixed: false,
      disabled: true,
      isOpen: false,
      capability,
    };
  }

  if (capability === 'PARTIAL') {
    return {
      state: 'MIXED_DISABLED',
      supportedCount: supportedNodes.length,
      unsupportedCount: unsupportedNodes.length,
      supportedNodes,
      unsupportedNodes,
      checked: false,
      isMixed: true,
      disabled: true,
      isOpen: false,
      capability,
    };
  }

  const onCount = supportedNodes.filter((n) => isNodeOnFn(n)).length;
  const offCount = supportedNodes.length - onCount;

  if (onCount === supportedNodes.length) {
    return {
      state: 'ON',
      supportedCount: supportedNodes.length,
      unsupportedCount: unsupportedNodes.length,
      supportedNodes,
      unsupportedNodes,
      checked: true,
      isMixed: false,
      disabled: false,
      isOpen: true,
      capability,
    };
  }

  if (offCount === supportedNodes.length) {
    return {
      state: 'OFF',
      supportedCount: supportedNodes.length,
      unsupportedCount: unsupportedNodes.length,
      supportedNodes,
      unsupportedNodes,
      checked: false,
      isMixed: false,
      disabled: false,
      isOpen: false,
      capability,
    };
  }

  return {
    state: 'MIXED_ACTIVE',
    supportedCount: supportedNodes.length,
    unsupportedCount: unsupportedNodes.length,
    supportedNodes,
    unsupportedNodes,
    checked: true,
    isMixed: true,
    disabled: false,
    isOpen: true,
    capability,
  };
}

/**
 * 스크린(Screen) 노드 치수 및 코너 라운드 제약 상수
 * - 최소 크기: 49 x 49
 * - 최대 크기: 800 x 600
 * - 코너 라운드: 0 ~ 20
 */
export const SCREEN_NODE_CONSTRAINTS = {
  MIN_WIDTH: 49,
  MAX_WIDTH: 800,
  MIN_HEIGHT: 49,
  MAX_HEIGHT: 600,
  MIN_CORNER_RADIUS: 0,
  MAX_CORNER_RADIUS: 20,
  MIN_STROKE_WEIGHT: 0,
  MAX_STROKE_WEIGHT: 10,
} as const;

export const {
  MIN_WIDTH: SCREEN_MIN_WIDTH,
  MAX_WIDTH: SCREEN_MAX_WIDTH,
  MIN_HEIGHT: SCREEN_MIN_HEIGHT,
  MAX_HEIGHT: SCREEN_MAX_HEIGHT,
  MIN_CORNER_RADIUS: SCREEN_MIN_CORNER_RADIUS,
  MAX_CORNER_RADIUS: SCREEN_MAX_CORNER_RADIUS,
  MIN_STROKE_WEIGHT: SCREEN_MIN_STROKE_WEIGHT,
  MAX_STROKE_WEIGHT: SCREEN_MAX_STROKE_WEIGHT,
} = SCREEN_NODE_CONSTRAINTS;

/**
 * Screen 노드의 너비를 [49, 800] 범위로 클램핑합니다.
 */
export function clampScreenWidth(w: number): number {
  return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_WIDTH, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, w));
}

/**
 * Screen 노드의 높이를 [49, 600] 범위로 클램핑합니다.
 */
export function clampScreenHeight(h: number): number {
  return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, h));
}

/**
 * Screen 노드의 코너 라운드를 [0, 20] 범위로 클램핑합니다.
 */
export function clampScreenCornerRadius(r: number): number {
  return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS, r));
}

/**
 * 노드의 스트로크 두께를 [0, 10] 범위로 클램핑합니다.
 */
export function clampStrokeWeight(sw: number): number {
  return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_STROKE_WEIGHT, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_STROKE_WEIGHT, sw));
}
