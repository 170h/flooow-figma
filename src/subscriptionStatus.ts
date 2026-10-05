/**
 * Pro 구독 상태 문구 (Figma UI3 시안 표).
 * - 8일 이상: "Renews/Expires Oct 12, 2026" (연도 포함)
 * - 7일–2일: "Renews/Expires in N days · Oct 12" (연도 없음)
 * - 1일: "Renews/Expires tomorrow · Oct 12"
 * - 당일: "Renews/Expires today"
 * - 자동갱신 꺼짐 + 기간 종료: Free로 전환 (expired)
 */

export type SubscriptionStatusTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'critical';

export interface SubscriptionStatusMessage {
  text: string;
  tone: SubscriptionStatusTone;
  expired: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** 오늘(로컬 자정)부터 종료일(로컬 자정)까지의 달력 일수. 당일은 0. */
export function calendarDaysUntil(periodEnd: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfLocalDay(periodEnd) - startOfLocalDay(now)) / msPerDay);
}

function formatMonthDay(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function formatMonthDayYear(date: Date): string {
  return `${formatMonthDay(date)}, ${date.getFullYear()}`;
}

export function formatSubscriptionStatus(input: {
  autoRenew: boolean;
  periodEnd: Date;
  now?: Date;
}): SubscriptionStatusMessage {
  const now = input.now ?? new Date();
  const days = calendarDaysUntil(input.periodEnd, now);
  const verb = input.autoRenew ? 'Renews' : 'Expires';

  if (days < 0) {
    return { text: '', tone: 'neutral', expired: !input.autoRenew };
  }

  if (days === 0) {
    return {
      text: `${verb} today`,
      tone: input.autoRenew ? 'success' : 'critical',
      expired: false,
    };
  }

  if (days === 1) {
    return {
      text: `${verb} tomorrow · ${formatMonthDay(input.periodEnd)}`,
      tone: input.autoRenew ? 'neutral' : 'danger',
      expired: false,
    };
  }

  if (days <= 7) {
    const expireTone = days <= 3 ? 'danger' : 'warning';
    return {
      text: `${verb} in ${days} days · ${formatMonthDay(input.periodEnd)}`,
      tone: input.autoRenew ? 'neutral' : expireTone,
      expired: false,
    };
  }

  return {
    text: `${verb} ${formatMonthDayYear(input.periodEnd)}`,
    tone: 'neutral',
    expired: false,
  };
}
