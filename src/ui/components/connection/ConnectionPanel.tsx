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
      if (anchorBox) anchorBox.style.display = 'none';
    } else {
      if (anchorBox) anchorBox.style.display = '';

      if (count >= 2) {
        const node1Text = document.getElementById('preview-node-1-text');
        const node2Text = document.getElementById('preview-node-2-text');
        if (node1Text) node1Text.textContent = selectedNodes[0]?.title || selectedNodes[0]?.name || 'Node 1';
        if (node2Text) node2Text.textContent = selectedNodes[1]?.title || selectedNodes[1]?.name || 'Node 2';
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


