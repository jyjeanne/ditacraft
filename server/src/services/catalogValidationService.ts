/**
 * Catalog Validation Service (Phase 1 - Item #3)
 * Full DTD validation in the LSP server using TypesXML + OASIS XML Catalog.
 *
 * TypesXML provides full DTD validation with OASIS XML Catalog support.
 * The catalog resolves DITA PUBLIC identifiers to bundled DTD files.
 */

import * as path from 'path';
import * as fs from 'fs';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { t } from '../utils/i18n';

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
 * Reuses the catalog instance across validations for grammar caching.
 * Maintains a small pool of parser instances to reduce allocation overhead.
 */
export class CatalogValidationService {
    private typesxml: TypesXMLModule | null = null;
    private catalog: TypesXMLCatalog | null = null;
    private available = false;
    private loadError: string | null = null;
    /** Pool of pre-configured parser+handler pairs for reuse. */
    private parserPool: { parser: TypesXMLSAXParser; handler: TypesXMLDOMBuilder }[] = [];

    /**
     * Initialize the service with the path to the extension root.
     * The catalog.xml is expected at `<extensionPath>/dtds/catalog.xml`.
     */
    initialize(extensionPath: string): void {
        const catalogPath = path.join(extensionPath, 'dtds', 'catalog.xml');

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

            this.available = true;

            // Pre-warm the parser pool
            for (let i = 0; i < PARSER_POOL_SIZE; i++) {
                this.parserPool.push(this.createParserPair());
            }
        } catch (error) {
            this.loadError = error instanceof Error ? error.message : String(error);
        }
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

            // Return parser to pool for reuse
            if (this.parserPool.length < PARSER_POOL_SIZE) {
                this.parserPool.push({ parser, handler });
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
            range: Range.create(line, column, line, column + 1),
            message,
            source: SOURCE,
            code: 'DITA-DTD-001',
        };
    }
}
