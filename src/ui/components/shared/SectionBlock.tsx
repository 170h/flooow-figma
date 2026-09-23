import React from 'react';

interface SectionBlockProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * 섹션 컨테이너 - 피그마 UI3 section-block 래퍼
 */
export function SectionBlock({ id, className, children }: SectionBlockProps) {
  return (
    <div id={id} className={`section-block${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
