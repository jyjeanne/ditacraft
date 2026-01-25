/**
 * DITA Structure Validator
 * P2-1: Validates DITA-specific structure and rules
 */

import * as path from 'path';
import { ValidationResult, ValidationError } from './validationTypes';

/**
 * Options for DITA structure validation
 */
export interface DitaStructureValidatorOptions {
    /**
     * Skip checks that are covered by DTD validation (e.g., id/title requirements)
     */
    skipDtdChecks?: boolean;
}

/**
 * Validates DITA-specific structure and rules
 */
export class DitaStructureValidator {
    /**
     * Validate DITA-specific structure
     */
    public validate(
        content: string,
        filePath: string,
        options: DitaStructureValidatorOptions = {}
    ): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const ext = path.extname(filePath).toLowerCase();
        const skipDtdChecks = options.skipDtdChecks ?? false;

        // Check DOCTYPE declaration (always check, even with DTD validation)
        if (!content.includes('<!DOCTYPE')) {
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'Missing DOCTYPE declaration',
                source: 'dita-validator'
            });
        }

        // Validate based on file type
        try {
            if (ext === '.dita') {
                this.validateDitaTopic(content, errors, warnings, skipDtdChecks);
            } else if (ext === '.ditamap') {
                this.validateDitaMap(content, errors, warnings, skipDtdChecks);
            } else if (ext === '.bookmap') {
                this.validateBookmap(content, errors, warnings, skipDtdChecks);
            }

            // Check for common DITA issues (always run - these are warnings)
            this.checkCommonIssues(content, warnings);
        } catch (validationError: unknown) {
            // Ignore validation errors in structure checking
            // These are often false positives from simple string matching
            console.log('DITA structure validation error (ignored):', validationError);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate DITA topic structure
     */
    private validateDitaTopic(
        content: string,
        errors: ValidationError[],
        _warnings: ValidationError[],
        skipDtdChecks: boolean
    ): void {
        // Check for root element (topic, concept, task, reference, etc.)
        const topicTypes = ['<topic', '<concept', '<task', '<reference'];
        const hasTopicRoot = topicTypes.some(type => content.includes(type));

        if (!hasTopicRoot) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'DITA topic must have a valid root element (topic, concept, task, or reference)',
                source: 'dita-validator'
            });
        }

        // Skip id/title checks if DTD validation is active
        if (skipDtdChecks) {
            return;
        }

        // Check for id attribute on root (REQUIRED per DITA DTD)
        const idMatch = content.match(/<(?:topic|concept|task|reference)\s+[^>]*id="([^"]*)"/);
        if (!idMatch) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'Root element MUST have an id attribute (required by DTD)',
                source: 'dita-validator'
            });
        } else if (idMatch.length > 1 && idMatch[1] === '') {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'Root element id attribute cannot be empty',
                source: 'dita-validator'
            });
        }

        // Check for required title element as DIRECT CHILD of root
        this.validateTopicTitle(content, errors);

        // Check for empty title element
        const emptyTitlePattern = /<title\s*(?:\/|>\s*<\/title)>/;
        if (emptyTitlePattern.test(content)) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'DITA topic <title> element cannot be empty (required by DTD)',
                source: 'dita-validator'
            });
        }
    }

    /**
     * Validate title element exists as direct child of topic root
     */
    private validateTopicTitle(content: string, errors: ValidationError[]): void {
        const rootTitlePattern = /<(?:topic|concept|task|reference)\s+[^>]*>[\s\S]*?(?=<(?:title|shortdesc|prolog|abstract|body|conbody|taskbody|refbody|related-links))/;
        const rootMatch = content.match(rootTitlePattern);

        if (rootMatch) {
            const titleAfterRootPattern = /<(?:topic|concept|task|reference)\s+[^>]*>[\s]*<title>/;
            const hasRootTitle = titleAfterRootPattern.test(content);

            if (!hasRootTitle) {
                // Double-check: look for title as first child element
                const firstChildPattern = /<(?:topic|concept|task|reference)\s+[^>]*>\s*(?:<!--[\s\S]*?-->\s*)*<(\w+)/;
                const firstChildMatch = content.match(firstChildPattern);

                if (!firstChildMatch || firstChildMatch[1] !== 'title') {
                    errors.push({
                        line: 0,
                        column: 0,
                        severity: 'error',
                        message: 'DITA topic MUST contain a <title> element as first child (required by DTD)',
                        source: 'dita-validator'
                    });
                }
            }
        } else {
            // Fallback: Simple check if no title exists at all
            if (!content.includes('<title>') && !content.includes('<title ')) {
                errors.push({
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: 'DITA topic MUST contain a <title> element (required by DTD)',
                    source: 'dita-validator'
                });
            }
        }
    }

    /**
     * Validate DITA map structure
     */
    private validateDitaMap(
        content: string,
        errors: ValidationError[],
        warnings: ValidationError[],
        skipDtdChecks: boolean
    ): void {
        // Check for map root element
        if (!content.includes('<map')) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'DITA map must have a <map> root element',
                source: 'dita-validator'
            });
        }

        // Skip title check if DTD validation is active
        if (!skipDtdChecks) {
            if (!content.includes('<title>')) {
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: 'DITA map should contain a <title> element',
                    source: 'dita-validator'
                });
            }
        }

        // Check topicref elements have href
        const topicrefMatches = content.matchAll(/<topicref([^>]*)>/g);
        for (const match of topicrefMatches) {
            if (!match[1].includes('href=')) {
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: '<topicref> should have an href attribute',
                    source: 'dita-validator'
                });
            }
        }
    }

    /**
     * Validate bookmap structure
     */
    private validateBookmap(
        content: string,
        errors: ValidationError[],
        warnings: ValidationError[],
        skipDtdChecks: boolean
    ): void {
        // Check for bookmap root element
        if (!content.includes('<bookmap')) {
            errors.push({
                line: 0,
                column: 0,
                severity: 'error',
                message: 'Bookmap must have a <bookmap> root element',
                source: 'dita-validator'
            });
        }

        // Skip title checks if DTD validation is active
        if (skipDtdChecks) {
            return;
        }

        if (!content.includes('<booktitle>')) {
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'Bookmap should contain a <booktitle> element',
                source: 'dita-validator'
            });
        }

        if (!content.includes('<mainbooktitle>')) {
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'Bookmap should contain a <mainbooktitle> element',
                source: 'dita-validator'
            });
        }
    }

    /**
     * Check for common DITA issues
     */
    private checkCommonIssues(content: string, warnings: ValidationError[]): void {
        // Check for empty elements that should have content
        const emptyElements = [
            '<title></title>',
            '<p></p>',
            '<shortdesc></shortdesc>'
        ];

        for (const element of emptyElements) {
            if (content.includes(element)) {
                const elementName = element.match(/<(\w+)>/)?.[1];
                warnings.push({
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: `Empty <${elementName}> element should be removed or filled with content`,
                    source: 'dita-validator'
                });
            }
        }

        // Check for missing closing tags (basic check)
        const openTags = content.match(/<(\w+)[^/>]*>/g) || [];
        const closeTags = content.match(/<\/(\w+)>/g) || [];

        if (openTags.length > closeTags.length + 5) { // Allow for self-closing tags
            warnings.push({
                line: 0,
                column: 0,
                severity: 'warning',
                message: 'Possible unclosed tags detected. Verify all elements are properly closed.',
                source: 'dita-validator'
            });
        }
    }
}
