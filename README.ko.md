<h1 align="center">🔨 UIForge</h1>

<p align="center">
  <strong>AI 슬롭이 아니라 걸작 UI를 벼려낸다. Claude Code를 위한 취향 컴파일러.</strong><br>
  <em>레퍼런스를 넣어라. 사이트든 이미지든 확정한 방향이든 좋다. UIForge는 그것을 시그니처로 측정하고, 거기에 맞는 컴포넌트를 조달한 뒤, 실제 게이트에 대고 빌드를 반복한다. 이 게이트는 페이지를 렌더링해서 진짜 WCAG 위반이나 무너진 위계, 평범한 슬롭이 있으면 통과시키지 않는다. 그 결과물이 바로 그 취향이 될 때까지 돌린다.</em>
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
  <img src="https://img.shields.io/badge/4%20Skills%20·%205%20Commands%20·%2010%20Tools-000000?style=flat-square&labelColor=000000&color=000000" alt="4 Skills · 5 Commands · 10 Tools">
  <img src="https://img.shields.io/badge/shadcn%20MCP-000000?style=flat-square&logo=shadcnui&logoColor=white&labelColor=000000" alt="shadcn MCP">
  <img src="https://img.shields.io/badge/React%20·%20Next.js%20·%20Tailwind%20·%20Motion-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000" alt="React · Next.js · Tailwind · Motion">
</p>

<p align="center">
  <img src="./docs/proof-render-audit.png?v=3150" alt="같은 브리프를 실제로 돌린 결과. 개발자 도구 가격 섹션. 왼쪽은 LLM 기본값으로 render audit F(46/100), WCAG 대비 실패 12건, 똑같은 카드 세 개, 무너진 위계. 오른쪽은 UIForge로 벼려낸 A(94/100), 대비 실패 0, 추천 플랜 강조, 헤드라인이 시선을 이끈다." width="100%">
</p>
<p align="center"><sub><em>같은 브리프, 즉 <b>개발자 도구 스타트업의 가격 섹션</b>을 실제로 돌린 결과다. 왼쪽은 LLM이 기본으로 내놓는 것이고(보라색 그라디언트 헤드라인, 똑같이 생긴 카드 세 개, 대비가 약한 흐린 글씨), <b>render audit 점수는 F(46/100)</b>다. 오른쪽은 파이프라인으로 벼려내 게이트를 통과할 때까지 돌린 것이고, <b>A(94/100)</b>다. 재현: <code>node tools/uiforge-render-audit.mjs docs/examples/pricing-forged.html</code>.</em></sub></p>

---

## 설치

**준비물:** [Claude Code](https://claude.com/claude-code)(플러그인은 세션 안에서
동작한다), **Node**(도구 실행용), 그리고 컴포넌트가 실제로 동작하려면 **React /
Next.js + Tailwind CSS + [Motion](https://motion.dev)** 프로젝트가 필요하다(Tailwind
v4를 권장한다). 딥 티어의 라이브 렌더링에는 **Playwright**가 필요하다
(`npm i -D playwright && npx playwright install chromium`). 소스 린터는 Node 외에는
아무것도 필요하지 않다.

```
/plugin marketplace add TaewoooPark/UIForge
/plugin install uiforge@uiforge
```

또는 설치하지 않고 로컬에서 바로 실행한다.

```bash
git clone https://github.com/TaewoooPark/UIForge.git
claude --plugin-dir ./UIForge
```

함께 들어 있는 `.mcp.json`이 공식 **shadcn MCP**(`npx shadcn@latest mcp`)를
띄운다. 별도의 커스텀 MCP 서버는 추가하지 않는다.

---

# UIForge 사용하기

아래는 전부 실제로 입력하는 것들이다. 슬래시 명령 다섯 개가 Claude Code 세션에서
파이프라인을 구동하고, 명령줄 도구 열 개가 측정을 담당하며 단독으로 실행하거나
CI에 연결할 수 있다.

## 다섯 가지 명령

| 명령 | 언제 쓰나 |
|---|---|
| `/uiforge:forge <브리프>` | UI를 처음부터 끝까지 만든다. 방향을 정하고, 토큰을 먼저 방출하고, 컴포넌트를 조달하고, 조합한 다음, 게이트를 통과할 때까지 반복한다. |
| `/uiforge:reskin <이미지│url>` | 레퍼런스를 `signature.json`(측정된 디자인 지침)으로 바꾼 뒤 거기에 맞춰 만든다. "이런 느낌으로 해줘"의 정문이다. |
| `/uiforge:setup [컴포넌트]` | 대상 프로젝트를 준비한다. shadcn과 Motion-Primitives 레지스트리를 등록하고 `motion` / `lucide-react` / `cn` 헬퍼를 설치한다. 프로젝트마다 한 번 실행한다. |
| `/uiforge:critique` | 현재 화면을 냉정하게 리뷰한다. 렌더링하고, 모든 게이트 티어를 돌리고, 시선 순서를 예측한 다음, 점수가 아니라 관점 있는 크리틱을 돌려준다. |
| `/uiforge:score <디렉터리│풀리퀘스트│url>` | 아무 UI나 A부터 F까지 채점한다. 디렉터리나 풀 리퀘스트는 소스 린터를 거치고, 라이브 URL은 render audit을 거친다. 독립 리뷰어다. |

