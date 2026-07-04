/**
 * Handler for `dita/validateFragment` LSP request.
 *
 * Validates an XML DITA fragment in-memory without requiring a real file on disk.
 * Wraps the fragment in a minimal valid document if needed, then runs the
 * fast structural validation phases of the ValidationPipeline.
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { ValidationPipeline } from '../services/validationPipeline';
import { getDocumentSettings } from '../settings';

// ── Request / Response types (mirrored on the client) ─────────────────────

export interface ValidateFragmentParams {
    /** The XML string to validate. */
    fragment: string;
    /** URI of the parent document — used for namespace / DOCTYPE inference. */
    contextUri: string;
    fragmentType: 'map' | 'topic' | 'topicref' | 'element';
}

export interface FragmentValidationResult {
    isValid: boolean;
    diagnostics: Diagnostic[];
    /** Simple one-line corrections suggested by the structural check. */
    suggestions?: string[];
}

// ── Helper — wrap bare elements so the parser gets a rooted document ───────

function wrapFragment(fragment: string, fragmentType: ValidateFragmentParams['fragmentType']): string {
    const trimmed = fragment.trim();

    // If it already starts with an XML declaration or known DITA root, use as-is
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<map') || trimmed.startsWith('<topic')
        || trimmed.startsWith('<concept') || trimmed.startsWith('<task')
        || trimmed.startsWith('<reference') || trimmed.startsWith('<bookmap')) {
        return trimmed;
    }

    switch (fragmentType) {
        case 'topicref':
            return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">\n<map>\n${trimmed}\n</map>`;
        case 'element':
            return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n<topic id="_frag">\n<title>Fragment</title>\n<body>\n${trimmed}\n</body>\n</topic>`;
        case 'map':
            return trimmed.startsWith('<map') ? trimmed :
                `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">\n<map>\n${trimmed}\n</map>`;
        default:
            return trimmed;
    }
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function handleValidateFragment(
    params: ValidateFragmentParams,
    pipeline: ValidationPipeline
): Promise<FragmentValidationResult> {
    const wrapped = wrapFragment(params.fragment, params.fragmentType);

    // Determine language ID for TextDocument
    const ext = params.contextUri.split('.').pop()?.toLowerCase() ?? 'dita';
    const langId = ext === 'ditamap' ? 'ditamap' : ext === 'bookmap' ? 'bookmap' : 'dita';

    // Use a synthetic URI so the server doesn't touch the file system
    const syntheticUri = `ditacraft-fragment:///fragment.${langId}`;
    const doc = TextDocument.create(syntheticUri, langId, 0, wrapped);

    // Use the real parent document's settings (respects per-scope config from the
    // client) instead of the module-level global, which only gets populated when
    // the client lacks configuration-pull capability and otherwise stays at
    // hardcoded defaults for the whole session.
    const settings = await getDocumentSettings(params.contextUri);
    // For fragment validation, skip heavy workspace-level phases
    const lightSettings = {
        ...settings,
        crossRefValidationEnabled: false,
        subjectSchemeValidationEnabled: false,
    };

    let diagnostics: Diagnostic[];
    try {
        diagnostics = await pipeline.validate(
            doc,
            lightSettings,
            undefined,   // no key space service for fragments
            { rootIdIndex: new Map(), unusedTopicPaths: new Set() }
        );
    } catch {
        return {
            isValid: false,
            diagnostics: [],
            suggestions: ['Internal validation error — check that the fragment is well-formed XML.'],
        };
    }

    const errors = diagnostics.filter(d => d.severity === DiagnosticSeverity.Error);
    const suggestions = errors.slice(0, 3).map(d =>
        typeof d.message === 'string' ? d.message : String(d.message)
    );

    return {
        isValid: errors.length === 0,
        diagnostics,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
}
