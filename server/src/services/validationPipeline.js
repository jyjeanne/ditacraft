"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationPipeline = exports.ValidationPhase = void 0;
const node_1 = require("vscode-languageserver/node");
const textUtils_1 = require("../utils/textUtils");
const i18n_1 = require("../utils/i18n");
const validation_1 = require("../features/validation");
const contentModelValidation_1 = require("../features/contentModelValidation");
const crossRefValidation_1 = require("../features/crossRefValidation");
const ditaRulesValidator_1 = require("../features/ditaRulesValidator");
const profilingValidation_1 = require("../features/profilingValidation");
const circularRefDetection_1 = require("../features/circularRefDetection");
const workspaceValidation_1 = require("../features/workspaceValidation");
const customRulesValidator_1 = require("../features/customRulesValidator");
const ditaVersionDetector_1 = require("../utils/ditaVersionDetector");
const suppressionEngine_1 = require("./suppressionEngine");
// ---------------------------------------------------------------------------
// Phase cache types
// ---------------------------------------------------------------------------
/** Numeric phase identifiers for cache keying and invalidation groups. */
var ValidationPhase;
(function (ValidationPhase) {
    ValidationPhase[ValidationPhase["XmlStructureId"] = 1] = "XmlStructureId";
    ValidationPhase[ValidationPhase["ContentModel"] = 4] = "ContentModel";
    ValidationPhase[ValidationPhase["Schema"] = 5] = "Schema";
    ValidationPhase[ValidationPhase["CrossRef"] = 6] = "CrossRef";
    ValidationPhase[ValidationPhase["SubjectScheme"] = 7] = "SubjectScheme";
    ValidationPhase[ValidationPhase["Profiling"] = 8] = "Profiling";
    ValidationPhase[ValidationPhase["DitaRules"] = 9] = "DitaRules";
    ValidationPhase[ValidationPhase["CircularRef"] = 10] = "CircularRef";
    ValidationPhase[ValidationPhase["Workspace"] = 11] = "Workspace";
})(ValidationPhase || (exports.ValidationPhase = ValidationPhase = {}));
/** Phases invalidated by a text edit (content changed). */
const TEXT_EDIT_PHASES = [
    ValidationPhase.XmlStructureId,
    ValidationPhase.ContentModel,
    ValidationPhase.Schema,
    ValidationPhase.DitaRules,
];
/** Phases invalidated by a file save (file I/O dependent). */
const FILE_SAVE_PHASES = [
    ValidationPhase.CrossRef,
    ValidationPhase.CircularRef,
];
/** Phases invalidated by a map file change (cross-file scope). */
const MAP_CHANGE_PHASES = [
    ValidationPhase.CrossRef,
    ValidationPhase.SubjectScheme,
    ValidationPhase.Profiling,
];
// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------
/** Maps user-facing severity names to LSP DiagnosticSeverity values. */
const SEVERITY_MAP = {
    error: node_1.DiagnosticSeverity.Error,
    warning: node_1.DiagnosticSeverity.Warning,
    information: node_1.DiagnosticSeverity.Information,
    hint: node_1.DiagnosticSeverity.Hint,
};
/** Default timeout per async validation phase (ms). */
const DEFAULT_PHASE_TIMEOUT_MS = 5000;
/** Maximum concurrent pipeline executions. */
const MAX_CONCURRENT_VALIDATIONS = 5;
/** Maximum cache entries before eviction. ~50 docs x 10 phases. */
const MAX_CACHE_ENTRIES = 500;
/** Cache entries older than this are treated as misses (ms). */
const CACHE_TTL_MS = 5 * 60000;
/** Format an error for log output, including stack trace when available. */
function formatError(e) {
    if (e instanceof Error)
        return e.stack ?? e.message;
    return String(e);
}
/**
 * Run a promise with a timeout. Returns the promise result or the fallback
 * if it times out. Logs a warning on timeout.
 */
