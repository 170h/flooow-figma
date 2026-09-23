import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FigmaLinkSection } from './FigmaLinkSection';
import { ConnectSection } from './ConnectSection';
import { LabelSection } from './LabelSection';
import { LinkSection } from './LinkSection';

/**
 * Connection 탭 내용
 * (section 래퍼는 App.tsx에서 관리)
 *
 * 표시 규칙:
 * - 커넥터 선택 or 다중 선택 → conn-multi-mode (Connect + Label + Link)
 * - 단일 노드 or 0개 → conn-single-mode (Figma Screen Link)
 */
export function ConnectionPanel(_props?: any) {
  const { selectedNodes } = useApp();

  const count = selectedNodes.length;
  const allConnectors = count > 0 && selectedNodes.every(n => n && n.isConnector);
  const isSingleConn = count === 1 && allConnectors;
  const isMultiConn = count >= 2 && allConnectors;

  // 커넥터 단일 선택 or 다중 선택 or 2개 이상 노드 → multi mode
  const isMultiMode = isSingleConn || isMultiConn || count >= 2;

  // 커넥터 단일 선택 시 anchorPreviewBox, link/label 섹션 표시 제어
  useEffect(() => {
    const anchorBox = document.getElementById('conn-anchor-preview-box');
    const linkDivider = document.getElementById('conn-link-divider');
    const linkSection = document.getElementById('conn-link-section-block');

    if (isSingleConn) {
      if (anchorBox) anchorBox.style.display = '';
      if (linkDivider) linkDivider.style.display = 'none';
      if (linkSection) linkSection.style.display = 'none';

      const node = selectedNodes[0];
      const node1Text = document.getElementById('preview-node-1-text');
      const node2Text = document.getElementById('preview-node-2-text');
      if (node1Text) node1Text.textContent = node?.connectorSourceNodeName || 'Source Node';
      if (node2Text) node2Text.textContent = node?.connectorTargetNodeName || 'Target Node';
    } else if (isMultiConn) {
      if (anchorBox) anchorBox.style.display = 'none';
      if (linkDivider) linkDivider.style.display = '';
      if (linkSection) linkSection.style.display = '';
    } else {
      if (anchorBox) anchorBox.style.display = '';
      if (linkDivider) linkDivider.style.display = '';
      if (linkSection) linkSection.style.display = '';

      if (count >= 2) {
        const node1Text = document.getElementById('preview-node-1-text');
        const node2Text = document.getElementById('preview-node-2-text');
        if (node1Text) node1Text.textContent = selectedNodes[0]?.title || selectedNodes[0]?.name || 'Node 1';
        if (node2Text) node2Text.textContent = selectedNodes[1]?.title || selectedNodes[1]?.name || 'Node 2';
      }
    }
  }, [isSingleConn, isMultiConn, count, selectedNodes]);

  return (
    <>
      {/* 단일 노드 or 0개: Figma Screen Link */}
      {!isMultiMode && (
        <div id="conn-single-mode" className="section-block">
          <FigmaLinkSection />
        </div>
      )}

      {/* 다중 선택 or 커넥터: Connect + Label + Link */}
      {isMultiMode && (
        <div id="conn-multi-mode" style={{ display: 'flex', flexDirection: 'column' }}>
          <ConnectSection />
          <hr className="section-divider" id="conn-link-divider" />
          <LabelSection />
          <hr className="section-divider" />
          <LinkSection />
        </div>
      )}
    </>
  );
}