## 상황별 프롬프트

명령은 자연어를 받는다. 특별한 문법은 필요 없고, 평범한 디자인 언어로 방향을
잡으면 된다. 흔한 상황별로 어떻게 쓰는지 아래에 정리했다.

**브리프만 준다.** 표면과 대상을 말하면 파이프라인이 방향을 정하고 확정한다.

```
/uiforge:forge 개발자 도구 스타트업의 가격 섹션
```

**브리프에 디자인 지침을 더한다.** 느낌, 방향, 하나뿐인 강조색, 절제를 덧붙인다.
여기서 형용사는 곧 지시다. 더 확실하게 정할수록 좋다.

```
/uiforge:forge 집중/글쓰기 앱의 랜딩 히어로.
  에디토리얼하고 따뜻하게, 강조색은 러스트 하나, 큰 세리프 디스플레이, 차분하고 비대칭으로.
  그라디언트는 쓰지 말고 헤드라인이 모든 걸 해내도록.
```

```
/uiforge:forge 데이터베이스 콘솔의 설정 페이지.
  스위스풍으로 정밀하게. 중립적이고 정확하게, 강조색은 일렉트릭 블루 하나, 촘촘한 8px 그리드,
  숫자에는 모노스페이스. 밀도는 높되 답답하지 않게.
```

**브리프에 레퍼런스를 더한다.** 이게 취향 컴파일러 경로다. 원하는 느낌의
사이트나 이미지를 가리키면, UIForge가 그것을 시그니처로 측정해서 일반 규칙이
아니라 바로 그 시그니처에 맞춰 만든다.

```
/uiforge:reskin https://linear.app
# → signature.json 추출 (강조색, 그리드, radii, 타입 램프, 레이아웃 자세)

/uiforge:forge 위 reskin에서 나온 시그니처를 써서 체인지로그 페이지를 만들어줘.
  같은 절제와 강조색으로, 카피와 레이아웃은 우리 것으로. 픽셀이 아니라 분위기를 가져온다.
```

```
/uiforge:reskin ./moodboard.png
# 이미지 레퍼런스. UIForge가 시그니처 skeleton을 써 두면 모델이 이미지를 보고 채우고,
# 그다음 검증한다. URL 레퍼런스와 같은 스키마다.
```

**반복하면서 디자인 코멘트를 준다.** 디자이너에게 말하듯 말하면 된다. 코멘트는
렌더 결과에 대고 반영되므로 검증할 수 있다.

```
/uiforge:critique
# 그런 다음, 리포트를 보고:
"강조색이 과하다. 표면의 10% 아래로 줄여라."
"시선이 헤드라인이 아니라 카드로 간다. 헤드라인이 먼저 오게 해라."
"흐린 글씨가 대비 기준을 못 넘는다. AA를 통과할 때까지 어둡게 해라."
"radius를 하나로 통일해라. 샤프한 것과 알약형이 섞여 있다."
```

**남의 UI를 리뷰한다.** URL은 소스가 없어도 된다. render audit이 픽셀만으로
동작한다.

```
/uiforge:score ./apps/web        # 로컬 디렉터리 (소스 린터)
/uiforge:score 128               # GitHub 풀 리퀘스트 번호
/uiforge:score https://acme.com  # 라이브 URL (render audit + 시선 순서)
```

**새 프로젝트를 연결한다.** 만들기 전에 한 번.

```
/uiforge:setup                   # 레지스트리 + motion/lucide-react/cn
```

## 레퍼런스를 주는 세 가지 방법

1. **라이브 사이트.** `/uiforge:reskin https://…` 가 사이트를 렌더링해서 시그니처를
   측정한다. 웹에 있는 무언가를 가리킬 수 있을 때 가장 좋다.
2. **이미지나 무드보드.** `/uiforge:reskin ./ref.png` 를 쓴다. 도구는 이미지를
   렌더링하지 못하므로 스키마 **skeleton**을 써 두고, 모델이 직접 보고 채운다(타입
   램프, 하나뿐인 강조색과 그 표면 비중, 간격 기준, 모서리 radius, 레이아웃 자세).
   그런 다음 검증한다. 사이트와 같은 스키마라서 이후 단계는 완전히 동일하게
   동작한다.
3. **말로 준 방향.** 파일이 전혀 없어도 된다. `/forge` 프롬프트에 다섯 방향 중
   하나와 형용사 몇 개를 적으면 된다. UIForge는 방향마다 완성된 kit을 제공한다.

