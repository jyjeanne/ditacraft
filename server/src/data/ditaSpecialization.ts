/**
 * DITA specialization-aware element matching utilities.
 *
 * Uses the DITA @class attribute to match elements regardless of
 * specialization hierarchy. For example, <concept> matches " topic/topic "
 * because its @class value contains that token.
 *
 * When @class is not available (e.g., regex-based text scanning), falls
 * back to matching by element local name.
 */

// --- Core matching types ---

/** A matcher for DITA elements based on their @class attribute. */
export interface DitaClassMatcher {
    /** The DITA class token to match, e.g., " topic/topic " (with surrounding spaces). */
    classToken: string;
    /** The element local name extracted from the class token, e.g., "topic". */
    localName: string;
}

/**
 * Create a class matcher from a DITA class token.
 * The token format is " module/element " with surrounding spaces.
 *
 * @example
 * createClassMatcher(' topic/topic ')  // matches <topic>, <concept>, <task>, etc.
 * createClassMatcher(' topic/xref ')   // matches <xref> and specializations
 */
export function createClassMatcher(classToken: string): DitaClassMatcher {
    const parts = classToken.split('/');
    const localName = (parts[1] ?? parts[0]).trim();
    return { classToken, localName };
}

/**
 * Check if an element matches a DITA class matcher.
 *
 * When `classAttrValue` is provided (the @class attribute), uses substring
 * matching — this correctly handles all DITA specializations.
 * When `classAttrValue` is null/undefined, falls back to element name matching.
 *
 * @param classAttrValue - the value of the element's @class attribute (or null)
 * @param elementName - the element's local name (used as fallback)
 * @param matcher - the class matcher to test against
 */
export function matchesDitaClass(
    classAttrValue: string | null | undefined,
    elementName: string,
    matcher: DitaClassMatcher
): boolean {
    if (classAttrValue != null) {
        return classAttrValue.includes(matcher.classToken);
    }
    return elementName === matcher.localName;
}

// --- Pre-built matchers ---

// Topic domain
export const TOPIC_TOPIC = createClassMatcher(' topic/topic ');
export const TOPIC_TITLE = createClassMatcher(' topic/title ');
export const TOPIC_SHORTDESC = createClassMatcher(' topic/shortdesc ');
export const TOPIC_ABSTRACT = createClassMatcher(' topic/abstract ');
export const TOPIC_BODY = createClassMatcher(' topic/body ');
export const TOPIC_SECTION = createClassMatcher(' topic/section ');
export const TOPIC_KEYWORDS = createClassMatcher(' topic/keywords ');
export const TOPIC_KEYWORD = createClassMatcher(' topic/keyword ');
export const TOPIC_NAVTITLE = createClassMatcher(' topic/navtitle ');
export const TOPIC_IMAGE = createClassMatcher(' topic/image ');
export const TOPIC_XREF = createClassMatcher(' topic/xref ');
export const TOPIC_LINK = createClassMatcher(' topic/link ');
export const TOPIC_NOTE = createClassMatcher(' topic/note ');
export const TOPIC_PRE = createClassMatcher(' topic/pre ');
export const TOPIC_BOOLEAN = createClassMatcher(' topic/boolean ');
export const TOPIC_INDEXTERMREF = createClassMatcher(' topic/indextermref ');
export const TOPIC_REQUIRED_CLEANUP = createClassMatcher(' topic/required-cleanup ');
export const TOPIC_OBJECT = createClassMatcher(' topic/object ');
export const TOPIC_FIG = createClassMatcher(' topic/fig ');

// Map domain
export const MAP_MAP = createClassMatcher(' map/map ');
export const MAP_TOPICREF = createClassMatcher(' map/topicref ');
export const MAP_TOPICMETA = createClassMatcher(' map/topicmeta ');
export const MAP_RELTABLE = createClassMatcher(' map/reltable ');
export const MAP_RELCOLSPEC = createClassMatcher(' map/relcolspec ');

// Map group domain
export const MAPGROUP_TOPICHEAD = createClassMatcher(' mapgroup-d/topichead ');
export const MAPGROUP_KEYDEF = createClassMatcher(' mapgroup-d/keydef ');

// Subject scheme domain
export const SUBJECTSCHEME_SUBJECTDEF = createClassMatcher(' subjectScheme/subjectdef ');
export const SUBJECTSCHEME_ENUMERATIONDEF = createClassMatcher(' subjectScheme/enumerationdef ');
export const SUBJECTSCHEME_ELEMENTDEF = createClassMatcher(' subjectScheme/elementdef ');
export const SUBJECTSCHEME_ATTRIBUTEDEF = createClassMatcher(' subjectScheme/attributedef ');
export const SUBJECTSCHEME_DEFAULTSUBJECT = createClassMatcher(' subjectScheme/defaultsubject ');

// --- Utility functions ---

/**
 * Check if an element represents a "local DITA" reference.
 * Returns true if scope is NOT "external" AND format is either absent or "dita".
 *
 * @param scopeAttr - the value of the @scope attribute (or null)
 * @param formatAttr - the value of the @format attribute (or null)
 */
export function isLocalDita(
    scopeAttr: string | null | undefined,
    formatAttr: string | null | undefined
): boolean {
    if (scopeAttr === 'external') return false;
    if (formatAttr != null && formatAttr !== 'dita') return false;
    return true;
}

/**
 * Set of element names that are DITA topic types (including specializations).
 * Used for quick name-based checks when @class is not available.
 */
export const TOPIC_TYPE_NAMES: ReadonlySet<string> = new Set([
    'topic', 'concept', 'task', 'reference',
    'glossentry', 'glossgroup', 'troubleshooting',
    'learningOverview', 'learningContent', 'learningSummary',
    'learningAssessment', 'learningPlan',
]);

/**
 * Set of element names that are DITA map types.
 */
export const MAP_TYPE_NAMES: ReadonlySet<string> = new Set([
    'map', 'bookmap', 'subjectScheme', 'learningMap', 'learningBookmap',
]);

/**
 * Set of element names that carry key-like reference attributes.
 */
export const KEYREF_ELEMENTS: ReadonlySet<string> = new Set([
    'topicref', 'keydef', 'mapref', 'chapter', 'appendix', 'part',
    'glossref', 'topichead', 'topicgroup', 'anchorref',
]);
