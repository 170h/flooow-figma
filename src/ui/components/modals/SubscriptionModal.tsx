import React from "react";
import type { FlooowUsageState } from "../../../types";
import { usageRemainingTone } from "../../../planUsageTone";

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘 ( FillColorModal 템플릿과 동일 )
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

export interface SubscriptionModalProps {
  usage: FlooowUsageState | null;
  onClose: () => void;
}

/**
 * Plan & Usage 모달 (Figma UI3 Modal footer 디자인 기준)
 * - Free: Current Plan 행 + Free + 제한 안내 + Usage 색(잔여 수량) + 실측 + Upgrade to Pro
 * - Pro: Current Plan 행 + Pro + 안내(tertiary) + Usage Unlimited + 실측
 * - 남은 수량 색: 6+ secondary, 4–5 warning, 2–3 danger, 1 pink, 0 red
 * - 갱신일/과금 주기/Adjust Plan은 Payments API에 값이 없어 표시하지 않는다.
 */
export function SubscriptionModal({ usage, onClose }: SubscriptionModalProps) {
  const isPaid = usage !== null && usage.entitlement === "PAID_ACTIVE";
  const total = usage?.total ?? 0;
  const nodes = usage?.nodes ?? 0;
  const connectors = usage?.connectors ?? 0;
  const limit = usage?.limit ?? 20;
  const remaining = Math.max(0, limit - total);
  const limitReached = usage !== null && !usage.canCreate;
  const usageTone = usageRemainingTone(remaining, { paid: isPaid, limitReached });

  return (
    <div
      id="modal-subscription-backdrop"
      className="popover-backdrop active"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-subscription"
        className="subscription-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 (Plan & Usage 타이틀 + 닫기 버튼) */}
        <div className="subscription-modal-header">
          <span className="subscription-modal-title">Plan &amp; Usage</span>
          <button
            type="button"
            className="subscription-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            {CLOSE_SVG}
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="subscription-modal-body">
          {/* Current Plan 섹션 */}
          <div className="subscription-plan-section">
            <div className="subscription-plan-label-row">
              <div className="subscription-section-label">Current Plan</div>
            </div>
            <div className="subscription-plan-name">
              {isPaid ? "Pro" : "Free"}
            </div>
            <div className={`subscription-plan-desc${isPaid ? " is-pro" : ""}`}>
              {isPaid
                ? "Unlimited elements, every project"
                : "Create up to 20 elements per project"}
            </div>
          </div>

          {/* Usage 섹션 */}
          <div className={`subscription-usage-section${isPaid ? " is-pro" : ""}`}>
            <div className="subscription-usage-label-row">
              <span className="subscription-section-label">Usage</span>
              <span className={`subscription-usage-state is-${usageTone}`}>
                {isPaid
                  ? "Unlimited"
                  : limitReached
                    ? "Limit reached"
                    : `${remaining} remaining`}
              </span>
            </div>
            <div className="subscription-stat-box">
              <div className="subscription-stat">
                <span className="subscription-stat-value">{nodes}</span>
                <span className="subscription-stat-label">Node</span>
              </div>
              <div className="subscription-stat">
                <span className="subscription-stat-value">{connectors}</span>
                <span className="subscription-stat-label">Connector</span>
              </div>
              <div className="subscription-stat total">
                <span className="subscription-stat-value">{total}</span>
                <span className="subscription-stat-label">Total</span>
              </div>
            </div>
          </div>

          {/* Free 전용 Upgrade 안내 (표시 전용, 구매 플로우 없음) */}
          {!isPaid && (
            <div className="subscription-upgrade-section">
              <div className="subscription-upgrade-box">
                <div className="subscription-upgrade-title">Upgrade to Pro</div>
                <div className="subscription-upgrade-desc">
                  Unlimited elements, every project
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 (OK) */}
        <div className="subscription-modal-footer">
          <button
            type="button"
            className="btn-cta-primary"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
