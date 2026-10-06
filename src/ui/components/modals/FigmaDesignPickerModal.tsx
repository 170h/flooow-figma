import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DesignFrameItem } from '../../../types';

interface FigmaDesignPickerModalProps {
  onClose: () => void;
}

/**
 * 피그마 디자인 선택 모달 (Figma Design Screen Picker Modal)
 * 캔버스 상의 디자인 프레임들을 검색하고 선택하여 노드 사이즈 적용, 프리셋 등록 및 링크 연동을 수행한다.
 */
export function FigmaDesignPickerModal({ onClose }: FigmaDesignPickerModalProps) {
  const {
    designFrames,
    loadDesignFrames,
    setNodeOptionState,
    setFormTextDraft,
    addSizePreset,
    sizePresets,
    applyCurrentNodeState,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [saveAsPreset, setSaveAsPreset] = useState(true);
  const [linkToFrame, setLinkToFrame] = useState(true);

  // 모달 마운트 시 캔버스 프레임 목록 요청
  useEffect(() => {
    loadDesignFrames();
  }, [loadDesignFrames]);

  // 프레임 목록이 로드되었을 때 첫 번째 항목 자동 선택
  useEffect(() => {
    if (designFrames.length > 0 && !selectedFrameId) {
      setSelectedFrameId(designFrames[0].id);
    }
  }, [designFrames, selectedFrameId]);

  // 검색 필터링된 프레임 목록
  const filteredFrames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return designFrames;
    return designFrames.filter((f) => f.name.toLowerCase().includes(q));
  }, [designFrames, searchQuery]);

  const selectedFrame = useMemo(() => {
    return designFrames.find((f) => f.id === selectedFrameId) || null;
  }, [designFrames, selectedFrameId]);

  // 프레임 선택 적용 처리
  function handleApply() {
    if (!selectedFrame) return;

    // 1. Size controlled input 표시값 동기화 (FormTextDraftState 단일 소유 — DOM 직접 쓰기 금지)
    setFormTextDraft({
      sizeW: String(selectedFrame.width),
      sizeH: String(selectedFrame.height),
      sizeR: String(selectedFrame.cornerRadius ?? 0),
    });

    // 2. 상태 업데이트
    const updatePayload: Partial<import('../../context/AppContext').NodeOptionState> = {
      width: selectedFrame.width,
      height: selectedFrame.height,
      cornerRadius: selectedFrame.cornerRadius ?? 0,
      sizeMode: 'fixed',
    };

    if (linkToFrame) {
      updatePayload.singleLinkUrl = `figma://node/${selectedFrame.id}`;
      updatePayload.singleLinkOn = true;
      // controlled input이므로 텍스트 state로 즉시 반영 (DOM 직접 쓰기 금지)
      setFormTextDraft({ linkUrl: `figma://node/${selectedFrame.id}` });
    }

    setNodeOptionState(updatePayload);

    // 3. 사이즈 프리셋에 저장 옵션 선택 시 프리셋 등록
    if (saveAsPreset) {
      const exists = sizePresets.some(
        (p) => p.w === selectedFrame.width && p.h === selectedFrame.height
      );
      if (!exists) {
        addSizePreset({
          name: selectedFrame.name || 'Custom Screen',
          w: selectedFrame.width,
          h: selectedFrame.height,
          radius: selectedFrame.cornerRadius ?? 0,
          sizeMode: 'fixed',
        });
      }
    }

    // 4. 노드 상태 적용
    applyCurrentNodeState('fixed');

    onClose();
  }

  return (
    <div
      className="popover-backdrop"
      style={{ display: 'flex', zIndex: 1000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="size-modal-card"
        style={{
          width: 320,
          maxHeight: 460,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--color-bg-dark-modal, #1e1e1e)',
          border: '1px solid var(--color-border-dark-modal, #383838)',
          borderRadius: 12,
          boxShadow: '0 16px 32px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* 피그마 프레임 아이콘 */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M5 2V14M11 2V14M2 5H14M2 11H14"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: 0,
              }}
            >
              Select Figma Design
            </span>
          </div>
          <button
            type="button"
            className="size-modal-close-btn"
            onClick={onClose}
            data-tooltip="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary, #999)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* 검색 및 새로고침 바 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.15)',
          }}
        >
          <div className="picker-search-box">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.6 }}>
              <path
                d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search design screens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 11,
                width: '100%',
                letterSpacing: 0,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={loadDesignFrames}
            data-tooltip="Refresh frames from canvas"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bbb',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.65 2.35A7.95 7.95 0 0 0 8 0C3.58 0 0 3.58 0 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 8 14c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* 프레임 리스트 영역 */}
        <div
          style={{
            flex: 1,
            maxHeight: 200,
            overflowY: 'auto',
            padding: '6px 8px',
          }}
        >
          {filteredFrames.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '28px 16px',
                textAlign: 'center',
                color: 'var(--color-text-secondary, #888)',
                gap: 8,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span style={{ fontSize: 11, color: '#aaa', letterSpacing: 0 }}>
                {searchQuery
                  ? '검색 결과가 없습니다.'
                  : '현재 페이지에 디자인 프레임이 없습니다.'}
              </span>
              <span style={{ fontSize: 10, color: '#666', letterSpacing: 0 }}>
                피그마 캔버스에 프레임(Screen)을 추가한 후 새로고침해 주세요.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredFrames.map((frame) => {
                const isSelected = frame.id === selectedFrameId;
                return (
                  <div
                    key={frame.id}
                    onClick={() => setSelectedFrameId(frame.id)}
                    onDoubleClick={handleApply}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(13, 153, 255, 0.15)'
                        : 'transparent',
                      border: isSelected
                        ? '1px solid #0D99FF'
                        : '1px solid transparent',
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{
                          flexShrink: 0,
                          color: isSelected ? '#0D99FF' : '#888',
                        }}
                      >
                        <path
                          d="M5 2V14M11 2V14M2 5H14M2 11H14"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: isSelected ? 500 : 400,
                          color: isSelected ? '#ffffff' : '#d4d4d4',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: 0,
                        }}
                        title={frame.name}
                      >
                        {frame.name}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: isSelected ? '#a0d1ff' : '#888',
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          letterSpacing: 0,
                        }}
                      >
                        {frame.width} × {frame.height}
                      </span>
                      {Boolean(frame.cornerRadius) && (
                        <span
                          style={{
                            fontSize: 9,
                            color: '#666',
                            letterSpacing: 0,
                          }}
                        >
                          r:{frame.cornerRadius}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 연동 옵션 체크박스 영역 */}
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: '#bbb',
              cursor: 'pointer',
              userSelect: 'none',
              letterSpacing: 0,
            }}
          >
            <input
              type="checkbox"
              checked={saveAsPreset}
              onChange={(e) => setSaveAsPreset(e.target.checked)}
              style={{
                accentColor: '#0D99FF',
                cursor: 'pointer',
              }}
            />
            <span>사이즈 프리셋으로 저장 (Save to presets)</span>
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: '#bbb',
              cursor: 'pointer',
              userSelect: 'none',
              letterSpacing: 0,
            }}
          >
            <input
              type="checkbox"
              checked={linkToFrame}
              onChange={(e) => setLinkToFrame(e.target.checked)}
              style={{
                accentColor: '#0D99FF',
                cursor: 'pointer',
              }}
            />
            <span>피그마 링크 연동 (Link to frame)</span>
          </label>
        </div>

        {/* 푸터 버튼 영역 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '10px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            className="btn-phase-modal-cancel"
            onClick={onClose}
            style={{
              height: 28,
              padding: '0 12px',
              fontSize: 11,
              letterSpacing: 0,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-phase-modal-save"
            disabled={!selectedFrame}
            onClick={handleApply}
            style={{
              height: 28,
              padding: '0 14px',
              fontSize: 11,
              background: selectedFrame ? '#0D99FF' : 'rgba(255, 255, 255, 0.1)',
              color: selectedFrame ? '#ffffff' : '#666',
              cursor: selectedFrame ? 'pointer' : 'default',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              letterSpacing: 0,
            }}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
