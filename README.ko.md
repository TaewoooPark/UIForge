<h1 align="center">🔨 UIForge</h1>

<p align="center">
  <strong>어떤 웹사이트든 디자인과 <em>모션</em>과 <em>인터랙션</em>까지 두 가지로 복제한다. 픽셀까지 충실한 <em>동결본</em>과, 깔끔하게 컴포넌트화된 React + Tailwind <em>재건본</em>.</strong><br>
  <em>사이트 주소를 알려주면 된다. UIForge는 그 사이트를 <b>동결</b>해 자립형·픽셀 충실 복제본을 만들고(원본 CSS·폰트·에셋을 그대로 지킨 오프라인 오라클), 동시에 편집 가능한 Vite + React + Tailwind 프로젝트로 <b>재건</b>한다. 섹션과 반복 블록은 진짜 컴포넌트로, 스타일은 Tailwind 클래스로, 콘텐츠는 외부화된 채로, 그리고 동결본에 대고 검증된 채로. 웹폰트·CSS 애니메이션·hover·드롭다운을 담고, canvas/WebGL 히어로는 영상으로 녹화하며, JS 모션을 샘플링하고, Cloudflare 뒤의 사이트까지 도달한다. 그다음 <b>당신의</b> 콘텐츠로 채운다.</em>
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

<p align="center">
  <img src="./docs/clone-linear.png?v=3230" alt="linear.app을 캡처만으로 재현한 UIForge 클론. 라이브 사이트와 재구성을 같은 스크롤 위치에서 나란히 놓았다. 같은 내비게이션, Linear가 실제로 쓰는 Inter Variable 웹폰트로 렌더링된 같은 헤드라인, 같은 문구다." width="100%">
</p>
<p align="center"><sub><em><b>linear.app을 캡처만으로 재현한 결과다.</b> 손으로 작성한 부분은 없고 두 화면 모두 같은 스크롤 위치다. <code>capture → reconstruct</code>가 모든 요소의 정확한 스타일, 기하 정보, 텍스트, SVG를 replay하고, 사이트 자신의 <code>@font-face</code>를 다시 선언해 헤드라인이 대체 폰트가 아니라 <b>Linear의 진짜 Inter Variable</b>로 렌더링되게 한다. 그다음 당신의 콘텐츠를 채워 넣고 편집 가능한 React + Tailwind 프로젝트로 내보낸다.</em></sub></p>

---

## 한 사이트에서 세 가지 산출물

*보이는 것*, *편집하는 것*, *동작하는 것*은 서로 다른 복제라, UIForge는 셋 다 만든다.

| | 무엇인가 | 용도 |
|---|---|---|
| **동결본** (`uiforge-freeze`) | 자립형·**픽셀 충실** 정지본. 진짜 CSS·폰트·에셋을 지키고, 스크립트 제거, 시간 정지 | 정확한 오프라인 정지 화면, 그리고 재건본을 재는 **오라클** |
| **재건본** (`uiforge-export`) | **깔끔하게 컴포넌트화된** Vite + React + Tailwind 프로젝트 | 디자인 위에 쌓고, 편집하고, 당신 콘텐츠로 배포 |
| **아카이브** (`uiforge-archive`) | **완전한 동작** — 사이트 자신의 코드 + 녹화한 모든 응답을 오프라인 재생 | *작동하는* 복제: 탭·필터·목록·클릭 전환·모션·스크롤 |

동결본은 라이브와 동일하게 렌더되고(그게 곧 그 사이트의 CSS다), 재건본은 그 동결본에 대고 오프라인·결정적으로 diff되며, 아카이브는 **진짜 JavaScript를 캐시된 데이터에 대고 실행**한다. 그래서 모든 인터랙션이 원본 그대로 동작한다(클릭한 탭이 콘텐츠를 바꾸고, 필터링한 목록이 갱신된다 — 재구성이 아니라 *그게 곧 그 동작*이기 때문).

## 다섯 가지로 카피

실제 사이트 다섯 개를 캡처만으로 동결했다. 원본(좌) vs 동결본(우):

<p align="center">
  <img src="./docs/copy-stripe.png?v=3460" alt="stripe.com 원본 vs 동결본, 거의 픽셀 동일" width="100%">
</p>
<p align="center"><sub><em><b>stripe.com</b> — 그라디언트 히어로, 로고 줄, 쿠키 배너까지. 동결본은 진짜 CSS를 지켜 그대로 렌더된다(손실 재구성은 이 페이지를 40% 높이로 붕괴시켰다).</em></sub></p>

