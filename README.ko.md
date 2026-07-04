<h1 align="center">🔨 UIForge</h1>

<p align="center">
  <strong>웹사이트를 <em>실제로 작동하게</em> 복제한다 — 탭·필터·목록·클릭 전환·모션·스크롤까지. 그리고 픽셀 충실 <em>동결본</em>과 편집 가능한 React <em>재건본</em>도.</strong><br>
  <em>사이트 주소를 알려주면 된다. UIForge의 대표 기능은 <b>아카이브</b>다. 사이트의 진짜 코드 + 모든 네트워크 응답을 녹화해 오프라인에서 재생하므로, <b>원본 JavaScript가 자기 캐시 데이터로 실제로 돈다</b> — 탭을 누르면 콘텐츠가 바뀌고, 목록을 필터하면 갱신된다. 재구성이 아니라 <b>그게 곧 그 동작</b>이기 때문이다. 여기에 픽셀 충실 <b>동결본</b>(진짜 CSS·폰트 보존)과 깔끔한 컴포넌트화 React + Tailwind <b>재건본</b>(<b>당신의</b> 콘텐츠로)도 만든다. 웹폰트·정확한 애니메이션 커브·hover·드롭다운·진짜 영상을 담고, Cloudflare나 로그인 뒤 사이트까지 도달한다.</em>
</p>

<p align="center">
  <a href="./README.md"><img height="28" src="https://img.shields.io/badge/README-English-333333?style=for-the-badge&labelColor=000000" alt="English README"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/TaewoooPark/UIForge?style=flat-square&labelColor=000000&color=333333&cacheSeconds=1800" alt="License">
  <img src="https://img.shields.io/github/v/release/TaewoooPark/UIForge?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=1800" alt="Release">
  <img src="https://img.shields.io/github/stars/TaewoooPark/UIForge?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=1800" alt="Stars">
  <img src="https://img.shields.io/github/last-commit/TaewoooPark/UIForge?style=flat-square&labelColor=000000&color=333333&cacheSeconds=1800" alt="Last commit">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude%20Code-000000?style=flat-square&logo=anthropic&logoColor=white&labelColor=000000" alt="Claude Code">
  <img src="https://img.shields.io/badge/React%20·%20Tailwind%20v4%20·%20Vite-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000" alt="React · Tailwind · Vite">
  <img src="https://img.shields.io/badge/Zero--dep%20capture%20·%20diff-000000?style=flat-square&logo=nodedotjs&logoColor=white&labelColor=000000" alt="Zero-dep capture + diff">
</p>

<table>
<tr>
<td width="50%"><img src="./docs/hero-shadcn-live.png?v=3530" alt="ui.shadcn.com — 라이브 사이트" width="100%"></td>
<td width="50%"><img src="./docs/hero-shadcn-copy.png?v=3530" alt="ui.shadcn.com — UIForge가 완전 오프라인으로 렌더한 카피, 라이브와 픽셀까지 동일" width="100%"></td>
</tr>
</table>
<p align="center"><sub><em><b>둘 중 하나가 카피다. 어느 쪽인지 알겠는가?</b>  왼쪽은 라이브 <b>ui.shadcn.com</b>. 오른쪽은 UIForge가 만든 카피로, <b>네트워크 요청을 전부 차단한 채 오프라인으로</b> 렌더했다. 비슷한 정도가 아니라 <b>픽셀까지 완전히 동일 — MD5 해시가 같다</b>. 진짜 DOM, 진짜 CSS, 진짜 웹폰트를 자립형 단일 파일에 얼려 넣은 것이다.</em></sub></p>

<table>
<tr>
<td width="50%"><img src="./docs/hero-vercel-live.png?v=3530" alt="vercel.com — 라이브 사이트" width="100%"></td>
<td width="50%"><img src="./docs/hero-vercel-copy.png?v=3530" alt="vercel.com — UIForge의 오프라인 카피, canvas 히어로까지 픽셀 동일" width="100%"></td>
</tr>
</table>
<p align="center"><sub><em><b>다시 한번: 왼쪽이 라이브 vercel.com, 오른쪽이 오프라인 카피.</b> <b>canvas 히어로</b>까지 픽셀 그대로 맞는다 — MD5 동일. 그리고 이건 <b>동결본</b>일 뿐이다. 같은 캡처가 작동하는 <b>아카이브</b>(탭·전환·스크롤 — ↓)로도, 당신 콘텐츠를 넣는 편집 가능한 React <b>재건본</b>으로도 돌아간다.</em></sub></p>

