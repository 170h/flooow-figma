export type MagnetPosition = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';

export type GizmoMagnetVisualState = 'default' | 'active' | 'mixed';

export interface ConnectedConnectorLike {
  id?: string;
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
  isReversed?: boolean;
}

export interface ConnectorNodeLike {
  id?: string;
  isConnector?: boolean;
  connectorSourceMagnet?: MagnetPosition | string;
  connectorTargetMagnet?: MagnetPosition | string;
  connectorIsReversed?: boolean;
}

export interface MultiNodeConnectorLike {
  id?: string;
  sourceId: string;
  targetId: string;
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
}

export interface ComputeGizmoMagnetsInput {
  isMultiConnector?: boolean;
  isSingleConnector?: boolean;
  connectorNodes?: ConnectorNodeLike[];
  hasExistingConnection?: boolean;
  connectedConnectors?: ConnectedConnectorLike[];
  userPendingSourceMagnet?: MagnetPosition | null;
  userPendingTargetMagnet?: MagnetPosition | null;
  fallbackSourceMagnet?: MagnetPosition | null;
  fallbackTargetMagnet?: MagnetPosition | null;
  is3PlusNodes?: boolean;
  startNodeId?: string;
  multiNodeConnectors?: MultiNodeConnectorLike[];
}

export interface GizmoSideResult {
  magnetStates: Record<MagnetPosition, GizmoMagnetVisualState>;
  usedMagnets: MagnetPosition[];
  totalConnections: number;
}

export interface ComputeGizmoMagnetsOutput {
  start: GizmoSideResult;
  end: GizmoSideResult;
}

const ALL_MAGNETS: MagnetPosition[] = ['TOP', 'RIGHT', 'BOTTOM', 'LEFT'];

function blankMagnetStates(): Record<MagnetPosition, GizmoMagnetVisualState> {
  return { TOP: 'default', RIGHT: 'default', BOTTOM: 'default', LEFT: 'default' };
}

/** Draft가 있으면 Current ACTIVE/MIXED를 지우고 그 방향만 ACTIVE로 보여 준다. */
function showDraftOnly(
  magnetStates: Record<MagnetPosition, GizmoMagnetVisualState>,
  draft: MagnetPosition | null | undefined
): boolean {
  if (!draft) return false;
  for (const mag of ALL_MAGNETS) {
    magnetStates[mag] = mag === draft ? 'active' : 'default';
  }
  return true;
}

/**
 * 편집 대상 endpoint의 Current magnet과 Draft가 다르면 true.
 * Draft가 없거나, 연결 endpoint가 없거나, 모든 Current가 Draft와 같으면 false.
 */
export function isEndpointMagnetDraftDirty(
  currents: MagnetPosition[],
  draft: MagnetPosition | null | undefined
): boolean {
  if (!draft) return false;
  if (currents.length === 0) return false;
  return currents.some((mag) => mag !== draft);
}

/**
 * 선택된 두 노드 사이의 커넥터 및 선택된 커넥터의 엔드포인트를 기준으로
 * Start/End Gizmo의 각 마그넷 상태를 계산하는 순수 함수
 *
 * 상태 판정 규칙 (선택 대상 사이의 커넥터 기준, 각 방향 독립 계산):
 * - 해당 방향 연결 0개 -> default
 * - 해당 방향 연결 1개 -> active
 * - 해당 방향 연결 2개 이상 -> mixed
 *
 * 3+ 노드 선택 시 (is3PlusNodes):
 * - Start 카드 (Node 1): 자신에게 연결된 커넥터 방향 (0개: default, 1개: active, 2개+: mixed)
 * - End/More 카드: 연결이 1개 이상 존재하는 방향은 무조건 mixed로 표시
 *
 * fallback에 의한 active 강제 할당은 배제되며(연결 0개이면 default),
 * Draft(userPending)가 있으면 그 사이드는 Current를 덮어쓰지 않고 Draft 방향만 active로 표시한다.
 */
