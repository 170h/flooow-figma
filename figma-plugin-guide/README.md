# Figma Plugin 개발 가이드

> 출처: [Figma Developers Docs](https://developers.figma.com/docs/plugins/)

이 폴더는 Figma 플러그인 개발에 필요한 공식 문서를 한국어로 정리한 참고 자료입니다.

---

## 목차

### Getting Started (시작하기)

| 파일 | 원문 URL | 내용 |
|------|----------|------|
| [00-introduction.md](./00-introduction.md) | [Introduction](https://developers.figma.com/docs/plugins/) | 플러그인 개요, API 접근 범위, 문서 구조, 사용자 액션 |
| [00b-prerequisites.md](./00b-prerequisites.md) | [Prerequisites](https://developers.figma.com/docs/plugins/prerequisites/) | 필요 지식, 권장 도구, 무료 학습 자료 |
| [01-quickstart.md](./01-quickstart.md) | [Plugin Quickstart Guide](https://developers.figma.com/docs/plugins/plugin-quickstart-guide/) | 환경 설정 ~ 샘플 플러그인 실행 (7단계) |
| [02-setting-editor-type.md](./02-setting-editor-type.md) | [Setting Editor Type](https://developers.figma.com/docs/plugins/setting-editor-type/) | editorType 필드, 에디터별 지원 조합, 런타임 감지 |

### Basics of Plugins (플러그인 기초)

| 파일 | 원문 URL | 내용 |
|------|----------|------|
| [03-how-plugins-run.md](./03-how-plugins-run.md) | [How Plugins Run](https://developers.figma.com/docs/plugins/how-plugins-run/) | 2-샌드박스 아키텍처, Core↔UI 통신, 파일 로딩 |

### Development Guides (개발 가이드)

| 파일 | 원문 URL | 내용 |
|------|----------|------|
| [04-network-requests.md](./04-network-requests.md) | [Making Network Requests](https://developers.figma.com/docs/plugins/making-network-requests/) | UI에서 fetch, Core↔UI 통신 패턴, 네트워크 접근 제한 |

### Using External Resources (외부 리소스)

| 파일 | 원문 URL | 내용 |
|------|----------|------|
| [05-libraries-and-bundling.md](./05-libraries-and-bundling.md) | [Libraries and Bundling](https://developers.figma.com/docs/plugins/libraries-and-bundling/) | Webpack/esbuild 설정, React 연동, 번들링 주의사항 |

### API Reference (API 레퍼런스)

| 파일 | 원문 URL | 내용 |
|------|----------|------|
| [07-api-reference.md](./07-api-reference.md) | [API Reference](https://developers.figma.com/docs/plugins/api/api-reference/) | figma 글로벌 객체, 노드 타입 전체 목록, 주요 메서드 패턴 |

### Other (기타)

| 파일 | 원문 URL | 내용 |
|------|----------|------|
| [06-publishing.md](./06-publishing.md) | [Publishing](https://developers.figma.com/docs/plugins/publishing/) | 게시 방법, 버전 관리, 비공개 플러그인, 지원 정책 |

---

## 플러그인 아키텍처 요약

```
┌─────────────────────────────────────────────────────────────┐
│                        Figma 에디터                          │
│                                                              │
│  ┌──────────────────────┐     ┌──────────────────────────┐  │
│  │    Core (Sandbox)    │     │      UI (iframe)          │  │
│  │    code.ts → .js     │◄───►│      ui.html             │  │
│  │                      │     │                          │  │
│  │  ✅ Figma API        │     │  ✅ 브라우저 API          │  │
│  │  ✅ Plugin API       │     │  ✅ fetch, DOM, canvas   │  │
│  │  ❌ fetch, DOM       │     │  ❌ Figma API            │  │
│  └──────────────────────┘     └──────────────────────────┘  │
│         postMessage                   postMessage            │
└─────────────────────────────────────────────────────────────┘
```

---

## 권장 개발 환경

- **언어**: TypeScript (공식 권장)
- **에디터**: Visual Studio Code
- **런타임**: Node.js + npm
- **번들러**: Webpack 또는 esbuild

---

## 유용한 링크

- [Figma Plugin API 공식 문서](https://developers.figma.com/docs/plugins/)
- [Plugin API Typings (GitHub)](https://github.com/figma/plugin-typings)
- [eslint-plugin-figma-plugins (GitHub)](https://github.com/figma/eslint-plugin-figma-plugins)
- [Build Your First Plugin - YouTube 시리즈](https://www.youtube.com/watch?v=-JAphRkjV9g&list=PLXDU_eVOJTx5YBAszyuOTyxlgIxkQVyii)
- [Figma My Apps (개발자 대시보드)](https://www.figma.com/developers/apps)
- [Figma Community Forum](https://forum.figma.com/)
- [Discord 서버](https://discord.gg/xzQhe2Vcvx)
