# Graph Report - .  (2026-07-26)

## Corpus Check
- 324 files · ~400,437 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1538 nodes · 3399 edges · 91 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 810 · imports: 626 · calls: 560 · method: 456 · imports_from: 403 · MODIFIES: 339 · ON_BRANCH: 102 · PARENT_OF: 51 · re_exports: 36 · implements: 8 · inherits: 4 · rationale_for: 4


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 324 · Candidates: 913
- Excluded: 0 untracked · 59340 ignored · 3 sensitive · 41 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `e685f3a`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `KeySpaceService` - 70 edges
2. `Logger` - 41 edges
3. `KeySpaceResolver` - 32 edges
4. `SubjectSchemeService` - 28 edges
5. `DitaLinkProvider` - 28 edges
6. `DitaPreviewPanel` - 23 edges
7. `ValidationPipeline` - 22 edges
8. `DitaOtWrapper` - 22 edges
9. `CatalogValidationService` - 16 edges
10. `RngValidationService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `2a45b6e Extract shared resyncStackToMatch() for name-keyed stack resync` --ON_BRANCH--> `claude/graphify-knowledge-graph-kii3px`  [EXTRACTED]
  git → git  _Bridges community 27 → community 0_
- `2a45b6e Extract shared resyncStackToMatch() for name-keyed stack resync` --PARENT_OF--> `b2507f2 Extract shared referenceMatchesTarget() reference-filtering helper`  [EXTRACTED]
  git → git  _Bridges community 27 → community 11_
- `31c2fe8 Parallelize resolveKey calls in cross-file reference/rename loops` --ON_BRANCH--> `claude/graphify-knowledge-graph-kii3px`  [EXTRACTED]
  git → git  _Bridges community 11 → community 0_
- `33167a3 Fix completion parent-element stack desync, settings cache poisoning, and stale cross-file diagnostics` --ON_BRANCH--> `claude/graphify-knowledge-graph-kii3px`  [EXTRACTED]
  git → git  _Bridges community 19 → community 0_
- `4e9ff37 improve README to prepare next release` --PARENT_OF--> `6319df5 improve mcp code and tests`  [EXTRACTED]
  git → git  _Bridges community 0 → community 20_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (69): claude/graphify-knowledge-graph-kii3px, main, 050ffe7 [npm]: bump the dev-dependencies group with 4 updates, 094928a [npm]: bump the dev-dependencies group across 1 directory with 2 updates, 0ee101d Fix diamond-shaped keyscope graphs losing keys from re-visited submaps, 14130be [npm]: bump vscode-languageclient from 9.0.1 to 10.0.0, 1b9198d Add graphify knowledge graph generation into docs/graph, 21950fa add nd fx unit (+61 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (21): getGlobalKeySpaceResolver(), PendingKeyLink, registerDitaLinkProvider(), ItemKind, KeySpaceItem, KeySpaceViewProvider, configManager, TIME_CONSTANTS (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (2): IKeySpaceService, KeySpaceService

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (17): DiagnosticItem, DiagnosticsViewProvider, DITA_SOURCES, GroupMode, isDitaUri(), DitaFileDecorationProvider, isDitaUri(), CACHE_DEFAULTS (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (23): TOPIC_MISSING_TITLE, TOPIC_VALID, MAP_WITH_KEYS, TOPIC, MAP_CONTENT, TOPIC, createTestWorkspace(), TestWorkspace (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (17): DitaExplorerItem, DitaExplorerProvider, ICON_MAP, createDebounced(), createDebouncedMap(), createDebouncedSet(), Debounced, DebouncedMap (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (26): ATTRIBUTE_VALUES, COMMON_ATTRIBUTES, DITA_ELEMENTS, DITAVAL_ELEMENTS, ELEMENT_ATTRIBUTES, ELEMENT_DOCS, CompletionContext, Context (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (20): ContextGraph, GetContextGraphParams, MapNode, TopicRefNode, BuildContextSnapshotParams, buildLevel1(), buildLevel2(), buildLevel3() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (12): ConfigurationChangeEvent, ConfigurationChangeListener, ConfigurationErrorHandler, ConfigurationManager, DEFAULT_CONFIG, DitaCraftConfiguration, getConfigManager(), LogLevelType (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (26): DitaClassMatcher, KEYREF_ELEMENTS, MAP_RELCOLSPEC, MAP_RELTABLE, MAP_TOPICMETA, MAPGROUP_KEYDEF, SUBJECTSCHEME_ATTRIBUTEDEF, SUBJECTSCHEME_DEFAULTSUBJECT (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (1): DitaLinkProvider

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (16): 31c2fe8 Parallelize resolveKey calls in cross-file reference/rename loops, 47733bc Log skipped conkeyref matches when no KeySpaceService is available, 76690f8 Fix Windows path-comparison case sensitivity in isPathWithinWorkspace and cross-file matching, b2507f2 Extract shared referenceMatchesTarget() reference-filtering helper, ee226ed Fix Find All References conkeyref/href false positives, collectMatchingEdits(), handlePrepareRename(), handleRename() (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (7): PROCESS_CONSTANTS, DitaOtConfig, DitaOtWrapper, execFileAsync, PublishOptions, PublishProgress, PublishResult

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (22): checkEmptyElements(), checkEntityExpansion(), checkTopicrefsWithoutHref(), CODES, createRange(), DITA_ROOT_ELEMENTS, entityRange(), getEnclosingElement() (+14 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (17): registerPreviewPanelSerializer(), activate(), handleConfigurationChange(), registerCommands(), registerConfigurationListener(), registerLoggerCommands(), registerPreviewAutoRefresh(), registerRootMapFeature() (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (12): RngValidationService, ROOT_TO_SCHEMA, SalveConvertResult, SalveGrammar, SalveModule, SalveValidationError, SalveWalker, SaxesAttribute (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (18): catalogService, catalogValidationService, connection, ctx, debounceTimers, diagnosticsStore, documents, extensionRoot (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (1): Logger

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (13): executePublish(), publishCommand(), publishHTML5Command(), validateAndPrepareForPublish(), disposeDitaOtDiagnostics(), DitaOtDiagnostics, ERROR_PATTERNS, getDitaOtDiagnostics() (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (16): 33167a3 Fix completion parent-element stack desync, settings cache poisoning, and stale cross-file diagnostics, FragmentValidationResult, handleValidateFragment(), ValidateFragmentParams, wrapFragment(), clearDocumentSettings(), defaultSettings, documentSettings (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (11): 6319df5 improve mcp code and tests, KeyEntry, KeysResourceResult, McpContext, DitaContextSnapshotArgs, DitaExplainKeyArgs, ExplainKeyResult, DitaKeySpaceArgs (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.19
Nodes (16): handleDefinition(), locationAtFileStart(), resolveElementInFile(), resolveInDocument(), findElementByIdOffset(), findIdAtOffset(), findReferenceAtOffset(), findReferencesToId() (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (1): DitaPreviewPanel

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (3): formatError(), Semaphore, ValidationPipeline

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (15): fileExists(), fileUriToFsPath(), resolvePath(), validateWithinWorkspace(), detectTopicType(), DitaResolveReferenceArgs, extractTitle(), handleDitaResolveReference() (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (7): filterMatchingRefs(), handleReferences(), createDoc(), createDocs(), createDocsFromContent(), REPO_ROOT, SERVER_SCRIPT

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (14): buildMapNode(), countElements(), handleGetContextGraph(), KeyDef, readShortDesc(), readTitle(), readTopicType(), RelationNode (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (12): 2a45b6e Extract shared resyncStackToMatch() for name-keyed stack resync, buildSymbolTree(), extractTextContent(), extractWorkspaceSymbols(), handleDocumentSymbol(), handleWorkspaceSymbol(), OUTLINE_ELEMENTS, ParsedTag (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (8): b7119f1 add mcp server implemenation, DiagnosticsResourceResult, MapEntry, MapsResourceResult, Level, levels, log(), setLevel()

### Community 29 - "Community 29"
Cohesion: 0.19
Nodes (17): TOPIC_TYPE_NAMES, CODES, fixDeprecatedAltAttr(), fixDeprecatedIndextermref(), fixDuplicateId(), fixEmptyElement(), fixInvalidIdFormat(), fixMissingAlt() (+9 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (8): DEFAULT_SETTINGS, DITA_RULES, DitaRule, DitaRulesSettings, validateDitaRules(), DEFAULT_SETTINGS, DitaVersion, RuleCategory

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (7): createUnusedTopicDiagnostic(), detectCrossFileDuplicateIds(), detectUnusedTopics(), extractRootId(), mapWithConcurrency(), WORKSPACE_CODES, WorkspaceIndex

### Community 32 - "Community 32"
Cohesion: 0.19
Nodes (8): AIServiceOrchestrator, BuildContextSnapshotParams, extractXml(), FixFragmentResult, FragmentValidationResult, RestructureResult, tokenToSignal(), ValidateFragmentParams

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (2): ISubjectSchemeService, SubjectSchemeService

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (8): ValidationPhase, WorkspaceContext, defaultMcpSettings(), DitaCraftSettings, defaultSettings, emptyWorkspace, defaultSettings, emptyWorkspace

### Community 35 - "Community 35"
Cohesion: 0.21
Nodes (13): executeValidation(), GuideValidationContext, mapToValidationIssues(), validateGuideCommand(), validateGuidePrerequisites(), ValidationIssue, ValidationReport, DITA_OT_ERROR_CODES (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (14): areConrefCompatible(), CONREF_COMPAT_GROUPS, elementToBaseGroup, findTargetElementByIdOnly(), findTargetElementName(), getContainingElementName(), getScopeValue(), isExternalScope() (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (4): setupCSpellCommand(), 6451228 [npm]: bump the dev-dependencies group with 3 updates, DitaCraftAPI, DitaCraftAPI

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (11): applySuppressions(), parseSuppressions(), SuppressionRange, SuppressionState, FILE_SAVE_PHASES, MAP_CHANGE_PHASES, PhaseCacheEntry, SEVERITY_MAP (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (5): createCustomRateLimiter(), createRateLimiter(), RATE_LIMIT_DEFAULTS, RateLimitConfig, RateLimiter

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (4): bb644a4 Implement AI integration, State, AICallMetric, MetricsCollector

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (2): todolist' should not trigger because \\b prevents partial match., TestBasicAnalysis

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (2): latest' contains 'test' but is NOT a testing term., TestDetectTestingGaps

### Community 43 - "Community 43"
Cohesion: 0.26
Nodes (11): CacheConfig, KeyMetadata, KeySpaceSettings, ResolutionStep, effectiveWorkspaceFolders(), escapeRegex(), isPathWithinWorkspace(), normalizeFsPath() (+3 more)

### Community 44 - "Community 44"
Cohesion: 0.30
Nodes (12): createDitaFile(), FileCreationOptions, generateBookmapContent(), generateMapContent(), generateTopicContent(), getWorkspaceFolder(), newBookmapCommand(), newMapCommand() (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (12): displayPreview(), findMainHtmlFile(), generateHtml5OutputIfNeeded(), getAndValidateFileUri(), handlePreviewError(), initializeAndValidateDitaOt(), initializePreview(), pathsEqual() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.16
Nodes (11): esbuild, esbuildProblemMatcherPlugin, main(), minify, sharedOptions, sourcemap, esbuild, minify (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.21
Nodes (11): cachedRules, clearCustomRulesCache(), CompiledRule, CustomRuleDefinition, CustomRulesFile, detectFileType(), isSafeRegex(), loadRules() (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.26
Nodes (1): MapVisualizerPanel

### Community 49 - "Community 49"
Cohesion: 0.32
Nodes (10): createEnhancedError(), fireAndForget(), FireAndForgetOptions, formatDitaError(), formatErrorMessage(), getErrorMessage(), isFileNotFoundError(), Thenable (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.19
Nodes (7): diagnosticSeverityLabel(), DiagnosticsStore, globToRegex(), matchGlob(), QueryOptions, StoredDiagnostic, StoredDiagnostics

### Community 51 - "Community 51"
Cohesion: 0.21
Nodes (5): buildSettingsHtml(), configureAICommand(), escapeHtml(), WebViewMessage, LLMRouterService

### Community 52 - "Community 52"
Cohesion: 0.19
Nodes (6): PROFILING_ATTRIBUTES, PROFILING_CODES, validateProfilingAttributes(), ISubjectSchemeService, SubjectDefinition, SubjectSchemeData

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
Cohesion: 0.22
Nodes (1): DitaOtOutputChannel

### Community 57 - "Community 57"
Cohesion: 0.17
Nodes (11): createClassMatcher(), isLocalDita(), MAP_MAP, MAP_TOPICREF, MAP_TYPE_NAMES, MAPGROUP_TOPICHEAD, matchesDitaClass(), TOPIC_IMAGE (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.27
Nodes (9): detectEOL(), formatXML(), getSimpleTextContent(), handleFormatting(), handleRangeFormatting(), INLINE_ELEMENTS, PREFORMATTED_ELEMENTS, tokenize() (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.25
Nodes (7): configureDitaOTCommand(), DITA_EXTENSIONS, getValidationRateLimiter(), initializeValidator(), resetValidationRateLimiter(), validateCommand(), ValidateFileResult

### Community 60 - "Community 60"
Cohesion: 0.38
Nodes (9): canonicalizeCycle(), CYCLE_CODES, detectCircularReferences(), dfsDetectAnyCycle(), extractFileReferences(), FileRef, isDitaFile(), normalizePath() (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (10): getCommentRanges(), getValueStartOffset(), handleDocumentLinkResolve(), handleDocumentLinks(), isInsideComment(), LinkData, processFileRefs(), processKeyRefs() (+2 more)

### Community 62 - "Community 62"
Cohesion: 0.20
Nodes (3): BreakerWrappedProvider, ILLMProvider, isAbortError()

### Community 63 - "Community 63"
Cohesion: 0.24
Nodes (8): TypesXMLCatalog, TypesXMLDOMBuilder, TypesXMLModule, TypesXMLSAXParser, BUNDLES, MessageBundle, setLocale(), t()

### Community 64 - "Community 64"
Cohesion: 0.27
Nodes (9): buildInitializeResult(), ClassifiedFileChange, classifyWatchedFileChanges(), ClientCapabilities, detectClientCapabilities(), extractWorkspaceFolderPaths(), FileChangeClassification, isMapFile() (+1 more)

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
Cohesion: 0.33
Nodes (3): AICompletionProvider, DITA_SELECTOR, registerAICompletionProvider()

### Community 69 - "Community 69"
Cohesion: 0.25
Nodes (4): AI_FIXABLE_CODES, AIQuickFixProvider, executeAiQuickFix(), safeExecuteAiQuickFix()

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
Cohesion: 0.43
Nodes (7): escapeRegExp(), findClosingTag(), findOpeningTag(), findTagAtOffset(), handleLinkedEditingRange(), TagAtOffset, TagNameRange

### Community 74 - "Community 74"
Cohesion: 0.32
Nodes (2): AnthropicLLMProvider, ILLMProvider

### Community 75 - "Community 75"
Cohesion: 0.32
Nodes (2): ILLMProvider, OpenAILLMProvider

### Community 76 - "Community 76"
Cohesion: 0.39
Nodes (1): ValidationReportPanel

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
Cohesion: 0.33
Nodes (1): TestDetectPerformanceGaps

### Community 86 - "Community 86"
Cohesion: 0.33
Nodes (1): TestDetectSecurityGaps

### Community 87 - "Community 87"
Cohesion: 0.60
Nodes (4): BUILD_STAGE_PATTERNS, disposeDitaOtOutputChannel(), getDitaOtOutputChannel(), LOG_LEVEL_PATTERNS

### Community 88 - "Community 88"
Cohesion: 0.50
Nodes (3): isDitaMap(), PRESET_INTENTIONS, restructureMapCommand()

### Community 89 - "Community 89"
Cohesion: 0.50
Nodes (3): handleCodeActions(), altAttrDiag(), makeDiag()

### Community 90 - "Community 90"
Cohesion: 0.50
Nodes (1): vscode

## Knowledge Gaps
- **250 isolated node(s):** `Unit tests for review_spec.py`, `Write content to a temp file and return its path.`, `todolist' should not trigger because \\b prevents partial match.`, `latest' contains 'test' but is NOT a testing term.`, `esbuild` (+245 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 2`** (2 nodes): `IKeySpaceService`, `KeySpaceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `DitaLinkProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `Logger`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `DitaPreviewPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `ISubjectSchemeService`, `SubjectSchemeService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `todolist' should not trigger because \\b prevents partial match.`, `TestBasicAnalysis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `latest' contains 'test' but is NOT a testing term.`, `TestDetectTestingGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `MapVisualizerPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `TestBuildSummary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `TestMainIntegration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `DitaOtOutputChannel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `TestBuildRiskRegister`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `CatalogValidationService`, `ICatalogValidationService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (2 nodes): `ILLMProvider`, `OllamaLLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `AnthropicLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `ILLMProvider`, `OpenAILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `ValidationReportPanel`
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
- **Thin community `Community 85`** (1 nodes): `TestDetectPerformanceGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `TestDetectSecurityGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `vscode`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KeySpaceService` connect `Community 2` to `Community 6`, `Community 36`, `Community 21`, `Community 61`, `Community 81`, `Community 11`, `Community 31`, `Community 43`, `Community 38`, `Community 16`, `Community 20`, `Community 25`, `Community 0`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `Logger` connect `Community 17` to `Community 44`, `Community 45`, `Community 18`, `Community 35`, `Community 5`, `Community 1`, `Community 49`, `Community 14`, `Community 12`, `Community 83`, `Community 39`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `Unit tests for review_spec.py`, `Write content to a temp file and return its path.`, `todolist' should not trigger because \\b prevents partial match.` to the rest of the system?**
  _250 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05387861084063616 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.052313883299798795 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08673469387755102 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08235294117647059 - nodes in this community are weakly interconnected._