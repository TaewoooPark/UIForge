<h1 align="center">motion-director</h1>

<p align="center">
  <strong>Claude Code를 위한 모션 아트 디렉터.</strong><br>
  <em>Motion-Primitives를 절제 있게 쓰게 만드는 플러그인 + 스킬 — 화면당 시그니처 모션 하나, 하나의 통일된 모션 서명, reduced-motion 우선 — 그래서 결과물이 AI 티가 아니라 사람이 손으로 만든 것처럼 나온다.</em>
</p>

<p align="center">
  <a href="./README.md">English README</a>
  &nbsp;·&nbsp;
  <a href="./skills/motion-primitives-director/SKILL.md">SKILL.md</a>
  &nbsp;·&nbsp;
  <a href="./skills/motion-primitives-director/references/directions.md">Directions</a>
  &nbsp;·&nbsp;
  <a href="./skills/motion-primitives-director/references/recipes.md">Recipes</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/TaewoooPark/motion-director?style=flat-square&labelColor=000000&color=333333&cacheSeconds=3600" alt="License">
  <img src="https://img.shields.io/github/v/release/TaewoooPark/motion-director?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=3600" alt="Latest release">
  <img src="https://img.shields.io/github/stars/TaewoooPark/motion-director?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=3600" alt="GitHub stars">
  <img src="https://img.shields.io/github/last-commit/TaewoooPark/motion-director?style=flat-square&labelColor=000000&color=333333&cacheSeconds=3600" alt="Last commit">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude%20Code-000000?style=flat-square&logo=anthropic&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Claude Code">
  <img src="https://img.shields.io/badge/Plugin-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="Plugin">
  <img src="https://img.shields.io/badge/Skill-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="Skill">
  <img src="https://img.shields.io/badge/shadcn%20MCP-000000?style=flat-square&logo=shadcnui&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="shadcn MCP">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Motion--Primitives-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="Motion-Primitives">
  <img src="https://img.shields.io/badge/Motion-000000?style=flat-square&logo=framer&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Motion">
  <img src="https://img.shields.io/badge/React-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="React">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-000000?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Tailwind CSS">
</p>

---

> **한 문장:** 아트 디렉터처럼 모션을 연출한다 — 먼저 *무엇이 왜 움직여야 하는가* 를 정하고,
> 하나의 모션 서명을 방출한 뒤, 그 순간에 필요한 것만 Motion-Primitives 레지스트리에서
> 설치하고, 배포 전에 가장 정당성 약한 애니메이션을 덜어낸다.

- 🎬 **장식이 아니라 연출** — 이 스킬은 컴포넌트 카탈로그가 아니라 아트 디렉터다. *언제 무엇을 어떤 절제로 움직일지* 를 가르치지, 33개 효과를 한 페이지에 우겨넣는 법을 가르치지 않는다.
- ➖ **뺄셈이 기본** — 모든 애니메이션은 필요성이 증명되기 전까지 유죄. 화면당 예산: 시그니처 모션 **하나** + 기능적 마이크로 인터랙션 **2~3개**, 나머지는 정적.
- 🎛️ **하나의 모션 서명** — easing 커브 + duration 스케일 + spring을 담은 단일 `motion.ts`에서 모든 컴포넌트가 값을 파생한다. 그래서 화면 전체가 "한 사람이 디자인한" 느낌이 된다.
- ♿ **reduced-motion이 곧 디자인** — 정적 버전이 먼저 좋아야 한다. 모션은 강화 레이어일 뿐이고, `prefers-reduced-motion`은 나중에 붙이는 체크박스가 아니라 설계의 출발점이다.
- 🧩 **진실의 원천은 레지스트리** — 컴포넌트는 공식 **shadcn MCP**(또는 Motion-Primitives CLI)로 설치한다. 스킬은 컴포넌트 소스나 prop을 절대 손으로 짓지 않는다.
- 🚫 **slop을 이름으로 부른다** — 스크롤마다 fade-up, 카드마다 보라 글로우, 이유 없는 타이핑/스크램블, 무한 마퀴, 전부에 tilt — 이름을 붙여 지목하고 즉시 컷.
- 🧭 **커밋하는 4개 방향** — `precise/mechanical`, `soft/organic`, `editorial/restrained`, `kinetic/expressive`. 각각 구체 서명값과 캘리브레이션 타깃을 갖는다.

## 왜 만들었나 (Why It Exists)

기본값 AI 모션은 slop이다. 범용 모델에게 "이 랜딩을 고급스럽게" 시키면 스크롤 섹션마다
fade-up, 카드마다 보라 그라디언트 글로우, 이유 없이 타이핑되는 텍스트, hover마다 tilt가
나온다. 전부 움직인다 — 그리고 "전부 움직인다"는 것이야말로 디자이너가 아니라 기계가
만들었다는 가장 큰 신호다.

