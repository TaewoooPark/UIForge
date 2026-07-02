<h1 align="center">🔨 UIForge</h1>

<p align="center">
  <strong>어떤 웹사이트의 디자인이든 깔끔하고 편집 가능한 React + Tailwind로 복제한다. 콘텐츠는 당신 것으로.</strong><br>
  <em>사이트 주소를 알려주면 된다. UIForge는 그 사이트의 디자인 전체를 캡처한다. 모든 색, 그라디언트, 그림자, 폰트, 박스를 담아낸다. 그리고 그것을 충실한 재구성으로 replay하고, 원본과 비교하는 시각 diff를 유사도가 맞을 때까지 반복한다. 끝나면 편집 가능한 Vite + React + Tailwind 프로젝트를 건네준다. 콘텐츠는 <b>당신 것</b>으로 채워지고, 원본이 지키지 못한 접근성까지 갖춘 채로.</em>
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
   │  uiforge-capture       렌더링 후 모든 요소의 정확한 스타일,
   ▼                        기하 정보, 텍스트, SVG, 그리고 정리된 토큰셋을 추출
capture.json  ──────────────────────────────────────────────────────────────
   │  uiforge-theme         역할(bg/fg/accent 등)을 추론해 Tailwind v4 @theme로
   ▼
theme.css / theme.json
   │  uiforge-reconstruct   캡처를 충실한 자립형 페이지로 replay
   ▼
index.html (손으로 작성하지 않은 고충실도 베이스라인)
   │  uiforge-diff          둘을 렌더링해 픽셀 비교, 가장 다른 영역을 보고
   ▼  ───── 루프: 유사도가 90% 이상 될 때까지 그 영역들을 수정 ─────
   │  콘텐츠 교체            레퍼런스의 문구를 당신의 콘텐츠로 교체하되,
   ▼                        컴포넌트, 토큰, 레이아웃은 그대로 유지
   │  uiforge-export        → 편집 가능한 Vite + React + Tailwind v4 프로젝트로
   ▼
clone/  (npm install && npm run dev)
```

재구성의 모든 값은 추측이 아니라 도구가 산출한 것이다. 시그니처는 `uiforge-theme`가, 레이아웃과 스타일은 `uiforge-reconstruct`가 만들고, 일치 여부는 `uiforge-diff`가 검증한다. 그리고 클론은 접근성 검사를 통과한다(`uiforge-render-audit`). 겉모습은 같지만, 원본이 지키지 못했을 수도 있는 WCAG 대비를 만족한다.

## 얼마나 충실한가, 정직하게

결정적 재구성으로 측정한 값이다(손으로 작성하지 않았다). 페이지 전체를 픽셀 단위로 겹쳐 레퍼런스와 재구성을 비교했다.

| 사이트 | 노드 수 | 유사도 |
|---|---|---|
| 단순한 정적 페이지 | 14 | **93%** |
| **vercel.com** | 425 | **95.8%** |
| **linear.app** | 1023 | **92.8%** |
| tailwindcss.com | 1122 | 71% |

**깔끔하고 중간 규모인 사이트는 93~96%로 재현되고, linear.app처럼 밀도 높은 마케팅 홈페이지조차 이제 92.8%에 이른다.** 위 히어로가 보여주듯 내비게이션과 색과 문구, 그리고 Linear 자신의 `@font-face`를 다시 선언해 되살린 **Inter Variable** 헤드라인까지 사실상 동일하다. 수치가 떨어지는 것은 *가장 길고 겹이 많은* 페이지(tailwindcss.com, 약 11,000픽셀)이고, 이유는 정직하게 하나다. 점수가 **페이지 전체를 픽셀로 겹친 값**이라 **누적된 세로 밀림**이 지배한다. 절대 위치로 배치된 그래픽에서 높이가 나오는 섹션은 흐름 레이아웃으로 완벽히 재현할 수 없고, 섹션마다 몇 픽셀씩 밀린 것이 아주 긴 페이지에서는 쌓인다. 이 지표는 구조적으로 온전한 재구성을, 깨졌지만 더 짧은 재구성보다 오히려 낮게 매기기도 한다. 그러니 천장이 아니라 바닥으로 읽어야 한다. 눈에 보이는 디자인은 이 꼬리 수치가 말하는 것보다 더 가깝다. computed 스타일로 정말 재현할 수 없는 것은 실행 중인 **canvas나 WebGL** 히어로(Vercel의 도는 삼각형, Linear의 애니메이션)와 **지연 로딩되거나 크로스오리진인 미디어**다. 폰트도 한때 이 목록에 있었지만 이제는 아니다. 아래를 보라. 위 결과는 누구나 재현할 수 있다. `node tools/uiforge-capture.mjs <url>` 다음 `node tools/uiforge-reconstruct.mjs capture.json` 다음 `node tools/uiforge-diff.mjs <url> index.html`.

## 윤리, 사칭용 클론이 아니라 리디자인 스캐폴드

이 도구가 만드는 것은 **디자인 재현물**이다. 구조와 스타일을 가져오되, 콘텐츠는 **당신 것**이고 브랜드 자산(로고, 사진)은 치환된다. 원본의 브랜드로 배포하지 말고(사칭), 원본의 저작권 있는 이미지나 문구를 배포용 제품에 그대로 옮기지 말고, 로그인이나 자격증명 복제본은 절대 만들지 마라. 폰트는 각자의 라이선스를 따른다.

---

# 도구

열 개의 명령줄 도구가 있고, 모두 `--help`를 출력한다. capture와 diff 계층은 외부 의존성이 없는 Node이며, 렌더링에는 Playwright를 쓴다.

### 복제 파이프라인

```bash
node tools/uiforge-capture.mjs   <url│file> [--out capture.json] [--viewport WxH]
      # 렌더링 후 모든 요소의 정확한 computed 스타일, 기하학, 텍스트, SVG, 에셋,
      # 계층 구조와 정리된 토큰셋(팔레트, 타입, 간격, radii, 그림자, 폰트)을 추출
      # 브라우저의 CORS 벽 너머에서 진짜 @font-face 규칙까지 서버 측에서 되찾아낸다

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

