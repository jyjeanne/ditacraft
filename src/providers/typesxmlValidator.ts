/**
 * TypesXML Validator
 * Full DTD validation using TypesXML (pure TypeScript, no native dependencies)
 *
 * TypesXML passes 100% of the W3C XML Conformance Test Suite for DTD-driven
 * documents and supports OASIS XML Catalogs for resolving DITA public identifiers.
 */

import * as path from 'path';
import * as fs from 'fs';
import { ValidationError, ValidationResult } from './ditaValidator';

// TypesXML types - using object type for external library interfaces
type TypesXMLCatalog = object;

// DOMBuilder is used as a content handler for SAX parsing
// We don't need to access the resulting document, just use it as a handler
type TypesXMLDOMBuilder = object;

interface TypesXMLSAXParser {
    setContentHandler(handler: object): void;
    setCatalog(catalog: TypesXMLCatalog): void;
    setValidating(validating: boolean): void;
    parseString(content: string): void;
    parseFile(filePath: string): void;
}

interface TypesXMLModule {
    SAXParser: new () => TypesXMLSAXParser;
    DOMBuilder: new () => TypesXMLDOMBuilder;
    Catalog: new (catalogPath: string) => TypesXMLCatalog;
}

/**
 * Result of attempting to load TypesXML
 */
interface LoadResult {
    success: boolean;
    error?: string;
    module?: TypesXMLModule;
}

// Cache the load result to avoid repeated require() calls
let cachedLoadResult: LoadResult | null = null;

/**
 * Attempt to load TypesXML dynamically (with caching)
 */
function loadTypesXML(): LoadResult {
    // Return cached result if available
    if (cachedLoadResult !== null) {
        return cachedLoadResult;
    }

    try {
        // Dynamic require for optional dependency
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const typesxml = require('typesxml') as TypesXMLModule;

        // Verify the module loaded correctly
        if (!typesxml || !typesxml.SAXParser || !typesxml.DOMBuilder || !typesxml.Catalog) {
            cachedLoadResult = {
                success: false,
                error: 'TypesXML module loaded but required classes not found'
            };
            return cachedLoadResult;
        }

        cachedLoadResult = {
            success: true,
            module: typesxml
        };
        return cachedLoadResult;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('Cannot find module')) {
            cachedLoadResult = {
                success: false,
                error: 'TypesXML is not installed. Install it with: npm install typesxml'
            };
            return cachedLoadResult;
        }

        cachedLoadResult = {
            success: false,
            error: `Failed to load TypesXML: ${errorMessage}`
        };
        return cachedLoadResult;
    }
}

/**
 * Parse error details from TypesXML exceptions
 */
interface ParsedError {
    line: number;
    column: number;
    message: string;
}

function parseTypesXMLError(error: unknown): ParsedError {
    const err = error as { lineNumber?: number; columnNumber?: number; message?: string };

    let line = 0;
    let column = 0;
    let message = 'Unknown validation error';

    if (err.lineNumber !== undefined && !isNaN(err.lineNumber)) {
        line = Math.max(0, err.lineNumber - 1); // Convert to 0-based
    }

    if (err.columnNumber !== undefined && !isNaN(err.columnNumber)) {
        column = Math.max(0, err.columnNumber - 1);
    }

    if (err.message) {
        message = err.message;

        // Try to extract line/column from message if not in properties
        if (line === 0) {
            const lineMatch = message.match(/line[:\s]+(\d+)/i);
            if (lineMatch) {
                const parsed = parseInt(lineMatch[1], 10);
                if (!isNaN(parsed)) {
                    line = Math.max(0, parsed - 1);
                }
            }
        }

        if (column === 0) {
            const colMatch = message.match(/col(?:umn)?[:\s]+(\d+)/i);
            if (colMatch) {
                const parsed = parseInt(colMatch[1], 10);
                if (!isNaN(parsed)) {
                    column = Math.max(0, parsed - 1);
                }
            }
        }
    }

    return { line, column, message };
}

/**
 * TypesXMLValidator - DTD validation using TypesXML
 */
export class TypesXMLValidator {
    private typesxml: TypesXMLModule | null = null;
    private catalog: TypesXMLCatalog | null = null;
    private catalogPath: string;
    private _isAvailable: boolean = false;
    private _loadError: string | null = null;

    constructor(extensionPath: string) {
        // DITA catalog is at dtds/catalog.xml
        this.catalogPath = path.join(extensionPath, 'dtds', 'catalog.xml');

        // Try to load TypesXML
        const loadResult = loadTypesXML();

        if (loadResult.success && loadResult.module) {
            this.typesxml = loadResult.module;
            this._isAvailable = true;
            this.initializeCatalog();
        } else {
            this._loadError = loadResult.error || 'Unknown error loading TypesXML';
            this._isAvailable = false;
        }
    }