async function withTimeout(promise, timeoutMs, phaseName, fallback, log, token) {
    if (token?.isCancellationRequested)
        return fallback;
    let timer;
    const timeoutPromise = new Promise((resolve) => {
        timer = setTimeout(() => {
            log(`[validation] ${phaseName} timed out after ${timeoutMs}ms — skipped`);
            resolve(fallback);
        }, timeoutMs);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Simple counting semaphore to limit concurrent pipeline executions.
 * Safe because JavaScript is single-threaded; queue operations are atomic.
 */
class Semaphore {
    constructor(max) {
        this.max = max;
        this.current = 0;
        this.queue = [];
    }
    async acquire() {
        if (this.current < this.max) {
            this.current++;
            return;
        }
        return new Promise((resolve) => {
            this.queue.push(() => {
                this.current++;
                resolve();
            });
        });
    }
    release() {
        this.current--;
        const next = this.queue.shift();
        if (next)
            next();
    }
}
// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
/**
 * Orchestrates all DITA validation phases for a single document.
 */
class ValidationPipeline {
    constructor(catalogValidation, rngValidation, subjectSchemeService, log) {
        this.catalogValidation = catalogValidation;
        this.rngValidation = rngValidation;
        this.subjectSchemeService = subjectSchemeService;
        this.semaphore = new Semaphore(MAX_CONCURRENT_VALIDATIONS);
        this.phaseCache = new Map();
        this.log = log ?? (() => { });
    }
    // -----------------------------------------------------------------------
    // Cache helpers
    // -----------------------------------------------------------------------
    cacheKey(uri, phase) {
        return `${uri}|${phase}`;
    }
    /**
     * djb2 hash of serialized settings — fast, deterministic, sufficient for change detection.
     */
    static hashSettings(settings) {
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
    getCached(uri, phase, documentVersion, settingsHash, checkVersion = true) {
        const key = this.cacheKey(uri, phase);
        const entry = this.phaseCache.get(key);
        if (!entry)
            return null;
        if (checkVersion && entry.documentVersion !== documentVersion)
            return null;
        if (entry.settingsHash !== settingsHash)
            return null;
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            this.phaseCache.delete(key);
            return null;
        }
        return entry.diagnostics;
    }
    setCache(uri, phase, documentVersion, settingsHash, diagnostics) {
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
    evictOldest() {
        const now = Date.now();
        // First pass: remove expired entries
        for (const [key, entry] of this.phaseCache) {
            if (now - entry.timestamp > CACHE_TTL_MS) {
                this.phaseCache.delete(key);
            }
        }
        // If still over limit, evict oldest 20%
        if (this.phaseCache.size >= MAX_CACHE_ENTRIES) {
            const entries = [...this.phaseCache.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = Math.max(1, Math.floor(entries.length * 0.2));
            for (let i = 0; i < toRemove; i++) {
                this.phaseCache.delete(entries[i][0]);
            }
        }
    }
    // -----------------------------------------------------------------------
    // Cache invalidation (called from server.ts event handlers)
    // -----------------------------------------------------------------------
    /** Invalidate specific phases for a single document. */
    invalidatePhases(uri, phases) {
        for (const phase of phases) {
            this.phaseCache.delete(this.cacheKey(uri, phase));
        }
    }
    /** Called on text edit: invalidate content-dependent phases for this document. */
    invalidateForTextEdit(uri) {
        this.invalidatePhases(uri, TEXT_EDIT_PHASES);
    }
    /** Called on file save: invalidate I/O-dependent phases for this document. */
    invalidateForFileSave(uri) {
        this.invalidatePhases(uri, FILE_SAVE_PHASES);
    }
    /** Called on map file change: invalidate map-dependent phases for ALL documents. */
    invalidateForMapChange() {
        const mapPhaseSet = new Set(MAP_CHANGE_PHASES);
        for (const key of [...this.phaseCache.keys()]) {
            const phase = parseInt(key.split('|').pop(), 10);
            if (mapPhaseSet.has(phase)) {
                this.phaseCache.delete(key);
            }
        }
    }
    /** Called on settings change: clear entire cache. */
    invalidateAll() {
        this.phaseCache.clear();
    }
    /** Called on document close: remove all cache entries for this URI. */
    invalidateForDocument(uri) {
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
    async validate(document, settings, keySpaceService, workspace, token, phaseTimeoutMs = DEFAULT_PHASE_TIMEOUT_MS) {
        await this.semaphore.acquire();
        try {
            return await this.runPipeline(document, settings, keySpaceService, workspace, token, phaseTimeoutMs);
        }
        finally {
            this.semaphore.release();
        }
    }
    async runPipeline(document, settings, keySpaceService, workspace, token, phaseTimeoutMs) {
        const startTime = Date.now();
        const pipelineBudgetMs = settings.pipelineBudgetMs ?? 30000;
        const text = document.getText();
        const uri = document.uri;
        const docVersion = document.version;
        const filePath = (0, textUtils_1.uriToPath)(uri);
        const diagnostics = [];
        const timings = {};
        const settingsHash = ValidationPipeline.hashSettings(settings);
        let cacheHits = 0;
        /** Check whether the total pipeline budget has been exceeded. */
        const budgetExceeded = () => {
            if (Date.now() - startTime >= pipelineBudgetMs) {
                this.log(`[validation] Pipeline budget (${pipelineBudgetMs}ms) exceeded — skipping remaining phases`);
                return true;
            }
            return false;
        };
        const timePhase = (name, fn) => {
            const t0 = Date.now();
            const result = fn();
            timings[name] = Date.now() - t0;
            return result;
        };
        const timePhaseAsync = async (name, fn) => {
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
        if (token?.isCancellationRequested)
            return diagnostics;
        const cachedBase = this.getCached(uri, ValidationPhase.XmlStructureId, docVersion, settingsHash);
        if (cachedBase) {
            diagnostics.push(...cachedBase);
            cacheHits++;
        }
        else {
            try {
                const baseDiags = timePhase('XML+Structure+ID', () => (0, validation_1.validateDITADocument)(document, settings));
                diagnostics.push(...baseDiags);
                this.setCache(uri, ValidationPhase.XmlStructureId, docVersion, settingsHash, baseDiags);
            }
            catch (e) {
                this.log(`[validation] base validation failed: ${formatError(e)}`);
            }
        }
        if (token?.isCancellationRequested || budgetExceeded())
            return diagnostics;
        // Phase 4: Content model validation (skip when TypesXML DTD covers it)
        const useRng = this.rngValidation.isAvailable && settings.schemaFormat === 'rng';
        const useTypesXml = !useRng && this.catalogValidation.isAvailable && settings.validationEngine === 'typesxml';
        if (!useTypesXml) {
            const cachedCm = this.getCached(uri, ValidationPhase.ContentModel, docVersion, settingsHash);
            if (cachedCm) {
                diagnostics.push(...cachedCm);
                cacheHits++;
            }
            else {
                try {
                    const cmDiags = timePhase('ContentModel', () => (0, contentModelValidation_1.validateContentModel)(text));
                    diagnostics.push(...cmDiags);
                    this.setCache(uri, ValidationPhase.ContentModel, docVersion, settingsHash, cmDiags);
                }
                catch (e) {
                    this.log(`[validation] content model validation failed: ${formatError(e)}`);
                }
            }
        }
        if (token?.isCancellationRequested || budgetExceeded())
            return diagnostics;
        // Phase 5: Schema validation — DTD or RNG (mutually exclusive)
        if (useTypesXml) {
            const cachedDtd = this.getCached(uri, ValidationPhase.Schema, docVersion, settingsHash);
            if (cachedDtd) {
                diagnostics.push(...cachedDtd);
                cacheHits++;
            }
            else {
                try {
                    const dtdDiags = timePhase('DTD', () => {
                        const existingErrorLines = new Set(diagnostics
                            .filter(d => d.code === 'DITA-XML-001')
                            .map(d => d.range.start.line));
                        const result = [];
                        for (const diag of this.catalogValidation.validate(text)) {
                            if (!existingErrorLines.has(diag.range.start.line)) {
                                result.push(diag);
                            }
                        }
                        return result;
                    });
                    diagnostics.push(...dtdDiags);
                    this.setCache(uri, ValidationPhase.Schema, docVersion, settingsHash, dtdDiags);
                }
                catch (e) {
                    this.log(`[validation] DTD validation failed: ${formatError(e)}`);
                }
            }
        }
        if (useRng) {
            const cachedRng = this.getCached(uri, ValidationPhase.Schema, docVersion, settingsHash);
            if (cachedRng) {
                diagnostics.push(...cachedRng);
                cacheHits++;
            }
            else {
                try {
                    if (settings.rngSchemaPath) {
                        this.rngValidation.setSchemaBasePath(settings.rngSchemaPath);
                    }
                    const rngDiags = await timePhaseAsync('RNG', () => withTimeout(this.rngValidation.validate(text), phaseTimeoutMs, 'RNG', [], this.log, token));
                    diagnostics.push(...rngDiags);
                    this.setCache(uri, ValidationPhase.Schema, docVersion, settingsHash, rngDiags);
                }
                catch (e) {
                    this.log(`[validation] RNG validation failed: ${formatError(e)}`);
                }
            }
        }
        if (token?.isCancellationRequested || budgetExceeded())
            return diagnostics;
        // Phases 6, 9, 10: Cross-refs, DITA rules, and circular refs are independent — run in parallel
        // Skip these heavy phases for large files
        if (isLargeFile) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Information,
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                message: (0, i18n_1.t)('largeFile.skipped', String(Math.round(fileSizeBytes / 1024)), String(thresholdKB)),
                code: 'DITA-PERF-001',
                source: 'ditacraft',
            });
        }
        const parallelPhases = [];
        // Phase 6: Cross-reference validation (I/O-dependent — skip version check)
        if (settings.crossRefValidationEnabled !== false && !isLargeFile) {
            parallelPhases.push((async () => {
                if (token?.isCancellationRequested)
                    return;
                const cached = this.getCached(uri, ValidationPhase.CrossRef, docVersion, settingsHash, false);
                if (cached) {
                    diagnostics.push(...cached);
                    cacheHits++;
                    return;
                }
                try {
                    const xrefDiags = await timePhaseAsync('CrossRef', () => withTimeout((0, crossRefValidation_1.validateCrossReferences)(text, uri, keySpaceService, settings.maxNumberOfProblems), phaseTimeoutMs, 'CrossRef', [], this.log, token));
                    diagnostics.push(...xrefDiags);
                    this.setCache(uri, ValidationPhase.CrossRef, docVersion, settingsHash, xrefDiags);
                }
                catch (e) {
                    this.log(`[validation] cross-ref validation failed: ${formatError(e)}`);
                }
            })());
        }
        // Phase 9: Schematron-equivalent DITA rules (sync but independent)
        if (settings.ditaRulesEnabled !== false && !isLargeFile) {
            parallelPhases.push((async () => {
                if (token?.isCancellationRequested)
                    return;
                const cached = this.getCached(uri, ValidationPhase.DitaRules, docVersion, settingsHash);
                if (cached) {
                    diagnostics.push(...cached);
                    cacheHits++;
                    return;
                }
                try {
                    // Phase 9 is synchronous with bounded complexity — no user-supplied
                    // regex, so ReDoS is not a risk. The pipeline budget check above
                    // guards against cumulative time; per-phase timeout is not possible
                    // for synchronous code without worker threads.
                    const rulesDiags = timePhase('DitaRules', () => {
                        const ditaVersion = settings.ditaVersion && settings.ditaVersion !== 'auto'
                            ? settings.ditaVersion
                            : (0, ditaVersionDetector_1.detectDitaVersion)(text);
                        return (0, ditaRulesValidator_1.validateDitaRules)(text, {
                            enabled: true,
                            categories: settings.ditaRulesCategories ?? ['mandatory', 'recommendation', 'authoring', 'accessibility'],
                            ditaVersion,
                        });
                    });
                    diagnostics.push(...rulesDiags);
                    this.setCache(uri, ValidationPhase.DitaRules, docVersion, settingsHash, rulesDiags);
                }
                catch (e) {
                    this.log(`[validation] DITA rules failed: ${formatError(e)}`);
                }
            })());
        }
        // Phase 10: Circular reference detection (I/O-dependent — skip version check)
        if (settings.crossRefValidationEnabled !== false && !isLargeFile) {
            parallelPhases.push((async () => {
                if (token?.isCancellationRequested)
                    return;
                const cached = this.getCached(uri, ValidationPhase.CircularRef, docVersion, settingsHash, false);
                if (cached) {
                    diagnostics.push(...cached);
                    cacheHits++;
                    return;
                }
                try {
                    const cycleDiags = await timePhaseAsync('CircularRef', () => withTimeout((0, circularRefDetection_1.detectCircularReferences)(text, uri), phaseTimeoutMs, 'CircularRef', [], this.log, token));
                    diagnostics.push(...cycleDiags);
                    this.setCache(uri, ValidationPhase.CircularRef, docVersion, settingsHash, cycleDiags);
                }
                catch (e) {
                    this.log(`[validation] circular ref detection failed: ${formatError(e)}`);
                }
            })());
        }
        await Promise.all(parallelPhases);
        if (token?.isCancellationRequested || budgetExceeded())
            return diagnostics;
        // Phase 7: Register subject scheme maps (must run before profiling, skip for large files)
        // Not cached — has side effects (registerSchemes mutates service state)
        if (keySpaceService && !isLargeFile) {
            try {
                await timePhaseAsync('SubjectScheme', async () => {
                    const schemePaths = await withTimeout(keySpaceService.getSubjectSchemePaths(filePath), phaseTimeoutMs, 'SubjectScheme', [], this.log, token);
                    this.subjectSchemeService.registerSchemes(schemePaths);
                });
            }
            catch (e) {
                this.log(`[validation] subject scheme registration failed: ${formatError(e)}`);
            }
        }
        // Phase 8: Profiling attribute validation (depends on phase 7, skip for large files)
        if (settings.subjectSchemeValidationEnabled !== false && !isLargeFile) {
            const cachedProf = this.getCached(uri, ValidationPhase.Profiling, docVersion, settingsHash);
            if (cachedProf) {
                diagnostics.push(...cachedProf);
                cacheHits++;
            }
            else {
                try {
                    const profDiags = timePhase('Profiling', () => (0, profilingValidation_1.validateProfilingAttributes)(text, this.subjectSchemeService, settings.maxNumberOfProblems));
                    diagnostics.push(...profDiags);
                    this.setCache(uri, ValidationPhase.Profiling, docVersion, settingsHash, profDiags);
                }
                catch (e) {
                    this.log(`[validation] profiling validation failed: ${formatError(e)}`);
                }
            }
        }
        if (token?.isCancellationRequested || budgetExceeded())
            return diagnostics;
        // Phase 11: Workspace-level checks (skip for large files)
        // Not cached — depends on external indices (rootIdIndex, unusedTopicPaths)
        if (!isLargeFile)
            try {
                if (workspace.rootIdIndex.size > 0) {
                    diagnostics.push(...(0, workspaceValidation_1.detectCrossFileDuplicateIds)(text, filePath, workspace.rootIdIndex));
                }
                if (workspace.unusedTopicPaths.size > 0) {
                    const normalizedPath = (0, textUtils_1.normalizeFsPath)(filePath);
                    if (workspace.unusedTopicPaths.has(normalizedPath)) {
                        diagnostics.push((0, workspaceValidation_1.createUnusedTopicDiagnostic)());
                    }
                }
            }
            catch (e) {
                this.log(`[validation] workspace checks failed: ${formatError(e)}`);
            }
        // Phase 12: Custom rules (skip for large files)
        // Custom rules run synchronously but have built-in per-rule guards:
        // isSafeRegex() rejects ReDoS patterns, 10k match cap, and 2s per-rule timeout.
        // The pipeline budget check above provides the macro-level guard.
        try {
            if (settings.customRulesFile && !isLargeFile) {
                const customMax = (settings.maxNumberOfProblems ?? 100) - diagnostics.length;
                const customDiags = timePhase('CustomRules', () => (0, customRulesValidator_1.validateCustomRules)(text, filePath, settings.customRulesFile, Math.max(0, customMax)));
                diagnostics.push(...customDiags);
            }
        }
        catch (e) {
            this.log(`[validation] custom rules failed: ${formatError(e)}`);
        }
        // Apply per-rule severity overrides
        const overrides = settings.validationSeverityOverrides;
        let finalDiags = diagnostics;
        if (overrides && Object.keys(overrides).length > 0) {
            finalDiags = [];
            for (const d of diagnostics) {
                const code = typeof d.code === 'string' ? d.code : String(d.code ?? '');
                const override = overrides[code];
                if (override === 'off')
                    continue; // Suppress this diagnostic
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
        finalDiags = (0, suppressionEngine_1.applySuppressions)(finalDiags, text);
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
    static summarize(diagnostics) {
        let errors = 0, warnings = 0, infos = 0;
        for (const d of diagnostics) {
            switch (d.severity) {
                case node_1.DiagnosticSeverity.Error:
                    errors++;
                    break;
                case node_1.DiagnosticSeverity.Warning:
                    warnings++;
                    break;
                case node_1.DiagnosticSeverity.Information:
                    infos++;
                    break;
                case node_1.DiagnosticSeverity.Hint:
                    infos++;
                    break;
                default: break;
            }
        }
        return { errors, warnings, infos };
    }
}
exports.ValidationPipeline = ValidationPipeline;
//# sourceMappingURL=validationPipeline.js.map