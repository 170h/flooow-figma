/**
 * elementCount.ts — Flooow element live recount (순수 함수)
 *
 * Figma Plugin API, SceneNode, UI 및 전역 상태에 일체 의존하지 않는 순수 TypeScript 로직.
 * 판정 규칙은 Core helper와 1:1 대응 (src/code.ts):
 * - findConnectorNode: is_custom_connector/is_flow_connector 조상 탐색 + 최상위 커넥터 승격
 *   (FigJam helper는 native CONNECTOR 타입도 매칭 — walk에서 동일하게 매칭하되
 *   정책 A(기본값)에서는 태그 필터로 untagged native를 계수에서 제외하므로 결과 동일)
 * - findFlowNode: 커넥터 패밀리 우선 제외 후 is_flow_node/node_type 조상 탐색
 * - 라벨 제외 선례: is_connector_label/ConnectorLabel 스캔 제외
 * - 중복 제거 선례: uniqueConnectorsMap (top-level id Set으로 dedup)
 *
 * Step 1 범위: 결제/entitlement/limit 없음. 향후 create gate에서 재사용.
 */

export interface CountableNode {
  id: string;
  type: string;
  name?: string;
  parent: CountableNode | null;
  getPluginData?: (key: string) => string;
}

export interface FlooowElementCount {
  nodes: number;
  connectors: number;
  total: number;
}

export interface FlooowCountOptions {
  /**
   * true면 Flooow-tagged가 아닌 native CONNECTOR도 계수 (정책 B 후보).
   * 기본값 false = 정책 A (Flooow-tagged connector만 count).
   * FigJam native CONNECTOR 정책은 미확정 — 최종 보고 FLAG 참조.
   */
  includeNativeConnectors?: boolean;
}

// [FLOOOW-COUNT] 계측 전용 (startup freeze 병목 추적용, 판정 로직 변경 없음)
// - console/performance 접근은 try/catch + typeof 가드로 감싸 Node 테스트 환경에서도 안전.
// - 개별 node 로그 금지, 10k 구간 progress + 누적 counter만 기록.
const COUNT_T0: number =
  typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
function clog(label: string): void {
  try {
    const now =
      typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(`[FLOOOW-COUNT] ${label} +${Math.round(now - COUNT_T0)}ms`);
    }
  } catch (_) {
    // 계측 로그 실패는 본 로직에 영향 없음
  }
}
let countFindTopConnectorCalls = 0;
let countFindTopFlowCalls = 0;
let countReadPluginDataCalls = 0;
let countAncestorSteps = 0;

function readPluginData(node: CountableNode | null, key: string): string {
  countReadPluginDataCalls++;
  try {
    if (node && typeof node.getPluginData === 'function') {
      return node.getPluginData(key) || '';
    }
  } catch (_) {
    /* native node without pluginData support — treat as empty */
  }
  return '';
}

function isTaggedConnector(node: CountableNode | null): boolean {
  return (
    readPluginData(node, 'is_custom_connector') === 'true' ||
    readPluginData(node, 'is_flow_connector') === 'true'
  );
}

function isConnectorLabel(node: CountableNode | null): boolean {
  return (
    readPluginData(node, 'is_connector_label') === 'true' ||
    (node != null && node.name === 'ConnectorLabel')
  );
}

// findConnectorNode 대응 (최상위 커넥터 승격 포함)
function findTopConnectorNode(node: CountableNode | null): CountableNode | null {
  countFindTopConnectorCalls++;
  let curr: CountableNode | null = node;
  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    countAncestorSteps++;
    if (curr.type === 'CONNECTOR' || isTaggedConnector(curr)) {
      let top: CountableNode = curr;
      let parentScan: CountableNode | null = curr.parent;
      while (parentScan && parentScan.type !== 'PAGE' && parentScan.type !== 'DOCUMENT') {
        countAncestorSteps++;
        if (parentScan.type === 'CONNECTOR' || isTaggedConnector(parentScan)) {
          top = parentScan;
        }
        parentScan = parentScan.parent;
      }
      return top;
    }
    curr = curr.parent;
  }
  return null;
}

// findFlowNode 대응 (커넥터 패밀리 우선 제외)
function findTopFlowNode(node: CountableNode | null): CountableNode | null {
  countFindTopFlowCalls++;
  if (!node) return null;
  if (findTopConnectorNode(node)) return null;
  let curr: CountableNode | null = node;
  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    countAncestorSteps++;
    if (
      readPluginData(curr, 'is_flow_node') === 'true' ||
      Boolean(readPluginData(curr, 'node_type'))
    ) {
      return curr;
    }
    curr = curr.parent;
  }
  return null;
}

/**
 * Document 전체 노드 목록 기준 Flooow element 실측.
 * - 호출자는 figma.root.findAll(() => true) 결과를 그대로 전달 (selection 무관).
 * - 커넥터 라벨/헬퍼 child는 별도 element로 세지 않음 (top-level 1회만).
 * - 저장 카운터·entitlement·payment 미사용.
 */
export function countFlooowElements(
  allNodes: Array<CountableNode | null>,
  options?: FlooowCountOptions
): FlooowElementCount {
  const nodeIds = new Set<string>();
  const connectorIds = new Set<string>();
  const includeNative = options?.includeNativeConnectors === true;
  const totalNodes = allNodes.length;

  // 호출별 누적 counter 초기화 (계측 전용, 판정값과 무관)
  countFindTopConnectorCalls = 0;
  countFindTopFlowCalls = 0;
  countReadPluginDataCalls = 0;
  countAncestorSteps = 0;
  clog(`start nodes=${totalNodes}`);

  let processed = 0;
  let nextMilestone = 10000;
  for (const n of allNodes) {
    if (!n) continue;
    processed++;
    if (processed >= nextMilestone) {
      clog(`progress ${processed}/${totalNodes}`);
      nextMilestone += 10000;
    }
    const connTop = findTopConnectorNode(n);
    if (connTop) {
      if (isConnectorLabel(connTop)) continue;
      if (isTaggedConnector(connTop)) {
        connectorIds.add(connTop.id);
        continue;
      }
      if (includeNative && connTop.type === 'CONNECTOR') {
        connectorIds.add(connTop.id);
      }
      continue;
    }
    const flowTop = findTopFlowNode(n);
    if (flowTop) {
      nodeIds.add(flowTop.id);
    }
  }

  clog(`iteration:done processed=${processed}/${totalNodes}`);
  clog(
    `counters findTopConnector=${countFindTopConnectorCalls} ` +
      `findTopFlow=${countFindTopFlowCalls} ` +
      `readPluginData=${countReadPluginDataCalls} ancestorSteps=${countAncestorSteps}`
  );

  const result = {
    nodes: nodeIds.size,
    connectors: connectorIds.size,
    total: nodeIds.size + connectorIds.size,
  };
  clog(`done nodes=${result.nodes} connectors=${result.connectors} total=${result.total}`);
  return result;
}