`motion-director`는 그 본능을 뒤집는다. **모션 레이어만** 담당하고(레이아웃·위계·타이포는
이미 좋다고 전제한다) 단 하나의 규율을 적용한다: 움직여야 할 그 한 순간과 이유를 정하고,
하나의 모션 서명에 커밋하고, 그 순간에 필요한 것만 설치하고, 배포 전에 가장 약한
애니메이션을 지운다. 핵심은 모션을 더 넣는 게 아니라 **더 적게·더 정확하게·더 일관되게**
쓰는 것 — 그래서 결과물이 데모 릴이 아니라 Linear나 Vercel처럼 보이게 하는 것이다.

## 어떻게 동작하나 (How It Works)

두 개의 레이어. **취향 레이어**(이 스킬)가 의도·예산·서명을 정하고, **컴포넌트
레이어**(shadcn MCP로 설치되는 Motion-Primitives)가 검증된 부품을 공급한다. 스킬은 하나의
루프를 돌며, 컴포넌트는 **맨 마지막**에 고른다 — 효과를 먼저 정하면 장식으로 끝난다.

```
1  모션 논지      "로드되는 순간 사용자는 ___를 느끼고 시선은 ___로."  (한 문장)
2  방향 선택      precise · soft · editorial · kinetic          → references/directions.md
3  motion.ts 방출  easing 1개 + duration 스케일 + spring (서명)
4  예산 배정      시그니처 1개 + 마이크로 2~3개, 나머지 정적
5  컴포넌트 매핑   이제서야, 그 순간 → 프리미티브                → references/components.md
6  설치          shadcn MCP / 레지스트리 — 소스를 짓지 않는다
7  합성          정확한 시퀀스·stagger·타이밍                   → references/recipes.md
8  비평 + 뺄셈     루브릭 실행, 가장 약한 모션 제거              → references/critique.md
```

### 모션 예산

**뷰** 하나당(히어로도 뷰, 가격 섹션도 뷰): 시그니처 모션 최대 **1개**, 200ms 미만
마이크로 인터랙션 **2~3개**, 나머지는 정적. chrome(내비·푸터·툴바)은 움직이지 않는다.
희소성이 곧 취향이다.

### 하나의 모션 서명

컴포넌트를 건드리기 전에 스킬은 `motion.ts` 토큰 파일 — easing 커브 1개, duration 스케일
1개, spring 1개 — 을 방출하고, 이후 모든 `transition`/spring prop이 여기서 파생된다. 구체
수치: 진입 200–400ms, **이탈이 더 빠름**(150–250ms), stagger 20–60ms(200ms 아님), 중요한
요소를 600ms 넘는 delay 뒤에 숨기지 않기. 전체에 하나의 언어.

### reduced-motion이 곧 디자인

리트머스 시험: 모든 애니메이션을 꺼도 화면이 좋아야 한다. 정적 버전이 초라하면 모션이 약한
디자인을 가린 것이다. 모든 레시피는 즉각적이고 완결적인 `prefers-reduced-motion` 경로를
갖는다 — 절대 절반만 채워진 화면이 아니다.

## 설치 (Install)

Claude Code 안에서 이 저장소를 플러그인 마켓플레이스로 추가하고 설치한다:

```
/plugin marketplace add TaewoooPark/motion-director
/plugin install motion-director@motion-director
```

또는 로컬 개발용으로 로드하거나, 스킬만 스킬 디렉토리에 넣는다:

```bash
git clone https://github.com/TaewoooPark/motion-director.git

# 방법 A — 플러그인을 로드한 채로 Claude Code 실행
claude --plugin-dir ./motion-director

# 방법 B — 스킬만 (플러그인/MCP 없이), 다음 세션에 자동 로드
cp -r ./motion-director/skills/motion-primitives-director ~/.claude/skills/
```

**요구사항**