export function computeGizmoMagnets(input: ComputeGizmoMagnetsInput): ComputeGizmoMagnetsOutput {
  const {
    isMultiConnector,
    isSingleConnector,
    connectorNodes,
    hasExistingConnection,
    connectedConnectors,
    userPendingSourceMagnet,
    userPendingTargetMagnet,
    is3PlusNodes,
    startNodeId,
    multiNodeConnectors,
  } = input;

  function resolveSideStates(
    magnets: MagnetPosition[],
    userPending: MagnetPosition | null | undefined
  ): GizmoSideResult {
    const magnetStates: Record<MagnetPosition, GizmoMagnetVisualState> = {
      TOP: 'default',
      RIGHT: 'default',
      BOTTOM: 'default',
      LEFT: 'default',
    };

    const total = magnets.length;
    const uniqueUsed = Array.from(new Set(magnets));

    // 1. 각 magnet 위치별 연결된 Connector 개수 독립 집계
    // 0개 -> default, 1개 -> active, 2개 이상 -> mixed
    const magnetCounts: Record<MagnetPosition, number> = {
      TOP: 0,
      RIGHT: 0,
      BOTTOM: 0,
      LEFT: 0,
    };
    magnets.forEach((mag) => {
      magnetCounts[mag] = (magnetCounts[mag] || 0) + 1;
    });

    ALL_MAGNETS.forEach((mag) => {
      const count = magnetCounts[mag];
      if (count >= 2) {
        magnetStates[mag] = 'mixed';
      } else if (count === 1) {
        magnetStates[mag] = 'active';
      } else {
        magnetStates[mag] = 'default';
      }
    });

    const drafted = showDraftOnly(magnetStates, userPending);

    return {
      magnetStates,
      usedMagnets: drafted && userPending ? [userPending] : uniqueUsed,
      totalConnections: total,
    };
  }

  function resolveMoreSideStates(
    incomingMags: MagnetPosition[],
    outgoingMags: MagnetPosition[],
    userPending: MagnetPosition | null | undefined
  ): GizmoSideResult {
    const magnetStates = blankMagnetStates();

    const outgoingCounts: Record<MagnetPosition, number> = {
      TOP: 0,
      RIGHT: 0,
      BOTTOM: 0,
      LEFT: 0,
    };
    outgoingMags.forEach((mag) => {
      outgoingCounts[mag] = (outgoingCounts[mag] || 0) + 1;
    });

    const incomingSet = new Set(incomingMags);

    ALL_MAGNETS.forEach((mag) => {
      const outCount = outgoingCounts[mag];
      const hasIn = incomingSet.has(mag);

      if (outCount >= 2 || (outCount >= 1 && hasIn)) {
        // 나가는 연결이 2개 이상이거나, 나가는 연결과 들어오는 연결이 공존하는 경우 -> Mixed
        magnetStates[mag] = 'mixed';
      } else if (outCount === 1) {
        // 나가는 연결이 1개이고 들어오는 연결이 없는 경우 -> 다음 연결 방향 Active
        magnetStates[mag] = 'active';
      } else if (hasIn) {
        // 들어오는 이전 연결만 있는 경우 -> 기존 연결 상태 Mixed
        magnetStates[mag] = 'mixed';
      } else {
        magnetStates[mag] = 'default';
      }
    });

    const drafted = showDraftOnly(magnetStates, userPending);
    const allUsed = Array.from(new Set([...incomingMags, ...outgoingMags]));

    return {
      magnetStates,
      usedMagnets: drafted && userPending ? [userPending] : allUsed,
      totalConnections: incomingMags.length + outgoingMags.length,
    };
  }

  // 3+ 노드 선택 분기
  if (is3PlusNodes) {
    const startMags: MagnetPosition[] = [];
    const endMags: MagnetPosition[] = [];

    const conns = multiNodeConnectors || [];

    if (startNodeId) {
      // 1. Start 카드 (Node 1): startNodeId에서 나가는 sourceMagnet 수집
      const startSourceConns = conns.filter((c) => c.sourceId === startNodeId && c.sourceMagnet);
      const startTargetConns = conns.filter((c) => c.targetId === startNodeId && c.targetMagnet);

      if (startSourceConns.length > 0) {
        startSourceConns.forEach((c) => {
          if (c.sourceMagnet) startMags.push(c.sourceMagnet);
        });
      } else if (startTargetConns.length > 0) {
        // source 연결이 없고 target 연결만 있는 경우
        startTargetConns.forEach((c) => {
          if (c.targetMagnet) startMags.push(c.targetMagnet);
        });
      }

      // 2. End / More 카드: 나머지 Node들에 해당하는 실제 Connector 방향 수집
      conns.forEach((conn) => {
        if (conn.targetId !== startNodeId && conn.targetMagnet) {
          endMags.push(conn.targetMagnet);
        }
        if (conn.sourceId !== startNodeId && conn.sourceMagnet) {
          endMags.push(conn.sourceMagnet);
        }
      });
    } else {
      // startNodeId가 없는 경우 fallback
      conns.forEach((conn) => {
        if (conn.sourceMagnet) startMags.push(conn.sourceMagnet);
        if (conn.targetMagnet) endMags.push(conn.targetMagnet);
      });
    }

    // 3+ Node 전용 그룹 상태 해석 함수:
    // - 연결 방향 종류 기준 (uniqueUsed.length):
    //   - 0개: 모든 방향 default
    //   - 방향이 1개로 통일된 경우 (중복 개수 무관): 해당 방향 active
    //   - 방향이 2개 이상으로 흩어진 경우: 연결된 모든 방향 mixed
    function resolve3PlusGroupStates(
      magnets: MagnetPosition[],
      userPending: MagnetPosition | null | undefined
    ): GizmoSideResult {
      const magnetStates = blankMagnetStates();

      const total = magnets.length;
      const uniqueUsed = Array.from(new Set(magnets));

      if (uniqueUsed.length === 1) {
        // 방향이 1개로 통일된 경우 (커넥터 개수 상관없이 모두 같은 방향) -> 해당 방향 active
        const onlyMag = uniqueUsed[0];
        if (onlyMag) {
          magnetStates[onlyMag] = 'active';
        }
      } else if (uniqueUsed.length >= 2) {
        // 방향이 2개 이상으로 흩어진 경우 -> 연결이 존재하는 모든 방향 mixed
        uniqueUsed.forEach((mag) => {
          magnetStates[mag] = 'mixed';
        });
      }

      const drafted = showDraftOnly(magnetStates, userPending);

      return {
        magnetStates,
        usedMagnets: drafted && userPending ? [userPending] : uniqueUsed,
        totalConnections: total,
      };
    }

    return {
      start: resolve3PlusGroupStates(startMags, userPendingSourceMagnet),
      end: resolve3PlusGroupStates(endMags, userPendingTargetMagnet),
    };
  }

  // Connector 선택 전용 그룹 상태 계산 함수:
  // - Start와 End를 각각 하나의 그룹으로 판단
  // - 연결 방향 종류 기준 (uniqueUsed.length):
  //   - 0개: 모든 방향 default
  //   - 방향이 1개로 통일된 경우 (중복 개수 무관): 해당 방향 active
  //   - 방향이 2개 이상으로 흩어진 경우: 연결된 모든 방향 mixed
  function resolveMultiConnectorStates(
    magnets: MagnetPosition[],
    userPending: MagnetPosition | null | undefined
  ): GizmoSideResult {
    const magnetStates = blankMagnetStates();

    const total = magnets.length;
    const uniqueUsed = Array.from(new Set(magnets));

    if (uniqueUsed.length === 1) {
      // 방향이 1개로 통일된 경우 (커넥터 개수 상관없이 모두 같은 방향) -> 해당 방향 active
      const singleMag = uniqueUsed[0];
      if (singleMag) {
        magnetStates[singleMag] = 'active';
      }
    } else if (uniqueUsed.length >= 2) {
      // 방향이 2개 이상으로 흩어진 경우 -> 연결이 존재하는 모든 방향 mixed
      uniqueUsed.forEach((mag) => {
        magnetStates[mag] = 'mixed';
      });
    }

    const drafted = showDraftOnly(magnetStates, userPending);

    return {
      magnetStates,
      usedMagnets: drafted && userPending ? [userPending] : uniqueUsed,
      totalConnections: total,
    };
  }

  let startMags: MagnetPosition[] = [];
  let endMags: MagnetPosition[] = [];

  if (isMultiConnector || isSingleConnector) {
    // Connector 직접 선택 경로 (1개 또는 2개 이상)
    const conns = (connectorNodes || []).filter((n) => n && n.isConnector);
    conns.forEach((c) => {
      if (c.connectorSourceMagnet) startMags.push(c.connectorSourceMagnet as MagnetPosition);
      if (c.connectorTargetMagnet) endMags.push(c.connectorTargetMagnet as MagnetPosition);
    });

    return {
      start: resolveMultiConnectorStates(startMags, userPendingSourceMagnet),
      end: resolveMultiConnectorStates(endMags, userPendingTargetMagnet),
    };
  } else if (hasExistingConnection && connectedConnectors && connectedConnectors.length > 0) {
    // 2-Node 선택 경로: 선택된 두 노드 사이의 직결 커넥터 목록(connectedConnectors) 기준
    connectedConnectors.forEach((conn) => {
      const isRev = Boolean(conn.isReversed);
      const uiStart = isRev ? conn.targetMagnet : conn.sourceMagnet;
      const uiEnd = isRev ? conn.sourceMagnet : conn.targetMagnet;
      if (uiStart) startMags.push(uiStart);
      if (uiEnd) endMags.push(uiEnd);
    });
  }

  return {
    start: resolveSideStates(startMags, userPendingSourceMagnet),
    end: resolveSideStates(endMags, userPendingTargetMagnet),
  };
}

