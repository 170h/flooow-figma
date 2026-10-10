// src/ui/tokens/ui3Colors.ts
// 피그마 UI3 공식 컬러 토큰 단일 소스 (추출 원본: UI3 Kit Variables의 light/dark 컬럼)
// styles.css의 :root(라이트 정적값) 및 다크 오버라이드와 1:1 대응한다.
// 값을 바꾸면 styles.css의 대응 fallback도 함께 수정한다 (JS 실행 전 초기 페인트용).

export type Ui3Mode = 'light' | 'dark';

/** document에 설정하는 CSS 변수명 → 모드별 값 */
export const UI3_COLOR_TOKENS: Record<string, { light: string; dark: string }> = {
  '--color-bg': { light: '#ffffff', dark: '#2c2c2c' }, // bgDefaultDefault
  '--color-bg-secondary': { light: '#f5f5f5', dark: '#1e1e1e' }, // 라이트: bgDefaultSecondary, 다크: 기존 DOC 값 유지
  '--color-bg-tertiary': { light: '#e6e6e6', dark: '#383838' }, // bgDefaultTertiary
  '--color-brand': { light: '#0d99ff', dark: '#0d99ff' }, // bgBrandDefault (피그마 블루)
  '--color-brand-hover': { light: '#007be5', dark: '#007be5' }, // bgBrandHover
  '--color-brand-cta': { light: '#0d99ff', dark: '#0d99ff' },
  '--color-brand-cta-hover': { light: '#007be5', dark: '#007be5' },
  '--color-brand-text': { light: '#007be5', dark: '#80caff' }, // textBrandDefault, 푸터 유료 플랜(Dev/Pro) 폰트
  '--color-primary': { light: '#0d99ff', dark: '#0d99ff' },
  '--color-primary-hover': { light: '#007be5', dark: '#007be5' },
  '--color-text-primary': { light: '#000000e5', dark: '#ffffff' }, // textDefaultDefault
  '--color-text-secondary': { light: '#0000007f', dark: 'rgba(255, 255, 255, 0.65)' }, // textDefaultSecondary
  '--color-text-tertiary': { light: '#0000004c', dark: 'rgba(255, 255, 255, 0.4)' }, // textDefaultTertiary
  '--color-border': { light: '#e6e6e6', dark: 'rgba(255, 255, 255, 0.12)' }, // borderDefaultDefault
  '--color-border-focus': { light: '#007be5', dark: '#007be5' }, // borderBrandStrong
  '--switch-track-on': { light: '#0d99ff', dark: '#0d99ff' }, // 스위치 On 트랙
};

/** 현재 UI 모드 판별 (클래스/테마속성 신호 + OS 다크 추종) */
export function resolveUi3Mode(): Ui3Mode {
  if (typeof document === 'undefined') return 'light';
  const el = document.documentElement;
  const body = document.body;
  if (
    el.classList.contains('figma-dark') ||
    body.classList.contains('figma-dark') ||
    el.getAttribute('data-theme') === 'dark' ||
    body.getAttribute('data-theme') === 'dark'
  ) {
    return 'dark';
  }
  if (
    (el.classList.contains('figma-dark-auto') || body.classList.contains('figma-dark-auto')) &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
}

const FIGJAM_BRAND: Record<string, { light: string; dark: string }> = {
  '--color-brand': { light: '#8C4CF6', dark: '#8C4CF6' },
  '--color-brand-hover': { light: '#7B3CE3', dark: '#7B3CE3' },
  '--color-brand-cta': { light: '#8C4CF6', dark: '#8C4CF6' },
  '--color-brand-cta-hover': { light: '#7B3CE3', dark: '#7B3CE3' },
  '--color-brand-text': { light: '#7B3CE3', dark: '#C9A6FF' },
  '--color-primary': { light: '#8C4CF6', dark: '#8C4CF6' },
  '--color-primary-hover': { light: '#7B3CE3', dark: '#7B3CE3' },
  '--color-border-focus': { light: '#8C4CF6', dark: '#8C4CF6' },
  '--switch-track-on': { light: '#8C4CF6', dark: '#8C4CF6' },
};

/** 피그잼에서 열리면 프라이머리를 피그잼 퍼플로 덮는다. 피그마에서는 블루 토큰을 유지한다. */
export function applyEditorBrand(editorType: string): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (editorType !== 'figjam') {
    delete root.dataset.editor;
    return;
  }
  root.dataset.editor = 'figjam';
  const mode = resolveUi3Mode();
  for (const name of Object.keys(FIGJAM_BRAND)) {
    root.style.setProperty(name, FIGJAM_BRAND[name][mode]);
  }
}

/** 토큰 값을 document에 적용한다 */
export function applyUi3Theme(mode: Ui3Mode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const name of Object.keys(UI3_COLOR_TOKENS)) {
    root.style.setProperty(name, UI3_COLOR_TOKENS[name][mode]);
  }
  if (root.dataset.editor === 'figjam') applyEditorBrand('figjam');
}

/** 부팅 시 1회 호출: 즉시 적용 + 테마 변경 추적 */
export function initUi3Theme(): void {
  applyUi3Theme(resolveUi3Mode());
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    const onChange = () => applyUi3Theme(resolveUi3Mode());
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  } catch (_) {
    // 테마 추적 실패 시 초기 적용값 유지
  }
}
