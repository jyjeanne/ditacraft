---
type: TypeScript Function
title: deactivate
resource: src/extension.ts#L502-L546
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/languageClient/stopLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/disposeDitaOtDiagnostics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/disposeDitaOtOutputChannel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function deactivate(): Promise<void>`

# Calls

- [stopLanguageClient](../../../functions/src/languageClient/stopLanguageClient.md)
- [disposeDitaOtDiagnostics](../../../functions/src/utils/ditaOtErrorParser/disposeDitaOtDiagnostics.md)
- [disposeDitaOtOutputChannel](../../../functions/src/utils/ditaOtOutputChannel/disposeDitaOtOutputChannel.md)