어떻게 주든 결과는 하나의 `signature.json`이다. 게이트가 `--spec`으로 강제하는,
수치화된 디자인 지침이다.

## 명령줄 도구

모든 도구는 `--help`를 출력한다. 단독으로, `/critique`와 `/score` 안에서, 또는
CI에서 실행할 수 있다. 소스 티어는 순수 Node이고, 렌더와 카탈로그 티어는
Playwright와 내장 `node:sqlite`를 쓴다.

### `uiforge-lint.mjs` 빠른 게이트 (소스)

`src` / `app` / `components` / `pages` / `ui` / `styles` / `index.html`을 훑어
조잡한 티를 찾고, 블로커가 하나라도 있으면 0이 아닌 코드로 종료한다. 의존성이 없다.

```bash
node tools/uiforge-lint.mjs [dir] [--strict] [--json] [--max-score N] [--quiet]
```

- **블로커**(항상 실패): 기본이나 시스템 폰트(Inter, system-ui, Roboto 등)는 `const`
  안에 숨겨도 잡힌다. AI 보라와 인디고, 그라디언트 헤드라인, UI로 쓰인 이모지,
  과장된 카피, reduced-motion 경로가 없는 모션.
- **경고**(점수에 반영되는 권고): 사용 지점의 raw hex, Tailwind 임의값, 8px
  그리드에서 벗어난 간격, 최대치 radius와 shadow, 그라디언트 남용, slate와 zinc
  기본값, 무한 루프, 토큰 레이어 부재.
- `--strict`는 누적된 경고에도 실패한다. `--max-score N`은 임계값을 정한다.
  `--json`은 기계용이다. 스캔할 대상이 없으면 통과가 아니라 *아무것도 스캔하지 않음*
  으로 보고한다.

pre-commit 훅이나 CI 단계로 연결하면 슬롭이 들어올 수 없다:
`node tools/uiforge-lint.mjs . --strict`.

### `uiforge-render-audit.mjs` 딥 게이트 (렌더)

페이지를 렌더링해서, 시니어 디자이너가 결과물을 보고 비평하는 요소를 측정한다.
텍스트 노드별 실제 WCAG 대비, 강조색 표면적, 간격 리듬, 타입 스케일 정합성, AI
레이아웃 패턴이다.

```bash
node tools/uiforge-render-audit.mjs <url│file.html> [--spec signature.json]
     [--signature] [--viewport 1440x900] [--no-harden] [--json] [--self-test]
```

- `--spec signature.json`. 절대 규칙이 아니라 시그니처에 대한 상대(reference-relative)
  로 채점한다. 어느 경우든 대비는 절대적인 WCAG 바닥으로 유지된다.
- `--signature`. 페이지 자체에서 도출한 시그니처를 JSON으로 출력한다(`extract`가
  사용한다).
- `--no-harden`. 라이브 사이트용 기본 하드닝(reduced-motion 에뮬레이션, 쿠키와 동의
  오버레이 제거, 안정화 대기)을 끈다.
- `--self-test`. 브라우저 없이 도는 순수 로직 회귀 테스트다.

### `uiforge-attention.mjs` 시선 순서 + 위계

시선이 어디에 닿는지 예측한 다음, 명확한 초점이 하나인지, 헤드라인이나 주요 행동이
먼저 오는지 확인한다. "위계가 약하다"를 검증할 수 있는 주장으로 바꾼다.

```bash
node tools/uiforge-attention.mjs <url│file.html> [--expect "당신의 헤드라인"]
     [--overlay out.png] [--viewport 1440x900] [--json] [--self-test]
```

- `--expect "텍스트"`. 특정 요소가 상위 3위 안에 드는지 확인한다.
- `--overlay out.png`. 시선 순서(`#1`…`#6`)를 페이지 위에 그려서, 눈으로 볼 수 있는
  주석 체크리스트로 저장한다.

### `uiforge-extract.mjs` 레퍼런스에서 시그니처로

```bash
node tools/uiforge-extract.mjs <url│file.html> [--out signature.json]
     [--config uiforge.config.json] [--print] [--viewport WxH]
node tools/uiforge-extract.mjs <이미지>           # 비전 경로: 스키마 skeleton을 쓴다
node tools/uiforge-extract.mjs --validate signature.json   # 스키마에 맞춰 검증
node tools/uiforge-extract.mjs --schema           # 시그니처 계약(스키마) 출력
```

URL이나 HTML 파일은 렌더링해서 측정한다. 이미지는 모델이 비전으로 채울 skeleton을
내놓고, `--validate`가 그것을 확인한다. 어느 쪽이든 같은 스키마라서, 이미지에서 뽑은
시그니처는 렌더로 뽑은 것과 서로 바꿔 쓸 수 있다. `--config`는 게이트가 읽는 프로젝트
로컬 룰셋인 `uiforge.config.json`도 함께 쓴다.

