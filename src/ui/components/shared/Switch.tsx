import React, { useEffect, useRef } from 'react';

export interface SwitchProps {
  id: string;
  checked: boolean;
  isMixed?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  'data-tooltip'?: string;
  title?: string;
  className?: string;
}

/**
 * 피그마 UI3 공식 규격 토글 스위치 (W: 32px, H: 16px)
 * - On / Off / Mixed(Indeterminate) 3단 상태 완벽 지원
 * - 피그마 UI3 공식 디세이블 컬러(Off #D9D9D9, On #E6E6E6, Mixed #D9D9D9) 적용
 * - Mixed 상태: 중앙 8x2px 가로 막대(대시) 렌더링
 * - Mixed 상태 클릭 시 전체 On(true)으로 전환 (피그마 UI3 공식 동작)
 */
export function Switch({
  id,
  checked,
  isMixed = false,
  disabled = false,
  onChange,
  className = '',
  'data-tooltip': dataTooltip,
  title,
  ...props
}: SwitchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = Boolean(isMixed);
    }
  }, [isMixed]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    // Mixed 상태에서 클릭 시 항상 true(ON)으로 전환 (피그마 UI3 공식 동작)
    if (isMixed) {
      onChange(true);
    } else {
      onChange(e.target.checked);
    }
  }

  const rootClasses = [
    'switch',
    checked ? 'checked' : '',
    isMixed ? 'mixed' : '',
    disabled ? 'disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label
      className={rootClasses}
      htmlFor={id}
      data-state={isMixed ? 'mixed' : (checked ? 'checked' : 'unchecked')}
      data-tooltip={dataTooltip}
      title={dataTooltip ? undefined : title}
      {...props}
    >
      <input
        ref={inputRef}
        type="checkbox"
        id={id}
        checked={checked && !isMixed}
        disabled={disabled}
        onChange={handleChange}
      />
      <span className="slider" />
    </label>
  );
}
