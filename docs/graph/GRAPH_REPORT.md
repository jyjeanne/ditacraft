# Graph Report - .  (2026-07-26)

## Corpus Check
- 363 files · ~437,215 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1648 nodes · 3499 edges · 95 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 918 · imports: 624 · calls: 555 · method: 461 · imports_from: 403 · MODIFIES: 337 · ON_BRANCH: 100 · PARENT_OF: 49 · re_exports: 36 · implements: 8 · inherits: 4 · rationale_for: 4


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 363 · Candidates: 895
- Excluded: 17 untracked · 51775 ignored · 3 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `fd09900`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `KeySpaceService` - 70 edges
2. `Logger` - 41 edges
3. `KeySpaceResolver` - 32 edges
4. `SubjectSchemeService` - 29 edges
5. `DitaLinkProvider` - 28 edges
6. `DitaPreviewPanel` - 23 edges
7. `ValidationPipeline` - 22 edges
8. `DitaOtWrapper` - 22 edges
9. `CatalogValidationService` - 17 edges
10. `RngValidationService` - 17 edges

## Surprising Connections (you probably didn't know these)
- `readKeysResource()` --calls--> `discoverRootMap()`  [EXTRACTED]
  mcp/src/resources/keys.ts → mcp/src/resources/keys.js
- `handleDitaKeySpace()` --calls--> `discoverRootMap()`  [EXTRACTED]
  mcp/src/tools/ditaKeySpace.ts → mcp/src/tools/ditaKeySpace.js

## Communities

### Community 67 - "Community 67"
Cohesion: 0.44
Nodes (9): load_spec(), create_issue(), basic_analysis(), detect_testing_gaps(), detect_security_gaps(), detect_performance_gaps(), build_summary(), build_risk_register() (+1 more)

### Community 81 - "Community 81"
Cohesion: 0.32
Nodes (4): _tmp_spec(), TestLoadSpec, Unit tests for review_spec.py, Write content to a temp file and return its path.

### Community 79 - "Community 79"
Cohesion: 0.25
Nodes (1): TestConstants

### Community 80 - "Community 80"
Cohesion: 0.46
Nodes (1): TestCreateIssue

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (2): TestBasicAnalysis, todolist' should not trigger because \\b prevents partial match.

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (2): TestDetectTestingGaps, latest' contains 'test' but is NOT a testing term.

### Community 90 - "Community 90"
Cohesion: 0.33
Nodes (1): TestDetectSecurityGaps

### Community 89 - "Community 89"
Cohesion: 0.33
Nodes (1): TestDetectPerformanceGaps

### Community 56 - "Community 56"
Cohesion: 0.15
Nodes (1): TestBuildSummary

### Community 68 - "Community 68"
Cohesion: 0.20
Nodes (1): TestBuildRiskRegister

### Community 57 - "Community 57"
Cohesion: 0.27
Nodes (1): TestMainIntegration

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (65): esbuild, minify, sourcemap, sharedOptions, esbuild, watch, minify, sourcemap (+57 more)

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (4): setupCSpellCommand(), DitaCraftAPI, DitaCraftAPI, 6451228 [npm]: bump the dev-dependencies group with 3 updates

