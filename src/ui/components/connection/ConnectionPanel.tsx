import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ConnectSection } from './ConnectSection';
import { LabelSection } from './LabelSection';

/**
 * Connection 탭 내용
 * (section 래퍼는 App.tsx에서 관리)
 */
export function ConnectionPanel(_props?: any) {
  const { selectedNodes } = useApp();

  const count = selectedNodes.length;
  const allConnectors = count > 0 && selectedNodes.every(n => n && n.isConnector);
  const isSingleConn = count === 1 && allConnectors;
  const isMultiConn = count >= 2 && allConnectors;

  // 커넥터 단일 선택 시 anchorPreviewBox 표시 제어
  useEffect(() => {
    const anchorBox = document.getElementById('conn-anchor-preview-box');

    if (isSingleConn) {
      if (anchorBox) anchorBox.style.display = '';

      const node = selectedNodes[0];
      const node1Text = document.getElementById('preview-node-1-text');
      const node2Text = document.getElementById('preview-node-2-text');
      if (node1Text) node1Text.textContent = node?.connectorSourceNodeName || 'Source Node';
      if (node2Text) node2Text.textContent = node?.connectorTargetNodeName || 'Target Node';
    } else if (isMultiConn) {
      if (anchorBox) anchorBox.style.display = '';

      const node1Text = document.getElementById('preview-node-1-text');
      const node2Text = document.getElementById('preview-node-2-text');

      // code.ts에서 캔버스 2D 공간 배치(위/왼쪽 우선)로 정렬된 전체 엔드포인트 노드명 목록
      const connNodeNames = Array.from(new Set(selectedNodes.flatMap((n) => n?.connectedNodeNames || [])));
      if (connNodeNames.length > 0) {
        if (node1Text) node1Text.textContent = connNodeNames[0] || 'Node 1';
        if (node2Text) {
          if (connNodeNames.length >= 3) {
            const moreCount = connNodeNames.length - 1;
            node2Text.textContent = `${moreCount} more ${moreCount === 1 ? 'node' : 'nodes'}`;
          } else if (connNodeNames.length === 2) {
            node2Text.textContent = connNodeNames[1] || 'Node 2';
          } else {
            node2Text.textContent = 'Node 2';
          }
        }
      } else {
        // fallback: 각 커넥터의 source/target 노드명 집합에서 시작 노드와 나머지 산출
        const uniqueNames: string[] = [];
        selectedNodes.forEach((n) => {
          if (n?.connectorSourceNodeName && !uniqueNames.includes(n.connectorSourceNodeName)) {
            uniqueNames.push(n.connectorSourceNodeName);
          }
          if (n?.connectorTargetNodeName && !uniqueNames.includes(n.connectorTargetNodeName)) {
            uniqueNames.push(n.connectorTargetNodeName);
          }
        });
        if (node1Text) node1Text.textContent = uniqueNames[0] || 'Node 1';
        if (node2Text) {
          if (uniqueNames.length >= 3) {
            const moreCount = uniqueNames.length - 1;
            node2Text.textContent = `${moreCount} more ${moreCount === 1 ? 'node' : 'nodes'}`;
          } else if (uniqueNames.length === 2) {
            node2Text.textContent = uniqueNames[1] || 'Node 2';
          } else {
            node2Text.textContent = 'Node 2';
          }
        }
      }
    } else {
      if (anchorBox) anchorBox.style.display = '';

      if (count >= 2) {
        const node1Text = document.getElementById('preview-node-1-text');
        const node2Text = document.getElementById('preview-node-2-text');
        if (node1Text) node1Text.textContent = selectedNodes[0]?.title || selectedNodes[0]?.name || 'Node 1';
        if (node2Text) {
          const effectiveCount = selectedNodes.length > 0 ? selectedNodes.length : count;
          if (effectiveCount >= 3) {
            const moreCount = effectiveCount - 1;
            node2Text.textContent = `${moreCount} more ${moreCount === 1 ? 'node' : 'nodes'}`;
          } else {
            node2Text.textContent = selectedNodes[1]?.title || selectedNodes[1]?.name || 'Node 2';
          }
        }
      }
    }
  }, [isSingleConn, isMultiConn, count, selectedNodes]);

  return (
    <div id="conn-multi-mode" style={{ display: 'flex', flexDirection: 'column' }}>
      <ConnectSection />
      <hr className="section-divider" id="conn-link-divider" />
      <LabelSection />
    </div>
  );
}


