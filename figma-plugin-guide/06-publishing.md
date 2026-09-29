# 플러그인 게시 (Publishing)

> 출처: https://developers.figma.com/docs/plugins/publishing/

---

## 게시 전 준비

### manifest.json 필수 필드 확인

```json
{
  "name": "플러그인 이름",
  "id": "고유 플러그인 ID (Figma가 자동 생성)",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": ["https://api.example.com"]
  }
}
```

### 게시 체크리스트

- [ ] 플러그인이 정상 동작하는지 로컬 테스트 완료
- [ ] 아이콘 이미지 준비 (128×128px PNG 권장)
- [ ] 플러그인 설명 작성 (한국어/영어)
- [ ] 스크린샷 또는 데모 영상 준비
- [ ] Support contact (이메일 또는 링크) 준비
- [ ] 보안 공개 양식(Security disclosure form) 작성

---

## 게시 방법

1. Figma 데스크톱 앱에서 **Plugins > Development > [플러그인명]** 을 우클릭
2. **Publish** 선택
3. 플러그인 정보(이름, 설명, 태그, 아이콘, 스크린샷) 입력
4. **Publish** 클릭

또는 [Figma My Apps 페이지](https://www.figma.com/developers/apps)에서 게시 관리 가능.

---

## 게시 승인 프로세스

- Figma 팀이 플러그인을 검토한 후 Community에 공개
- 최초 승인 후에는 **추가 심사 없이 즉시 업데이트** 가능
- 업데이트 시 **Version history**에 변경 사항 설명 추가 가능

---

## 버전 관리

| 항목 | 내용 |
|------|------|
| 업데이트 게시 | 최초 승인 후 즉시 가능, 별도 심사 없음 |
| 사용자 업데이트 | 모든 사용자에게 자동 적용 |
| 롤백 | 사용자가 불가 — 개발자가 이전 버전 코드를 재게시해야 함 |
| 보안 양식 | 데이터 처리 관행 변경 시 security disclosure form 업데이트 |

---

## 비공개(Private) 플러그인

Community에 공개하지 않고 조직 내부에서만 사용하는 플러그인을 만들 수도 있습니다:

- **Organization 플러그인**: 특정 Figma 조직 내에서만 접근 가능
- Figma의 Organization 플랜 이상에서 지원
- [조직 플러그인 설정 →](https://help.figma.com/hc/en-us/articles/360042293714)

---

## 지원 & 유지보수

- Figma는 서드파티 플러그인 기술 지원을 **직접 제공하지 않습니다**
- 개발자가 사용자 지원을 직접 담당해야 합니다
- Figma Community 참여 수치(좋아요, 사용자 수 등)는 **주 1회** 이메일로 통보

### 지원 채널 예시

- GitHub Issues / Discussions
- 이메일 지원
- 전용 Discord 채널
- 도움말 문서 사이트

---

## 애널리틱스 직접 구성

Figma는 플러그인 사용량 애널리틱스를 제공하지 않으므로 필요하다면 직접 구성:

```typescript
// UI에서 이벤트 트래킹 예시 (Google Analytics, Mixpanel 등)
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'TRACK_EVENT') {
    // analytics.track(msg.event, msg.properties);
  }
};
```

---

## 관련 링크

- [Figma My Apps (개발자 대시보드)](https://www.figma.com/developers/apps)
- [플러그인 개발자 관리 가이드](https://help.figma.com/hc/en-us/articles/360042293714)
- [Figma Community](https://www.figma.com/community/plugins)
