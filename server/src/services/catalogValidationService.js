"use strict";
/**
 * Catalog Validation Service
 * Full DTD validation in the LSP server using TypesXML + OASIS XML Catalog.
 *
 * TypesXML provides full DTD validation with OASIS XML Catalog support.
 * The master catalog chains to DITA 1.2, 1.3, and 2.0 DTD catalogs.
 * Users can also specify an external catalog for custom DTD specializations.
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
exports.CatalogValidationService = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const node_1 = require("vscode-languageserver/node");
const i18n_1 = require("../utils/i18n");
const SOURCE = 'dita-dtd';
/** Max parser instances to keep in the pool for reuse. */
const PARSER_POOL_SIZE = 3;
/**
 * Provides DTD validation using TypesXML with OASIS XML Catalog resolution.
 * Supports bundled DITA 1.2/1.3/2.0 catalogs and optional external catalog.
 * Reuses the catalog instance across validations for grammar caching.
 * Maintains a small pool of parser instances to reduce allocation overhead.
 */
class CatalogValidationService {
    constructor() {
        this.typesxml = null;
        this.catalog = null;
        this.available = false;
        this.loadError = null;
        /** Pool of pre-configured parser+handler pairs for reuse. */
        this.parserPool = [];
        /** Stored extension path for re-initialization on config change. */
        this.extensionPath = '';
    }
    /**
     * Initialize the service with the path to the extension root.
     * The master catalog.xml is at `<extensionPath>/dtds/catalog.xml`
     * and chains to DITA 1.2, 1.3, and 2.0 sub-catalogs.
     *
     * @param extensionPath Path to the extension root directory.
     * @param externalCatalogPath Optional user-configured external catalog path.
     */
    initialize(extensionPath, externalCatalogPath) {
        this.extensionPath = extensionPath;
        const catalogPath = externalCatalogPath && fs.existsSync(externalCatalogPath)
            ? externalCatalogPath
            : path.join(extensionPath, 'dtds', 'catalog.xml');
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const typesxml = require('typesxml');
            if (!typesxml?.SAXParser || !typesxml?.DOMBuilder || !typesxml?.Catalog) {
                this.loadError = 'TypesXML module loaded but required classes not found';
                return;
            }
            this.typesxml = typesxml;
            if (fs.existsSync(catalogPath)) {
                this.catalog = new typesxml.Catalog(catalogPath);
            }
            // Pre-warm the parser pool
            this.parserPool = [];
            for (let i = 0; i < PARSER_POOL_SIZE; i++) {
                this.parserPool.push(this.createParserPair());
            }
            this.available = true;
        }
        catch (error) {
            this.loadError = error instanceof Error ? error.message : String(error);
        }
    }
    /**
     * Re-initialize with a new external catalog path (on config change).
     * Drains the parser pool and creates new parsers with the updated catalog.
     */
    reinitialize(externalCatalogPath) {
        this.available = false;
        this.catalog = null;
        this.loadError = null;
        this.parserPool = [];
        this.initialize(this.extensionPath, externalCatalogPath);
    }
    /** Whether TypesXML is loaded and ready. */
    get isAvailable() {
        return this.available;
    }
    /** Error message if initialization failed. */
    get error() {
        return this.loadError;
    }
    /**
     * Validate a DITA document against its DTD using TypesXML + catalog.
     * Returns LSP Diagnostic[] for DTD validation errors.
     */
    validate(text) {
        if (!this.typesxml || !this.available) {
            return [];
        }
        // Skip files without DOCTYPE — nothing to validate against
        if (!text.includes('<!DOCTYPE')) {
            return [];
        }
        // Take a parser from the pool, or create a new one.
        // Always create a fresh handler to avoid accumulating DOM state
        // from previous documents. The parser itself is reusable.
        const pooled = this.parserPool.pop();
        const parser = pooled?.parser ?? this.createParser();
        const handler = new this.typesxml.DOMBuilder();
        try {
            parser.setContentHandler(handler);
            parser.parseString(text);
            // Return parser to pool for reuse (with fresh handler slot)
            if (this.parserPool.length < PARSER_POOL_SIZE) {
                this.parserPool.push({ parser, handler: new this.typesxml.DOMBuilder() });
            }
            return []; // Valid
        }
        catch (error) {
            // On error, discard the parser (state may be corrupted)
            return [this.errorToDiagnostic(error)];
        }
    }
    /** Create a pre-configured parser. */
    createParser() {
        const parser = new this.typesxml.SAXParser();
        if (this.catalog) {
            parser.setCatalog(this.catalog);
        }
        parser.setValidating(true);
        return parser;
    }
    /** Create a pre-configured parser+handler pair (for pool pre-warming). */
    createParserPair() {
        const handler = new this.typesxml.DOMBuilder();
        const parser = this.createParser();
        parser.setContentHandler(handler);
        return { parser, handler };
    }
    /** Convert a TypesXML error to an LSP Diagnostic. */
    errorToDiagnostic(error) {
        const err = error;
        let line = 0;
        let column = 0;
        let message = (0, i18n_1.t)('dtd.validationError');
        let hasLineNumber = false;
        let hasColumnNumber = false;
        if (typeof err.lineNumber === 'number' && !isNaN(err.lineNumber)) {
            line = Math.max(0, err.lineNumber - 1);
            hasLineNumber = true;
        }
        if (typeof err.columnNumber === 'number' && !isNaN(err.columnNumber)) {
            column = Math.max(0, err.columnNumber - 1);
            hasColumnNumber = true;
        }
        if (err.message) {
            message = err.message;
            // Extract line/column from message only if not provided as properties
            if (!hasLineNumber) {
                const lineMatch = message.match(/line[:\s]+(\d+)/i);
                if (lineMatch)
                    line = Math.max(0, parseInt(lineMatch[1], 10) - 1);
            }
            if (!hasColumnNumber) {
                const colMatch = message.match(/col(?:umn)?[:\s]+(\d+)/i);
                if (colMatch)
                    column = Math.max(0, parseInt(colMatch[1], 10) - 1);
            }
        }
        return {
            severity: node_1.DiagnosticSeverity.Error,
            range: node_1.Range.create(line, column, line, column + 1000),
            message,
            source: SOURCE,
            code: 'DITA-DTD-001',
        };
    }
}
exports.CatalogValidationService = CatalogValidationService;
//# sourceMappingURL=catalogValidationService.js.map