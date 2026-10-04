/**
 * DITAVAL Rule Parsing (§4.5 Piece 2: condition highlighting)
 *
 * Lightweight regex-based parsing of `.ditaval` filter rules and matching
 * against an element's profiling attributes. Regex-based, matching this
 * codebase's established client-side XML handling convention (see
 * insertImageCommand.ts / fileCreationCommands.ts) rather than a full
 * parser — a `.ditaval` file's own well-formedness is already validated
 * elsewhere (contentModelValidation.ts); this module only needs to *read*
 * its `<prop>` rules, not validate them.
 *
 * Deliberately scoped to exact attribute/value matching only — it does not
 * resolve a subject scheme's controlled-value hierarchy (e.g. knowing that
 * `audience="internal"` is a child of `audience="restricted"` in a
 * `<subjectdef>` tree). That resolution already exists server-side
 * (`SubjectSchemeService`), and wiring a client-side decoration pass
 * through it is real future work, not something to fold into this pass —
 * see `docs/V0.9-IMPLEMENTATION-PLAN.md` §4.5 for the tracked scope note.
 */

/** A single `<prop>` rule parsed out of a `.ditaval` file. */
export interface DitavalRule {
    action: string;
    att?: string;
    val?: string;
}

/**
 * Profiling attributes DITAVAL `<prop>` rules can target. Mirrors the
 * standard DITA profiling attribute set; `otherprops`/`props` are the two
 * legacy/generic ones, the rest are the well-known specific attributes.
 *
 * `/code-review` fix: this list had drifted from the two sibling lists
 * elsewhere in the codebase — `profilingValidation.ts`'s server-side
 * `PROFILING_ATTRIBUTES` and `batchMetadataCommand.ts`'s
 * `KNOWN_PROFILING_ATTRIBUTES` both include `deliveryTarget` (a DITA 1.3+
 * profiling attribute), which this list omitted, so the Visual DITAVAL
 * Condition Editor's dropdown and condition-highlighting decoration pass
 * never offered or dimmed `deliveryTarget`-based conditions. This list is
 * intentionally a *superset* of those two, not an exact copy: `rev`
 * (revision marking) is a real, DITAVAL-filterable attribute those other
 * two lists correctly exclude, since `rev` values are typically free-form
 * and not subject-scheme-controlled — the property those lists actually
 * track (see `profilingValidation.ts`'s own comment: "attributes that can
 * be constrained by subject schemes").
 */
export const PROFILING_ATTRIBUTES = ['audience', 'platform', 'product', 'otherprops', 'props', 'rev', 'deliveryTarget'] as const;

/**
 * The attributes DITA filters content on — the conditional processing
 * attributes (lower case): a `.ditaval` file's filter-wide default rule applies
 * to them. `@rev` is not one (DITA uses it for flagging). Specializations of
 * `@props` other than `deliveryTarget` are named by the document type (its
 * `@domains`); callers that know them pass them to `isExcludedByRules`.
 */
export const FILTERING_ATTRIBUTES = ['audience', 'platform', 'product', 'otherprops', 'props', 'deliverytarget'] as const;

export function isFilteringAttribute(lowerCaseName: string): boolean {
    return (FILTERING_ATTRIBUTES as readonly string[]).includes(lowerCaseName);
}

const PROP_TAG_PATTERN =/<prop\b((?:[^>"']|"[^"]*"|'[^']*')*)\/?>/gi;
const ATTR_PATTERN = /([\w-]+)\s*=\s*"([^"]*)"|([\w-]+)\s*=\s*'([^']*)'/g;

/** Parse every attribute name/value pair out of a tag's raw attribute text. */
function parseAttributes(attrsText: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    ATTR_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ATTR_PATTERN.exec(attrsText)) !== null) {
        const name = (match[1] ?? match[3]).toLowerCase();
        const value = match[2] ?? match[4];
        attrs[name] = value;
    }
    return attrs;
}

/**
 * Parse every `<prop action="..." att="..." val="...">` rule out of a
 * `.ditaval` file's content. Rules missing `action` are skipped — they
 * can't drive an exclude/include decision.
 */
export function parseDitavalRules(content: string): DitavalRule[] {
    const rules: DitavalRule[] = [];
    PROP_TAG_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PROP_TAG_PATTERN.exec(content)) !== null) {
        const attrs = parseAttributes(match[1]);
        if (!attrs.action) {
            continue;
        }
        rules.push({
            action: attrs.action.toLowerCase(),
            att: attrs.att?.toLowerCase(),
            val: attrs.val
        });
    }
    return rules;
}

