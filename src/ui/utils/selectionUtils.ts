import { NodeInfo } from '../context/AppContext';
import { DiagramNodeType, normalizeNodeType, WorkflowStatus, BadgePosition, BadgeShape, ConnectorStrokePattern, ConnectorRoutingType, ConnectorTerminalType, MagnetPosition } from '../../types';

export interface PropertySummary<T> {
  value: T | undefined;
  isMixed: boolean;
  hasValue: boolean;
}

/**
 * 배열 내 항목들의 특정 속성을 비교하여 공통값 및 Mixed(혼합) 여부를 판별합니다.
 */
export function getCommonProperty<T>(
  items: unknown[],
  getter: (item: any) => T | undefined,
  equalityFn: (a: T, b: T) => boolean = (a, b) => a === b
): PropertySummary<T> {
  if (!items || items.length === 0) {
    return { value: undefined, isMixed: false, hasValue: false };
  }

  const values = items
    .map(getter)
    .filter((v): v is T => v !== undefined && v !== null);

  if (values.length === 0) {
    return { value: undefined, isMixed: false, hasValue: false };
  }

  const allHaveValue = values.length === items.length;
  const first = values[0];
  const allSame = allHaveValue && values.every((v) => equalityFn(v, first));

  return {
    value: allSame ? first : undefined,
    isMixed: !allSame,
    hasValue: values.length > 0,
  };
}

/**
 * 대소문자를 무시하는 문자열 비교 함수
 */
function caseInsensitiveEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export interface SelectionSummary {
  totalCount: number;
  flowNodeCount: number;
  connectorCount: number;
  isMulti: boolean;
  isSingleFlowNode: boolean;
  isMultiFlowNode: boolean;
  isSingleConnector: boolean;
  isMultiConnector: boolean;

  // 플로우 노드 설정 항목 요약
  color: PropertySummary<string>;
  strokeWeight: PropertySummary<number>;
  strokeColor: PropertySummary<string>;
  elevation: PropertySummary<number>;
  elevationOn: PropertySummary<boolean>;
  status: PropertySummary<WorkflowStatus>;
  statusOn: PropertySummary<boolean>;
  nodeType: PropertySummary<DiagramNodeType | string>;
  width: PropertySummary<number>;
  height: PropertySummary<number>;
  cornerRadius: PropertySummary<number>;
  sizeMode: PropertySummary<'fixed' | 'hug' | 'fit'>;
  stepNumber: PropertySummary<number>;
  hasStepBadge: PropertySummary<boolean>;
  badgeCorner: PropertySummary<BadgePosition | string>;
  badgeShape: PropertySummary<BadgeShape | string>;
  badgeColorMode: PropertySummary<'White' | 'Black' | 'Style'>;
  description: PropertySummary<string>;
  hasDescription: PropertySummary<boolean>;
  figmaLink: PropertySummary<string>;
  hasFigmaLink: PropertySummary<boolean>;

  // 커넥터 설정 항목 요약
  connectorColor: PropertySummary<string>;
  connectorStrokeWeight: PropertySummary<number>;
  connectorStrokePattern: PropertySummary<ConnectorStrokePattern>;
  connectorRoutingType: PropertySummary<ConnectorRoutingType>;
  connectorStartTerminal: PropertySummary<ConnectorTerminalType>;
  connectorEndTerminal: PropertySummary<ConnectorTerminalType>;
  connectorSourceMagnet: PropertySummary<MagnetPosition>;
  connectorTargetMagnet: PropertySummary<MagnetPosition>;
  connectorStartOffset: PropertySummary<number>;
  connectorEndOffset: PropertySummary<number>;

  // 피그잼 일반 객체 요약
  isFigJamObject: boolean;
  figjamNodeCount: number;
}

/**
 * 선택된 노드 목록 전체를 분석하여 항목별 Mixed 상태를 집계합니다.
 */