### `uiforge-source.mjs` 시그니처에 맞춰 카탈로그 순위 매기기

```bash
node tools/uiforge-source.mjs "<필요한 것>" [--spec signature.json]
     [--type ui] [--limit N] [--json]
```

294개 컴포넌트 카탈로그를 세 가지로 점수 매긴다. 의미 적합도(필요한 것과 이름,
태그, 타입의 대응), 스타일 적합도(각 컴포넌트의 radii와 내 시그니처의 대조), 그리고
taste(접근성 신호, Radix 출처, variant, 그리고 raw color는 감점)다. 그런 다음 상위
후보의 `npx shadcn add …`를 출력한다. 그래서 내가 확정한 시그니처에 맞는 조각을
설치하게 된다.

### `uiforge-catalog.mjs` 컴포넌트 카탈로그 질의

```bash
node tools/uiforge-catalog.mjs stats                 # 개수, 접근성 커버리지, 상위 radii
node tools/uiforge-catalog.mjs search "dialog" [--type ui] [--limit N]
node tools/uiforge-catalog.mjs show @shadcn/button   # 한 컴포넌트의 정적 시그니처
node tools/uiforge-catalog.mjs near signature.json   # 시그니처에 가장 가까운 컴포넌트
```

### `uiforge-harvest.mjs` 카탈로그 (재)구축

```bash
node tools/uiforge-harvest.mjs
```

shadcn 호환 레지스트리를 가져와서 컴포넌트마다 정적 시그니처를 파싱하고,
`tools/catalog/catalog.db`(내장 `node:sqlite` 기반 SQLite, 외부 의존성 없음)에 쓴다.
다시 실행할 수 있고, 레지스트리를 추가하는 건 작은 설정 변경이면 된다.

### `uiforge-corpus.mjs` 실증 검증

```bash
node tools/uiforge-corpus.mjs [corpus.json] [--out results.json] [--viewport WxH] [--json]
```

라벨이 붙은 코퍼스(designed 대 template)에 대고 render audit을 돌려, 등급이 두
부류를 실제로 갈라내는지 보고한다. 실패한 항목은 버리지 않고 기록한다.

### `uiforge-score.mjs` A부터 F까지 등급

```bash
node tools/uiforge-score.mjs [dir] [--json]
```

린터를 하나의 일관된 0–100 척도(그리고 A–F)로 감싼다. 블로커는 무겁게 처리해서
블로커가 하나만 있어도 최고 C에 묶이고, 티가 하나도 없으면 A+이며, 스캔 대상이
없으면 가짜 A+가 아니라 N/A다. `/uiforge:score` 명령이 여기에 풀 리퀘스트와 라이브
URL 경로를 더한다.

### `create-uiforge.mjs` 연결된 프로젝트 스캐폴딩

```bash
node tools/create-uiforge.mjs <editorial│precise│brutalist│warm│maximalist> [dir] [--force]
npm run lint:ui
```

방향의 토큰 kit을 `src/index.css`에 넣고(이미 있으면 별도 파일로), 린터를 복사하고,
`lint:ui` npm 스크립트를 추가하고, pre-commit 훅을 설치하고, CI 워크플로를 쓴다.
슬롭이 들어올 수 없게 기존 앱을 한 번의 명령으로 연결한다.

## 다섯 가지 방향

프로젝트마다 하나를 고른다. 그 선택이 토큰, 폰트, 모션, 그리고 어떤 레지스트리에서
가져올지를 고정한다. 각 방향은 실제 비-기본 서체가 담긴 완성 kit(`tools/kits/`)으로
제공되고, 각 kit은 구조상 린터를 통과한다.

| 방향 | 성격 | 디스플레이 / 모노 폰트 | 강조색 |
|---|---|---|---|
| **Editorial** | 잡지풍, 비대칭, 큰 타이포 | Fraunces / — | 러스트 `#B4472E` |
| **Precise** | 스위스 그리드와 Linear의 만남, 차분하고 정확 | Hanken Grotesk / JetBrains Mono | 일렉트릭 블루 `#4C8DFF` |
| **Brutalist** | 날것, 고대비, 단단한 그림자 | Archivo / Space Mono | 플랫 옐로 `#FFE500` |
| **Warm** | 부드럽고 인간적, 스프링 기반 | Bricolage Grotesque / JetBrains Mono | 테라코타 `#E07A5F` |
| **Maximalist** | 대담하고 겹겹이 쌓인 키네틱, 그래도 시그니처는 하나 | Unbounded / — | 마젠타 `#FF2E88` |

어느 것도 Inter나 Roboto, system-ui가 아니고, 이 사실만으로 가장 큰 블로커가
해결된다.

---

# 작동 원리

## 취향 컴파일러

