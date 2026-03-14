/**
 * DITA-OT Error Code Catalog
 * Reference: https://www.dita-ot.org/dev/topics/error-messages
 *
 * Provides human-readable descriptions and module categorization
 * for DITA-OT error/warning/info codes.
 */

export interface DitaOtCodeInfo {
    /** Human-readable description template (with %1, %2 placeholders) */
    description: string;
    /** Module that produces this code */
    module: DitaOtModule;
}

export type DitaOtModule =
    | 'Core'        // DOTA — core transformation
    | 'Processing'  // DOTJ — Java/processing pipeline
    | 'Transform'   // DOTX — XSLT transforms
    | 'Indexing'    // INDX — index processing
    | 'PDF'         // PDFJ/PDFX — PDF-specific
    | 'XEP';        // XEPJ — XEP FO processor

/**
 * Catalog of known DITA-OT error codes.
 */
export const DITA_OT_ERROR_CODES: Record<string, DitaOtCodeInfo> = {
    // ── DOTA: Core Transformation ────────────────────────────
    'DOTA001F': { module: 'Core', description: 'Not a recognized transformation type' },
    'DOTA002F': { module: 'Core', description: 'Input not specified or wrong parameter used' },
    'DOTA003F': { module: 'Core', description: 'Cannot find user-specified XSLT stylesheet' },
    'DOTA004F': { module: 'Core', description: 'Invalid file name extension — only .dita and .xml supported' },
    'DOTA006W': { module: 'Core', description: 'Absolute paths not supported for CSSPATH' },
    'DOTA007E': { module: 'Core', description: 'Cannot find running-footer file' },
    'DOTA008E': { module: 'Core', description: 'Cannot find running-header file' },
    'DOTA009E': { module: 'Core', description: 'Cannot find specified heading file' },
    'DOTA011W': { module: 'Core', description: 'Deprecated argument' },
    'DOTA012W': { module: 'Core', description: 'Deprecated argument — use replacement' },
    'DOTA013F': { module: 'Core', description: 'Cannot find specified DITAVAL file' },
    'DOTA014W': { module: 'Core', description: 'Deprecated attribute — use replacement' },
    'DOTA015F': { module: 'Core', description: 'Internal property may not be set directly' },
    'DOTA066F': { module: 'Core', description: 'Cannot find XSLT stylesheet for XSL-FO' },
    'DOTA067W': { module: 'Core', description: 'Ignoring <index-see> inside parent index entry' },
    'DOTA068W': { module: 'Core', description: 'Ignoring <index-see-also> inside parent index entry' },
    'DOTA069F': { module: 'Core', description: 'Input resource cannot be located or read' },
    'DOTA069W': { module: 'Core', description: 'Deprecated target — remove references' },

    // ── DOTJ: Processing Pipeline ────────────────────────────
    'DOTJ005F': { module: 'Processing', description: 'Failed to create new instance' },
    'DOTJ007E': { module: 'Processing', description: 'Duplicate condition in DITAVAL filter file' },
    'DOTJ007I': { module: 'Processing', description: 'Duplicate condition in DITAVAL filter file' },
    'DOTJ007W': { module: 'Processing', description: 'Duplicate condition in DITAVAL filter file' },
    'DOTJ009E': { module: 'Processing', description: 'Cannot overwrite resource — name collision' },
    'DOTJ012F': { module: 'Processing', description: 'Failed to parse input resource' },
    'DOTJ013E': { module: 'Processing', description: 'Failed to parse referenced resource' },
    'DOTJ014W': { module: 'Processing', description: 'Empty <indexterm> found' },
    'DOTJ018I': { module: 'Processing', description: 'Log file written' },
    'DOTJ020W': { module: 'Processing', description: 'Missing required plug-in dependency' },
    'DOTJ021E': { module: 'Processing', description: 'No output generated — content filtered out' },
    'DOTJ021W': { module: 'Processing', description: 'No output generated — content filtered out' },
    'DOTJ022F': { module: 'Processing', description: 'Failed to parse — all content filtered out' },
    'DOTJ023E': { module: 'Processing', description: 'Image file not available' },
    'DOTJ025E': { module: 'Processing', description: 'Input to topic merge process not found' },
    'DOTJ026E': { module: 'Processing', description: 'Topic merge process did not generate output' },
    'DOTJ028E': { module: 'Processing', description: 'Missing @format attribute on reference' },
    'DOTJ029I': { module: 'Processing', description: 'No @domains attribute found' },
    'DOTJ030I': { module: 'Processing', description: 'No @class attribute found' },
    'DOTJ031I': { module: 'Processing', description: 'No rule found in DITAVAL file' },
    'DOTJ033E': { module: 'Processing', description: 'No valid content in referenced resource' },
    'DOTJ034F': { module: 'Processing', description: 'Content is not valid XML' },
    'DOTJ035F': { module: 'Processing', description: 'Resource is outside scope of input directory' },
    'DOTJ036W': { module: 'Processing', description: 'Resource is outside scope of input directory' },
    'DOTJ037W': { module: 'Processing', description: 'XML validation turned off — ensure @class attributes are included' },
    'DOTJ038E': { module: 'Processing', description: 'Element specialized from unrecognized metadata' },
    'DOTJ039E': { module: 'Processing', description: 'No target for conref push action' },
    'DOTJ040E': { module: 'Processing', description: 'Element uses pushreplace but no @conref defined' },
    'DOTJ041E': { module: 'Processing', description: 'Invalid @conref syntax' },
    'DOTJ042E': { module: 'Processing', description: 'Multiple conref push replace same target' },
    'DOTJ043W': { module: 'Processing', description: 'Conref push targets non-existent element' },
    'DOTJ044W': { module: 'Processing', description: 'Redundant conref push action' },
    'DOTJ045I': { module: 'Processing', description: 'Key defined more than once in same map' },
    'DOTJ046E': { module: 'Processing', description: 'Cannot resolve @conkeyref value' },
    'DOTJ047I': { module: 'Processing', description: 'Key definition not found in root scope' },
    'DOTJ048I': { module: 'Processing', description: 'Key not found in scope' },
    'DOTJ049W': { module: 'Processing', description: 'Attribute value does not comply with subject scheme' },
    'DOTJ050W': { module: 'Processing', description: '<index-see> references undefined term' },
    'DOTJ051E': { module: 'Processing', description: 'Unable to load coderef target' },
    'DOTJ052E': { module: 'Processing', description: 'Unsupported code reference charset' },
    'DOTJ053W': { module: 'Processing', description: 'Input resource is not a valid DITA filename' },
    'DOTJ054E': { module: 'Processing', description: 'Unable to parse invalid attribute value' },
    'DOTJ055E': { module: 'Processing', description: 'Invalid key name — invalid characters' },
    'DOTJ056E': { module: 'Processing', description: 'Invalid @xml:lang attribute value' },
    'DOTJ057E': { module: 'Processing', description: 'Duplicate @id value within topic' },
    'DOTJ058E': { module: 'Processing', description: 'Conflicting attributes on same element' },
    'DOTJ059E': { module: 'Processing', description: 'Invalid key scope name' },
    'DOTJ060W': { module: 'Processing', description: 'Key not bound to DITA topic or map' },
    'DOTJ061E': { module: 'Processing', description: 'Topic reference targets a map but @format not set' },
    'DOTJ062E': { module: 'Processing', description: 'Invalid attribute value' },
    'DOTJ063E': { module: 'Processing', description: 'Mismatch between @cols value and <colspec> count' },
    'DOTJ064W': { module: 'Processing', description: 'Conflicting @chunk values: to-content and by-topic' },
    'DOTJ065I': { module: 'Processing', description: 'Branch-filtered topic used more than once' },
    'DOTJ066E': { module: 'Processing', description: 'Missing @id attribute on topic element' },
    'DOTJ067E': { module: 'Processing', description: 'Missing @id attribute on topic element' },
    'DOTJ068E': { module: 'Processing', description: 'Conref action "mark" without target' },
    'DOTJ069E': { module: 'Processing', description: 'Circular key definition' },
    'DOTJ070I': { module: 'Processing', description: 'Invalid @class value on element' },
    'DOTJ071E': { module: 'Processing', description: 'Cannot find specified DITAVAL file' },
    'DOTJ072E': { module: 'Processing', description: 'Email link missing correct @format attribute' },
    'DOTJ073E': { module: 'Processing', description: 'Email link missing correct @scope attribute' },
    'DOTJ074W': { module: 'Processing', description: '@rev attribute cannot be used with <prop> filter' },
    'DOTJ075W': { module: 'Processing', description: 'Absolute link missing correct @scope attribute' },
    'DOTJ076W': { module: 'Processing', description: 'Absolute link missing correct @scope attribute' },
    'DOTJ077F': { module: 'Processing', description: 'Invalid @action attribute on DITAVAL property' },
    'DOTJ078F': { module: 'Processing', description: 'Input resource cannot be loaded' },
    'DOTJ079E': { module: 'Processing', description: 'Resource cannot be loaded' },
    'DOTJ080W': { module: 'Processing', description: 'Deprecated integrator configuration' },
    'DOTJ081W': { module: 'Processing', description: 'Empty @conref attribute ignored' },
    'DOTJ082E': { module: 'Processing', description: 'Processing table cell failed' },
    'DOTJ083E': { module: 'Processing', description: 'Resource capitalized differently on disk (case mismatch)' },
    'DOTJ084E': { module: 'Processing', description: 'Cannot read resource with specified character set' },
    'DOTJ085E': { module: 'Processing', description: 'Parameter cannot be set in project files' },
    'DOTJ086W': { module: 'Processing', description: 'Split @chunk on element not referencing a topic' },
    'DOTJ087W': { module: 'Processing', description: '@chunk inside combine chunk ignored' },
    'DOTJ088E': { module: 'Processing', description: 'XML parsing error' },

    // ── DOTX: XSLT Transform ─────────────────────────────────
    'DOTX001W': { module: 'Transform', description: 'Missing string for language — using default' },
    'DOTX002W': { module: 'Transform', description: '@title attribute required for Eclipse output' },
    'DOTX003I': { module: 'Transform', description: '@anchorref does not reference map or Eclipse TOC' },
    'DOTX004I': { module: 'Transform', description: '<navref> not referencing anything' },
    'DOTX005E': { module: 'Transform', description: 'Unable to find navigation title for reference' },
    'DOTX006E': { module: 'Transform', description: 'Unknown file extension in @href value' },
    'DOTX007I': { module: 'Transform', description: 'Only DITA, HTML, images supported in CHM — ignoring file' },
    'DOTX008E': { module: 'Transform', description: 'Resource cannot be loaded' },
    'DOTX008W': { module: 'Transform', description: 'Resource cannot be loaded — no navigation title' },
    'DOTX009W': { module: 'Transform', description: 'Cannot retrieve title from resource — using fallback' },
    'DOTX010E': { module: 'Transform', description: 'Unable to find @conref target' },
    'DOTX011W': { module: 'Transform', description: 'More than one target for @conref' },
    'DOTX012W': { module: 'Transform', description: '@domains of target must be equal or subset of current topic' },
    'DOTX013E': { module: 'Transform', description: 'Element with @conref indirectly includes itself (circular)' },
    'DOTX014E': { module: 'Transform', description: 'Invalid @conref syntax for map reference' },
    'DOTX015E': { module: 'Transform', description: 'Invalid @conref syntax' },
    'DOTX016W': { module: 'Transform', description: 'Appears to be DITA but @format is inherited incorrectly' },
    'DOTX017E': { module: 'Transform', description: 'Link with empty @href attribute' },
    'DOTX018I': { module: 'Transform', description: 'Topicref @type does not match referenced topic type' },
    'DOTX019W': { module: 'Transform', description: '@type does not match referenced topic type' },
    'DOTX020E': { module: 'Transform', description: 'Missing @navtitle for peer topic' },
    'DOTX021E': { module: 'Transform', description: 'Missing @navtitle for non-DITA resource' },
    'DOTX022W': { module: 'Transform', description: 'Unable to retrieve navigation title' },
    'DOTX023W': { module: 'Transform', description: 'Unable to retrieve navigation title from target' },
    'DOTX024E': { module: 'Transform', description: 'Missing linktext and navtitle for peer reference' },
    'DOTX025E': { module: 'Transform', description: 'Missing linktext and navtitle for reference' },
    'DOTX026W': { module: 'Transform', description: 'Unable to retrieve link text' },
    'DOTX027W': { module: 'Transform', description: 'Unable to retrieve link text from target' },
    'DOTX028E': { module: 'Transform', description: 'Link missing valid @href or @keyref attribute' },
    'DOTX029I': { module: 'Transform', description: 'Topicref @type does not match actual reference type' },
    'DOTX030W': { module: 'Transform', description: '@type does not match referenced type' },
    'DOTX031E': { module: 'Transform', description: 'Resource not available to resolve links' },
    'DOTX032E': { module: 'Transform', description: 'Unable to retrieve link text from target' },
    'DOTX033E': { module: 'Transform', description: 'Unable to generate link text for list item xref' },
    'DOTX034E': { module: 'Transform', description: 'Unable to generate link text for unordered list item xref' },
    'DOTX035E': { module: 'Transform', description: 'Unable to generate footnote number for xref' },
    'DOTX036E': { module: 'Transform', description: 'Unable to generate link text for dlentry xref' },
    'DOTX037W': { module: 'Transform', description: 'No title found — using fallback' },
    'DOTX038I': { module: 'Transform', description: 'Ignoring @longdescref' },
    'DOTX039W': { module: 'Transform', description: 'Required cleanup area found — build without DRAFT' },
    'DOTX040I': { module: 'Transform', description: 'Draft comment found — build without DRAFT to hide' },
    'DOTX041W': { module: 'Transform', description: 'Multiple <title> elements — using first' },
    'DOTX042I': { module: 'Transform', description: 'DITAVAL flagging not supported for inline phrases' },
    'DOTX043I': { module: 'Transform', description: 'Link may appear more than once in output' },
    'DOTX044E': { module: 'Transform', description: '<area> element does not specify link target' },
    'DOTX045W': { module: 'Transform', description: '<area> element should specify link text' },
    'DOTX046W': { module: 'Transform', description: 'Unrecognized area shape' },
    'DOTX047W': { module: 'Transform', description: 'Area coordinates are blank' },
    'DOTX048I': { module: 'Transform', description: 'Recompile CHM after making peer/external available' },
    'DOTX049I': { module: 'Transform', description: 'Non-DITA files ignored by PDF, ODT, RTF transforms' },
    'DOTX050W': { module: 'Transform', description: 'Default Eclipse plug-in ID used — specify custom @id' },
    'DOTX052W': { module: 'Transform', description: 'Missing string — using value as-is in output' },
    'DOTX053E': { module: 'Transform', description: 'Map indirectly includes itself — circular reference' },
    'DOTX054W': { module: 'Transform', description: 'Conflicting style from DITAVAL flagging' },
    'DOTX055W': { module: 'Transform', description: 'Custom stylesheet uses deprecated flagit template' },
    'DOTX056W': { module: 'Transform', description: 'Resource not available to resolve links' },
    'DOTX057W': { module: 'Transform', description: 'Link target cannot be found' },
    'DOTX058W': { module: 'Transform', description: 'No glossary entry for key' },
    'DOTX060W': { module: 'Transform', description: 'Key not associated with glossary entry' },
    'DOTX061W': { module: 'Transform', description: '@href has fragment but does not reference a topic' },
    'DOTX062I': { module: 'Transform', description: 'Conref processor cannot validate target constraints' },
    'DOTX063W': { module: 'Transform', description: 'Topic linked from content but not in <topicref> hierarchy' },
    'DOTX064W': { module: 'Transform', description: '@copy-to target already exists — ignoring' },
    'DOTX065W': { module: 'Transform', description: '@copy-to collision — two files use same target' },
    'DOTX066W': { module: 'Transform', description: 'Deprecated template — remove references' },
    'DOTX067E': { module: 'Transform', description: 'Missing string for language — add mapping' },
    'DOTX068W': { module: 'Transform', description: '<topicref> referencing map contains child <topicref>' },
    'DOTX069W': { module: 'Transform', description: 'Deprecated template mode' },
    'DOTX070W': { module: 'Transform', description: 'Deprecated target' },
    'DOTX071E': { module: 'Transform', description: 'Unable to find conref range end element' },
    'DOTX071W': { module: 'Transform', description: 'Deprecated parameter on template' },
    'DOTX072I': { module: 'Transform', description: 'Ignoring navtitle within topicgroup' },
    'DOTX073I': { module: 'Transform', description: 'Removing broken link' },
    'DOTX074W': { module: 'Transform', description: 'No formatting for unknown @class value' },
    'DOTX075W': { module: 'Transform', description: 'Conref in constrained type pulls from unconstrained source' },
    'DOTX076E': { module: 'Transform', description: 'Conref in constrained type violates constraints' },
    'DOTX077I': { module: 'Transform', description: 'Resolving conref results in duplicate ID' },

    // ── INDX: Index Processing ───────────────────────────────
    'INDX001I': { module: 'Indexing', description: 'Index entry sorted under Special characters' },
    'INDX002E': { module: 'Indexing', description: 'PDF indexing could not find sort location' },
    'INDX003E': { module: 'Indexing', description: 'Build failed due to PDF index sorting problems' },

    // ── PDFJ/PDFX: PDF Generation ───────────────────────────
    'PDFJ001E': { module: 'PDF', description: 'PDF indexing cannot find sort location' },
    'PDFJ002E': { module: 'PDF', description: 'Build failed due to PDF index sorting problems' },
    'PDFJ003I': { module: 'PDF', description: 'Index entry sorted under Special characters' },
    'PDFX001W': { module: 'PDF', description: 'Index range @start has no matching @end' },
    'PDFX002W': { module: 'PDF', description: 'Multiple @start but only one @end for index range' },
    'PDFX003W': { module: 'PDF', description: 'Multiple index entries close same range' },
    'PDFX004F': { module: 'PDF', description: 'Topic reference with empty @href' },
    'PDFX005F': { module: 'PDF', description: 'Topic reference cannot be found' },
    'PDFX007W': { module: 'PDF', description: 'Index @end found but no start term' },
    'PDFX008W': { module: 'PDF', description: 'Font definition not found' },
    'PDFX009E': { module: 'PDF', description: 'Attribute set reflection cannot handle element' },
    'PDFX011E': { module: 'PDF', description: 'Index term uses both <index-see> and another element' },
    'PDFX012E': { module: 'PDF', description: 'Table row has more entries than allowed' },
    'PDFX013F': { module: 'PDF', description: 'PDF file cannot be generated' },

    // ── XEPJ: XEP FO Processor ──────────────────────────────
    'XEPJ001W': { module: 'XEP', description: 'XEP processor warning' },
    'XEPJ002E': { module: 'XEP', description: 'XEP processor error' },
    'XEPJ003E': { module: 'XEP', description: 'XEP processor error' },
};

/**
 * Look up information for a DITA-OT error code.
 * Returns undefined for unknown codes.
 */
export function lookupErrorCode(code: string): DitaOtCodeInfo | undefined {
    return DITA_OT_ERROR_CODES[code];
}

/**
 * Get the module for a DITA-OT error code by prefix pattern.
 * Falls back to prefix detection when code is not in the catalog.
 */
export function getModuleForCode(code: string): DitaOtModule | undefined {
    const known = DITA_OT_ERROR_CODES[code];
    if (known) { return known.module; }

    // Fallback: detect module from prefix
    if (code.startsWith('DOTA')) { return 'Core'; }
    if (code.startsWith('DOTJ')) { return 'Processing'; }
    if (code.startsWith('DOTX')) { return 'Transform'; }
    if (code.startsWith('INDX')) { return 'Indexing'; }
    if (code.startsWith('PDFJ') || code.startsWith('PDFX')) { return 'PDF'; }
    if (code.startsWith('XEPJ')) { return 'XEP'; }
    return undefined;
}

