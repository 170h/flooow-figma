# 사전 요건 (Prerequisites)

> 출처: https://developers.figma.com/docs/plugins/prerequisites/

---

## 필요한 기반 지식

Figma 플러그인은 **Figma 제품 기능을 확장하는 경량 웹 애플리케이션**입니다.

- **로직**: JavaScript로 작성
- **UI**: HTML로 구성

Plugin API는 복잡한 디자인 툴의 내부를 추상화하고, 린터·TypeScript 타입 정의·헬퍼 함수 등의 편의를 제공하지만, **최소한의 JavaScript와 HTML 기초 지식은 필수**입니다.

---

## 무료 학습 자료

프로그래밍 또는 웹 개발 경험이 없다면 아래 자료를 참고하세요:

| 자료 | 설명 |
|------|------|
| [The Odin Project](https://www.theodinproject.com/courses/web-development-101) | 웹 개발 기초 전반 |
| [Codecademy: Web Development](https://www.codecademy.com/learn/paths/web-development) | 웹 개발 학습 경로 |
| [Khan Academy: Intro to JS](https://www.khanacademy.org/computing/computer-programming/programming) | JavaScript 입문 |

---

## 권장 도구 및 기술 (나중에 필요해지는 것들)

플러그인 개발을 시작하기 전에 모두 배울 필요는 없지만, 점차 유용해지는 기술들입니다:

| 도구/기술 | 용도 |
|-----------|------|
| **IDE** (VS Code, IntelliJ 등) | 다중 파일 작업, 자동완성, 확장 기능 활용 |
| **비동기 JavaScript** (async/await) | 페이지 로드, 네트워크 요청 등 async 작업에 필수 |
| **TypeScript** | Figma가 제공하는 Plugin API 타입 정의 활용 |
| **Webpack (번들링)** | 대형 멀티파일 프로젝트 및 라이브러리 임포트 처리 |
| **React / Vue** | 복잡한 UI 구성 |

> 💡 **TypeScript를 강력 권장**: Figma는 Plugin API 전체에 대한 TypeScript 타입 정의를 제공합니다.
> VS Code에서 자동완성과 타입 오류 감지가 가능해 개발 생산성이 크게 향상됩니다.

---

## 다음 단계

- [퀵스타트 가이드 →](./01-quickstart.md)
