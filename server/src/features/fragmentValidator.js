"use strict";
/**
 * Handler for `dita/validateFragment` LSP request.
 *
 * Validates an XML DITA fragment in-memory without requiring a real file on disk.
 * Wraps the fragment in a minimal valid document if needed, then runs the
 * fast structural validation phases of the ValidationPipeline.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidateFragment = handleValidateFragment;
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const node_1 = require("vscode-languageserver/node");
const settings_1 = require("../settings");
// ── Helper — wrap bare elements so the parser gets a rooted document ───────
function wrapFragment(fragment, fragmentType) {
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
                `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">\n${trimmed}`;
        default:
            return trimmed;
    }
}
// ── Handler ────────────────────────────────────────────────────────────────
async function handleValidateFragment(params, pipeline) {
    const wrapped = wrapFragment(params.fragment, params.fragmentType);
    // Determine language ID for TextDocument
    const ext = params.contextUri.split('.').pop()?.toLowerCase() ?? 'dita';
    const langId = ext === 'ditamap' ? 'ditamap' : ext === 'bookmap' ? 'bookmap' : 'dita';
    // Use a synthetic URI so the server doesn't touch the file system
    const syntheticUri = `ditacraft-fragment:///fragment.${langId}`;
    const doc = vscode_languageserver_textdocument_1.TextDocument.create(syntheticUri, langId, 0, wrapped);
    const settings = (0, settings_1.getGlobalSettings)();
    // For fragment validation, skip heavy workspace-level phases
    const lightSettings = {
        ...settings,
        crossRefValidationEnabled: false,
        subjectSchemeValidationEnabled: false,
    };
    let diagnostics;
    try {
        diagnostics = await pipeline.validate(doc, lightSettings, undefined, // no key space service for fragments
        { rootIdIndex: new Map(), unusedTopicPaths: new Set() });
    }
    catch {
        return {
            isValid: false,
            diagnostics: [],
            suggestions: ['Internal validation error — check that the fragment is well-formed XML.'],
        };
    }
    const errors = diagnostics.filter(d => d.severity === node_1.DiagnosticSeverity.Error);
    const suggestions = errors.slice(0, 3).map(d => typeof d.message === 'string' ? d.message : String(d.message));
    return {
        isValid: errors.length === 0,
        diagnostics,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
}
//# sourceMappingURL=fragmentValidator.js.map