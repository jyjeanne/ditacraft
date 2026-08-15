---
type: TypeScript Method
title: validate
resource: server/src/services/validationPipeline.ts#L333-L347
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/validationPipeline/Semaphore/acquire
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/Semaphore/release
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async validate( document: TextDocument, settings: DitaCraftSettings, keySpaceService: KeySpaceService | undefined, workspace: WorkspaceContext, token?: CancellationToken, phaseTimeoutMs: number = DEFAULT_PHASE_TIMEOUT_MS, ): Promise<Diagnostic[]>`

# Calls

- [acquire](../../../../../../functions/server/src/services/validationPipeline/Semaphore/acquire.md)
- [runPipeline](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)
- [release](../../../../../../functions/server/src/services/validationPipeline/Semaphore/release.md)