# Graph Report - .  (2026-07-26)

## Corpus Check
- 324 files · ~403,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1557 nodes · 3458 edges · 90 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 815 · imports: 632 · calls: 576 · method: 468 · imports_from: 404 · MODIFIES: 353 · ON_BRANCH: 104 · PARENT_OF: 53 · re_exports: 36 · implements: 9 · inherits: 4 · rationale_for: 4


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 324 · Candidates: 872
- Excluded: 0 untracked · 59406 ignored · 3 sensitive · 41 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `6811c0b`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `KeySpaceService` - 72 edges
2. `Logger` - 41 edges
3. `KeySpaceResolver` - 32 edges
4. `SubjectSchemeService` - 31 edges
5. `DitaLinkProvider` - 28 edges
6. `ValidationPipeline` - 23 edges
7. `DitaPreviewPanel` - 23 edges
8. `DitaOtWrapper` - 22 edges
9. `CatalogValidationService` - 16 edges
10. `RngValidationService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `0ee101d Fix diamond-shaped keyscope graphs losing keys from re-visited submaps` --ON_BRANCH--> `claude/graphify-knowledge-graph-kii3px`  [EXTRACTED]
  git → git  _Bridges community 64 → community 8_
- `1b9198d Add graphify knowledge graph generation into docs/graph` --ON_BRANCH--> `claude/graphify-knowledge-graph-kii3px`  [EXTRACTED]
  git → git  _Bridges community 30 → community 8_
- `21950fa add nd fx unit` --ON_BRANCH--> `claude/graphify-knowledge-graph-kii3px`  [EXTRACTED]
  git → git  _Bridges community 35 → community 8_
- `2a45b6e Extract shared resyncStackToMatch() for name-keyed stack resync` --ON_BRANCH--> `claude/graphify-knowledge-graph-kii3px`  [EXTRACTED]
  git → git  _Bridges community 9 → community 8_
- `33167a3 Fix completion parent-element stack desync, settings cache poisoning, and stale cross-file diagnostics` --ON_BRANCH--> `claude/graphify-knowledge-graph-kii3px`  [EXTRACTED]
  git → git  _Bridges community 51 → community 8_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (60): createClassMatcher(), DitaClassMatcher, isLocalDita(), KEYREF_ELEMENTS, MAP_MAP, MAP_RELCOLSPEC, MAP_RELTABLE, MAP_TOPICMETA (+52 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (2): IKeySpaceService, KeySpaceService

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (18): DitaExplorerItem, DitaExplorerProvider, ICON_MAP, MapVisualizerPanel, createDebounced(), createDebouncedMap(), createDebouncedSet(), Debounced (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (31): buildMapNode(), ContextGraph, countElements(), GetContextGraphParams, handleGetContextGraph(), KeyDef, MapNode, readShortDesc() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (11): createEnhancedError(), fireAndForget(), FireAndForgetOptions, formatDitaError(), formatErrorMessage(), getErrorMessage(), isFileNotFoundError(), Thenable (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (28): 9e120fe Fix DITA-SCH-011 quick fix rewriting the wrong image, and body/section content-model gaps, CODES, fixDeprecatedAltAttr(), fixDeprecatedIndextermref(), fixDuplicateId(), fixEmptyElement(), fixInvalidIdFormat(), fixMissingAlt() (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (23): TOPIC_MISSING_TITLE, TOPIC_VALID, MAP_WITH_KEYS, TOPIC, MAP_CONTENT, TOPIC, createTestWorkspace(), TestWorkspace (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (5): configManager, TIME_CONSTANTS, CacheConfig, KeyMetadata, KeySpaceResolver

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (32): claude/graphify-knowledge-graph-kii3px, main, 050ffe7 [npm]: bump the dev-dependencies group with 4 updates, 094928a [npm]: bump the dev-dependencies group across 1 directory with 2 updates, 14130be [npm]: bump vscode-languageclient from 9.0.1 to 10.0.0, 26489f5 [npm]: bump @types/node from 25.9.3 to 26.0.0, 30b63fa [npm]: bump the dev-dependencies group with 2 updates, 48628e2 [fix]: use Node16 module resolution so test build emits CommonJS (+24 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (18): 2a45b6e Extract shared resyncStackToMatch() for name-keyed stack resync, 31c2fe8 Parallelize resolveKey calls in cross-file reference/rename loops, 47733bc Log skipped conkeyref matches when no KeySpaceService is available, b2507f2 Extract shared referenceMatchesTarget() reference-filtering helper, ee226ed Fix Find All References conkeyref/href false positives, filterMatchingRefs(), handleReferences(), collectMatchingEdits() (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (11): configureDitaOTCommand(), setupCSpellCommand(), DITA_EXTENSIONS, getValidationRateLimiter(), initializeValidator(), resetValidationRateLimiter(), validateCommand(), ValidateFileResult (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (26): ATTRIBUTE_VALUES, COMMON_ATTRIBUTES, DITA_ELEMENTS, DITAVAL_ELEMENTS, ELEMENT_ATTRIBUTES, ELEMENT_DOCS, CompletionContext, Context (+18 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (12): ConfigurationChangeEvent, ConfigurationChangeListener, ConfigurationErrorHandler, ConfigurationManager, DEFAULT_CONFIG, DitaCraftConfiguration, getConfigManager(), LogLevelType (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (12): 6811c0b Fix validation-cache poisoning, AI quick-fix stale edits, and service races (deep review), PROFILING_ATTRIBUTES, PROFILING_CODES, validateProfilingAttributes(), ICatalogValidationService, ISubjectSchemeService, KeyResolutionReport, KeySpace (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (19): DITA_SELECTOR, registerAICompletionProvider(), registerPreviewPanelSerializer(), activate(), handleConfigurationChange(), registerCommands(), registerConfigurationListener(), registerLoggerCommands() (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (14): executeValidation(), GuideValidationContext, mapToValidationIssues(), validateGuideCommand(), validateGuidePrerequisites(), ValidationIssue, ValidationReport, ValidationReportPanel (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (7): DitaOtConfig, DitaOtWrapper, execFileAsync, PublishOptions, PublishProgress, PublishResult, toVsCodeProgressReporter()

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (1): DitaLinkProvider

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (12): RngValidationService, ROOT_TO_SCHEMA, SalveConvertResult, SalveGrammar, SalveModule, SalveValidationError, SalveWalker, SaxesAttribute (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (3): formatError(), Semaphore, ValidationPipeline

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (18): catalogService, catalogValidationService, connection, ctx, debounceTimers, diagnosticsStore, documents, extensionRoot (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (13): executePublish(), publishCommand(), publishHTML5Command(), validateAndPrepareForPublish(), disposeDitaOtDiagnostics(), DitaOtDiagnostics, ERROR_PATTERNS, getDitaOtDiagnostics() (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (11): 6319df5 improve mcp code and tests, KeyEntry, KeysResourceResult, McpContext, DitaContextSnapshotArgs, DitaExplainKeyArgs, ExplainKeyResult, DitaKeySpaceArgs (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (16): handleDefinition(), locationAtFileStart(), resolveElementInFile(), resolveInDocument(), findElementByIdOffset(), findIdAtOffset(), findReferenceAtOffset(), findReferencesToId() (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.14
Nodes (1): DitaPreviewPanel

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (2): ISubjectSchemeService, SubjectSchemeService

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (15): fileExists(), fileUriToFsPath(), resolvePath(), validateWithinWorkspace(), detectTopicType(), DitaResolveReferenceArgs, extractTitle(), handleDitaResolveReference() (+7 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (13): DitaFileDecorationProvider, isDitaUri(), CACHE_DEFAULTS, CONFIG_KEYS, DEBOUNCE_CONSTANTS, DITA_ELEMENTS, DITA_EXTENSIONS, DITA_OT (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (8): ItemKind, KeySpaceItem, KeySpaceViewProvider, KeyDefinition, KeySpace, KeyUsage, offsetToPosition(), scanKeyUsages()

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (5): BUILD_STAGE_PATTERNS, disposeDitaOtOutputChannel(), DitaOtOutputChannel, getDitaOtOutputChannel(), LOG_LEVEL_PATTERNS

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (17): 1b9198d Add graphify knowledge graph generation into docs/graph, 5cbe026 Remove stale compiled JS from source trees and dedupe isDitaUri (graph-driven review), e685f3a Document knowledge graph usage in CLAUDE.md and publish flows.json, folderReadme(), fs, GRAPHIFY_CLI, main(), OUT_DIR (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (8): b7119f1 add mcp server implemenation, DiagnosticsResourceResult, MapEntry, MapsResourceResult, Level, levels, log(), setLevel()

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (8): DEFAULT_SETTINGS, DITA_RULES, DitaRule, DitaRulesSettings, validateDitaRules(), DEFAULT_SETTINGS, DitaVersion, RuleCategory

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (7): createUnusedTopicDiagnostic(), detectCrossFileDuplicateIds(), detectUnusedTopics(), extractRootId(), mapWithConcurrency(), WORKSPACE_CODES, WorkspaceIndex

### Community 34 - "Community 34"
Cohesion: 0.19
Nodes (8): AIServiceOrchestrator, BuildContextSnapshotParams, extractXml(), FixFragmentResult, FragmentValidationResult, RestructureResult, tokenToSignal(), ValidateFragmentParams

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (12): 21950fa add nd fx unit, 42de20d add MCP server documentation, 4e9ff37 improve README to prepare next release, esbuild, minify, sharedOptions, sourcemap, extensionRoot (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.24
Nodes (13): 76690f8 Fix Windows path-comparison case sensitivity in isPathWithinWorkspace and cross-file matching, CacheConfig, KeyMetadata, KeySpaceSettings, ResolutionStep, effectiveWorkspaceFolders(), escapeRegex(), findContainingWorkspaceFolder() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (14): areConrefCompatible(), CONREF_COMPAT_GROUPS, elementToBaseGroup, findTargetElementByIdOnly(), findTargetElementName(), getContainingElementName(), getScopeValue(), isExternalScope() (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.18
Nodes (5): DiagnosticItem, DiagnosticsViewProvider, DITA_SOURCES, GroupMode, isDitaUri()

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (11): applySuppressions(), parseSuppressions(), SuppressionRange, SuppressionState, FILE_SAVE_PHASES, MAP_CHANGE_PHASES, PhaseCacheEntry, SEVERITY_MAP (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (6): ValidationPhase, WorkspaceContext, defaultSettings, emptyWorkspace, defaultSettings, emptyWorkspace

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (5): createCustomRateLimiter(), createRateLimiter(), RATE_LIMIT_DEFAULTS, RateLimitConfig, RateLimiter

### Community 42 - "Community 42"
Cohesion: 0.21
Nodes (5): createDoc(), createDocs(), createDocsFromContent(), REPO_ROOT, SERVER_SCRIPT

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (4): bb644a4 Implement AI integration, State, AICallMetric, MetricsCollector

### Community 44 - "Community 44"
Cohesion: 0.13
Nodes (2): todolist' should not trigger because \\b prevents partial match., TestBasicAnalysis

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (2): latest' contains 'test' but is NOT a testing term., TestDetectTestingGaps

### Community 46 - "Community 46"
Cohesion: 0.30
Nodes (12): createDitaFile(), FileCreationOptions, generateBookmapContent(), generateMapContent(), generateTopicContent(), getWorkspaceFolder(), newBookmapCommand(), newMapCommand() (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (12): displayPreview(), findMainHtmlFile(), generateHtml5OutputIfNeeded(), getAndValidateFileUri(), handlePreviewError(), initializeAndValidateDitaOt(), initializePreview(), pathsEqual() (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.21
Nodes (11): cachedRules, clearCustomRulesCache(), CompiledRule, CustomRuleDefinition, CustomRulesFile, detectFileType(), isSafeRegex(), loadRules() (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.19
Nodes (7): diagnosticSeverityLabel(), DiagnosticsStore, globToRegex(), matchGlob(), QueryOptions, StoredDiagnostic, StoredDiagnostics

### Community 50 - "Community 50"
Cohesion: 0.21
Nodes (5): buildSettingsHtml(), configureAICommand(), escapeHtml(), WebViewMessage, LLMRouterService

### Community 51 - "Community 51"
Cohesion: 0.24
Nodes (10): 33167a3 Fix completion parent-element stack desync, settings cache poisoning, and stale cross-file diagnostics, defaultMcpSettings(), clearDocumentSettings(), defaultSettings, DitaCraftSettings, documentSettings, getDocumentSettings(), getGlobalSettings() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.26
Nodes (9): buildSymbolTree(), extractTextContent(), extractWorkspaceSymbols(), handleDocumentSymbol(), handleWorkspaceSymbol(), OUTLINE_ELEMENTS, ParsedTag, parseTags() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.56
Nodes (6): ChatMessage, DitaCraftLLMConfig, ILLMProvider, LLMRequest, LLMResponse, ProviderId

### Community 54 - "Community 54"
Cohesion: 0.15
Nodes (1): TestBuildSummary

### Community 55 - "Community 55"
Cohesion: 0.27
Nodes (1): TestMainIntegration

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (5): disposeProviderFactory(), getProviderFactory(), isProviderFactoryInitialized(), ProviderFactory, ProviderFactoryOptions

### Community 57 - "Community 57"
Cohesion: 0.27
Nodes (9): detectEOL(), formatXML(), getSimpleTextContent(), handleFormatting(), handleRangeFormatting(), INLINE_ELEMENTS, PREFORMATTED_ELEMENTS, tokenize() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.38
Nodes (9): canonicalizeCycle(), CYCLE_CODES, detectCircularReferences(), dfsDetectAnyCycle(), extractFileReferences(), FileRef, isDitaFile(), normalizePath() (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (10): getCommentRanges(), getValueStartOffset(), handleDocumentLinkResolve(), handleDocumentLinks(), isInsideComment(), LinkData, processFileRefs(), processKeyRefs() (+2 more)

### Community 60 - "Community 60"
Cohesion: 0.29
Nodes (8): FragmentValidationResult, handleValidateFragment(), ValidateFragmentParams, wrapFragment(), makeCatalogService(), makePipeline(), makeRngService(), makeSubjectSchemeService()

### Community 61 - "Community 61"
Cohesion: 0.20
Nodes (3): BreakerWrappedProvider, ILLMProvider, isAbortError()

### Community 62 - "Community 62"
Cohesion: 0.24
Nodes (8): TypesXMLCatalog, TypesXMLDOMBuilder, TypesXMLModule, TypesXMLSAXParser, BUNDLES, MessageBundle, setLocale(), t()

### Community 63 - "Community 63"
Cohesion: 0.27
Nodes (9): buildInitializeResult(), ClassifiedFileChange, classifyWatchedFileChanges(), ClientCapabilities, detectClientCapabilities(), extractWorkspaceFolderPaths(), FileChangeClassification, isMapFile() (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (6): 0ee101d Fix diamond-shaped keyscope graphs losing keys from re-visited submaps, 644b2ac Fix Windows case-mismatch in keySpaceService path comparisons, 8dbd1c1 Stop treating documents outside every workspace folder as workspace-bound, ecd5c44 Fix MCP dita_map_structure bypassing workspace path-traversal guard, formatResolutionReport(), reportKeySpace()

### Community 65 - "Community 65"
Cohesion: 0.44
Nodes (9): basic_analysis(), build_risk_register(), build_summary(), create_issue(), detect_performance_gaps(), detect_security_gaps(), detect_testing_gaps(), load_spec() (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.20
Nodes (1): TestBuildRiskRegister

### Community 67 - "Community 67"
Cohesion: 0.31
Nodes (2): CatalogValidationService, ICatalogValidationService

### Community 68 - "Community 68"
Cohesion: 0.25
Nodes (4): AI_FIXABLE_CODES, AIQuickFixProvider, executeAiQuickFix(), safeExecuteAiQuickFix()

### Community 69 - "Community 69"
Cohesion: 0.28
Nodes (3): getGlobalKeySpaceResolver(), PendingKeyLink, registerDitaLinkProvider()

### Community 70 - "Community 70"
Cohesion: 0.28
Nodes (2): ILLMProvider, OllamaLLMProvider

### Community 71 - "Community 71"
Cohesion: 0.39
Nodes (7): createDitacraftParticipant(), handleExplain(), handleRequest(), handleRestructure(), handleSuggestReuse(), handleValidate(), HELP_MESSAGE

### Community 72 - "Community 72"
Cohesion: 0.43
Nodes (6): e7279e9 Fix folding-range tag desync and cross-file rename corruption risk, buildLineOffsets(), computeFoldingRanges(), handleFoldingRanges(), lineAtOffset(), OpenTag

### Community 73 - "Community 73"
Cohesion: 0.32
Nodes (7): esbuild, esbuildProblemMatcherPlugin, main(), minify, sharedOptions, sourcemap, watch

### Community 74 - "Community 74"
Cohesion: 0.43
Nodes (7): escapeRegExp(), findClosingTag(), findOpeningTag(), findTagAtOffset(), handleLinkedEditingRange(), TagAtOffset, TagNameRange

### Community 75 - "Community 75"
Cohesion: 0.32
Nodes (2): AnthropicLLMProvider, ILLMProvider

### Community 76 - "Community 76"
Cohesion: 0.32
Nodes (2): ILLMProvider, OpenAILLMProvider

### Community 77 - "Community 77"
Cohesion: 0.25
Nodes (1): TestConstants

### Community 78 - "Community 78"
Cohesion: 0.46
Nodes (1): TestCreateIssue

### Community 79 - "Community 79"
Cohesion: 0.32
Nodes (4): Unit tests for review_spec.py, Write content to a temp file and return its path., TestLoadSpec, _tmp_spec()

### Community 80 - "Community 80"
Cohesion: 0.36
Nodes (1): DtdResolver

### Community 81 - "Community 81"
Cohesion: 0.57
Nodes (6): getConrefPreview(), getHrefHover(), getKeyrefHover(), getWordAt(), handleHover(), isInsideTag()

### Community 82 - "Community 82"
Cohesion: 0.38
Nodes (2): CopilotLLMProvider, ILLMProvider

### Community 83 - "Community 83"
Cohesion: 0.48
Nodes (5): escapeRegExp(), findElementById(), navigateToElement(), registerElementNavigationCommand(), showDocumentAtLine()

### Community 84 - "Community 84"
Cohesion: 0.53
Nodes (1): CircuitBreaker

### Community 85 - "Community 85"
Cohesion: 0.53
Nodes (1): AICompletionProvider

### Community 86 - "Community 86"
Cohesion: 0.33
Nodes (1): TestDetectPerformanceGaps

### Community 87 - "Community 87"
Cohesion: 0.33
Nodes (1): TestDetectSecurityGaps

### Community 88 - "Community 88"
Cohesion: 0.50
Nodes (3): isDitaMap(), PRESET_INTENTIONS, restructureMapCommand()

### Community 89 - "Community 89"
Cohesion: 0.50
Nodes (1): vscode

## Knowledge Gaps
- **250 isolated node(s):** `Unit tests for review_spec.py`, `Write content to a temp file and return its path.`, `todolist' should not trigger because \\b prevents partial match.`, `latest' contains 'test' but is NOT a testing term.`, `esbuild` (+245 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 1`** (2 nodes): `IKeySpaceService`, `KeySpaceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `DitaLinkProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `DitaPreviewPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `ISubjectSchemeService`, `SubjectSchemeService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `todolist' should not trigger because \\b prevents partial match.`, `TestBasicAnalysis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `latest' contains 'test' but is NOT a testing term.`, `TestDetectTestingGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `TestBuildSummary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `TestMainIntegration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `TestBuildRiskRegister`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `CatalogValidationService`, `ICatalogValidationService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (2 nodes): `ILLMProvider`, `OllamaLLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `AnthropicLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (2 nodes): `ILLMProvider`, `OpenAILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `TestConstants`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `TestCreateIssue`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `DtdResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `CopilotLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `CircuitBreaker`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `AICompletionProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `TestDetectPerformanceGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `TestDetectSecurityGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `vscode`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KeySpaceService` connect `Community 1` to `Community 11`, `Community 37`, `Community 23`, `Community 59`, `Community 81`, `Community 9`, `Community 33`, `Community 36`, `Community 39`, `Community 20`, `Community 22`, `Community 42`, `Community 64`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `KeySpaceResolver` connect `Community 7` to `Community 69`, `Community 56`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Logger` connect `Community 4` to `Community 46`, `Community 47`, `Community 21`, `Community 15`, `Community 2`, `Community 69`, `Community 28`, `Community 14`, `Community 16`, `Community 83`, `Community 7`, `Community 56`, `Community 41`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `Unit tests for review_spec.py`, `Write content to a temp file and return its path.`, `todolist' should not trigger because \\b prevents partial match.` to the rest of the system?**
  _250 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08392156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08181818181818182 - nodes in this community are weakly interconnected._