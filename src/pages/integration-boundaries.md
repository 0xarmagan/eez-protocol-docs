---
description: "Support limits and external obligations outside the contracts: builder and prover, L2 funding, deployment and proof domains, event consumers."
---

# Integration boundaries

These are current support limits and external obligations, not claims that missing node, circuit or deployment behavior has been implemented. Bridge and all `src/periphery/` fixtures are test-only and outside the protocol audit scope.

## Builder and prover

- Follow the [call-identity matrix in Core §C](/core-protocol-spec#c-action-hash-computation). L2 incoming identity always binds the supplied cap; outgoing gas-independent mode does not change that rule. Source/destination hashes and rolling hashes need not coincide.
- Valid expected entry and sub-hashes exclude CALL_NOT_FOUND and CALL_INSUFFICIENT_GAS. Runtime hash equality cannot inspect a hash for forbidden markers. Accepting-mock probes characterize runtime behavior, not production proof acceptance. Ordinary enclosing reverts erase observations; explicit ContextResult transports the surviving hash/cursor across its rollback span.
- Reject or restructure static reads whose distinct required results share both the lookup context and callback hash. L2 top-level static rows match `proxyEntryHash` and `expectedEntryIndex == entryIndex`, so reads separated by successful mutable entry consumption can select different rows. Consuming entry `j` advances the cursor to `j + 1`; failed consumption rolls it back, static reads leave it unchanged, and a new table load resets it to zero. Callback-hash validation now skips mismatching static candidates, allowing local writes to select a different result even when the cursor or host hash is unchanged. Results that differ without a distinguishing callback hash can still alias, and retries need sufficient gas. Observed gas does not establish state-version uniqueness. See [the characterized limits](/call-pattern-limits) for the remaining runtime cases.
- Refresh tables when state or other dependencies invalidate cached results; this is a node obligation. A transaction boundary alone does not require reloading if results and lookup contexts remain valid within the load block. Transactions do not interleave, but application-local writes can occur between static reads within one transaction. Model partial consumption, retries and same-block table replacement. Every accepted L1 verification replaces participating queues; every L2 load replaces both active mapping prefixes and resets their lengths/cursor. Indexed getters can expose retained inactive rows; use `entriesLength` and `staticEntriesLength` when inspecting the current table. A valid proof does not guarantee every queued or immediate entry is delivered.
- Assign maximum batch/array sizes, nesting depth, scan budgets, returndata limits and delivery obligations to the composer/poster/node. The gas preflight is an estimate, not a universal resource bound. Document and reject work outside the supported integration budgets.

## L2 funding and inventory

The manager holds pooled ETH. Loading a table adds msg.value; replacing that table does not delete its balance or allocate funds to individual rows. For example, two 1 ETH loads with only one successful 1 ETH incoming transfer leave 1 ETH in the manager. Reverted transfers and terminally failed inbound loads unwind through EVM rollback.

The node/circuit must specify opening inventory, new funding/issuance, actual incoming payouts, transfers to SYSTEM_ADDRESS, direct/external balance changes and closing inventory. It must also choose how unused, skipped and replaced work affects retention/reuse/withdrawal of residual funds. No single per-load equality to committed or consumed values is currently enforced. Production node sequences and their conservation guarantees remain to be supplied and tested; this documentation does not invent that policy.

## Deployment and proof domains

The [reference deployment package](https://github.com/eez-association/eez-core-protocol/blob/143d87e/deployment/README.md) deploys EEZ, Rollup and EEZL2 behind upgradeable proxies, initializes Rollup atomically during proxy creation, and deploys the reference ECDSA verifier directly. Production deployments must choose their owners and validate compiler/EVM settings, migrations and storage/transient compatibility. Each ProxyAdmin owner can replace its implementation and immutable configuration independently of operational ownership. The reference upgrade scripts check the applicable immutable configuration and the managers' cross-chain proxy init-code hashes, but do not validate storage layouts. A ProxyAdmin owner can call `upgradeAndCall` directly without those script checks; deployment governance must enforce the intended review process.

CREATE2 uses argument-free CrossChainProxy creation code and the runtime manager as deployer. Compiler settings and source metadata affect the init-code hash, including comment-only changes under IPFS metadata. A deployment must pin its actual artifact and retain an address-continuity policy across upgrades for existing balances, approvals and authentication. Compiler-pinned CREATE2 and empty-frame hash reference vectors are not supplied by this document; deployments still need to pin their actual artifacts and review compatibility.

Reference Rollup initializes its owner, threshold and keys through `initialize`; its constructor sets the immutable EEZ address and disables implementation initialization. The directly deployed ECDSA verifier initializes its owner and signer in its constructor. Immutable values are not categorically incompatible with delegatecall; inspect each concrete deployment. Proof public inputs do not explicitly bind chain ID, registry or protocol version, so distinct deployment verification domains and freshness rules are external obligations.

## Event consumers

[EVENTS.md](/events) defines the existing schema and data requirements. Logs plus posting calldata, deployment configuration, relevant traces and balance reconciliation are needed for the stated reconstruction capabilities. Missing history must stay unknown. ABI migration, reducers, repeated-occurrence correlation and settlement discovery still require implementation checks; documenting them does not repair consumers.

## Test-only periphery

Bridge, WrappedToken and defiMock are fixtures for testing cross-rollup flows, not production deliverables or audit targets. No production bridge remediation is requested. Their assumptions include one canonical remote bridge address, first-caller initialization, nominal token amounts, and limited metadata handling. Bridge's EtherBridged field named sender currently carries the recipient, and Initialized is declared but not emitted. These are fixture behavior descriptions, not new event requirements.

Proxy authentication in receiveTokens does not establish a general multi-hop asset-origin/backing policy. Metadata fallback catches reverting getters; malformed successful string returns can still revert. Fee-on-transfer amounts, rebases, hooks and decimals conversion are not broadly supported. Tests must choose fixtures consistent with these intentional limits.
