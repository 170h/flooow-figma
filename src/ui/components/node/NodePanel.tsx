import React from 'react';
import { PhaseSection } from './PhaseSection';
import { TypeSection } from './TypeSection';
import { DescriptionSection } from './DescriptionSection';
import { FigmaLinkSection } from './FigmaLinkSection';
import { StatusSection } from '../appearance/StatusSection';

/**
 * Node 탭 내용 - Phase + Type + Description + Status + Figma Screen Link
 */
export function NodePanel(_props?: any) {
  return (
    <>
      <PhaseSection />
      <hr className="section-divider" />
      <TypeSection />
      <hr className="section-divider" />
      <DescriptionSection />
      <hr className="section-divider" />
      <StatusSection />
      <hr className="section-divider" />
      <FigmaLinkSection />
    </>
  );
}

