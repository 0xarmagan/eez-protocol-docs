---
description: "Event signatures, ordering, rollback behavior and reconstruction from committed receipts and execution inputs, for the current contracts."
---

# Events and execution reconstruction

Updated 2026-10-12. Reference for the current contracts: event signatures, ordering,
rollback behavior and reconstruction from committed receipts and execution inputs.

This reference describes the existing event interface. The tracked fixtures below
cover specific mappings and evidence checks; they do not establish universal
reconstruction of every call pattern from receipts and inputs.

## Current event interface

Documentation schema revision: **events-2026-09-24**. This names the existing wire schema; it adds no on-chain version field or new events. L1 `EntryExecuted` carries only its entry index and rolling hash; `L2TxExecuted` remains. Consumers must bind an ABI to chain, manager address and implementation/code version, including upgrade activation boundaries. Derive concrete-contract ABIs from compiled artifacts; the narrow IEEZ interfaces do not declare events.

`BatchPosted(bytes32 sharedPublicInput, uint64[] rollupIds)` has two non-indexed fields. Its canonical topic signature is `BatchPosted(bytes32,uint64[])`; the participant count is `rollupIds.length`. Use an artifact compiled from the selected implementation source when deriving consumer ABI expectations.

## Identity, counters and rollback

Retain full hashes internally. A call hash identifies encoded inputs and can repeat; a shared public input is a commitment, not a batch nonce. Identify a committed log by chain, transaction hash and log index, retain emitter and block hash, and roll back derived state on reorg. Track queue/table generations per manager and rollup with ordered posting/load occurrences; successful replacement resets tables/cursors even within one block.