    /**
     * Initialize the DITA catalog
     */
    private initializeCatalog(): void {
        if (!this.typesxml) {
            return;
        }

        // Check if catalog file exists
        if (!fs.existsSync(this.catalogPath)) {
            console.warn('TypesXMLValidator: Catalog file not found:', this.catalogPath);
            return;
        }

        try {
            this.catalog = new this.typesxml.Catalog(this.catalogPath);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn('TypesXMLValidator: Failed to load catalog:', errorMessage);
            // Continue without catalog - validation will still work for well-formedness
        }
    }

    /**
     * Check if TypesXML validation is available
     */
    public get isAvailable(): boolean {
        return this._isAvailable;
    }

    /**
     * Get the error message if TypesXML is not available
     */
    public get loadError(): string | null {
        return this._loadError;
    }

    /**
     * Validate XML content against DITA DTDs
     */
    public validate(content: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Check if TypesXML is available
        if (!this.typesxml || !this._isAvailable) {
            return {
                valid: false,
                errors: [{
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: this._loadError || 'TypesXML validation is not available',
                    source: 'typesxml'
                }],
                warnings: []
            };
        }

        try {
            const handler = new this.typesxml.DOMBuilder();
            const parser = new this.typesxml.SAXParser();

            parser.setContentHandler(handler);

            // Set catalog if available
            if (this.catalog) {
                parser.setCatalog(this.catalog);
            } else {
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: 'DITA catalog not loaded. DTD validation may be incomplete.',
                    source: 'typesxml'
                });
            }

            // Enable DTD validation
            parser.setValidating(true);

            // Parse and validate
            parser.parseString(content);

            // Validation passed
            return { valid: true, errors, warnings };

        } catch (error) {
            // Parse error details
            const parsed = parseTypesXMLError(error);

            errors.push({
                line: parsed.line,
                column: parsed.column,
                severity: 'error',
                message: parsed.message,
                // Use 'typesxml-dtd' source when catalog is loaded (full DTD validation)
                // Use 'typesxml' source when no catalog (well-formedness only)
                source: this.catalog ? 'typesxml-dtd' : 'typesxml'
            });

            return { valid: false, errors, warnings };
        }
    }

    /**
     * Validate a file by path
     */
    public validateFile(filePath: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Check if TypesXML is available
        if (!this.typesxml || !this._isAvailable) {
            return {
                valid: false,
                errors: [{
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: this._loadError || 'TypesXML validation is not available',
                    source: 'typesxml'
                }],
                warnings: []
            };
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return {
                valid: false,
                errors: [{
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: `File not found: ${filePath}`,
                    source: 'typesxml'
                }],
                warnings: []
            };
        }

        try {
            const handler = new this.typesxml.DOMBuilder();
            const parser = new this.typesxml.SAXParser();

            parser.setContentHandler(handler);

            // Set catalog if available, otherwise warn
            if (this.catalog) {
                parser.setCatalog(this.catalog);
            } else {
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: 'DITA catalog not loaded. DTD validation may be incomplete.',
                    source: 'typesxml'
                });
            }

            parser.setValidating(true);
            parser.parseFile(filePath);

            return { valid: true, errors, warnings };

        } catch (error) {
            const parsed = parseTypesXMLError(error);

            errors.push({
                line: parsed.line,
                column: parsed.column,
                severity: 'error',
                message: parsed.message,
                source: this.catalog ? 'typesxml-dtd' : 'typesxml'
            });

            return { valid: false, errors, warnings };
        }
    }

    /**
     * Dispose and free resources
     */
    public dispose(): void {
        this.catalog = null;
        this.typesxml = null;
        this._isAvailable = false;
    }
}

/**
 * Check if TypesXML is available without creating a full validator.
 * This is useful for checking availability before attempting validation.
 * The result is cached, so multiple calls are efficient.
 *
 * @returns true if TypesXML module can be loaded and used
 */
export function isTypesXMLAvailable(): boolean {
    const result = loadTypesXML();
    return result.success;
}

/**
 * Get the error message if TypesXML is not available.
 * Returns null if TypesXML is available and working.
 * The result is cached, so multiple calls are efficient.
 *
 * @returns Error message string, or null if TypesXML is available
 */
export function getTypesXMLLoadError(): string | null {
    const result = loadTypesXML();
    return result.success ? null : (result.error || 'Unknown error');
}
