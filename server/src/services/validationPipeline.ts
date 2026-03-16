/**
 * Validation Pipeline.
 * Orchestrates all DITA validation phases in a single place,
 * extracted from the monolithic diagnostic handler in server.ts.
 *
 * Phase 2.1: Per-phase result caching — skips re-execution of unchanged phases.
 * Cache is keyed on (documentUri, documentVersion, phase, settingsHash).
 * External events (text edits, saves, map changes, settings changes) invalidate
 * specific phase groups via public invalidation methods.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { CancellationToken } from 'vscode-languageserver';

import { DitaCraftSettings } from '../settings';
import { normalizeFsPath } from '../utils/textUtils';
import { t } from '../utils/i18n';
import { validateDITADocument } from '../features/validation';
import { validateContentModel } from '../features/contentModelValidation';
import { validateCrossReferences } from '../features/crossRefValidation';
import { validateDitaRules } from '../features/ditaRulesValidator';
import { validateProfilingAttributes } from '../features/profilingValidation';
import { detectCircularReferences } from '../features/circularRefDetection';
import { detectCrossFileDuplicateIds, createUnusedTopicDiagnostic } from '../features/workspaceValidation';
import { validateCustomRules } from '../features/customRulesValidator';
import { detectDitaVersion } from '../utils/ditaVersionDetector';
import { CatalogValidationService } from './catalogValidationService';
import { RngValidationService } from './rngValidationService';
import { KeySpaceService } from './keySpaceService';
import { SubjectSchemeService } from './subjectSchemeService';

/** External state passed from the server for workspace-level checks. */
export interface WorkspaceContext {
    rootIdIndex: Map<string, string[]>;
    unusedTopicPaths: Set<string>;
}

/** Summary of validation results for the manual validate command response. */
export interface ValidationSummary {
    errors: number;
    warnings: number;
    infos: number;
}

// ---------------------------------------------------------------------------
// Phase cache types
// ---------------------------------------------------------------------------

/** Numeric phase identifiers for cache keying and invalidation groups. */
export enum ValidationPhase {
    XmlStructureId = 1,  // Phases 1-3 (combined in validateDITADocument)
    ContentModel = 4,
    Schema = 5,          // DTD or RNG
    CrossRef = 6,
    SubjectScheme = 7,   // Not cached (has side effects)
    Profiling = 8,
    DitaRules = 9,
    CircularRef = 10,
    Workspace = 11,      // Not cached (depends on external indices)
}

interface PhaseCacheEntry {
    diagnostics: Diagnostic[];
    documentVersion: number;
    settingsHash: string;
    timestamp: number;
}

/** Phases invalidated by a text edit (content changed). */
const TEXT_EDIT_PHASES: ValidationPhase[] = [
    ValidationPhase.XmlStructureId,
    ValidationPhase.ContentModel,
    ValidationPhase.Schema,
    ValidationPhase.DitaRules,
];

/** Phases invalidated by a file save (file I/O dependent). */
const FILE_SAVE_PHASES: ValidationPhase[] = [
    ValidationPhase.CrossRef,
    ValidationPhase.CircularRef,
];

/** Phases invalidated by a map file change (cross-file scope). */
const MAP_CHANGE_PHASES: ValidationPhase[] = [
    ValidationPhase.CrossRef,
    ValidationPhase.SubjectScheme,
    ValidationPhase.Profiling,
];

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

/** Maps user-facing severity names to LSP DiagnosticSeverity values. */
const SEVERITY_MAP: Record<string, DiagnosticSeverity> = {
    error: DiagnosticSeverity.Error,
    warning: DiagnosticSeverity.Warning,
    information: DiagnosticSeverity.Information,
    hint: DiagnosticSeverity.Hint,
};

// ---------------------------------------------------------------------------
// Comment-based suppression (Phase 5.2)
// ---------------------------------------------------------------------------