아무 LLM에나 "괜찮은 랜딩 페이지 만들어줘"라고 하면 매번 같은 페이지가 나온다. 흰
배경의 **Inter**, 보라에서 파랑으로 가는 **그라디언트** 히어로, **가운데** 정렬된
헤드라인, 똑같이 생긴 **둥근 카드 세 개**다. 이건 프롬프트 문제가 아니라 **분포
수렴**이다. 열린 선택마다 모델은 확률이 가장 높은 토큰을 내놓는데, 그 확률이 가장
높은 답이 곧 학습 데이터의 중앙값이다. 그리고 그 중앙값이 슬롭이다.

일반 규칙("강조색 10% 미만, 타입 비율 하나")은 디자인 도구를 *주니어 린터*처럼
보이게 만드는 요소다. 시니어는 그런 규칙을 일부러 깬다. 그래서 규칙은 UIForge에서
나오지 않는다. 규칙은 **당신이 고른 레퍼런스**에서 나온다.

```
레퍼런스 / 키워드
   │  uiforge-extract      레퍼런스를 렌더링해서 측정
   ▼
signature.json            타입 램프, 강조색과 그 비중, 그리드 단위, radii, 레이아웃
   │  compile
   ▼
uiforge.config.json       게이트가 읽는 프로젝트 로컬 룰셋
   │  uiforge-source       이 시그니처에 맞춰 294개 컴포넌트 카탈로그 순위
   ▼
상위 후보 설치            의미 × 스타일(radii) × taste(접근성, radix, variant)
   │  loop
   ▼
render-audit --spec       레퍼런스 상대로 채점, 일치할 때까지. 대비는 절대 유지
```

<p align="center"><img src="./docs/pipeline.png?v=3150" alt="실제 실행에서의 UIForge 파이프라인. 레퍼런스에서 추출된 시그니처로, 카탈로그 순위 컴포넌트 후보로, 레퍼런스 상대 게이트로 이어진다(등급 A, 시선이 헤드라인에 닿고 대비 실패 0)." width="100%"></p>
<p align="center"><sub><em>실제 실행(<code>docs/examples/good.html</code>)에서의 단계들이다. 모든 값은 도구가 산출한다. 시그니처는 <code>uiforge-extract</code>, 후보는 <code>uiforge-source</code>, 등급은 <code>render-audit --spec</code>, 초점은 <code>uiforge-attention</code>이 만든다.</em></sub></p>

**취향은 상대적이지만 접근성은 그렇지 않다.** 같은 `slop.html`을 세 가지 기준으로
채점한 결과다.

| 채점 기준 | render-audit |
|---|---|
| 일반 기본 규칙 | **F**. 강조색 과다, 들쭉날쭉한 리듬, 똑같은 카드 3개, 가운데 히어로, 그리고 대비 실패 |
| *에디토리얼* 레퍼런스 | **F**. 모든 축에서 레퍼런스와 어긋남, 그리고 대비 실패 |
| **자기 자신(보라/맥시멀리스트) 레퍼런스** | **D**. 취향 관련 티는 다 사라지고(이제 그게 미학이다), WCAG 대비 실패만 남음 |

보라색에 가운데 정렬된 맥시멀리스트 페이지는, 레퍼런스가 바로 보라색 맥시멀리즘일
때는 슬롭이 아니다. 그건 선택이다. 하지만 WCAG AA 아래인 텍스트는 누구의 취향을
가져오든 잘못된 것이다. 컴파일러가 긋는 선이 바로 여기이고, 그래서 이건 그냥 루프가
아니다.

**레퍼런스를 넣고 실제로 돌린다.** 브리프 두 개를 더 준비했고, 각각 사용자가 하듯
레퍼런스를 줬다. 레퍼런스를 `signature.json`으로 측정한 다음, 빌드를 `--spec`으로
그것에 대고 채점한다. 기본값은 벗어나고(F), 벼려낸 버전은 레퍼런스의 강조색,
그리드, 타입, 자세를 받아들여 일치한다(A).

<p align="center"><img src="./docs/example-brutalist.png?v=3150" alt="브리프는 모노스페이스 폰트 마켓 히어로, 지침은 브루탈리스트. 레퍼런스(brutalist.html)에 대해 LLM 기본값은 F(45), 벼려낸 버전은 A(94)로 레퍼런스에 일치한다." width="100%"></p>
<p align="center"><img src="./docs/example-precise.png?v=3150" alt="브리프는 status 또는 uptime 섹션, 지침은 스위스 정밀함. 레퍼런스(precise.html)에 대해 LLM 기본값은 F(53), 벼려낸 버전은 A(94)로 레퍼런스에 일치한다." width="100%"></p>

## 일반적인 AI-UI 도구가 하지 못하는 것

