import { useEffect, useRef } from 'react';
import { useApp, NodeInfo } from '../context/AppContext';
import { normalizeNodeType } from '../../types';

/**
 * Figma 플러그인 → UI 방향 메시지 처리 훅
 * window.onmessage로 수신된 pluginMessage를 파싱하여 AppContext 상태를 업데이트한다.
 */
export function useFigmaMessage() {
  const {
    handleSelectionChange,
    setCurrentTab,
    setUIState,
    setNodeOptionState,
    setDesignFrames,
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

          // 노드 속성 복원 (플러그인으로 생성된 플로우 노드에 대해서만 허용)
          if (nodes && nodes.length === 1) {
            const node = nodes[0] as NodeInfo;

            if (node.isFlowNode) {
              // 노드 선택 대상이 실제로 변경되었을 때만 상태 복원
              if (isDifferentNode) {
                const hasDesc = Boolean(node.description && node.description.trim());
                setNodeOptionState({ descriptionOn: hasDesc });

                // 상태(status) 복원
                const currentStatus = node.status || msg.currentStatus;
                if (currentStatus) {
                  setNodeOptionState({ statusOn: true, status: currentStatus });
                } else {
                  setNodeOptionState({ statusOn: false });
                }

                // Figma Screen Link 복원 (스크린 노드만 허용)
                const nodeTypeVal = node.flowNodeType || (node.nodeType === 'FRAME' ? 'Screen' : node.nodeType);
                const isScreen = normalizeNodeType(nodeTypeVal) === 'Screen';
                const figmaLink = (isScreen && node.figmaLink) || '';
                if (figmaLink) {
                  setNodeOptionState({ singleLinkOn: true, singleLinkUrl: figmaLink });
                } else {
                  setNodeOptionState({ singleLinkOn: false, singleLinkUrl: '' });
                }
              }
              const nodeTypeVal = node.flowNodeType || (node.nodeType === 'FRAME' ? 'Screen' : node.nodeType);
              if (nodeTypeVal) {
                setNodeOptionState({ nodeType: normalizeNodeType(nodeTypeVal) });
              }
            }
          }
          break;
        }

        case 'INIT_DONE':
        case 'READY': {
          // 초기화 완료 후 처리 (필요 시 확장)
          break;
        }

        case 'DESIGN_FRAMES_LOADED': {
          setDesignFrames(msg.frames || []);
          break;
        }

        case 'SWITCH_TAB': {
          if (msg.tab) setCurrentTab(msg.tab);
          break;
        }

        default:
          break;
      }
    };

    handlerRef.current = handler;
    window.addEventListener('message', handler);

    // 플러그인 초기화 메시지 전송
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('nodes') === '2') {
      // 개발 테스트 모드
    } else {
      parent.postMessage({ pluginMessage: { type: 'INIT' } }, '*');
    }

    return () => {
      window.removeEventListener('message', handler);
    };
  }, [handleSelectionChange, setCurrentTab, setUIState, setNodeOptionState]);
}
