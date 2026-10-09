---
name: query-and-index
description: "Use when investigating database query performance or transaction behavior. Do not use for general API design or migrations without a measured query problem."
---

# Query and index

## Workflow

1. Capture the slow query, parameters, representative data scale, and baseline latency/query count.
2. Inspect the database execution plan and relevant indexes. Check N+1 access, unnecessary columns, lock contention, and transaction scope.
3. Choose one justified change; weigh write/storage cost and selectivity before adding an index.
4. Remeasure on comparable inputs and verify correctness and concurrency behavior. Document when production measurements are unavailable.

## Completion

Baseline, evidence-backed change, measured result, and tradeoffs; never claim speedups from intuition alone.