/** Regex matching ditacraft suppression comments. */
const SUPPRESS_COMMENT_RE = /<!--\s*ditacraft-(disable|enable|disable-file)\s+([\w-]+(?:\s+[\w-]+)*)\s*-->/g;

interface SuppressionRange {
    code: string;
    startLine: number;
    endLine: number; // Infinity if never re-enabled
}

interface SuppressionState {
    fileSuppressed: Set<string>;
    ranges: SuppressionRange[];
}

/**
 * Parse suppression comments from document text and build a structure
 * that can quickly test whether a diagnostic at a given line is suppressed.
 *
 * Supported forms:
 *   <!-- ditacraft-disable CODE1 CODE2 -->   starts suppression for CODE(s)
 *   <!-- ditacraft-enable CODE1 CODE2 -->    ends suppression for CODE(s)
 *   <!-- ditacraft-disable-file CODE1 -->    suppresses CODE(s) for entire file
 */
function parseSuppressions(text: string): SuppressionState {
    const fileSuppressed = new Set<string>();
    const ranges: SuppressionRange[] = [];

    // Pre-compute line start offsets for binary-search offset→line mapping
    // Handles \n, \r\n, and standalone \r (matching LSP line counting)
    const lineStarts: number[] = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\r') {
            if (i + 1 < text.length && text[i + 1] === '\n') {
                i++; // Skip \n in \r\n pair
            }
            lineStarts.push(i + 1);
        } else if (text[i] === '\n') {
            lineStarts.push(i + 1);
        }
    }

    function offsetToLine(offset: number): number {
        let lo = 0, hi = lineStarts.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
        }
        return lo;
    }

    // Collect all suppression comments
    let match: RegExpExecArray | null;
    SUPPRESS_COMMENT_RE.lastIndex = 0; // Reset global regex state
    // Track open disable directives: code → startLine
    const openDisables = new Map<string, number>();

    while ((match = SUPPRESS_COMMENT_RE.exec(text)) !== null) {
        const action = match[1]; // 'disable' | 'enable' | 'disable-file'
        const codes = match[2].split(/\s+/).filter(Boolean);
        const line = offsetToLine(match.index);

        if (action === 'disable-file') {
            for (const code of codes) fileSuppressed.add(code);
        } else if (action === 'disable') {
            for (const code of codes) {
                if (!openDisables.has(code)) {
                    openDisables.set(code, line);
                }
            }
        } else { // enable
            for (const code of codes) {
                const startLine = openDisables.get(code);
                if (startLine !== undefined) {
                    ranges.push({ code, startLine, endLine: line });
                    openDisables.delete(code);
                }
            }
        }
    }

    // Close any unclosed disable directives (suppress to end of file)
    for (const [code, startLine] of openDisables) {
        ranges.push({ code, startLine, endLine: Infinity });
    }

    return { fileSuppressed, ranges };
}

/**
 * Filter diagnostics based on comment-based suppression directives.
 */
function applySuppressions(diagnostics: Diagnostic[], text: string): Diagnostic[] {
    const state = parseSuppressions(text);
    if (state.fileSuppressed.size === 0 && state.ranges.length === 0) {
        return diagnostics;
    }

    return diagnostics.filter(d => {
        const code = typeof d.code === 'string' ? d.code : String(d.code ?? '');
        if (!code) return true;

        // File-level suppression
        if (state.fileSuppressed.has(code)) return false;

        // Range-based suppression — check if diagnostic start line falls in any range
        // startLine is inclusive (disable comment line), endLine is exclusive (enable comment line)
        const line = d.range.start.line;
        for (const r of state.ranges) {
            if (r.code === code && line >= r.startLine && line < r.endLine) return false;
        }

        return true;
    });
}

/** Default timeout per async validation phase (ms). */
const DEFAULT_PHASE_TIMEOUT_MS = 5000;

/** Maximum concurrent pipeline executions. */
const MAX_CONCURRENT_VALIDATIONS = 5;

/** Maximum cache entries before eviction. ~50 docs x 10 phases. */
const MAX_CACHE_ENTRIES = 500;