### Community 43 - "Community 43"
Cohesion: 0.17
Nodes (7): DiagnosticsStore, diagnosticSeverityLabel(), matchGlob(), globToRegex(), StoredDiagnostics, QueryOptions, StoredDiagnostic

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (12): levels, setLevel(), log(), Level, logger_1, DiagnosticsResourceResult, fs, path (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (11): defaultMcpSettings(), defaultSettings, documentSettings, initSettings(), getGlobalSettings(), updateGlobalSettings(), getDocumentSettings(), clearDocumentSettings() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (23): logger_1, readKeysResource(), discoverRootMap(), KeyEntry, KeysResourceResult, contextSnapshot_1, workspace_1, DitaContextSnapshotArgs (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (38): mcp_js_1, stdio_js_1, path, zod_1, logger_1, diagnosticsStore_1, catalogValidationService_1, rngValidationService_1 (+30 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (43): contextGraph_1, workspace_1, handleDitaMapStructure(), formatAsTree(), formatAsCsv(), path, DitaMapStructureArgs, fs (+35 more)

### Community 60 - "Community 60"
Cohesion: 0.26
Nodes (12): path, fs, workspace_1, referenceParser_1, handleDitaResolveReference(), resolveKeyref(), resolveConkeyref(), resolveHrefOrConref() (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (15): vscode_languageserver_textdocument_1, fs, path, workspace_1, fragmentValidator_1, logger_1, DitaValidateArgs, DitaValidateResult (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.23
Nodes (5): REPO_ROOT, SERVER_SCRIPT, createDoc(), createDocs(), createDocsFromContent()

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (23): TestWorkspace, createTestWorkspace(), TOPIC_MISSING_TITLE, TOPIC_VALID, MAP_WITH_KEYS, TOPIC, MAP_CONTENT, TOPIC (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (26): DITA_ELEMENTS, DITAVAL_ELEMENTS, COMMON_ATTRIBUTES, ELEMENT_ATTRIBUTES, ATTRIBUTE_VALUES, ELEMENT_DOCS, Context, CompletionContext (+18 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (26): DitaClassMatcher, TOPIC_TITLE, TOPIC_SHORTDESC, TOPIC_ABSTRACT, TOPIC_BODY, TOPIC_SECTION, TOPIC_KEYWORDS, TOPIC_KEYWORD (+18 more)

### Community 62 - "Community 62"
Cohesion: 0.17
Nodes (11): createClassMatcher(), matchesDitaClass(), isLocalDita(), TOPIC_TOPIC, TOPIC_IMAGE, TOPIC_XREF, TOPIC_LINK, MAP_MAP (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.19
Nodes (17): TOPIC_TYPE_NAMES, CODES, RULE_CODES, HANDLED_SOURCES, getFixesForDiagnostic(), fixMissingDoctype(), fixMissingId(), fixMissingTitle() (+9 more)

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (14): node_1, path, fs_1, i18n_1, textUtils_1, detectCircularReferences(), extractFileReferences(), resolveRef() (+6 more)

### Community 93 - "Community 93"
Cohesion: 0.50
Nodes (3): handleCodeActions(), makeDiag(), altAttrDiag()

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (21): node_1, path, fs_1, referenceParser_1, ditaSpecialization_1, i18n_1, textUtils_1, TOPIC_ELEMENTS_PATTERN (+13 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (15): fs, path, node_1, textUtils_1, SEVERITY_NAME_MAP, cachedRules, isSafeRegex(), loadRules() (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (16): handleDefinition(), resolveInDocument(), resolveElementInFile(), locationAtFileStart(), REF_ATTR_NAMES, parseReference(), getTargetId(), findReferenceAtOffset() (+8 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (13): node_1, i18n_1, textUtils_1, patterns_1, DITA_RULES, DEFAULT_SETTINGS, validateDitaRules(), DitaRule (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (20): LinkData, handleDocumentLinks(), handleDocumentLinkResolve(), getCommentRanges(), isInsideComment(), shouldSkip(), getValueStartOffset(), processFileRefs() (+12 more)

### Community 74 - "Community 74"
Cohesion: 0.43
Nodes (6): OpenTag, handleFoldingRanges(), computeFoldingRanges(), buildLineOffsets(), lineAtOffset(), e7279e9 Fix folding-range tag desync and cross-file rename corruption risk

### Community 63 - "Community 63"
Cohesion: 0.27
Nodes (9): INLINE_ELEMENTS, PREFORMATTED_ELEMENTS, XMLToken, handleFormatting(), handleRangeFormatting(), formatXML(), tokenize(), getSimpleTextContent() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.21
Nodes (11): vscode_languageserver_textdocument_1, node_1, settings_1, wrapFragment(), handleValidateFragment(), ValidateFragmentParams, FragmentValidationResult, makeCatalogService() (+3 more)

### Community 84 - "Community 84"
Cohesion: 0.57
Nodes (6): handleHover(), getKeyrefHover(), getHrefHover(), getConrefPreview(), getWordAt(), isInsideTag()

### Community 75 - "Community 75"
Cohesion: 0.43
Nodes (7): handleLinkedEditingRange(), TagAtOffset, TagNameRange, findTagAtOffset(), findClosingTag(), findOpeningTag(), escapeRegExp()

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (11): node_1, i18n_1, textUtils_1, PROFILING_ATTRIBUTES, validateProfilingAttributes(), PROFILING_CODES, fs, SubjectSchemeService (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (25): handleReferences(), filterMatchingRefs(), handlePrepareRename(), handleRename(), collectMatchingEdits(), ReferenceOccurrence, offsetToPosition(), normalizeFsPath() (+17 more)

### Community 54 - "Community 54"
Cohesion: 0.26
Nodes (9): SYMBOL_KIND_MAP, OUTLINE_ELEMENTS, ParsedTag, handleDocumentSymbol(), parseTags(), buildSymbolTree(), extractTextContent(), handleWorkspaceSymbol() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (26): node_1, fast_xml_parser_1, ditaSpecialization_1, diagnosticCodes_1, i18n_1, textUtils_1, CODES, validateDITADocument() (+18 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (13): path, fs_1, node_1, i18n_1, workspaceScanner_1, textUtils_1, extractRootId(), mapWithConcurrency() (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (14): path, fs, node_1, i18n_1, TypesXMLCatalog, TypesXMLDOMBuilder, TypesXMLSAXParser, TypesXMLModule (+6 more)

### Community 66 - "Community 66"
Cohesion: 0.27
Nodes (2): CatalogValidationService, ICatalogValidationService

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (14): path, fs, fs_1, fast_xml_parser_1, patterns_1, textUtils_1, reportKeySpace(), formatResolutionReport() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (2): KeySpaceService, IKeySpaceService

### Community 51 - "Community 51"
Cohesion: 0.14
Nodes (13): fs_1, path, node_1, ROOT_TO_SCHEMA, SalveValidationError, SalveWalker, SalveGrammar, SalveConvertResult (+5 more)

### Community 58 - "Community 58"
Cohesion: 0.21
Nodes (2): RngValidationService, SaxesParser

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (23): parseSuppressions(), applySuppressions(), SuppressionRange, SuppressionState, node_1, textUtils_1, i18n_1, validation_1 (+15 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (3): formatError(), Semaphore, ValidationPipeline

### Community 82 - "Community 82"
Cohesion: 0.25
Nodes (4): WorkspaceContext, ValidationPhase, defaultSettings, emptyWorkspace

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (2): defaultSettings, emptyWorkspace

### Community 73 - "Community 73"
Cohesion: 0.39
Nodes (7): HELP_MESSAGE, createDitacraftParticipant(), handleRequest(), handleRestructure(), handleValidate(), handleExplain(), handleSuggestReuse()

### Community 53 - "Community 53"
Cohesion: 0.21
Nodes (5): configureAICommand(), WebViewMessage, escapeHtml(), buildSettingsHtml(), LLMRouterService

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (7): PROCESS_CONSTANTS, execFileAsync, DitaOtConfig, PublishOptions, PublishProgress, PublishResult, DitaOtWrapper

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (7): configureDitaOTCommand(), ValidateFileResult, DITA_EXTENSIONS, initializeValidator(), validateCommand(), getValidationRateLimiter(), resetValidationRateLimiter()

### Community 46 - "Community 46"
Cohesion: 0.30
Nodes (12): WINDOWS_RESERVED_NAMES, FileCreationOptions, validateFileName(), getWorkspaceFolder(), createDitaFile(), promptForFileName(), newTopicCommand(), newMapCommand() (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (12): initializePreview(), previewHTML5Command(), shouldAutoRefreshPreview(), pathsEqual(), getAndValidateFileUri(), validateFilePath(), initializeAndValidateDitaOt(), validateInputFile() (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (13): validateAndPrepareForPublish(), publishCommand(), publishHTML5Command(), executePublish(), ParsedDitaOtOutput, ERROR_PATTERNS, mapSeverity(), parseDitaOtOutput() (+5 more)

### Community 92 - "Community 92"
Cohesion: 0.50
Nodes (3): PRESET_INTENTIONS, restructureMapCommand(), isDitaMap()

### Community 35 - "Community 35"
Cohesion: 0.21
Nodes (13): GuideValidationContext, validateGuideCommand(), validateGuidePrerequisites(), executeValidation(), mapToValidationIssues(), ValidationReport, ValidationIssue, DitaOtCodeInfo (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (17): activate(), registerRootMapFeature(), updateRootMapStatusBar(), sendInitialRootMapSetting(), registerPreviewAutoRefresh(), registerCommands(), registerLoggerCommands(), registerConfigurationListener() (+9 more)

### Community 34 - "Community 34"
Cohesion: 0.19
Nodes (8): BuildContextSnapshotParams, ValidateFragmentParams, FragmentValidationResult, RestructureResult, FixFragmentResult, AIServiceOrchestrator, extractXml(), tokenToSignal()

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (4): State, AICallMetric, MetricsCollector, bb644a4 Implement AI integration

### Community 88 - "Community 88"
Cohesion: 0.53
Nodes (1): CircuitBreaker

### Community 55 - "Community 55"
Cohesion: 0.56
Nodes (6): ChatMessage, LLMRequest, LLMResponse, ILLMProvider, ProviderId, DitaCraftLLMConfig

### Community 65 - "Community 65"
Cohesion: 0.20
Nodes (3): BreakerWrappedProvider, ILLMProvider, isAbortError()

### Community 76 - "Community 76"
Cohesion: 0.32
Nodes (2): AnthropicLLMProvider, ILLMProvider

### Community 85 - "Community 85"
Cohesion: 0.38
Nodes (2): CopilotLLMProvider, ILLMProvider

### Community 72 - "Community 72"
Cohesion: 0.28
Nodes (2): OllamaLLMProvider, ILLMProvider

### Community 77 - "Community 77"
Cohesion: 0.32
Nodes (2): OpenAILLMProvider, ILLMProvider

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (3): DITA_SELECTOR, AICompletionProvider, registerAICompletionProvider()

### Community 70 - "Community 70"
Cohesion: 0.25
Nodes (4): AI_FIXABLE_CODES, AIQuickFixProvider, executeAiQuickFix(), safeExecuteAiQuickFix()

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (15): DITA_SOURCES, GroupMode, isDitaUri(), DiagnosticItem, DiagnosticsViewProvider, isDitaUri(), DitaFileDecorationProvider, isDitaFilePath() (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (10): ICON_MAP, DitaExplorerItem, DitaExplorerProvider, MapNode, extractAttribute(), detectMapType(), TAG_TYPE_MAP, parseReferences() (+2 more)

### Community 71 - "Community 71"
Cohesion: 0.28
Nodes (3): PendingKeyLink, getGlobalKeySpaceResolver(), registerDitaLinkProvider()

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (1): DitaLinkProvider

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (8): ItemKind, KeySpaceItem, KeySpaceViewProvider, KeyDefinition, KeySpace, KeyUsage, offsetToPosition(), scanKeyUsages()

### Community 49 - "Community 49"
Cohesion: 0.26
Nodes (1): MapVisualizerPanel

### Community 50 - "Community 50"
Cohesion: 0.32
Nodes (10): getErrorMessage(), Thenable, FireAndForgetOptions, fireAndForget(), tryAsync(), isFileNotFoundError(), formatErrorMessage(), formatDitaError() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (1): DitaPreviewPanel

### Community 78 - "Community 78"
Cohesion: 0.39
Nodes (1): ValidationReportPanel

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (12): LogLevelType, ValidationEngineType, TranstypeType, PreviewThemeType, ConfigurationChangeEvent, ConfigurationChangeListener, DitaCraftConfiguration, validateNumericConfig() (+4 more)

### Community 91 - "Community 91"
Cohesion: 0.60
Nodes (4): LOG_LEVEL_PATTERNS, BUILD_STAGE_PATTERNS, getDitaOtOutputChannel(), disposeDitaOtOutputChannel()

### Community 86 - "Community 86"
Cohesion: 0.48
Nodes (5): findElementById(), escapeRegExp(), navigateToElement(), showDocumentAtLine(), registerElementNavigationCommand()

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (1): KeySpaceResolver

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (5): ProviderFactoryOptions, ProviderFactory, getProviderFactory(), disposeProviderFactory(), isProviderFactoryInitialized()

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (5): RateLimitConfig, RATE_LIMIT_DEFAULTS, RateLimiter, createRateLimiter(), createCustomRateLimiter()

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (12): configManager, TIME_CONSTANTS, CACHE_DEFAULTS, DEBOUNCE_CONSTANTS, DITA_EXTENSIONS, DITA_ELEMENTS, VALIDATION_ENGINES, DITA_OT (+4 more)

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (1): DitaOtOutputChannel

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (1): Logger

### Community 83 - "Community 83"
Cohesion: 0.36
Nodes (1): DtdResolver

### Community 94 - "Community 94"
Cohesion: 0.50
Nodes (1): vscode

## Knowledge Gaps
- **363 isolated node(s):** `Unit tests for review_spec.py`, `Write content to a temp file and return its path.`, `todolist' should not trigger because \\b prevents partial match.`, `latest' contains 'test' but is NOT a testing term.`, `esbuild` (+358 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 79`** (1 nodes): `TestConstants`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `TestCreateIssue`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `TestBasicAnalysis`, `todolist' should not trigger because \\b prevents partial match.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `TestDetectTestingGaps`, `latest' contains 'test' but is NOT a testing term.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `TestDetectSecurityGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `TestDetectPerformanceGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `TestBuildSummary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `TestBuildRiskRegister`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `TestMainIntegration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `CatalogValidationService`, `ICatalogValidationService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 2`** (2 nodes): `KeySpaceService`, `IKeySpaceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `RngValidationService`, `SaxesParser`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (2 nodes): `defaultSettings`, `emptyWorkspace`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `CircuitBreaker`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (2 nodes): `AnthropicLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (2 nodes): `CopilotLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (2 nodes): `OllamaLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `OpenAILLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `DitaLinkProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `MapVisualizerPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `DitaPreviewPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `ValidationReportPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `KeySpaceResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `DitaOtOutputChannel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `Logger`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `DtdResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `vscode`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KeySpaceService` connect `Community 2` to `Community 9`, `Community 19`, `Community 26`, `Community 14`, `Community 84`, `Community 4`, `Community 18`, `Community 30`, `Community 15`, `Community 3`, `Community 8`, `Community 52`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `KeySpaceResolver` connect `Community 12` to `Community 71`, `Community 59`, `Community 45`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Logger` connect `Community 24` to `Community 46`, `Community 47`, `Community 25`, `Community 35`, `Community 23`, `Community 71`, `Community 31`, `Community 50`, `Community 21`, `Community 16`, `Community 86`, `Community 45`, `Community 59`, `Community 39`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `Unit tests for review_spec.py`, `Write content to a temp file and return its path.`, `todolist' should not trigger because \\b prevents partial match.` to the rest of the system?**
  _363 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 41` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 42` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05693693693693694 - nodes in this community are weakly interconnected._