| | |
|---|---|
| Claude Code | 플러그인/스킬은 세션 안에서 동작 |
| 대상 프로젝트 | React / Next.js + Tailwind CSS + [Motion](https://motion.dev) — 컴포넌트가 실제 동작하려면 |
| shadcn | MCP/레지스트리 설치를 위해 초기화된 프로젝트(`components.json`) — 또는 `npx motion-primitives@latest add` 대안 |
| Node / npx | shadcn MCP 서버와 컴포넌트 설치용 |

번들된 `.mcp.json`은 **공식** shadcn MCP(`npx shadcn@latest mcp`)를 띄운다 — 커스텀 MCP는
없다. 대상 프로젝트에서 `/motion-director:motion-setup`을 실행하면 `@motion-primitives`
레지스트리와 `motion` / `lucide-react` / `cn` 전제조건을 보장한다.

## 사용법 (Usage)

라이브러리 이름을 명시하지 않아도 자연어로 스킬이 발동한다:

```
개발자 도구 스타트업 랜딩 히어로를 만들어줘, 고급스럽고 절제된 느낌으로
이 가격표에 인터랙션 넣어서 살아있게 만들어줘 (과하지 않게)
대시보드 빈 상태가 너무 밋밋해 — 모션으로 살려줘
```

슬래시 커맨드로 프로젝트의 레지스트리 + 전제조건을 준비한다(설치할 컴포넌트를 옵션으로 전달
가능):

```
/motion-director:motion-setup
/motion-director:motion-setup text-effect
```

그러면 스킬이 위 루프 — 논지 → 방향 → 서명 → 예산 → 컴포넌트 → 설치 → 합성 → 비평 — 를
돌려, 정확히 한 가지가 모션을 짊어지는 디자인을 돌려준다.

## 방향 (Directions)

프로젝트마다 하나를 골라 커밋한다. 그 선택이 `motion.ts` 값과 어떤 프리미티브를 쓰고(또한
금지하고) 무엇을 배제할지를 고정한다.

| 방향 | 성격 | 서명 (시작값) | 캘리브레이션 |
|---|---|---|---|
| **precise / mechanical** | 스냅, 바운스 없음 | ease `cubic-bezier(0.2,0,0,1)`, 120–240ms, stagger 20–40ms | Linear, Vercel 대시보드 |
| **soft / organic** | 스프링 중심의 온기 | spring `stiffness 220, damping 26`, 체감 ~300–450ms | Family, Arc, iOS 시트 |
| **editorial / restrained** | 거의 정적 + 한 번의 등장 | 500–700ms 등장 1회, 나머지 정지 | Vercel/Apple/Stripe 페이지 |
| **kinetic / expressive** | 플레이풀, 그래도 시그니처는 1개 | spring `stiffness 300, damping 14`, 오버슈트 허용 | 플레이풀 브랜드 마이크로사이트 |

전체 값·어울리는/금지 프리미티브·타깃은
[`references/directions.md`](./skills/motion-primitives-director/references/directions.md)에.

## 저장소 구조 (Repository Layout)

```
motion-director/
├── README.md · README.ko.md · LICENSE
├── .claude-plugin/
│   ├── plugin.json           # 플러그인 매니페스트
│   └── marketplace.json      # 자체 설치용 마켓플레이스
├── .mcp.json                 # 공식 shadcn MCP 서버 (npx shadcn@latest mcp)
├── commands/
│   └── motion-setup.md       # /motion-director:motion-setup
└── skills/
    └── motion-primitives-director/
        ├── SKILL.md          # 항상 로드되는 디렉터 코어 (< 500줄)
        └── references/
            ├── directions.md # 4개 모션 방향 + 서명값
            ├── components.md # 33개 프리미티브: 의도 → 물리값 → 역할
            ├── recipes.md    # 검증된 오케스트레이션 (히어로·내비·가격표…)
            └── critique.md   # 배포 전 루브릭 + 강제 뺄셈 패스
```

이 저장소는 원본 MIT 라이선스 작업물이다. 컴포넌트 소스는 벤더링하지 않는다 —
Motion-Primitives 컴포넌트는 빌드 시점에 레지스트리에서 설치된다.

## 참고 & 한계 (Notes & Limitations)

- **스킬은 모션을 연출할 뿐, 앱을 재-스타일링하지 않는다.** 좋은 일반 디자인(레이아웃·색·
  타이포)을 전제하고 그 위에 모션 결정만 얹는다. 필요하면 일반 디자인 가이드와 함께 쓰라.
- **컴포넌트는 레지스트리에서 오지, 지어내지 않는다.** `components.md`의 prop·기본값은
  컴포넌트 소스에서 읽은 것이다(Motion-Primitives는 beta — prop이 이상하면 `components.json`
  /소스로 검증).
- **레지스트리 엔드포인트는 봇 체크포인트 뒤에 있다.** `motion-primitives.com`에 대한
  자동/CI 요청은 `429`가 날 수 있다. 인터랙티브 `npx shadcn add`는 동작하며,
  `npx motion-primitives@latest add <name>`이 상시 대안이다.
- **Pro(유료) 컴포넌트는 범위 밖** — 무료 코어 세트만.

## 출처 (Attribution)

- **[Motion-Primitives](https://motion-primitives.com)** —
  [@ibelick](https://github.com/ibelick) 제작. 이 스킬이 연출하는 컴포넌트 레지스트리(MIT).
  컴포넌트는 여기서 설치되며, 이 저장소에 벤더링되지 않는다.
- **[Motion](https://motion.dev)** (구 Framer Motion) — 프리미티브가 올라탄 애니메이션 엔진.
- **[shadcn](https://ui.shadcn.com)** — 이 플러그인이 재사용하는 레지스트리 규격과 공식 MCP 서버.

이 저장소의 원본 작업물은 [MIT License](./LICENSE)로 배포된다 — 이는 스킬·플러그인·커맨드에만
해당하며, 설치되는 서드파티 라이브러리나 그들이 반환하는 데이터에는 해당하지 않는다.
