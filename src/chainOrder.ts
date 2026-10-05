/**
 * chainOrder.ts — 3+ 노드 Chain 전용 공간 순서 정렬 및 Pair Key 유틸 (순수 함수)
 *
 * Figma Plugin API, SceneNode, UI 및 전역 상태에 일체 의존하지 않는 순수 TypeScript 로직.
 */

export const ROW_OVERLAP_THRESHOLD = 0.5;

export interface ChainNodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnchorRow<T> {
  anchor: T;
  nodes: T[];
}

/**
 * 3+ 노드 Chain 전용 공간 순서 정렬 (Anchor-node 기반 Row 판정)
 *
 * 규칙:
 * 1. 입력 노드를 Y 오름차순(동률 시 X, 동률 시 ID)으로 1차 정렬.
 * 2. 현재 마지막 Row의 Anchor 노드 vertical interval과만 비교.
 *    - Row의 top/bottom을 누적 확장하지 않음.
 *    - overlap = max(0, min(bottomA, bottomB) - max(topA, topB))
 *    - referenceHeight = min(heightA, heightB)
 *    - overlap >= referenceHeight * ROW_OVERLAP_THRESHOLD 이면 현재 마지막 Row에 편입.
 *    - 불만족 시 새 Row를 생성하고 그 노드를 새 Anchor로 고정.
 * 3. 각 Row 내부에서는 X 오름차순 -> Y 오름차순 -> ID tie-break 정렬.
 * 4. 최종 결과는 각 Row의 Anchor 순서대로 평탄화하여 반환.
 */
export function orderNodesForChain<T extends ChainNodePosition>(nodes: T[]): T[] {
  if (nodes.length <= 1) return nodes;

  // 1. 위쪽(Y) 우선, 같으면 왼쪽(X) 우선, 같으면 ID 기준 사전 정렬
  const sorted = [...nodes].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.id.localeCompare(b.id);
  });

  // 2. 현재 마지막 Row의 Anchor와만 비교하는 Anchor Row Grouping
  const rows: AnchorRow<T>[] = [];

  for (const node of sorted) {
    if (rows.length === 0) {
      rows.push({
        anchor: node,
        nodes: [node],
      });
      continue;
    }

    const lastRow = rows[rows.length - 1];
    const anchor = lastRow.anchor;

    const topA = anchor.y;
    const bottomA = anchor.y + anchor.height;
    const topB = node.y;
    const bottomB = node.y + node.height;

    const overlap = Math.max(0, Math.min(bottomA, bottomB) - Math.max(topA, topB));
    const referenceHeight = Math.min(anchor.height, node.height);

    // 같은 Row 조건 (반드시 >= 사용, 50% 경계값 포함)
    if (overlap >= referenceHeight * ROW_OVERLAP_THRESHOLD) {
      lastRow.nodes.push(node);
    } else {
      rows.push({
        anchor: node,
        nodes: [node],
      });
    }
  }

  // 3. Row 내부 정렬: X 오름차순 -> Y 오름차순 -> ID tie-break
  const result: T[] = [];
  for (const row of rows) {
    row.nodes.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      if (a.y !== b.y) return a.y - b.y;
      return a.id.localeCompare(b.id);
    });
    result.push(...row.nodes);
  }

  return result;
}

/**
 * 방향 무관 결정적 Pair Key 생성 헬퍼
 * pairKey(A, B) = min(A, B) + "|" + max(A, B)
 */
export function makePairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}

/**
 * CONNECT_CHAIN 대상은 Flooow Flow Node만이다.
 * 필터 후 공간 정렬하므로 Figma Object는 순서와 pair에 들어가지 않는다.
 */
export function orderFlowNodesForChain<T extends ChainNodePosition & { isFlowNode?: boolean }>(nodes: T[]): T[] {
  return orderNodesForChain(nodes.filter((node) => node.isFlowNode === true));
}

/**
 * 신규 pair의 magnet.
 * createdIndex는 pairsToCreate 생성 순서이며, 전체 chain의 인접 index가 아니다.
 * - 0: source = sourceDraft, target = targetDraft
 * - 1+: source = targetDraft, target = targetDraft
 * Draft가 없으면 해당 자리는 optimal을 유지한다.
 */
export function resolveCreatedPairMagnets<T>(
  createdIndex: number,
  sourceDraft: T | undefined,
  targetDraft: T | undefined,
  optimalSource: T,
  optimalTarget: T,
): { sourceMagnet: T; targetMagnet: T } {
  let sourceMagnet = optimalSource;
  let targetMagnet = optimalTarget;
  if (createdIndex === 0 && sourceDraft) {
    sourceMagnet = sourceDraft;
  } else if (createdIndex !== 0 && targetDraft) {
    sourceMagnet = targetDraft;
  }
  if (targetDraft) {
    targetMagnet = targetDraft;
  }
  return { sourceMagnet, targetMagnet };
}
