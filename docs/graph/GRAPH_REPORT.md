# Graph Report - .  (2026-09-02)

## Corpus Check
- Large corpus: 1869 files · ~569,701 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1710 nodes · 3862 edges · 87 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 1034 · imports: 874 · calls: 684 · imports_from: 537 · method: 411 · MODIFIES: 245 · re_exports: 62 · implements: 9 · inherits: 5 · ON_BRANCH: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 1869 · Candidates: 2412
- Excluded: 0 untracked · 49266 ignored · 21 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `9f45273`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `KeySpaceService` - 82 edges
2. `Logger` - 51 edges
3. `KeySpaceResolver` - 42 edges
4. `SubjectSchemeService` - 36 edges
5. `DitaLinkProvider` - 28 edges
6. `DitaPreviewPanel` - 24 edges
7. `DitaOtWrapper` - 24 edges
8. `ValidationPipeline` - 23 edges
9. `uriToPath()` - 20 edges
10. `DitavalConditionEditorPanel` - 20 edges

## Surprising Connections (you probably didn't know these)
- `validateDITADocument()` --calls--> `checkEntityExpansion()`  [EXTRACTED]
  server/src/features/validation.ts → server/src/features/validation.ts  _Bridges community 59 → community 22_
- `registerAICompletionProvider()` --calls--> `AICompletionProvider`  [EXTRACTED]
  src/providers/aiCompletionProvider.ts → src/providers/aiCompletionProvider.ts  _Bridges community 20 → community 82_