export function analyzeSelection(nodes: (NodeInfo | null | undefined)[]): SelectionSummary {
  const validNodes = (nodes || []).filter((n): n is NodeInfo => Boolean(n));
  const flowNodes = validNodes.filter((n) => Boolean(n.isFlowNode));
  const connectorNodes = validNodes.filter((n) => Boolean(n.isConnector));
  const figjamNodes = validNodes.filter((n) => !n.isFlowNode && !n.isConnector);

  const totalCount = validNodes.length;
  const flowNodeCount = flowNodes.length;
  const connectorCount = connectorNodes.length;
  const figjamNodeCount = figjamNodes.length;
  const isFigJamObject = totalCount > 0 && figjamNodeCount === totalCount;

  return {
    totalCount,
    flowNodeCount,
    connectorCount,
    figjamNodeCount,
    isFigJamObject,
    isMulti: totalCount > 1,
    isSingleFlowNode: flowNodeCount === 1 && connectorCount === 0,
    isMultiFlowNode: flowNodeCount > 1,
    isSingleConnector: connectorCount === 1 && flowNodeCount === 0,
    isMultiConnector: connectorCount > 1 && flowNodeCount === 0,

    // 플로우 노드 속성 요약
    color: getCommonProperty(flowNodes, (n) => n.fillColorHex, caseInsensitiveEqual),
    strokeWeight: getCommonProperty(flowNodes, (n) => n.strokeWeight),
    strokeColor: getCommonProperty(flowNodes, (n) => n.strokeColorHex, caseInsensitiveEqual),
    elevation: getCommonProperty(flowNodes, (n) => n.elevation),
    elevationOn: getCommonProperty(flowNodes, (n) => (n.elevationOn ? true : undefined)),
    status: getCommonProperty(flowNodes, (n) => (n.status ? (n.status as WorkflowStatus) : undefined)),
    statusOn: getCommonProperty(flowNodes, (n) => (n.status ? true : undefined)),
    nodeType: getCommonProperty(flowNodes, (n) => normalizeNodeType(n.flowNodeType || (n.nodeType === 'FRAME' ? 'Screen' : n.nodeType))),
    width: getCommonProperty(flowNodes, (n) => n.width),
    height: getCommonProperty(flowNodes, (n) => n.height),
    cornerRadius: getCommonProperty(flowNodes, (n) => n.cornerRadius),
    sizeMode: getCommonProperty(flowNodes, (n) => n.sizeMode),
    stepNumber: getCommonProperty(flowNodes, (n) => n.stepNumber),
    hasStepBadge: getCommonProperty(flowNodes, (n) => (n.stepNumber !== undefined ? true : undefined)),
    badgeCorner: getCommonProperty(flowNodes, (n) => n.badgeCorner),
    badgeShape: getCommonProperty(flowNodes, (n) => n.badgeShape),
    badgeColorMode: getCommonProperty(flowNodes, (n) => n.badgeColorMode),
    description: getCommonProperty(flowNodes, (n) => n.description),
    hasDescription: getCommonProperty(flowNodes, (n) => (n.description && n.description.trim().length > 0 ? true : undefined)),
    figmaLink: getCommonProperty(flowNodes, (n) => n.figmaLink),
    hasFigmaLink: getCommonProperty(flowNodes, (n) => (n.figmaLink && n.figmaLink.trim().length > 0 ? true : undefined)),

    // 커넥터 노드 속성 요약
    connectorColor: getCommonProperty(connectorNodes, (n) => n.connectorColorHex || n.strokeColorHex, caseInsensitiveEqual),
    connectorStrokeWeight: getCommonProperty(connectorNodes, (n) => {
      if (typeof n.connectorStrokeWeight === 'number') return n.connectorStrokeWeight;
      if (typeof n.strokeWeight === 'number') return n.strokeWeight;
      return undefined;
    }),
    connectorStrokePattern: getCommonProperty(connectorNodes, (n) => n.connectorStrokePattern),
    connectorRoutingType: getCommonProperty(connectorNodes, (n) => n.connectorRoutingType),
    connectorStartTerminal: getCommonProperty(connectorNodes, (n) => n.connectorStartTerminal),
    connectorEndTerminal: getCommonProperty(connectorNodes, (n) => n.connectorEndTerminal),
    connectorSourceMagnet: getCommonProperty(connectorNodes, (n) => n.connectorSourceMagnet),
    connectorTargetMagnet: getCommonProperty(connectorNodes, (n) => n.connectorTargetMagnet),
    connectorStartOffset: getCommonProperty(connectorNodes, (n) =>
      typeof n.connectorStartOffset === 'number' ? n.connectorStartOffset : undefined
    ),
    connectorEndOffset: getCommonProperty(connectorNodes, (n) =>
      typeof n.connectorEndOffset === 'number' ? n.connectorEndOffset : undefined
    ),
  };
}
