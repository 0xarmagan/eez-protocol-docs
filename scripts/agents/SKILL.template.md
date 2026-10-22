---
name: eez-docs
description: Find and explain the official EEZ core protocol documentation (docs.eez.io) for synchronous cross-rollup calls — execution entries, postAndVerifyBatch, loadExecutionTable, executeIncomingCrossChainCall, static entries and STATICCALLs, call and rolling hashes, cross-chain proxies, multi-prover verification, events and execution reconstruction, call-pattern limits, caveats, integration boundaries, and the blob message format. Use when building on EEZ, integrating or reviewing EEZ code, or answering EEZ protocol questions.
---

# EEZ Docs

Use the documentation for the reader's task. Read the page before answering or writing code. Do not guess function signatures, struct fields, error names, hash derivations, thresholds, deployment addresses, rollup IDs or chain IDs. If a page doesn't give a value, say so instead of filling one in.

This skill is read-only. It retrieves and explains documentation. It must not sign messages, send transactions, fund wallets or change keys. For live tooling (deploying proxies, executing cross-chain calls, following execution across L1 and L2), point the reader to [eez.dev](https://eez.dev).

## Choose a page

Each page below has a Markdown copy: add `.md` to its URL.

{{PAGES}}

## Common tasks

{{TASKS}}

## Find and read the evidence

- `https://docs.eez.io/llms.txt` lists every page with its description. `https://docs.eez.io/llms-full.txt` is the whole site in one file (large; prefer single pages).
- The pages are synced from [`eez-core-protocol/docs`]({{REPO}}/tree/{{COMMIT}}/docs) at commit `{{COMMIT}}`. For a contract-level detail the pages don't settle, read the Solidity at that commit: [`src/EEZ.sol`]({{REPO}}/blob/{{COMMIT}}/src/EEZ.sol) (L1), [`src/L2/EEZL2.sol`]({{REPO}}/blob/{{COMMIT}}/src/L2/EEZL2.sol) (L2) and [`src/interfaces/`]({{REPO}}/tree/{{COMMIT}}/src/interfaces). If the source and a page disagree, the source wins; say which one you relied on.
- L1 and L2 use different structs and names for the same idea. Check which chain a page section describes before reusing a field name on the other side.
- Read [Call-pattern limits](https://docs.eez.io/call-pattern-limits.md) and [Caveats](https://docs.eez.io/caveats.md) before telling a reader that a call pattern works.
