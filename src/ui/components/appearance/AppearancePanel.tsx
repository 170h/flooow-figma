import React from 'react';
import { SizeSection } from './SizeSection';
import { StyleSection } from './StyleSection';
import { ElevationSection } from './ElevationSection';

/**
 * Appearance 탭 내용 - Size + Style + Elevation
 */
export function AppearancePanel(_props?: any) {
  return (
    <>
      <SizeSection />
      <hr className="section-divider" />
      <StyleSection />
      <hr className="section-divider" />
      <ElevationSection />
    </>
  );
}
