import React from 'react';

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  'data-tooltip'?: string;
}

/**
 * 피그마 UI3 스타일 토글 스위치
 */
export function Switch({ id, checked, onChange, ...props }: SwitchProps) {
  return (
    <label className="figma-switch" htmlFor={id} {...props}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="figma-switch-track" />
    </label>
  );
}
