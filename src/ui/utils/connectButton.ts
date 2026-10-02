export interface ConnectButtonInput {
  nodeCount: number;              // 선택된 노드 수
  isAllConnectors: boolean;       // 커넥터만 선택된 상태인가
  connectorCount: number;         // 선택된 커넥터 수 (isAllConnectors 일 때 의미)
  hasStart: boolean;              // Start 기즈모 선택 여부
  hasEnd: boolean;                // End 기즈모 선택 여부
  hasExistingConnection: boolean; // 2노드: 두 노드 사이 기존 연결 존재
  chainMissingPairs?: number;     // 3+ : 연결 안 된 인접 쌍 수
  chainConnectedPairs?: number;   // 3+ : 연결된 인접 쌍 수
}

export type ConnectButtonKind = 'NONE' | 'CONNECT' | 'CONNECTED' | 'UPDATE';

export interface ConnectButtonState {
  kind: ConnectButtonKind;
  label: string;
  enabled: boolean;
  hint?: string;
}

/**
 * Connect 버튼 상태 및 라벨을 결정하는 순수 함수
 *
 * 규칙 (위에서 아래로 처음 일치하는 것을 반환):
 * 1. isAllConnectors === true -> UPDATE, connectorCount === 1 ? 'Update Connector' : 'Update Connectors', enabled: true
 * 2. nodeCount < 2 -> NONE, 'Connect', enabled: false
 * 3. nodeCount === 2 && hasExistingConnection -> CONNECTED, 'Connected', enabled: false
 * 4. nodeCount === 2 -> CONNECT, 'Connect', enabled: hasStart && hasEnd
 * 5. nodeCount >= 3 && typeof chainMissingPairs !== 'number' -> NONE, 'Connect', enabled: false
 * 6. nodeCount >= 3 && chainMissingPairs > 0 -> CONNECT, `Connect (${chainMissingPairs})`, enabled: true, hint: chainConnectedPairs > 0 ? `${chainConnectedPairs} already connected` : undefined
 * 7. nodeCount >= 3 (chainMissingPairs === 0) -> CONNECTED, 'Connected', enabled: false
 */
export function getConnectButton(input: ConnectButtonInput): ConnectButtonState {
  // 1. isAllConnectors === true
  if (input.isAllConnectors === true) {
    return {
      kind: 'UPDATE',
      label: input.connectorCount === 1 ? 'Update Connector' : 'Update Connectors',
      enabled: true,
    };
  }

  // 2. nodeCount < 2
  if (input.nodeCount < 2) {
    return {
      kind: 'NONE',
      label: 'Connect',
      enabled: false,
    };
  }

  // 3. nodeCount === 2 && hasExistingConnection
  if (input.nodeCount === 2 && input.hasExistingConnection) {
    return {
      kind: 'CONNECTED',
      label: 'Connected',
      enabled: false,
    };
  }

  // 4. nodeCount === 2
  if (input.nodeCount === 2) {
    return {
      kind: 'CONNECT',
      label: 'Connect',
      enabled: Boolean(input.hasStart && input.hasEnd),
    };
  }

  // nodeCount >= 3 판정
  const missing = input.chainMissingPairs;
  const isMissingNumber = typeof missing === 'number' && !Number.isNaN(missing);

  // 5. nodeCount >= 3 && chainMissingPairs 가 숫자가 아님(undefined/NaN)
  if (!isMissingNumber) {
    return {
      kind: 'NONE',
      label: 'Connect',
      enabled: false,
    };
  }

  // 6. nodeCount >= 3 && chainMissingPairs > 0
  if (missing > 0) {
    const connected = input.chainConnectedPairs;
    const hasConnectedPairs = typeof connected === 'number' && !Number.isNaN(connected) && connected > 0;
    const hint = hasConnectedPairs ? `${connected} already connected` : undefined;

    return {
      kind: 'CONNECT',
      label: `Connect (${missing})`,
      enabled: true,
      ...(hint ? { hint } : {}),
    };
  }

  // 7. nodeCount >= 3 (chainMissingPairs === 0)
  return {
    kind: 'CONNECTED',
    label: 'Connected',
    enabled: false,
  };
}
