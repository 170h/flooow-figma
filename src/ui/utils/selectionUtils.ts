import type { NodeInfo } from '../context/AppContext';
import { DiagramNodeType, WorkflowStatus, BadgePosition, BadgeShape, ConnectorStrokePattern, ConnectorRoutingType, ConnectorTerminalType, MagnetPosition, ConnectorLabelAlign, ConnectorLabelBoxStyle, ConnectedConnectorDetail, PluginOption } from '../../types';
import { normalizeNodeType, supportsOption } from '../../domain/nodeDomain';

export interface PropertySummary<T> {
  value: T | undefined;
  isMixed: boolean;
  hasValue: boolean;
}

/**
 * 배열 내 항목들의 특정 속성을 비교하여 공통값 및 Mixed(혼합) 여부를 판별합니다.
 * option 매개변수가 제공되면 해당 옵션을 지원하는 노드(Supported nodes)만을 대상으로 집계하여
 * 미지원 노드(Unsupported nodes)로 인해 공통값이 오염되는 현상을 차단합니다.
 */
export function getCommonProperty<T>(
  items: unknown[],
  getter: (item: any) => T | undefined,
  equalityFn: (a: T, b: T) => boolean = (a, b) => a === b,
  option?: PluginOption
): PropertySummary<T> {
  if (!items || items.length === 0) {
    return { value: undefined, isMixed: false, hasValue: false };
  }

  const targetItems = option
    ? items.filter((item) => supportsOption(item, option))
    : items;

  if (targetItems.length === 0) {
    return { value: undefined, isMixed: false, hasValue: false };
  }

  const values = targetItems
    .map(getter)
    .filter((v): v is T => v !== undefined && v !== null);

  if (values.length === 0) {
    return { value: undefined, isMixed: false, hasValue: false };
  }

  const allHaveValue = values.length === targetItems.length;
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
  /** 플로우 노드 1개 이상 + 커넥터 1개 이상 혼합 선택 (단일/복수 판정 모두 false가 되는 사각지대) */
  isMixedWithConnectors: boolean;

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
  connectorLabel: PropertySummary<string>;
  connectorLabelOn: PropertySummary<boolean>;
  connectorLabelFillColor: PropertySummary<string>;
  connectorLabelStrokeColor: PropertySummary<string>;
  connectorLabelAlign: PropertySummary<ConnectorLabelAlign>;
  connectorLabelBoxStyle: PropertySummary<ConnectorLabelBoxStyle>;

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
  const figjamNodes = validNodes.filter((n) => !flowNodes.includes(n) && !n.isConnector);

  const totalCount = validNodes.length;
  const flowNodeCount = flowNodes.length;
  const connectorCount = connectorNodes.length;
  const figjamNodeCount = figjamNodes.length;
  const isFigJamObject = totalCount > 0 && figjamNodeCount === totalCount;

  console.log('[Flooow:analyzeSelection]', {
    inputNodes: validNodes.map((n) => ({
      id: n.id,
      type: n.nodeType,
      name: n.name,
      isConnector: n.isConnector,
      isFlowNode: n.isFlowNode,
    })),
    totalCount,
    flowNodeCount,
    connectorCount,
  });

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
    isMixedWithConnectors: flowNodeCount >= 1 && connectorCount >= 1,

    // 플로우 노드 속성 요약
    color: getCommonProperty(flowNodes, (n) => n.fillColorHex, caseInsensitiveEqual, 'style'),
    strokeWeight: getCommonProperty(flowNodes, (n) => n.strokeWeight, undefined, 'style'),
    strokeColor: getCommonProperty(flowNodes, (n) => n.strokeColorHex, caseInsensitiveEqual, 'style'),
    elevation: getCommonProperty(flowNodes, (n) => n.elevation, undefined, 'elevation'),
    elevationOn: getCommonProperty(flowNodes, (n) => (n.elevationOn ? true : undefined), undefined, 'elevation'),
    status: getCommonProperty(flowNodes, (n) => (n.status ? (n.status as WorkflowStatus) : undefined), undefined, 'status'),
    statusOn: getCommonProperty(flowNodes, (n) => (n.status ? true : undefined), undefined, 'status'),
    nodeType: getCommonProperty(flowNodes, (n) => normalizeNodeType(n.flowNodeType || n.nodeType)),
    width: getCommonProperty(flowNodes, (n) => n.width, undefined, 'size'),
    height: getCommonProperty(flowNodes, (n) => n.height, undefined, 'size'),
    cornerRadius: getCommonProperty(flowNodes, (n) => n.cornerRadius, undefined, 'size'),
    sizeMode: getCommonProperty(flowNodes, (n) => n.sizeMode, undefined, 'size'),
    stepNumber: getCommonProperty(flowNodes, (n) => n.stepNumber, undefined, 'stepBadge'),
    hasStepBadge: getCommonProperty(flowNodes, (n) => (n.stepNumber !== undefined ? true : undefined), undefined, 'stepBadge'),
    badgeCorner: getCommonProperty(flowNodes, (n) => n.badgeCorner, undefined, 'stepBadge'),
    badgeShape: getCommonProperty(flowNodes, (n) => n.badgeShape, undefined, 'stepBadge'),
    badgeColorMode: getCommonProperty(
      flowNodes.filter((n) => typeof n.stepNumber === 'number' && !Number.isNaN(n.stepNumber)),
      (n) => n.badgeColorMode || 'Style',
      undefined,
      'stepBadge',
    ),
    description: getCommonProperty(flowNodes, (n) => n.description, undefined, 'description'),
    hasDescription: getCommonProperty(flowNodes, (n) => (n.description && n.description.trim().length > 0 ? true : undefined), undefined, 'description'),
    figmaLink: getCommonProperty(flowNodes, (n) => n.figmaLink, undefined, 'figmaLink'),
    hasFigmaLink: getCommonProperty(flowNodes, (n) => (n.figmaLink && n.figmaLink.trim().length > 0 ? true : undefined), undefined, 'figmaLink'),

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
    connectorLabel: getCommonProperty(connectorNodes, (n) => n.connectorLabel ?? ''),
    connectorLabelOn: getCommonProperty(connectorNodes, (n) => (
      n.connectorLabelOn !== undefined ? n.connectorLabelOn : Boolean(n.connectorLabel)
    )),
    connectorLabelFillColor: getCommonProperty(
      connectorNodes,
      (n) => n.connectorLabelFillColor || '#FFFFFF',
      caseInsensitiveEqual
    ),
    connectorLabelStrokeColor: getCommonProperty(
      connectorNodes,
      (n) => n.connectorLabelStrokeColor || n.connectorColorHex || '#000000',
      caseInsensitiveEqual
    ),
    connectorLabelAlign: getCommonProperty(connectorNodes, (n) => n.connectorLabelAlign || 'CENTER'),
    connectorLabelBoxStyle: getCommonProperty(connectorNodes, (n) => n.connectorLabelBoxStyle || 'BOX'),
  };
}

