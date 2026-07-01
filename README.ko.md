<h1 align="center">UIForge</h1>

<p align="center">
  <strong>AI slop이 아니라 명작 UI를 벼려낸다 — Claude Code용 디자인 아트 디렉터.</strong><br>
  <em>모든 디자인 축(타입·색·여백·모션·카피)마다 의도적 선택을 강제하고, 검증된 레지스트리에서 컴포넌트를 조달하며, 정당성 없는 것은 덜어낸다 — 그래서 결과가 "생성된" 게 아니라 "손으로 만든" 것처럼 읽힌다.</em>
</p>

<p align="center">
  <a href="./README.md">English README</a>
  &nbsp;·&nbsp;
  <a href="./skills/design-director/SKILL.md">Design Director (브레인)</a>
  &nbsp;·&nbsp;
  <a href="./skills/design-director/references/anti-slop.md">Anti-slop</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/TaewoooPark/UIForge?style=flat-square&labelColor=000000&color=333333&cacheSeconds=3600" alt="License">
  <img src="https://img.shields.io/github/v/release/TaewoooPark/UIForge?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=3600" alt="Latest release">
  <img src="https://img.shields.io/badge/Claude%20Code-000000?style=flat-square&logo=anthropic&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Claude Code">
</p>

---

> **한 문장:** AI UI가 slop인 건 *distributional convergence* 때문이다 — "예쁘게"라고
>하면 모델이 훈련데이터 중앙값(Inter·보라 그라디언트·중앙 히어로·카드 3장)으로 붕괴한다.
> UIForge의 일은 **기본값을 결정으로 바꾸는 것**: 논지 → 방향 하나 커밋 → 디자인 서명을
> 토큰으로 *먼저* 방출 → 검증된 레지스트리에서 조달 → 배포 전 강제 뺄셈.

## 포지(forge) 파이프라인

1. **의도 논지** — 한 문장(대상 · 느낌 · 기억될 단 하나).
2. **방향 하나 커밋** — "모던하고 깔끔"이 아니라 진짜 관점.
3. **서명 먼저 방출** — `tokens.css` + `motion.ts`; 모든 값이 여기서 파생.
4. **레지스트리에서 조달** — 검증·접근성, 창작이 아니라 provenance.
5. **예산에 맞춰 조합** — 시그니처 하나, 나머지는 정적.
6. **블라인드 비평** — 렌더된 결과를 판정, 가능하면 스크린샷.
7. **강제 뺄셈** — 가장 정당성 약한 하나를 제거. 필수.

## 설치

```
/plugin marketplace add TaewoooPark/UIForge
/plugin install uiforge@uiforge
```

로컬: `git clone https://github.com/TaewoooPark/UIForge.git && claude --plugin-dir ./UIForge`.
번들된 `.mcp.json`이 공식 **shadcn MCP**(`npx shadcn@latest mcp`)를 띄운다 — 커스텀 MCP 없음.

## 로드맵 (릴리즈마다 배포)

- **v2.1.0** design-director 레퍼런스(방향·비평·레지스트리 taste-map) · **v2.2.0** `design-tokens` 스킬
- **v2.3.0** `motion` 심화(easing/spring 정전) · **v2.4.0** `content` 스킬
- **v2.5.0** 커맨드(`/uiforge:forge·setup·critique` + render→screenshot 루프) · **v2.6.0** 전체 README(EN/KO)

_UIForge는 `motion-director`의 후속이다 (모션 레이어는 이제 전면 디자인 디렉터의 한 부분)._

## 라이선스

[MIT](./LICENSE).