export interface GizmoSideMagnets {
  start: MagnetPosition[];
  end: MagnetPosition[];
}

/** computeGizmoMagnets와 같은 endpoint 그룹의 Current magnet 목록. */
export function collectGizmoSideMagnets(input: ComputeGizmoMagnetsInput): GizmoSideMagnets {
  const {
    isMultiConnector,
    isSingleConnector,
    connectorNodes,
    hasExistingConnection,
    connectedConnectors,
    is3PlusNodes,
    startNodeId,
    multiNodeConnectors,
  } = input;

  const start: MagnetPosition[] = [];
  const end: MagnetPosition[] = [];

  if (is3PlusNodes) {
    const conns = multiNodeConnectors || [];
    if (startNodeId) {
      const startSourceConns = conns.filter((c) => c.sourceId === startNodeId && c.sourceMagnet);
      const startTargetConns = conns.filter((c) => c.targetId === startNodeId && c.targetMagnet);
      if (startSourceConns.length > 0) {
        startSourceConns.forEach((c) => {
          if (c.sourceMagnet) start.push(c.sourceMagnet);
        });
      } else {
        startTargetConns.forEach((c) => {
          if (c.targetMagnet) start.push(c.targetMagnet);
        });
      }
      conns.forEach((conn) => {
        if (conn.targetId !== startNodeId && conn.targetMagnet) end.push(conn.targetMagnet);
        if (conn.sourceId !== startNodeId && conn.sourceMagnet) end.push(conn.sourceMagnet);
      });
    } else {
      conns.forEach((conn) => {
        if (conn.sourceMagnet) start.push(conn.sourceMagnet);
        if (conn.targetMagnet) end.push(conn.targetMagnet);
      });
    }
    return { start, end };
  }

  if (isMultiConnector || isSingleConnector) {
    (connectorNodes || []).filter((n) => n && n.isConnector).forEach((c) => {
      if (c.connectorSourceMagnet) start.push(c.connectorSourceMagnet as MagnetPosition);
      if (c.connectorTargetMagnet) end.push(c.connectorTargetMagnet as MagnetPosition);
    });
    return { start, end };
  }

  if (hasExistingConnection && connectedConnectors && connectedConnectors.length > 0) {
    connectedConnectors.forEach((conn) => {
      const isRev = Boolean(conn.isReversed);
      const uiStart = isRev ? conn.targetMagnet : conn.sourceMagnet;
      const uiEnd = isRev ? conn.sourceMagnet : conn.targetMagnet;
      if (uiStart) start.push(uiStart);
      if (uiEnd) end.push(uiEnd);
    });
  }

  return { start, end };
}

