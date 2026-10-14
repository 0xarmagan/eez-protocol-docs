---
target: intro page
total_score: 22
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/armagan/Documents/agent-mesh-technical/eez-docs/src/pages/index.mdx"
target_fingerprint: "sha256:843021ad52f6e06153708f9f583f6437b7dba5d9da85ea08e1f122007ea93806"
target_path: /Users/armagan/Documents/agent-mesh-technical/eez-docs/src/pages/index.mdx
timestamp: 2026-10-14T22-18-49Z
slug: src-pages-index-mdx
---
Method: dual-agent (A: design review · B: detector/browser evidence)

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Active item + commit pin clear; no signal whether 143d87e is still current main |
| 2 | Match System / Real World | 3 | Lede uses based rollup / proof systems with no gloss |
| 3 | User Control and Freedom | 3 | Nav, search, Next link fine; skip link leaves the site (base-path bug) |
| 4 | Consistency and Standards | 2 | "Start here" vs sidebar "Walkthrough"; CTA row mixes a name with page counts |
| 5 | Error Prevention | n/a | Read-only page |
| 6 | Recognition Rather Than Recall | 3 | Cards mirror sidebar; recognisable but redundant |
| 7 | Flexibility and Efficiency | 3 | Cmd-K and Ask AI; no fast path to contracts/functions |
| 8 | Aesthetic and Minimalist Design | 3 | Clean; four equal-weight cards dilute the entry |
| 9 | Error Recovery | n/a | Nothing to recover from |
| 10 | Help and Documentation | 2 | No prerequisites/glossary near the hero |
| Total | | 22/32 | Good (69%, borderline Acceptable) |

Specificity: mostly authored (bracket eyebrows, grid, hover-only gradient, commit pin); generic H1 and a 2x2 grid that repeats the sidebar are category-interchangeable.
Detector: source clean; built-page scan 4-5 findings: overused-font (brand-mandated, FP), wide-tracking 0.10em on short uppercase mono labels (spec, FP), repeating-stripes and cramped-padding from Vocs vendor CSS (FP), low-contrast on Ask AI backdrop (unverified), script-error caused by base tag.

Priority issues:
1. [P1] Base path bug: <base href> emitted twice, skip link resolves to github.io/#vocs-content, canonical/og:url doubled (/eez-protocol-docs/eez-protocol-docs/). Fix: baseUrl = https://0xarmagan.github.io (origin only). /impeccable harden
2. [P1] Start here not emphasised: four equal cards for a first-timer. Fix: card 01 full-width primary, 02-04 compact row. /impeccable layout
3. [P2] Lede overloaded: ~50 words, five concepts. Fix: tighten, link based rollups / proof systems. /impeccable clarify
4. [P2] Naming/CTA drift: Start here vs Walkthrough; CTA mixes label and counts. Fix: one kind of CTA (1 PAGE / 5 PAGES / 3 PAGES), consistent name. /impeccable clarify
5. [P2] Card numbers #4d4d4d on #161616 = 2.14:1. Fix: ~#707070 or aria-hidden. /impeccable audit

Personas: Jordan - jargon in sentence one, no prerequisites. Sam - card numbers fail contrast; skip link exits site. Alex - no direct contract/function entry from hero.
Minor: mobile cards heavy (min-height 190px) and Ask AI pill covers card 04; card titles render lighter than declared 600; green nearly absent from page body.
Questions: should / just be the Walkthrough with a short preface? Primary reader integrator or reviewer? Should the commit pin show "behind main by N"?
