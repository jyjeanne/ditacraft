# Graph Report - .  (2026-10-06)

## Corpus Check
- Large corpus: 2041 files · ~1,055,971 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 3358 nodes · 8252 edges · 127 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 2108 · imports: 1879 · calls: 1861 · imports_from: 1082 · method: 863 · MODIFIES: 358 · re_exports: 72 · implements: 14 · inherits: 14 · ON_BRANCH: 1


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 2041 · Candidates: 2612
- Excluded: 0 untracked · 45847 ignored · 22 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `0de0c81`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `KeySpaceService` - 82 edges
2. `Logger` - 56 edges
3. `VisualPreviewPanel` - 49 edges
4. `DitaCommands` - 46 edges
5. `EditorSession` - 45 edges
6. `TableCommands` - 43 edges
7. `KeySpaceResolver` - 43 edges
8. `Renderer` - 37 edges
9. `SubjectSchemeService` - 36 edges
10. `ElementNode` - 34 edges

## Surprising Connections (you probably didn't know these)
- `parse()` --calls--> `Scanner`  [EXTRACTED]
  src/shared/cst/parse.ts → src/shared/cst/parse.ts  _Bridges community 2 → community 50_
- `debug()` --calls--> `menuContext()`  [EXTRACTED]
  webview/editor/main.ts → webview/editor/main.ts  _Bridges community 32 → community 16_
- `debug()` --calls--> `post()`  [EXTRACTED]
  webview/editor/main.ts → webview/editor/main.ts  _Bridges community 32 → community 51_
- `dispatchTransaction()` --calls--> `scheduleSelectionReport()`  [EXTRACTED]
  webview/editor/main.ts → webview/editor/main.ts  _Bridges community 16 → community 51_