---

## 한 사이트에서 세 가지 산출물 — *동작* · *겉모습* · *편집*

대부분의 도구는 정지 화면만 준다. UIForge는 **동작**을 먼저 주고, 그다음 겉모습과 편집 가능한 코드를 준다.

| | 무엇인가 | 용도 |
|---|---|---|
| **⭐ 아카이브** (`uiforge-archive`) | **완전한 동작** — 사이트 자신의 코드 + 녹화한 모든 응답을 **열람·수정 가능한 미러**(진짜 파일·진짜 파일명, 불투명 blob이 아님)에서 오프라인 재생 | **작동하는** 복제: 탭·필터·목록·클릭 전환·모션·스크롤 |
| **동결본** (`uiforge-freeze`) | 자립형·**픽셀 충실** 정지본. 진짜 CSS·폰트·에셋 보존, 스크립트 제거, 시간 정지 | 정확한 오프라인 정지 화면, 그리고 재건본을 재는 **오라클** |
| **재건본** (`uiforge-export`) | **깔끔하게 컴포넌트화된** Vite + React + Tailwind 프로젝트 | 디자인 위에 쌓고, 편집하고, 당신 콘텐츠로 배포 |

**아카이브는 진짜 JavaScript를 캐시된 데이터에 대고 실행**한다. 그래서 모든 인터랙션이 원본 그대로 동작한다 — 재구성이 아니라 *그게 곧 그 동작*이기 때문. (이게 "Save As"를 이기는 이유다. 모던 앱을 순진하게 저장하면 앱이 fetch하는 XHR·API 데이터가 안 담겨 깨진 껍데기로 열린다. 아카이브는 그 데이터를 녹화하고 *재생*한다.) 동결본은 라이브와 동일하게 렌더되고, 재건본은 그 동결본에 대고 오프라인·결정적으로 diff된다.

---

## 복제했더니 — 실제로 *작동한다*. 대표 5곳.

아래 사이트는 전부 플러그인이 **아카이브해서 오프라인으로 재생**한 것이다(`uiforge-archive --explore`). GIF는 **네트워크 없이** 도는 클론이고, 인터랙션은 진짜다 — 사이트 자신의 코드가 녹화된 데이터를 굴린다.

<table>
<tr>
<td width="50%" align="center"><img src="./docs/showcase-shadcn.gif?v=3510" alt="ui.shadcn.com을 오프라인 재생: 검색을 누르면 진짜 커맨드 팔레트 다이얼로그가 열린다" width="100%"></td>
<td width="50%" align="center"><img src="./docs/showcase-vercel.gif?v=3510" alt="vercel.com을 오프라인 재생: Pricing 클릭이 진짜 클라이언트 전환" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>ui.shadcn.com</b> ⭐ — 오프라인인데 검색을 누르면 진짜 <b>커맨드 팔레트 다이얼로그</b>가 열린다. 컴포넌트 갤러리 전체가 동작. (응답 121개 아카이브.)</sub></td>
<td align="center"><sub><b>vercel.com</b> — Pricing 클릭이 새로고침 없는 진짜 <b>클라이언트 전환</b>(캐시된 RSC). (189개.)</sub></td>
</tr>
<tr>
<td align="center"><img src="./docs/showcase-linear.gif?v=3520" alt="linear.app을 오프라인 재생: 스크롤하면 진짜 Inter Variable 폰트로 스태거 등장 모션이 펼쳐진다" width="100%"></td>
<td align="center"><img src="./docs/showcase-framer.gif?v=3510" alt="framer.com을 오프라인 재생: 진짜 모션과 영상 히어로" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>linear.app</b> — 오프라인 재생본을 스크롤하면 진짜 Inter Variable로 <b>스태거 등장 모션</b>이 펼쳐진다. (426개.)</sub></td>
<td align="center"><sub><b>framer.com</b> — 진짜 <b>모션 + 영상 히어로</b>가 오프라인에서 재생. (250개.)</sub></td>
</tr>
</table>

