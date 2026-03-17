/**
 * Catalog Validation Service
 * Full DTD validation in the LSP server using TypesXML + OASIS XML Catalog.
 *
 * TypesXML provides full DTD validation with OASIS XML Catalog support.
 * The master catalog chains to DITA 1.2, 1.3, and 2.0 DTD catalogs.
 * Users can also specify an external catalog for custom DTD specializations.
 */

import * as path from 'path';
import * as fs from 'fs';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { t } from '../utils/i18n';
import { ICatalogValidationService } from './interfaces';

const SOURCE = 'dita-dtd';

// TypesXML types
type TypesXMLCatalog = object;
type TypesXMLDOMBuilder = object;

interface TypesXMLSAXParser {
    setContentHandler(handler: object): void;
    setCatalog(catalog: TypesXMLCatalog): void;
    setValidating(validating: boolean): void;
    parseString(content: string): void;
}

interface TypesXMLModule {
    SAXParser: new () => TypesXMLSAXParser;
    DOMBuilder: new () => TypesXMLDOMBuilder;
    Catalog: new (catalogPath: string) => TypesXMLCatalog;
}

/** Max parser instances to keep in the pool for reuse. */
const PARSER_POOL_SIZE = 3;

/**
 * Provides DTD validation using TypesXML with OASIS XML Catalog resolution.
 * Supports bundled DITA 1.2/1.3/2.0 catalogs and optional external catalog.
 * Reuses the catalog instance across validations for grammar caching.
 * Maintains a small pool of parser instances to reduce allocation overhead.
 */
export class CatalogValidationService implements ICatalogValidationService {
    private typesxml: TypesXMLModule | null = null;
    private catalog: TypesXMLCatalog | null = null;
    private available = false;
    private loadError: string | null = null;
    /** Pool of pre-configured parser+handler pairs for reuse. */
    private parserPool: { parser: TypesXMLSAXParser; handler: TypesXMLDOMBuilder }[] = [];
    /** Stored extension path for re-initialization on config change. */
    private extensionPath = '';

    /**
     * Initialize the service with the path to the extension root.
     * The master catalog.xml is at `<extensionPath>/dtds/catalog.xml`
     * and chains to DITA 1.2, 1.3, and 2.0 sub-catalogs.
     *
     * @param extensionPath Path to the extension root directory.
     * @param externalCatalogPath Optional user-configured external catalog path.
     */
    initialize(extensionPath: string, externalCatalogPath?: string): void {
        this.extensionPath = extensionPath;
        const catalogPath = externalCatalogPath && fs.existsSync(externalCatalogPath)
            ? externalCatalogPath
            : path.join(extensionPath, 'dtds', 'catalog.xml');

        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const typesxml = require('typesxml') as TypesXMLModule;

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
        } catch (error) {
            this.loadError = error instanceof Error ? error.message : String(error);
        }
    }

    /**
     * Re-initialize with a new external catalog path (on config change).
     * Drains the parser pool and creates new parsers with the updated catalog.
     */
    reinitialize(externalCatalogPath?: string): void {
        this.available = false;
        this.catalog = null;
        this.loadError = null;
        this.parserPool = [];
        this.initialize(this.extensionPath, externalCatalogPath);
    }

    /** Whether TypesXML is loaded and ready. */
    get isAvailable(): boolean {
        return this.available;
    }

    /** Error message if initialization failed. */
    get error(): string | null {
        return this.loadError;
    }

    /**
     * Validate a DITA document against its DTD using TypesXML + catalog.
     * Returns LSP Diagnostic[] for DTD validation errors.
     */
    validate(text: string): Diagnostic[] {
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
                this.parserPool.push({ parser, handler: new this.typesxml!.DOMBuilder() });
            }

            return []; // Valid
        } catch (error) {
            // On error, discard the parser (state may be corrupted)
            return [this.errorToDiagnostic(error)];
        }
    }

    /** Create a pre-configured parser. */
    private createParser(): TypesXMLSAXParser {
        const parser = new this.typesxml!.SAXParser();
        if (this.catalog) {
            parser.setCatalog(this.catalog);
        }
        parser.setValidating(true);
        return parser;
    }

    /** Create a pre-configured parser+handler pair (for pool pre-warming). */
    private createParserPair(): { parser: TypesXMLSAXParser; handler: TypesXMLDOMBuilder } {
        const handler = new this.typesxml!.DOMBuilder();
        const parser = this.createParser();
        parser.setContentHandler(handler);
        return { parser, handler };
    }

    /** Convert a TypesXML error to an LSP Diagnostic. */
    private errorToDiagnostic(error: unknown): Diagnostic {
        const err = error as { lineNumber?: number; columnNumber?: number; message?: string };

        let line = 0;
        let column = 0;
        let message = t('dtd.validationError');

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
                if (lineMatch) line = Math.max(0, parseInt(lineMatch[1], 10) - 1);
            }
            if (!hasColumnNumber) {
                const colMatch = message.match(/col(?:umn)?[:\s]+(\d+)/i);
                if (colMatch) column = Math.max(0, parseInt(colMatch[1], 10) - 1);
            }
        }

        return {
            severity: DiagnosticSeverity.Error,
            range: Range.create(line, column, line, column + 1000),
            message,
            source: SOURCE,
            code: 'DITA-DTD-001',
        };
    }
}
