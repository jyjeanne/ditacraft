---
type: TypeScript Function
title: withTimeout
resource: server/src/services/validationPipeline.ts#L128-L148
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function withTimeout<T>( promise: Promise<T>, timeoutMs: number, phaseName: string, log: (msg: string) => void, token?: CancellationToken, ): Promise<T | null>`

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)