/** Cache entries older than this are treated as misses (ms). */
const CACHE_TTL_MS = 5 * 60_000;

/**
 * Run a promise with a timeout. Returns the promise result or the fallback
 * if it times out. Logs a warning on timeout.
 */
async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    phaseName: string,
    fallback: T,
    log: (msg: string) => void,
    token?: CancellationToken,
): Promise<T> {
    if (token?.isCancellationRequested) return fallback;
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<T>((resolve) => {
        timer = setTimeout(() => {
            log(`[validation] ${phaseName} timed out after ${timeoutMs}ms — skipped`);
            resolve(fallback);
        }, timeoutMs);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timer!);
    }
}

/**
 * Simple counting semaphore to limit concurrent pipeline executions.
 * Safe because JavaScript is single-threaded; queue operations are atomic.
 */
class Semaphore {
    private current = 0;
    private readonly queue: Array<() => void> = [];

    constructor(private readonly max: number) {}

    async acquire(): Promise<void> {
        if (this.current < this.max) {
            this.current++;
            return;
        }
        return new Promise<void>((resolve) => {
            this.queue.push(() => {
                this.current++;
                resolve();
            });
        });
    }

    release(): void {
        this.current--;
        const next = this.queue.shift();
        if (next) next();
    }
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/**
 * Orchestrates all DITA validation phases for a single document.
 */
export class ValidationPipeline {
    private readonly log: (msg: string) => void;
    private readonly semaphore = new Semaphore(MAX_CONCURRENT_VALIDATIONS);
    private readonly phaseCache = new Map<string, PhaseCacheEntry>();

    constructor(
        private readonly catalogValidation: CatalogValidationService,
        private readonly rngValidation: RngValidationService,
        private readonly subjectSchemeService: SubjectSchemeService,
        log?: (msg: string) => void,
    ) {
        this.log = log ?? (() => {});
    }

    // -----------------------------------------------------------------------
    // Cache helpers
    // -----------------------------------------------------------------------

    private cacheKey(uri: string, phase: ValidationPhase): string {
        return `${uri}|${phase}`;
    }

    /**
     * djb2 hash of serialized settings — fast, deterministic, sufficient for change detection.
     */
    private static hashSettings(settings: DitaCraftSettings): string {
        const str = JSON.stringify(settings);
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
        }
        return hash.toString(36);
    }