| 축 | UIForge | 순정 Claude / v0 / Lovable / bolt |
|---|---|---|
| 규칙이 어디서 오나 | **당신이 고른 레퍼런스**를 스펙으로 측정하고, 게이트는 그것에 대고 채점한다 | 고정된 일반 규칙, 아니면 없음 |
| 취향을 어떻게 적용하나 | **강제한다**. 게이트가 0이 아닌 코드로 종료하고 통과할 때까지 루프가 반복한다 | 프롬프트로 제안하거나, 아무것도 안 함 |
| 렌더 결과물 채점 | 실제 WCAG 대비, 강조색 표면적, 리듬, 레이아웃 티를 픽셀에서 측정 | 기껏해야 소스 기준 자가 채점 |
| 위계 | 예측된 시선 순서가 눈을 아무 데도 못 이끄는 페이지를 잡아낸다 | 측정 안 함 |
| 컴포넌트 조달 | 294개 카탈로그에서 시그니처 적합도로 순위 | 잡동사니, 아니면 손으로 작성 |
| "완료" 기준 | 두 게이트 티어를 통과하고, 픽셀만 받은 상대가 AI임을 증명 못 함 | "내가 보기엔 괜찮은데" |
| 어디서 도나 | 로컬 Claude Code 세션. kit, 토큰, 규칙을 당신이 소유 | 호스팅형 제품 |

---

# 내부 구조

## 슬롭은 빌드 에러다

모든 것은 한 가지 결정에서 나온다. 취향을 게이트로 바꾼다는 것이다.

- 마크다운 스킬은 조언이다. 모델의 사전 확률 옆 문맥에 놓이고, 토큰과 시간 압박
  아래서 진다.
- 린터는 조언이 아니다. 소스를 훑고, 슬롭을 지목하고, 0이 아닌 코드로 종료한다.
  pre-commit에 연결하면 슬롭이 들어올 수 없다. 이것이 빠른 티어다.
- render audit은 grep이 못 가는 데까지 간다. 페이지를 렌더링해서 결과물의 완성도를
  측정한다. 키워드로는 2.9:1 대비를 없던 일로 만들 수 없다. 이것이 딥 티어다.
- `/uiforge:forge`는 모델이 두 게이트에 대고 반복하게 한다. 빌드하고, 린트하고,
  render audit을 돌리고, 지목된 위반을 정확히 고치고, 둘 다 통과할 때까지 반복한
  다음, 렌더된 픽셀에 대고 적대적 탐지기를 돌린다.

그래서 기준은 "모델이 취향 있게 만들려고 애썼다"가 아니다. 기준은 **"스크린샷만 받은
상대가 기계가 만들었음을 증명하지 못한다"**이다.

## 게이트 티어 상세

**`uiforge-lint` (소스).** 자기 자신에게 도그푸딩한다. 자기 before와 after 실행을
채점하고, 스스로 찾아낸 허점(`const` 안에 숨은 폰트)을 같은 날 고쳤다.

**`uiforge-render-audit` (렌더).** 측정하며, 어느 것도 조작할 수 없다.

- **WCAG 대비**. 텍스트 노드마다 실제로 합성된 배경에 대고 계산한다. `transparent`
  인 그라디언트 헤드라인은 1:1로 나오는데, grep은 못 보는 진짜 실패다.
- **강조색 표면적**. 겹치지 않는 샘플 격자에서 측정한다. "10% 미만" 규칙이 드디어
  강제된다. 흰색이나 검정에 가까운 톤 섞인 중립색은 중립으로 센다.
- **간격 리듬**. 형제 요소 사이의 서로 다른 세로 간격을 실제 기하학에서 잰다.
- **타입 스케일 정합성**. 서로 다른 크기의 개수와, 그것들이 하나의 모듈러 비율을
  따르는지 본다.
- **AI 레이아웃 패턴**. 한 줄에 폭이 똑같은 카드 여러 개, 정중앙에 놓인 거대한
  히어로.

`analyze()` 코어는 순수하고 브라우저가 필요 없어서, `--self-test`가 회귀 테스트로
함께 배포된다.

**`uiforge-attention` (위계).** 페이지가 모든 완성도 검사를 통과하고도 눈을 아무
데도 못 이끌 수 있다. 렌더에서 시선 순서를 예측하고(크기, 대비, 위치, 강조색, 굵기에
대한 saliency 근사) 명확한 초점이 하나인지 확인한다. slop fixture에서는 시선이 카드
#1–3으로 가고 헤드라인이 #4에 그친다. `/critique`는 이걸 점수가 아니라 **숫자를
근거로 인용하는, 관점 있는 크리틱**으로 보고한다.

<p align="center"><img src="./docs/attention-overlay.png?v=3150" alt="attention 오버레이. 에디토리얼은 위계가 정상이고 시선이 헤드라인에 닿는다. slop은 위계가 평평하고 시선이 카드 세 개로 가며 헤드라인은 네 번째에 그친다." width="100%"></p>

## 레퍼런스 상대 채점