<p align="center">
  <img src="./docs/showcase-apple.gif?v=3510" alt="apple.com/macbook-air를 오프라인 재생: 스크롤 디자인과 영상" width="66%">
</p>
<p align="center"><sub><b>apple.com/macbook-air</b> — 스크롤 기반 레이아웃과 영상 히어로를 오프라인 재생. (160개.)</sub></p>

그리고 각각 **동결본**으로는 픽셀 충실하다 — 원본(좌) vs 동결본(우):

<table>
<tr>
<td width="33%" align="center"><img src="./docs/showcase-shadcn.png?v=3510" alt="ui.shadcn.com 원본 vs 동결본" width="100%"></td>
<td width="33%" align="center"><img src="./docs/showcase-vercel.png?v=3510" alt="vercel.com 원본 vs 동결본" width="100%"></td>
<td width="33%" align="center"><img src="./docs/showcase-apple.png?v=3510" alt="apple.com 원본 vs 동결본" width="100%"></td>
</tr>
</table>
<p align="center"><sub><em>동작 <b>과</b> 픽셀 충실도를 한 번의 캡처로 — <code>node tools/uiforge-archive.mjs &lt;url&gt; --explore</code> 다음 <code>node archive/serve.mjs</code>.</em></sub></p>

---

## 정적 스냅샷이 아니라 모션과 인터랙션까지 복제한다

<p align="center">
  <img src="./docs/motion-waapi.gif?v=3520" alt="linear.app의 스태거 등장 애니메이션을 클론에서 그대로 재생 — WAAPI Element.animate() 호출에서 뽑아낸 진짜 이징 곡선과 스태거, 샘플링한 근사치가 아니다" width="84%">
</p>
<p align="center"><sub><em><b>진짜 JS 모션 — 샘플링한 근사치가 아니다.</b> Framer / Motion은 <code>Element.animate()</code>로 움직인다. UIForge가 이를 후킹해 <b>진짜</b> keyframes·이징·스태거를 그대로 재생한다 — 위 linear.app의 등장 모션. 같은 캡처 경로가 나머지도 자동으로 가져온다: <b>CSS 애니메이션과 스크롤 등장</b> 상태가 넘어오고, <b>canvas / WebGL</b> 히어로는 녹화해 반복 <code>&lt;video&gt;</code>로 재생하며, <b>드롭다운 · 메뉴 · 아코디언</b>은 클릭으로 잡은 열린 상태를 유지하고, <code>:hover</code> / <code>:focus</code> 규칙은 스타일시트에서 복구해 재건본이 <b>포인터에 반응한다.</b></em></sub></p>

---

## 설치

