/**
 * Built-in Validation Engine
 * P2-1: Built-in XML validation using fast-xml-parser and xmldom
 */

import { XMLValidator } from 'fast-xml-parser';
import { DOMParser } from '@xmldom/xmldom';
import { IValidationEngine } from './validationEngineBase';
import { ValidationResult, ValidationError, createEmptyResult, createErrorResult } from './validationTypes';
import { DtdResolver } from '../../utils/dtdResolver';
import { getErrorMessage } from '../../utils/errorUtils';

/**
 * Built-in validation engine using fast-xml-parser and optional DTD validation
 */
export class BuiltinEngine implements IValidationEngine {
    public readonly name = 'built-in';
    public readonly isAvailable = true;

    private dtdResolver: DtdResolver | null = null;

    constructor(extensionPath?: string) {
        if (extensionPath) {
            this.dtdResolver = new DtdResolver(extensionPath);
        }
    }

    /**
     * Validate using built-in XML parser
     */
    public async validate(content: string, _filePath: string): Promise<ValidationResult> {
        try {
            // Try DTD validation if DTD resolver is available
            if (this.dtdResolver && this.dtdResolver.areDtdsAvailable()) {
                const dtdResult = await this.validateWithDtd(content);
                // If DTD validation found errors, return those
                if (dtdResult.errors.length > 0) {
                    return dtdResult;
                }
            }

            // Use fast-xml-parser for basic XML validation
            const validationResult = XMLValidator.validate(content, {
                allowBooleanAttributes: true
            });

            if (validationResult !== true) {
                // Validation failed - safely extract error details
                const errorObj = validationResult as Record<string, unknown>;
                const err = errorObj.err as Record<string, unknown> | undefined;

                const errorCode = err && typeof err.code === 'string' ? err.code : 'UNKNOWN';
                const errorMsg = err && typeof err.msg === 'string' ? err.msg : 'Validation error';
                const errorLine = err && typeof err.line === 'number' ? err.line : 1;

                return createErrorResult(
                    `${errorCode}: ${errorMsg}`,
                    'xml-parser',
                    errorLine - 1,
                    0
                );
            }

            // Basic XML is valid
            return createEmptyResult();

        } catch (error: unknown) {
            // Parse error from fast-xml-parser
            const errorMessage = getErrorMessage(error);

            // Try to extract line number from error message
            const lineMatch = errorMessage.match(/line:(\d+)/i) ||
                             errorMessage.match(/at position (\d+)/i);
            const line = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 0;

            return createErrorResult(errorMessage, 'xml-parser', line, 0);
        }
    }

    /**
     * Validate using DTD with xmldom
     */
    private async validateWithDtd(content: string): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        try {
            // Custom error handler to collect errors
            const errorHandler = {
                warning: (msg: string) => {
                    const lineInfo = this.extractLineInfo(msg);
                    warnings.push({
                        line: lineInfo.line,
                        column: lineInfo.column,
                        message: this.cleanErrorMessage(msg),
                        severity: 'warning',
                        source: 'dtd-validator'
                    });
                },
                error: (msg: string) => {
                    const lineInfo = this.extractLineInfo(msg);
                    errors.push({
                        line: lineInfo.line,
                        column: lineInfo.column,
                        message: this.cleanErrorMessage(msg),
                        severity: 'error',
                        source: 'dtd-validator'
                    });
                },
                fatalError: (msg: string) => {
                    const lineInfo = this.extractLineInfo(msg);
                    errors.push({
                        line: lineInfo.line,
                        column: lineInfo.column,
                        message: this.cleanErrorMessage(msg),
                        severity: 'error',
                        source: 'dtd-validator'
                    });
                }
            };

            // Neutralize XXE attacks before parsing
            const { content: safeContent, hadEntities } = this.neutralizeXXE(content);
            if (hadEntities) {
                warnings.push({
                    line: 0,
                    column: 0,
                    message: 'External entity declarations were removed for security reasons',
                    severity: 'warning',
                    source: 'security'
                });
            }

            // Create parser with DTD validation
            const parser = new DOMParser({
                errorHandler,
                locator: {}
            });

            // Parse XML (xmldom will automatically validate against DTD if present)
            parser.parseFromString(safeContent, 'text/xml');

            return {
                valid: errors.length === 0,
                errors: errors,
                warnings: warnings
            };

        } catch (error: unknown) {
            // Handle parsing errors
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: `DTD validation error: ${getErrorMessage(error)}`,
                source: 'dtd-validator'
            });

            return {
                valid: false,
                errors: errors,
                warnings: warnings
            };
        }
    }

    /**
     * Neutralize XXE (XML External Entity) attacks by removing entity declarations
     */
    private neutralizeXXE(xmlContent: string): { content: string; hadEntities: boolean } {
        // Check for ENTITY declarations in DOCTYPE
        const entityPattern = /<!ENTITY\s+\S+\s+(?:SYSTEM|PUBLIC)\s+[^>]+>/gi;
        const hadEntities = entityPattern.test(xmlContent);

        if (hadEntities) {
            // Remove external entity declarations while preserving the rest of DOCTYPE
            const neutralized = xmlContent.replace(
                /<!ENTITY\s+\S+\s+(?:SYSTEM|PUBLIC)\s+[^>]+>/gi,
                '<!-- XXE entity declaration removed for security -->'
            );

            // Also remove any parameter entity declarations
            const finalContent = neutralized.replace(
                /<!ENTITY\s+%\s+\S+\s+(?:SYSTEM|PUBLIC)\s+[^>]+>/gi,
                '<!-- XXE parameter entity declaration removed for security -->'
            );

            return { content: finalContent, hadEntities: true };
        }

        return { content: xmlContent, hadEntities: false };
    }

    /**
     * Extract line and column info from error messages
     */
    private extractLineInfo(message: string): { line: number; column: number } {
        const lineMatch = message.match(/line[:\s]+(\d+)/i);
        const colMatch = message.match(/col(?:umn)?[:\s]+(\d+)/i);

        return {
            line: lineMatch ? Math.max(0, parseInt(lineMatch[1], 10) - 1) : 0,
            column: colMatch ? Math.max(0, parseInt(colMatch[1], 10) - 1) : 0
        };
    }

    /**
     * Clean error messages to make them more user-friendly
     */
    private cleanErrorMessage(message: string): string {
        return message
            .replace(/^\[xmldom\s+\w+\]\s*/i, '')
            .replace(/@#\[line:\d+,col:\d+\]/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
