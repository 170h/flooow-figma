export type MagnetPosition = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';

export type GizmoMagnetVisualState = 'default' | 'active' | 'mixed';

export interface ConnectedConnectorLike {
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
  isReversed?: boolean;
}

export interface ConnectorNodeLike {
  isConnector?: boolean;
  connectorSourceMagnet?: MagnetPosition | string;
  connectorTargetMagnet?: MagnetPosition | string;
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
 * 사용자가 명시적으로 클릭한 userPending 마그넷이 있는 경우 해당 위치는 active로 표시된다.
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

    // 2. 사용자가 기즈모를 명시적으로 클릭한 경우 (userPending)
    if (userPending) {
      magnetStates[userPending] = 'active';
    }

    return {
      magnetStates,
      usedMagnets: userPending ? Array.from(new Set([...uniqueUsed, userPending])) : uniqueUsed,
      totalConnections: total,
    };
  }

  function resolveMoreSideStates(
    incomingMags: MagnetPosition[],
    outgoingMags: MagnetPosition[],
    userPending: MagnetPosition | null | undefined
  ): GizmoSideResult {
    const magnetStates: Record<MagnetPosition, GizmoMagnetVisualState> = {
      TOP: 'default',
      RIGHT: 'default',
      BOTTOM: 'default',
      LEFT: 'default',
    };

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

    // 사용자가 기즈모를 명시적으로 클릭한 경우 (userPending)
    if (userPending) {
      magnetStates[userPending] = 'active';
    }

    const allUsed = Array.from(new Set([...incomingMags, ...outgoingMags]));

    return {
      magnetStates,
      usedMagnets: userPending ? Array.from(new Set([...allUsed, userPending])) : allUsed,
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
    // - 그룹 전체 연결 0개 -> 모든 방향 default
    // - 그룹 전체 연결 정확히 1개 -> 해당 방향만 active, 나머지 default
    // - 그룹 전체 연결 2개 이상 -> 연결이 존재하는 모든 방향을 mixed로 표시
    function resolve3PlusGroupStates(
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

      if (total === 1) {
        // 전체 연결이 정확히 1개 -> 해당 연결 방향만 active
        const onlyMag = magnets[0];
        if (onlyMag) {
          magnetStates[onlyMag] = 'active';
        }
      } else if (total >= 2) {
        // 전체 연결이 2개 이상 -> 연결이 존재하는 모든 방향을 mixed로 표시
        uniqueUsed.forEach((mag) => {
          magnetStates[mag] = 'mixed';
        });
      }

      // 사용자가 기즈모를 명시적으로 클릭한 경우 (userPending) 우선 반영
      if (userPending) {
        magnetStates[userPending] = 'active';
      }

      return {
        magnetStates,
        usedMagnets: userPending ? Array.from(new Set([...uniqueUsed, userPending])) : uniqueUsed,
        totalConnections: total,
      };
    }

    return {
      start: resolve3PlusGroupStates(startMags, userPendingSourceMagnet),
      end: resolve3PlusGroupStates(endMags, userPendingTargetMagnet),
    };
  }

  let startMags: MagnetPosition[] = [];
  let endMags: MagnetPosition[] = [];

  if (isMultiConnector || isSingleConnector) {
    // Connector 직접 선택 경로 (1개, 2개, 3개 이상)
    // 선택된 커넥터의 실제 엔드포인트 마그넷 기준
    const conns = (connectorNodes || []).filter((n) => n && n.isConnector);
    conns.forEach((c) => {
      if (c.connectorSourceMagnet) startMags.push(c.connectorSourceMagnet as MagnetPosition);
      if (c.connectorTargetMagnet) endMags.push(c.connectorTargetMagnet as MagnetPosition);
    });
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