`uiforge-extract`가 레퍼런스를 렌더링해서 시그니처를 도출한다. 그걸
`render-audit --spec signature.json`으로 다시 넣으면 채점이 절대 규칙에서 당신이 고른
레퍼런스로부터의 편차로 바뀐다. 맥시멀리스트 레퍼런스는 강조색 40%짜리 히어로를
허용하고, 에디토리얼 레퍼런스는 비대칭 레이아웃을 요구한다. 대비는 절대 굽히지
않는다. 같은 `analyze()` 엔진이 레퍼런스에서 스펙을 도출하고 타깃을 그 스펙에 대고
측정하므로, 그 차이가 곧 등급이다.

## 카탈로그

`uiforge-harvest`가 컴포넌트마다 소스에서 파싱한 정적 시그니처와 함께 `catalog.db`에
저장한다. radii, variant 축, 의미 있는 색 역할, 간격 스케일, 접근성 신호, 모션,
Radix 출처가 담긴다. `uiforge-source`가 그 294개 컴포넌트를 당신 시그니처에 맞춰
순위를 매기므로, 조달이 잡동사니가 아니라 출처 우선, 적합도 우선이 된다.

## 증거, 그리고 정직한 단서

`uiforge-corpus`가 라벨이 붙은 코퍼스에 대고 render audit을 돌려, 등급이 두 부류를
갈라내는지 보고한다. 함께 배포한 보정 세트에서는 분리가 깨끗하다. designed 91.3 대
template 39로 52점 차이이고, 인용한 통계가 아니라 재현할 수 있다
(`node tools/uiforge-corpus.mjs`).

<p align="center"><img src="./docs/corpus.png?v=3150" alt="코퍼스 분리. designed 페이지는 100점 만점에 91점 부근에, template 페이지는 39점 부근에 모여 52점 차이가 난다. 완전한 프로덕션 홈페이지에 관한 정직한 단서가 함께 붙어 있다." width="100%"></p>

대부분의 도구가 숨겼을 부분은 이렇다. 완전한 프로덕션 홈페이지는 점수가 더 낮게
나온다. Linear와 Stripe가 F를 받는다. 하지만 정직한 진단은(추측하지 말고 findings를
읽어라) 스냅샷 노이즈가 아니다. 스냅샷 하드닝을 넣어 봤지만 이 사이트들은 움직이지
않았다. 이건 단위 불일치다. 지표는 집중된 뷰나 히어로를 채점하는데, 이건 465개
노드짜리 여러 섹션 홈페이지다. 게다가 이 사이트들이 실제로 배포하는 진짜 WCAG 실패가
있다. Linear는 1:1 그라디언트 텍스트 span과 3.17:1짜리 12px 흐린 글씨를 렌더링하고,
Stripe는 2.39:1짜리 히어로를 낸다. 접근성 바닥이 그걸 잡아내는 건 옳다. UIForge는
집중된 뷰의 완성도와 엄격한 접근성을 채점하지, "이 사이트가 유명한가"를 가리는
탐지기가 아니다. 이건 내가 반증하고 정정할 수 있는 가설이고, 조작된 권위의
정반대다.

## 단계별 forge 사이클

의도가 먼저이고 컴포넌트가 마지막이다. 효과부터 고르면 장식으로 끝난다.

| 단계 | 하는 일 | 산출물 |
|---|---|---|
| **1. 논지(Thesis)** | 한 문장으로. 누구를 위한 것인지, 어떤 느낌인지, 기억에 남을 단 하나 | 확정한 브리프 |
| **2. 방향(Direction)** | 하나의 관점으로 확정하거나, 레퍼런스의 시그니처를 추출 | Editorial, Precise, Brutalist, Warm, Maximalist 중 하나 |
| **3. 시그니처(Signature)** | kit에서 `tokens.css`와 `motion.ts`를 먼저 방출 | 실제 폰트, 강조색 하나, 8px 스케일, 모션 시그니처 |
| **4. 조달(Source)** | 카탈로그를 시그니처에 맞춰 순위 매긴 뒤 설치 | 출처가 분명하고 접근성 있는 실제 컴포넌트 |
| **5. 조합(Compose)** | 시그니처 순간은 하나, 나머지는 조용히, 모든 상태를 설계 | 완성된 뷰 |
| **6. 강제(루프)** | 린트, render audit, attention을 돌리고 고치기를 전부 통과할 때까지 반복 | 모든 게이트 티어를 통과한 빌드 |
| **7. 덜어내기(Subtract)** | 가장 정당성이 약한 요소 하나를 제거 | 배포 전에 떼어낸 액세서리 |

## 디자인 신념

- **조언하지 말고 강제하라.** 게이트가 아닌 취향은 모델의 사전 확률에 진다.
- **덜어내는 것이 기예다.** 시그니처 순간은 하나로, 배포 전에 하나를 덜어낸다.
- **reduced-motion은 체크박스가 아니라 디자인이다.** 정지 화면이 그 자체로 훌륭해야
  한다.