- **웹폰트** *(대체로 해결됨)*. 브라우저는 크로스오리진 `@font-face` 규칙을 읽지 못한다(`cssRules`에 CORS가 걸린다). 그래서 이제 캡처가 레퍼런스의 스타일시트를 **서버 측에서 가져와서**(서버 요청에는 CORS가 적용되지 않는다) `@font-face` 규칙을 뽑아내고 절대 URL로 다시 선언한다. 폰트 파일 자체는 거의 항상 공개되어 있어(`Access-Control-Allow-Origin: *`) 재구성에 그대로 로드되고, 텍스트가 **진짜 폰트**로 렌더링된다. 남는 것은 이렇다. CORS를 허용하지 않고 제공되는 폰트나 인증 뒤에 있는 폰트는 여전히 대체 폰트로 떨어진다.
- **모션** *(CSS 애니메이션은 복구, 인터랙션은 아직).* 캡처가 각 요소의 `animation-*` 값을 읽고 참조된 `@keyframes`를 서버 측에서 복구한다(폰트와 같은 방식). 그래서 **CSS로 정의된 모션은 replay된다**. 스피너나 등장 페이드/슬라이드 같은 것들이다. 아직 안 되는 것은 이렇다. `:hover`/`:focus` 상태 변화, JS로 구동되는 애니메이션(Framer Motion, GSAP, 스크롤 연동), 클릭으로 열리는 상태(메뉴, 탭, 모달). 추출 경로 자체는 증명됐다(hover와 keyframe 규칙이 같은 스타일시트에서 그대로 파싱된다). 다만 그것을 replay하려면 지금의 인라인 스타일이 아니라 클래스와 스타일시트 층이 필요하다. 다음 단계로 추적 중이다.
- **canvas / WebGL / 비디오.** computed 스타일로는 재현할 수 없다. 픽셀이 명령형으로 그려져 읽을 DOM이 없다. 현실적인 경로는 재구성이 아니라 캔버스를 *녹화*하는 것이다(`captureStream()`으로 반복 재생되는 `<video>`).
- **한 장의 스냅샷.** 인증 뒤의 콘텐츠와 반응형 브레이크포인트는 캡처를 더 떠야 한다(모바일 뷰포트는 플래그 하나면 된다).
- **"깔끔함"은 단계적이다.** 내보낸 결과물의 스타일은 캡처에서 온 인라인이다(충실하고 편집 가능하며 테마가 추출되어 있다). 그것을 관용적인 Tailwind 유틸리티와 컴포넌트로 끌어올리는 일은 `/clone`의 에이전트 단계이며, 아직 완전히 자동은 아니다.

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
