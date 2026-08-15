---
type: TypeScript Function
title: deactivate
resource: src/extension.ts#L496-L540
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
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

- [info](../../../functions/src/utils/logger/Logger/info.md)
- [stopLanguageClient](../../../functions/src/languageClient/stopLanguageClient.md)
- [disposeDitaOtDiagnostics](../../../functions/src/utils/ditaOtErrorParser/disposeDitaOtDiagnostics.md)
- [disposeDitaOtOutputChannel](../../../functions/src/utils/ditaOtOutputChannel/disposeDitaOtOutputChannel.md)