/**
 * Regenerate a complete `.ditaval` document from a flat list of rules —
 * used by the Visual DITAVAL Condition Editor (§5.3) to write back a
 * toggled condition set.
 *
 * This REPLACES the file's entire `<val>` content. Anything the editor
 * doesn't model as a `DitavalRule` — comments, `<style-conflict>` blocks,
 * or any element other than `<prop>` — is not preserved; a value-less
 * "default for this attribute" rule (`att` set, `val` omitted) IS
 * preserved as long as it's included in `rules`, since the editor keeps
 * those alongside the value-specific rules it edits rather than dropping
 * them (see `ditavalConditionEditorPanel.ts`). This is a documented,
 * deliberate v1 scope limit — the editor surfaces a warning about it
 * before the first edit rather than silently discarding content.
 */
export function buildDitavalDocument(rules: readonly DitavalRule[]): string {
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<val>'];
    for (const rule of rules) {
        const parts = [`action="${escapeDitavalAttr(rule.action)}"`];
        if (rule.att) {
            parts.push(`att="${escapeDitavalAttr(rule.att)}"`);
        }
        if (rule.val !== undefined) {
            parts.push(`val="${escapeDitavalAttr(rule.val)}"`);
        }
        lines.push(`    <prop ${parts.join(' ')}/>`);
    }
    lines.push('</val>');
    return lines.join('\n') + '\n';
}

function escapeDitavalAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * True if a filtered publish would exclude an element with these attributes,
 * by DITA's filtering logic (DITA 1.3, "Filtering logic"): each attribute is
 * evaluated on its own — it excludes the element only when **every** one of
 * its values is excluded (profiling attributes are space-separated value
 * lists: `audience="internal external"` stays when only `internal` is
 * excluded) — and the element is excluded when any one attribute excludes
 * it. An attribute without values excludes nothing.
 *
 * A value's action is that of the rule for its attribute and value, else of
 * the attribute's `val`-less default rule (`<prop action="exclude"
 * att="platform"/>`), else of the filter-wide default rule (`<prop
 * action="exclude"/>`, no `att` and no `val`), else include — whatever their
 * order in the file (the standard "exclude by default, selectively include"
 * pattern works at both levels). Only `exclude` removes content:
 * `include`/`flag`/`passthrough` keep it.
 *
 * The filter-wide default applies to the filtering attributes only
 * (`isFiltering`: by default `FILTERING_ATTRIBUTES` — not `@rev`, which DITA
 * uses for flagging, nor `@id`, `@outputclass`… when a caller passes an
 * element's every attribute); a rule naming another attribute still applies to
 * it. Attribute names compare case-insensitively (`parseDitavalRules` lowers a
 * rule's `att`; elements carry `deliveryTarget`).
 */
export function isExcludedByRules(attrs: Record<string, string | undefined>, rules: readonly DitavalRule[],
    isFiltering: (lowerCaseName: string) => boolean = isFilteringAttribute): boolean {
    for (const [attName, rawValue] of Object.entries(attrs)) {
        if (rawValue === undefined) {
            continue;
        }
        const name = attName.toLowerCase();
        const tokens = rawValue.split(/\s+/).filter(t => t.length > 0);
        if (tokens.length > 0 && tokens.every(token => governingRule(name, token, rules, isFiltering)?.action === 'exclude')) {
            return true;
        }
    }
    return false;
}

/**
 * The rule that decides what happens to one value of an attribute (lower-case
 * name): the rule for that attribute and value, else the attribute's
 * `val`-less default rule, else — for a filtering attribute — the filter-wide
 * default rule (the first `<prop>` without `att` and `val`); undefined when
 * none does (the value is included, unflagged). Shared by exclusion and the
 * preview's flags, so both read a `.ditaval` file the same way.
 */
export function governingRule(lowerCaseName: string, token: string, rules: readonly DitavalRule[],
    isFiltering: (lowerCaseName: string) => boolean = isFilteringAttribute): DitavalRule | undefined {
    const attRules = rules.filter(r => r.att === lowerCaseName);
    return attRules.find(r => r.val === token)
        ?? attRules.find(r => r.val === undefined)
        ?? (isFiltering(lowerCaseName) ? rules.find(r => r.att === undefined && r.val === undefined) : undefined);
}
