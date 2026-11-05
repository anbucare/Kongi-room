# 결과 링크 미리보기 Worker (Cloudflare Workers)

친구에게 보내는 결과 링크마다 **다른 미리보기(제목·설명·그림)** 를 보여 주는 작은 서버입니다. GitHub Pages는 서버가 없어서 모든 링크가 같은 미리보기를 쓰는데, 이 Worker가 그 앞에 서서 카카오톡·X·Threads·페이스북 같은 미리보기 봇에게는 결과에 맞는 태그를 주고, 사람에게는 바로 사이트로 보냅니다.

```
공유 링크  https://kongi-room-share.<계정>.workers.dev/r?s=3&m=125&l=50&n=콩이&t=night&d=20261105
   ├─ 미리보기 봇  →  "콩이와 함께 50분 집중 완주" 제목 + 설명 + 그림이 든 HTML
   └─ 사람        →  302 → https://anbucare.github.io/Kongi-room/?s=3&m=125&... (친구의 방 화면)
```

## 두 가지 그림 방식

| 방식 | 설정 | 그림에 들어가는 것 | 요금제 |
|---|---|---|---|
| **미리 만든 그림** (기본) | `DYNAMIC_OG = "false"` | 완주 분(5~180분, 5분 단위) · 언어별 | 무료 플랜 OK |
| 실시간 그림 | `DYNAMIC_OG = "true"` | 완주 분 + 누적 시간 + 세션 수 + 날짜 + **고양이 이름** | Workers Paid ($5/월) 필요 |

제목과 설명은 두 방식 모두 결과값과 이름이 그대로 들어갑니다. 실시간 그림은 글꼴을 포함해 한 장 그리는 데 CPU가 0.5초 넘게 들어서 무료 플랜의 CPU 한도(요청당 10ms)를 넘깁니다. 무료 플랜에서는 기본값 그대로 두세요. 미리 만든 그림은 `../assets/og/` 에 108장(한국어·영어·독일어 × 36개 분값)이 들어 있습니다.

## 배포 (한 번만, 약 5분)

1. Cloudflare 계정을 만들고(무료) 이 폴더에서 아래를 실행합니다. 브라우저가 열리며 로그인을 묻습니다.

```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy
```

2. 마지막 줄에 나오는 주소를 복사합니다. 예: `https://kongi-room-share.hana.workers.dev`
3. 사이트 쪽 `app.js` 에서 `const RESULT_BASE=''` 를 `const RESULT_BASE='https://kongi-room-share.hana.workers.dev/r'` 로 바꾸고 배포합니다. 그때부터 공유 시트가 만드는 링크가 Worker 주소로 바뀝니다.
4. 확인: `https://kongi-room-share.hana.workers.dev/r?s=1&l=50&m=50&preview=1` 을 브라우저에서 열면 봇이 보는 미리보기 페이지가 그대로 보입니다. 카카오톡 대화창에 링크를 보내 미리보기가 바뀌는지도 확인해 보세요.

## 동작 확인 (로컬)

```bash
npx wrangler dev
curl -A "kakaotalk-scrap/1.0" "http://localhost:8787/r?s=3&m=125&l=50&n=콩이&t=night&d=20261105"
```

## 경로

- `/r?...` 결과 링크. 봇에는 미리보기 HTML, 사람에게는 사이트로 302. `&preview=1` 을 붙이면 누구나 HTML을 봅니다.
- `/og?...` 미리보기 그림. 기본 모드에서는 미리 만든 그림으로 302, 실시간 모드에서는 PNG를 그려서 7일간 캐시합니다.
- 그 밖의 경로는 사이트로 302.

주소 매개변수: `s` 오늘 세션 수, `m` 누적 분, `l` 마지막 완주 분, `n` 고양이 이름(6자), `t` 시간대, `d` 날짜(YYYYMMDD), `lang` ko·en·de.
