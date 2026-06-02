"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEYREF_ELEMENTS = exports.MAP_TYPE_NAMES = exports.TOPIC_TYPE_NAMES = exports.SUBJECTSCHEME_DEFAULTSUBJECT = exports.SUBJECTSCHEME_ATTRIBUTEDEF = exports.SUBJECTSCHEME_ELEMENTDEF = exports.SUBJECTSCHEME_ENUMERATIONDEF = exports.SUBJECTSCHEME_SUBJECTDEF = exports.MAPGROUP_KEYDEF = exports.MAPGROUP_TOPICHEAD = exports.MAP_RELCOLSPEC = exports.MAP_RELTABLE = exports.MAP_TOPICMETA = exports.MAP_TOPICREF = exports.MAP_MAP = exports.TOPIC_FIG = exports.TOPIC_OBJECT = exports.TOPIC_REQUIRED_CLEANUP = exports.TOPIC_INDEXTERMREF = exports.TOPIC_BOOLEAN = exports.TOPIC_PRE = exports.TOPIC_NOTE = exports.TOPIC_LINK = exports.TOPIC_XREF = exports.TOPIC_IMAGE = exports.TOPIC_NAVTITLE = exports.TOPIC_KEYWORD = exports.TOPIC_KEYWORDS = exports.TOPIC_SECTION = exports.TOPIC_BODY = exports.TOPIC_ABSTRACT = exports.TOPIC_SHORTDESC = exports.TOPIC_TITLE = exports.TOPIC_TOPIC = void 0;
exports.createClassMatcher = createClassMatcher;
exports.matchesDitaClass = matchesDitaClass;
exports.isLocalDita = isLocalDita;
/**
 * Create a class matcher from a DITA class token.
 * The token format is " module/element " with surrounding spaces.
 *
 * @example
 * createClassMatcher(' topic/topic ')  // matches <topic>, <concept>, <task>, etc.
 * createClassMatcher(' topic/xref ')   // matches <xref> and specializations
 */
function createClassMatcher(classToken) {
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
function matchesDitaClass(classAttrValue, elementName, matcher) {
    if (classAttrValue != null) {
        return classAttrValue.includes(matcher.classToken);
    }
    return elementName === matcher.localName;
}
// --- Pre-built matchers ---
// Topic domain
exports.TOPIC_TOPIC = createClassMatcher(' topic/topic ');
exports.TOPIC_TITLE = createClassMatcher(' topic/title ');
exports.TOPIC_SHORTDESC = createClassMatcher(' topic/shortdesc ');
exports.TOPIC_ABSTRACT = createClassMatcher(' topic/abstract ');
exports.TOPIC_BODY = createClassMatcher(' topic/body ');
exports.TOPIC_SECTION = createClassMatcher(' topic/section ');
exports.TOPIC_KEYWORDS = createClassMatcher(' topic/keywords ');
exports.TOPIC_KEYWORD = createClassMatcher(' topic/keyword ');
exports.TOPIC_NAVTITLE = createClassMatcher(' topic/navtitle ');
exports.TOPIC_IMAGE = createClassMatcher(' topic/image ');
exports.TOPIC_XREF = createClassMatcher(' topic/xref ');
exports.TOPIC_LINK = createClassMatcher(' topic/link ');
exports.TOPIC_NOTE = createClassMatcher(' topic/note ');
exports.TOPIC_PRE = createClassMatcher(' topic/pre ');
exports.TOPIC_BOOLEAN = createClassMatcher(' topic/boolean ');
exports.TOPIC_INDEXTERMREF = createClassMatcher(' topic/indextermref ');
exports.TOPIC_REQUIRED_CLEANUP = createClassMatcher(' topic/required-cleanup ');
exports.TOPIC_OBJECT = createClassMatcher(' topic/object ');
exports.TOPIC_FIG = createClassMatcher(' topic/fig ');
// Map domain
exports.MAP_MAP = createClassMatcher(' map/map ');
exports.MAP_TOPICREF = createClassMatcher(' map/topicref ');
exports.MAP_TOPICMETA = createClassMatcher(' map/topicmeta ');
exports.MAP_RELTABLE = createClassMatcher(' map/reltable ');
exports.MAP_RELCOLSPEC = createClassMatcher(' map/relcolspec ');
// Map group domain
exports.MAPGROUP_TOPICHEAD = createClassMatcher(' mapgroup-d/topichead ');
exports.MAPGROUP_KEYDEF = createClassMatcher(' mapgroup-d/keydef ');
// Subject scheme domain
exports.SUBJECTSCHEME_SUBJECTDEF = createClassMatcher(' subjectScheme/subjectdef ');
exports.SUBJECTSCHEME_ENUMERATIONDEF = createClassMatcher(' subjectScheme/enumerationdef ');
exports.SUBJECTSCHEME_ELEMENTDEF = createClassMatcher(' subjectScheme/elementdef ');
exports.SUBJECTSCHEME_ATTRIBUTEDEF = createClassMatcher(' subjectScheme/attributedef ');
exports.SUBJECTSCHEME_DEFAULTSUBJECT = createClassMatcher(' subjectScheme/defaultsubject ');
// --- Utility functions ---
/**
 * Check if an element represents a "local DITA" reference.
 * Returns true if scope is NOT "external" AND format is either absent or "dita".
 *
 * @param scopeAttr - the value of the @scope attribute (or null)
 * @param formatAttr - the value of the @format attribute (or null)
 */
function isLocalDita(scopeAttr, formatAttr) {
    if (scopeAttr === 'external')
        return false;
    if (formatAttr != null && formatAttr !== 'dita')
        return false;
    return true;
}
/**
 * Set of element names that are DITA topic types (including specializations).
 * Used for quick name-based checks when @class is not available.
 */
exports.TOPIC_TYPE_NAMES = new Set([
    'topic', 'concept', 'task', 'reference',
    'glossentry', 'glossgroup', 'troubleshooting',
    'learningOverview', 'learningContent', 'learningSummary',
    'learningAssessment', 'learningPlan',
]);
/**
 * Set of element names that are DITA map types.
 */
exports.MAP_TYPE_NAMES = new Set([
    'map', 'bookmap', 'subjectScheme',
]);
/**
 * Set of element names that carry key-like reference attributes.
 */
exports.KEYREF_ELEMENTS = new Set([
    'topicref', 'keydef', 'mapref', 'chapter', 'appendix', 'part',
    'glossref', 'topichead', 'topicgroup', 'anchorref',
]);
//# sourceMappingURL=ditaSpecialization.js.map