export function isGizmoDraftDirty(input: ComputeGizmoMagnetsInput): boolean {
  const sides = collectGizmoSideMagnets(input);
  return isEndpointMagnetDraftDirty(sides.start, input.userPendingSourceMagnet)
    || isEndpointMagnetDraftDirty(sides.end, input.userPendingTargetMagnet);
}

export interface EndpointMagnetPatch {
  id: string;
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
  isReversed?: boolean;
}

/**
 * Draft가 Current와 다른 endpoint만 갱신 패치로 만든다.
 * 2노드/커넥터 선택은 UI 마그넷 + isReversed, 3+ 노드는 물리 source/target이다.
 */
export function buildEndpointMagnetPatches(input: ComputeGizmoMagnetsInput): EndpointMagnetPatch[] {
  const sourceDraft = input.userPendingSourceMagnet || undefined;
  const targetDraft = input.userPendingTargetMagnet || undefined;
  const sides = collectGizmoSideMagnets(input);
  const writeSource = Boolean(sourceDraft && isEndpointMagnetDraftDirty(sides.start, sourceDraft));
  const writeTarget = Boolean(targetDraft && isEndpointMagnetDraftDirty(sides.end, targetDraft));
  if (!writeSource && !writeTarget) return [];

  if (input.isSingleConnector || input.isMultiConnector) {
    return (input.connectorNodes || [])
      .filter((n) => n && n.isConnector && n.id)
      .map((n) => {
        const patch: EndpointMagnetPatch = {
          id: n.id as string,
          isReversed: Boolean(n.connectorIsReversed),
        };
        if (writeSource && sourceDraft) patch.sourceMagnet = sourceDraft;
        if (writeTarget && targetDraft) patch.targetMagnet = targetDraft;
        return patch;
      });
  }

  if (!input.is3PlusNodes && input.hasExistingConnection && input.connectedConnectors) {
    return input.connectedConnectors
      .filter((conn) => conn.id)
      .map((conn) => {
        const patch: EndpointMagnetPatch = {
          id: conn.id as string,
          isReversed: Boolean(conn.isReversed),
        };
        if (writeSource && sourceDraft) patch.sourceMagnet = sourceDraft;
        if (writeTarget && targetDraft) patch.targetMagnet = targetDraft;
        return patch;
      });
  }

  if (input.is3PlusNodes) {
    const conns = input.multiNodeConnectors || [];
    const startNodeId = input.startNodeId;
    const byId = new Map<string, EndpointMagnetPatch>();
    const touch = (id: string) => {
      let patch = byId.get(id);
      if (!patch) {
        patch = { id };
        byId.set(id, patch);
      }
      return patch;
    };

    if (startNodeId) {
      const startSourceConns = conns.filter((c) => c.sourceId === startNodeId && c.sourceMagnet && c.id);
      const startTargetConns = conns.filter((c) => c.targetId === startNodeId && c.targetMagnet && c.id);
      const startIsTargetSide = startSourceConns.length === 0 && startTargetConns.length > 0;
      if (writeSource && sourceDraft) {
        const group = startIsTargetSide ? startTargetConns : startSourceConns;
        group.forEach((conn) => {
          const patch = touch(conn.id as string);
          if (startIsTargetSide) patch.targetMagnet = sourceDraft;
          else patch.sourceMagnet = sourceDraft;
        });
      }
      if (writeTarget && targetDraft) {
        conns.forEach((conn) => {
          if (!conn.id) return;
          if (conn.targetId !== startNodeId && conn.targetMagnet) {
            touch(conn.id).targetMagnet = targetDraft;
          }
          if (conn.sourceId !== startNodeId && conn.sourceMagnet) {
            touch(conn.id).sourceMagnet = targetDraft;
          }
        });
      }
    }

    return Array.from(byId.values());
  }

  return [];
}
