"use strict";
/**
 * RNG (RelaxNG) Validation Service (Phase 4 - Item #13).
 * Optional schema-based validation using salve-annos for RelaxNG.
 *
 * Salve-annos is a pure-JS RelaxNG validation state machine.
 * It requires a SAX parser (saxes) to tokenize XML and fire events
 * into the salve walker for validation.
 *
 * The service compiles .rng schemas to an internal JSON format and
 * caches them for reuse across validations.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RngValidationService = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const node_1 = require("vscode-languageserver/node");
const SOURCE = 'dita-rng';
/** Maximum number of compiled grammars to keep cached. */
const MAX_GRAMMAR_CACHE = 20;
/**
 * Provides RelaxNG validation using salve-annos + saxes.
 * Schemas are compiled and cached for reuse.
 */
class RngValidationService {
    constructor() {
        this.salve = null;
        this.saxesModule = null;
        this.available = false;
        this.loadError = null;
        /**
         * Grammar cache: schema path → Promise<grammar>.
         * Stores Promises (not resolved values) to deduplicate concurrent compilations.
         */
        this.grammarCache = new Map();
        /** User-configured path to RNG schemas directory. */
        this.schemaBasePath = null;
    }
    /**
     * Initialize the service. Attempts to load salve-annos and saxes.
     * Both are optional dependencies — if not available, the service
     * reports itself as unavailable and validation falls back to DTD.
     */
    initialize(schemaBasePath) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            this.salve = require('salve-annos');
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            this.saxesModule = require('saxes');
            if (!this.salve?.Grammar || !this.saxesModule?.SaxesParser) {
                this.loadError = 'salve-annos or saxes loaded but required classes not found';
                return;
            }
            this.available = true;
            if (schemaBasePath) {
                this.schemaBasePath = schemaBasePath;
            }
        }
        catch (error) {
            this.loadError = error instanceof Error ? error.message : String(error);
        }
    }
    /** Whether salve-annos + saxes are loaded and ready. */
    get isAvailable() {
        return this.available;
    }
    /** Error message if initialization failed. */
    get error() {
        return this.loadError;
    }
    /** Update the base path for RNG schema resolution. */
    setSchemaBasePath(basePath) {
        this.schemaBasePath = basePath;
    }
    /**
     * Validate a DITA document against its RNG schema.
     * Resolves the schema from the root element, then
     * validates using salve-annos.
     *
     * Returns LSP Diagnostic[] for RNG validation errors.
     */
    async validate(text) {
        if (!this.salve || !this.saxesModule || !this.available) {
            return [];
        }
        // Determine which RNG schema to use based on root element
        const schemaPath = this.resolveSchemaPath(text);
        if (!schemaPath) {
            return [];
        }
        // Get or compile the grammar
        const grammar = await this.getGrammar(schemaPath);
        if (!grammar) {
            return [];
        }
        return this.validateWithGrammar(text, grammar);
    }
    /** Clear the compiled grammar cache. */
    clearCache() {
        this.grammarCache.clear();
    }
    /**
     * Resolve the RNG schema path for a document based on its root element.
     * Maps DITA topic types and map types to their RNG files.
     */
    resolveSchemaPath(text) {
        if (!this.schemaBasePath)
            return null;
        // Strip comments first to avoid matching element-like strings inside them
        const stripped = text.replace(/<!--[\s\S]*?-->/g, '');
        // Extract root element name (skip XML declaration, PIs, DOCTYPE)
        const rootMatch = stripped.match(/<(?![?!])(\w[\w.-]*)/);
        if (!rootMatch)
            return null;
        const rootElement = rootMatch[1].toLowerCase();
        const schemaFile = ROOT_TO_SCHEMA[rootElement];
        if (!schemaFile)
            return null;
        const fullPath = path.join(this.schemaBasePath, schemaFile);
        // existsSync is acceptable here — it's a fast stat check for a local file,
        // called once per validation, not in a hot loop.
        return (0, fs_1.existsSync)(fullPath) ? fullPath : null;
    }
    /**
     * Get a compiled grammar, using the cache if available.
     * Stores the Promise in the cache to deduplicate concurrent compilations
     * for the same schema.
     */
    getGrammar(schemaPath) {
        const cached = this.grammarCache.get(schemaPath);
        if (cached)
            return cached;
        // Evict oldest entry if cache is full
        if (this.grammarCache.size >= MAX_GRAMMAR_CACHE) {
            const oldest = this.grammarCache.keys().next().value;
            if (oldest !== undefined)
                this.grammarCache.delete(oldest);
        }
        // Store the promise itself to prevent duplicate concurrent compilations.
        // If compilation fails (resolves to null), remove from cache so it can be retried.
        const promise = this.compileGrammar(schemaPath).then((grammar) => {
            if (grammar === null) {
                this.grammarCache.delete(schemaPath);
            }
            return grammar;
        }, () => {
            this.grammarCache.delete(schemaPath);
            return null;
        });
        this.grammarCache.set(schemaPath, promise);
        return promise;
    }
    /** Compile an RNG schema, checking for a JSON cache file first. */
    async compileGrammar(schemaPath) {
        // Check for pre-compiled JSON cache file
        const jsonCachePath = schemaPath + '.json';
        try {
            const jsonStr = await fs_1.promises.readFile(jsonCachePath, 'utf-8');
            const jsonData = JSON.parse(jsonStr);
            return this.salve.readTreeFromJSON(jsonData.v, jsonData.d);
        }
        catch {
            // JSON cache missing or invalid, fall through to compilation
        }
        // Compile RNG schema
        try {
            const fileUrl = 'file:///' + schemaPath.replace(/\\/g, '/').replace(/^\//, '');
            const result = await this.salve.convertRNGToPattern(fileUrl);
            const grammar = result.pattern;
            // Write JSON cache for faster future loads (async, non-blocking)
            try {
                const json = this.salve.writeTreeToJSON(grammar);
                await fs_1.promises.writeFile(jsonCachePath, json, 'utf-8');
            }
            catch {
                // Non-fatal: cache write failure
            }
            return grammar;
        }
        catch {
            // Schema compilation failed — non-fatal
            return null;
        }
    }
    /**
     * Validate XML text against a compiled grammar using SAX parsing.
     * Fires SAX events into the salve walker and collects errors.
     */
    validateWithGrammar(text, grammar) {
        const diagnostics = [];
        const walker = grammar.newWalker();
        const parser = new this.saxesModule.SaxesParser({ xmlns: true });
        let currentLine = 0;
        let currentColumn = 0;
        const updatePosition = () => {
            if (typeof parser.line === 'number')
                currentLine = parser.line - 1; // 0-based
            if (typeof parser.column === 'number')
                currentColumn = parser.column;
        };
        const pushErrors = (errors) => {
            if (errors === false)
                return;
            for (const err of errors) {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Error,
                    range: node_1.Range.create(currentLine, currentColumn, currentLine, currentColumn + 1),
                    message: err.toString(),
                    source: SOURCE,
                    code: 'DITA-RNG-001',
                });
            }
        };
        parser.on('opentag', (tag) => {
            updatePosition();
            const colonIdx = tag.name.indexOf(':');
            const localName = colonIdx >= 0 ? tag.name.slice(colonIdx + 1) : tag.name;
            const uri = tag.ns?.[''] ?? '';
            pushErrors(walker.fireEvent('enterStartTag', [uri, localName]));
            // Fire attribute events
            for (const [attrKey, attr] of Object.entries(tag.attributes)) {
                const attrUri = attr.uri ?? '';
                // Use attr.local when available; fall back to the attribute key
                const attrLocal = attr.local || attrKey;
                pushErrors(walker.fireEvent('attributeName', [attrUri, attrLocal]));
                pushErrors(walker.fireEvent('attributeValue', [attr.value]));
            }
            pushErrors(walker.fireEvent('leaveStartTag', []));
        });
        parser.on('closetag', (tag) => {
            updatePosition();
            const colonIdx = tag.name.indexOf(':');
            const localName = colonIdx >= 0 ? tag.name.slice(colonIdx + 1) : tag.name;
            const uri = tag.ns?.[''] ?? '';
            pushErrors(walker.fireEvent('endTag', [uri, localName]));
        });
        parser.on('text', (textContent) => {
            updatePosition();
            pushErrors(walker.fireEvent('text', [textContent]));
        });
        parser.on('error', () => {
            // XML parse errors are handled by the well-formedness validator;
            // we only care about schema validation here.
        });
        try {
            // Replace DOCTYPE with whitespace to preserve line/column offsets.
            // Handles internal subsets: <!DOCTYPE topic PUBLIC "..." "..." [ ... ]>
            const prepared = text.replace(/<!DOCTYPE\s[\s\S]*?(?:\[[\s\S]*?\]\s*)?>|<!DOCTYPE[^>]*>/gi, (m) => m.replace(/[^\n\r]/g, ' '));
            parser.write(prepared).close();
            // Check for unclosed elements
            const endErrors = walker.end();
            if (endErrors !== false) {
                for (const err of endErrors) {
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Error,
                        range: node_1.Range.create(0, 0, 0, 1),
                        message: err.toString(),
                        source: SOURCE,
                        code: 'DITA-RNG-001',
                    });
                }
            }
        }
        catch {
            // XML is malformed — handled by well-formedness checker
        }
        return diagnostics;
    }
}
exports.RngValidationService = RngValidationService;
/**
 * Maps DITA root element names to their RNG schema file paths
 * (relative to the schema base directory).
 * Follows the DITA-OT convention: plugins/org.oasis-open.dita.v1_3/rng/...
 */
const ROOT_TO_SCHEMA = {
    // Topic types
    topic: 'technicalContent/rng/topic.rng',
    concept: 'technicalContent/rng/concept.rng',
    task: 'technicalContent/rng/task.rng',
    reference: 'technicalContent/rng/reference.rng',
    glossentry: 'technicalContent/rng/glossentry.rng',
    glossgroup: 'technicalContent/rng/glossgroup.rng',
    troubleshooting: 'technicalContent/rng/troubleshooting.rng',
    // Map types
    map: 'technicalContent/rng/map.rng',
    bookmap: 'technicalContent/rng/bookmap.rng',
    // Base types (fallback)
    dita: 'base/rng/topic.rng',
};
//# sourceMappingURL=rngValidationService.js.map