- `menuContext()` --calls--> `selectedReuse()`  [EXTRACTED]
  webview/editor/main.ts → webview/editor/main.ts  _Bridges community 16 → community 96_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (92): commonMarks(), FRESH, ITEM, SPLITTABLE, withoutMarks(), FRESH, linkAttributes(), LinkTarget (+84 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (33): main, 0de0c81 fix: align @types/vscode with VS Code engine for packaging, enumerateAttributes(), GetSubjectSchemeAttributesParams, GetSubjectSchemeAttributesResult, handleGetSubjectSchemeAttributes(), SchemeAttributeInfo, SchemeAttributeValue (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (76): AttributePairs, rewriteOpenTag(), withAttribute(), parse(), WS, escapeAttr(), escapeText(), openTag() (+68 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (63): ATTRIBUTE_VALUES, COMMON_ATTRIBUTES, DITA_ELEMENTS, DITAVAL_ELEMENTS, ELEMENT_ATTRIBUTES, ELEMENT_DOCS, MAP_TYPE_NAMES, TOPIC_TYPE_NAMES (+55 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (54): handleDocumentLinkResolve(), detectEOL(), formatXML(), getSimpleTextContent(), handleFormatting(), handleRangeFormatting(), INLINE_ELEMENTS, PREFORMATTED_ELEMENTS (+46 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (42): canonicalizeCycle(), CYCLE_CODES, detectCircularReferences(), dfsDetectAnyCycle(), extractFileReferences(), FileRef, isDitaFile(), normalizePath() (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (58): buildBundledGrammars(), BuildOptions, BuildResult, bundledCatalogFor(), bundledVersionOf(), fingerprint(), listFiles(), attributes() (+50 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (43): DIAGNOSTICS_PARAMETERS, DiagnosticsResourceResult, parseLimit(), parseSeverities(), readDiagnosticsResource(), SEVERITIES, KeyEntry, KEYS_PARAMETERS (+35 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (53): handleDefinition(), locationAtFileStart(), resolveElementInFile(), resolveInDocument(), filterMatchingRefs(), handleReferences(), buildEditsForVerifiedRefs(), collectCrossFileEdits() (+45 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (6): EditorSession, elementAt(), fixTitle(), isCommand(), VisualEditorProvider, VisualEditorSelectionSource

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (46): IMAGE_EXTENSIONS, DialogAnswer, LinkPickerContext, openLinkTarget(), EditorSettings, EditorToHost, HostToEditor, QuickFixItem (+38 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (32): rootElement(), askWebAddress(), candidateFiles(), choose(), fileTargets(), keyTargets(), load(), parsed (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (53): createClassMatcher(), DitaClassMatcher, isLocalDita(), KEYREF_ELEMENTS, MAP_MAP, MAP_RELCOLSPEC, MAP_RELTABLE, MAP_TOPICMETA (+45 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (2): IKeySpaceService, KeySpaceService

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (5): carryResolutions(), isMapPath(), isPreviewableTopic(), referenceSignature(), VisualPreviewPanel

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (29): doctypeInternalSubset(), doctypePublicId(), findItem(), MenuContext, Grammar, GrammarIndex, GrammarIndexEntry, externalCatalog() (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (41): columnResizing(), banner, content, contextMenuAtCursor(), dispatchTransaction(), hostReplies, menuContext(), nextProblem() (+33 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (32): attr(), childElements(), childrenNamed(), findElementById(), findElements(), firstChildNamed(), computeGrid(), isGridValid() (+24 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (23): DitavalConditionEditorPanel, GetSubjectSchemeAttributesResponse, WebviewMessage, applyConditionToggle(), ConditionAction, ConditionAttributeState, conditionKey(), ConditionValueState (+15 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (35): args, { Cdp, sleep }, fs, logoArg, os, out, path, REPO (+27 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (15): BatchMetadataParams, BatchMetadataResult, BatchMetadataSkippedFile, buildAttributeEdit(), escapeXmlAttrValue(), FileOutcome, findRootElement(), handleComputeBatchMetadataEdits() (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (31): extensionForMime(), hrefFor(), MIME_EXTENSIONS, pastedImageFolder(), pastedImageName(), droppedUris(), isImagePath(), withAltText() (+23 more)

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (30): buildMapNode(), ContextGraph, countElements(), GetContextGraphParams, handleGetContextGraph(), KeyDef, MapNode, readShortDesc() (+22 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (24): createDitacraftParticipant(), handleExplain(), handleRequest(), handleRestructure(), handleSuggestReuse(), handleValidate(), HELP_MESSAGE, isDitaMap() (+16 more)

### Community 24 - "Community 24"
Cohesion: 0.08
Nodes (27): Border, ColumnResizeContext, isTable(), tableNode(), columnPixels(), ColumnWidth, cssColumnWidths(), formatLength() (+19 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (32): attrValue(), ConditionMarks, cssColor(), flagKey(), FlagLabel, FlagLook, FlagMarks, MarkSpan (+24 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (1): KeySpaceResolver

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (32): GridCell, gridCellFor(), TableGrid, cssLength(), Alias, ALIGN_VALUES, CAPTION_OWNERS, CONREF_ATTRIBUTES (+24 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (1): TableCommands

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (25): readDiagnostics(), readError(), TOPIC_MISSING_TITLE, TOPIC_VALID, MAP_WITH_KEYS, TOPIC, MAP_CONTENT, TOPIC (+17 more)

### Community 30 - "Community 30"
Cohesion: 0.10
Nodes (32): applyProblems(), applySettings(), banner, button(), byId(), content, enhanceImages(), firstPresent() (+24 more)

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (20): AI_MODES, aiMode(), buildLLMConfig(), MODE_PROVIDERS, ChatMessage, ConnectionCheck, DitaCraftLLMConfig, ILLMProvider (+12 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (32): addReference(), askHost(), cursorOffset(), cursorPlace(), debug(), dropImages(), editable(), editAltText() (+24 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (25): describeProfile(), FALLBACK_TRANSTYPES, followDitavalMoves(), getLastUsedProfileName(), getPublishingProfiles(), managePublishingProfilesCommand(), pickTranstype(), promptForDitaval() (+17 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (2): DitaCommands, offsetOf()

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (5): cdataText(), projectText(), rawWithAttributes(), sameXml(), Writer

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (27): createDitaFile(), FileCreationOptions, findExistingPaths(), findNonDirectoryConflicts(), generateBookmapContent(), generateInitBookmapContent(), generateInitMapContent(), generateMapContent() (+19 more)

### Community 37 - "Community 37"
Cohesion: 0.09
Nodes (12): DEFAULT_SETTINGS, DITA_RULES, DitaRule, DitaRulesSettings, validateDitaRules(), DEFAULT_SETTINGS, DITA_RULES_SETTINGS, ROOT_MAP (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (22): revealPropertiesView(), registerPreviewPanelSerializer(), activate(), handleConfigurationChange(), LspTextEdit, LspWorkspaceEdit, registerCommands(), registerConfigurationListener() (+14 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (17): configureDitaOTCommand(), setupCSpellCommand(), executePublish(), pickProfileOrConfigureOnce(), publishCommand(), publishHTML5Command(), PublishOverrides, validateAndPrepareForPublish() (+9 more)

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (20): rawTextContent(), findPlaces(), isMapFile(), mapTitle(), navtitle(), NEAREST, NOT_INHERITED, occurrenceAt() (+12 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (24): checkEmptyElements(), checkEntityExpansion(), checkTopicrefsWithoutHref(), CODES, createRange(), DITA_ROOT_ELEMENTS, entityRange(), extractBracketedSubset() (+16 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (1): DitaLinkProvider

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (24): abbreviatedFormRule(), block(), bodyRule(), compositeRule(), ddRule(), dlentryRule(), dlRule(), dtRule() (+16 more)

### Community 44 - "Community 44"
Cohesion: 0.14
Nodes (14): executeValidation(), GuideValidationContext, mapToValidationIssues(), validateGuideCommand(), validateGuidePrerequisites(), ValidationIssue, ValidationReport, ValidationReportPanel (+6 more)

### Community 45 - "Community 45"
Cohesion: 0.11
Nodes (16): buildSearchPattern(), EMPTY_RESULT, expandReplacement(), FindReplaceParams, FindReplaceResult, handleComputeFindReplaceEdits(), searchableSpans(), ComputeMoveEditsParams (+8 more)

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (8): MenuItem, closeMenu(), ContextMenu, Level, MenuOptions, openMenu(), Runnable, showMenu()

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (21): ConrefElement, CONSUMED, ElementExtent, findConrefElementAtOffset(), handleComputeInlineConrefEdit(), InlineConrefParams, InlineConrefResult, readDocOrFile() (+13 more)

### Community 48 - "Community 48"
Cohesion: 0.13
Nodes (7): DitaOtConfig, DitaOtWrapper, execFileAsync, parseTranstypes(), PublishOptions, PublishProgress, PublishResult

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (14): buildImageElement(), buildImageSnippet(), computeImageHref(), copyImageIntoDirectory(), IMAGE_EXTENSIONS, ImageSizeAttrs, insertImageCommand(), isEligibleDocument() (+6 more)

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (4): isNameBoundary(), isWs(), ParseError, Scanner

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (23): applySettings(), build(), clipboardParser(), clipboardSerializer(), fixMapSelection(), flush(), freshBuild(), openRowTarget() (+15 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (20): applyTextEdits(), changedSize(), editedSpan(), enclosing(), keepMarks(), readingOf(), sameReading(), sourceChange() (+12 more)

### Community 53 - "Community 53"
Cohesion: 0.11
Nodes (12): RngValidationService, ROOT_TO_SCHEMA, SalveConvertResult, SalveGrammar, SalveModule, SalveValidationError, SalveWalker, SaxesAttribute (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.19
Nodes (20): activeDitavalChangedEmitter, computeFilterSuffix(), displayPreview(), findMainHtmlFile(), followActiveDitavalMove(), generateHtml5OutputIfNeeded(), getActiveDitavalPath(), getAndValidateFileUri() (+12 more)

### Community 55 - "Community 55"
Cohesion: 0.18
Nodes (2): Builder, summary()

### Community 56 - "Community 56"
Cohesion: 0.10
Nodes (17): { compileGrammars }, esbuild, esbuildProblemMatcherPlugin, minify, sharedOptions, sourcemap, esbuild, minify (+9 more)

### Community 57 - "Community 57"
Cohesion: 0.13
Nodes (16): basename(), booleanRule(), cell(), coderefRule(), draftRule(), flagCss(), hazardRule(), imageRule() (+8 more)

### Community 58 - "Community 58"
Cohesion: 0.14
Nodes (3): formatError(), Semaphore, ValidationPipeline

### Community 59 - "Community 59"
Cohesion: 0.17
Nodes (1): Logger

### Community 60 - "Community 60"
Cohesion: 0.17
Nodes (19): PropertyField, PropertyGroup, closed, control(), describe(), el(), GROUP_LABEL, GROUPS (+11 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (2): childPos(), RelTableCommands

### Community 62 - "Community 62"
Cohesion: 0.12
Nodes (4): BreakerWrappedProvider, ILLMProvider, isAbortError(), LLMRouterService

### Community 63 - "Community 63"
Cohesion: 0.14
Nodes (1): DitaPreviewPanel

### Community 64 - "Community 64"
Cohesion: 0.12
Nodes (16): CACHE_DEFAULTS, CONFIG_KEYS, DEBOUNCE_CONSTANTS, DITA_ELEMENTS, DITA_EXTENSIONS, DITA_OT, isDitaContentPath(), isDitaContentUri() (+8 more)

### Community 65 - "Community 65"
Cohesion: 0.14
Nodes (4): ImageResizeContext, imageResizing(), ImageCommands, resizedImageSize()

### Community 66 - "Community 66"
Cohesion: 0.15
Nodes (13): AiSettingsPanel, buildSettingsHtml(), configureAICommand(), describeProviders(), KeySource, Mode, MODE_DESCRIPTIONS, PageMessage (+5 more)

### Community 67 - "Community 67"
Cohesion: 0.19
Nodes (1): MapCommands

### Community 68 - "Community 68"
Cohesion: 0.14
Nodes (4): editRowLabel(), MapCellView, MapRowView, NodeView

### Community 69 - "Community 69"
Cohesion: 0.16
Nodes (13): ContentModel, DITA_CONTENT_MODELS, parseElementTree(), validateContentModel(), validateElement(), XmlElement, buildLineOffsets(), computeFoldingRanges() (+5 more)

### Community 70 - "Community 70"
Cohesion: 0.16
Nodes (3): buildPropertiesHtml(), isDitaDocument(), PropertiesViewProvider

### Community 71 - "Community 71"
Cohesion: 0.20
Nodes (9): DitaExplorerProvider, ICON_MAP, detectMapType(), extractAttribute(), findAllMapsInWorkspace(), MapNode, parseMapHierarchy(), parseReferences() (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.16
Nodes (8): ItemKind, KeySpaceItem, KeySpaceViewProvider, KeyDefinition, KeySpace, KeyUsage, offsetToPosition(), scanKeyUsages()

### Community 73 - "Community 73"
Cohesion: 0.18
Nodes (5): BUILD_STAGE_PATTERNS, disposeDitaOtOutputChannel(), DitaOtOutputChannel, getDitaOtOutputChannel(), LOG_LEVEL_PATTERNS

### Community 74 - "Community 74"
Cohesion: 0.16
Nodes (11): equationNumberRule(), figgroupRule(), figRule(), linklistRule(), lqRule(), menucascadeRule(), objectRule(), rows() (+3 more)

### Community 75 - "Community 75"
Cohesion: 0.18
Nodes (3): fnRule(), renderElement(), Renderer

### Community 76 - "Community 76"
Cohesion: 0.23
Nodes (11): BODY_TAG, buildExtractedTopicContent(), detectNewTopicType(), extractTopicFromSectionCommand(), NewTopicType, slugify(), buildExtractedSection(), ExtractedSection (+3 more)

### Community 77 - "Community 77"
Cohesion: 0.24
Nodes (16): commandItem(), COMMON_BLOCKS, COMMON_INLINE, contextMenu(), domainOf(), elementItems(), groupByDomain(), imageItems() (+8 more)

### Community 78 - "Community 78"
Cohesion: 0.14
Nodes (15): rebase(), resolvedAttributes(), reuseCopy(), uriPath(), buildFragment(), copyOf(), LIB, LIB_SRC (+7 more)

### Community 79 - "Community 79"
Cohesion: 0.15
Nodes (13): configManager, ConfigurationChangeEvent, ConfigurationChangeListener, ConfigurationErrorHandler, DEFAULT_CONFIG, DitaCraftConfiguration, getConfigManager(), LogLevelType (+5 more)

### Community 80 - "Community 80"
Cohesion: 0.18
Nodes (10): disposeDitaOtDiagnostics(), DitaOtDiagnostics, DitaOtError, ERROR_PATTERNS, getDitaOtDiagnostics(), isErrorLine(), mapSeverity(), ParsedDitaOtOutput (+2 more)

### Community 81 - "Community 81"
Cohesion: 0.20
Nodes (10): BatchMetadataResponse, BatchMetadataSkippedFile, batchUpdateMetadataCommand(), describeBatchLabel(), KNOWN_PROFILING_ATTRIBUTES, promptForAttribute(), resolveSelectedFileItems(), summarizeSkipped() (+2 more)

### Community 82 - "Community 82"
Cohesion: 0.18
Nodes (4): DiagnosticItem, DiagnosticsViewProvider, DITA_SOURCES, GroupMode

### Community 83 - "Community 83"
Cohesion: 0.18
Nodes (5): createCustomRateLimiter(), createRateLimiter(), RATE_LIMIT_DEFAULTS, RateLimitConfig, RateLimiter

### Community 84 - "Community 84"
Cohesion: 0.16
Nodes (11): at(), coverage(), fill(), fs, path, { PNG }, { Potrace }, REPO (+3 more)

### Community 85 - "Community 85"
Cohesion: 0.20
Nodes (5): alignToReference(), applySpanEdit(), minimalEdit(), SpanEdit, EditSync

### Community 86 - "Community 86"
Cohesion: 0.28
Nodes (1): MapContexts

### Community 87 - "Community 87"
Cohesion: 0.19
Nodes (14): folderReadme(), fs, GRAPHIFY_CLI, main(), OUT_DIR, path, publishOutputs(), rebuildGraph() (+6 more)

### Community 88 - "Community 88"
Cohesion: 0.27
Nodes (12): buildWorkspaceEdit(), confirmWorkspaceEdit(), describeFileChanges(), describeSearchLabel(), FIND_OPTIONS, FindOption, findReplaceInFilesCommand(), FindReplaceResponse (+4 more)

### Community 89 - "Community 89"
Cohesion: 0.21
Nodes (11): cachedRules, clearCustomRulesCache(), CompiledRule, CustomRuleDefinition, CustomRulesFile, detectFileType(), isSafeRegex(), loadRules() (+3 more)

### Community 90 - "Community 90"
Cohesion: 0.26
Nodes (1): MapVisualizerPanel

### Community 91 - "Community 91"
Cohesion: 0.32
Nodes (10): createEnhancedError(), fireAndForget(), FireAndForgetOptions, formatDitaError(), formatErrorMessage(), getErrorMessage(), isFileNotFoundError(), Thenable (+2 more)

### Community 92 - "Community 92"
Cohesion: 0.19
Nodes (7): diagnosticSeverityLabel(), DiagnosticsStore, globToRegex(), matchGlob(), QueryOptions, StoredDiagnostic, StoredDiagnostics

### Community 93 - "Community 93"
Cohesion: 0.26
Nodes (1): ConfigurationManager

### Community 94 - "Community 94"
Cohesion: 0.21
Nodes (10): dropRow(), dropTarget(), foldDecoration(), foldPaths(), isFolded(), moveRow(), restoreFolds(), RowDrag (+2 more)

### Community 95 - "Community 95"
Cohesion: 0.29
Nodes (5): disposeProviderFactory(), getProviderFactory(), isProviderFactoryInitialized(), ProviderFactory, ProviderFactoryOptions

### Community 96 - "Community 96"
Cohesion: 0.23
Nodes (12): button(), currentElement(), markActive(), markButton(), placeReuseBar(), renderMapToolbar(), renderToolbar(), selectedReuse() (+4 more)

### Community 97 - "Community 97"
Cohesion: 0.32
Nodes (3): AIServiceOrchestrator, extractXml(), tokenToSignal()

### Community 98 - "Community 98"
Cohesion: 0.35
Nodes (3): GrammarRegistry, labelOf(), versionFor()

### Community 99 - "Community 99"
Cohesion: 0.20
Nodes (2): AICallMetric, MetricsCollector

### Community 100 - "Community 100"
Cohesion: 0.25
Nodes (8): foreignRule(), generatedHeader(), mergeConrefAttrs(), noteRule(), preRule(), sectionRule(), titleRule(), topicRule()

### Community 101 - "Community 101"
Cohesion: 0.25
Nodes (10): findOkfRs(), fs, linkReadmeFromIndex(), main(), OUT_DIR, path, ROOT, run() (+2 more)

### Community 102 - "Community 102"
Cohesion: 0.33
Nodes (7): movedPath(), PathMove, pathSettingValue(), resolvePathSetting(), followPathSettings(), PATH_SETTINGS, PathSetting

### Community 103 - "Community 103"
Cohesion: 0.38
Nodes (6): buildCalsTableSnippet(), buildSimpleTableSnippet(), insertTableCommand(), isEligibleDocument(), promptForCount(), TableType

### Community 104 - "Community 104"
Cohesion: 0.33
Nodes (9): buildSymbolTree(), extractTextContent(), extractWorkspaceSymbols(), handleDocumentSymbol(), handleWorkspaceSymbol(), OUTLINE_ELEMENTS, ParsedTag, parseTags() (+1 more)

### Community 105 - "Community 105"
Cohesion: 0.24
Nodes (3): anthropicFailure(), AnthropicLLMProvider, ILLMProvider

### Community 106 - "Community 106"
Cohesion: 0.24
Nodes (2): ILLMProvider, OllamaLLMProvider

### Community 107 - "Community 107"
Cohesion: 0.24
Nodes (3): ILLMProvider, openaiFailure(), OpenAILLMProvider

### Community 108 - "Community 108"
Cohesion: 0.36
Nodes (7): pathExists(), substituteWorkspaceFolderVar(), loadTemplateRaw(), renderTemplate(), resolveTemplatesDir(), substitutePlaceholders(), TemplateVariables

### Community 109 - "Community 109"
Cohesion: 0.25
Nodes (2): ElementIndex, isInterElementWhitespace()

### Community 110 - "Community 110"
Cohesion: 0.33
Nodes (2): CircuitBreaker, State

### Community 111 - "Community 111"
Cohesion: 0.36
Nodes (7): createDebounced(), createDebouncedMap(), createDebouncedSet(), Debounced, DebouncedMap, DebouncedSet, Disposable

### Community 112 - "Community 112"
Cohesion: 0.43
Nodes (7): escapeRegExp(), findClosingTag(), findOpeningTag(), findTagAtOffset(), handleLinkedEditingRange(), TagAtOffset, TagNameRange

### Community 113 - "Community 113"
Cohesion: 0.36
Nodes (1): WorkspaceIndex

### Community 114 - "Community 114"
Cohesion: 0.32
Nodes (2): CopilotLLMProvider, ILLMProvider

### Community 115 - "Community 115"
Cohesion: 0.36
Nodes (1): DtdResolver

### Community 116 - "Community 116"
Cohesion: 0.33
Nodes (5): inlineConrefCommand(), InlineConrefResponse, LspTextEdit, LspWorkspaceEdit, getLanguageClient()

### Community 117 - "Community 117"
Cohesion: 0.38
Nodes (1): LinkCommands

### Community 118 - "Community 118"
Cohesion: 0.43
Nodes (2): AICompletionProvider, registerAICompletionProvider()

### Community 119 - "Community 119"
Cohesion: 0.48
Nodes (5): escapeRegExp(), findElementById(), navigateToElement(), registerElementNavigationCommand(), showDocumentAtLine()

### Community 120 - "Community 120"
Cohesion: 0.40
Nodes (1): DitaFileDecorationProvider

### Community 121 - "Community 121"
Cohesion: 0.40
Nodes (4): PaneState, SOURCE, state(), waitFor()

### Community 122 - "Community 122"
Cohesion: 0.33
Nodes (5): extensionRoot, initializedMsg, initMsg, server, serverScript

### Community 123 - "Community 123"
Cohesion: 0.50
Nodes (4): EditorState, open(), SOURCE, waitFor()

### Community 124 - "Community 124"
Cohesion: 0.50
Nodes (3): fs, path, vscode

### Community 125 - "Community 125"
Cohesion: 0.67
Nodes (3): PreviewState, state(), waitFor()

### Community 126 - "Community 126"
Cohesion: 0.50
Nodes (1): vscode

## Knowledge Gaps
- **587 isolated node(s):** `esbuild`, `minify`, `sourcemap`, `sharedOptions`, `esbuild` (+582 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (2 nodes): `IKeySpaceService`, `KeySpaceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `KeySpaceResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `TableCommands`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `DitaCommands`, `offsetOf()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `DitaLinkProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `Builder`, `summary()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `Logger`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `childPos()`, `RelTableCommands`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `DitaPreviewPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `MapCommands`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `MapContexts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `MapVisualizerPanel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 93`** (1 nodes): `ConfigurationManager`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (2 nodes): `AICallMetric`, `MetricsCollector`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (2 nodes): `ILLMProvider`, `OllamaLLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 109`** (2 nodes): `ElementIndex`, `isInterElementWhitespace()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (2 nodes): `CircuitBreaker`, `State`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (1 nodes): `WorkspaceIndex`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (2 nodes): `CopilotLLMProvider`, `ILLMProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `DtdResolver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `LinkCommands`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (2 nodes): `AICompletionProvider`, `registerAICompletionProvider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `DitaFileDecorationProvider`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `vscode`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KeySpaceService` connect `Community 13` to `Community 20`, `Community 3`, `Community 8`, `Community 1`, `Community 47`, `Community 5`, `Community 4`, `Community 7`, `Community 37`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `VisualPreviewPanel` connect `Community 14` to `Community 54`, `Community 10`, `Community 38`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `EditorSession` connect `Community 9` to `Community 10`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `esbuild`, `minify`, `sourcemap` to the rest of the system?**
  _587 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.030416951469583047 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03454070201643017 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.049900990099009904 - nodes in this community are weakly interconnected._