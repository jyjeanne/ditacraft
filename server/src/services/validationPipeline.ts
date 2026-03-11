/**
 * Validation Pipeline.
 * Orchestrates all DITA validation phases in a single place,
 * extracted from the monolithic diagnostic handler in server.ts.
 */

import { Diagnostic } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';

import { DitaCraftSettings } from '../settings';
import { normalizeFsPath } from '../utils/textUtils';
import { validateDITADocument } from '../features/validation';
import { validateCrossReferences } from '../features/crossRefValidation';
import { validateDitaRules } from '../features/ditaRulesValidator';
import { validateProfilingAttributes } from '../features/profilingValidation';
import { detectCircularReferences } from '../features/circularRefDetection';
import { detectCrossFileDuplicateIds, createUnusedTopicDiagnostic } from '../features/workspaceValidation';
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

/**
 * Orchestrates all DITA validation phases for a single document.
 */
export class ValidationPipeline {
    private readonly log: (msg: string) => void;

    constructor(
        private readonly catalogValidation: CatalogValidationService,
        private readonly rngValidation: RngValidationService,
        private readonly subjectSchemeService: SubjectSchemeService,
        log?: (msg: string) => void,
    ) {
        this.log = log ?? (() => {});
    }

    /**
     * Run all validation phases and return collected diagnostics.
     * Each phase is isolated so a failure in one doesn't discard results from others.
     */
    async validate(
        document: TextDocument,
        settings: DitaCraftSettings,
        keySpaceService: KeySpaceService | undefined,
        workspace: WorkspaceContext,
    ): Promise<Diagnostic[]> {
        const text = document.getText();
        const uri = document.uri;
        const filePath = URI.parse(uri).fsPath;
        const diagnostics: Diagnostic[] = [];

        // Phase 1-3: XML well-formedness, DITA structure, ID validation
        try {
            diagnostics.push(...validateDITADocument(document, settings));
        } catch (e) { this.log(`[validation] base validation failed: ${e}`); }

        // Schema validation: DTD or RNG (mutually exclusive)
        const useRng = this.rngValidation.isAvailable && settings.schemaFormat === 'rng';

        if (!useRng && this.catalogValidation.isAvailable && settings.validationEngine === 'typesxml') {
            try {
                const existingErrorLines = new Set(
                    diagnostics
                        .filter(d => d.code === 'DITA-XML-001')
                        .map(d => d.range.start.line)
                );
                for (const diag of this.catalogValidation.validate(text)) {
                    if (!existingErrorLines.has(diag.range.start.line)) {
                        diagnostics.push(diag);
                    }
                }
            } catch (e) { this.log(`[validation] DTD validation failed: ${e}`); }
        }

        if (useRng) {
            try {
                if (settings.rngSchemaPath) {
                    this.rngValidation.setSchemaBasePath(settings.rngSchemaPath);
                }
                diagnostics.push(...await this.rngValidation.validate(text));
            } catch (e) { this.log(`[validation] RNG validation failed: ${e}`); }
        }

        // Cross-reference validation
        if (settings.crossRefValidationEnabled !== false) {
            try {
                diagnostics.push(...await validateCrossReferences(
                    text, uri, keySpaceService, settings.maxNumberOfProblems
                ));
            } catch (e) { this.log(`[validation] cross-ref validation failed: ${e}`); }
        }

        // Register subject scheme maps
        if (keySpaceService) {
            try {
                const schemePaths = await keySpaceService.getSubjectSchemePaths(filePath);
                this.subjectSchemeService.registerSchemes(schemePaths);
            } catch (e) { this.log(`[validation] subject scheme registration failed: ${e}`); }
        }

        // Profiling attribute validation
        if (settings.subjectSchemeValidationEnabled !== false) {
            try {
                diagnostics.push(...validateProfilingAttributes(
                    text, this.subjectSchemeService, settings.maxNumberOfProblems
                ));
            } catch (e) { this.log(`[validation] profiling validation failed: ${e}`); }
        }

        // Schematron-equivalent DITA rules
        if (settings.ditaRulesEnabled !== false) {
            try {
                const ditaVersion = settings.ditaVersion && settings.ditaVersion !== 'auto'
                    ? settings.ditaVersion
                    : detectDitaVersion(text);
                diagnostics.push(...validateDitaRules(text, {
                    enabled: true,
                    categories: settings.ditaRulesCategories ?? ['mandatory', 'recommendation', 'authoring', 'accessibility'],
                    ditaVersion,
                }));
            } catch (e) { this.log(`[validation] DITA rules failed: ${e}`); }
        }

        // Circular reference detection
        if (settings.crossRefValidationEnabled !== false) {
            try {
                diagnostics.push(...await detectCircularReferences(text, uri));
            } catch (e) { this.log(`[validation] circular ref detection failed: ${e}`); }
        }

        // Workspace-level checks
        try {
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

        // Cap total diagnostics
        const maxProblems = settings.maxNumberOfProblems ?? 100;
        return diagnostics.length > maxProblems
            ? diagnostics.slice(0, maxProblems)
            : diagnostics;
    }
}
