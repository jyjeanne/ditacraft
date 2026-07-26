# Graph Report - .  (2026-07-26)

## Corpus Check
- 324 files · ~403,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1501 nodes · 3133 edges · 90 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 813 · imports: 629 · calls: 567 · method: 468 · imports_from: 404 · MODIFIES: 198 · re_exports: 36 · implements: 9 · inherits: 4 · rationale_for: 4 · ON_BRANCH: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 324 · Candidates: 831
- Excluded: 0 untracked · 50404 ignored · 3 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `6615e5a`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `KeySpaceService` - 72 edges
2. `Logger` - 41 edges
3. `KeySpaceResolver` - 32 edges
4. `SubjectSchemeService` - 30 edges
5. `DitaLinkProvider` - 28 edges
6. `ValidationPipeline` - 23 edges
7. `DitaPreviewPanel` - 23 edges
8. `DitaOtWrapper` - 22 edges
9. `CatalogValidationService` - 16 edges
10. `RngValidationService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `handleCodeActions()` --calls--> `getFixesForDiagnostic()`  [EXTRACTED]
  server/src/features/codeActions.ts → server/src/features/codeActions.ts  _Bridges community 88 → community 36_
- `registerAICompletionProvider()` --calls--> `AICompletionProvider`  [EXTRACTED]
  src/providers/aiCompletionProvider.ts → src/providers/aiCompletionProvider.ts  _Bridges community 12 → community 82_
- `registerDitaLinkProvider()` --calls--> `DitaLinkProvider`  [EXTRACTED]
  src/providers/ditaLinkProvider.ts → src/providers/ditaLinkProvider.ts  _Bridges community 89 → community 11_
- `SubjectSchemeSnapshot` --implements--> `SubjectSchemeQueries`  [EXTRACTED]
  server/src/services/subjectSchemeService.ts → server/src/services/subjectSchemeService.ts  _Bridges community 6 → community 17_
- `findContainingWorkspaceFolder()` --calls--> `normalizeFsPath()`  [EXTRACTED]
  server/src/utils/textUtils.ts → server/src/utils/textUtils.ts  _Bridges community 66 → community 25_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (2): IKeySpaceService, KeySpaceService

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (23): executeValidation(), GuideValidationContext, mapToValidationIssues(), validateGuideCommand(), validateGuidePrerequisites(), ValidationIssue, ValidationReport, ValidationReportPanel (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (32): FragmentValidationResult, handleValidateFragment(), ValidateFragmentParams, wrapFragment(), ValidationSummary, catalogService, catalogValidationService, connection (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (11): DitaExplorerItem, DitaExplorerProvider, ICON_MAP, MapVisualizerPanel, detectMapType(), extractAttribute(), findAllMapsInWorkspace(), MapNode (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (23): TOPIC_MISSING_TITLE, TOPIC_VALID, MAP_WITH_KEYS, TOPIC, MAP_CONTENT, TOPIC, createTestWorkspace(), TestWorkspace (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (13): ICatalogValidationService, CacheConfig, KeyDefinition, KeyMetadata, KeyResolutionReport, KeySpace, KeySpaceSettings, ResolutionStep (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (3): ISubjectSchemeService, SubjectSchemeService, SubjectSchemeSnapshot

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (19): McpContext, fileExists(), fileUriToFsPath(), resolvePath(), validateWithinWorkspace(), DitaContextSnapshotArgs, DitaExplainKeyArgs, ExplainKeyResult (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (26): ATTRIBUTE_VALUES, COMMON_ATTRIBUTES, DITA_ELEMENTS, DITAVAL_ELEMENTS, ELEMENT_ATTRIBUTES, ELEMENT_DOCS, CompletionContext, Context (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (12): ConfigurationChangeEvent, ConfigurationChangeListener, ConfigurationErrorHandler, ConfigurationManager, DEFAULT_CONFIG, DitaCraftConfiguration, getConfigManager(), LogLevelType (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (26): DitaClassMatcher, KEYREF_ELEMENTS, MAP_RELCOLSPEC, MAP_RELTABLE, MAP_TOPICMETA, MAPGROUP_KEYDEF, SUBJECTSCHEME_ATTRIBUTEDEF, SUBJECTSCHEME_DEFAULTSUBJECT (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (1): DitaLinkProvider

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (19): DITA_SELECTOR, registerAICompletionProvider(), registerPreviewPanelSerializer(), activate(), handleConfigurationChange(), registerCommands(), registerConfigurationListener(), registerLoggerCommands() (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (1): KeySpaceResolver

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (11): DiagnosticItem, DiagnosticsViewProvider, DITA_SOURCES, GroupMode, createDebounced(), createDebouncedMap(), createDebouncedSet(), Debounced (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (19): buildMapNode(), ContextGraph, countElements(), GetContextGraphParams, handleGetContextGraph(), KeyDef, MapNode, readShortDesc() (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (13): buildSettingsHtml(), configureAICommand(), escapeHtml(), WebViewMessage, configureDitaOTCommand(), setupCSpellCommand(), DITA_EXTENSIONS, getValidationRateLimiter() (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (16): PROFILING_ATTRIBUTES, PROFILING_CODES, validateProfilingAttributes(), ISubjectSchemeService, SubjectDefinition, SubjectSchemeData, SubjectSchemeQueries, applySuppressions() (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (12): RngValidationService, ROOT_TO_SCHEMA, SalveConvertResult, SalveGrammar, SalveModule, SalveValidationError, SalveWalker, SaxesAttribute (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (4): main, 6615e5a Fix follow-up review findings: bounded findRootMap walk, scoped invalidation, snapshot memoization, DitaCraftAPI, vscode

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (20): checkEmptyElements(), checkEntityExpansion(), checkTopicrefsWithoutHref(), CODES, createRange(), DITA_ROOT_ELEMENTS, entityRange(), getEnclosingElement() (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (3): formatError(), Semaphore, ValidationPipeline

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (17): configManager, CACHE_DEFAULTS, CONFIG_KEYS, DEBOUNCE_CONSTANTS, DITA_ELEMENTS, DITA_EXTENSIONS, DITA_OT, isDitaFilePath() (+9 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (1): Logger

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (9): DEFAULT_SETTINGS, DITA_RULES, DitaRule, DitaRulesSettings, validateDitaRules(), DEFAULT_SETTINGS, detectDitaVersion(), DitaVersion (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (13): filterMatchingRefs(), handleReferences(), collectMatchingEdits(), handlePrepareRename(), handleRename(), ReferenceOccurrence, normalizeFsPath(), offsetToPosition() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (1): DitaPreviewPanel

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (17): handleDefinition(), locationAtFileStart(), resolveElementInFile(), resolveInDocument(), findElementByIdOffset(), findIdAtOffset(), findReferenceAtOffset(), findReferencesToId() (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (9): ValidationPhase, WorkspaceContext, DitaCraftSettings, defaultSettings, emptyWorkspace, defaultSettings(), validate(), defaultSettings (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.21
Nodes (13): isDitaMap(), PRESET_INTENTIONS, restructureMapCommand(), createEnhancedError(), fireAndForget(), FireAndForgetOptions, formatDitaError(), formatErrorMessage() (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (13): ContentModel, DITA_CONTENT_MODELS, parseElementTree(), validateContentModel(), validateElement(), XmlElement, buildLineOffsets(), computeFoldingRanges() (+5 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (12): BuildContextSnapshotParams, buildLevel1(), buildLevel2(), buildLevel3(), ContextSnapshotResult, countTopicRefs(), escapeXml(), estimateTokens() (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (8): createUnusedTopicDiagnostic(), detectCrossFileDuplicateIds(), detectUnusedTopics(), extractRootId(), mapWithConcurrency(), WORKSPACE_CODES, WorkspaceIndex, collectDitaFilesAsync()

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (4): BreakerWrappedProvider, ILLMProvider, isAbortError(), LLMRouterService

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (10): DiagnosticsResourceResult, KeyEntry, KeysResourceResult, MapEntry, MapsResourceResult, Level, levels, log() (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (5): BUILD_STAGE_PATTERNS, disposeDitaOtOutputChannel(), DitaOtOutputChannel, getDitaOtOutputChannel(), LOG_LEVEL_PATTERNS

### Community 36 - "Community 36"
Cohesion: 0.19
Nodes (17): TOPIC_TYPE_NAMES, CODES, fixDeprecatedAltAttr(), fixDeprecatedIndextermref(), fixDuplicateId(), fixEmptyElement(), fixInvalidIdFormat(), fixMissingAlt() (+9 more)

### Community 37 - "Community 37"
Cohesion: 0.19
Nodes (8): AIServiceOrchestrator, BuildContextSnapshotParams, extractXml(), FixFragmentResult, FragmentValidationResult, RestructureResult, tokenToSignal(), ValidateFragmentParams

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (6): ItemKind, KeySpaceItem, KeySpaceViewProvider, KeyUsage, offsetToPosition(), scanKeyUsages()

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (2): DitaOtWrapper, execFileAsync

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (13): areConrefCompatible(), CONREF_COMPAT_GROUPS, elementToBaseGroup, findTargetElementByIdOnly(), findTargetElementName(), getContainingElementName(), getScopeValue(), isExternalScope() (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (5): createCustomRateLimiter(), createRateLimiter(), RATE_LIMIT_DEFAULTS, RateLimitConfig, RateLimiter

### Community 42 - "Community 42"
Cohesion: 0.19
Nodes (14): folderReadme(), fs, GRAPHIFY_CLI, main(), OUT_DIR, path, publishOutputs(), rebuildGraph() (+6 more)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (2): todolist' should not trigger because \\b prevents partial match., TestBasicAnalysis

### Community 44 - "Community 44"
Cohesion: 0.13
Nodes (2): latest' contains 'test' but is NOT a testing term., TestDetectTestingGaps

### Community 45 - "Community 45"
Cohesion: 0.24
Nodes (11): clearDocumentSettings(), defaultSettings, documentSettings, getDocumentSettings(), getGlobalSettings(), initSettings(), updateGlobalSettings(), makeCatalogService() (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.30
Nodes (12): createDitaFile(), FileCreationOptions, generateBookmapContent(), generateMapContent(), generateTopicContent(), getWorkspaceFolder(), newBookmapCommand(), newMapCommand() (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (12): displayPreview(), findMainHtmlFile(), generateHtml5OutputIfNeeded(), getAndValidateFileUri(), handlePreviewError(), initializeAndValidateDitaOt(), initializePreview(), pathsEqual() (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.16
Nodes (11): esbuild, esbuildProblemMatcherPlugin, main(), minify, sharedOptions, sourcemap, esbuild, minify (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.21
Nodes (11): cachedRules, clearCustomRulesCache(), CompiledRule, CustomRuleDefinition, CustomRulesFile, detectFileType(), isSafeRegex(), loadRules() (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.19
Nodes (7): diagnosticSeverityLabel(), DiagnosticsStore, globToRegex(), matchGlob(), QueryOptions, StoredDiagnostic, StoredDiagnostics

### Community 51 - "Community 51"
Cohesion: 0.56
Nodes (6): ChatMessage, DitaCraftLLMConfig, ILLMProvider, LLMRequest, LLMResponse, ProviderId

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (1): TestBuildSummary

### Community 53 - "Community 53"
Cohesion: 0.27
Nodes (1): TestMainIntegration

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (5): disposeProviderFactory(), getProviderFactory(), isProviderFactoryInitialized(), ProviderFactory, ProviderFactoryOptions

### Community 55 - "Community 55"
Cohesion: 0.24
Nodes (9): executePublish(), publishCommand(), publishHTML5Command(), validateAndPrepareForPublish(), DitaOtConfig, PublishOptions, PublishProgress, PublishResult (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (11): createClassMatcher(), isLocalDita(), MAP_MAP, MAP_TOPICREF, MAP_TYPE_NAMES, MAPGROUP_TOPICHEAD, matchesDitaClass(), TOPIC_IMAGE (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.27
Nodes (9): detectEOL(), formatXML(), getSimpleTextContent(), handleFormatting(), handleRangeFormatting(), INLINE_ELEMENTS, PREFORMATTED_ELEMENTS, tokenize() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.38
Nodes (9): canonicalizeCycle(), CYCLE_CODES, detectCircularReferences(), dfsDetectAnyCycle(), extractFileReferences(), FileRef, isDitaFile(), normalizePath() (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.20
Nodes (2): AICallMetric, MetricsCollector

### Community 60 - "Community 60"
Cohesion: 0.24
Nodes (8): TypesXMLCatalog, TypesXMLDOMBuilder, TypesXMLModule, TypesXMLSAXParser, BUNDLES, MessageBundle, setLocale(), t()

### Community 61 - "Community 61"
Cohesion: 0.38
Nodes (9): getCommentRanges(), getValueStartOffset(), handleDocumentLinkResolve(), handleDocumentLinks(), isInsideComment(), LinkData, processFileRefs(), processKeyRefs() (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (9): buildSymbolTree(), extractTextContent(), extractWorkspaceSymbols(), handleDocumentSymbol(), handleWorkspaceSymbol(), OUTLINE_ELEMENTS, ParsedTag, parseTags() (+1 more)

### Community 63 - "Community 63"
Cohesion: 0.44
Nodes (9): basic_analysis(), build_risk_register(), build_summary(), create_issue(), detect_performance_gaps(), detect_security_gaps(), detect_testing_gaps(), load_spec() (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.20
Nodes (1): TestBuildRiskRegister

### Community 65 - "Community 65"
Cohesion: 0.31
Nodes (2): CatalogValidationService, ICatalogValidationService

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (7): effectiveWorkspaceFolders(), escapeRegex(), findContainingWorkspaceFolder(), isPathWithinWorkspace(), offsetToRange(), stripCommentsAndCDATA(), stripCommentsAndCodeContent()

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (2): CircuitBreaker, State

### Community 68 - "Community 68"
Cohesion: 0.25
Nodes (4): AI_FIXABLE_CODES, AIQuickFixProvider, executeAiQuickFix(), safeExecuteAiQuickFix()

### Community 69 - "Community 69"
Cohesion: 0.28
Nodes (2): ILLMProvider, OllamaLLMProvider

### Community 70 - "Community 70"
Cohesion: 0.39
Nodes (7): createDitacraftParticipant(), handleExplain(), handleRequest(), handleRestructure(), handleSuggestReuse(), handleValidate(), HELP_MESSAGE

### Community 71 - "Community 71"
Cohesion: 0.43
Nodes (7): escapeRegExp(), findClosingTag(), findOpeningTag(), findTagAtOffset(), handleLinkedEditingRange(), TagAtOffset, TagNameRange

### Community 72 - "Community 72"
Cohesion: 0.32
Nodes (2): AnthropicLLMProvider, ILLMProvider

### Community 73 - "Community 73"
Cohesion: 0.32
Nodes (2): ILLMProvider, OpenAILLMProvider

### Community 74 - "Community 74"
Cohesion: 0.25
Nodes (1): TestConstants

### Community 75 - "Community 75"
Cohesion: 0.46
Nodes (1): TestCreateIssue

### Community 76 - "Community 76"
Cohesion: 0.32
Nodes (4): Unit tests for review_spec.py, Write content to a temp file and return its path., TestLoadSpec, _tmp_spec()

### Community 77 - "Community 77"
Cohesion: 0.29
Nodes (4): defaultMcpSettings(), DitaValidateArgs, DitaValidateResult, SerializedDiagnostic

### Community 78 - "Community 78"
Cohesion: 0.36
Nodes (1): DtdResolver

### Community 79 - "Community 79"
Cohesion: 0.57
Nodes (6): getConrefPreview(), getHrefHover(), getKeyrefHover(), getWordAt(), handleHover(), isInsideTag()

### Community 80 - "Community 80"
Cohesion: 0.38
Nodes (2): CopilotLLMProvider, ILLMProvider

### Community 81 - "Community 81"
Cohesion: 0.48
Nodes (5): escapeRegExp(), findElementById(), navigateToElement(), registerElementNavigationCommand(), showDocumentAtLine()

### Community 82 - "Community 82"
Cohesion: 0.53
Nodes (1): AICompletionProvider

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (1): DitaFileDecorationProvider

### Community 84 - "Community 84"
Cohesion: 0.33
Nodes (1): TestDetectPerformanceGaps

### Community 85 - "Community 85"
Cohesion: 0.33
Nodes (1): TestDetectSecurityGaps

### Community 86 - "Community 86"
Cohesion: 0.33
Nodes (2): formatResolutionReport(), reportKeySpace()

### Community 87 - "Community 87"
Cohesion: 0.33
Nodes (5): extensionRoot, initializedMsg, initMsg, server, serverScript

### Community 88 - "Community 88"
Cohesion: 0.50
Nodes (3): handleCodeActions(), altAttrDiag(), makeDiag()

### Community 89 - "Community 89"
Cohesion: 0.60
Nodes (3): getGlobalKeySpaceResolver(), PendingKeyLink, registerDitaLinkProvider()

## Knowledge Gaps
- **250 isolated node(s):** `Unit tests for review_spec.py`, `Write content to a temp file and return its path.`, `todolist' should not trigger because \\b prevents partial match.`, `latest' contains 'test' but is NOT a testing term.`, `esbuild` (+245 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (2 nodes): `IKeySpaceService`, `KeySpaceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `DitaLinkProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `KeySpaceResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `Logger`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `DitaPreviewPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `DitaOtWrapper`, `execFileAsync`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `todolist' should not trigger because \\b prevents partial match.`, `TestBasicAnalysis`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `latest' contains 'test' but is NOT a testing term.`, `TestDetectTestingGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `TestBuildSummary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `TestMainIntegration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `AICallMetric`, `MetricsCollector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `TestBuildRiskRegister`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (2 nodes): `CatalogValidationService`, `ICatalogValidationService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `CircuitBreaker`, `State`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (2 nodes): `ILLMProvider`, `OllamaLLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (2 nodes): `AnthropicLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `ILLMProvider`, `OpenAILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `TestConstants`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `TestCreateIssue`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `DtdResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `CopilotLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `AICompletionProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `DitaFileDecorationProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `TestDetectPerformanceGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `TestDetectSecurityGaps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (2 nodes): `formatResolutionReport()`, `reportKeySpace()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KeySpaceService` connect `Community 0` to `Community 8`, `Community 40`, `Community 27`, `Community 61`, `Community 79`, `Community 25`, `Community 32`, `Community 5`, `Community 17`, `Community 2`, `Community 7`, `Community 86`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `KeySpaceResolver` connect `Community 13` to `Community 89`, `Community 22`, `Community 54`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `Logger` connect `Community 23` to `Community 46`, `Community 47`, `Community 55`, `Community 1`, `Community 3`, `Community 89`, `Community 38`, `Community 29`, `Community 12`, `Community 81`, `Community 22`, `Community 54`, `Community 41`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `Unit tests for review_spec.py`, `Write content to a temp file and return its path.`, `todolist' should not trigger because \\b prevents partial match.` to the rest of the system?**
  _250 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08392156862745098 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08658536585365853 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07254623044096728 - nodes in this community are weakly interconnected._