<table>
<tr>
<td width="50%" align="center"><img src="./docs/copy-anthropic.png?v=3460" alt="anthropic.com 원본 vs 동결본" width="100%"></td>
<td width="50%" align="center"><img src="./docs/copy-vercel.png?v=3460" alt="vercel.com 원본 vs 동결본, canvas 삼각형 포함" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>anthropic.com</b> — 헤드라인·내비·본문·오렌지 밴드까지 충실하게.</sub></td>
<td align="center"><sub><b>vercel.com</b> — <b>canvas 삼각형</b> 히어로까지 렌더된다(동결본은 라이브 페이지를 지켜서 canvas가 공짜로 딸려온다).</sub></td>
</tr>
<tr>
<td align="center"><img src="./docs/copy-linear.png?v=3460" alt="linear.app 원본 vs 동결본" width="100%"></td>
<td align="center"><img src="./docs/copy-openai.png?v=3460" alt="openai.com을 --headed로 Cloudflare 너머에서 도달해 진짜 CSS로 동결" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>linear.app</b> — 어두운 히어로를 자신의 Inter Variable로.</sub></td>
<td align="center"><sub><b>openai.com</b> — <code>--headed</code>로 <b>Cloudflare 너머</b>에 도달. openai는 JS로 개인화된 SPA다. 동결본은 진짜 CSS를 지키지만, JS로 마운트되는 히어로는 다시 불러온 화면과 다른 정적 슬라이드를 보여준다. 충실도 결함이 아니라 정직한 SPA 한계다.</sub></td>
</tr>
</table>

---

## 정적 스냅샷이 아니라 모션과 인터랙션까지 복제한다

<table>
<tr>
<td width="50%" align="center"><img src="./docs/motion-canvas.gif?v=3310" alt="Vercel의 canvas/WebGL 삼각형 히어로를 영상으로 녹화해 클론에서 반복 재생" width="100%"></td>
<td width="50%" align="center"><img src="./docs/interaction-menu.gif?v=3310" alt="재구성 안에서 GitHub 드롭다운 메뉴가 클릭에 열린다" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>Canvas / WebGL → 영상.</b> vercel.com의 도는 삼각형 히어로는 스타일로 재구성할 수 없어서 <b>녹화</b>해 반복 재생 <code>&lt;video&gt;</code>로 넣는다.</sub></td>
<td align="center"><sub><b>드롭다운 · 메뉴 · 아코디언.</b> 캡처 중에 실제 토글을 클릭해 열린 상태를 기록하고 replay한다. 클론의 메뉴가 <b>클릭에 열린다.</b></sub></td>
</tr>
<tr>
<td align="center"><img src="./docs/motion-js.gif?v=3310" alt="gsap.com의 JS 모션을 샘플링해 반복 CSS keyframes로 재생" width="100%"></td>
<td align="center"><img src="./docs/interaction-hover.gif?v=3310" alt="커서가 인터랙티브 요소 위를 지날 때 재구성에서 hover 상태가 재생된다" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>JS 모션 → keyframes.</b> Framer나 GSAP는 JS로 움직여 스타일시트에 아무것도 없다. UIForge가 움직임을 <b>샘플링</b>해 반복 <code>@keyframes</code>로 합성한다(위는 gsap.com).</sub></td>
<td align="center"><sub><b>hover · focus · active.</b> <code>:hover</code> 규칙을 스타일시트에서 복구해 replay하므로 클론이 <b>포인터에 반응한다.</b></sub></td>
</tr>
</table>

<p align="center"><sub><em>네 가지 모두 캡처만으로 도구가 만들어낸다. 손으로 작성한 부분은 없다. CSS 애니메이션과 스크롤 등장 상태는 자동으로 넘어오고, canvas 영상과 JS 모션 샘플링은 선택 플래그다.</em></sub></p>

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

## 명령

```
/uiforge:clone <url│file.html> [--content path.md] [--react]
```

또는 그냥 말로 해도 된다.

```
landing.md의 내용으로 linear.app과 동일한 디자인의 사이트를 만들어줘.
stripe.com과 같은 디자인으로 내 제품 사이트를 만들어줘 (product.md 참고).
```

당신은 **레퍼런스**(디자인)를 주고, 원한다면 **당신의 콘텐츠**(마크다운 파일)를 준다. UIForge는 디자인은 레퍼런스의 것이고 콘텐츠는 당신의 것인, 깔끔하고 편집 가능한 결과물을 만들어낸다.

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