- **발명보다 출처.** 실제 컴포넌트를 설치하고 props를 검증한다.
- **스타일은 일관된 제약이다.** 방향 하나로 확정하면 수천 개의 결정이 알아볼 수 있는
  하나로 수렴한다.
- **기준은 적대적이다.** "괜찮아 보인다"가 아니라 "기계가 만들었음을 증명할 수 없다"
  이다.

---

## 자주 묻는 질문

**React와 Tailwind 밖에서도 되나요?** 스킬의 판단은 프레임워크와 무관하다. kit과
shadcn MCP, Motion-Primitives는 React와 Tailwind, Motion을 전제한다. render audit은
렌더링되는 어떤 페이지에서도 동작한다.

**shadcn 레지스트리나 네트워크가 필요한가요?** 아니다. MCP 설치를 쓰고 싶으면
`/uiforge:setup`이 연결해 주지만, 직접 조합해도 된다. Motion-Primitives 엔드포인트는
봇 차단 뒤에 있어서 CI에서 가져올 때 429가 날 수 있지만, 대화형 설치는 된다.

**린터가 너무 엄격하지 않나요?** 기본으로는 블로커만 실패하고 경고는 권고다.
`--strict`는 무관용이고 `--max-score N`으로 조절한다. 일부러 단호하게 만들었다.

**결국 일반 규칙을 강제하는 루프 아닌가요?** 레퍼런스를 안 줄 때만 그렇다. 원하는
느낌의 사이트나 이미지에 `uiforge-extract`를 겨누면, 규칙이 그 레퍼런스의 측정된
시그니처가 된다. 타입 램프, 강조색 비중, 그리드, radii가 그렇다. 맥시멀리스트
레퍼런스는 맥시멀리스트 작업을 통과시키고, 에디토리얼 레퍼런스는 떨어뜨린다. 취향은
당신이 공급하고, UIForge는 지치지 않는 측정과 규모를 공급한다. 유일하게 상대화하지
않는 것이 접근성이다. WCAG 대비는 어떤 레퍼런스도 면제해 줄 수 없는 절대 바닥이다.

**내 디자인 시스템을 대체하나요?** 아니다. 좋은 기본기와 진짜 콘텐츠 위에 결정을
얹을 뿐이다. 할 말이 없는 페이지를 구해 주지는 못한다.

## 저장소 구조

```
UIForge/
├── README.md · README.ko.md · LICENSE
├── docs/                            # 증거 이미지 + 재현 가능한 전후 fixture
├── .claude-plugin/                  # plugin.json + 자체 설치 marketplace.json
├── .mcp.json                        # 공식 shadcn MCP (컴포넌트 출처)
├── commands/                        # forge · reskin · setup · critique · score
├── skills/                          # design-director · design-tokens · motion · content
└── tools/                           # 명령줄 도구 10개 + kit + 카탈로그
    ├── uiforge-lint.mjs             # 빠른 게이트 (소스)
    ├── uiforge-render-audit.mjs     # 딥 게이트 (렌더). WCAG, 강조색, 리듬, 레이아웃, --spec
    ├── uiforge-attention.mjs        # 시선 순서 + 위계, --overlay
    ├── uiforge-extract.mjs          # 레퍼런스 → signature.json (URL, HTML, 이미지)
    ├── uiforge-source.mjs           # 시그니처에 맞춰 카탈로그 순위
    ├── uiforge-catalog.mjs          # 카탈로그 질의. stats · search · show · near
    ├── uiforge-harvest.mjs          # catalog.db (재)구축
    ├── uiforge-corpus.mjs           # 라벨 코퍼스로 실증 검증
    ├── uiforge-score.mjs            # A–F 등급 래퍼
    ├── create-uiforge.mjs           # 연결된 프로젝트 스캐폴딩
    ├── tokens.template.css · kits/  # 토큰 어휘 + 완성 kit 다섯 개
    └── catalog/                     # 에셋 데이터베이스. catalog.db (294 컴포넌트) + manifest
```

## 출처와 계보

**[Motion-Primitives](https://motion-primitives.com)**(@ibelick),
**[Motion](https://motion.dev)**, **[shadcn](https://ui.shadcn.com)**(레지스트리와
MCP) 위에서 만들고 그것들에 맞춰 보정했다. 여기 담긴 취향은 **Refactoring UI**,
**Practical Typography**(Butterick), **Laws of UX**, **Material / Radix / Tailwind**
토큰, **Emil Kowalski**와 **Rauno Freiberg**의 모션 기예, 그리고 분포 수렴에 관한
**Anthropic**의 프런트엔드 디자인 지침에 기댄다. 폰트는 무료다(Fontsource와 Google
Fonts).

## 라이선스

[MIT](./LICENSE). 플러그인과 스킬, 명령, 도구에 적용된다. 이 도구가 설치하는 서드
파티 라이브러리나 내려받는 폰트에는 적용되지 않는다.
