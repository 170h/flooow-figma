import React from 'react';
import { ConnectSection } from './ConnectSection';
import { LabelSection } from './LabelSection';

/**
 * Connection 탭 내용
 * 기즈모 카드의 타이틀과 타입은 ConnectSection이 선택 상태로부터 렌더한다.
 */
export function ConnectionPanel(_props?: any) {
  return (
    <div id="conn-multi-mode" style={{ display: 'flex', flexDirection: 'column' }}>
      <ConnectSection />
      <hr className="section-divider" id="conn-link-divider" />
      <LabelSection />
    </div>
  );
}
