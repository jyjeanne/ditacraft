/**
 * Shared types for the DitaCraft MCP server.
 * Kept separate from server.ts to avoid importing the side-effect entry point.
 */
import { ValidationPipeline } from '../../server/src/services/validationPipeline';
import { KeySpaceService } from '../../server/src/services/keySpaceService';
import { CatalogValidationService } from '../../server/src/services/catalogValidationService';
import { SubjectSchemeService } from '../../server/src/services/subjectSchemeService';
import { DiagnosticsStore } from './diagnosticsStore';

export interface McpContext {
    workspaceRoot: string;
    extensionRoot: string;
    validationPipeline: ValidationPipeline;
    keySpaceService: KeySpaceService;
    catalogService: CatalogValidationService;
    subjectSchemeService: SubjectSchemeService;
    diagnosticsStore: DiagnosticsStore;
}