    /**
     * Look up cached diagnostics for a phase.
     * @param checkVersion  When false, skip document version comparison
     *   (used for I/O-dependent phases that are invalidated on save, not on edit).
     */
    private getCached(
        uri: string, phase: ValidationPhase,
        documentVersion: number, settingsHash: string,
        checkVersion = true,
    ): Diagnostic[] | null {
        const key = this.cacheKey(uri, phase);
        const entry = this.phaseCache.get(key);
        if (!entry) return null;
        if (checkVersion && entry.documentVersion !== documentVersion) return null;
        if (entry.settingsHash !== settingsHash) return null;
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            this.phaseCache.delete(key);
            return null;
        }
        return entry.diagnostics;
    }

    private setCache(
        uri: string, phase: ValidationPhase,
        documentVersion: number, settingsHash: string,
        diagnostics: Diagnostic[],
    ): void {
        if (this.phaseCache.size >= MAX_CACHE_ENTRIES) {
            this.evictOldest();
        }
        this.phaseCache.set(this.cacheKey(uri, phase), {
            diagnostics,
            documentVersion,
            settingsHash,
            timestamp: Date.now(),
        });
    }

    private evictOldest(): void {
        const entries = [...this.phaseCache.entries()]
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = Math.max(1, Math.floor(entries.length * 0.2));
        for (let i = 0; i < toRemove; i++) {
            this.phaseCache.delete(entries[i][0]);
        }
    }

    // -----------------------------------------------------------------------
    // Cache invalidation (called from server.ts event handlers)
    // -----------------------------------------------------------------------

    /** Invalidate specific phases for a single document. */
    public invalidatePhases(uri: string, phases: ValidationPhase[]): void {
        for (const phase of phases) {
            this.phaseCache.delete(this.cacheKey(uri, phase));
        }
    }

    /** Called on text edit: invalidate content-dependent phases for this document. */
    public invalidateForTextEdit(uri: string): void {
        this.invalidatePhases(uri, TEXT_EDIT_PHASES);
    }

    /** Called on file save: invalidate I/O-dependent phases for this document. */
    public invalidateForFileSave(uri: string): void {
        this.invalidatePhases(uri, FILE_SAVE_PHASES);
    }

    /** Called on map file change: invalidate map-dependent phases for ALL documents. */
    public invalidateForMapChange(): void {
        const mapPhaseSet = new Set(MAP_CHANGE_PHASES as number[]);
        for (const key of [...this.phaseCache.keys()]) {
            const phase = parseInt(key.split('|').pop()!, 10);
            if (mapPhaseSet.has(phase)) {
                this.phaseCache.delete(key);
            }
        }
    }

    /** Called on settings change: clear entire cache. */
    public invalidateAll(): void {
        this.phaseCache.clear();
    }

    /** Called on document close: remove all cache entries for this URI. */
    public invalidateForDocument(uri: string): void {
        const prefix = uri + '|';
        for (const key of [...this.phaseCache.keys()]) {
            if (key.startsWith(prefix)) {
                this.phaseCache.delete(key);
            }
        }
    }

    // -----------------------------------------------------------------------
    // Pipeline execution
    // -----------------------------------------------------------------------

    /**
     * Run all validation phases and return collected diagnostics.
     * Each phase is isolated so a failure in one doesn't discard results from others.
     */
    async validate(
        document: TextDocument,
        settings: DitaCraftSettings,
        keySpaceService: KeySpaceService | undefined,
        workspace: WorkspaceContext,
        token?: CancellationToken,
        phaseTimeoutMs: number = DEFAULT_PHASE_TIMEOUT_MS,
    ): Promise<Diagnostic[]> {
        await this.semaphore.acquire();
        try {
            return await this.runPipeline(document, settings, keySpaceService, workspace, token, phaseTimeoutMs);
        } finally {
            this.semaphore.release();
        }
    }

    private async runPipeline(
        document: TextDocument,
        settings: DitaCraftSettings,
        keySpaceService: KeySpaceService | undefined,
        workspace: WorkspaceContext,
        token: CancellationToken | undefined,
        phaseTimeoutMs: number,
    ): Promise<Diagnostic[]> {
        const startTime = Date.now();
        const text = document.getText();
        const uri = document.uri;
        const docVersion = document.version;
        const filePath = URI.parse(uri).fsPath;
        const diagnostics: Diagnostic[] = [];
        const timings: Record<string, number> = {};
        const settingsHash = ValidationPipeline.hashSettings(settings);
        let cacheHits = 0;

        const timePhase = <T>(name: string, fn: () => T): T => {
            const t0 = Date.now();
            const result = fn();
            timings[name] = Date.now() - t0;
            return result;
        };

        const timePhaseAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
            const t0 = Date.now();
            const result = await fn();
            timings[name] = Date.now() - t0;
            return result;
        };

        // Large file detection — skip heavy phases for performance
        const fileSizeBytes = Buffer.byteLength(text, 'utf-8');
        const thresholdKB = settings.largeFileThresholdKB ?? 500;
        const isLargeFile = thresholdKB > 0 && fileSizeBytes >= thresholdKB * 1024;

        // Phase 1-3: XML well-formedness, DITA structure, ID validation
        if (token?.isCancellationRequested) return diagnostics;
        const cachedBase = this.getCached(uri, ValidationPhase.XmlStructureId, docVersion, settingsHash);
        if (cachedBase) {
            diagnostics.push(...cachedBase);
            cacheHits++;
        } else {
            try {
                const baseDiags = timePhase('XML+Structure+ID', () => validateDITADocument(document, settings));
                diagnostics.push(...baseDiags);
                this.setCache(uri, ValidationPhase.XmlStructureId, docVersion, settingsHash, baseDiags);
            } catch (e) { this.log(`[validation] base validation failed: ${e}`); }
        }

        if (token?.isCancellationRequested) return diagnostics;

        // Phase 4: Content model validation (skip when TypesXML DTD covers it)
        const useRng = this.rngValidation.isAvailable && settings.schemaFormat === 'rng';
        const useTypesXml = !useRng && this.catalogValidation.isAvailable && settings.validationEngine === 'typesxml';

        if (!useTypesXml) {
            const cachedCm = this.getCached(uri, ValidationPhase.ContentModel, docVersion, settingsHash);
            if (cachedCm) {
                diagnostics.push(...cachedCm);
                cacheHits++;
            } else {
                try {
                    const cmDiags = timePhase('ContentModel', () => validateContentModel(text));
                    diagnostics.push(...cmDiags);
                    this.setCache(uri, ValidationPhase.ContentModel, docVersion, settingsHash, cmDiags);
                } catch (e) { this.log(`[validation] content model validation failed: ${e}`); }
            }
        }

        if (token?.isCancellationRequested) return diagnostics;

        // Phase 5: Schema validation — DTD or RNG (mutually exclusive)
        if (useTypesXml) {
            const cachedDtd = this.getCached(uri, ValidationPhase.Schema, docVersion, settingsHash);
            if (cachedDtd) {
                diagnostics.push(...cachedDtd);
                cacheHits++;
            } else {
                try {
                    const dtdDiags = timePhase('DTD', () => {
                        const existingErrorLines = new Set(
                            diagnostics
                                .filter(d => d.code === 'DITA-XML-001')
                                .map(d => d.range.start.line)
                        );
                        const result: Diagnostic[] = [];
                        for (const diag of this.catalogValidation.validate(text)) {
                            if (!existingErrorLines.has(diag.range.start.line)) {
                                result.push(diag);
                            }
                        }
                        return result;
                    });
                    diagnostics.push(...dtdDiags);
                    this.setCache(uri, ValidationPhase.Schema, docVersion, settingsHash, dtdDiags);
                } catch (e) { this.log(`[validation] DTD validation failed: ${e}`); }
            }
        }

        if (useRng) {
            const cachedRng = this.getCached(uri, ValidationPhase.Schema, docVersion, settingsHash);
            if (cachedRng) {
                diagnostics.push(...cachedRng);
                cacheHits++;
            } else {
                try {
                    if (settings.rngSchemaPath) {
                        this.rngValidation.setSchemaBasePath(settings.rngSchemaPath);
                    }
                    const rngDiags = await timePhaseAsync('RNG', () =>
                        withTimeout(
                            this.rngValidation.validate(text),
                            phaseTimeoutMs, 'RNG', [] as Diagnostic[], this.log, token,
                        )
                    );
                    diagnostics.push(...rngDiags);
                    this.setCache(uri, ValidationPhase.Schema, docVersion, settingsHash, rngDiags);
                } catch (e) { this.log(`[validation] RNG validation failed: ${e}`); }
            }
        }

        if (token?.isCancellationRequested) return diagnostics;

        // Phases 6, 9, 10: Cross-refs, DITA rules, and circular refs are independent — run in parallel
        // Skip these heavy phases for large files
        if (isLargeFile) {
            diagnostics.push({
                severity: DiagnosticSeverity.Information,
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                message: t('largeFile.skipped', String(Math.round(fileSizeBytes / 1024)), String(thresholdKB)),
                code: 'DITA-PERF-001',
                source: 'ditacraft',
            });
        }

        const parallelPhases: Promise<void>[] = [];

        // Phase 6: Cross-reference validation (I/O-dependent — skip version check)
        if (settings.crossRefValidationEnabled !== false && !isLargeFile) {
            parallelPhases.push((async () => {
                if (token?.isCancellationRequested) return;
                const cached = this.getCached(uri, ValidationPhase.CrossRef, docVersion, settingsHash, false);
                if (cached) {
                    diagnostics.push(...cached);
                    cacheHits++;
                    return;
                }
                try {
                    const xrefDiags = await timePhaseAsync('CrossRef', () =>
                        withTimeout(
                            validateCrossReferences(text, uri, keySpaceService, settings.maxNumberOfProblems),
                            phaseTimeoutMs, 'CrossRef', [] as Diagnostic[], this.log, token,
                        )
                    );
                    diagnostics.push(...xrefDiags);
                    this.setCache(uri, ValidationPhase.CrossRef, docVersion, settingsHash, xrefDiags);
                } catch (e) { this.log(`[validation] cross-ref validation failed: ${e}`); }
            })());
        }

        // Phase 9: Schematron-equivalent DITA rules (sync but independent)
        if (settings.ditaRulesEnabled !== false && !isLargeFile) {
            parallelPhases.push((async () => {
                if (token?.isCancellationRequested) return;
                const cached = this.getCached(uri, ValidationPhase.DitaRules, docVersion, settingsHash);
                if (cached) {
                    diagnostics.push(...cached);
                    cacheHits++;
                    return;
                }
                try {
                    const rulesDiags = timePhase('DitaRules', () => {
                        const ditaVersion = settings.ditaVersion && settings.ditaVersion !== 'auto'
                            ? settings.ditaVersion
                            : detectDitaVersion(text);
                        return validateDitaRules(text, {
                            enabled: true,
                            categories: settings.ditaRulesCategories ?? ['mandatory', 'recommendation', 'authoring', 'accessibility'],
                            ditaVersion,
                        });
                    });
                    diagnostics.push(...rulesDiags);
                    this.setCache(uri, ValidationPhase.DitaRules, docVersion, settingsHash, rulesDiags);
                } catch (e) { this.log(`[validation] DITA rules failed: ${e}`); }
            })());
        }

        // Phase 10: Circular reference detection (I/O-dependent — skip version check)
        if (settings.crossRefValidationEnabled !== false && !isLargeFile) {
            parallelPhases.push((async () => {
                if (token?.isCancellationRequested) return;
                const cached = this.getCached(uri, ValidationPhase.CircularRef, docVersion, settingsHash, false);
                if (cached) {
                    diagnostics.push(...cached);
                    cacheHits++;
                    return;
                }
                try {
                    const cycleDiags = await timePhaseAsync('CircularRef', () =>
                        withTimeout(
                            detectCircularReferences(text, uri),
                            phaseTimeoutMs, 'CircularRef', [] as Diagnostic[], this.log, token,
                        )
                    );
                    diagnostics.push(...cycleDiags);
                    this.setCache(uri, ValidationPhase.CircularRef, docVersion, settingsHash, cycleDiags);
                } catch (e) { this.log(`[validation] circular ref detection failed: ${e}`); }
            })());
        }

        await Promise.all(parallelPhases);

        if (token?.isCancellationRequested) return diagnostics;

        // Phase 7: Register subject scheme maps (must run before profiling, skip for large files)
        // Not cached — has side effects (registerSchemes mutates service state)
        if (keySpaceService && !isLargeFile) {
            try {
                await timePhaseAsync('SubjectScheme', async () => {
                    const schemePaths = await withTimeout(
                        keySpaceService.getSubjectSchemePaths(filePath),
                        phaseTimeoutMs, 'SubjectScheme', [] as string[], this.log, token,
                    );
                    this.subjectSchemeService.registerSchemes(schemePaths);
                });
            } catch (e) { this.log(`[validation] subject scheme registration failed: ${e}`); }
        }

        // Phase 8: Profiling attribute validation (depends on phase 7, skip for large files)
        if (settings.subjectSchemeValidationEnabled !== false && !isLargeFile) {
            const cachedProf = this.getCached(uri, ValidationPhase.Profiling, docVersion, settingsHash);
            if (cachedProf) {
                diagnostics.push(...cachedProf);
                cacheHits++;
            } else {
                try {
                    const profDiags = timePhase('Profiling', () =>
                        validateProfilingAttributes(text, this.subjectSchemeService, settings.maxNumberOfProblems)
                    );
                    diagnostics.push(...profDiags);
                    this.setCache(uri, ValidationPhase.Profiling, docVersion, settingsHash, profDiags);
                } catch (e) { this.log(`[validation] profiling validation failed: ${e}`); }
            }
        }

        if (token?.isCancellationRequested) return diagnostics;

        // Phase 11: Workspace-level checks (skip for large files)
        // Not cached — depends on external indices (rootIdIndex, unusedTopicPaths)
        if (!isLargeFile) try {
            if (workspace.rootIdIndex.size > 0) {
                diagnostics.push(...detectCrossFileDuplicateIds(text, filePath, workspace.rootIdIndex));
            }

            if (workspace.unusedTopicPaths.size > 0) {
                const normalizedPath = normalizeFsPath(filePath);
                if (workspace.unusedTopicPaths.has(normalizedPath)) {
                    diagnostics.push(createUnusedTopicDiagnostic());
                }
            }
        } catch (e) { this.log(`[validation] workspace checks failed: ${e}`); }

        // Phase 12: Custom rules (skip for large files)
        try {
            if (settings.customRulesFile && !isLargeFile) {
                const t0 = Date.now();
                const customMax = (settings.maxNumberOfProblems ?? 100) - diagnostics.length;
                const customDiags = validateCustomRules(
                    text, filePath, settings.customRulesFile, Math.max(0, customMax),
                );
                diagnostics.push(...customDiags);
                timings['custom'] = Date.now() - t0;
            }
        } catch (e) { this.log(`[validation] custom rules failed: ${e}`); }

        // Apply per-rule severity overrides
        const overrides = settings.validationSeverityOverrides;
        let finalDiags = diagnostics;
        if (overrides && Object.keys(overrides).length > 0) {
            finalDiags = [];
            for (const d of diagnostics) {
                const code = typeof d.code === 'string' ? d.code : String(d.code ?? '');
                const override = overrides[code];
                if (override === 'off') continue; // Suppress this diagnostic
                if (override) {
                    const mapped = SEVERITY_MAP[override];
                    if (mapped !== undefined) {
                        finalDiags.push({ ...d, severity: mapped });
                        continue;
                    }
                }
                finalDiags.push(d);
            }
        }

        // Apply comment-based suppression (Phase 5.2)
        finalDiags = applySuppressions(finalDiags, text);

        // Log phase timings at debug level
        const totalMs = Date.now() - startTime;
        const timingStr = Object.entries(timings).map(([k, v]) => `${k}=${v}ms`).join(' ');
        const cacheStr = cacheHits > 0 ? ` cache=${cacheHits}` : '';
        this.log(`[validation] ${filePath.split(/[\\/]/).pop()} Total=${totalMs}ms${cacheStr} ${timingStr}`);

        // Cap total diagnostics
        const maxProblems = settings.maxNumberOfProblems ?? 100;
        return finalDiags.length > maxProblems
            ? finalDiags.slice(0, maxProblems)
            : finalDiags;
    }

    /**
     * Compute a summary of diagnostic counts by severity.
     */
    static summarize(diagnostics: Diagnostic[]): ValidationSummary {
        let errors = 0, warnings = 0, infos = 0;
        for (const d of diagnostics) {
            switch (d.severity) {
                case 1: errors++; break;   // DiagnosticSeverity.Error
                case 2: warnings++; break; // DiagnosticSeverity.Warning
                case 3: infos++; break;    // DiagnosticSeverity.Information
                case 4: infos++; break;    // DiagnosticSeverity.Hint
            }
        }
        return { errors, warnings, infos };
    }
}