**사전 준비물.** [Claude Code](https://claude.com/claude-code), **Node**, 그리고 렌더링 계층에 필요한 **Playwright** (`npm i -D playwright && npx playwright install chromium`).

```
/plugin marketplace add TaewoooPark/UIForge
/plugin install uiforge@uiforge
```

또는 로컬에서 실행한다. `git clone https://github.com/TaewoooPark/UIForge.git && claude --plugin-dir ./UIForge`.

---

# 사이트 복제하기

## 명령 — 하나의 명령, 세 가지 모드

```
/uiforge:clone <url│file.html> [--archive] [--react] [--content path.md] [--explore] [--headed] [--profile dir]
```

| 원하는 것 | 이렇게 | 결과 |
|---|---|---|
| **작동하는 / 동작하는** 복제 | `--archive`, 또는 *"실제로 작동하게 복제해줘"* | ⭐ 진짜 코드 + 데이터 녹화 → 탭·필터·목록·전환이 되는 오프라인 **재생본** |
| **편집 가능한** React + **내 콘텐츠** | `--react`, 또는 *"…내 제품용으로 (product.md)"* | 깔끔한 컴포넌트화 React + Tailwind **재건본** |
| **픽셀 충실** 정지본 | *(기본)* / `--freeze` | 자립형 **동결본** |

또는 그냥 말로 하면 에이전트가 모드를 고른다.

```
vercel.com을 실제로 작동하게 복제해줘 — 탭이랑 pricing 전환도 되게.   → 아카이브
stripe.com과 같은 디자인으로 내 제품 사이트를 만들어줘 (product.md 참고). → 재건본
linear.app 랜딩을 오프라인으로 정확히 복사해줘.                        → 동결본
```

**Cloudflare나 로그인 뒤면** `--headed --profile ./prof`를 붙인다(영속 프로필로 한 번 로그인하면 세션 재사용). **아카이브** 모드는 항상 `--explore`를 켠다 — 캡처 중 in-page 컨트롤을 클릭하고 스크롤해서, 그 인터랙션이 fetch하는 데이터까지 녹화한다. 더 많이 탐색할수록 더 많이 오프라인에서 작동한다.

## 파이프라인

```
레퍼런스 URL
   │  uiforge-capture       렌더링 후 모든 요소의 정확한 스타일, 기하 정보, 텍스트, SVG와
   ▼                        진짜 @font-face, @keyframes, :hover/:focus 규칙, 드롭다운 열린
   │                        상태, 그리고 (선택) canvas 영상 + JS 모션을 추출
capture.json  ──────────────────────────────────────────────────────────────
   │  uiforge-theme         역할(bg/fg/accent 등)을 추론해 Tailwind v4 @theme로
   ▼
theme.css / theme.json
   │  uiforge-reconstruct   그 전부를 충실하고 살아있는 자립형 페이지로 replay
   ▼                        (웹폰트, 모션, hover, 작동하는 메뉴)
index.html (손으로 작성하지 않은 고충실도 베이스라인)
   │  uiforge-diff          둘을 렌더링해 픽셀 비교, 가장 다른 영역을 보고
   ▼  ───── 루프: 유사도가 90% 이상 될 때까지 그 영역들을 수정 ─────
   │  콘텐츠 교체            레퍼런스의 문구를 당신의 콘텐츠로 교체하되,
   ▼                        컴포넌트, 토큰, 레이아웃은 그대로 유지
   │  uiforge-export        → 편집 가능한 Vite + React + Tailwind v4 프로젝트로
   ▼                        (폰트, keyframes, hover CSS, useEffect 토글 런타임)
clone/  (npm install && npm run dev)
```

### 무엇이 넘어오는가

| | 캡처됨 | 방법 |
|---|---|---|
| 구조 · 레이아웃 · 기하 | ✓ | 요소마다 `getBoundingClientRect` |
| 색 · 그라디언트 · 그림자 · 보더 · radius | ✓ | 요소마다 `getComputedStyle` |
| 타이포그래피 — **진짜 웹폰트** | ✓ | `@font-face`를 서버 측에서 fetch(CORS 우회) |
| 텍스트 — **혼합 인라인**(문장 속 링크) 포함 | ✓ | 노드마다 순서 보존 `pre`/`text`/`post` |
| SVG 아이콘·로고 | ✓ | 통째로 캡처 |
| **CSS 애니메이션**(스피너, 등장) | ✓ | `@keyframes`를 서버 측에서 fetch |
| **hover / focus / active** 상태 | ✓ | `:hover` 규칙 → `.uif-<i>:hover` 동반 CSS |
| **드롭다운 · 메뉴 · 아코디언** | ✓ | 캡처 중 클릭 → 열린 상태 + 클릭 런타임 |
| **스크롤 등장** 상태 · 지연 미디어 | ✓ | 스냅샷 전 페이지 전체 스크롤 |
| **canvas / WebGL** 히어로 | ✓ *(선택)* | `captureStream()` → 반복 `<video>` |
| **정확한** JS 애니메이션(Framer / Motion) | ✓ | `Element.animate()` 후킹 → 진짜 `@keyframes` + 커브·스태거·fill |
| **스크롤 연동** 애니메이션 | ✓ | 네이티브 `ScrollTimeline`/`ViewTimeline` → `animation-timeline` |
| 캐러셀·로테이터에서 **결정적** | ✓ | 스냅샷 순간에 시간 정지(Playwright clock) |
| 진짜 **`<video>`**(히어로 / 배경) | ✓ | 소스 + 포스터 + loop/muted 캡처 |
| **자립형**(오프라인) | ✓ *(선택)* | `export --assets`, 또는 `freeze --inline` → data-URI 단일 파일 |
| **반응형**(모바일) 변형 | ✓ *(선택)* | `--responsive` 모바일 패스 → `max-sm:` 클래스 |
| **Cloudflare / 봇 벽** 뒤 사이트 | ✓ *(선택)* | `--headed --profile`(cf_clearance 영속 + 챌린지 대기) |
| **로그인** 뒤 콘텐츠 | ✓ *(선택)* | `--profile` / `--storage-state`(저장된 세션) |
| **사이트 전체**(여러 페이지) | ✓ | `uiforge-site`가 크롤 → 하나의 React-Router 프로젝트 |

재구성의 모든 값은 추측이 아니라 도구가 산출한 것이다. 시그니처는 `uiforge-theme`가, 레이아웃과 스타일은 `uiforge-reconstruct`가 만들고, 일치 여부는 `uiforge-diff`가 검증한다. 그리고 클론은 접근성 검사를 통과한다(`uiforge-render-audit`). 겉모습은 같지만, 원본이 지키지 못했을 수도 있는 WCAG 대비를 만족한다.

## 얼마나 충실한가, 정직하게

결정적 재구성으로 측정한 값이다(손으로 작성하지 않았다). 페이지 전체를 픽셀 단위로 겹쳐 레퍼런스와 재구성을 비교했다.

| 사이트 | 노드 수 | 유사도 |
|---|---|---|
| 단순한 정적 페이지 | 14 | **93%** |
| **vercel.com** | 425 | **95.8%** |
| **linear.app** | 1023 | **92.8%** |
| tailwindcss.com | 1122 | 71% |

**깔끔하고 중간 규모인 사이트는 93~96%로 재현되고, linear.app처럼 밀도 높은 마케팅 홈페이지조차 이제 92.8%에 이른다.** 위 히어로가 보여주듯 내비게이션과 색과 문구, 그리고 Linear 자신의 `@font-face`를 다시 선언해 되살린 **Inter Variable** 헤드라인까지 사실상 동일하다. 수치가 떨어지는 것은 *가장 길고 겹이 많은* 페이지(tailwindcss.com, 약 11,000픽셀)이고, 이유는 정직하게 하나다. 점수가 **페이지 전체를 픽셀로 겹친 값**이라 **누적된 세로 밀림**이 지배한다. 절대 위치로 배치된 그래픽에서 높이가 나오는 섹션은 흐름 레이아웃으로 완벽히 재현할 수 없고, 섹션마다 몇 픽셀씩 밀린 것이 아주 긴 페이지에서는 쌓인다. 이 지표는 구조적으로 온전한 재구성을, 깨졌지만 더 짧은 재구성보다 오히려 낮게 매기기도 한다. 그러니 천장이 아니라 바닥으로 읽어야 한다. 눈에 보이는 디자인은 이 꼬리 수치가 말하는 것보다 더 가깝다. 실행 중인 **canvas나 WebGL** 히어로(Vercel의 도는 삼각형)는 computed 스타일로 *재현*할 수 없지만, 이제 **반복 재생 영상으로 녹화**되어(`--record-canvas`) 클론에도 들어간다. 폰트와 CSS 모션도 한때 "안 되는" 목록에 있었지만 이제는 아니다. 위 결과는 누구나 재현할 수 있다. `node tools/uiforge-capture.mjs <url>` 다음 `node tools/uiforge-reconstruct.mjs capture.json` 다음 `node tools/uiforge-diff.mjs <url> index.html`.

## 윤리, 사칭용 클론이 아니라 리디자인 스캐폴드

이 도구가 만드는 것은 **디자인 재현물**이다. 구조와 스타일을 가져오되, 콘텐츠는 **당신 것**이고 브랜드 자산(로고, 사진)은 치환된다. 원본의 브랜드로 배포하지 말고(사칭), 원본의 저작권 있는 이미지나 문구를 배포용 제품에 그대로 옮기지 말고, 로그인이나 자격증명 복제본은 절대 만들지 마라. 폰트는 각자의 라이선스를 따른다.

---

# 도구

열 개의 명령줄 도구가 있고, 모두 `--help`를 출력한다. capture와 diff 계층은 외부 의존성이 없는 Node이며, 렌더링에는 Playwright를 쓴다.

### 복제 파이프라인

```bash
node tools/uiforge-capture.mjs   <url│file> [--out capture.json] [--viewport WxH] [--record-canvas] [--sample-motion]
      # 렌더링 후 모든 요소의 정확한 computed 스타일, 기하학, 텍스트, SVG, 에셋,
      # 계층 구조와 정리된 토큰셋을 추출. 진짜 @font-face, @keyframes, :hover/:focus 규칙을
      # 서버 측에서 복구(CORS 우회)하고, 드롭다운 열린 상태를 탐색하며, 페이지를 스크롤해
      # 등장 애니메이션을 발동하고 지연 미디어를 로드한다.
      #   --record-canvas   각 <canvas>를 반복 .webm으로 녹화(canvas/WebGL 히어로)
      #   --sample-motion   JS 모션(Framer/GSAP)을 샘플링 → 근사 @keyframes

node tools/uiforge-theme.mjs     capture.json [--out-css theme.css] [--out-json theme.json]
      # 사용 방식으로 시맨틱 역할을 추론해 Tailwind v4 @theme로 (bg/fg/muted/surface/border/accent)

node tools/uiforge-reconstruct.mjs capture.json [--out index.html] [--mode flow│absolute]
      # 캡처를 결정적으로 replay해 충실한 자립형 페이지로

node tools/uiforge-diff.mjs      <ref> <out> [--viewport WxH] [--heatmap diff.png]
      # 둘을 렌더링해 canvas에서 비교: 유사도 %와 가장 다른 격자 영역들

node tools/uiforge-export.mjs    capture.json --out-dir ./clone [--theme theme.css]
      # 실행 가능한 Vite + React + Tailwind v4 프로젝트로 방출 (JSX + 추출한 @theme)
```

### 접근성과 완성도 검사 (단순 스크랩보다 나은 클론을 위해)

```bash
node tools/uiforge-render-audit.mjs <url│file> [--spec sig.json] [--json]
      # 노드별 WCAG 대비, 강조색 표면적, 간격 리듬, 타입 일관성, 레이아웃 신호
node tools/uiforge-attention.mjs    <url│file> [--overlay out.png]
      # 시선 순서 예측과 평평한 위계 감지
node tools/uiforge-lint.mjs         <dir> [--strict]
      # 빠른 소스 게이트: 기본 폰트, AI 보라색, 그라디언트 헤드라인, 과장 문구 등
```

---

# 작동 원리

어떤 LLM에게 "Stripe 같은 사이트 만들어줘"라고 하면 기억에 의존해 근사치를 낸다. 결과물이 Stripe와 비슷한 운을 띠지만 Stripe는 아니다. UIForge는 근사하지 않는다. **실제 페이지를 렌더링해서 측정한다.** 모든 요소에 `getComputedStyle`을 적용하면 정확한 색, 그라디언트, 그림자, 보더, 폰트, 박스가 나오고, `getBoundingClientRect`이 정확한 위치와 크기를 준다. SVG는 통째로 캡처한다. `uiforge-reconstruct`가 그것을 그대로 replay하므로 베이스라인은 **구성 자체로 충실하다.** 스타일이 추측이 아니라 그 사이트가 실제로 쓴 값이기 때문이다. 그다음 `uiforge-diff`가 재구성을 원본 옆에 렌더링해서 영역별로 어디가 아직 다른지 보고하고, 루프가 그 간극을 메운다.

결과는 "느낌"의 반대편에 있다. 측정 가능한 복제본이다(vercel.com에서 95.9%). 그것을 당신의 콘텐츠가 담긴 편집 가능한 React + Tailwind 프로젝트로, 그리고 디자인 시스템이 `@theme`로 추출된 채로 건넨다.

## 추출된 디자인 시스템

`uiforge-theme`는 색을 그냥 쏟아내지 않는다. **사용 방식으로 역할을 추론한다.** 배경은 가장 넓은 면적을 칠하는 색이고, 전경은 대비를 통과하는, 가장 많이 쓰인 텍스트 색이며, 강조색은 가장 많이 쓰인 채도 높은 색이다. linear.app에서는 `bg #08090a`, `accent #6366f1`(그들의 인디고), 그리고 정확한 폰트(Inter Variable와 Berkeley Mono)를 되찾아냈다. 진짜 디자인 시스템을, 당신이 소유하는 Tailwind v4 `@theme`로.

## 정직한 한계

여기 있던 대부분이 이제 해결됐다(위 표 참고). 정확한 JS 애니메이션, 네이티브 스크롤 연동 모션, 캐러셀에서의 결정성, 진짜 영상, 웹폰트(CORS로 막힌 것도 `--inline`으로), 인증, Cloudflare, 사이트 전체 크롤까지. **정직하게 남는 것**은 이렇다.

- ***동결본*의 JS 마운트 SPA 히어로.** 동결본은 결정성을 위해 스크립트를 제거하므로, 프레임워크가 *JS로 마운트*하는 히어로(openai.com의 ChatGPT 프롬프트)는 라이브와 다른 정적 슬라이드로 렌더된다. *재건본* 경로(JS 실행 후 computed 스타일을 읽음)는 이걸 지키지만 동결본은 아니다. 시간 정지는 캐러셀·로테이터는 고치지만 JS 마운트 콘텐츠는 아니다.
- **JS로 구동되는 스크롤 효과**(네이티브 CSS API가 아니라 rAF로 `scrollY`를 읽는 것). **최종 상태**는 스크롤 스루로 캡처되지만, 스크롤에 맞춰 스크럽되는 모션은 재생되지 않는다.
- **물리 / 파티클** 모션과 **canvas** 인터랙션. 영상으로 녹화되지, 다시 시뮬레이션되지는 않는다.
- **"관용적"은 마지막 한 걸음.** 재건본은 진짜로 컴포넌트화·Tailwind 클래스화되어 있지만, 모든 임의 `[value]`를 디자인 토큰 유틸리티로 매핑하고 컴포넌트를 의미 있게 이름 붙이는 일은 `/clone` 에이전트의 다듬기 단계이며 아직 완전 자동은 아니다.

## 저장소 구조

```
UIForge/
├── README.md · README.ko.md · LICENSE
├── docs/                            # 증거 이미지와 재현 가능한 픽스처
├── .claude-plugin/ · .mcp.json      # 플러그인 매니페스트 + 자가 설치 마켓플레이스 + shadcn MCP
├── commands/                        # clone · forge · reskin · setup · critique · score
├── skills/                          # design-director · design-tokens · motion · content
└── tools/                           # 복제 파이프라인 + 검사 도구
    ├── uiforge-capture.mjs          # 레퍼런스의 디자인 전체를 추출
    ├── uiforge-theme.mjs            # → Tailwind v4 @theme (역할 추론)
    ├── uiforge-reconstruct.mjs      # 캡처를 충실한 페이지로 replay
    ├── uiforge-diff.mjs             # 시각 충실도 게이트 (유사도 %와 가장 다른 영역)
    ├── uiforge-export.mjs           # → Vite + React + Tailwind 프로젝트
    ├── uiforge-render-audit.mjs     # 클론에 대한 WCAG/완성도 검사
    ├── uiforge-attention.mjs        # 시선 순서와 위계
    ├── uiforge-lint.mjs             # 빠른 소스 게이트
    ├── uiforge-catalog.mjs · uiforge-source.mjs · …   # 컴포넌트 카탈로그 (294개)
    └── catalog/ · kits/             # 에셋 데이터베이스와 다섯 개의 준비된 디자인 kit
```

## 출처와 라이선스

렌더링은 **[Playwright](https://playwright.dev)**로 하고, 출력은 **[React](https://react.dev)** + **[Tailwind CSS v4](https://tailwindcss.com)** + **[Vite](https://vite.dev)**를 목표로 한다. 완성도와 검사 계층은 **Refactoring UI**, **Practical Typography**, **Material / Radix / Tailwind** 토큰, 그리고 **Anthropic**의 프런트엔드 디자인 가이드에 기댄다. 플러그인, 스킬, 명령, 도구는 [MIT](./LICENSE)를 따른다. 캡처하는 사이트, 내려받는 에셋, 참조하는 폰트는 여기에 포함되지 않는다.