/**
 * Connector Property State 요약에서 커넥터 스타일 4종(Color/Weight/Terminal/Offset)만 추린 타입.
 * SelectionSummary와 필드명이 동일하므로 호출측이 summary와 동일한 방식으로 소비할 수 있다.
 */
export type ConnectorStyleSummary = Pick<
  SelectionSummary,
  | 'connectorColor'
  | 'connectorStrokeWeight'
  | 'connectorStartTerminal'
  | 'connectorEndTerminal'
  | 'connectorStartOffset'
  | 'connectorEndOffset'
>;

/**
 * 혼합 선택(노드/오브젝트 + 커넥터)에서 nodes payload에 포함되지 않는 기존 연결 커넥터의
 * Connector Property State를 ConnectedConnectorDetail에서 계산한다.
 * - getCommonProperty/PropertySummary를 그대로 재사용하므로 Mixed 판정 규칙은
 *   커넥터 단독/복수 선택과 동일하다 (새로운 판정 로직을 만들지 않는다).
 * - 커넥터가 하나도 없으면 null을 반환해 호출측의 기존 생성 설정 분기를 유지한다.
 */
export function getConnectedConnectorStyleSummary(
  details: ConnectedConnectorDetail[] | undefined
): ConnectorStyleSummary | null {
  if (!details || details.length === 0) return null;
  return {
    connectorColor: getCommonProperty(details, (d) => d.connectorColorHex, caseInsensitiveEqual),
    connectorStrokeWeight: getCommonProperty(details, (d) => d.connectorStrokeWeight),
    connectorStartTerminal: getCommonProperty(details, (d) => d.connectorStartTerminal),
    connectorEndTerminal: getCommonProperty(details, (d) => d.connectorEndTerminal),
    connectorStartOffset: getCommonProperty(details, (d) => d.connectorStartOffset),
    connectorEndOffset: getCommonProperty(details, (d) => d.connectorEndOffset),
  };
}
