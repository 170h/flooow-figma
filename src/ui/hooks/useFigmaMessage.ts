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
    setLastNodeConfig,
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

            if (node.isFlowNode || (!node.isConnector && (node.flowNodeType || node.nodeType === 'FRAME'))) {
              // Node 탭 관련
              const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
              const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;

              // 노드 선택 대상이 실제로 변경되었을 때만 텍스트 및 토글 상태를 덮어씀
              if (isDifferentNode) {
                const hasDesc = Boolean(node.description && node.description.trim());
                const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
                if (descToggleEl) descToggleEl.checked = hasDesc;
                if (titleEl) titleEl.value = (node.title || node.name || 'Untitled').slice(0, 32);
                if (descEl) descEl.value = node.description || '';
                setLastNodeConfig({ descriptionOn: hasDesc });

                // 상태(status) 복원
                const currentStatus = node.status || msg.currentStatus;
                if (currentStatus) {
                  setUIState({ selectedStatus: currentStatus });
                  setLastNodeConfig({ status: currentStatus, statusOn: true });
                } else {
                  setLastNodeConfig({ statusOn: false });
                }

                // Figma Screen Link 복원 (스크린 노드만 허용)
                const nodeTypeVal = node.flowNodeType || (node.nodeType === 'FRAME' ? 'Screen' : node.nodeType);
                const isScreen = normalizeNodeType(nodeTypeVal) === 'Screen';
                const figmaLink = (isScreen && node.figmaLink) || '';
                if (figmaLink) {
                  setLastNodeConfig({ singleLinkOn: true, singleLinkUrl: figmaLink });
                  const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
                  if (linkToggleEl) linkToggleEl.checked = true;
                  const linkUrlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
                  if (linkUrlEl) linkUrlEl.value = figmaLink;
                } else {
                  setLastNodeConfig({ singleLinkOn: false, singleLinkUrl: '' });
                  const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
                  if (linkToggleEl) linkToggleEl.checked = false;
                  const linkUrlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
                  if (linkUrlEl) linkUrlEl.value = '';
                }
              }
              const nodeTypeVal = node.flowNodeType || (node.nodeType === 'FRAME' ? 'Screen' : node.nodeType);
              if (nodeTypeVal) {
                setUIState({ selectedNodeType: normalizeNodeType(nodeTypeVal) });
              }

              const fixedValEl = document.getElementById('size-mode-val-fixed');
              const hugValEl = document.getElementById('size-mode-val-hug');
              if (fixedValEl && node.height) fixedValEl.textContent = String(node.height);
              if (hugValEl && node.hugHeight) hugValEl.textContent = String(node.hugHeight);
            } else if (!node.isFlowNode && !node.isConnector) {
              const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
              if (titleEl) titleEl.value = 'Figjam object';
            }
          } else if (!nodes || nodes.length === 0) {
            // 선택 해제 시 (새로운 노드 생성 대기 모드): 실제로 선택이 해제된 순간에 디폴트 값으로 완전 리셋
            if (isDifferentNode) {
              const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
              const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
              const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
              const fixedValEl = document.getElementById('size-mode-val-fixed');
              const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
              const linkUrlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;

              if (titleEl) titleEl.value = 'Screen';
              if (descEl) descEl.value = '';
              if (descToggleEl) descToggleEl.checked = false;
              if (fixedValEl) fixedValEl.textContent = '90';
              if (linkToggleEl) linkToggleEl.checked = false;
              if (linkUrlEl) linkUrlEl.value = '';

              setLastNodeConfig({
                nodeType: 'Screen',
                width: 250,
                height: 90,
                cornerRadius: 0,
                sizeMode: 'hug',
                descriptionOn: false,
                singleLinkOn: false,
                singleLinkUrl: '',
              });
              setUIState({ selectedNodeType: 'Screen' });
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
  }, [handleSelectionChange, setCurrentTab, setUIState, setLastNodeConfig]);
}
