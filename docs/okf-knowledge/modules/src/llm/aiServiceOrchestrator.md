---
type: TypeScript Module
title: aiServiceOrchestrator
resource: src/llm/aiServiceOrchestrator.ts#L1-L427
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageclient-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/llmrouterservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/types
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [BuildContextSnapshotParams](../../../interfaces/src/llm/aiServiceOrchestrator/BuildContextSnapshotParams.md)
- [ValidateFragmentParams](../../../interfaces/src/llm/aiServiceOrchestrator/ValidateFragmentParams.md)
- [FragmentValidationResult](../../../interfaces/src/llm/aiServiceOrchestrator/FragmentValidationResult.md)
- [RestructureResult](../../../interfaces/src/llm/aiServiceOrchestrator/RestructureResult.md)
- [FixFragmentResult](../../../interfaces/src/llm/aiServiceOrchestrator/FixFragmentResult.md)
- [AIServiceOrchestrator](../../../classes/src/llm/aiServiceOrchestrator/AIServiceOrchestrator.md)
- [constructor](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/constructor.md)
- [restructureMap](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap.md)
- [explainDiagnostic](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainDiagnostic.md)
- [fixFragment](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/fixFragment.md)
- [explainElement](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainElement.md)
- [suggestReuse](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/suggestReuse.md)
- [streamRaw](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/streamRaw.md)
- [buildSnapshot](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/buildSnapshot.md)
- [validateFragment](../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/validateFragment.md)
- [extractXml](../../../functions/src/llm/aiServiceOrchestrator/extractXml.md)
- [tokenToSignal](../../../functions/src/llm/aiServiceOrchestrator/tokenToSignal.md)

# Imports

- `vscode`
- `vscode-languageclient/node`
- `./llmRouterService`
- `./types`

# Member of

- [ditacraft](../../../packages/ditacraft.md)