An execution occurrence also needs table kind and row position. L1 immediate entries report index zero, meta-hook indices refer to the copied suffix, and persistent indices refer to a particular rollup queue generation. L2 indices refer to its loaded table. Nested arrays restart call numbering; payload coordinates alone cannot identify a frame. Use complete decoded inputs and ordered receipt history to recover context. The tracked fixtures below cover specific mappings and evidence checks; unavailable inputs or erased runtime details can require other execution evidence. Cross-chain matching needs supported source/delivery context: the gas policies in [CORE §C](/core-protocol-spec#c-action-hash-computation) can produce unequal identities.

L2 entry completion counters report direct input-array length and the final forward-scan cursor, not recursive dispatch totals or number of matching rows. L1 `EntryExecuted` does not emit those counters. Rollback-span lengths are requested bounds. With a policy-negative accepting verifier/table, gas shortage can stop an array early while those lengths remain unchanged; valid proofs must exclude failure markers. A successful entry can contain naturally failing target calls.

For registration, a custom callback may change the root before `RollupCreated` is emitted. The event reads the root from storage after the callback: registering with root 1 and changing it to 99 in the callback emits `RootUpdated(99)` followed by `RollupCreated(initialRoot=99)`. The reference Rollup's proxy `initialize` call emits `OwnershipTransferred`, `ThresholdChanged` (including for zero), then one `ProofSystemAdded` per initial proof system in input order, followed by `Initialized(1)`. Its implementation constructor instead disables initialization and emits `Initialized(type(uint64).max)` at the implementation address. Replay membership, keys and threshold from the proxy's initialization logs, including any owner updates before registration. Older deployments without these initialization logs still require deployment inputs or an explicit initial snapshot.

## Current protocol and reference-contract events

Many events already have indexed fields, marked in the catalog below. Indexing
supports RPC filtering; it does not make repeated values unique or add information
to a complete receipt. BatchPosted has no indexed fields.

`^` marks indexed fields; all other fields are non-indexed. Every listed event is non-anonymous. Tuple order below is part of the wire schema.

| Emitting implementation | Ordered event fields | Meaning/qualification |
| --- | --- | --- |
| Both managers | `CrossChainProxyCreated(address proxy^, address originalAddress^, uint64 originalRollupId^)` | Manager emits after deployment/authorization; reuse emits nothing; CrossChainProxy itself emits no events |
| L1 | `CrossChainCallExecuted(bytes32 crossChainCallHash^, address proxy^, address sourceAddress, bytes callData, uint256 value)` | Outgoing initiation before resolution; inherited into L2 ABI but unused there |
| L1 | `RollupCreated(uint64 rollupId^, address rollupContract^, bytes32 initialRoot)` | After registration callback; initialRoot is the root then stored for the rollup |
| L1 | `RootUpdated(uint64 rollupId^, bytes32 newRoot)` | Root escape write, not ordinary entry updates |
| L1 | `L2ExecutionPerformed(uint64 rollupId^, bytes32 newRoot, uint256 etherBalance)` | Per-update post-write root and absolute ledger balance; final entry failure discards it |
| L1 | `ExecutionConsumed(bytes32 crossChainCallHash^, uint64 rollupId^, uint256 entryQueueIndex^)` | Cursor advanced before execution; queue/hook context required; absent for inline immediate entries |
| L1 | `L2TxExecuted(uint64 rollupId^)` | `executeL2Txs` initiation before consumption; absent from inline immediate path |
| L1 | `BatchPosted(bytes32 sharedPublicInput, uint64[] rollupIds)` | After verification/immediate/hook/publication/cleanup; sorted participant IDs; posting is not full delivery |
| L1 | `L2TxSkipped(uint256 entryIndex^, bytes revertData)` | Original batch index, caught nonempty failure in a committed outer post |
| Both managers | `CallResult(uint256 entryIndex^, uint256 callNumber^, bool success, bytes returnData)` | Local array position; L1 calls the second field `l2ToL1CallNumber`; naturally failed target may be retained |
| L1 | `EntryExecuted(uint256 entryIndex^, bytes32 rollingHash)` | Completion marker; terminal entry revert removes it |
| L2 | `EntryExecuted(uint256 entryIndex^, bytes32 rollingHash, uint256 callsProcessed, uint256 outgoingCallsConsumed)` | Direct-array length and final nested cursor; terminal entry revert removes it |
| Both managers | `CallsReverted(uint256 entryIndex^, uint256 startCallNumber, uint256 nCalls)` | Outer span bounds after context recovery; L1 names start `startL2ToL1Call`; interior logs disappear |
| L2 | `ExecutionTableLoaded(ExecutionEntry[] entries, StaticExecutionEntryL2[] staticEntries)` | Both complete arrays after replacement/cursor reset; inbound failure rolls it back |
| L2 | `ExecutionConsumed(bytes32 crossChainCallHash^, uint256 entryIndex^)` | Ordinary path advances first; inbound path emits before execution and advances to 1 only on success |
| L2 | `IncomingCrossChainCallExecuted(bytes32 crossChainCallHash^, bool isStatic, address sourceAddress, uint64 sourceRollup, address destination, uint256 value, uint64 callGas, bytes data)` | First inbound call after binding, before execution; delivery does not certify target success |
| L2 | `CrossChainCallExecuted(bytes32 crossChainCallHash^, address proxy^, address sourceAddress, bytes callData, uint256 value, uint64 callGas)` | Actual six-field outgoing overload, after system value transfer/sampling and before resolution |
| Reference Rollup | `ProofSystemAdded(address proofSystem^, bytes32 verificationKey)` | Post-write membership addition, including each initializer entry |
| Reference Rollup | `ProofSystemRemoved(address proofSystem^)` | After successful deletion |
| Reference Rollup | `VerificationKeyUpdated(address proofSystem^, bytes32 newVerificationKey)` | Assigned key; same-value assignment may emit |
| Reference Rollup | `ThresholdChanged(uint256 newThreshold)` | Assigned threshold, including proxy initialization (even zero) |
| Reference Rollup | `RootEscape(bytes32 newRoot)` | After registry success; registry `RootUpdated` appears first |
| Reference ECDSA | `SignerUpdated(address oldSigner^, address newSigner^)` | Constructor `(0,initialSigner)` and setter, including same-value assignment |
| Rollup and ECDSA, inherited Ownable | `OwnershipTransferred(address previousOwner^, address newOwner^)` | Initialization, transfer and renunciation after owner write |
| Reference Rollup, inherited Initializable | `Initialized(uint64 version)` | Proxy initialization emits version 1; implementation constructor emits `type(uint64).max` when disabling initializers |

L1 has 12 concrete signatures. L2 emits eight signatures and also inherits the unused five-field outgoing signature. Generic custom managers/verifiers are not required by their current interfaces to emit all reference lifecycle events.

L2 table tuple order, from [IEEZL2](https://github.com/eez-association/eez-core-protocol/blob/143d87e/src/interfaces/IEEZL2.sol):

```text
CrossChainCall = (uint16 revertNextNCalls, bool isStatic, uint64 gas,
  address sourceAddress, uint64 sourceRollupId, address targetAddress,
  uint256 value, bytes data)
ExpectedOutgoingCrossChainCall = (bytes32 expectedOutgoingHash,
  CrossChainCall[] incomingCalls, bytes32 revertedOrStaticRollingHash,
  bool success, bytes returnData)
ExecutionEntry = (bytes32 proxyEntryHash, CrossChainCall[] incomingCalls,
  ExpectedOutgoingCrossChainCall[] expectedOutgoingCalls,
  bytes32 rollingHash, bool success, bytes returnData)
StaticExecutionEntryL2 = (uint256 expectedEntryIndex, bytes32 proxyEntryHash, CrossChainCall[] incomingCalls,
  bytes32 rollingHash, bool success, bytes returnData)
```

### What committed logs can establish

| Domain | Logs alone? | Additional requirement |
| --- | --- | --- |
| Rollup IDs/manager bindings, proxy remote identities | Yes with complete history | Chain/emitter identity; reference/custom policy and registration ordering |
| L1 roots | Generally | Creation plus escape plus entry-update events; creation reports the stored root after the registration callback |
| L1 per-rollup ledger balances | Yes | Initialize zero at registration; apply ordered absolute snapshots |
| Posting occurrence/participant IDs | Yes | Receipt/log identity; shared commitment is not a unique nonce or full proof |
| L1 queue/static-pool contents and full proof batches | No | Posting calldata, routing/counts, generation resets, historical policy/custom-data and relevant transaction context; traces for nested invocations |
| L2 complete loaded tables/top-level cursor | Yes with complete manager history | Current two-array schema, replacement semantics, committed consumption and block expiry |
| Every call result/nested frame | Partial | Call/table context; coordinates repeat; static resolution and rolled-back results are absent |
| Failed/reverted top-level attempts and their details | No | Transaction failure status plus traces/replay for discarded events/results |
| Initial reference Rollup proof-system membership/keys/threshold | Yes with deployment history | Proxy initializer `ThresholdChanged` and `ProofSystemAdded`; older deployments without initialization logs need an initial snapshot or deployment calldata/traces |
| Reference signers/owners | Yes | History from deployment, including initialization events |
| Independent physical ETH-flow reconciliation | No | Values, payloads, traces/recovery outcomes and balance reconciliation |

A trace `LOG` instruction is not a committed receipt log. Attempted trace logs can exist even when a terminal revert leaves the receipt with no logs. Forced-span internal logs likewise disappear; outer `CallsReverted` survives only when its own frame commits. Read-only static paths cannot emit LOGs. Hash tags such as `CALL_BEGIN` are hash-domain transitions, not missing Solidity events. Unknown history must not silently become empty queues, zero initial configuration or proof of target success.

## Interface scope

Bridge, WrappedToken and defiMock are test-only periphery, outside the protocol audit and supported event-interface scope. Their fixture event quirks are described in source comments; this catalog makes no production indexing guarantee for them.

## Reconstruction evidence

Reconstruction assumes complete decoded posting and L2 table-load inputs,
association with their successful occurrences, deployment configuration and ordered
replacement/consumption history. Internal wrapper inputs may require traces or replay
to obtain. Obtaining those inputs is separate from demonstrating reconstruction once
they are available; L1 and L2 occurrences remain independent.

| Evidence | Established result | Limit |
| --- | --- | --- |
| [Three top-level mapping tests](https://github.com/eez-association/eez-core-protocol/blob/143d87e/test/ExecutionLogReconstruction.t.sol) | Immediate completions map by input order despite index zero; meta entries map through their suffix offset; interleaved deferred entries map through per-rollup queues. | These are focused `vm.recordLogs()` fixtures, not a universal committed-receipt decoder. |
| [Nested-coordinate test](https://github.com/eez-association/eez-core-protocol/blob/143d87e/test/EEZ.t.sol) | Parent and child can both emit call/entry zero; child completes before parent, and this fixture's order/results distinguish them. | A collision of payload numbers is not a demonstrated ambiguous reconstruction. |
| [E2E event-verifier tests](https://github.com/eez-association/eez-core-protocol/blob/143d87e/test/E2EEventVerification.t.sol) | Completion multiplicity, malformed evidence, distinct L1/L2 layouts and posted-content checks. | Logs are manually constructed; the tests do not assign every nested result to its original frame. |
| [Network verifier](https://github.com/eez-association/eez-core-protocol/blob/143d87e/script/e2e/scenarios/shared/Verify.s.sol) | Queries committed logs and checks content, hashes and consumption evidence. | Exact posting/load attribution remains a separately deferred verification task. |

The tracked reconstruction coverage is in `ExecutionLogReconstruction.t.sol` and
`E2EEventVerification.t.sol`. The first maps L1 top-level entry coordinates; the
second checks synthetic event evidence. Neither demonstrates a general decoder for
committed nested execution receipts. `vm.recordLogs()` may include attempted logs
that a transaction receipt would discard, so receipt-level claims need their own
committed-transaction evidence.

### Interpretation limits

- `BatchPosted` follows immediate/meta work. Associate preceding logs using the
  posting occurrence and inputs, not the potentially repeated public-input hash.
- `CallResult` follows completion, so child results can precede parent results.
  Dispatch signals, decoded arrays and order can help recover their relationship.
- `CallsReverted` reports requested span bounds, not every erased inner outcome.
  `vm.recordLogs()` can expose attempted logs absent from the committed receipt.
- Static paths emit no logs; ordinary reverts erase theirs. A hash and instructions
  do not generally reveal arbitrary runtime return bytes from those frames.
- A completed entry may include expected target failures. Hashes do not directly
  encode selected/skipped table indices, and the cursor is a scan position rather
  than a count of executed calls.
