import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { resolveAppLocale, setAppLocale } from '../../i18n';

/**
 * Figma 플러그인 → UI 방향 메시지 처리 훅
 * window.onmessage로 수신된 pluginMessage를 파싱하여 AppContext 상태를 업데이트한다.
 */
export function useFigmaMessage() {
  const {
    handleSelectionChange,
    setUIState,
    setDesignFrames,
    setFlooowUsage,
  } = useApp();

  const handlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const prevNodeIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'SELECTION_CHANGED': {
          const {
            count,
            nodes,
            meta,
            suggestedSourceMagnet,
            suggestedTargetMagnet,
            existingSourceMagnets,
            existingTargetMagnets,
            connectedConnectorCount,
            hasExistingConnection,
            connectedConnectorIds,
            orderedNodeIds,
            chainTotalPairs,
            chainConnectedPairs,
            chainMissingPairs,
          } = msg;
          handleSelectionChange(count || 0, nodes || [], meta || {});

          const isConn = (meta?.connectorCount || 0) > 0 || (nodes && nodes.some((n: any) => n?.isConnector));
          const is3Plus = Boolean(nodes && nodes.length >= 3 && !isConn);
          const hasConnected = is3Plus
            ? Boolean(hasExistingConnection)
            : Boolean(hasExistingConnection || (connectedConnectorCount || 0) > 0);

          const currentSelectionKey = (nodes || []).map((n: any) => n?.id).sort().join(',');
          const isDifferentNode = currentSelectionKey !== prevNodeIdRef.current;
          prevNodeIdRef.current = currentSelectionKey;

          // 커넥터 선택 또는 이미 연결된 커넥터가 있는 경우: 기존 마그넷 복원
          if (isConn || hasConnected) {
            setUIState({
              hasExistingConnection: hasConnected,
              connectedConnectorIds: connectedConnectorIds || [],
              connectedConnectors: msg.connectedConnectors || [],
              existingSourceMagnets: existingSourceMagnets || [],
              existingTargetMagnets: existingTargetMagnets || [],
              sourceMagnet: suggestedSourceMagnet || null,
              targetMagnet: suggestedTargetMagnet || null,
              orderedNodeIds: orderedNodeIds || undefined,
              chainTotalPairs: chainTotalPairs !== undefined ? chainTotalPairs : undefined,
              chainConnectedPairs: chainConnectedPairs !== undefined ? chainConnectedPairs : undefined,
              chainMissingPairs: chainMissingPairs !== undefined ? chainMissingPairs : undefined,
              multiNodeConnectors: msg.multiNodeConnectors || [],
            });
          } else if (isDifferentNode) {
            // 연결 없는 노드 선택 변경 시: 마그넷 미선택(null)으로 초기화
            setUIState({
              hasExistingConnection: false,
              connectedConnectorIds: [],
              connectedConnectors: [],
              existingSourceMagnets: [],
              existingTargetMagnets: [],
              sourceMagnet: null,
              targetMagnet: null,
              orderedNodeIds: orderedNodeIds || undefined,
              chainTotalPairs: chainTotalPairs !== undefined ? chainTotalPairs : undefined,
              chainConnectedPairs: chainConnectedPairs !== undefined ? chainConnectedPairs : undefined,
              chainMissingPairs: chainMissingPairs !== undefined ? chainMissingPairs : undefined,
              multiNodeConnectors: msg.multiNodeConnectors || [],
            });
          } else {
            // 동일 노드 유지 상태에서 연결/체인 정보만 동기화
            setUIState({
              hasExistingConnection: false,
              orderedNodeIds: orderedNodeIds || undefined,
              chainTotalPairs: chainTotalPairs !== undefined ? chainTotalPairs : undefined,
              chainConnectedPairs: chainConnectedPairs !== undefined ? chainConnectedPairs : undefined,
              chainMissingPairs: chainMissingPairs !== undefined ? chainMissingPairs : undefined,
              multiNodeConnectors: msg.multiNodeConnectors !== undefined ? msg.multiNodeConnectors : undefined,
            });
          }

          break;
        }

        case 'DESIGN_FRAMES_LOADED': {
          setDesignFrames(msg.frames || []);
          break;
        }

        case 'FLOOOW_USAGE': {
          if (msg.usage) setFlooowUsage(msg.usage);
          break;
        }

        default:
          // 알 수 없는 메시지 무음 폐기 방지 — 정상 흐름에서는 도달하지 않음
          console.warn('알 수 없는 Core 메시지:', (msg as { type?: string })?.type);
          break;
      }
    };

    handlerRef.current = handler;
    window.addEventListener('message', handler);

    // 플러그인 초기화 메시지 전송 (UI 로케일 포함)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('nodes') === '2') {
      // 개발 테스트 모드
    } else {
      parent.postMessage({ pluginMessage: { type: 'INIT', locale: setAppLocale(resolveAppLocale(navigator.language)) } }, '*');
      // 초기 usage 1회 조회 (이후 생성 시 Core가 자동 push, polling 없음)
      parent.postMessage({ pluginMessage: { type: 'GET_FLOOOW_USAGE' } }, '*');
    }

    return () => {
      window.removeEventListener('message', handler);
    };
  }, [handleSelectionChange, setUIState, setFlooowUsage]);
}
