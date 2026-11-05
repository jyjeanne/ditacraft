/**
 * Shared types for the DitaCraft MCP server.
 * Kept separate from server.ts to avoid importing the side-effect entry point.
 */
import { ValidationPipeline } from '../../server/src/services/validationPipeline';
import { KeySpaceService } from '../../server/src/services/keySpaceService';
import { CatalogValidationService } from '../../server/src/services/catalogValidationService';
import { SubjectSchemeService } from '../../server/src/services/subjectSchemeService';
import { DiagnosticsStore } from './diagnosticsStore';
import { DitaCraftSettings } from '../../server/src/settings';

export interface McpContext {
    /** Absolute path of the workspace (WORKSPACE, resolved at startup). */
    workspaceRoot: string;
    extensionRoot: string;
    /** Validation settings: defaults, the workspace's settings file, environment (see mcpSettings.ts). */
    settings: DitaCraftSettings;
    validationPipeline: ValidationPipeline;
    keySpaceService: KeySpaceService;
    catalogService: CatalogValidationService;
    subjectSchemeService: SubjectSchemeService;
    diagnosticsStore: DiagnosticsStore;
}
