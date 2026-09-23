import React, { useCallback } from 'react';
import { useApp } from '../../context/AppContext';

const SIZE_PRESETS = [
  { label: 'Default', w: 250, h: 90 },
  { label: 'Square', w: 180, h: 180 },
  { label: 'Web', w: 320, h: 180 },
  { label: 'Mobile', w: 160, h: 280 },
] as const;

/**
 * Size 섹션 - W/H/Radius 입력 + 사이즈 모드 드롭다운 + 프리셋 칩
 */
export function SizeSection() {
  const {
    lastNodeConfig,
    setLastNodeConfig,
    setActiveModal,
    sizeModeDropdownOpen,
    setSizeModeDropdownOpen,
    closeAllPopovers,
    applyCurrentNodeState,
    autoResizeWindow,
  } = useApp();

  function updateSizePresetChips(w: number, h: number) {
    document.querySelectorAll('#panel-appearance .chip-group .chip-btn').forEach(btn => {
      const el = btn as HTMLButtonElement;
      const isDefault = w === 250 && h === 90 && el.textContent?.trim() === 'Default';
      const isSquare = w === 180 && h === 180 && el.textContent?.trim() === 'Square';
      const isWeb = w === 320 && h === 180 && el.textContent?.trim() === 'Web';
      const isMobile = w === 160 && h === 280 && el.textContent?.trim() === 'Mobile';
      el.classList.toggle('active', isDefault || isSquare || isWeb || isMobile);
    });
  }

  function handleWChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) setLastNodeConfig({ width: val });
  }
  function handleHChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) setLastNodeConfig({ height: val });
  }
  function handleRChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) setLastNodeConfig({ cornerRadius: val });
  }

  function triggerApply() {
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;
    const w = parseInt(wEl?.value || '250', 10) || 250;
    const h = parseInt(hEl?.value || '90', 10) || 90;
    const r = parseInt(rEl?.value || '0', 10) || 0;
    if (!isNaN(w)) setLastNodeConfig({ width: w });
    if (!isNaN(h)) setLastNodeConfig({ height: h });
    if (!isNaN(r)) setLastNodeConfig({ cornerRadius: r });
    updateSizePresetChips(w, h);
    applyCurrentNodeState();
  }

  function applySizePreset(w: number, h: number) {
    const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
    const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
    if (wEl) wEl.value = String(w);
    if (hEl) hEl.value = String(h);
    setLastNodeConfig({ width: w, height: h });
    updateSizePresetChips(w, h);
    applyCurrentNodeState();
  }

  function toggleSizeModeDropdown(e: React.MouseEvent) {
    e.stopPropagation();
    if (!sizeModeDropdownOpen) {
      const currentH = (document.getElementById('input-size-h') as HTMLInputElement | null)?.value;
      const fixedValEl = document.getElementById('size-mode-val-fixed');
      if (fixedValEl && currentH) fixedValEl.textContent = currentH;
    }
    setSizeModeDropdownOpen(!sizeModeDropdownOpen);
  }

  function selectSizeMode(mode: string) {
    if (mode !== 'mixed') setLastNodeConfig({ sizeMode: mode });
    const hiddenInput = document.getElementById('select-size-mode') as HTMLInputElement | null;
    if (hiddenInput) {
      hiddenInput.value = mode;
      hiddenInput.dispatchEvent(new Event('change'));
    }
    const textEl = document.getElementById('size-mode-current-text');
    const iconEl = document.getElementById('size-mode-current-icon');
    const FIXED_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 6C14.2761 6 14.5 6.22386 14.5 6.5C14.5 6.77614 14.2761 7 14 7H12V16H14C14.2761 16 14.5 16.2239 14.5 16.5C14.5 16.7761 14.2761 17 14 17H9C8.72386 17 8.5 16.7761 8.5 16.5C8.5 16.2239 8.72386 16 9 16H11V7H9C8.72386 7 8.5 6.77614 8.5 6.5C8.5 6.22386 8.72386 6 9 6H14Z" fill="currentColor"/></svg>`;
    const HUG_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4999 13C11.6325 13 11.7597 13.0527 11.8535 13.1464L14.8535 16.1464C15.0487 16.3417 15.0487 16.6582 14.8535 16.8535C14.6582 17.0487 14.3417 17.0487 14.1464 16.8535L11.4999 14.207L8.85346 16.8535C8.6582 17.0487 8.34169 17.0487 8.14643 16.8535C7.95119 16.6582 7.95119 16.3417 8.14643 16.1464L11.1464 13.1464C11.2402 13.0527 11.3674 13 11.4999 13ZM14.1464 7.14644C14.3417 6.95119 14.6582 6.95118 14.8535 7.14644C15.0487 7.3417 15.0487 7.65821 14.8535 7.85347L11.8535 10.8535C11.7597 10.9472 11.6325 10.9999 11.4999 11C11.3674 10.9999 11.2402 10.9472 11.1464 10.8535L8.14643 7.85347C7.95119 7.65821 7.95119 7.3417 8.14643 7.14644C8.34169 6.9512 8.6582 6.9512 8.85346 7.14644L11.4999 9.79292L14.1464 7.14644Z" fill="currentColor"/></svg>`;

    if (mode === 'fixed') {
      if (textEl) textEl.textContent = 'Fixed height';
      if (iconEl) iconEl.innerHTML = FIXED_SVG;
    } else if (mode === 'hug') {
      if (textEl) textEl.textContent = 'Hug contents';
      if (iconEl) iconEl.innerHTML = HUG_SVG;
    } else if (mode === 'mixed') {
      if (textEl) textEl.textContent = 'Mixed';
      if (iconEl) iconEl.innerHTML = `<span class="phase-dash-icon" style="display:inline-block; vertical-align:middle;"></span>`;
    }

    document.querySelectorAll('#popover-size-mode .size-mode-menu-item').forEach(item => {
      const el = item as HTMLElement;
      el.classList.toggle('selected', el.dataset.value === mode);
    });

    closeAllPopovers();
  }

  const { lastNodeConfig: cfg } = useApp();

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">Size</span>
        <div className="section-actions">
          <button className="btn-action-icon" title="Add size" onClick={() => setActiveModal('add-size')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 6C12.2761 6 12.5 6.22386 12.5 6.5V11.5H17.5C17.7761 11.5 18 11.7239 18 12C18 12.2761 17.7761 12.5 17.5 12.5H12.5V17.5C12.5 17.7761 12.2761 18 12 18C11.7239 18 11.5 17.7761 11.5 17.5V12.5H6.5C6.22386 12.5 6 12.2761 6 12C6 11.7239 6.22386 11.5 6.5 11.5H11.5V6.5C11.5 6.22386 11.7239 6 12 6Z" fill="currentColor"/></svg>
          </button>
          <button className="btn-action-icon btn-more-icon" title="Edit size" onClick={() => setActiveModal('edit-size')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
          </button>
        </div>
      </div>

      <div className="section-body">
        <div className="numeric-inputs-row">
          <div className="input-scrubber-box">
            <span className="scrubber-label" data-tooltip="Width">W</span>
            <input type="number" id="input-size-w" defaultValue={250} min={50}
              onChange={handleWChange}
              onBlur={triggerApply}
              onKeyDown={e => e.key === 'Enter' && triggerApply()} />
          </div>
          <div className="input-scrubber-box">
            <span className="scrubber-label" data-tooltip="Height">H</span>
            <input type="number" id="input-size-h" defaultValue={90} min={40}
              onChange={handleHChange}
              onBlur={triggerApply}
              onKeyDown={e => e.key === 'Enter' && triggerApply()} />
          </div>
          <div className="input-scrubber-box">
            <svg data-tooltip="Corner radius" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15.5 8C15.7761 8 16 8.22386 16 8.5C16 8.77614 15.7761 9 15.5 9H12.5C11.7917 9 11.2902 9.00022 10.8984 9.03223C10.5126 9.06377 10.2769 9.12345 10.0918 9.21777C9.71554 9.40951 9.40951 9.71554 9.21777 10.0918C9.12345 10.2769 9.06377 10.5126 9.03223 10.8984C9.00022 11.2902 9 11.7917 9 12.5V15.5C9 15.7761 8.77614 16 8.5 16C8.22386 16 8 15.7761 8 15.5V12.5C8 11.8082 8.00003 11.2593 8.03613 10.8174C8.07272 10.3696 8.14901 9.98732 8.32715 9.6377C8.61472 9.07347 9.07347 8.61472 9.6377 8.32715C9.98732 8.14901 10.3696 8.07272 10.8174 8.03613C11.2593 8.00003 11.8082 8 12.5 8H15.5Z" fill="currentColor"/></svg>
            <input type="number" id="input-size-radius" defaultValue={0} min={0} max={40}
              onChange={handleRChange}
              onBlur={triggerApply}
              onKeyDown={e => e.key === 'Enter' && triggerApply()} />
          </div>

          {/* 사이즈 모드 드롭다운 */}
          <div className="size-mode-dropdown-wrapper figma-dropdown-wrapper" id="size-mode-dropdown-wrapper">
            <button type="button" id="btn-size-mode-dropdown"
              className={`size-mode-dropdown-btn figma-dropdown-btn${sizeModeDropdownOpen ? ' active' : ''}`}
              title="Select height mode"
              onClick={toggleSizeModeDropdown}>
              <div className="size-mode-btn-content figma-dropdown-btn-content">
                <span className="size-mode-current-icon figma-dropdown-current-icon" id="size-mode-current-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 6C14.2761 6 14.5 6.22386 14.5 6.5C14.5 6.77614 14.2761 7 14 7H12V16H14C14.2761 16 14.5 16.2239 14.5 16.5C14.5 16.7761 14.2761 17 14 17H9C8.72386 17 8.5 16.7761 8.5 16.5C8.5 16.2239 8.72386 16 9 16H11V7H9C8.72386 7 8.5 6.77614 8.5 6.5C8.5 6.22386 8.72386 6 9 6H14Z" fill="currentColor"/></svg>
                </span>
                <span className="size-mode-current-text figma-dropdown-current-text" id="size-mode-current-text">Fixed height</span>
              </div>
              <svg className="size-mode-chevron-icon figma-dropdown-chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z" fill="currentColor"/></svg>
            </button>

            <div className={`size-mode-menu-popover figma-dropdown-menu${sizeModeDropdownOpen ? ' active' : ''}`} id="popover-size-mode">
              <div className="size-mode-menu-item figma-dropdown-item" data-value="mixed" onClick={() => selectSizeMode('mixed')}>
                <span className="size-mode-menu-item-check figma-dropdown-check-slot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z" fill="currentColor"/></svg></span>
                <span className="size-mode-menu-item-icon figma-dropdown-icon-slot"><span className="phase-dash-icon"></span></span>
                <span className="size-mode-menu-item-label figma-dropdown-label">Mixed</span>
              </div>
              <hr className="phase-popover-divider" style={{ margin: '4px 0' }} />
              <div className="size-mode-menu-item figma-dropdown-item selected" data-value="fixed" onClick={() => selectSizeMode('fixed')}>
                <span className="size-mode-menu-item-check figma-dropdown-check-slot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z" fill="currentColor"/></svg></span>
                <span className="size-mode-menu-item-icon figma-dropdown-icon-slot"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 6C14.2761 6 14.5 6.22386 14.5 6.5C14.5 6.77614 14.2761 7 14 7H12V16H14C14.2761 16 14.5 16.2239 14.5 16.5C14.5 16.7761 14.2761 17 14 17H9C8.72386 17 8.5 16.7761 8.5 16.5C8.5 16.2239 8.72386 16 9 16H11V7H9C8.72386 7 8.5 6.77614 8.5 6.5C8.5 6.22386 8.72386 6 9 6H14Z" fill="currentColor"/></svg></span>
                <span className="size-mode-menu-item-label figma-dropdown-label">Fixed height</span>
                <span className="size-mode-menu-item-value figma-dropdown-value" id="size-mode-val-fixed">90</span>
              </div>
              <div className="size-mode-menu-item figma-dropdown-item" data-value="hug" onClick={() => selectSizeMode('hug')}>
                <span className="size-mode-menu-item-check figma-dropdown-check-slot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z" fill="currentColor"/></svg></span>
                <span className="size-mode-menu-item-icon figma-dropdown-icon-slot"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M11.4999 13C11.6325 13 11.7597 13.0527 11.8535 13.1464L14.8535 16.1464C15.0487 16.3417 15.0487 16.6582 14.8535 16.8535C14.6582 17.0487 14.3417 17.0487 14.1464 16.8535L11.4999 14.207L8.85346 16.8535C8.6582 17.0487 8.34169 17.0487 8.14643 16.8535C7.95119 16.6582 7.95119 16.3417 8.14643 16.1464L11.1464 13.1464C11.2402 13.0527 11.3674 13 11.4999 13ZM14.1464 7.14644C14.3417 6.95119 14.6582 6.95118 14.8535 7.14644C15.0487 7.3417 15.0487 7.65821 14.8535 7.85347L11.8535 10.8535C11.7597 10.9472 11.6325 10.9999 11.4999 11C11.3674 10.9999 11.2402 10.9472 11.1464 10.8535L8.14643 7.85347C7.95119 7.65821 7.95119 7.3417 8.14643 7.14644C8.34169 6.9512 8.6582 6.9512 8.85346 7.14644L11.4999 9.79292L14.1464 7.14644Z" fill="currentColor"/></svg></span>
                <span className="size-mode-menu-item-label figma-dropdown-label">Hug contents</span>
                <span className="size-mode-menu-item-value figma-dropdown-value" id="size-mode-val-hug">328</span>
              </div>
            </div>
            <input type="hidden" id="select-size-mode" defaultValue="fixed" />
          </div>
        </div>

        {/* 프리셋 칩 */}
        <div className="chip-group" style={{ marginTop: '6px' }}>
          {SIZE_PRESETS.map(p => (
            <button
              key={p.label}
              className={`chip-btn${cfg.width === p.w && cfg.height === p.h ? ' active' : ''}`}
              onClick={() => applySizePreset(p.w, p.h)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