- `findContainingWorkspaceFolder()` --calls--> `normalizeFsPath()`  [EXTRACTED]
  server/src/utils/textUtils.ts → server/src/utils/textUtils.ts  _Bridges community 11 → community 44_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (33): DitavalConditionEditorPanel, GetSubjectSchemeAttributesResponse, WebviewMessage, exceedsLargeFileThreshold(), excludedDecorationType, loadActiveRules(), recompute(), registerConditionHighlighting() (+25 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (45): BODY_TAG, buildExtractedTopicContent(), detectNewTopicType(), extractTopicFromSectionCommand(), NewTopicType, slugify(), createDitaFile(), FileCreationOptions (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (18): ICatalogValidationService, CacheConfig, formatResolutionReport(), KeyDefinition, KeyMetadata, KeyResolutionReport, KeySpace, KeySpaceSettings (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (2): IKeySpaceService, KeySpaceService

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (39): ATTRIBUTE_VALUES, COMMON_ATTRIBUTES, DITA_ELEMENTS, DITAVAL_ELEMENTS, ELEMENT_ATTRIBUTES, ELEMENT_DOCS, CompletionContext, Context (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (9): DitaLinkProvider, getGlobalKeySpaceResolver(), PendingKeyLink, registerDitaLinkProvider(), disposeProviderFactory(), getProviderFactory(), isProviderFactoryInitialized(), ProviderFactory (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (37): createClassMatcher(), DitaClassMatcher, isLocalDita(), KEYREF_ELEMENTS, MAP_MAP, MAP_RELCOLSPEC, MAP_RELTABLE, MAP_TOPICMETA (+29 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (24): PROFILING_ATTRIBUTES, PROFILING_CODES, validateProfilingAttributes(), TypesXMLCatalog, TypesXMLDOMBuilder, TypesXMLModule, TypesXMLSAXParser, applySuppressions() (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (13): ValidationIssue, ValidationReport, ValidationReportPanel, DITA_OT_ERROR_CODES, DitaOtCodeInfo, DitaOtModule, getModuleForCode(), lookupErrorCode() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (23): TOPIC_MISSING_TITLE, TOPIC_VALID, MAP_WITH_KEYS, TOPIC, MAP_CONTENT, TOPIC, createTestWorkspace(), TestWorkspace (+15 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (20): buildImageElement(), buildImageSnippet(), computeImageHref(), copyImageIntoDirectory(), IMAGE_EXTENSIONS, ImageSizeAttrs, insertImageCommand(), isEligibleDocument() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (26): getConrefPreview(), getHrefHover(), getKeyrefHover(), getWordAt(), handleHover(), isInsideTag(), buildOpenTagWithoutRefAttr(), ConrefElement (+18 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (27): FindReplaceParams, FragmentValidationResult, handleValidateFragment(), ValidateFragmentParams, wrapFragment(), InlineConrefParams, ComputeMoveEditsParams, handleComputeMoveEdits() (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (14): DiagnosticsResourceResult, KeyEntry, KeysResourceResult, MapEntry, MapsResourceResult, Level, levels, log() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (12): ConfigurationChangeEvent, ConfigurationChangeListener, ConfigurationErrorHandler, ConfigurationManager, DEFAULT_CONFIG, DitaCraftConfiguration, getConfigManager(), LogLevelType (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (11): DEFAULT_SETTINGS, DITA_RULES, DitaRule, DitaRulesSettings, validateDitaRules(), DEFAULT_SETTINGS, DITA_RULES_SETTINGS, ROOT_MAP (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (1): KeySpaceResolver

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (8): configureDitaOTCommand(), DitaOtConfig, DitaOtWrapper, execFileAsync, PublishOptions, PublishProgress, PublishResult, toVsCodeProgressReporter()

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (11): DITA_EXTENSIONS, getValidationRateLimiter(), initializeValidator(), resetValidationRateLimiter(), validateCommand(), ValidateFileResult, createCustomRateLimiter(), createRateLimiter() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (22): handleDefinition(), locationAtFileStart(), resolveElementInFile(), resolveInDocument(), countKeyDefinitionOccurrences(), extractKeyPart(), findElementByIdOffset(), findFileReferences() (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (19): DITA_SELECTOR, registerAICompletionProvider(), registerPreviewPanelSerializer(), activate(), handleConfigurationChange(), LspTextEdit, LspWorkspaceEdit, registerCommands() (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (20): executePublish(), pickProfileOrConfigureOnce(), publishCommand(), publishHTML5Command(), PublishOverrides, validateAndPrepareForPublish(), describeProfile(), FALLBACK_TRANSTYPES (+12 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (22): TOPIC_TYPE_NAMES, checkEmptyElements(), checkEntityExpansion(), checkTopicrefsWithoutHref(), CODES, createRange(), DITA_ROOT_ELEMENTS, entityRange() (+14 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (19): buildMapNode(), ContextGraph, countElements(), GetContextGraphParams, handleGetContextGraph(), KeyDef, MapNode, readShortDesc() (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (11): enumerateAttributes(), GetSubjectSchemeAttributesParams, GetSubjectSchemeAttributesResult, handleGetSubjectSchemeAttributes(), SchemeAttributeInfo, SchemeAttributeValue, ISubjectSchemeService, SubjectDefinition (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (15): executeValidation(), GuideValidationContext, mapToValidationIssues(), validateGuideCommand(), validateGuidePrerequisites(), disposeDitaOtDiagnostics(), DitaOtDiagnostics, DitaOtError (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (12): RngValidationService, ROOT_TO_SCHEMA, SalveConvertResult, SalveGrammar, SalveModule, SalveValidationError, SalveWalker, SaxesAttribute (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (17): configManager, CACHE_DEFAULTS, CONFIG_KEYS, DEBOUNCE_CONSTANTS, DITA_ELEMENTS, DITA_EXTENSIONS, DITA_OT, isDitaContentPath() (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (14): setupCSpellCommand(), disposeWatchMode(), flashStatus(), isWatchModeActive(), pathExists(), resolveWatchPublishOptions(), resolveWatchTarget(), runWatchPublish() (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (2): ISubjectSchemeService, SubjectSchemeService

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (3): formatError(), Semaphore, ValidationPipeline

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (1): Logger

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (4): main, 9f45273 [npm]: bump the production-dependencies group across 1 directory with 5 updates, DitaCraftAPI, detectDitaVersion()

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (1): DitaPreviewPanel

### Community 34 - "Community 34"
Cohesion: 0.21
Nodes (18): activeDitavalChangedEmitter, computeFilterSuffix(), displayPreview(), findMainHtmlFile(), generateHtml5OutputIfNeeded(), getActiveDitavalPath(), getAndValidateFileUri(), handlePreviewError() (+10 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (15): fileExists(), fileUriToFsPath(), resolvePath(), validateWithinWorkspace(), DitaKeySpaceArgs, DitaKeySpaceResult, KeyEntry, detectTopicType() (+7 more)

### Community 36 - "Community 36"
Cohesion: 0.21
Nodes (13): isDitaMap(), PRESET_INTENTIONS, restructureMapCommand(), createEnhancedError(), fireAndForget(), FireAndForgetOptions, formatDitaError(), formatErrorMessage() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.19
Nodes (12): BuildContextSnapshotParams, buildLevel1(), buildLevel2(), buildLevel3(), ContextSnapshotResult, countTopicRefs(), escapeXml(), estimateTokens() (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (8): createUnusedTopicDiagnostic(), detectCrossFileDuplicateIds(), detectUnusedTopics(), extractRootId(), mapWithConcurrency(), WORKSPACE_CODES, WorkspaceIndex, collectDitaFilesAsync()

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (4): BreakerWrappedProvider, ILLMProvider, isAbortError(), LLMRouterService

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (8): ItemKind, KeySpaceItem, KeySpaceViewProvider, KeyDefinition, KeySpace, KeyUsage, offsetToPosition(), scanKeyUsages()

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (17): CODES, fixDeprecatedAltAttr(), fixDeprecatedIndextermref(), fixDuplicateId(), fixEmptyElement(), fixInvalidIdFormat(), fixMissingAlt(), fixMissingBooktitle() (+9 more)

### Community 42 - "Community 42"
Cohesion: 0.19
Nodes (8): AIServiceOrchestrator, BuildContextSnapshotParams, extractXml(), FixFragmentResult, FragmentValidationResult, RestructureResult, tokenToSignal(), ValidateFragmentParams

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (10): BatchMetadataResponse, BatchMetadataSkippedFile, batchUpdateMetadataCommand(), describeBatchLabel(), KNOWN_PROFILING_ATTRIBUTES, promptForAttribute(), resolveSelectedFileItems(), summarizeSkipped() (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.23
Nodes (10): filterMatchingRefs(), handleReferences(), ReferenceOccurrence, normalizeFsPath(), offsetToPosition(), collectDitaFiles(), DITA_EXTENSIONS, findCrossFileReferences() (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (4): DiagnosticItem, DiagnosticsViewProvider, DITA_SOURCES, GroupMode

### Community 46 - "Community 46"
Cohesion: 0.19
Nodes (14): folderReadme(), fs, GRAPHIFY_CLI, main(), OUT_DIR, path, publishOutputs(), rebuildGraph() (+6 more)

### Community 47 - "Community 47"
Cohesion: 0.24
Nodes (11): clearDocumentSettings(), defaultSettings, documentSettings, getDocumentSettings(), getGlobalSettings(), initSettings(), updateGlobalSettings(), makeCatalogService() (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.16
Nodes (11): esbuild, esbuildProblemMatcherPlugin, main(), minify, sharedOptions, sourcemap, esbuild, minify (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.24
Nodes (13): areConrefCompatible(), CONREF_COMPAT_GROUPS, elementToBaseGroup, findTargetElementByIdOnly(), findTargetElementName(), getContainingElementName(), getScopeValue(), isExternalScope() (+5 more)

### Community 50 - "Community 50"
Cohesion: 0.21
Nodes (11): cachedRules, clearCustomRulesCache(), CompiledRule, CustomRuleDefinition, CustomRulesFile, detectFileType(), isSafeRegex(), loadRules() (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.21
Nodes (9): buildSearchPattern(), EMPTY_RESULT, expandReplacement(), FindReplaceResult, handleComputeFindReplaceEdits(), DITA_FILE_EXTENSIONS, FileMove, isDitaFilePath() (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.26
Nodes (1): MapVisualizerPanel

### Community 53 - "Community 53"
Cohesion: 0.19
Nodes (7): diagnosticSeverityLabel(), DiagnosticsStore, globToRegex(), matchGlob(), QueryOptions, StoredDiagnostic, StoredDiagnostics

### Community 54 - "Community 54"
Cohesion: 0.56
Nodes (6): ChatMessage, DitaCraftLLMConfig, ILLMProvider, LLMRequest, LLMResponse, ProviderId

### Community 55 - "Community 55"
Cohesion: 0.36
Nodes (8): ICON_MAP, detectMapType(), extractAttribute(), findAllMapsInWorkspace(), MapNode, parseMapHierarchy(), parseReferences(), TAG_TYPE_MAP

### Community 56 - "Community 56"
Cohesion: 0.23
Nodes (11): BatchMetadataParams, BatchMetadataResult, BatchMetadataSkippedFile, buildAttributeEdit(), escapeXmlAttrValue(), FileOutcome, findRootElement(), handleComputeBatchMetadataEdits() (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.27
Nodes (9): detectEOL(), formatXML(), getSimpleTextContent(), handleFormatting(), handleRangeFormatting(), INLINE_ELEMENTS, PREFORMATTED_ELEMENTS, tokenize() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.27
Nodes (8): buildEditsForVerifiedRefs(), collectCrossFileEdits(), collectMatchingEdits(), collectMatchingKeyEdits(), handleKeyRename(), handlePrepareRename(), handleRename(), KeyAtOffset

### Community 59 - "Community 59"
Cohesion: 0.20
Nodes (6): validateDITADocument(), DitaCraftSettings, defaultSettings, emptyWorkspace, defaultSettings(), validate()

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (9): buildConfirmableWorkspaceEdit(), describeSearchLabel(), FIND_OPTIONS, findReplaceInFilesCommand(), FindReplaceResponse, LspTextEdit, LspWorkspaceEdit, parseFindOptions() (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (8): inlineConrefCommand(), InlineConrefResponse, LspTextEdit, LspWorkspaceEdit, getLanguageClient(), startLanguageClient(), stopLanguageClient(), waitForLanguageClientReady()

### Community 62 - "Community 62"
Cohesion: 0.38
Nodes (9): canonicalizeCycle(), CYCLE_CODES, detectCircularReferences(), dfsDetectAnyCycle(), extractFileReferences(), FileRef, isDitaFile(), normalizePath() (+1 more)

### Community 63 - "Community 63"
Cohesion: 0.20
Nodes (2): AICallMetric, MetricsCollector

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (10): findOkfRs(), fs, linkReadmeFromIndex(), main(), OUT_DIR, path, ROOT, run() (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.27
Nodes (9): buildInitializeResult(), ClassifiedFileChange, classifyWatchedFileChanges(), ClientCapabilities, detectClientCapabilities(), extractWorkspaceFolderPaths(), FileChangeClassification, isMapFile() (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.38
Nodes (9): getCommentRanges(), getValueStartOffset(), handleDocumentLinkResolve(), handleDocumentLinks(), isInsideComment(), LinkData, processFileRefs(), processKeyRefs() (+1 more)

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (9): buildSymbolTree(), extractTextContent(), extractWorkspaceSymbols(), handleDocumentSymbol(), handleWorkspaceSymbol(), OUTLINE_ELEMENTS, ParsedTag, parseTags() (+1 more)

### Community 68 - "Community 68"
Cohesion: 0.31
Nodes (2): CatalogValidationService, ICatalogValidationService

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (2): CircuitBreaker, State

### Community 70 - "Community 70"
Cohesion: 0.25
Nodes (4): AI_FIXABLE_CODES, AIQuickFixProvider, executeAiQuickFix(), safeExecuteAiQuickFix()

### Community 71 - "Community 71"
Cohesion: 0.28
Nodes (2): ILLMProvider, OllamaLLMProvider

### Community 72 - "Community 72"
Cohesion: 0.36
Nodes (7): createDebounced(), createDebouncedMap(), createDebouncedSet(), Debounced, DebouncedMap, DebouncedSet, Disposable

### Community 74 - "Community 74"
Cohesion: 0.39
Nodes (7): createDitacraftParticipant(), handleExplain(), handleRequest(), handleRestructure(), handleSuggestReuse(), handleValidate(), HELP_MESSAGE

### Community 75 - "Community 75"
Cohesion: 0.43
Nodes (7): escapeRegExp(), findClosingTag(), findOpeningTag(), findTagAtOffset(), handleLinkedEditingRange(), TagAtOffset, TagNameRange

### Community 76 - "Community 76"
Cohesion: 0.32
Nodes (2): AnthropicLLMProvider, ILLMProvider

### Community 77 - "Community 77"
Cohesion: 0.32
Nodes (2): ILLMProvider, OpenAILLMProvider

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (4): defaultMcpSettings(), DitaValidateArgs, DitaValidateResult, SerializedDiagnostic

### Community 79 - "Community 79"
Cohesion: 0.36
Nodes (1): DtdResolver

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
Cohesion: 0.33
Nodes (1): DitaExplorerProvider

### Community 84 - "Community 84"
Cohesion: 0.40
Nodes (1): DitaFileDecorationProvider

### Community 85 - "Community 85"
Cohesion: 0.33
Nodes (5): extensionRoot, initializedMsg, initMsg, server, serverScript

### Community 86 - "Community 86"
Cohesion: 0.60
Nodes (4): buildSettingsHtml(), configureAICommand(), escapeHtml(), WebViewMessage

### Community 87 - "Community 87"
Cohesion: 0.50
Nodes (1): vscode

## Knowledge Gaps
- **299 isolated node(s):** `esbuild`, `minify`, `sourcemap`, `sharedOptions`, `esbuild` (+294 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 3`** (2 nodes): `IKeySpaceService`, `KeySpaceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `KeySpaceResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `ISubjectSchemeService`, `SubjectSchemeService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Logger`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `DitaPreviewPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `MapVisualizerPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (2 nodes): `AICallMetric`, `MetricsCollector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `CatalogValidationService`, `ICatalogValidationService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (2 nodes): `CircuitBreaker`, `State`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `ILLMProvider`, `OllamaLLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (2 nodes): `AnthropicLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `ILLMProvider`, `OpenAILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `DtdResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `CopilotLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `AICompletionProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `DitaExplorerProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `DitaFileDecorationProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `vscode`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KeySpaceService` connect `Community 3` to `Community 56`, `Community 4`, `Community 49`, `Community 19`, `Community 24`, `Community 66`, `Community 11`, `Community 44`, `Community 58`, `Community 38`, `Community 2`, `Community 7`, `Community 12`, `Community 13`, `Community 15`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `KeySpaceResolver` connect `Community 16` to `Community 5`, `Community 27`, `Community 73`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `Logger` connect `Community 31` to `Community 43`, `Community 1`, `Community 60`, `Community 61`, `Community 10`, `Community 34`, `Community 21`, `Community 25`, `Community 28`, `Community 55`, `Community 5`, `Community 0`, `Community 40`, `Community 36`, `Community 20`, `Community 17`, `Community 81`, `Community 27`, `Community 18`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `esbuild`, `minify`, `sourcemap` to the rest of the system?**
  _299 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0677555958862674 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08441558441558442 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06918238993710692 - nodes in this community are weakly interconnected._